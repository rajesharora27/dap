#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/data/dap/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_BACKUP_FILE="$BACKUP_DIR/dap-db-$TIMESTAMP.sql.gz"
APP_BACKUP_FILE="$BACKUP_DIR/dap-app-$TIMESTAMP.tar.gz"
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f "/data/dap/.env" ]; then
  source /data/dap/.env
elif [ -f "/data/dap/app/.env" ]; then
  source /data/dap/app/.env
elif [ -f ".env" ]; then
  source .env
fi

echo "========================================="
echo "💾 Starting DAP System Backup"
echo "TS: $TIMESTAMP"
echo "========================================="

# 1. Backup Database
echo "📦 Backing up database..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found."
  exit 1
fi

# Extract DB connection info if needed, or let pg_dump handle the URL
# pg_dump supports connection strings directly
echo "   Database URL found (masked)"
pg_dump "$DATABASE_URL" | gzip > "$DB_BACKUP_FILE"

if [ -f "$DB_BACKUP_FILE" ]; then
  echo "✅ Database backup created: $DB_BACKUP_FILE"
  echo "   Size: $(du -h "$DB_BACKUP_FILE" | cut -f1)"
else
  echo "❌ Database backup failed!"
  exit 1
fi

# 2. Backup Application Code & Config
echo "📦 Backing up application files..."
# Assuming we are in the app root or provided via arg
APP_ROOT=${1:-"/data/dap"}
# Exclude node_modules, logs, backups, and large temporary files
tar --exclude='node_modules' --exclude='logs' --exclude='backups' --exclude='.git' -czf "$APP_BACKUP_FILE" -C "$(dirname "$APP_ROOT")" "$(basename "$APP_ROOT")"

if [ -f "$APP_BACKUP_FILE" ]; then
  echo "✅ Application backup created: $APP_BACKUP_FILE"
  echo "   Size: $(du -h "$APP_BACKUP_FILE" | cut -f1)"
else
  echo "❌ Application backup failed!"
  exit 1
fi

# 3. Cleanup Old Backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "dap-*.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ Cleanup complete"

echo "========================================="
echo "✅ Backup Process Completed Successfully"
echo "Files:"
echo "  - DB:  $DB_BACKUP_FILE"
echo "  - App: $APP_BACKUP_FILE"
echo "========================================="

# Return the backup timestamp for the caller (e.g., deployment script)
echo "BACKUP_TIMESTAMP=$TIMESTAMP"
