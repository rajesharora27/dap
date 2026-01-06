#!/bin/bash
#
# GraphQL Contract Gate
# - Ensures frontend generated schema types match backend schema (typeDefs)
# - Prevents silent drift between backend schema and frontend expectations
#
# Usage:
#   bash scripts/check-graphql-contract.sh
#

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "[graphql-contract] Running frontend codegen..."
(cd frontend && npm run codegen >/dev/null)

echo "[graphql-contract] Checking for uncommitted codegen changes..."
if ! git diff --exit-code -- frontend/src/generated/graphql.ts frontend/codegen.yml >/dev/null; then
  echo "[graphql-contract] ❌ GraphQL codegen output is out of date."
  echo "[graphql-contract]    Run: (cd frontend && npm run codegen) and commit the changes."
  echo ""
  git --no-pager diff -- frontend/src/generated/graphql.ts frontend/codegen.yml | head -200
  exit 1
fi

echo "[graphql-contract] ✅ OK"


