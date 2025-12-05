#!/bin/bash

#################################################################
# Development Tools Production Safety Verification Script
#################################################################

echo "🔒 Verifying Development Tools Production Safety..."
echo ""

PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check frontend protection logic
echo "Test 1: Frontend Protection Logic"
if grep -q "import.meta.env.MODE !== 'production'" /data/dap/frontend/src/pages/App.tsx; then
    echo -e "${GREEN}✅ PASS${NC} - Production mode check found in frontend"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Production mode check NOT found in frontend"
    ((FAILED++))
fi

# Test 2: Check backend devModeOnly middleware
echo "Test 2: Backend DevModeOnly Middleware"
if grep -q "process.env.NODE_ENV === 'production'" /data/dap/backend/src/api/devTools.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Production block found in backend"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Production block NOT found in backend"
    ((FAILED++))
fi

# Test 3: Check backend requireAdmin middleware
echo "Test 3: Backend Admin Requirement"
if grep -q "requireAdmin" /data/dap/backend/src/api/devTools.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Admin requirement found in backend"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Admin requirement NOT found in backend"
    ((FAILED++))
fi

# Test 4: Verify no VITE_SHOW_DEV_MENU override in frontend
echo "Test 4: No Environment Variable Override"
if ! grep -q "VITE_SHOW_DEV_MENU" /data/dap/frontend/src/pages/App.tsx; then
    echo -e "${GREEN}✅ PASS${NC} - No env var override found"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Env var override still present (security risk!)"
    ((FAILED++))
fi

# Test 5: Check if production build exists
echo "Test 5: Production Build Exists"
if [ -d "/data/dap/frontend/dist" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Production build directory exists"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC} - Production build not found (run: npm run build)"
fi

# Test 6: Check NODE_ENV in current environment
echo "Test 6: Current NODE_ENV Setting"
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${YELLOW}⚠️  INFO${NC} - Currently in PRODUCTION mode (dev tools disabled)"
elif [ "$NODE_ENV" = "development" ] || [ -z "$NODE_ENV" ]; then
    echo -e "${GREEN}✅ INFO${NC} - Currently in DEVELOPMENT mode (dev tools enabled)"
else
    echo -e "${YELLOW}⚠️  WARN${NC} - Unknown NODE_ENV: $NODE_ENV"
fi

# Test 7: Verify backend middleware order
echo "Test 7: Backend Middleware Order"
if grep -A 1 "router.use(devModeOnly)" /data/dap/backend/src/api/devTools.ts | grep -q "router.use(requireAdmin)"; then
    echo -e "${GREEN}✅ PASS${NC} - Middleware applied in correct order"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Middleware order incorrect"
    ((FAILED++))
fi

# Test 8: Check if dev API endpoint protection exists
echo "Test 8: Dev API Routing Protection"
if grep -q "Development Tools API" /data/dap/backend/src/api/devTools.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Dev API documented and protected"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} - Dev API documentation missing"
    ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🔒 All security checks PASSED!${NC}"
    echo "Development tools are properly protected from production."
    exit 0
else
    echo -e "${RED}⚠️  Some security checks FAILED!${NC}"
    echo "Please review the failed tests above."
    exit 1
fi
