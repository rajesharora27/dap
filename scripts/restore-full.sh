#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/data/dap/backups"

# Argument: Timestamp to restore
TIMESTAMP="$1"

if [ -z "$TIMESTAMP" ]; then
  echo "Usage: $0 <timestamp>"
  echo "Available backups:"
  ls -1 $BACKUP_DIR/dap-db-*.sql.gz | sed 's/.*dap-db-//' | sed 's/.sql.gz//'
  exit 1
fi

DB_BACKUP_FILE="$BACKUP_DIR/dap-db-$TIMESTAMP.sql.gz"
APP_BACKUP_FILE="$BACKUP_DIR/dap-app-$TIMESTAMP.tar.gz"

echo "========================================="
echo "⏪ Starting DAP System Restore"
echo "Target Timestamp: $TIMESTAMP"
echo "========================================="

# Validate files exist
if [ ! -f "$DB_BACKUP_FILE" ]; then
  echo "❌ Error: Database backup not found: $DB_BACKUP_FILE"
  exit 1
fi

if [ ! -f "$APP_BACKUP_FILE" ]; then
  echo "❌ Error: Application backup not found: $APP_BACKUP_FILE"
  exit 1
fi

# Load environment variables
if [ -f "/data/dap/.env" ]; then
  source /data/dap/.env
elif [ -f "/data/dap/app/.env" ]; then
  source /data/dap/app/.env
fi

# 1. Stop Services
echo "🛑 Stopping application services..."
pm2 stop all || echo "⚠️  PM2 stop failed or no processes running"

# 2. Restore Database
echo "📦 Restoring database..."
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found."
  exit 1
fi

# We need to drop and re-create the database or schema to ensure a clean state
# Simplest approach for full restore: Drop public schema and recreate
echo "   Resetting database schema..."
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "   Importing data..."
gunzip < "$DB_BACKUP_FILE" | psql "$DATABASE_URL"

echo "✅ Database restored"

# 3. Restore Application Files
echo "📦 Restoring application files to /data/dap..."
# We assume the tarball contains the 'dap' directory structure or 'dap/backend', etc.
# Warning: This overwrites current files
tar -xzf "$APP_BACKUP_FILE" -C /data

echo "✅ Application files restored"

# 4. Restart Services
echo "🚀 Restarting application services..."
if [ -d "/data/dap/backend" ]; then
  cd /data/dap
else
  cd /data/dap/app
fi

if [ -f "ecosystem.config.js" ]; then
  pm2 start ecosystem.config.js
else
  echo "⚠️  ecosystem.config.js not found, attempting npm start"
  npm run start
fi

echo "========================================="
echo "✅ Restore Process Completed Successfully"
echo "System reverted to state at $TIMESTAMP"
echo "========================================="
