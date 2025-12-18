#!/bin/bash
# DAP Release Manager
# Comprehensive release management with rollback support
#
# Usage:
#   ./release-manager.sh deploy <release-package.tar.gz>  # Deploy release
#   ./release-manager.sh patch                            # Quick patch deployment
#   ./release-manager.sh rollback                         # Rollback to previous version
#   ./release-manager.sh status                           # Check deployment status
#   ./release-manager.sh verify                           # Verify current deployment

set -e

# Configuration
PROD_SERVER="centos2.rajarora.csslab"
PROD_USER="rajarora"
PROD_PATH="/data/dap"
BACKUP_DIR="/data/dap/backups/releases"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create release snapshot on production
create_release_snapshot() {
    log_info "Creating release snapshot on production..."
    
    ssh ${PROD_USER}@${PROD_SERVER} << ENDSSH
set -e

SNAPSHOT_DIR="${BACKUP_DIR}/${TIMESTAMP}"
sudo mkdir -p "\${SNAPSHOT_DIR}"
sudo chown -R ${PROD_USER}:${PROD_USER} "\${SNAPSHOT_DIR}"

# Backup database
echo "[INFO] Creating database backup..."
sudo -u postgres pg_dump -d dap --no-owner > "\${SNAPSHOT_DIR}/database.sql"

# Exclude passwords from backup
sed -i '/INSERT INTO "User".*password/d' "\${SNAPSHOT_DIR}/database.sql"
echo "-- Passwords excluded from backup for security" >> "\${SNAPSHOT_DIR}/database.sql"

# Backup backend
echo "[INFO] Backing up backend..."
sudo tar czf "\${SNAPSHOT_DIR}/backend.tar.gz" -C ${PROD_PATH}/app/backend .

# Backup frontend
echo "[INFO] Backing up frontend..."
sudo tar czf "\${SNAPSHOT_DIR}/frontend.tar.gz" -C ${PROD_PATH}/app/frontend/dist .

# Save current versions
sudo -u dap pm2 list | grep dap > "\${SNAPSHOT_DIR}/pm2-status.txt" || true
node --version > "\${SNAPSHOT_DIR}/node-version.txt"
npm --version >> "\${SNAPSHOT_DIR}/npm-version.txt"

# Save database schema version
sudo -u postgres psql -d dap -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;" > "\${SNAPSHOT_DIR}/migrations.txt" 2>/dev/null || echo "No migrations table" > "\${SNAPSHOT_DIR}/migrations.txt"

# Create manifest
sudo bash -c "cat > \${SNAPSHOT_DIR}/MANIFEST.txt" << EOF
DAP Release Snapshot
====================
Date: \$(date)
Type: Pre-deployment backup
Server: ${PROD_SERVER}

Contents:
- database.sql (passwords excluded)
- backend.tar.gz
- frontend.tar.gz
- pm2-status.txt
- migrations.txt

This snapshot can be used for rollback.
EOF

echo "[SUCCESS] Snapshot created: \${SNAPSHOT_DIR}"
ENDSSH
}

# Deploy full release
deploy_release() {
    local RELEASE_PACKAGE=$1
    
    if [ ! -f "$RELEASE_PACKAGE" ]; then
        log_error "Release package not found: $RELEASE_PACKAGE"
        exit 1
    fi
    
    log_info "Starting full release deployment..."
    log_info "Package: $(basename $RELEASE_PACKAGE)"
    
    # Confirm deployment
    echo ""
    log_warning "This will deploy to PRODUCTION: ${PROD_SERVER}"
    read -p "Continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Create snapshot
    create_release_snapshot
    
    # Transfer package
    log_info "Transferring release package..."
    scp "$RELEASE_PACKAGE" ${PROD_USER}@${PROD_SERVER}:/tmp/release.tar.gz
    
    # Deploy on production
    log_info "Deploying on production..."
    ssh ${PROD_USER}@${PROD_SERVER} << 'ENDSSH'
set -e

RELEASE_DIR="/tmp/release-$$"
mkdir -p "$RELEASE_DIR"

cd "$RELEASE_DIR"
tar xzf /tmp/release.tar.gz

echo "[INFO] Stopping services..."
sudo -u dap pm2 stop all

# Backup current state
echo "[INFO] Deploying backend..."
if [ -d "backend" ]; then
    sudo rm -rf ${PROD_PATH}/app/backend.old
    sudo mv ${PROD_PATH}/app/backend ${PROD_PATH}/app/backend.old || true
    sudo cp -r backend ${PROD_PATH}/app/
    sudo chown -R dap:dap ${PROD_PATH}/app/backend
    
    # Install dependencies if package.json changed
    sudo -u dap bash -c "cd ${PROD_PATH}/app/backend && npm install --production"
    
    # Build backend
    sudo -u dap bash -c "cd ${PROD_PATH}/app/backend && npm run build"
fi

echo "[INFO] Deploying frontend..."
if [ -d "frontend/dist" ]; then
    sudo rm -rf ${PROD_PATH}/app/frontend/dist.old
    sudo mv ${PROD_PATH}/app/frontend/dist ${PROD_PATH}/app/frontend/dist.old || true
    sudo cp -r frontend/dist ${PROD_PATH}/app/frontend/
    sudo chown -R dap:dap ${PROD_PATH}/app/frontend/dist
fi

# Apply database migrations
echo "[INFO] Checking for database migrations..."
if [ -d "migrations" ] || [ -f "migration.sql" ]; then
    echo "[INFO] Applying migrations..."
    if [ -f "migration.sql" ]; then
        sudo -u postgres psql -d dap < migration.sql
    fi
    
    # Run Prisma migrations if available
    if [ -f "${PROD_PATH}/app/backend/prisma/schema.prisma" ]; then
        sudo -u dap bash -c "cd ${PROD_PATH}/app/backend && npx prisma migrate deploy"
    fi
fi

echo "[INFO] Starting services..."
sudo -u dap pm2 start all

sleep 5

# Cleanup
rm -rf "$RELEASE_DIR"
rm -f /tmp/release.tar.gz

echo "[SUCCESS] Deployment complete"
ENDSSH
    
    # Verify deployment
    verify_deployment
    
    if [ $? -eq 0 ]; then
        log_success "Release deployed successfully!"
    else
        log_error "Deployment verification failed!"
        log_warning "Consider rolling back: ./release-manager.sh rollback"
        exit 1
    fi
}

# Quick patch deployment
deploy_patch() {
    log_info "Starting patch deployment..."
    
    # Check for changed files
    if [ ! -d "backend" ] && [ ! -d "frontend" ]; then
        log_error "No backend or frontend directories found"
        log_info "Run this from /data/dap directory"
        exit 1
    fi
    
    # Create snapshot
    create_release_snapshot
    
    # Build locally
    log_info "Building locally..."
    if [ -d "backend" ]; then
        cd backend && npm run build && cd ..
    fi
    if [ -d "frontend" ]; then
        cd frontend && npm run build && cd ..
    fi
    
    # Transfer files
    log_info "Transferring changed files..."
    
    if [ -d "backend/src" ]; then
        ssh ${PROD_USER}@${PROD_SERVER} "sudo -u dap mkdir -p ${PROD_PATH}/app/backend/src.new"
        scp -r backend/src/* ${PROD_USER}@${PROD_SERVER}:/tmp/backend-src/
        ssh ${PROD_USER}@${PROD_SERVER} "sudo cp -r /tmp/backend-src/* ${PROD_PATH}/app/backend/src/ && sudo chown -R dap:dap ${PROD_PATH}/app/backend/src && rm -rf /tmp/backend-src"
    fi
    
    if [ -d "frontend/dist" ]; then
        scp -r frontend/dist/* ${PROD_USER}@${PROD_SERVER}:/tmp/frontend-dist/
        ssh ${PROD_USER}@${PROD_SERVER} "sudo cp -r /tmp/frontend-dist/* ${PROD_PATH}/app/frontend/dist/ && sudo chown -R dap:dap ${PROD_PATH}/app/frontend/dist && rm -rf /tmp/frontend-dist"
    fi
    
    # Build and restart
    log_info "Building backend on production..."
    ssh ${PROD_USER}@${PROD_SERVER} "sudo -u dap bash -c 'cd ${PROD_PATH}/app/backend && npm run build'"
    
    log_info "Restarting services..."
    ssh ${PROD_USER}@${PROD_SERVER} "sudo -u dap pm2 restart all"
    
    sleep 5
    
    # Verify
    verify_deployment
    
    if [ $? -eq 0 ]; then
        log_success "Patch deployed successfully!"
    else
        log_error "Patch verification failed!"
        log_warning "Consider rolling back: ./release-manager.sh rollback"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check backend
    log_info "Testing backend..."
    BACKEND_TEST=$(ssh ${PROD_USER}@${PROD_SERVER} "curl -s -X POST http://localhost:4000/graphql -H 'Content-Type: application/json' -d '{\"query\":\"{ __typename }\"}' | grep -c '__typename' || echo 0")
    
    if [ "$BACKEND_TEST" -gt 0 ]; then
        log_success "Backend OK"
    else
        log_error "Backend verification failed"
        return 1
    fi
    
    # Check frontend
    log_info "Testing frontend..."
    FRONTEND_TEST=$(ssh ${PROD_USER}@${PROD_SERVER} "curl -s http://localhost/dap/ | grep -c 'index-' || echo 0")
    
    if [ "$FRONTEND_TEST" -gt 0 ]; then
        log_success "Frontend OK"
    else
        log_error "Frontend verification failed"
        return 1
    fi
    
    # Check services
    log_info "Checking services..."
    ssh ${PROD_USER}@${PROD_SERVER} "sudo -u dap pm2 list | grep -E 'dap-backend.*online'" > /dev/null
    if [ $? -eq 0 ]; then
        log_success "Services running"
    else
        log_error "Services check failed"
        return 1
    fi
    
    log_success "All verification checks passed"
    return 0
}

# Rollback to previous version
rollback() {
    log_warning "Starting rollback procedure..."
    
    # Find latest snapshot
    LATEST_SNAPSHOT=$(ssh ${PROD_USER}@${PROD_SERVER} "ls -t ${BACKUP_DIR} | head -1")
    
    if [ -z "$LATEST_SNAPSHOT" ]; then
        log_error "No snapshot found for rollback"
        exit 1
    fi
    
    log_info "Latest snapshot: $LATEST_SNAPSHOT"
    
    echo ""
    log_warning "This will ROLLBACK production to snapshot: $LATEST_SNAPSHOT"
    read -p "Continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_info "Rollback cancelled"
        exit 0
    fi
    
    ssh ${PROD_USER}@${PROD_SERVER} << ENDSSH
set -e

SNAPSHOT_DIR="${BACKUP_DIR}/${LATEST_SNAPSHOT}"

if [ ! -d "\$SNAPSHOT_DIR" ]; then
    echo "[ERROR] Snapshot directory not found: \$SNAPSHOT_DIR"
    exit 1
fi

echo "[INFO] Stopping services..."
sudo -u dap pm2 stop all

# Restore backend
echo "[INFO] Restoring backend..."
if [ -f "\${SNAPSHOT_DIR}/backend.tar.gz" ]; then
    sudo rm -rf ${PROD_PATH}/app/backend
    sudo mkdir -p ${PROD_PATH}/app/backend
    sudo tar xzf "\${SNAPSHOT_DIR}/backend.tar.gz" -C ${PROD_PATH}/app/backend
    sudo chown -R dap:dap ${PROD_PATH}/app/backend
fi

# Restore frontend
echo "[INFO] Restoring frontend..."
if [ -f "\${SNAPSHOT_DIR}/frontend.tar.gz" ]; then
    sudo rm -rf ${PROD_PATH}/app/frontend/dist
    sudo mkdir -p ${PROD_PATH}/app/frontend/dist
    sudo tar xzf "\${SNAPSHOT_DIR}/frontend.tar.gz" -C ${PROD_PATH}/app/frontend/dist
    sudo chown -R dap:dap ${PROD_PATH}/app/frontend/dist
fi

# Restore database
echo "[INFO] Restoring database..."
if [ -f "\${SNAPSHOT_DIR}/database.sql" ]; then
    # Backup current passwords first
    sudo -u postgres psql -d dap -c "CREATE TEMP TABLE temp_passwords AS SELECT id, password FROM \"User\";"
    
    # Restore database
    sudo -u postgres psql -d dap < "\${SNAPSHOT_DIR}/database.sql"
    
    # Restore passwords
    sudo -u postgres psql -d dap -c "UPDATE \"User\" u SET password = tp.password FROM temp_passwords tp WHERE u.id = tp.id;" || true
    
    echo "[INFO] Database restored (passwords preserved)"
fi

echo "[INFO] Starting services..."
sudo -u dap pm2 start all

sleep 5

echo "[SUCCESS] Rollback complete"
ENDSSH
    
    # Verify after rollback
    verify_deployment
    
    if [ $? -eq 0 ]; then
        log_success "Rollback successful and verified!"
    else
        log_error "Rollback completed but verification failed"
        log_warning "Manual intervention may be required"
        exit 1
    fi
}

# Show deployment status
show_status() {
    log_info "Checking production deployment status..."
    
    ssh ${PROD_USER}@${PROD_SERVER} << ENDSSH
echo "========================================="
echo "Production Deployment Status"
echo "========================================="
echo ""

echo "Services:"
sudo -u dap pm2 list | grep dap

echo ""
echo "Backend Version:"
if [ -d "${PROD_PATH}/app/backend" ]; then
    cd ${PROD_PATH}/app/backend
    node --version
    npm --version
else
    echo "Backend directory not found at ${PROD_PATH}/app/backend"
fi

echo ""
echo "Database Status:"
sudo -u postgres psql -d dap -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 3;" 2>/dev/null || echo "No migration history"

echo ""
echo "Disk Usage:"
df -h ${PROD_PATH}

echo ""
echo "Recent Snapshots:"
if [ -d "${BACKUP_DIR}" ]; then
    ls -lht ${BACKUP_DIR} | head -5
else
    echo "No snapshots directory found at ${BACKUP_DIR}"
fi

echo ""
echo "Last Deployment:"
if [ -f "${PROD_PATH}/LAST_DEPLOYMENT.txt" ]; then
    cat "${PROD_PATH}/LAST_DEPLOYMENT.txt"
else
    echo "No deployment record found"
fi
ENDSSH
}

# Main command dispatcher
case "${1:-}" in
    deploy)
        if [ -z "${2:-}" ]; then
            log_error "Usage: $0 deploy <release-package.tar.gz>"
            exit 1
        fi
        deploy_release "$2"
        ;;
    patch)
        deploy_patch
        ;;
    rollback)
        rollback
        ;;
    verify)
        verify_deployment
        ;;
    status)
        show_status
        ;;
    *)
        echo "DAP Release Manager"
        echo ""
        echo "Usage:"
        echo "  $0 deploy <release-package.tar.gz>  Deploy full release"
        echo "  $0 patch                            Deploy quick patch"
        echo "  $0 rollback                         Rollback to previous version"
        echo "  $0 verify                           Verify current deployment"
        echo "  $0 status                           Show deployment status"
        echo ""
        exit 1
        ;;
esac

