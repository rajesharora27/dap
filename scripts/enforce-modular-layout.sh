#!/usr/bin/env bash
#
# Enforce strict modular/file placement rules.
# - Backend allows: backend/src/modules/**, backend/src/shared/**, backend/src/schema/**,
#   backend/src/config/**, backend/src/server.ts, backend/src/scripts/**, backend/src/__tests__/**
# - Frontend allows: frontend/src/features/**, frontend/src/shared/**, frontend/src/pages/**,
#   frontend/src/providers/**, frontend/src/theme/**, frontend/src/config/**,
#   frontend/src/main.tsx, frontend/src/setupTests.ts, frontend/src/__tests__/**
#
# Fails if staged files add new paths outside the allowed sets.
set -euo pipefail

root_dir="$(git rev-parse --show-toplevel)"
cd "$root_dir"

# Allow-list of non-modular infra paths (scripts, hooks, CI, docs, tests, Docker)
allowed_infra=(
  '^scripts/'
  '^docs/'
  '^deploy/'
  '^e2e/'
  '^\.githooks/.*'
  '^\.github/.*'
  '^\.gitlab/.*'
  '^\.husky/.*'
  '^\.env\.example$'
  '^\.dockerignore$'
  '^package\.json$'
  '^README\.md$'
  '^playwright\.config\.ts$'
  '^docker-compose\.yml$'
  '^docker-compose\..*\.yml$'
)

allowed_backend=(
  '^backend/src/modules/'
  '^backend/src/shared/'
  '^backend/src/schema/'
  '^backend/src/config/'
  '^backend/src/server\.ts$'
  '^backend/src/scripts/'
  '^backend/src/__tests__/'
  '^backend/prisma/migrations/'
  '^backend/prisma/schema\.prisma$'
  '^backend/scripts/'
  '^backend/temp/'
  '^backend/Dockerfile$'
  '^backend/Dockerfile\..*$'
  '^backend/entrypoint\.sh$'
)

allowed_frontend=(
  '^frontend/src/features/'
  '^frontend/src/shared/'
  '^frontend/src/pages/'
  '^frontend/src/providers/'
  '^frontend/src/theme/'
  '^frontend/src/config/'
  '^frontend/src/routes/'
  '^frontend/src/main\.tsx$'
  '^frontend/src/setupTests\.ts$'
  '^frontend/src/__tests__/'
  '^frontend/src/generated/'
  '^frontend/src/vite-env\.d\.ts$'
  '^frontend/__mocks__/'
  '^frontend/eslint\.config\.mjs$'
  '^frontend/vite\.config\.ts$'
  '^frontend/tsconfig\.json$'
  '^frontend/package\.json$'
  '^frontend/jest\.config\.js$'
  '^frontend/Dockerfile$'
  '^frontend/Dockerfile\..*$'
  '^frontend/nginx\.conf$'
)

is_allowed() {
  local file="$1"
  for pattern in "${allowed_infra[@]}"; do
    if [[ "$file" =~ $pattern ]]; then return 0; fi
  done
  for pattern in "${allowed_backend[@]}"; do
    if [[ "$file" =~ $pattern ]]; then return 0; fi
  done
  for pattern in "${allowed_frontend[@]}"; do
    if [[ "$file" =~ $pattern ]]; then return 0; fi
  done
  return 1
}

# Check staged additions/renames only
violations=()
while IFS=$'\t' read -r status path1 path2; do
  # statuses: A=added, R=renamed, C=copied, M=modified, D=deleted
  # For renames (R) and copies (C), path1=source, path2=destination
  # We only care about the destination path for R/C operations
  case "$status" in
    A*)
      # Added file - check the path
      if ! is_allowed "$path1"; then
        violations+=("$path1")
      fi
      ;;
    R*|C*)
      # Renamed or copied - check only the destination path (path2)
      # This allows moving files FROM non-modular TO modular locations
      if ! is_allowed "$path2"; then
        violations+=("$path2")
      fi
      ;;
    *)
      # M (modified) and D (deleted) are fine
      ;;
  esac
done < <(git diff --cached --name-status)

if ((${#violations[@]})); then
  {
    echo "❌ Modular layout violation: files staged outside allowed paths"
    printf ' - %s\n' "${violations[@]}"
    echo
    echo "Allowed backend roots:"
    for p in "${allowed_backend[@]}"; do echo "   $p"; done
    echo "Allowed frontend roots:"
    for p in "${allowed_frontend[@]}"; do echo "   $p"; done
    echo
    echo "Move the files into the appropriate module/feature/shared directory and re-stage."
  } >&2
  exit 1
fi

exit 0
