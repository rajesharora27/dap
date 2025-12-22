#!/bin/bash
#===============================================================================
# DAP Application Deployment Script
# Run from centos1 (dev) to deploy to centos2 (prod)
# SSH as rajarora, run app as dap user
#===============================================================================

set -e
set -o pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

#===============================================================================
# Configuration
#===============================================================================
SOURCE_DIR="/data/dap"
PROD_HOST="172.22.156.33"
SSH_USER="rajarora"
DAP_USER="dap"
PROD_APP_DIR="/data/dap/app"
PROD_BASE_DIR="/data/dap"
BASE_PATH="/dap/"

DEPLOY_TIME=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/data/dap/backups/deploy_${DEPLOY_TIME}"

#===============================================================================
# Pre-flight Checks
#===============================================================================
log_info "Starting DAP Deployment to ${PROD_HOST}..."
log_info "Timestamp: ${DEPLOY_TIME}"

# Verify SSH connectivity
log_step "Verifying SSH connectivity..."
if ! ssh -o ConnectTimeout=5 ${SSH_USER}@${PROD_HOST} "echo 'Connected'" > /dev/null 2>&1; then
    log_error "Cannot connect to ${SSH_USER}@${PROD_HOST}. Check SSH configuration."
    exit 1
fi
log_success "SSH connectivity verified"

# Verify source directory
if [[ ! -d "${SOURCE_DIR}/backend" ]] || [[ ! -d "${SOURCE_DIR}/frontend" ]]; then
    log_error "Source directory ${SOURCE_DIR} does not contain backend/frontend"
    exit 1
fi

#===============================================================================
# Build Application
#===============================================================================
log_step "Building application..."

cd ${SOURCE_DIR}

# Build backend
log_info "Building backend..."
cd ${SOURCE_DIR}/backend
npm ci --legacy-peer-deps --production=false 2>/dev/null || npm install --legacy-peer-deps
npm run prisma:generate
npm run build
log_success "Backend built"

# Build frontend for production with /dap/ base path
log_info "Building frontend with base path: ${BASE_PATH}..."
cd ${SOURCE_DIR}/frontend
npm ci --legacy-peer-deps --production=false 2>/dev/null || npm install --legacy-peer-deps
VITE_BASE_PATH=${BASE_PATH} npm run build
log_success "Frontend built"

#===============================================================================
# Prepare Deployment Package
#===============================================================================
log_step "Preparing deployment package..."

TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="${TEMP_DIR}/dap"

mkdir -p ${PACKAGE_DIR}/{backend,frontend}

# Copy backend (only production files)
cp -r ${SOURCE_DIR}/backend/dist ${PACKAGE_DIR}/backend/
cp -r ${SOURCE_DIR}/backend/prisma ${PACKAGE_DIR}/backend/
cp ${SOURCE_DIR}/backend/package.json ${PACKAGE_DIR}/backend/
cp ${SOURCE_DIR}/backend/package-lock.json ${PACKAGE_DIR}/backend/

# Copy frontend build
cp -r ${SOURCE_DIR}/frontend/dist ${PACKAGE_DIR}/frontend/

# Copy root package files
cp ${SOURCE_DIR}/package.json ${PACKAGE_DIR}/ 2>/dev/null || true
cp ${SOURCE_DIR}/package-lock.json ${PACKAGE_DIR}/ 2>/dev/null || true

# Create ecosystem config for PM2
cat > ${PACKAGE_DIR}/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'dap-backend',
      cwd: '/data/dap/app/backend',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DATABASE_URL: 'postgresql://dap:dap_prod_secure_2024!@localhost:5432/dap?schema=public'
      },
      error_file: '/data/dap/logs/backend-error.log',
      out_file: '/data/dap/logs/backend-out.log',
      log_file: '/data/dap/logs/backend.log',
      time: true,
      max_memory_restart: '1G',
      autorestart: true
    },
    {
      name: 'dap-frontend',
      cwd: '/data/dap/app/frontend',
      script: '/usr/bin/serve',
      args: '-s dist -l 3000',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/data/dap/logs/frontend-error.log',
      out_file: '/data/dap/logs/frontend-out.log',
      log_file: '/data/dap/logs/frontend.log',
      time: true,
      max_memory_restart: '512M',
      autorestart: true
    }
  ]
};
EOF

# Create version file
cat > ${PACKAGE_DIR}/VERSION << EOF
version: $(cat ${SOURCE_DIR}/backend/package.json | jq -r '.version')
deployed_at: ${DEPLOY_TIME}
deployed_from: $(hostname)
git_commit: $(cd ${SOURCE_DIR} && git rev-parse HEAD 2>/dev/null || echo 'unknown')
git_branch: $(cd ${SOURCE_DIR} && git branch --show-current 2>/dev/null || echo 'unknown')
EOF

# Create tarball
TARBALL="${TEMP_DIR}/dap-${DEPLOY_TIME}.tar.gz"
cd ${TEMP_DIR}
tar -czf ${TARBALL} dap

log_success "Deployment package created"

#===============================================================================
# Deploy to Production
#===============================================================================
log_step "Deploying to ${PROD_HOST}..."

# Create backup on remote
log_info "Creating backup on remote server..."
ssh ${SSH_USER}@${PROD_HOST} << EOFBACKUP
if [[ -d ${PROD_APP_DIR} ]] && [[ -f ${PROD_APP_DIR}/VERSION ]]; then
    sudo mkdir -p ${BACKUP_DIR}
    sudo cp -r ${PROD_APP_DIR}/* ${BACKUP_DIR}/ 2>/dev/null || true
    sudo chown -R ${DAP_USER}:${DAP_USER} ${BACKUP_DIR}
    echo "Backup created at ${BACKUP_DIR}"
else
    echo "No existing deployment to backup"
fi
EOFBACKUP

# Stop application (running as dap user)
log_info "Stopping application..."
ssh ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} pm2 stop all 2>/dev/null || true"

# Transfer package
log_info "Transferring deployment package..."
scp ${TARBALL} ${SSH_USER}@${PROD_HOST}:/tmp/

# Extract and deploy
log_info "Extracting and deploying..."
ssh ${SSH_USER}@${PROD_HOST} << EOFDEPLOY
set -e

# Extract
cd /tmp
rm -rf /tmp/dap
tar -xzf dap-${DEPLOY_TIME}.tar.gz

# Prepare app directory
sudo mkdir -p ${PROD_APP_DIR}
sudo mkdir -p ${PROD_BASE_DIR}/logs
sudo rm -rf ${PROD_APP_DIR}/*

# Copy new files
sudo cp -r /tmp/dap/* ${PROD_APP_DIR}/

# Set ownership to dap user
sudo chown -R ${DAP_USER}:${DAP_USER} ${PROD_BASE_DIR}

echo "Files extracted"
EOFDEPLOY

# Install dependencies and setup database
log_info "Installing dependencies..."
ssh ${SSH_USER}@${PROD_HOST} << 'EOFDEPS'
cd /data/dap/app/backend

# Install production dependencies
sudo -u dap npm install --legacy-peer-deps --omit=dev

# Install Prisma (required for migrations)
sudo -u dap npm install prisma@6.14.0 @prisma/client@6.14.0 --legacy-peer-deps

# Generate Prisma client
sudo -u dap bash -c 'export DATABASE_URL="postgresql://dap:dap_prod_secure_2024!@localhost:5432/dap?schema=public" && ./node_modules/.bin/prisma generate'

# Run database migrations
sudo -u dap bash -c 'export DATABASE_URL="postgresql://dap:dap_prod_secure_2024!@localhost:5432/dap?schema=public" && ./node_modules/.bin/prisma migrate deploy' || true

# Push schema changes (in case migrations miss anything)
sudo -u dap bash -c 'export DATABASE_URL="postgresql://dap:dap_prod_secure_2024!@localhost:5432/dap?schema=public" && ./node_modules/.bin/prisma db push --accept-data-loss' || true

echo "Dependencies and database setup complete"
EOFDEPS

# Cleanup temp files
ssh ${SSH_USER}@${PROD_HOST} "rm -rf /tmp/dap /tmp/dap-${DEPLOY_TIME}.tar.gz"

log_success "Files deployed"

#===============================================================================
# Start Application (as dap user)
#===============================================================================
log_step "Starting application as ${DAP_USER} user..."

ssh ${SSH_USER}@${PROD_HOST} << 'EOFSTART'
cd /data/dap/app

# Start PM2 as dap user
sudo -u dap pm2 start ecosystem.config.js

# Save PM2 process list
sudo -u dap pm2 save

# Wait for startup
sleep 5

# Check status
sudo -u dap pm2 status
EOFSTART

log_success "Application started"

#===============================================================================
# Health Check
#===============================================================================
log_step "Running health check..."

sleep 3

BACKEND_CHECK=$(ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/graphql" 2>/dev/null || echo "000")
FRONTEND_CHECK=$(ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" 2>/dev/null || echo "000")
NGINX_DAP=$(ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost/dap/" 2>/dev/null || echo "000")
NGINX_GRAPHQL=$(ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost/dap/graphql" 2>/dev/null || echo "000")

echo ""
echo "Health Check Results:"
echo "  Backend (4000):     ${BACKEND_CHECK}"
echo "  Frontend (3000):    ${FRONTEND_CHECK}"
echo "  Nginx /dap/:        ${NGINX_DAP}"
echo "  Nginx /dap/graphql: ${NGINX_GRAPHQL}"

if [[ "${BACKEND_CHECK}" == "400" ]] && [[ "${FRONTEND_CHECK}" == "200" ]] && [[ "${NGINX_DAP}" == "200" ]]; then
    log_success "All health checks passed!"
else
    log_warning "Some health checks may have issues - please verify manually"
fi

#===============================================================================
# Cleanup
#===============================================================================
rm -rf ${TEMP_DIR}

#===============================================================================
# Summary
#===============================================================================
echo ""
echo "=========================================="
log_success "Deployment Complete!"
echo "=========================================="
echo ""
echo "Deployed Version: $(cat ${SOURCE_DIR}/backend/package.json | jq -r '.version')"
echo "Timestamp: ${DEPLOY_TIME}"
echo "Target: ${PROD_HOST}"
echo "App User: ${DAP_USER}"
echo ""
echo "Access Points:"
echo "  - DAP App:      https://myapps.cxsaaslab.com/dap/"
echo "  - GraphQL API:  https://myapps.cxsaaslab.com/dap/graphql"
echo ""
echo "Useful Commands (run on ${PROD_HOST}):"
echo "  sudo -u ${DAP_USER} pm2 status        # Check status"
echo "  sudo -u ${DAP_USER} pm2 logs          # View logs"
echo "  sudo -u ${DAP_USER} pm2 restart all   # Restart"
echo ""
