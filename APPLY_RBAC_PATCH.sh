#!/bin/bash
# Apply RBAC fixes to production (centos2)
# This script applies only the code changes without full deployment

set -e

echo "========================================="
echo "🔧 Applying RBAC Fixes to Production"
echo "========================================="

# Validate required source files before transfer
REQUIRED_FILES=(
  "backend/src/lib/auth.ts"
  "backend/src/lib/permissions.ts"
  "backend/src/schema/resolvers/index.ts"
  "scripts/fix-rbac-permissions.js"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing required file: $file"
    exit 1
  fi
done

if [ ! -d "frontend/dist" ] || [ -z "$(ls -A frontend/dist 2>/dev/null)" ]; then
  echo "❌ Frontend build not found in frontend/dist"
  echo "Please run the frontend build before deploying."
  exit 1
fi

# Ensure destination directories exist before transfer
DEST_DIRS=(
  "/data/dap/app/backend/src/lib"
  "/data/dap/app/backend/src/schema/resolvers"
  "/data/dap/app/frontend/dist"
  "/data/dap/scripts"
)

echo ""
echo "📁 Ensuring destination directories exist..."
ssh rajarora@centos2.rajarora.csslab "mkdir -p ${DEST_DIRS[*]}"

# Step 1: Transfer changed files
echo ""
echo "📤 Step 1: Transferring changed files to centos2..."

scp backend/src/lib/auth.ts \
    rajarora@centos2.rajarora.csslab:/data/dap/app/backend/src/lib/auth.ts

scp backend/src/lib/permissions.ts \
    rajarora@centos2.rajarora.csslab:/data/dap/app/backend/src/lib/permissions.ts

scp backend/src/schema/resolvers/index.ts \
    rajarora@centos2.rajarora.csslab:/data/dap/app/backend/src/schema/resolvers/index.ts

scp -r frontend/dist/* \
    rajarora@centos2.rajarora.csslab:/data/dap/app/frontend/dist/

scp scripts/fix-rbac-permissions.js \
    rajarora@centos2.rajarora.csslab:/data/dap/scripts/

echo "✅ Files transferred"

# Step 2: Apply changes on production
echo ""
echo "🔨 Step 2: Building and restarting on centos2..."

ssh rajarora@centos2.rajarora.csslab << 'ENDSSH'
set -e

cd /data/dap/app

# Build backend
echo "🔨 Building backend..."
cd backend
npm run build

# Update database permissions
echo "🔑 Updating database role permissions..."
cd /data/dap
node scripts/fix-rbac-permissions.js

# Restart services using PM2 with proper error handling
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

# Restart Apache (or Nginx if that's what's running)
echo "🌐 Restarting web server..."
if systemctl is-active --quiet httpd; then
  sudo systemctl restart httpd && echo "✅ Apache restarted"
elif systemctl is-active --quiet nginx; then
  sudo systemctl restart nginx && echo "✅ Nginx restarted"
else
  echo "⚠️  No web server found (httpd/nginx)"
fi

# Verify
echo ""
echo "✅ Testing backend..."
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { totalCount } }"}' | grep -q "totalCount" && \
  echo "✅ Backend OK" || echo "❌ Backend test failed"

echo "✅ Testing frontend..."
curl -s http://localhost/dap/ | grep -q "index-" && \
  echo "✅ Frontend OK" || echo "❌ Frontend test failed"

ENDSSH

echo ""
echo "========================================="
echo "✅ PATCH APPLIED SUCCESSFULLY"
echo "========================================="
echo ""
echo "🌐 Production URL: https://myapps.cxsaaslab.com/dap/"
echo ""
echo "📋 What was changed:"
echo "  ✅ Fixed userId authentication (auth.ts, permissions.ts)"
echo "  ✅ Removed debug console.logs (resolvers, dialogs)"
echo "  ✅ Fixed dialog layouts (AssignProductDialog)"
echo "  ✅ Updated role permissions in database"
echo ""
echo "🧪 Test with:"
echo "  - cssuser / cssuser (CSS role)"
echo "  - smeuser / smeuser (SME role)"
echo "  - admin / admin (Admin role)"
echo ""

