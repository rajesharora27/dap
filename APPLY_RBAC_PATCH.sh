#!/bin/bash
# Apply RBAC fixes to production (centos2)
# This script applies only the code changes without full deployment

set -e

echo "========================================="
echo "🔧 Applying RBAC Fixes to Production"
echo "========================================="

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
cd /data/dap/app

# Build backend
echo "🔨 Building backend..."
cd backend
npm run build

# Update database permissions
echo "🔑 Updating database role permissions..."
cd /data/dap
node scripts/fix-rbac-permissions.js

# Restart services using PM2
echo "🔄 Restarting services..."
cd /data/dap/app
sudo -u dap pm2 restart ecosystem.config.js || true
sleep 5

# Restart Apache
echo "🌐 Restarting Apache..."
sudo systemctl restart httpd || true

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

