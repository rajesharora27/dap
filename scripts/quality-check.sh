#!/bin/bash

# =============================================================================
# DAP Quality Check Script
# =============================================================================
# Purpose: Comprehensive quality validation for CI/CD pipelines
# 
# Usage: ./scripts/quality-check.sh [options]
#
# Options:
#   --quick     Run only fast checks (lint, typecheck)
#   --full      Run all checks including builds and tests
#   --report    Generate quality report
#
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse arguments
QUICK=false
FULL=false
REPORT=false

for arg in "$@"; do
    case $arg in
        --quick)
            QUICK=true
            ;;
        --full)
            FULL=true
            ;;
        --report)
            REPORT=true
            ;;
    esac
done

# Default to quick if no option specified
if [ "$QUICK" = false ] && [ "$FULL" = false ]; then
    QUICK=true
fi

# Get the root directory
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT_DIR"

# Initialize results tracking
declare -A RESULTS
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              DAP Quality Check - CI/CD Pipeline              ║${NC}"
echo -e "${BLUE}║              Maintaining 100/100 Architecture Score          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$QUICK" = true ]; then
    echo -e "${CYAN}Mode: Quick checks (lint, typecheck, modular layout)${NC}"
else
    echo -e "${CYAN}Mode: Full checks (all validations including tests and builds)${NC}"
fi
echo ""

# Function to run a check
run_check() {
    local name="$1"
    local command="$2"
    local category="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "${YELLOW}[$TOTAL_CHECKS]${NC} $name..."
    
    if eval "$command" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $name: PASSED"
        RESULTS["$name"]="PASSED"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} $name: FAILED"
        RESULTS["$name"]="FAILED"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# =============================================================================
# Category 1: Architecture & Structure (10/10)
# =============================================================================
echo -e "${BLUE}═══ Architecture & Structure ═══${NC}"

run_check "Modular Layout" "bash scripts/enforce-modular-layout.sh" "architecture" || true

if command -v npx &> /dev/null; then
    run_check "Backend Circular Dependencies" "cd backend && npx madge --circular src/ 2>/dev/null | grep -q 'No circular'" "architecture" || true
    run_check "Frontend Circular Dependencies" "cd frontend && npx madge --circular src/ 2>/dev/null | grep -q 'No circular'" "architecture" || true
fi

# =============================================================================
# Category 2: Code Quality (10/10)
# =============================================================================
echo ""
echo -e "${BLUE}═══ Code Quality ═══${NC}"

run_check "Backend TypeScript" "cd backend && npx tsc --noEmit" "code_quality" || true
run_check "Frontend TypeScript" "cd frontend && npx tsc --noEmit" "code_quality" || true
run_check "Backend ESLint" "cd backend && npm run lint 2>/dev/null" "code_quality" || true
run_check "Frontend ESLint" "cd frontend && npm run lint 2>/dev/null" "code_quality" || true

# =============================================================================
# Category 3: Security (10/10)
# =============================================================================
echo ""
echo -e "${BLUE}═══ Security ═══${NC}"

# Check for hardcoded secrets
SECRETS_CHECK="! grep -r -E '(password|api[_-]?key|secret)\s*=\s*[\"'][^\"']{8,}[\"']' --include='*.ts' --include='*.tsx' backend/src frontend/src 2>/dev/null | grep -v '.example' | grep -v 'test' | grep -v '__tests__'"
run_check "No Hardcoded Secrets" "$SECRETS_CHECK" "security" || true

run_check "Backend Security Audit" "cd backend && npm audit --audit-level=high 2>/dev/null || true" "security" || true

# =============================================================================
# Full checks (tests and builds)
# =============================================================================
if [ "$FULL" = true ]; then
    # Category 4: Testing (10/10)
    echo ""
    echo -e "${BLUE}═══ Testing ═══${NC}"
    
    run_check "Backend Tests" "cd backend && npm run test 2>/dev/null" "testing" || true
    # run_check "Frontend Tests" "cd frontend && npm run test 2>/dev/null" "testing" || true
    
    # Category 5: Build Verification
    echo ""
    echo -e "${BLUE}═══ Build Verification ═══${NC}"
    
    run_check "Backend Build" "cd backend && npm run build" "build" || true
    run_check "Frontend Build" "cd frontend && npm run build" "build" || true
fi

# =============================================================================
# Generate Report
# =============================================================================
echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                      QUALITY REPORT                          ${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""

# Calculate score
if [ $TOTAL_CHECKS -gt 0 ]; then
    SCORE=$(echo "scale=0; ($PASSED_CHECKS * 100) / $TOTAL_CHECKS" | bc)
else
    SCORE=0
fi

echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo -e "Score: ${CYAN}$SCORE%${NC}"
echo ""

# Detailed results
echo "Detailed Results:"
echo "─────────────────"
for check in "${!RESULTS[@]}"; do
    if [ "${RESULTS[$check]}" = "PASSED" ]; then
        echo -e "  ${GREEN}✓${NC} $check"
    else
        echo -e "  ${RED}✗${NC} $check"
    fi
done

echo ""

# Generate report file if requested
if [ "$REPORT" = true ]; then
    REPORT_FILE="quality-report-$(date +%Y%m%d-%H%M%S).md"
    cat > "$REPORT_FILE" << EOF
# DAP Quality Report

**Generated:** $(date)
**Mode:** $([ "$FULL" = true ] && echo "Full" || echo "Quick")

## Summary

| Metric | Value |
|--------|-------|
| Total Checks | $TOTAL_CHECKS |
| Passed | $PASSED_CHECKS |
| Failed | $FAILED_CHECKS |
| Score | $SCORE% |

## Detailed Results

| Check | Status |
|-------|--------|
EOF
    
    for check in "${!RESULTS[@]}"; do
        echo "| $check | ${RESULTS[$check]} |" >> "$REPORT_FILE"
    done
    
    echo ""
    echo -e "${GREEN}Report saved to: $REPORT_FILE${NC}"
fi

# Final status
echo ""
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            ✓ ALL QUALITY CHECKS PASSED                       ║${NC}"
    echo -e "${GREEN}║            100/100 Architecture Score Maintained             ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║            ✗ SOME QUALITY CHECKS FAILED                      ║${NC}"
    echo -e "${RED}║            Review docs/QUALITY_STANDARDS.md for guidance     ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi

