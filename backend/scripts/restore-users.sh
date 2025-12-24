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
    echo "⚠️  DATABASE_URL not found, using default 'postgresql://dap@localhost:5432/dap'"
    echo "ℹ️  Ensure your user has access, or run: sudo ./setup-permissions.sh"
    DATABASE_URL="postgresql://dap@localhost:5432/dap"
fi

echo "========================================="
echo "⏪ Restoring User Database from $BACKUP_FILE"
echo "========================================="

# Strip query parameters for psql connection
DATABASE_URL=$(echo "$DATABASE_URL" | cut -d '?' -f1)

# psql execution
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<EOF
-- Verify superuser status for informative warning
DO \$\$
DECLARE
  is_sup bool;
BEGIN
  SELECT rolsuper INTO is_sup FROM pg_roles WHERE rolname = current_user;
  IF NOT is_sup THEN
    RAISE WARNING 'Current user % is NOT a superuser. Restore might fail on foreign key constraints.', current_user;
  END IF;
END \$\$;

BEGIN;

-- Attempt to disable triggers and foreign key checks using set_config (safer in PL/pgSQL)
DO \$\$
DECLARE
    is_superuser boolean;
BEGIN
    SELECT rolsuper INTO is_superuser FROM pg_roles WHERE rolname = current_user;
    
    IF is_superuser THEN
        PERFORM set_config('session_replication_role', 'replica', false);
    ELSE
        RAISE WARNING 'User % is not a superuser. Skipping session_replication_role configuration. Foreign key constraints will remain active.', current_user;
    END IF;
END \$\$;

-- Clear tables in reverse dependency order
DELETE FROM "RolePermission";
DELETE FROM "UserRole";
DELETE FROM "Permission";
DELETE FROM "AuditLog";
DELETE FROM "ChangeSet";
DELETE FROM "LockedEntity";
DELETE FROM "Session";
DELETE FROM "User";
DELETE FROM "Role";

-- Restore data from backup
\i '$BACKUP_FILE'

-- Attempt to reset session_replication_role
DO \$\$
DECLARE
    is_superuser boolean;
BEGIN
    SELECT rolsuper INTO is_superuser FROM pg_roles WHERE rolname = current_user;

    IF is_superuser THEN
        PERFORM set_config('session_replication_role', 'origin', false);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END \$\$;

COMMIT;
EOF

echo "✅ User Database restored successfully."
