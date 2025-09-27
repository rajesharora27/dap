#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set; exiting" >&2
  exit 1
fi

if [ "$SKIP_MIGRATE" = "1" ]; then
  echo "[entrypoint] SKIP_MIGRATE=1 -> skipping migrations"
else
  echo "[entrypoint] Running migrations (deploy)..."
  if ! npx prisma migrate deploy 2>/dev/null; then
    echo "[entrypoint] migrate deploy failed, attempting db push (dev fallback)" >&2
    npx prisma db push || true
  fi
fi
echo "[entrypoint] No runtime prisma generate (already built)"

# Seed (idempotent adds default users if missing)
if [ "${SKIP_SEED}" = "1" ]; then
  echo "[entrypoint] SKIP_SEED=1 -> skipping seed step"
else
  if [ -f dist/seed.js ]; then
    echo "[entrypoint] Seeding (conditional)..."
    node dist/seed.js || echo "[entrypoint] Seed step failed or skipped"
  else
    echo "[entrypoint] seed.js not found (did you build?)."
  fi
fi

echo "[entrypoint] Starting server..."
exec node dist/server.js
