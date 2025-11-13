#!/bin/bash
# DAP Application - Start All Services
# Usage: ./START_SERVICES.sh

set -e

echo "======================================"
echo "Starting DAP Application Services"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Start PostgreSQL (Docker)
echo -e "${YELLOW}1. Starting PostgreSQL...${NC}"
cd /data/dap
if podman ps -a | grep -q dap_db_1; then
    if podman ps | grep -q dap_db_1; then
        echo -e "${GREEN}   ✓ PostgreSQL already running${NC}"
    else
        podman start dap_db_1
        echo -e "${GREEN}   ✓ PostgreSQL started${NC}"
    fi
else
    echo -e "${YELLOW}   Starting database with docker-compose...${NC}"
    podman-compose up -d db
    echo -e "${GREEN}   ✓ PostgreSQL started${NC}"
fi

# Wait for PostgreSQL to be ready
echo "   Waiting for database to be ready..."
sleep 5

# 2. Check Apache
echo ""
echo -e "${YELLOW}2. Checking Apache...${NC}"
if systemctl is-active --quiet httpd; then
    echo -e "${GREEN}   ✓ Apache is running${NC}"
else
    echo -e "${RED}   ✗ Apache is not running${NC}"
    echo "   Start with: sudo systemctl start httpd"
fi

# 3. Start Backend
echo ""
echo -e "${YELLOW}3. Starting Backend...${NC}"
if pgrep -f "node.*backend" > /dev/null; then
    echo -e "${GREEN}   ✓ Backend already running${NC}"
else
    cd /data/dap/backend
    nohup npm start > backend.log 2>&1 &
    echo "   Waiting for backend to start..."
    sleep 5
    
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✓ Backend started successfully${NC}"
    else
        echo -e "${RED}   ✗ Backend failed to start${NC}"
        echo "   Check logs: tail -f /data/dap/backend/backend.log"
    fi
fi

echo ""
echo "======================================"
echo -e "${GREEN}Service Status Summary${NC}"
echo "======================================"
echo ""

# Check all services
PSQL_STATUS=$(podman ps | grep -q postgres && echo "✓ Running" || echo "✗ Stopped")
HTTPD_STATUS=$(systemctl is-active --quiet httpd && echo "✓ Running" || echo "✗ Stopped")
BACKEND_STATUS=$(curl -s http://localhost:4000/health > /dev/null 2>&1 && echo "✓ Running" || echo "✗ Stopped")

echo "PostgreSQL: $PSQL_STATUS"
echo "Apache:     $HTTPD_STATUS"
echo "Backend:    $BACKEND_STATUS"

echo ""
echo "Access your application at:"
echo "  http://myapps.rajarora.csslab/dap/"
echo "  http://centos1.rajarora.csslab/dap/"
echo "  http://172.22.156.32/dap/"
echo "  https://myapps.cxsaaslab.com/dap/"
echo ""
echo "Login: admin / DAP123"
echo ""

