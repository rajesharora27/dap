#!/bin/bash

# Verification script to check database tables against Prisma schema
# Run this to ensure cleanup script has all the right tables

set -e

DB_CONTAINER="$(docker ps -a --format '{{.Names}}' | grep -E '^dap[-_]db[-_]1$|^dap_db_1$|^dap-db-1$|^db$' | head -n 1)"

if [ -z "$DB_CONTAINER" ]; then
    echo "❌ Database container not found"
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^$DB_CONTAINER$"; then
    echo "❌ Database container is not running"
    exit 1
fi

echo "=== Database Tables Verification ==="
echo ""
echo "📋 Checking tables in database..."
echo ""

# Get actual tables from database
ACTUAL_TABLES=$(docker exec $DB_CONTAINER psql -U postgres -d dap -t -c "
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
" | tr -d ' ' | grep -v '^$')

# Expected tables from Prisma schema
EXPECTED_TABLES=(
    "AdoptionPlan"
    "AuditLog"
    "ChangeItem"
    "ChangeSet"
    "Customer"
    "CustomerProduct"
    "CustomerSolution"
    "CustomerTask"
    "CustomerTaskOutcome"
    "CustomerTaskRelease"
    "CustomerTelemetryAttribute"
    "CustomerTelemetryValue"
    "CustomerSolutionTask"
    "CustomAttribute"
    "License"
    "LockedEntity"
    "Outcome"
    "Product"
    "Release"
    "Session"
    "Solution"
    "SolutionAdoptionPlan"
    "SolutionAdoptionProduct"
    "SolutionProduct"
    "SolutionTaskOrder"
    "Task"
    "TaskOutcome"
    "TaskRelease"
    "Telemetry"
    "TelemetryAttribute"
    "TelemetryValue"
    "User"
    "_prisma_migrations"
)

echo "✅ Tables found in database:"
echo "$ACTUAL_TABLES" | while read table; do
    echo "   - $table"
done

echo ""
echo "🔍 Checking for missing tables..."
echo ""

MISSING=0
for expected in "${EXPECTED_TABLES[@]}"; do
    if ! echo "$ACTUAL_TABLES" | grep -q "^$expected$"; then
        echo "   ⚠️  Missing: $expected"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo "   ✅ All expected tables exist!"
else
    echo "   ⚠️  $MISSING expected tables are missing"
fi

echo ""
echo "🔍 Checking for extra/unexpected tables..."
echo ""

EXTRA=0
echo "$ACTUAL_TABLES" | while read actual; do
    if [ -z "$actual" ]; then continue; fi
    
    found=0
    for expected in "${EXPECTED_TABLES[@]}"; do
        if [ "$actual" = "$expected" ]; then
            found=1
            break
        fi
    done
    
    if [ $found -eq 0 ]; then
        echo "   ℹ️  Extra table: $actual"
        EXTRA=$((EXTRA + 1))
    fi
done

echo ""
echo "📊 Summary:"
TOTAL=$(echo "$ACTUAL_TABLES" | wc -l)
echo "   Total tables: $TOTAL"
echo "   Expected tables: ${#EXPECTED_TABLES[@]}"

echo ""
echo "🧪 Testing table dependencies..."
echo ""

# Test if we can query key tables
TEST_TABLES=("Product" "Solution" "SolutionProduct" "Customer" "CustomerSolution" "Task" "AdoptionPlan")

for table in "${TEST_TABLES[@]}"; do
    if docker exec $DB_CONTAINER psql -U postgres -d dap -c "SELECT COUNT(*) FROM \"$table\";" >/dev/null 2>&1; then
        COUNT=$(docker exec $DB_CONTAINER psql -U postgres -d dap -t -c "SELECT COUNT(*) FROM \"$table\";" | tr -d ' ')
        echo "   ✅ $table: $COUNT records"
    else
        echo "   ❌ $table: Query failed"
    fi
done

echo ""
echo "=== Verification Complete ==="


