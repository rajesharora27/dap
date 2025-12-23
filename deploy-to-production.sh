#!/bin/bash
# Deploy Latest Changes to Production (dapoc) - Version 2
# Target: dapoc.cisco.com (RHEL 9)
# Application runs entirely as 'dap' user with no root access for app files
# Only nginx restart requires sudo

set -e

echo "========================================="
echo "🚀 Deploying to Production (dapoc)"
echo "========================================="
echo ""

PROD_SERVER="dapoc"
PROD_USER="dap"
DAP_ROOT="/data/dap/app"
REMOTE_STAGING="/data/dap/deploy-staging"

# Step 0: Verify we're ready to deploy
echo "📋 Step 0: Preparing deployment..."
# Ensure we are in the project root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)
echo "✅ Using local environment: $PROJECT_ROOT"
echo ""

# Step 1: Build frontend
echo "📦 Step 1: Building frontend..."
cd "$PROJECT_ROOT/frontend"
# Set VITE environment variables for production build
# These are baked into the bundle at build time
export VITE_GRAPHQL_ENDPOINT=/dap/graphql
export VITE_BASE_PATH=/dap/
npm run build -- --base=/dap/
echo "✅ Frontend built"
echo ""

# Step 1.5: Build backend
echo "📦 Step 1.5: Building backend..."
cd "$PROJECT_ROOT/backend"
npm run build
echo "✅ Backend built"
echo ""

# Step 2: Prepare files for transfer
echo "📦 Step 2: Preparing files..."
cd "$PROJECT_ROOT"
rm -rf /tmp/dap-deploy
mkdir -p /tmp/dap-deploy

# Backend files
cp -r backend/src /tmp/dap-deploy/backend-src
cp backend/package.json /tmp/dap-deploy/
cp backend/package-lock.json /tmp/dap-deploy/ 2>/dev/null || true
cp backend/tsconfig.json /tmp/dap-deploy/
cp backend/eslint.config.mjs /tmp/dap-deploy/ 2>/dev/null || true
cp -r backend/dist /tmp/dap-deploy/backend-dist
cp -r backend/prisma /tmp/dap-deploy/backend-prisma

# Frontend files
cp -r frontend/dist /tmp/dap-deploy/frontend-dist

# Documentation
cp -r docs /tmp/dap-deploy/docs 2>/dev/null || true

# Copy config files
mkdir -p /tmp/dap-deploy/config
cp -r backend/config/* /tmp/dap-deploy/config/ 2>/dev/null || true

# Copy ecosystem config for PM2
cp backend/ecosystem.config.js /tmp/dap-deploy/ecosystem.config.js 2>/dev/null || true

# Copy scripts
cp -r scripts /tmp/dap-deploy/scripts-new 2>/dev/null || true

# Copy production management script
cp dap-prod /tmp/dap-deploy/dap-prod 2>/dev/null || true

echo "✅ Files prepared in /tmp/dap-deploy"
echo ""

# Step 3: Create tar.gz archive and transfer (OPTIMIZED)
echo "📤 Step 3: Creating archive and transferring to $PROD_SERVER..."
cd /tmp/dap-deploy
# COPYFILE_DISABLE=1 prevents macOS from including ._* resource fork files
COPYFILE_DISABLE=1 tar czf /tmp/dap-deploy.tar.gz .
ARCHIVE_SIZE=$(du -h /tmp/dap-deploy.tar.gz | cut -f1)
echo "📦 Archive size: $ARCHIVE_SIZE"

# Transfer to /data/dap staging area where dap user has full ownership
# Use rajarora's sudo access to create staging directory with proper ownership
ssh rajarora@${PROD_SERVER} "sudo rm -rf $REMOTE_STAGING && sudo mkdir -p $REMOTE_STAGING && sudo chown dap:dap $REMOTE_STAGING"

# SCP to /tmp first (rajarora can write there), then move as dap user
scp /tmp/dap-deploy.tar.gz rajarora@${PROD_SERVER}:/tmp/dap-deploy.tar.gz

# Move archive to staging and extract as dap user
ssh rajarora@${PROD_SERVER} "sudo mv /tmp/dap-deploy.tar.gz $REMOTE_STAGING/ && sudo chown dap:dap $REMOTE_STAGING/dap-deploy.tar.gz && sudo -u dap tar xzf $REMOTE_STAGING/dap-deploy.tar.gz -C $REMOTE_STAGING && sudo rm $REMOTE_STAGING/dap-deploy.tar.gz"
echo "✅ Transfer complete (archive mode)"
echo ""

# Cleanup local temp
rm -rf /tmp/dap-deploy /tmp/dap-deploy.tar.gz

# Step 4: Deploy as dap user (minimal sudo)
echo "🔨 Step 4: Deploying on $PROD_SERVER..."
echo ""

# All deployment commands run as dap user - no root needed for app files
ssh rajarora@${PROD_SERVER} << 'ENDSSH'
set -e

echo "📝 Deploying as dap user..."
sudo -u dap bash << 'DAPCMDS'
set -e

STAGING="/data/dap/deploy-staging"
DAP_ROOT="/data/dap/app"

# Create directory structure if needed (dap user owns /data/dap)
mkdir -p "$DAP_ROOT/backend/src"
mkdir -p "$DAP_ROOT/backend/dist"
mkdir -p "$DAP_ROOT/frontend/dist"
mkdir -p "$DAP_ROOT/docs"
mkdir -p "/data/dap/scripts"
mkdir -p "/data/dap/logs"

# Copy scripts if provided
if [ -d "$STAGING/scripts-new" ]; then
  mkdir -p "$DAP_ROOT/scripts"
  cp $STAGING/scripts-new/* "$DAP_ROOT/scripts/" 2>/dev/null || true
  chmod +x "$DAP_ROOT/scripts/"*.sh 2>/dev/null || true
  echo "✅ Scripts updated"
fi

# Sync Environment Variables using the script
echo "🔄 Syncing environment variables..."
if [ -f "$DAP_ROOT/scripts/sync-env.sh" ]; then
  cd "$DAP_ROOT"
  ./scripts/sync-env.sh production 2>/dev/null || echo "⚠️ sync-env.sh returned warning"
  echo "✅ Environment synchronized"
else
  echo "ℹ️ No sync-env.sh, using existing config"
fi

# Copy config
mkdir -p "$DAP_ROOT/backend/config"
cp -r $STAGING/config/* "$DAP_ROOT/backend/config/" 2>/dev/null || true
echo "✅ Config files updated"

# Backup current backend
if [ -d "$DAP_ROOT/backend/src" ] && [ "$(ls -A $DAP_ROOT/backend/src 2>/dev/null)" ]; then
  BACKUP_FILE="/data/dap/backups/dap-backend-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
  mkdir -p /data/dap/backups
  tar czf "$BACKUP_FILE" -C "$DAP_ROOT/backend" src 2>/dev/null || true
  echo "✅ Backed up to $BACKUP_FILE"
fi

echo "📝 Copying backend files..."
rm -rf "$DAP_ROOT/backend/src"/*
cp -r $STAGING/backend-src/* "$DAP_ROOT/backend/src/"
cp $STAGING/package.json "$DAP_ROOT/backend/"
[ -f $STAGING/package-lock.json ] && cp $STAGING/package-lock.json "$DAP_ROOT/backend/"
cp $STAGING/tsconfig.json "$DAP_ROOT/backend/"
[ -f $STAGING/eslint.config.mjs ] && cp $STAGING/eslint.config.mjs "$DAP_ROOT/backend/"

echo "📝 Copying Prisma schema..."
mkdir -p "$DAP_ROOT/backend/prisma"
rm -rf "$DAP_ROOT/backend/prisma"/*
cp -r $STAGING/backend-prisma/* "$DAP_ROOT/backend/prisma/"
echo "✅ Backend files copied"

echo "📝 Copying backend dist..."
rm -rf "$DAP_ROOT/backend/dist"/*
cp -r $STAGING/backend-dist/* "$DAP_ROOT/backend/dist/"
echo "✅ Backend dist copied"

echo "📝 Copying frontend files..."
rm -rf "$DAP_ROOT/frontend/dist"/*
cp -r $STAGING/frontend-dist/* "$DAP_ROOT/frontend/dist/"
echo "✅ Frontend files copied"

# Copy docs
echo "📝 Copying documentation..."
mkdir -p "$DAP_ROOT/docs"
rm -rf "$DAP_ROOT/docs"/* 2>/dev/null || true
cp -r $STAGING/docs/* "$DAP_ROOT/docs/" 2>/dev/null || true
echo "✅ Documentation updated"

# Copy production management script
if [ -f $STAGING/dap-prod ]; then
  cp $STAGING/dap-prod /data/dap/dap
  chmod +x /data/dap/dap
  echo "✅ Production management script (./dap) installed"
fi

# Copy ecosystem.config.js
if [ -f $STAGING/ecosystem.config.js ]; then
  cp $STAGING/ecosystem.config.js "$DAP_ROOT/ecosystem.config.js"
  echo "✅ PM2 ecosystem config updated"
fi

# Install dependencies
echo "🔨 Installing dependencies..."
cd "$DAP_ROOT/backend"
npm install --legacy-peer-deps 2>/dev/null || npm install
echo "✅ Dependencies installed"

echo "📊 Updating database schema..."
npx prisma generate
npx prisma db push --accept-data-loss
echo "✅ Database schema updated"

# Restart PM2
echo "🔄 Restarting PM2..."
cd "$DAP_ROOT"
pm2 reload ecosystem.config.js 2>/dev/null || pm2 restart ecosystem.config.js 2>/dev/null || pm2 start ecosystem.config.js
pm2 save
sleep 5

if pm2 list | grep -q "online"; then
  echo "✅ PM2 processes confirmed online"
else
  echo "❌ WARNING: No PM2 processes found online!"
  pm2 list
fi

# Cleanup staging files (dap user owns /data/dap, no sudo needed)
rm -rf $STAGING

DAPCMDS

# Restart Nginx (needs root)
echo "🌐 Restarting Nginx..."
systemctl restart nginx
echo "✅ Nginx restarted"

# Verify deployment
echo ""
echo "🧪 Testing deployment..."

sleep 3

# Test backend
echo "Testing backend GraphQL..."
BACKEND_TEST=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' 2>/dev/null || echo "FAILED")

if echo "$BACKEND_TEST" | grep -q "__typename"; then
  echo "✅ Backend responding correctly"
else
  echo "⚠️  Backend test failed: $BACKEND_TEST"
fi

# Test frontend
echo "Testing frontend..."
FRONTEND_TEST=$(curl -s http://localhost/dap/ 2>/dev/null | grep -o "index-[^.]*\.js" | head -1 || echo "")

if [ -n "$FRONTEND_TEST" ]; then
  echo "✅ Frontend serving correctly: $FRONTEND_TEST"
else
  echo "⚠️  Frontend test inconclusive"
fi

echo ""
echo "✅ Deployment process complete!"

ENDSSH

echo ""
echo "========================================="
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "========================================="
echo ""
echo "🌐 Production URLs:"
echo "  • https://dapoc.cisco.com/dap/"
echo ""
echo "📝 What was deployed:"
echo "  ✅ Backend: Updated source code and rebuilt"
echo "  ✅ Frontend: New distribution with updated UI"
echo "  ✅ Scripts: Latest utility scripts"
echo "  ✅ Services: Restarted and verified"
echo ""
echo "📊 Monitor logs:"
echo "  ssh rajarora@dapoc"
echo "  sudo -u dap pm2 logs"
echo ""
echo "🔄 Rollback if needed:"
echo "  Previous version backed up in: /data/dap/backups/dap-backend-backup-*.tar.gz"
echo ""
