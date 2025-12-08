#!/bin/bash
# =============================================================================
# Setup Environment Configuration
# =============================================================================
# This script copies the appropriate .env file based on the target environment
# Usage: ./scripts/setup-env.sh [development|production]
# =============================================================================

set -e

ENV=${1:-development}
BACKEND_DIR="/data/dap/backend"

echo "======================================"
echo "Setting up environment: $ENV"
echo "======================================"

case $ENV in
  development|dev)
    ENV_FILE=".env.development"
    ;;
  production|prod)
    ENV_FILE=".env.production"
    ;;
  *)
    echo "❌ Unknown environment: $ENV"
    echo "Usage: $0 [development|production]"
    exit 1
    ;;
esac

if [ ! -f "$BACKEND_DIR/$ENV_FILE" ]; then
  echo "❌ Environment file not found: $BACKEND_DIR/$ENV_FILE"
  exit 1
fi

echo "📋 Copying $ENV_FILE to .env..."
cp "$BACKEND_DIR/$ENV_FILE" "$BACKEND_DIR/.env"

echo "✅ Environment set to: $ENV"
echo ""
echo "Current settings:"
grep -E "^(NODE_ENV|LLM_PROVIDER|AI_AGENT_ENABLED)" "$BACKEND_DIR/.env" | head -5
echo ""
