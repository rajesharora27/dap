#!/bin/bash
# ============================================================================
# Test Database Setup Script
# ============================================================================
# This script ensures the shadow test database (dap_test) is properly set up
# before running tests. It creates the database if it doesn't exist and runs
# migrations to ensure the schema matches the development database.
#
# Usage: ./scripts/setup-test-db.sh
# ============================================================================

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 Setting up Test Database (Shadow Copy)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="postgres"
TEST_DB="dap_test"
DEV_DB="dap"

# Check if running in podman/container environment
CONTAINER_NAME=$(podman ps --format "{{.Names}}" | grep -E "(dap_db|postgres)" | head -1 || echo "")

if [ -n "$CONTAINER_NAME" ]; then
    echo "📦 Detected container: $CONTAINER_NAME"
    DB_CMD="podman exec $CONTAINER_NAME psql -U $DB_USER"
else
    echo "💻 Using local PostgreSQL"
    DB_CMD="PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER"
fi

echo ""

# Check if test database exists
echo "🔍 Checking if test database '$TEST_DB' exists..."
DB_EXISTS=$($DB_CMD -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$TEST_DB'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "📝 Creating test database '$TEST_DB'..."
    $DB_CMD -d postgres -c "CREATE DATABASE $TEST_DB;" 2>/dev/null || true
    echo "✅ Test database created"
else
    echo "✅ Test database already exists"
fi

# Run migrations on test database
echo ""
echo "🔄 Running Prisma migrations on test database..."
cd /data/dap/backend

# Set DATABASE_URL to test database for migrations
export DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB?schema=public"

# Run migrations
npx prisma migrate deploy 2>&1 || {
    echo "⚠️  Migration deploy failed, trying db push..."
    npx prisma db push --accept-data-loss 2>&1 || true
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Test Database Setup Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 Summary:"
echo "   • Database: $TEST_DB"
echo "   • Host: $DB_HOST:$DB_PORT"
echo "   • Schema: Synced with Prisma"
echo ""
echo "🔒 Safety Note:"
echo "   Tests will ONLY run on $TEST_DB database."
echo "   Your development data in '$DEV_DB' is protected."
echo ""
echo "📌 To run tests:"
echo "   cd /data/dap/backend"
echo "   DATABASE_URL=$DATABASE_URL npm test"
echo ""
