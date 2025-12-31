#!/bin/bash

# =============================================================================
# DAP Git Hooks Installation Script
# =============================================================================
# Purpose: Install git hooks to enforce quality standards
#
# Usage: ./scripts/install-hooks.sh
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get root directory
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$ROOT_DIR" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

cd "$ROOT_DIR"

echo ""
echo -e "${BLUE}Installing DAP Git Hooks...${NC}"
echo ""

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install pre-commit hook
if [ -f "scripts/hooks/pre-commit" ]; then
    cp scripts/hooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✓${NC} Pre-commit hook installed"
else
    echo -e "${YELLOW}⚠${NC} Pre-commit hook not found in scripts/hooks/"
fi

# Install pre-push hook
if [ -f "scripts/hooks/pre-push" ]; then
    cp scripts/hooks/pre-push .git/hooks/pre-push
    chmod +x .git/hooks/pre-push
    echo -e "${GREEN}✓${NC} Pre-push hook installed"
else
    echo -e "${YELLOW}⚠${NC} Pre-push hook not found in scripts/hooks/"
fi

echo ""
echo -e "${GREEN}Git hooks installation complete!${NC}"
echo ""
echo "Hooks installed:"
echo "  - pre-commit: Runs on every commit (lint, typecheck, modular layout)"
echo "  - pre-push: Runs before push (tests, builds)"
echo ""
echo "To bypass hooks (emergency only):"
echo "  git commit --no-verify"
echo "  git push --no-verify"
echo ""

