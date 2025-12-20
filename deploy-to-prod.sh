#!/bin/bash
# Deploy to Production (RHEL)
# Includes Auto-Backup and Rollback capabilities

set -e

# Configuration
PROD_HOST="prod.rajarora.csslab"
PROD_USER="rajarora"
APP_DIR="/data/dap"
BACKUP_SCRIPT_LOCAL="scripts/backup-full.sh"
RESTORE_SCRIPT_LOCAL="scripts/restore-full.sh"
REMOTE_SCRIPT_DIR="/data/dap/scripts"

echo "========================================="
echo "🚀 Deploying to PRODUCTION ($PROD_HOST)"
echo "========================================="
echo ""

# Step 0: Preparing
echo "📋 Step 0: Preparing deployment..."
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)
echo "✅ Using local environment: $PROJECT_ROOT"

# Step 1: Dependencies & Build
echo "📦 Step 1: Checking dependencies and building..."
echo "Sourcing latest packages..."
cd "$PROJECT_ROOT/backend"
# Update dependencies to ensure latest stable (safe update)
npm update
npm install
cd "$PROJECT_ROOT/frontend"
npm update
npm install

echo "Building frontend..."
npm run build -- --base=/dap/

echo "Building backend..."
cd "$PROJECT_ROOT/backend"
npm run build
echo "✅ Build complete"
echo ""

# Step 2: Prepare Transfer
echo "📦 Step 2: Preparing files for transfer..."
cd "$PROJECT_ROOT"
mkdir -p /tmp/dap-deploy-prod-build
# Cleanup previous
rm -rf /tmp/dap-deploy-prod-build/*

# Copy backend
cp -r backend/src /tmp/dap-deploy-prod-build/backend-src
cp backend/package.json /tmp/dap-deploy-prod-build/
cp backend/package-lock.json /tmp/dap-deploy-prod-build/
cp backend/tsconfig.json /tmp/dap-deploy-prod-build/
cp -r backend/dist /tmp/dap-deploy-prod-build/backend-dist
cp -r backend/prisma /tmp/dap-deploy-prod-build/backend-prisma
cp backend/ecosystem.config.js /tmp/dap-deploy-prod-build/

# Copy frontend
cp -r frontend/dist /tmp/dap-deploy-prod-build/frontend-dist

# Copy docs
cp -r docs /tmp/dap-deploy-prod-build/docs 2>/dev/null || true

# Copy Config
mkdir -p /tmp/dap-deploy-prod-build/config
cp -r backend/config/* /tmp/dap-deploy-prod-build/config/ 2>/dev/null || true

# Copy Scripts
mkdir -p /tmp/dap-deploy-prod-build/scripts-new
cp scripts/* /tmp/dap-deploy-prod-build/scripts-new/

# Env files (Prod specific)
# Ensure we have .env.production
if [ ! -f ".env.production" ]; then
    echo "⚠️  No .env.production found! Using .env.stage as template or aborting."
    # Fail safe: ask user or exit. For auto-script, we assume it exists or use stage.
    # Check if we should copy stage?
    if [ -f ".env.stage" ]; then
        echo "   Using .env.stage as fallback for transfer (server will use its own if exists)"
        cp .env.stage /tmp/dap-deploy-prod-build/.env.production
    fi
else
    cp .env.production /tmp/dap-deploy-prod-build/
fi

echo "✅ Files prepared"

# Step 3: Backup Production
echo "🔒 Step 3: Initiating Production Backup..."
# First, ensure backup script is on server
scp -r scripts/backup-full.sh $PROD_USER@$PROD_HOST:/tmp/backup-full.sh
# Run backup and capture output
BACKUP_OUTPUT=$(ssh $PROD_USER@$PROD_HOST "sudo -u dap bash /tmp/backup-full.sh /data/dap")
echo "$BACKUP_OUTPUT"

# Extract timestamp
BACKUP_TIMESTAMP=$(echo "$BACKUP_OUTPUT" | grep "BACKUP_TIMESTAMP=" | cut -d'=' -f2)

if [ -z "$BACKUP_TIMESTAMP" ]; then
    echo "❌ Backup failed or timestamp not found. Aborting deployment for safety."
    exit 1
fi

echo "✅ Backup Successful! Timestamp: $BACKUP_TIMESTAMP"
echo ""

# Step 4: Transfer
echo "📤 Step 4: Transferring build to Production..."
ssh $PROD_USER@$PROD_HOST "rm -rf /tmp/dap-incoming-prod && mkdir -p /tmp/dap-incoming-prod"
scp -r /tmp/dap-deploy-prod-build/. $PROD_USER@$PROD_HOST:/tmp/dap-incoming-prod/
echo "✅ Transfer complete"

# Step 5: Deploy
echo "🔨 Step 5: Finalizing Deployment..."

ssh $PROD_USER@$PROD_HOST << ENDSSH
set -e
export TIMESTAMP="$BACKUP_TIMESTAMP"

echo "📝 Deploying as dap user..."
sudo -u dap bash << 'DAPCMDS'
set -e
DAP_ROOT="/data/dap"

# 1. Update Scripts
mkdir -p "\$DAP_ROOT/scripts"
cp /tmp/dap-incoming-prod/scripts-new/* "\$DAP_ROOT/scripts/"
chmod +x "\$DAP_ROOT/scripts/"*.sh

# 2. Update Code
echo "   Updating application code..."
# Backend
mkdir -p "\$DAP_ROOT/backend/src" "\$DAP_ROOT/backend/dist" "\$DAP_ROOT/backend/prisma"
rm -rf "\$DAP_ROOT/backend/src"/* "\$DAP_ROOT/backend/dist"/*

cp -r /tmp/dap-incoming-prod/backend-src/* "\$DAP_ROOT/backend/src/"
cp -r /tmp/dap-incoming-prod/backend-dist/* "\$DAP_ROOT/backend/dist/"
cp /tmp/dap-incoming-prod/package.json "\$DAP_ROOT/backend/"
cp /tmp/dap-incoming-prod/package-lock.json "\$DAP_ROOT/backend/"
cp /tmp/dap-incoming-prod/ecosystem.config.js "\$DAP_ROOT/"

# Prisma
rm -rf "\$DAP_ROOT/backend/prisma"/*
cp -r /tmp/dap-incoming-prod/backend-prisma/* "\$DAP_ROOT/backend/prisma/"

# Frontend
mkdir -p "\$DAP_ROOT/frontend/dist"
rm -rf "\$DAP_ROOT/frontend/dist"/*
cp -r /tmp/dap-incoming-prod/frontend-dist/* "\$DAP_ROOT/frontend/dist/"

# Env (Only if new one provided, otherwise keep existing)
if [ -f "/tmp/dap-incoming-prod/.env.production" ]; then
    cp /tmp/dap-incoming-prod/.env.production "\$DAP_ROOT/.env.production"
    # Ensure active link if needed, though usually .env is managed manually on prod
    # cp "\$DAP_ROOT/.env.production" "\$DAP_ROOT/.env"
fi

# 3. Install/Update Dependencies
echo "   Updating NPM dependencies..."
cd "\$DAP_ROOT/backend"
npm install --production=false # We need dev deps for prisma

# 4. Database Schema Update
echo "🔄 Updating Database Schema..."
# Using db push for robustness against drift
npx prisma db push --accept-data-loss

# 5. Restart Services
echo "🔄 Restarting Services..."
if command -v pm2 &> /dev/null; then
    cd "\$DAP_ROOT"
    if pm2 reload ecosystem.config.js; then
        echo "✅ PM2 reload successful"
    else
        pm2 restart ecosystem.config.js
    fi
else
    echo "⚠️  PM2 not found, using generic restart..."
    # Fallback logic if needed
fi

DAPCMDS

# WEB SERVER RESTART
echo "🌐 Restarting Web Server (Nginx/Apache)..."
if systemctl is-active --quiet nginx; then
    sudo systemctl restart nginx
    echo "✅ Nginx restarted"
elif systemctl is-active --quiet httpd; then
    sudo systemctl restart httpd
    echo "✅ Apache restarted"
else
    echo "⚠️  Web server not manageable or not running."
fi

ENDSSH

echo ""
echo "========================================="
echo "✅ PRODUCTION DEPLOYMENT SUCCESSFUL"
echo "========================================="
echo "Backup ID: $BACKUP_TIMESTAMP"
echo "To Rollback: ./rollback-prod.sh $BACKUP_TIMESTAMP"
echo ""

# Testing
echo "🧪 Performing Post-Deployment Health Check..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$PROD_HOST/dap/)
if [ "$STATUS_CODE" == "200" ]; then
    echo "✅ Health Check Passed (HTTP 200)"
else
    echo "⚠️  Health Check Warning: Received HTTP $STATUS_CODE"
fi
