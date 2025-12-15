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

# Copy backend (excluding node_modules, dist)
echo "  Copying backend..."
rsync -a --exclude 'node_modules' --exclude 'dist' --exclude '*.log' \
    "${SOURCE_DIR}/backend/" "$PACKAGE_DIR/backend/"

# Copy frontend (excluding node_modules, dist)
echo "  Copying frontend..."
rsync -a --exclude 'node_modules' --exclude 'dist' --exclude '*.log' \
    "${SOURCE_DIR}/frontend/" "$PACKAGE_DIR/frontend/"

# Copy scripts
echo "  Copying scripts..."
mkdir -p "$PACKAGE_DIR/scripts"
cp "${SCRIPT_DIR}/deploy-to-mac.sh" "$PACKAGE_DIR/scripts/"

# Create Mac-specific .env
cat > "$PACKAGE_DIR/.env" << 'ENVFILE'
# DAP Mac Local Environment
NODE_ENV=development

# Database - Local PostgreSQL
DATABASE_URL="postgresql://localhost:5432/dap_mac?schema=public"

# API Server
API_PORT=4000
API_HOST=0.0.0.0

# Frontend
FRONTEND_PORT=5173
FRONTEND_HOST=0.0.0.0
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_API_URL=http://localhost:4000
VITE_BASE_PATH=/

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
ENVFILE

cp "$PACKAGE_DIR/.env" "$PACKAGE_DIR/backend/.env"
cp "$PACKAGE_DIR/.env" "$PACKAGE_DIR/frontend/.env"

# Create setup script for Mac
cat > "$PACKAGE_DIR/setup-mac.sh" << 'SETUPSCRIPT'
#!/bin/bash
# DAP Mac Setup Script - Run this after extracting the package
set -e

echo "🍎 Setting up DAP on Mac..."

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

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install --legacy-peer-deps

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
npx prisma generate
npx prisma db push --skip-generate
npm run seed 2>/dev/null || echo "  Seed data already exists"

# Build backend
echo "🔨 Building backend..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start: ./dap start"
echo "Access:   http://localhost:5173"
SETUPSCRIPT
chmod +x "$PACKAGE_DIR/setup-mac.sh"

# Create management script
cat > "$PACKAGE_DIR/dap" << 'DAPSCRIPT'
#!/bin/bash
# DAP Mac Management Script
DAP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DAP_DIR"

BACKEND_PID_FILE="$DAP_DIR/.backend.pid"
FRONTEND_PID_FILE="$DAP_DIR/.frontend.pid"

start_backend() {
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 $(cat "$BACKEND_PID_FILE") 2>/dev/null; then
        echo "Backend already running (PID: $(cat $BACKEND_PID_FILE))"
        return
    fi
    echo "Starting backend..."
    cd "$DAP_DIR/backend"
    nohup node dist/server.js > "$DAP_DIR/backend.log" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    sleep 2
    if kill -0 $(cat "$BACKEND_PID_FILE") 2>/dev/null; then
        echo "✓ Backend started (PID: $(cat $BACKEND_PID_FILE))"
    else
        echo "✗ Backend failed to start"
        rm -f "$BACKEND_PID_FILE"
    fi
}

start_frontend() {
    if [ -f "$FRONTEND_PID_FILE" ] && kill -0 $(cat "$FRONTEND_PID_FILE") 2>/dev/null; then
        echo "Frontend already running (PID: $(cat $FRONTEND_PID_FILE))"
        return
    fi
    echo "Starting frontend..."
    cd "$DAP_DIR/frontend"
    nohup npm run dev > "$DAP_DIR/frontend.log" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    sleep 3
    if kill -0 $(cat "$FRONTEND_PID_FILE") 2>/dev/null; then
        echo "✓ Frontend started (PID: $(cat $FRONTEND_PID_FILE))"
    else
        echo "✗ Frontend failed to start"
        rm -f "$FRONTEND_PID_FILE"
    fi
}

stop_backend() {
    if [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping backend (PID: $PID)..."
            kill $PID 2>/dev/null
            sleep 2
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    pkill -f "node dist/server.js" 2>/dev/null || true
    echo "✓ Backend stopped"
}

stop_frontend() {
    if [ -f "$FRONTEND_PID_FILE" ]; then
        PID=$(cat "$FRONTEND_PID_FILE")
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping frontend (PID: $PID)..."
            kill $PID 2>/dev/null
            sleep 2
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    pkill -f "vite" 2>/dev/null || true
    echo "✓ Frontend stopped"
}

status() {
    echo "=== DAP Mac Status ==="
    if [ -f "$BACKEND_PID_FILE" ] && kill -0 $(cat "$BACKEND_PID_FILE") 2>/dev/null; then
        echo "Backend:  ✓ Running (PID: $(cat $BACKEND_PID_FILE)) - http://localhost:4000/graphql"
    else
        echo "Backend:  ✗ Stopped"
    fi
    if [ -f "$FRONTEND_PID_FILE" ] && kill -0 $(cat "$FRONTEND_PID_FILE") 2>/dev/null; then
        echo "Frontend: ✓ Running (PID: $(cat $FRONTEND_PID_FILE)) - http://localhost:5173"
    else
        echo "Frontend: ✗ Stopped"
    fi
}

case "$1" in
    start)
        start_backend
        start_frontend
        echo ""
        echo "🍎 DAP is running! Open: http://localhost:5173"
        echo "   Credentials: admin/admin123, smeuser/sme123, cssuser/css123"
        ;;
    stop)
        stop_frontend
        stop_backend
        ;;
    restart)
        stop_frontend
        stop_backend
        sleep 2
        start_backend
        start_frontend
        ;;
    status)
        status
        ;;
    logs)
        if [ "$2" = "backend" ]; then
            tail -f "$DAP_DIR/backend.log"
        elif [ "$2" = "frontend" ]; then
            tail -f "$DAP_DIR/frontend.log"
        else
            echo "=== Backend (last 20 lines) ==="
            tail -20 "$DAP_DIR/backend.log" 2>/dev/null || echo "(no logs)"
            echo ""
            echo "=== Frontend (last 20 lines) ==="
            tail -20 "$DAP_DIR/frontend.log" 2>/dev/null || echo "(no logs)"
        fi
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
echo -e "${GREEN}✅ Package created: /tmp/dap-mac-package.tar.gz${NC}"
echo ""
echo -e "${BLUE}To deploy to your Mac:${NC}"
echo "1. Copy the package to your Mac:"
echo "   scp rajarora@$(hostname):/tmp/dap-mac-package.tar.gz ~/"
echo ""
echo "2. On your Mac, extract and setup:"
echo "   mkdir -p ~/dap && cd ~/dap"
echo "   tar -xzf ~/dap-mac-package.tar.gz"
echo "   ./setup-mac.sh"
echo ""
echo "3. Start the app:"
echo "   ./dap start"
echo ""
