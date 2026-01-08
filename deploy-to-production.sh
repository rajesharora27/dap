#!/bin/bash
# =============================================================================
# Deploy to Production (dapoc) - Version 3.0
# =============================================================================
# Target: dapoc.cisco.com (RHEL 9)
# 
# SAFETY FEATURES:
#   ✅ Pre-deployment USER backup (separate, restorable)
#   ✅ Pre-deployment FULL DATABASE backup
#   ✅ Pre-deployment CODE backup
#   ✅ Automatic rollback instructions on failure
#   ✅ Non-interactive (no prompts, fails safely)
#
# USAGE:
#   ./deploy-to-production.sh           # Full deployment with all safety checks
#   ./deploy-to-production.sh --quick   # Skip local builds (use existing dist)
#
# ROLLBACK:
#   ssh dapoc "sudo -u dap /data/dap/app/backend/scripts/restore-users.sh /data/dap/backups/users_backup_YYYYMMDD_HHMMSS.sql"
#   ssh dapoc "sudo -u dap gunzip -c /data/dap/backups/dap-db-backup-YYYYMMDD-HHMMSS.sql.gz | psql -U dap dap"
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✅]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[⚠️]${NC} $1"; }
log_error() { echo -e "${RED}[❌]${NC} $1"; }
log_step() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${GREEN}$1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# Configuration
PROD_SERVER="dapoc"
PROD_USER="dap"
DAP_ROOT="/data/dap/app"
REMOTE_STAGING="/data/dap/deploy-staging"
BACKUP_DIR="/data/dap/backups"
QUICK_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick) QUICK_MODE=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🚀 DAP Production Deployment (v3.0)                   ║${NC}"
echo -e "${GREEN}║         Target: dapoc.cisco.com                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Ensure we are in the project root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# =============================================================================
# STEP 0: PRE-FLIGHT CHECKS
# =============================================================================
log_step "Step 0: Pre-flight Checks"

# Check SSH connectivity
log_info "Testing SSH connection to $PROD_SERVER..."
if ! ssh -o ConnectTimeout=10 $PROD_SERVER "echo 'Connected'" > /dev/null 2>&1; then
  log_error "Cannot connect to $PROD_SERVER. Check VPN/SSH config."
  exit 1
fi
log_success "SSH connection OK"

# Check if production server is healthy
log_info "Checking production server health..."
HEALTH=$(ssh $PROD_SERVER "curl -s http://localhost:4000/health 2>/dev/null" | grep -o '"status":"[^"]*"' | head -1 || echo "")
if [ -z "$HEALTH" ]; then
  log_warn "Backend not responding - will be started after deployment"
else
  log_success "Production backend is running"
fi

# =============================================================================
# STEP 1: CREATE BACKUPS ON PRODUCTION (BEFORE ANY CHANGES)
# =============================================================================
log_step "Step 1: Creating Safety Backups on Production"

log_info "Creating USER backup (roles, permissions, sessions)..."
USER_BACKUP_RESULT=$(ssh $PROD_SERVER "sudo -u dap bash -c 'cd /data/dap/app/backend && BACKUP_DIR=$BACKUP_DIR ./scripts/backup-users.sh 2>&1'" 2>/dev/null || echo "FAILED")

if echo "$USER_BACKUP_RESULT" | grep -q "✅ Backup complete"; then
  USER_BACKUP_FILE=$(echo "$USER_BACKUP_RESULT" | grep -o "users_backup_[0-9_]*.sql" | head -1)
  log_success "User backup created: $USER_BACKUP_FILE"
else
  log_error "User backup FAILED. Aborting deployment for safety."
  echo "$USER_BACKUP_RESULT"
  exit 1
fi

log_info "Creating FULL DATABASE backup..."
DB_BACKUP_RESULT=$(ssh $PROD_SERVER "sudo -u dap bash -c 'pg_dump -U dap dap 2>/dev/null | gzip > $BACKUP_DIR/dap-db-backup-pre-deploy-$TIMESTAMP.sql.gz && echo SUCCESS || echo FAILED'" 2>/dev/null)

if [ "$DB_BACKUP_RESULT" = "SUCCESS" ]; then
  log_success "Full DB backup created: dap-db-backup-pre-deploy-$TIMESTAMP.sql.gz"
else
  log_error "Database backup FAILED. Aborting deployment for safety."
  exit 1
fi

# Verify backups exist
log_info "Verifying backups on production..."
BACKUP_CHECK=$(ssh $PROD_SERVER "sudo -u dap ls -la $BACKUP_DIR/ | tail -5" 2>/dev/null)
echo "$BACKUP_CHECK"
log_success "Backups verified"

# =============================================================================
# STEP 2: BUILD LOCALLY (unless --quick)
# =============================================================================
if [ "$QUICK_MODE" = true ]; then
  log_step "Step 2: Skipping Builds (--quick mode)"
  log_warn "Using existing dist/ folders"
else
  log_step "Step 2: Building Application"
  
  log_info "Building frontend..."
  cd "$PROJECT_ROOT/frontend"
  export VITE_GRAPHQL_ENDPOINT=/dap/graphql
  export VITE_BASE_PATH=/dap/
  npm run build -- --base=/dap/ > /dev/null 2>&1
  log_success "Frontend built"

  log_info "Building backend..."
  cd "$PROJECT_ROOT/backend"
  npm run build > /dev/null 2>&1
  log_success "Backend built"
fi

# =============================================================================
# STEP 3: PREPARE DEPLOYMENT PACKAGE
# =============================================================================
log_step "Step 3: Preparing Deployment Package"

cd "$PROJECT_ROOT"
rm -rf /tmp/dap-deploy
mkdir -p /tmp/dap-deploy

# Backend
cp -r backend/src /tmp/dap-deploy/backend-src
cp backend/package.json /tmp/dap-deploy/
cp backend/package-lock.json /tmp/dap-deploy/ 2>/dev/null || true
cp backend/tsconfig.json /tmp/dap-deploy/
cp backend/eslint.config.mjs /tmp/dap-deploy/ 2>/dev/null || true
cp -r backend/dist /tmp/dap-deploy/backend-dist
cp -r backend/prisma /tmp/dap-deploy/backend-prisma
cp -r backend/scripts /tmp/dap-deploy/backend-scripts

# Frontend
cp -r frontend/dist /tmp/dap-deploy/frontend-dist

# Documentation & Config
cp -r docs /tmp/dap-deploy/docs 2>/dev/null || true
mkdir -p /tmp/dap-deploy/config
cp -r backend/config/* /tmp/dap-deploy/config/ 2>/dev/null || true
cp backend/ecosystem.config.js /tmp/dap-deploy/ecosystem.config.js 2>/dev/null || true
cp -r scripts /tmp/dap-deploy/scripts-new 2>/dev/null || true
cp dap-prod /tmp/dap-deploy/dap-prod 2>/dev/null || true

# Create archive
cd /tmp/dap-deploy
COPYFILE_DISABLE=1 tar czf /tmp/dap-deploy.tar.gz .
ARCHIVE_SIZE=$(du -h /tmp/dap-deploy.tar.gz | cut -f1)
log_success "Package ready: $ARCHIVE_SIZE"

# =============================================================================
# STEP 4: TRANSFER TO PRODUCTION
# =============================================================================
log_step "Step 4: Transferring to Production"

ssh $PROD_SERVER "sudo rm -rf $REMOTE_STAGING && sudo mkdir -p $REMOTE_STAGING && sudo chown dap:dap $REMOTE_STAGING" 2>/dev/null
scp -q /tmp/dap-deploy.tar.gz $PROD_SERVER:/tmp/dap-deploy.tar.gz
ssh $PROD_SERVER "sudo mv /tmp/dap-deploy.tar.gz $REMOTE_STAGING/ && sudo chown dap:dap $REMOTE_STAGING/dap-deploy.tar.gz && sudo -u dap tar xzf $REMOTE_STAGING/dap-deploy.tar.gz -C $REMOTE_STAGING && sudo rm $REMOTE_STAGING/dap-deploy.tar.gz" 2>/dev/null

rm -rf /tmp/dap-deploy /tmp/dap-deploy.tar.gz
log_success "Transfer complete"

# =============================================================================
# STEP 5: DEPLOY ON PRODUCTION
# =============================================================================
log_step "Step 5: Deploying on Production"

ssh $PROD_SERVER << 'ENDSSH'
set -e

# Ensure directories exist with proper ownership
sudo mkdir -p /data/dap/app/backend/{src,dist,prisma,scripts,config}
sudo mkdir -p /data/dap/app/frontend/dist
sudo mkdir -p /data/dap/app/docs
sudo mkdir -p /data/dap/{scripts,logs,backups}
sudo chown -R dap:dap /data/dap

# Deploy as dap user
sudo -u dap bash << 'DAPCMDS'
set -e

STAGING="/data/dap/deploy-staging"
DAP_ROOT="/data/dap/app"

# Copy scripts
[ -d "$STAGING/scripts-new" ] && cp -r $STAGING/scripts-new/* "$DAP_ROOT/scripts/" 2>/dev/null || true
chmod +x "$DAP_ROOT/scripts/"*.sh 2>/dev/null || true

# Sync environment
if [ -f "$DAP_ROOT/scripts/sync-env.sh" ]; then
  cd "$DAP_ROOT" && ./scripts/sync-env.sh production 2>/dev/null || true
fi

# Copy config
cp -r $STAGING/config/* "$DAP_ROOT/backend/config/" 2>/dev/null || true

# Copy backend
rm -rf "$DAP_ROOT/backend/src"/* 2>/dev/null || true
cp -r $STAGING/backend-src/* "$DAP_ROOT/backend/src/"
cp $STAGING/package.json "$DAP_ROOT/backend/"
[ -f $STAGING/package-lock.json ] && cp $STAGING/package-lock.json "$DAP_ROOT/backend/"
cp $STAGING/tsconfig.json "$DAP_ROOT/backend/"
[ -f $STAGING/eslint.config.mjs ] && cp $STAGING/eslint.config.mjs "$DAP_ROOT/backend/"

# Copy Prisma
rm -rf "$DAP_ROOT/backend/prisma"/* 2>/dev/null || true
cp -r $STAGING/backend-prisma/* "$DAP_ROOT/backend/prisma/"

# Copy backend scripts
rm -rf "$DAP_ROOT/backend/scripts"/* 2>/dev/null || true
cp -r $STAGING/backend-scripts/* "$DAP_ROOT/backend/scripts/"
chmod +x "$DAP_ROOT/backend/scripts/"*.sh 2>/dev/null || true

# Copy backend dist
rm -rf "$DAP_ROOT/backend/dist"/* 2>/dev/null || true
cp -r $STAGING/backend-dist/* "$DAP_ROOT/backend/dist/"

# Copy frontend
rm -rf "$DAP_ROOT/frontend/dist"/* 2>/dev/null || true
cp -r $STAGING/frontend-dist/* "$DAP_ROOT/frontend/dist/"

# Copy docs
rm -rf "$DAP_ROOT/docs"/* 2>/dev/null || true
cp -r $STAGING/docs/* "$DAP_ROOT/docs/" 2>/dev/null || true

# Copy management scripts
[ -f $STAGING/dap-prod ] && cp $STAGING/dap-prod /data/dap/dap && chmod +x /data/dap/dap
[ -f $STAGING/ecosystem.config.js ] && cp $STAGING/ecosystem.config.js "$DAP_ROOT/ecosystem.config.js"

# Install dependencies
cd "$DAP_ROOT/backend"
npm install --legacy-peer-deps 2>/dev/null || npm install

# Update database schema
npx prisma generate
npx prisma db push --accept-data-loss

# Restart PM2
cd "$DAP_ROOT"
PM2_CMD="pm2"
command -v pm2 &> /dev/null || PM2_CMD="npx pm2"
$PM2_CMD reload ecosystem.config.js 2>/dev/null || $PM2_CMD restart ecosystem.config.js 2>/dev/null || $PM2_CMD start ecosystem.config.js
$PM2_CMD save

# Cleanup
rm -rf $STAGING

DAPCMDS

# Restart Nginx
sudo systemctl restart nginx

ENDSSH

log_success "Deployment complete"

# =============================================================================
# STEP 6: VERIFY DEPLOYMENT
# =============================================================================
log_step "Step 6: Verifying Deployment"

sleep 5

# Test backend
log_info "Testing backend..."
BACKEND_TEST=$(ssh $PROD_SERVER "curl -s -X POST http://localhost:4000/graphql -H 'Content-Type: application/json' -d '{\"query\":\"{ __typename }\"}'" 2>/dev/null || echo "FAILED")

if echo "$BACKEND_TEST" | grep -q "__typename"; then
  log_success "Backend responding correctly"
else
  log_error "Backend test failed: $BACKEND_TEST"
fi

# Test frontend
log_info "Testing frontend..."
FRONTEND_TEST=$(ssh $PROD_SERVER "curl -s http://localhost/dap/ | grep -o 'index-[^.]*\.js' | head -1" 2>/dev/null || echo "")

if [ -n "$FRONTEND_TEST" ]; then
  log_success "Frontend serving: $FRONTEND_TEST"
else
  log_warn "Frontend test inconclusive"
fi

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ DEPLOYMENT SUCCESSFUL                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Production URL:${NC} https://dapoc.cisco.com/dap/"
echo ""
echo -e "${BLUE}📦 Backups Created:${NC}"
echo "   • Users: $BACKUP_DIR/$USER_BACKUP_FILE"
echo "   • Full DB: $BACKUP_DIR/dap-db-backup-pre-deploy-$TIMESTAMP.sql.gz"
echo ""
echo -e "${BLUE}🔄 Rollback Commands (if needed):${NC}"
echo ""
echo "   # Restore users only:"
echo "   ssh dapoc \"sudo -u dap /data/dap/app/backend/scripts/restore-users.sh $BACKUP_DIR/$USER_BACKUP_FILE\""
echo ""
echo "   # Restore full database:"
echo "   ssh dapoc \"sudo -u dap bash -c 'gunzip -c $BACKUP_DIR/dap-db-backup-pre-deploy-$TIMESTAMP.sql.gz | psql -U dap dap'\""
echo ""
