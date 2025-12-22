#!/bin/bash
# =============================================================================
# Setup Environment Configuration
# =============================================================================
# This script helps set up the .env file from .env.example
# Usage: ./scripts/setup-env.sh [--sync-only]
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "======================================"
echo "DAP Environment Setup"
echo "======================================"

# Check for .env.example
if [ ! -f "$PROJECT_DIR/.env.example" ]; then
    echo "❌ .env.example not found in project root"
    exit 1
fi

# If --sync-only, just sync existing .env to backend
if [ "$1" = "--sync-only" ]; then
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        echo "❌ .env not found. Run without --sync-only to create it."
        exit 1
    fi
    echo "📋 Syncing .env to backend/.env..."
    cp "$PROJECT_DIR/.env" "$PROJECT_DIR/backend/.env"
    echo "✅ Sync complete"
    exit 0
fi

# Check if .env already exists
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "ℹ️  .env already exists"
    read -p "Overwrite with .env.example? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env"
        echo ""
        echo "To sync to backend: ./scripts/setup-env.sh --sync-only"
        exit 0
    fi
fi

# Copy .env.example to .env
echo "📋 Creating .env from .env.example..."
cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"

# Detect platform and suggest settings
OS_NAME="$(uname -s)"
if [ "$OS_NAME" = "Darwin" ]; then
    echo ""
    echo "🍎 Detected macOS - Suggested settings for Mac Demo:"
    echo ""
    echo "  DATABASE_URL=postgresql://$(whoami)@localhost:5432/dap?schema=public&connection_limit=5"
    echo "  NODE_ENV=production"
    echo "  VITE_BASE_PATH=/"
    echo "  SHOW_DEV_MENU=false"
    echo ""
    echo "💡 Tip: You can use __MACUSER__ placeholder in DATABASE_URL"
    echo "   It will be replaced with your username by ./dap start"
else
    echo ""
    echo "🐧 Detected Linux - Suggested settings:"
    echo ""
    echo "  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dap?schema=public"
    echo "  NODE_ENV=development"
    echo "  VITE_BASE_PATH=/dap/"
    echo "  SHOW_DEV_MENU=true"
fi

echo ""
echo "✅ Created .env from template"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your settings"
echo "  2. Run: ./dap start"
echo ""
echo "See docs/ENVIRONMENT_MANAGEMENT.md for complete configuration guide."
