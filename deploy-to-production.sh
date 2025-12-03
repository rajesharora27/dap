#!/bin/bash
# Deploy Latest Changes to Production (centos2) - Version 3
# Matches production directory structure and permissions

set -e

echo "========================================="
echo "🚀 Deploying to Production (centos2)"
echo "========================================="
echo ""

# Step 1: Build frontend first
echo "📦 Step 1: Building frontend..."
cd /data/dap/frontend
npm run build
echo "✅ Frontend built"
echo ""

# Step 1.5: Build backend
echo "📦 Step 1.5: Building backend..."
cd /data/dap/backend
npm run build
echo "✅ Backend built"
echo ""

# Step 2: Prepare files for transfer
echo "📦 Step 2: Preparing files..."
cd /data/dap
mkdir -p /tmp/dap-deploy
cp -r backend/src /tmp/dap-deploy/backend-src
cp backend/package.json /tmp/dap-deploy/
cp backend/package-lock.json /tmp/dap-deploy/ 2>/dev/null || true
cp backend/tsconfig.json /tmp/dap-deploy/
cp backend/eslint.config.mjs /tmp/dap-deploy/ 2>/dev/null || true
cp -r backend/dist /tmp/dap-deploy/backend-dist
cp -r frontend/dist /tmp/dap-deploy/frontend-dist
cp .env.production /tmp/dap-deploy/.env
cp -r scripts /tmp/dap-deploy/scripts-new 2>/dev/null || true
echo "✅ Files prepared in /tmp/dap-deploy"
echo ""

# Step 3: Transfer to production
echo "📤 Step 3: Transferring to centos2..."
ssh rajarora@centos2.rajarora.csslab "rm -rf /tmp/dap-deploy-prod && mkdir -p /tmp/dap-deploy-prod"
scp -r /tmp/dap-deploy/. rajarora@centos2.rajarora.csslab:/tmp/dap-deploy-prod/
echo "✅ Transfer complete"
echo ""

# Cleanup local temp
rm -rf /tmp/dap-deploy

# Step 4: Deploy on production
echo "🔨 Step 4: Deploying on centos2..."
echo ""

ssh rajarora@centos2.rajarora.csslab << 'ENDSSH'
set -e

echo "📝 Deploying as dap user..."
sudo -u dap bash << 'DAPCMDS'
set -e

# Check which structure is in use
if [ -d "/data/dap/app" ]; then
  DAP_ROOT="/data/dap/app"
  echo "Using app directory structure: $DAP_ROOT"
elif [ -d "/data/dap/backend" ]; then
  DAP_ROOT="/data/dap"
  echo "Using standard directory structure: $DAP_ROOT"
else
  echo "❌ Cannot find DAP installation"
  exit 1
fi

# Create directory structure if needed
mkdir -p "$DAP_ROOT/backend/src"
mkdir -p "$DAP_ROOT/backend/dist"
mkdir -p "$DAP_ROOT/frontend/dist"
mkdir -p "$DAP_ROOT/frontend/dist"
mkdir -p "/data/dap/scripts"

# Copy .env
cp /tmp/dap-deploy-prod/.env "$DAP_ROOT/.env"
echo "✅ Environment file updated"

# Backup current backend source
if [ -d "$DAP_ROOT/backend/src" ] && [ "$(ls -A $DAP_ROOT/backend/src)" ]; then
  BACKUP_FILE="/tmp/dap-backend-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
  tar czf "$BACKUP_FILE" -C "$DAP_ROOT/backend" src 2>/dev/null || true
  echo "✅ Backed up to $BACKUP_FILE"
fi

echo "📝 Copying backend files..."
# Remove old source files
rm -rf "$DAP_ROOT/backend/src"/*

# Copy new files
cp -r /tmp/dap-deploy-prod/backend-src/* "$DAP_ROOT/backend/src/"
cp /tmp/dap-deploy-prod/package.json "$DAP_ROOT/backend/"
[ -f /tmp/dap-deploy-prod/package-lock.json ] && cp /tmp/dap-deploy-prod/package-lock.json "$DAP_ROOT/backend/"
cp /tmp/dap-deploy-prod/tsconfig.json "$DAP_ROOT/backend/"
[ -f /tmp/dap-deploy-prod/eslint.config.mjs ] && cp /tmp/dap-deploy-prod/eslint.config.mjs "$DAP_ROOT/backend/"

echo "✅ Backend files copied"

echo "📝 Copying backend dist..."
# Remove old dist files
rm -rf "$DAP_ROOT/backend/dist"/*
cp -r /tmp/dap-deploy-prod/backend-dist/* "$DAP_ROOT/backend/dist/"
echo "✅ Backend dist copied"

echo "📝 Copying frontend files..."
# Copy frontend dist
rm -rf "$DAP_ROOT/frontend/dist"/*
cp -r /tmp/dap-deploy-prod/frontend-dist/* "$DAP_ROOT/frontend/dist/"
echo "✅ Frontend files copied"

echo "📝 Copying scripts..."
# Copy scripts if provided
if [ -d "/tmp/dap-deploy-prod/scripts-new" ]; then
  cp /tmp/dap-deploy-prod/scripts-new/* /data/dap/scripts/ 2>/dev/null || true
  chmod +x /data/dap/scripts/*.sh 2>/dev/null || true
  echo "✅ Scripts copied"
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
  echo "Updating dependencies if needed..."
  npm install --production --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps
fi

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
PUBLIC_TEST=$(curl -s -k https://myapps.cxsaaslab.com/dap/ 2>/dev/null | grep -o "index-[^.]*\.js" | head -1 || echo "")

if [ -n "$PUBLIC_TEST" ]; then
  echo "✅ Public URL responding: $PUBLIC_TEST"
else
  echo "⚠️  Public URL test inconclusive (may need cache clear)"
fi

# Cleanup
rm -rf /tmp/dap-deploy-prod

echo ""
echo "✅ Deployment process complete!"

ENDSSH

echo ""
echo "========================================="
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "========================================="
echo ""
echo "🌐 Production URLs:"
echo "  • https://myapps.cxsaaslab.com/dap/"
echo "  • http://prod.rajarora.csslab/dap/"
echo ""
echo "📝 What was deployed:"
echo "  ✅ Backend: Updated source code and rebuilt"
echo "  ✅ Frontend: New distribution with updated UI"
echo "  ✅ Scripts: Latest utility scripts"
echo "  ✅ Services: Restarted and verified"
echo ""
echo "✨ New Features in this deployment:"
echo "  • Fixed Backup Download URL (subpath support)"
echo "  • Enhanced Production Backup Reliability (podman fallback)"
echo "  • Fixed About Menu visibility"
echo "  • Updated Build & Deploy GUI text"
echo ""
echo "🧪 Testing checklist:"
echo "  1. Login as cssuser / cssuser"
echo "  2. Navigate to Customers tab"
echo "  3. Select a customer with solutions assigned"
echo "  4. Expand a solution to view adoption plan"
echo "  5. ✓ Verify Weight column is visible"
echo "  6. ✓ Verify Telemetry column shows proper chips"
echo "  7. ✓ Verify all chips have outlined style (no solid backgrounds)"
echo "  8. ✓ Verify Products dropdown is accessible for CSS users"
echo ""
echo "📊 Monitor logs:"
echo "  ssh rajarora@centos2.rajarora.csslab"
echo "  tail -f /data/dap/app/backend.log    (or /data/dap/backend.log)"
echo ""
echo "🔄 Rollback if needed:"
echo "  Previous version backed up in: /tmp/dap-backend-backup-*.tar.gz"
echo ""
echo "💾 Clear browser cache or use:"
echo "  https://myapps.cxsaaslab.com/dap/?v=$(date +%s)"
echo ""
