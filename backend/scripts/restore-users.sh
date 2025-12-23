#!/bin/bash
set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-users.sh <backup_file.sql>"
  echo "Example: ./restore-users.sh ./backups/users_backup_20251223.sql"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Function to get .env values
get_env() {
    local key=$1
    if [ -f "../.env" ]; then
        grep "^$key=" "../.env" | cut -d '=' -f2-
    elif [ -f "./.env" ]; then
        grep "^$key=" "./.env" | cut -d '=' -f2-
    fi
}

# Resolve DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    DATABASE_URL=$(get_env "DATABASE_URL")
fi

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not found, using default 'postgresql://localhost:5432/dap'"
    DATABASE_URL="postgresql://localhost:5432/dap"
fi

echo "========================================="
echo "⏪ Restoring User Database from $BACKUP_FILE"
echo "========================================="

# Strip query parameters for psql connection
DATABASE_URL=$(echo "$DATABASE_URL" | cut -d '?' -f1)

echo "1. clearing existing user data (preserving audit history)..."
# We use DELETE instead of TRUNCATE CASCADE to avoid deleting dependent AuditLogs/ChangeSets
# We use session_replication_role = replica to bypass FK constraints during deletion/insertion
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<EOF
BEGIN;

-- Disable triggers and foreign key checks
SET session_replication_role = replica;

-- Clear tables in reverse dependency order (just to be clean, though replica mode handles it)
DELETE FROM "Permission";
DELETE FROM "RolePermission";
DELETE FROM "UserRole";
DELETE FROM "Role";
DELETE FROM "LockedEntity";
DELETE FROM "Session";
DELETE FROM "User";

-- Restore data from backup
\i '$BACKUP_FILE'

-- Re-enable triggers and foreign key checks
SET session_replication_role = origin;

COMMIT;
EOF

echo "✅ User Database restored successfully."
