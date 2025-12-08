#!/bin/bash
# =============================================================================
# Build DAP for Apache deployment
# =============================================================================
# Usage: ./scripts/build-for-apache.sh [development|production]
# =============================================================================

set -e

ENV=${1:-production}
DAP_ROOT="/data/dap"

echo "======================================"
echo "Building DAP for Apache"
echo "Environment: $ENV"
echo "Base Path: /dap/"
echo "======================================"
echo ""

# Step 1: Setup environment
echo "📋 Step 1: Setting up environment..."
$DAP_ROOT/scripts/setup-env.sh $ENV
echo ""

# Step 2: Build backend
echo "📦 Step 2: Building backend..."
cd $DAP_ROOT/backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

npm run build
echo "✅ Backend built"
echo ""

# Step 3: Build frontend
echo "📦 Step 3: Building frontend..."
cd $DAP_ROOT/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Create environment configuration for build
echo "Creating build-time environment configuration..."
cat > .env.production.local << ENVFILE
VITE_GRAPHQL_ENDPOINT=/dap/graphql
VITE_API_ENDPOINT=/dap/api
VITE_BASE_PATH=/dap/
ENVFILE

# Build with base path
npm run build -- --base=/dap/
echo "✅ Frontend built"
echo ""

# Step 4: Summary
echo "======================================"
echo "✅ Build Complete!"
echo "======================================"
echo ""
echo "Environment: $ENV"
echo "Backend dist: $DAP_ROOT/backend/dist/"
echo "Frontend dist: $DAP_ROOT/frontend/dist/"
echo ""
echo "To deploy locally:"
echo "  sudo cp -r $DAP_ROOT/frontend/dist/* /var/www/html/dap/"
echo "  sudo systemctl reload httpd"
echo ""
echo "To deploy to production:"
echo "  $DAP_ROOT/deploy-to-production.sh"
echo ""
