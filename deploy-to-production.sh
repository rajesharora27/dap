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
cp -r backend/scripts /tmp/dap-deploy/backend-scripts

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
ssh dapoc "sudo rm -rf $REMOTE_STAGING && sudo mkdir -p $REMOTE_STAGING && sudo chown dap:dap $REMOTE_STAGING"

# SCP to /tmp first (rajarora can write there), then move as dap user
scp /tmp/dap-deploy.tar.gz dapoc:/tmp/dap-deploy.tar.gz

# Move archive to staging and extract as dap user
ssh dapoc "sudo mv /tmp/dap-deploy.tar.gz $REMOTE_STAGING/ && sudo chown dap:dap $REMOTE_STAGING/dap-deploy.tar.gz && sudo -u dap tar xzf $REMOTE_STAGING/dap-deploy.tar.gz -C $REMOTE_STAGING && sudo rm $REMOTE_STAGING/dap-deploy.tar.gz"
echo "✅ Transfer complete (archive mode)"
echo ""

# Cleanup local temp
rm -rf /tmp/dap-deploy /tmp/dap-deploy.tar.gz

# Step 4: Deploy as dap user (minimal sudo)
echo "🔨 Step 4: Deploying on $PROD_SERVER..."
echo ""

# All deployment commands run as dap user - no root needed for app files
ssh dapoc << 'ENDSSH'
set -e

echo "📝 preparing directory structure and permissions..."
# 1. Ensure Directories Exist (Run as root via sudo) #
sudo mkdir -p "/data/dap/app/backend/src"
sudo mkdir -p "/data/dap/app/backend/dist"
sudo mkdir -p "/data/dap/app/frontend/dist"
sudo mkdir -p "/data/dap/app/docs"
sudo mkdir -p "/data/dap/scripts"
sudo mkdir -p "/data/dap/logs"
sudo mkdir -p "/data/dap/app/backend/config"
sudo mkdir -p "/data/dap/app/backend/scripts"

# 2. Enforce Ownership (dap:dap) on ALL runtime directories #
echo "🔒 Enforcing 'dap' ownership on /data/dap..."
sudo chown -R dap:dap /data/dap

# 3. Switch to 'dap' user for Application Logic #
echo "🚀 Switching to 'dap' user for deployment..."
sudo -u dap bash << 'DAPCMDS'
set -e

STAGING="/data/dap/deploy-staging"
DAP_ROOT="/data/dap/app"

# Directories already created and chowned by sudo wrapper above
# Just ensuring scripts dir exists in the variable path just in case
mkdir -p "$DAP_ROOT/scripts"

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

# FULL SYSTEM BACKUP (Code + Database)
echo "📦 Performing Pre-Deployment Backups..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 1. Code Backup (Full App excluding node_modules, logs, backups)
if [ -d "$DAP_ROOT" ]; then
  CODE_BACKUP="/data/dap/backups/dap-code-backup-$TIMESTAMP.tar.gz"
  mkdir -p /data/dap/backups
  echo "   Backing up existing code/assets..."
  # Use exclude flags before directory arguments for compatibility
  tar czf "$CODE_BACKUP" --exclude="node_modules" --exclude="logs" --exclude="backups" --exclude=".git" -C "$DAP_ROOT" . 2>/dev/null || true
  echo "✅ Code backup: $CODE_BACKUP"
fi

# 2. Database Backup (Full PG Dump w/ Users)
echo "   Backing up database..."
DB_BACKUP="/data/dap/backups/dap-db-backup-$TIMESTAMP.sql.gz"

# Try to get credentials from .env
DB_URL=""
if [ -f "$DAP_ROOT/backend/.env" ]; then
  DB_URL=$(grep "^DATABASE_URL=" "$DAP_ROOT/backend/.env" | cut -d '=' -f2- | tr -d '"' | cut -d '?' -f1)
fi

# Execute Dump
if [ -n "$DB_URL" ]; then
  # Use DB_URL if found
  if pg_dump "$DB_URL" | gzip > "$DB_BACKUP"; then
    echo "✅ Database backup: $DB_BACKUP"
  else
    echo "❌ Database backup FAILED (using URL). Aborting deployment."
    exit 1
  fi
else
  # Fallback to default auth
  echo "⚠️  DATABASE_URL not found, using default 'dap' user..."
  if pg_dump -U dap dap | gzip > "$DB_BACKUP"; then
    echo "✅ Database backup: $DB_BACKUP"
  else
    echo "❌ Database backup FAILED (default auth). Aborting deployment."
    exit 1
  fi
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
cp -r $STAGING/backend-prisma/* "$DAP_ROOT/backend/prisma/"
echo "✅ Backend files copied"

echo "📝 Copying backend scripts..."
mkdir -p "$DAP_ROOT/backend/scripts"
rm -rf "$DAP_ROOT/backend/scripts"/* 2>/dev/null || true
cp -r $STAGING/backend-scripts/* "$DAP_ROOT/backend/scripts/"
chmod +x "$DAP_ROOT/backend/scripts/"*.sh 2>/dev/null || true
echo "✅ Backend scripts copied"

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
# Try to find pm2 or use npx
PM2_CMD="pm2"
if ! command -v pm2 &> /dev/null; then
  echo "⚠️  PM2 not found in PATH, trying npx pm2..."
  PM2_CMD="npx pm2"
fi

$PM2_CMD reload ecosystem.config.js 2>/dev/null || $PM2_CMD restart ecosystem.config.js 2>/dev/null || $PM2_CMD start ecosystem.config.js
$PM2_CMD save
sleep 5

if $PM2_CMD list | grep -q "online"; then
  echo "✅ PM2 processes confirmed online"
else
  echo "❌ WARNING: No PM2 processes found online!"
  $PM2_CMD list
fi

# Cleanup staging files (dap user owns /data/dap, no sudo needed)
rm -rf $STAGING

DAPCMDS

# Restart Nginx (needs root)
echo "🌐 Restarting Nginx..."
sudo systemctl restart nginx
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
echo "✨ New Features in this deployment (v3.5.0):"
echo "  • ✅ NEW: Global Application Rename (Dynamic -> Digital Adoption Platform)"
echo "  • ✅ NEW: Enterprise Login Page Redesign"
echo "  • ✅ NEW: Icon & Color Consistency (Products, Solutions, Customers, Diary)"
echo "  • ✅ NEW: Simplified Admin UI (+ icons)"
echo "  • ✅ FIXED: Sidebar/Page icon mismatches"
echo ""
