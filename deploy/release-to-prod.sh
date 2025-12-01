#!/bin/bash
# Deploy Release to Production (centos2)
# Usage: ./release-to-prod.sh <release-package.tar.gz>

set -e

RELEASE_PACKAGE=$1
PROD_SERVER="centos2.rajarora.csslab"
PROD_USER="rajarora"
PROD_PATH="/data/dap"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$RELEASE_PACKAGE" ]; then
  echo -e "${RED}❌ Error: No release package specified${NC}"
  echo "Usage: $0 <release-package.tar.gz>"
  echo ""
  echo "Available releases:"
  ls -lh releases/*.tar.gz 2>/dev/null || echo "  (none)"
  exit 1
fi

if [ ! -f "$RELEASE_PACKAGE" ]; then
  echo -e "${RED}❌ Error: Release package not found: $RELEASE_PACKAGE${NC}"
  exit 1
fi

PACKAGE_NAME=$(basename "$RELEASE_PACKAGE")

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}🚀 DAP Production Deployment${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "📦 Package: $PACKAGE_NAME"
echo "🎯 Target: ${PROD_USER}@${PROD_SERVER}"
echo "📂 Path: ${PROD_PATH}"
echo "🌐 URL: https://myapps.cxsaaslab.com/dap/"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will update production!${NC}"
echo ""
read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Deployment cancelled"
  exit 0
fi

# Step 1: Transfer package
echo ""
echo -e "${GREEN}[1/7]${NC} Transferring release package to production..."
scp "$RELEASE_PACKAGE" "${PROD_USER}@${PROD_SERVER}:/tmp/"
echo "✅ Transfer complete"

# Step 2: Create backup on production
echo ""
echo -e "${GREEN}[2/7]${NC} Creating production backup..."
ssh "${PROD_USER}@${PROD_SERVER}" << 'ENDSSH'
set -e
cd /data/dap

# Ensure backend is running
if ! pgrep -f "node.*src/server" > /dev/null; then
  echo "Starting backend for backup..."
  nohup npm --prefix backend start > backend.log 2>&1 &
  sleep 5
fi

# Create backup via GraphQL
BACKUP_RESULT=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createBackup { success filename message } }"}')

echo "Backup result: $BACKUP_RESULT"

if echo "$BACKUP_RESULT" | grep -q '"success":true'; then
  echo "✅ Production backup created"
else
  echo "⚠️  Backup may have failed, but continuing..."
fi
ENDSSH

# Step 3: Extract and deploy
echo ""
echo -e "${GREEN}[3/7]${NC} Extracting release on production..."
ssh "${PROD_USER}@${PROD_SERVER}" << ENDSSH
set -e
cd /data/dap

echo "Extracting /tmp/$PACKAGE_NAME..."
tar xzf /tmp/$PACKAGE_NAME --strip-components=1

echo "✅ Files extracted"
ENDSSH

# Step 4: Build backend
echo ""
echo -e "${GREEN}[4/7]${NC} Building backend on production..."
ssh "${PROD_USER}@${PROD_SERVER}" << 'ENDSSH'
set -e
cd /data/dap/backend

echo "Running npm install (if needed)..."
npm install --production > /dev/null 2>&1

echo "Building TypeScript..."
npm run build

echo "✅ Backend built"
ENDSSH

# Step 5: Update database (if migration scripts exist)
echo ""
echo -e "${GREEN}[5/7]${NC} Applying database changes..."
ssh "${PROD_USER}@${PROD_SERVER}" << 'ENDSSH'
set -e
cd /data/dap

# Check if RBAC permissions script exists and run it
if [ -f "scripts/fix-rbac-permissions.js" ]; then
  echo "Updating role permissions..."
  cd backend
  node ../scripts/fix-rbac-permissions.js
  echo "✅ Database permissions updated"
else
  echo "ℹ️  No database migration scripts in this release"
fi
ENDSSH

# Step 6: Restart services
echo ""
echo -e "${GREEN}[6/7]${NC} Restarting services on production..."
ssh "${PROD_USER}@${PROD_SERVER}" << 'ENDSSH'
set -e
cd /data/dap

echo "Stopping backend..."
pkill -f "node.*src/server" || true
sleep 2

echo "Starting backend..."
nohup npm --prefix backend start > backend.log 2>&1 &
sleep 5

echo "Restarting Apache..."
sudo systemctl restart httpd

echo "✅ Services restarted"
ENDSSH

# Step 7: Verify deployment
echo ""
echo -e "${GREEN}[7/7]${NC} Verifying deployment..."
ssh "${PROD_USER}@${PROD_SERVER}" << 'ENDSSH'
set -e

echo "Testing backend GraphQL..."
BACKEND_TEST=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}')

if echo "$BACKEND_TEST" | grep -q '"__typename"'; then
  echo "✅ Backend responding"
else
  echo "❌ Backend test failed: $BACKEND_TEST"
  exit 1
fi

echo "Testing products query..."
PRODUCTS_TEST=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { totalCount } }"}')

if echo "$PRODUCTS_TEST" | grep -q '"totalCount"'; then
  echo "✅ Products query working"
else
  echo "❌ Products query failed: $PRODUCTS_TEST"
  exit 1
fi

echo "Testing frontend..."
FRONTEND_TEST=$(curl -s http://localhost/dap/ | grep -o 'index-[^.]*\.js')

if [ -n "$FRONTEND_TEST" ]; then
  echo "✅ Frontend serving: $FRONTEND_TEST"
else
  echo "❌ Frontend test failed"
  exit 1
fi

ENDSSH

# Success!
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "🌐 Production URL: https://myapps.cxsaaslab.com/dap/"
echo ""
echo "📋 Post-Deployment Tasks:"
echo "  1. Clear browser cache or use:"
echo "     https://myapps.cxsaaslab.com/dap/force-refresh.html"
echo ""
echo "  2. Test with all user roles:"
echo "     - admin / admin"
echo "     - cssuser / cssuser"
echo "     - smeuser / smeuser"
echo ""
echo "  3. Monitor logs for 30 minutes:"
echo "     ssh ${PROD_USER}@${PROD_SERVER}"
echo "     tail -f /data/dap/backend.log"
echo ""
echo "  4. Notify users deployment is complete"
echo ""
echo "📁 Release package: $PACKAGE_NAME"
echo "📝 Version: $VERSION"
echo ""

# Log deployment
echo "$RELEASE_DATE | $VERSION | $PACKAGE_NAME | SUCCESS" >> /data/dap/deploy/deployment-history.log

echo -e "${GREEN}✅ Done!${NC}"

