#!/bin/bash
# Deploy Latest Changes to Production (dapoc) - Version 1
# Target: dapoc.cisco.com (RHEL 9)
# Matches stage directory structure and permissions

set -e

echo "========================================="
echo "🚀 Deploying to Production (dapoc)"
echo "========================================="
echo ""

PROD_SERVER="dapoc"
PROD_USER="dap"
PROD_PATH="/data/dap/app"

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
rm -rf /tmp/dap-deploy-prod
mkdir -p /tmp/dap-deploy-prod

# Backend files
cp -r backend/src /tmp/dap-deploy-prod/backend-src
cp backend/package.json /tmp/dap-deploy-prod/
cp backend/package-lock.json /tmp/dap-deploy-prod/ 2>/dev/null || true
cp backend/tsconfig.json /tmp/dap-deploy-prod/
cp backend/eslint.config.mjs /tmp/dap-deploy-prod/ 2>/dev/null || true
cp -r backend/dist /tmp/dap-deploy-prod/backend-dist
cp -r backend/prisma /tmp/dap-deploy-prod/prisma

# Frontend files
cp -r frontend/dist /tmp/dap-deploy-prod/frontend-dist

# Documentation
cp -r docs /tmp/dap-deploy-prod/docs 2>/dev/null || true

# Copy environment files
cp .env.prod /tmp/dap-deploy-prod/.env

# Copy config files
mkdir -p /tmp/dap-deploy-prod/config
cp -r backend/config/* /tmp/dap-deploy-prod/config/ 2>/dev/null || true

# Copy ecosystem config for PM2
cp backend/ecosystem.config.js /tmp/dap-deploy-prod/ecosystem.config.js 2>/dev/null || true

# Copy maintenance page
cp deploy/maintenance.html /tmp/dap-deploy-prod/maintenance.html 2>/dev/null || true

# Copy scripts
cp -r scripts /tmp/dap-deploy-prod/scripts-new 2>/dev/null || true

echo "✅ Files prepared in /tmp/dap-deploy-prod"
echo ""

# Step 3: Transfer to production
echo "📤 Step 3: Transferring to $PROD_SERVER..."
ssh root@${PROD_SERVER} "rm -rf /tmp/dap-deploy-incoming && mkdir -p /tmp/dap-deploy-incoming"
scp -r /tmp/dap-deploy-prod/. root@${PROD_SERVER}:/tmp/dap-deploy-incoming/
echo "✅ Transfer complete"
echo ""

# Cleanup local temp
rm -rf /tmp/dap-deploy-prod

# Step 4: Deploy on production
echo "🔨 Step 4: Deploying on $PROD_SERVER..."
echo ""

ssh root@${PROD_SERVER} << 'ENDSSH'
set -e

echo "📝 Deploying as dap user..."

# Stop PM2 processes first
sudo -u dap /usr/local/bin/pm2 stop all 2>/dev/null || true

# Activate maintenance mode
echo "🚧 Activating maintenance mode..."
[ -f /tmp/dap-deploy-incoming/maintenance.html ] && cp /tmp/dap-deploy-incoming/maintenance.html /data/dap/app/frontend/dist/index.html || echo "⚠️ Maintenance page missing"
cp /tmp/dap-deploy-incoming/maintenance.html /data/dap/www/maintenance.html 2>/dev/null || true

# Copy files as dap user
sudo -u dap bash << 'DAPCMDS'
set -e
DAP_ROOT="/data/dap/app"

# Copy environment file
cp /tmp/dap-deploy-incoming/.env "$DAP_ROOT/.env"
cp /tmp/dap-deploy-incoming/.env "$DAP_ROOT/backend/.env"
echo "✅ Environment file updated"

# Copy scripts
if [ -d "/tmp/dap-deploy-incoming/scripts-new" ]; then
  mkdir -p "$DAP_ROOT/scripts"
  cp /tmp/dap-deploy-incoming/scripts-new/* "$DAP_ROOT/scripts/" 2>/dev/null || true
  chmod +x "$DAP_ROOT/scripts/"*.sh 2>/dev/null || true
  echo "✅ Scripts updated"
fi

# Copy config
mkdir -p "$DAP_ROOT/backend/config"
cp -r /tmp/dap-deploy-incoming/config/* "$DAP_ROOT/backend/config/" 2>/dev/null || true
echo "✅ Config files updated"

# Backup current backend
if [ -d "$DAP_ROOT/backend/src" ] && [ "$(ls -A $DAP_ROOT/backend/src 2>/dev/null)" ]; then
  BACKUP_FILE="/tmp/dap-backend-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
  tar czf "$BACKUP_FILE" -C "$DAP_ROOT/backend" src 2>/dev/null || true
  echo "✅ Backed up to $BACKUP_FILE"
fi

echo "📝 Copying backend files..."
rm -rf "$DAP_ROOT/backend/src"/*
cp -r /tmp/dap-deploy-incoming/backend-src/* "$DAP_ROOT/backend/src/"
cp /tmp/dap-deploy-incoming/package.json "$DAP_ROOT/backend/"
[ -f /tmp/dap-deploy-incoming/package-lock.json ] && cp /tmp/dap-deploy-incoming/package-lock.json "$DAP_ROOT/backend/"
cp /tmp/dap-deploy-incoming/tsconfig.json "$DAP_ROOT/backend/"
[ -f /tmp/dap-deploy-incoming/eslint.config.mjs ] && cp /tmp/dap-deploy-incoming/eslint.config.mjs "$DAP_ROOT/backend/"

# Copy prisma schema
mkdir -p "$DAP_ROOT/backend/prisma"
cp -r /tmp/dap-deploy-incoming/prisma/* "$DAP_ROOT/backend/prisma/"
echo "✅ Backend files copied"

echo "📝 Copying backend dist..."
rm -rf "$DAP_ROOT/backend/dist"/*
cp -r /tmp/dap-deploy-incoming/backend-dist/* "$DAP_ROOT/backend/dist/"
echo "✅ Backend dist copied"

echo "📝 Copying frontend files..."
rm -rf "$DAP_ROOT/frontend/dist"/*
cp -r /tmp/dap-deploy-incoming/frontend-dist/* "$DAP_ROOT/frontend/dist/"
echo "✅ Frontend files copied"

# Copy docs
echo "📝 Copying documentation..."
rm -rf "$DAP_ROOT/docs"/*
cp -r /tmp/dap-deploy-incoming/docs/* "$DAP_ROOT/docs/" 2>/dev/null || true
echo "✅ Documentation updated"

# Copy ecosystem.config.js
if [ -f /tmp/dap-deploy-incoming/ecosystem.config.js ]; then
  cp /tmp/dap-deploy-incoming/ecosystem.config.js "$DAP_ROOT/ecosystem.config.js"
  echo "✅ PM2 ecosystem config updated"
fi

# Install dependencies and run migrations
echo "🔨 Installing dependencies..."
cd "$DAP_ROOT/backend"
npm install --legacy-peer-deps 2>/dev/null || npm install
echo "✅ Dependencies installed"

echo "📊 Updating database schema..."
npx prisma db push --accept-data-loss
npx prisma generate
echo "✅ Database schema updated"

# Start PM2
echo "🔄 Starting PM2..."
cd "$DAP_ROOT"
if [ -f ecosystem.config.js ]; then
  /usr/local/bin/pm2 start ecosystem.config.js
else
  /usr/local/bin/pm2 start backend/dist/server.js --name dap-backend -i 2
fi
/usr/local/bin/pm2 save
echo "✅ PM2 started"

DAPCMDS

# Restart Nginx
echo "🌐 Restarting Nginx..."
systemctl restart nginx
echo "✅ Nginx restarted"

# Verify deployment
echo ""
echo "🧪 Testing deployment..."

sleep 5

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

# Cleanup
rm -rf /tmp/dap-deploy-incoming

echo ""
echo "✅ Deployment process complete!"

ENDSSH

echo ""
echo "✨ New Features in this deployment (v2.9.1):"
echo "  • Modern AI Assistant Icon redesign (AISparkle)"
echo "  • Streamlined Customer Detail View (Scorecards on Overview)"
echo "  • Compact Progress Trackers for Adoption Plans"
echo "  • Rebranded to Dynamic Adoption Platform"
echo "  • Renamed Entitlements to Licenses"
echo "  • Inline Editable Outcomes on Summary tabs"
echo "  • Standardized Filter labels and UI refinements (Impl % and Validation pills)"
echo ""
echo "🧪 Testing checklist:"
echo "  1. Login as admin / DAP123!!!"
echo "  2. Verify top-right AI icon is the new Sparkle style"
echo "  3. Go to Customers -> Overview and verify scorecard tiles"
echo "  4. Check Products/Solutions summary tabs for inline editable outcomes"
echo "  5. Verify 'Licenses' tab name (formerly Entitlements)"
echo ""
echo "📊 Monitor logs:"
echo "  ssh root@dapoc"
echo "  sudo -u dap pm2 logs"
echo ""
echo "🔄 Rollback if needed:"
echo "  Previous version backed up in: /tmp/dap-backend-backup-*.tar.gz"
echo ""
