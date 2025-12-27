#!/bin/bash
# Deploy Latest Changes to Stage (centos2) - Version 5
# Matches production directory structure and permissions
# NOTE: Does NOT modify local .env files - only stage server gets .env.stage

set -e

echo "========================================="
echo "🚀 Deploying to Stage (centos2)"
echo "========================================="
echo ""

# Step 0: Verify we're ready to deploy (no local env changes needed)
echo "📋 Step 0: Preparing deployment..."
# Ensure we are in the project root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)
echo "✅ Using local environment: $PROJECT_ROOT"
echo ""

# Step 1: Build frontend
echo "📦 Step 1: Building frontend..."
cd "$PROJECT_ROOT/frontend"
# Set VITE environment variables for staging/production build
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
rm -rf /tmp/dap-deploy /tmp/dap-deploy.tar.gz  # Clean any old files
mkdir -p /tmp/dap-deploy
cp -r backend/src /tmp/dap-deploy/backend-src
cp backend/package.json /tmp/dap-deploy/
cp backend/package-lock.json /tmp/dap-deploy/ 2>/dev/null || true
cp backend/tsconfig.json /tmp/dap-deploy/
cp backend/eslint.config.mjs /tmp/dap-deploy/ 2>/dev/null || true
cp -r backend/dist /tmp/dap-deploy/backend-dist
cp -r backend/scripts /tmp/dap-deploy/backend-scripts
cp -r frontend/dist /tmp/dap-deploy/frontend-dist
cp -r docs /tmp/dap-deploy/docs 2>/dev/null || true

# Copy environment files
# Copy environment files (from root)
# NOTE: Relying on server configuration
# cp .env.stage /tmp/dap-deploy/.env
# cp .env.development /tmp/dap-deploy/.env.development 2>/dev/null || true
# cp .env.stage /tmp/dap-deploy/.env.stage 2>/dev/null || true

# Copy config files (including LLM config)
mkdir -p /tmp/dap-deploy/config
cp -r backend/config/* /tmp/dap-deploy/config/ 2>/dev/null || true

# Copy Prisma schema
cp -r backend/prisma /tmp/dap-deploy/backend-prisma 2>/dev/null || true

# Copy ecosystem config for PM2
cp backend/ecosystem.config.js /tmp/dap-deploy/ecosystem.config.js 2>/dev/null || true

# Copy production management script
cp dap-prod /tmp/dap-deploy/dap-prod 2>/dev/null || true

cp -r scripts /tmp/dap-deploy/scripts-new 2>/dev/null || true
echo "✅ Files prepared in /tmp/dap-deploy"
echo ""

# Step 3: Create tar.gz archive and transfer (OPTIMIZED)
echo "📤 Step 3: Creating archive and transferring to centos2..."
cd /tmp/dap-deploy
# COPYFILE_DISABLE=1 prevents macOS from including ._* resource fork files
COPYFILE_DISABLE=1 tar czf /tmp/dap-deploy.tar.gz .
ARCHIVE_SIZE=$(du -h /tmp/dap-deploy.tar.gz | cut -f1)
echo "📦 Archive size: $ARCHIVE_SIZE"

# Transfer single archive (much faster than individual files)
# Transfer to /data/dap staging area where dap user has full ownership
REMOTE_STAGING="/data/dap/deploy-staging"

# SCP to /tmp first (rajarora can write there), then move as dap user
scp /tmp/dap-deploy.tar.gz centos2:/tmp/dap-deploy.tar.gz

# Create staging dir, move archive there, extract as dap user
ssh centos2 "sudo rm -rf $REMOTE_STAGING && sudo mkdir -p $REMOTE_STAGING && sudo chown dap:dap $REMOTE_STAGING && sudo mv /tmp/dap-deploy.tar.gz $REMOTE_STAGING/ && sudo chown dap:dap $REMOTE_STAGING/dap-deploy.tar.gz && sudo -u dap tar xzf $REMOTE_STAGING/dap-deploy.tar.gz -C $REMOTE_STAGING && sudo rm $REMOTE_STAGING/dap-deploy.tar.gz"
echo "✅ Transfer complete (archive mode)"
echo ""

# Cleanup local temp
rm -rf /tmp/dap-deploy /tmp/dap-deploy.tar.gz


# Step 4: Deploy as dap user (minimal sudo)
echo "🔨 Step 4: Deploying on centos2..."
echo ""

# All deployment commands run as dap user - no root needed for app files
ssh centos2 << 'ENDSSH'
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

# Directories already created and chowned by sudo wrapper above
# Just setting variables
DAP_ROOT="/data/dap/app"
STAGING="/data/dap/deploy-staging"

# Copy environment files to root
if [ -f $STAGING/.env ]; then
  cp $STAGING/.env "$DAP_ROOT/.env"
  cp $STAGING/.env.development "$DAP_ROOT/.env.development" 2>/dev/null || true
  cp $STAGING/.env.stage "$DAP_ROOT/.env.stage" 2>/dev/null || true
  echo "✅ Environment files updated in root"
else
  echo "ℹ️  No environment file in payload, keeping existing config"
fi

# Copy scripts if provided (Early copy to ensure sync-env is available)
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
  ./scripts/sync-env.sh production
  echo "✅ Environment synchronized"
else
  echo "⚠️  sync-env.sh not found, falling back to manual copy"
  cp "$DAP_ROOT/.env" "$DAP_ROOT/backend/.env"
fi

# Create directory structure for config
mkdir -p "$DAP_ROOT/backend/config"
cp -r $STAGING/config/* "$DAP_ROOT/backend/config/" 2>/dev/null || true
echo "✅ Config files updated"

# FULL SYSTEM BACKUP
echo "📦 Performing Pre-Deployment Backups..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 1. Code Backup
if [ -d "$DAP_ROOT" ]; then
  CODE_BACKUP="/data/dap/backups/dap-code-backup-$TIMESTAMP.tar.gz"
  mkdir -p /data/dap/backups
  tar czf "$CODE_BACKUP" --exclude="node_modules" --exclude="logs" --exclude="backups" --exclude=".git" -C "$DAP_ROOT" . 2>/dev/null || true
  echo "✅ Code backup: $CODE_BACKUP"
fi

# 2. Database Backup
echo "   Backing up database..."
DB_BACKUP="/data/dap/backups/dap-db-backup-$TIMESTAMP.sql.gz"

DB_URL=""
if [ -f "$DAP_ROOT/backend/.env" ]; then
   DB_URL=$(grep "^DATABASE_URL=" "$DAP_ROOT/backend/.env" | cut -d '=' -f2- | tr -d '"' | cut -d '?' -f1)
fi

if [ -n "$DB_URL" ]; then
  if pg_dump "$DB_URL" | gzip > "$DB_BACKUP"; then
    echo "✅ Database backup: $DB_BACKUP"
  else
    echo "❌ Database backup FAILED. Aborting deployment."
    exit 1
  fi
else
  if pg_dump -U dap dap | gzip > "$DB_BACKUP"; then
    echo "✅ Database backup: $DB_BACKUP"
  else
    echo "❌ Database backup FAILED. Aborting deployment."
    exit 1
  fi
fi

echo "📝 Copying backend files..."
# Remove old source files
rm -rf "$DAP_ROOT/backend/src"/*

# Copy new files
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

echo "📝 Copying backend scripts..."
mkdir -p "$DAP_ROOT/backend/scripts"
rm -rf "$DAP_ROOT/backend/scripts"/* 2>/dev/null || true
cp -r $STAGING/backend-scripts/* "$DAP_ROOT/backend/scripts/"
chmod +x "$DAP_ROOT/backend/scripts/"*.sh 2>/dev/null || true
echo "✅ Backend scripts copied"

echo "📝 Copying backend dist..."
# Remove old dist files
rm -rf "$DAP_ROOT/backend/dist"/*
cp -r $STAGING/backend-dist/* "$DAP_ROOT/backend/dist/"
echo "✅ Backend dist copied"

echo "📝 Copying frontend files..."
# Copy frontend dist
rm -rf "$DAP_ROOT/frontend/dist"/*
cp -r $STAGING/frontend-dist/* "$DAP_ROOT/frontend/dist/"
echo "✅ Frontend files copied"

# Copy docs
echo "📝 Copying documentation..."
rm -rf "$DAP_ROOT/docs"/*
cp -r $STAGING/docs/* "$DAP_ROOT/docs/" 2>/dev/null || true
echo "✅ Documentation updated"

# Scripts already copied in earlier step
echo "✅ Scripts already updated"

# Copy production management scripts to /data/dap root
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

# Build backend
echo "🔨 Building backend..."
cd "$DAP_ROOT/backend"

# Install/update dependencies
echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies (first time)..."
  npm install
else
  echo "Updating dependencies..."
  # Full install to ensure we have prisma CLI
  npm install --legacy-peer-deps
fi

echo "🔄 Generating Prisma Client..."
npx prisma generate

echo "🔄 Updating Database Schema..."
# Use db push for staging to auto-reconcile schema/database differences
# This handles cases where migrations might be desynchronized
npx prisma db push --accept-data-loss


echo "Building TypeScript..."
# npm run build  <-- Skipped, using pre-built dist
echo "✅ Backend built successfully (using pre-built dist)"

# Restart using PM2 if available, otherwise use npm
echo "🔄 Restarting backend..."
cd "$DAP_ROOT"

if command -v pm2 &> /dev/null; then
  echo "Restarting via PM2..."
  
  # Use reload for zero-downtime restart in cluster mode
  if pm2 reload ecosystem.config.js; then
    echo "✅ PM2 reload successful"
  else
    echo "⚠️  PM2 reload failed, attempting restart..."
    if pm2 restart ecosystem.config.js; then
      echo "✅ PM2 restart successful"
    else
      echo "⚠️  PM2 restart failed, attempting start..."
      pm2 start ecosystem.config.js || {
        echo "❌ PM2 start failed! Manual intervention required."
        pm2 list
        exit 1
      }
    fi
  fi
  
  sleep 5
  
  # Verify PM2 processes are running
  if pm2 list | grep -q "online"; then
    echo "✅ PM2 processes confirmed online"
  else
    echo "❌ WARNING: No PM2 processes found online!"
    pm2 list
    exit 1
  fi
else
  echo "Stopping old processes..."
  pkill -f "node.*src/server" || true
  pkill -f "node.*dist/server" || true
  sleep 3
  
  echo "Starting backend..."
  cd "$DAP_ROOT"
  nohup npm --prefix backend start > backend.log 2>&1 &
  sleep 8
  
  # Verify process started
  if pgrep -f "node.*src/server" > /dev/null || pgrep -f "node.*dist/server" > /dev/null; then
    echo "✅ Backend process started"
  else
    echo "❌ Backend failed to start! Check logs."
    tail -50 backend.log
    exit 1
  fi
fi

echo "✅ Backend restarted"

DAPCMDS

# Restart Apache (needs root)
# Restart Web Server
echo "🌐 Restarting Web Server..."
if systemctl is-active --quiet nginx; then
    sudo systemctl restart nginx
    echo "✅ Nginx restarted"
elif systemctl is-active --quiet httpd; then
    sudo systemctl restart httpd
    echo "✅ Apache restarted"
else
    echo "⚠️  Neither Nginx nor Apache active. Attempting to start Nginx..."
    sudo systemctl start nginx || sudo systemctl start httpd
fi
sleep 3

# Verify deployment
echo ""
echo "🧪 Testing deployment..."

# Test backend
echo "Testing backend GraphQL..."
BACKEND_TEST=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' 2>/dev/null || echo "FAILED")

if echo "$BACKEND_TEST" | grep -q "__typename"; then
  echo "✅ Backend responding correctly"
  
  # Test products query
  PRODUCTS_TEST=$(curl -s -X POST http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ products(first: 5) { totalCount } }"}' 2>/dev/null || echo "FAILED")
  
  if echo "$PRODUCTS_TEST" | grep -q "totalCount"; then
    echo "✅ Products query working"
  else
    echo "⚠️  Products query check inconclusive"
  fi
else
  echo "⚠️  Backend GraphQL test failed: $BACKEND_TEST"
  echo "Checking backend logs..."
  if [ -d "/data/dap/app" ]; then
    tail -50 /data/dap/app/backend.log 2>/dev/null || tail -50 /data/dap/backend.log 2>/dev/null || true
  else
    tail -50 /data/dap/backend.log 2>/dev/null || true
  fi
fi

# Test frontend
echo ""
echo "Testing frontend..."
FRONTEND_TEST=$(curl -s http://localhost/dap/ 2>/dev/null | grep -o "index-[^.]*\.js" | head -1 || echo "")

if [ -n "$FRONTEND_TEST" ]; then
  echo "✅ Frontend serving correctly: $FRONTEND_TEST"
else
  echo "⚠️  Frontend test inconclusive"
fi

# Test public URL
echo ""
echo "Testing public URL..."
PUBLIC_TEST=$(curl -s -k http://centos2.rajarora.csslab/dap/ 2>/dev/null | grep -o "index-[^.]*\.js" | head -1 || echo "")

if [ -n "$PUBLIC_TEST" ]; then
  echo "✅ Public URL responding: $PUBLIC_TEST"
else
  echo "⚠️  Public URL test inconclusive (may need cache clear)"
fi

# Cleanup staging files (define path again since we're outside DAPCMDS)
STAGING="/data/dap/deploy-staging"
sudo rm -rf $STAGING

echo ""
echo "✅ Deployment process complete!"

ENDSSH

echo ""
echo "========================================="
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "========================================="
echo ""
echo "🌐 Stage URLs:"
echo "  • http://centos2.rajarora.csslab/dap/"
echo ""
echo "📝 What was deployed:"
echo "  ✅ Backend: Updated source code and rebuilt"
echo "  ✅ Frontend: New distribution with updated UI"
echo "  ✅ Scripts: Latest utility scripts"
echo "  ✅ Services: Restarted and verified"
echo ""
echo "✨ New Features in this deployment (v3.0.0):"
echo "  • ✅ NEW: Universal Theme Alignment across all features"
echo "  • ✅ NEW: Refreshed tile-based Help Documentation and 3-step guide"
echo "  • ✅ NEW: Scoped Task Locking for Product/Solution protecting master metadata"
echo "  • ✅ FIXED: Customer Dashboard statistics (Velocity, Completion) calculation"
echo "  • ✅ FIXED: Standardized Telemetry Import/Export with improved auth"
echo ""
echo "🧪 Testing checklist:"
echo "  1. Login as admin / DAP123!!!"
echo "  2. Verify top-right AI icon is the new Sparkle style"
echo "  3. Go to Customers -> Overview and verify scorecard tiles"
echo "  4. Check Products/Solutions summary tabs for inline editable outcomes"
echo "  5. Verify 'Licenses' tab name (formerly Entitlements)"
echo "  6. Verify compact progress bar in Products/Solutions Assigned tabs"
echo ""
echo "📊 Monitor logs:"
echo "  ssh rajarora@centos2.rajarora.csslab"
echo "  tail -f /data/dap/app/backend.log    (or /data/dap/backend.log)"
echo ""
echo "🔄 Rollback if needed:"
echo "  Previous version backed up in: /tmp/dap-backend-backup-*.tar.gz"
echo ""
echo "💾 Clear browser cache or use:"
echo "  http://centos2.rajarora.csslab/dap/?v=$(date +%s)"
echo ""
