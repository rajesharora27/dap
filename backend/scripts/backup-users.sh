#!/bin/bash
set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$BACKUP_DIR/users_backup_$TIMESTAMP.sql"

# Tables to backup (User, Roles, Permissions, Sessions)
TABLES=(
  "User"
  "Session" 
  "LockedEntity"
  "Role"
  "UserRole"
  "RolePermission"
  "Permission"
)

# Ensure correct Postgres version (v16) in PATH
if [ -d "/opt/homebrew/opt/postgresql@16/bin" ]; then
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
elif [ -d "/usr/local/opt/postgresql@16/bin" ]; then
    export PATH="/usr/local/opt/postgresql@16/bin:$PATH"
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

echo "📦 Backing up User Database to $OUTPUT_FILE..."
echo "   Tables: ${TABLES[*]}"

# Ensure backup dir exists
mkdir -p "$BACKUP_DIR"

# Resolve DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    DATABASE_URL=$(get_env "DATABASE_URL")
fi

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not found, using default 'postgresql://localhost:5432/dap'"
    DATABASE_URL="postgresql://localhost:5432/dap"
fi

# Build -t arguments for pg_dump
PG_ARGS=()
for t in "${TABLES[@]}"; do
    PG_ARGS+=("-t" "\"$t\"")
done

# Strip query parameters for pg_dump compatibility
DATABASE_URL=$(echo "$DATABASE_URL" | cut -d '?' -f1)

# Run pg_dump
# Use PG_ARGS expansion
pg_dump "$DATABASE_URL" --data-only --column-inserts "${PG_ARGS[@]}" -f "$OUTPUT_FILE"

echo "✅ Backup complete: $OUTPUT_FILE"
echo "   Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
