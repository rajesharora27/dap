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

# Allow-list of non-modular infra paths (scripts, hooks, CI)
allowed_infra=(
  '^scripts/enforce-modular-layout\.sh$'
  '^\.githooks/pre-commit$'
  '^\.githooks/.*'
  '^\.github/.*'
  '^\.gitlab/.*'
  '^\.husky/.*'
)

allowed_backend=(
  '^backend/src/modules/'
  '^backend/src/shared/'
  '^backend/src/schema/'
  '^backend/src/config/'
  '^backend/src/server\.ts$'
  '^backend/src/scripts/'
  '^backend/src/__tests__/'
)

allowed_frontend=(
  '^frontend/src/features/'
  '^frontend/src/shared/'
  '^frontend/src/pages/'
  '^frontend/src/providers/'
  '^frontend/src/theme/'
  '^frontend/src/config/'
  '^frontend/src/main\.tsx$'
  '^frontend/src/setupTests\.ts$'
  '^frontend/src/__tests__/'
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
while IFS=$'\t' read -r status path; do
  # statuses: A=added, R=renamed, C=copied, M=modified
  # We gate new path locations (A/R/C) and ignore deletions.
  case "$status" in
    A*|R*|C*)
      if ! is_allowed "$path"; then
        violations+=("$path")
      fi
      ;;
    *)
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

