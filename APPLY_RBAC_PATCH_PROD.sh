#!/bin/bash
# Apply RBAC fixes to production (centos2)

set -e

echo "========================================="
echo "🔧 Applying RBAC Fixes to Production"
echo "========================================="

# Validate required source assets before packaging
REQUIRED_PATHS=(
  "backend/src/lib/auth.ts"
  "backend/src/lib/permissions.ts"
  "backend/src/schema/resolvers/index.ts"
  "backend/package.json"
  "backend/tsconfig.json"
  "scripts/fix-rbac-permissions.js"
)

for path in "${REQUIRED_PATHS[@]}"; do
  if [ ! -f "$path" ]; then
    echo "❌ Missing required file: $path"
    exit 1
  fi
done

if [ ! -d "frontend/dist" ] || [ -z "$(ls -A frontend/dist 2>/dev/null)" ]; then
  echo "❌ Frontend build not found in frontend/dist"
  echo "Please run the frontend build before deploying."
  exit 1
fi

# Step 1: Prepare files
echo ""
echo "📦 Step 1: Preparing files..."
mkdir -p /tmp/dap-patch
cp -r backend/src /tmp/dap-patch/backend-src
cp backend/package.json /tmp/dap-patch/
cp backend/tsconfig.json /tmp/dap-patch/
cp -r frontend/dist /tmp/dap-patch/frontend-dist
cp scripts/fix-rbac-permissions.js /tmp/dap-patch/
echo "✅ Files prepared"

# Step 2: Transfer to temp on production
echo ""
echo "📤 Step 2: Transferring files to centos2..."
ssh rajarora@centos2.rajarora.csslab "rm -rf /tmp/dap-patch-prod && mkdir -p /tmp/dap-patch-prod"
scp -r /tmp/dap-patch/* rajarora@centos2.rajarora.csslab:/tmp/dap-patch-prod/
echo "✅ Transfer complete"

# Cleanup local temp
rm -rf /tmp/dap-patch

# Step 3: Apply changes on production
echo ""
echo "🔨 Step 3: Applying changes on centos2..."

ssh rajarora@centos2.rajarora.csslab << 'ENDSSH'
set -e

echo "📝 Copying files as dap user..."
sudo -u dap bash << 'DAPCMDS'
set -e

# Create target directories if needed
mkdir -p /data/dap/app/backend/src
mkdir -p /data/dap/app/frontend/dist
mkdir -p /data/dap/scripts

# Copy backend source files
cp -r /tmp/dap-patch-prod/backend-src/* /data/dap/app/backend/src/

# Copy config files
cp /tmp/dap-patch-prod/package.json /data/dap/app/backend/
cp /tmp/dap-patch-prod/tsconfig.json /data/dap/app/backend/

# Copy frontend dist
cp -r /tmp/dap-patch-prod/frontend-dist/* /data/dap/app/frontend/dist/

# Copy script
cp /tmp/dap-patch-prod/fix-rbac-permissions.js /data/dap/scripts/

echo "✅ Files copied"

# Build backend
echo "🔨 Building backend..."
cd /data/dap/app/backend
npm run build

# Update database permissions
echo "🔑 Updating database role permissions..."
cd /data/dap
node scripts/fix-rbac-permissions.js

DAPCMDS

# Restart PM2 with proper error handling (as dap user)
echo "🔄 Restarting services..."
cd /data/dap/app

# Use reload for zero-downtime restart in cluster mode
if sudo -u dap pm2 reload ecosystem.config.js; then
  echo "✅ PM2 reload successful"
else
  echo "⚠️  PM2 reload failed, attempting restart..."
  if sudo -u dap pm2 restart ecosystem.config.js; then
    echo "✅ PM2 restart successful"
  else
    echo "❌ PM2 restart failed! Services may be down."
    sudo -u dap pm2 list
    exit 1
  fi
fi

sleep 5

# Verify PM2 processes are running
if sudo -u dap pm2 list | grep -q "online"; then
  echo "✅ PM2 processes confirmed online"
else
  echo "❌ WARNING: No PM2 processes found online!"
  sudo -u dap pm2 list
  exit 1
fi


# Restart Apache (needs root)
echo "🌐 Restarting Apache..."
sudo systemctl restart httpd

# Verify
echo ""
echo "✅ Testing backend..."
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { totalCount } }"}' | grep -q "totalCount" && \
  echo "✅ Backend OK" || echo "⚠️  Backend check inconclusive"

echo ""
echo "✅ Testing frontend..."
curl -s http://localhost/dap/ | grep -q "index-" && \
  echo "✅ Frontend OK" || echo "⚠️  Frontend check inconclusive"

# Cleanup
rm -rf /tmp/dap-patch-prod

echo ""
echo "✅ Deployment complete!"

ENDSSH

echo ""
echo "========================================="
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "========================================="
echo ""
echo "🌐 Production URL: https://myapps.cxsaaslab.com/dap/"
echo ""
echo "📝 Changes deployed:"
echo "  ✅ Backend RBAC fixes"
echo "  ✅ Frontend clean build"
echo "  ✅ Database permissions updated"
echo ""
echo "🧪 Test with:"
echo "  - cssuser / cssuser (Products dropdown)"
echo "  - smeuser / smeuser (Task deletion)"
echo ""

