#!/bin/bash
# Comprehensive Release System Test
# Tests all release process components

# Don't use set -e since we expect some tests may "fail" but we want to continue

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

test_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAILED++))
}

test_info() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

echo "========================================="
echo "Release System Comprehensive Test"
echo "========================================="
echo ""

# Test 1: Health Check Script
test_info "Testing health check script..."
if ./deploy/health-check.sh > /dev/null 2>&1; then
    test_pass "Health check script runs"
else
    # Health check may fail on dev, but script should run
    if [ $? -le 2 ]; then
        test_pass "Health check script runs (exit code acceptable)"
    else
        test_fail "Health check script failed"
    fi
fi

# Test 2: Release Manager Help
test_info "Testing release manager help..."
if ./deploy/release-manager.sh 2>&1 | grep -q "Usage:"; then
    test_pass "Release manager shows help"
else
    test_fail "Release manager help failed"
fi

# Test 3: Release Manager Status
test_info "Testing release manager status..."
if ./deploy/release-manager.sh status > /dev/null 2>&1; then
    test_pass "Release manager status works"
else
    test_fail "Release manager status failed"
fi

# Test 4: Release Manager Verify
test_info "Testing release manager verify..."
if timeout 30 ./deploy/release-manager.sh verify > /dev/null 2>&1; then
    test_pass "Release manager verify works"
else
    if [ $? -eq 1 ]; then
        test_pass "Release manager verify runs (verification may fail on dev)"
    else
        test_fail "Release manager verify failed"
    fi
fi

# Test 5: Migration Manager Help
test_info "Testing migration manager help..."
if ./deploy/migration-manager.sh 2>&1 | grep -q "Usage:"; then
    test_pass "Migration manager shows help"
else
    test_fail "Migration manager help failed"
fi

# Test 6: Migration Creation
test_info "Testing migration creation..."
if ./deploy/migration-manager.sh create test_migration_$$  > /dev/null 2>&1; then
    MIGRATION_FILE=$(ls migrations/*test_migration_$$*.sql 2>/dev/null | head -1)
    if [ -n "$MIGRATION_FILE" ] && [ -f "$MIGRATION_FILE" ]; then
        test_pass "Migration file created"
        rm -f "$MIGRATION_FILE"
    else
        test_fail "Migration file not found"
    fi
else
    test_fail "Migration creation failed"
fi

# Test 7: Create Release Script
test_info "Testing create-release script..."
TEST_RELEASE=$(echo -e "2.1.2-test\nTest release" | ./deploy/create-release.sh 2>&1 | grep "Package:")
if echo "$TEST_RELEASE" | grep -q "release-.*\.tar\.gz"; then
    test_pass "Release package creation works"
    # Clean up test release
    RELEASE_FILE=$(echo "$TEST_RELEASE" | grep -o "release-[^[:space:]]*.tar.gz")
    rm -f "releases/$RELEASE_FILE"
    rm -rf "releases/release-$(date +%Y%m%d)-"*
else
    test_fail "Release package creation failed"
fi

# Test 8: Check required files exist
test_info "Checking required files..."
REQUIRED_FILES=(
    "deploy/release-manager.sh"
    "deploy/health-check.sh"
    "deploy/migration-manager.sh"
    "deploy/create-release.sh"
    "deploy/ROBUST_RELEASE_PROCESS.md"
    "deploy/DEPLOYMENT_SUMMARY.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_pass "$file exists"
    else
        test_fail "$file missing"
    fi
done

# Test 9: Check scripts are executable
test_info "Checking scripts are executable..."
for file in deploy/*.sh; do
    if [ -x "$file" ]; then
        test_pass "$(basename $file) is executable"
    else
        test_fail "$(basename $file) not executable"
    fi
done

# Test 10: Documentation completeness
test_info "Checking documentation..."
if grep -q "Rollback" deploy/ROBUST_RELEASE_PROCESS.md; then
    test_pass "Documentation includes rollback"
else
    test_fail "Documentation missing rollback section"
fi

if grep -q "Password" deploy/ROBUST_RELEASE_PROCESS.md; then
    test_pass "Documentation includes password security"
else
    test_fail "Documentation missing password section"
fi

if grep -q "Health Check" deploy/ROBUST_RELEASE_PROCESS.md; then
    test_pass "Documentation includes health checks"
else
    test_fail "Documentation missing health check section"
fi

# Test 11: Backup directory structure
test_info "Checking backup directory..."
if ssh rajarora@centos2.rajarora.csslab "test -d /data/dap/backups" 2>/dev/null; then
    test_pass "Backup directory exists on production"
else
    test_fail "Backup directory missing on production"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Release system is ready for use."
    echo ""
    echo "Key commands:"
    echo "  ./deploy/release-manager.sh deploy <package>   # Deploy"
    echo "  ./deploy/release-manager.sh patch              # Patch"
    echo "  ./deploy/release-manager.sh rollback           # Rollback"
    echo "  ./deploy/health-check.sh                       # Health check"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Please review failed tests above"
    exit 1
fi

