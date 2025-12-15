#!/bin/bash
#
# Deploy DAP to MacBook for Demo/Backup
# This script creates a portable tarball package containing:
#   - Backend code
#   - Frontend code
#   - Setup scripts (with Mac-specific fixes)
#   - Management script
#
# Usage:
#   ./scripts/deploy-to-mac.sh
#
# Output:
#   /tmp/dap-mac-package.tar.gz
#
# Deployment:
#   1. Copy the tarball to your Mac: scp user@dev:/tmp/dap-mac-package.tar.gz .
#   2. Extract and run setup: ./setup-mac.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}🍎 DAP Mac Package Generator${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

echo -e "${YELLOW}📦 Creating portable deployment package...${NC}"

PACKAGE_DIR="/tmp/dap-mac-package"
PACKAGE_FILE="/tmp/dap-mac-package.tar.gz"

rm -rf "$PACKAGE_DIR" "$PACKAGE_FILE"
mkdir -p "$PACKAGE_DIR"

# Copy backend (excluding node_modules, dist, and dev-only files)
echo "  Copying backend..."
rsync -a --exclude 'node_modules' --exclude 'dist' --exclude '*.log' \
    --exclude 'src/__tests__' --exclude 'src/devtools-service.ts' \
    --exclude 'src/api/devTools.ts' \
    "${SOURCE_DIR}/backend/" "$PACKAGE_DIR/backend/"

# Create dummy devTools.ts to satisfy build imports
cat > "$PACKAGE_DIR/backend/src/api/devTools.ts" << 'DUMMYDEV'
import express from 'express';
const router = express.Router();

// Dummy implementation for production-like builds
// Must match signature: (level: string, message: string)
export const addLogEntry = (_level: string, _message: string) => {};
export default router;
DUMMYDEV

# Copy frontend (excluding node_modules, dist)
# We include dev source files to allow build to succeed (App.tsx imports them)
# runtime config ENABLE_DEV_TOOLS=false will hide them
echo "  Copying frontend..."
rsync -a --exclude 'node_modules' --exclude 'dist' --exclude '*.log' \
    "${SOURCE_DIR}/frontend/" "$PACKAGE_DIR/frontend/"

# Copy scripts
echo "  Copying scripts..."
mkdir -p "$PACKAGE_DIR/scripts"
cp "${SCRIPT_DIR}/deploy-to-mac.sh" "$PACKAGE_DIR/scripts/"

# Create Mac-specific .env (PRODUCTION LIKE)
cat > "$PACKAGE_DIR/.env" << 'ENVFILE'
# DAP Mac Local Environment (Production Mode)
NODE_ENV=production

# Database - Local PostgreSQL
DATABASE_URL="postgresql://localhost:5432/dap_mac?schema=public"

# API Server
API_PORT=4000
API_HOST=0.0.0.0

# Frontend
FRONTEND_PORT=5173
FRONTEND_HOST=0.0.0.0
# In prod mode, these are baked into the build, but good to have for ref
VITE_GRAPHQL_URL=http://localhost:4000/dap/graphql
VITE_API_URL=http://localhost:4000/dap/api
VITE_BASE_PATH=/dap/

# JWT Auth
JWT_SECRET=mac-demo-jwt-secret-change-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=mac-demo-refresh-secret-change-in-production
REFRESH_TOKEN_EXPIRES_IN=7d

# Session
SESSION_SECRET=mac-demo-session-secret

# AI Provider (set your API key if needed)
AI_PROVIDER=mock

# Backup Directory
BACKUP_DIR=./backups

# Logging
LOG_LEVEL=info

# Disable DevTools
ENABLE_DEV_TOOLS=false
ENVFILE

cp "$PACKAGE_DIR/.env" "$PACKAGE_DIR/backend/.env"
cp "$PACKAGE_DIR/.env" "$PACKAGE_DIR/frontend/.env"

# Create setup script for Mac
cat > "$PACKAGE_DIR/setup-mac.sh" << 'SETUPSCRIPT'
#!/bin/bash
# DAP Mac Setup Script - Run this after extracting the package
set -e

echo "🍎 Setting up DAP on Mac (Production Mode)..."

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install with: brew install node@22"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Install with: brew install postgresql@14"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "⚠️  Node.js version is $NODE_VERSION. Version 22+ recommended."
fi

# Install dependencies (production only)
echo "📦 Installing backend dependencies..."
cd backend
# Clean slate to avoid ENOTEMPTY errors
rm -rf node_modules
# Use ci to respect lockfile versions exactly
npm ci --legacy-peer-deps --omit=dev

# Force install specific Prisma version to avoid v7 breaking changes
npm install prisma@6.14.0 --save-dev --legacy-peer-deps

echo "📦 Installing frontend dependencies..."
cd ../frontend
rm -rf node_modules
npm ci --legacy-peer-deps

# Setup database
echo "🗄️  Setting up database..."
cd ../backend

# Fix DATABASE_URL to include current user (fixes P1010 error)
CURRENT_USER=$(whoami)
echo "  Configuring database access for user: $CURRENT_USER"

# Update .env files (handle Mac specific sed)
sed -i '' "s|postgresql://localhost|postgresql://$CURRENT_USER@localhost|g" .env
sed -i '' "s|postgresql://localhost|postgresql://$CURRENT_USER@localhost|g" ../frontend/.env

createdb dap_mac 2>/dev/null || echo "  Database 'dap_mac' already exists"

# Use explicit local binary to ensure we don't accidentally use global v7+
PRISMA_BIN="./node_modules/.bin/prisma"

$PRISMA_BIN generate
$PRISMA_BIN db push --skip-generate
npm run seed 2>/dev/null || echo "  Seed data already exists"

# Build backend
echo "🔨 Building backend..."
npm run build

# Build frontend
echo "🔨 Building frontend..."
cd ../frontend
# Explicitly force production mode to ensure dev tools are hidden
# (ignoring the .env warning)
npx vite build --mode production --base=/dap/

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start: ./dap start"
echo "Access:   http://localhost:4000/dap/"
SETUPSCRIPT
chmod +x "$PACKAGE_DIR/setup-mac.sh"

# Create management script (PRODUCTION MODE)
cat > "$PACKAGE_DIR/dap" << 'DAPSCRIPT'
#!/bin/bash
# DAP Mac Management Script (Production Mode)
DAP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DAP_DIR"

BACKEND_PID_FILE="$DAP_DIR/.backend.pid"

start() {
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 $(cat "$BACKEND_PID_FILE") 2>/dev/null; then
        echo "DAP Service already running (PID: $(cat $BACKEND_PID_FILE))"
        return
    fi
    echo "Starting DAP Service (Backend + Frontend)..."
    cd "$DAP_DIR/backend"
    # Ensure frontend build exists in backend/public/dist or similar if needed
    # (Assuming backend is configured to serve frontend in prod)
    
    nohup node dist/server.js > "$DAP_DIR/dap.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    sleep 2
    if kill -0 $(cat "$BACKEND_PID_FILE") 2>/dev/null; then
        echo "✓ DAP Service started (PID: $(cat $BACKEND_PID_FILE))"
        echo "🌐 Access at: http://localhost:4000/dap/"
    else
        echo "✗ DAP Service failed to start"
        rm -f "$BACKEND_PID_FILE"
    fi
}

stop() {
    if [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping DAP Service (PID: $PID)..."
            kill $PID 2>/dev/null
            sleep 2
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    pkill -f "node dist/server.js" 2>/dev/null || true
    echo "✓ DAP Service stopped"
}

status() {
    echo "=== DAP Mac Status ==="
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 $(cat "$BACKEND_PID_FILE") 2>/dev/null; then
        echo "Status:  ✓ Running (PID: $(cat $BACKEND_PID_FILE))"
        echo "URL:     http://localhost:4000/dap/"
    else
        echo "Status:  ✗ Stopped"
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    logs)
        tail -f "$DAP_DIR/dap.log"
        ;;
    *)
        echo "Usage: ./dap [start|stop|restart|status|logs]"
        ;;
esac
DAPSCRIPT
chmod +x "$PACKAGE_DIR/dap"

# Create tarball
echo "  Creating archive..."
cd /tmp
tar -czf dap-mac-package.tar.gz -C "$PACKAGE_DIR" .

echo ""
echo -e "${GREEN}✅ Production-like Package created: /tmp/dap-mac-package.tar.gz${NC}"
echo ""
echo -e "${BLUE}To deploy on your Mac:${NC}"
echo "Create a script 'deploy_dap.sh' on your Mac with this content:"
echo "--------------------------------------------------------"
echo "#!/bin/bash"
echo "# Aggressively stop existing processes on ports 4000 and 5173"
echo "lsof -ti:4000 | xargs kill -9 2>/dev/null || true"
echo "lsof -ti:5173 | xargs kill -9 2>/dev/null || true"
echo ""
echo "scp rajarora@$(hostname):/tmp/dap-mac-package.tar.gz ~/"
echo "rm -rf ~/dap"
echo "mkdir -p ~/dap && cd ~/dap"
echo "tar -xzf ~/dap-mac-package.tar.gz"
echo "./setup-mac.sh"
echo "--------------------------------------------------------"
echo ""
echo "Then run it: ./deploy_dap.sh"
echo "Finally start app: cd ~/dap && ./dap start"
echo ""
