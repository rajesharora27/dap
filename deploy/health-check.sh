#!/bin/bash
# Production Health Check
# Comprehensive health and readiness checks

set -e

PROD_SERVER="centos2.rajarora.csslab"
PROD_USER="rajarora"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "========================================="
echo "DAP Production Health Check"
echo "========================================="
echo ""

# Run checks on production
ssh ${PROD_USER}@${PROD_SERVER} << 'ENDSSH'
#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

check_pass() { echo -e "  ${GREEN}✓${NC} $1"; ((PASSED++)); }
check_fail() { echo -e "  ${RED}✗${NC} $1"; ((FAILED++)); }
check_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; ((WARNINGS++)); }

echo "1. Backend Services"
echo "-------------------"

# Check PM2 processes
PM2_COUNT=$(sudo -u dap pm2 list 2>/dev/null | grep -c "online.*dap-backend" || echo 0)
PM2_COUNT=$(echo "$PM2_COUNT" | tr -d '\n' | xargs)
if [ -n "$PM2_COUNT" ] && [ "$PM2_COUNT" -ge 2 ]; then
    check_pass "Backend instances running ($PM2_COUNT)"
else
    check_fail "Backend instances ($PM2_COUNT < 2)"
fi

# Check backend response
BACKEND_RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | grep -c "__typename" || echo 0)

if [ "$BACKEND_RESPONSE" -gt 0 ]; then
    check_pass "Backend GraphQL responding"
else
    check_fail "Backend GraphQL not responding"
fi

# Check backend products query
PRODUCTS_RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { totalCount } }"}' | grep -c "totalCount" || echo 0)

if [ "$PRODUCTS_RESPONSE" -gt 0 ]; then
    check_pass "Backend data queries working"
else
    check_fail "Backend data queries failing"
fi

echo ""
echo "2. Frontend"
echo "-----------"

# Check frontend serving
FRONTEND_BUNDLE=$(curl -s http://localhost/dap/ | grep -o 'index-[^.]*\.js' | head -1)
if [ -n "$FRONTEND_BUNDLE" ]; then
    check_pass "Frontend bundle: $FRONTEND_BUNDLE"
else
    check_fail "Frontend not serving correctly"
fi

# Check frontend assets
FRONTEND_ASSETS=$(curl -s -I http://localhost/dap/assets/ 2>/dev/null | grep -c "200 OK" || echo 0)
if [ "$FRONTEND_ASSETS" -gt 0 ]; then
    check_pass "Frontend assets accessible"
else
    check_warn "Frontend assets check failed"
fi

echo ""
echo "3. Database"
echo "-----------"

# Check PostgreSQL
PG_STATUS=$(sudo systemctl is-active postgresql || echo "inactive")
if [ "$PG_STATUS" = "active" ]; then
    check_pass "PostgreSQL running"
else
    check_fail "PostgreSQL not running"
fi

# Check database connection
DB_CONN=$(sudo -u postgres psql -d dap -c "SELECT 1;" 2>/dev/null | grep -c "1 row" || echo 0)
if [ "$DB_CONN" -gt 0 ]; then
    check_pass "Database connection OK"
else
    check_fail "Database connection failed"
fi

# Check table counts
TABLES=$(sudo -u postgres psql -d dap -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public';" -t | xargs)
if [ "$TABLES" -gt 10 ]; then
    check_pass "Database tables: $TABLES"
else
    check_warn "Database tables: $TABLES (expected > 10)"
fi

echo ""
echo "4. System Resources"
echo "-------------------"

# Check disk space
DISK_USAGE=$(df -h /data/dap | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    check_pass "Disk usage: ${DISK_USAGE}%"
else
    check_warn "Disk usage: ${DISK_USAGE}% (> 80%)"
fi

# Check memory
MEM_AVAILABLE=$(free -m | awk 'NR==2 {print $7}')
if [ "$MEM_AVAILABLE" -gt 1000 ]; then
    check_pass "Memory available: ${MEM_AVAILABLE}MB"
else
    check_warn "Memory available: ${MEM_AVAILABLE}MB (< 1GB)"
fi

# Check load average
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
LOAD_INT=$(echo "$LOAD * 100" | bc | cut -d'.' -f1)
if [ "$LOAD_INT" -lt 400 ]; then
    check_pass "Load average: $LOAD"
else
    check_warn "Load average: $LOAD (high)"
fi

echo ""
echo "5. Network & Security"
echo "---------------------"

# Check web server
if pgrep -x nginx > /dev/null || pgrep -x httpd > /dev/null; then
    check_pass "Web server running"
else
    check_fail "Web server not running"
fi

# Check firewall
if systemctl is-active firewalld > /dev/null 2>&1; then
    check_pass "Firewall active"
else
    check_warn "Firewall not active"
fi

echo ""
echo "6. Recent Logs"
echo "--------------"

# Check for recent errors in backend log
RECENT_ERRORS=$(tail -100 /data/dap/backend.log 2>/dev/null | grep -ci "error" || echo 0)
RECENT_ERRORS=$(echo "$RECENT_ERRORS" | tr -d '\n' | xargs)
if [ -n "$RECENT_ERRORS" ] && [ "$RECENT_ERRORS" -lt 5 ]; then
    check_pass "Backend errors in last 100 lines: $RECENT_ERRORS"
else
    check_warn "Backend errors in last 100 lines: $RECENT_ERRORS"
fi

echo ""
echo "========================================="
echo -e "Health Check Summary"
echo "========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

FAILED=$(echo "$FAILED" | tr -d '\n' | xargs)
if [ -z "$FAILED" ]; then
    FAILED=0
fi

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✓ System Health: GOOD${NC}"
    exit 0
elif [ "$FAILED" -le 2 ]; then
    echo -e "${YELLOW}⚠ System Health: DEGRADED${NC}"
    exit 1
else
    echo -e "${RED}✗ System Health: CRITICAL${NC}"
    exit 2
fi
ENDSSH

