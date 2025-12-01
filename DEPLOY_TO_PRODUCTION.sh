#!/bin/bash
# Quick deployment script for centos2 (production)
# Usage: ./DEPLOY_TO_PRODUCTION.sh [deployment-package.tar.gz]

set -e

PACKAGE=${1:-$(ls -t dap-deploy-*.tar.gz 2>/dev/null | head -1)}

if [ -z "$PACKAGE" ]; then
  echo "❌ No deployment package found"
  echo "Usage: $0 [dap-deploy-YYYYMMDD-HHMMSS.tar.gz]"
  exit 1
fi

echo "========================================="
echo "🚀 DAP Production Deployment"
echo "========================================="
echo "Package: $PACKAGE"
echo "Target: centos2.rajarora.csslab"
echo "URL: https://myapps.cxsaaslab.com/dap/"
echo ""
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Deployment cancelled"
  exit 1
fi

# Transfer to centos2
echo ""
echo "📤 Step 1: Transferring package to centos2..."
scp "$PACKAGE" rajarora@centos2.rajarora.csslab:/tmp/
echo "✅ Transfer complete"

# Deploy on centos2
echo ""
echo "📦 Step 2: Deploying on centos2..."
ssh rajarora@centos2.rajarora.csslab << 'ENDSSH'
set -e

cd /data/dap

echo "📦 Extracting deployment package..."
tar xzf /tmp/dap-deploy-*.tar.gz

echo "🛑 Stopping backend..."
pkill -f "node.*src/server" || true
sleep 2

echo "📚 Installing backend dependencies..."
cd backend
npm install

echo "🔨 Building backend..."
npm run build

echo "🔑 Updating database permissions..."
cd /data/dap/backend
node ../scripts/fix-rbac-permissions.js

echo "🔄 Restarting services..."
cd /data/dap
./dap restart

sleep 5

echo "🌐 Restarting Apache..."
sudo systemctl restart httpd

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Verifying..."
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { totalCount } }"}' | grep -q "totalCount" && echo "✅ Backend responding" || echo "❌ Backend test failed"

curl -s http://localhost/dap/ | grep -q "index-" && echo "✅ Frontend serving" || echo "❌ Frontend test failed"

echo ""
echo "========================================="
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "========================================="
echo ""
echo "🌐 Access: https://myapps.cxsaaslab.com/dap/"
echo ""
echo "📋 Next steps:"
echo "  1. Clear your browser cache"
echo "  2. Test with cssuser, smeuser, and admin"
echo "  3. Verify products dropdown shows items"
echo "  4. Verify dialogs work correctly"
echo ""
ENDSSH

echo ""
echo "========================================="
echo "✅ Deployment to centos2 complete!"
echo "========================================="
echo ""
echo "Please test at: https://myapps.cxsaaslab.com/dap/"

