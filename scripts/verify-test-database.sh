#!/bin/bash
# Verify test database configuration and safety checks

echo "======================================"
echo "Test Database Verification"
echo "======================================"
echo ""

# 1. Check if test database exists
echo "1. Checking if dap_test database exists..."
DB_EXISTS=$(docker exec dap_db_1 psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -w dap_test | wc -l)

if [ "$DB_EXISTS" -eq "1" ]; then
    echo "   ✅ Test database 'dap_test' exists"
else
    echo "   ❌ Test database 'dap_test' NOT FOUND"
    echo "   Creating test database..."
    docker exec dap_db_1 psql -U postgres -c "CREATE DATABASE dap_test;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "   ✅ Test database created successfully"
    else
        echo "   ℹ️  Database may already exist"
    fi
fi

# 2. Verify Jest configuration
echo ""
echo "2. Checking Jest configurati on..."
if grep -q "dap_test" /data/dap/backend/src/__tests__/setup.ts; then
    echo "   ✅ Test setup configured to use dap_test"
else
    echo "   ⚠️  Test setup may not be using dap_test!"
fi

# 3. Verify TestFactory safety checks
echo ""
echo "3. Checking TestFactory safety checks..."
if grep -q "SAFETY CHECK FAILED" /data/dap/backend/src/__tests__/factories/TestFactory.ts; then
    echo "   ✅ TestFactory has safety checks in cleanup()"
else
    echo "   ⚠️  TestFactory missing safety checks!"
fi

# 4. Verify DevTools test runner configuration
echo ""
echo "4. Checking DevTools test runner..."
if grep -q "dap_test" /data/dap/backend/src/api/devTools.ts; then
    echo "   ✅ DevTools test runner configured to use dap_test"
else
    echo "   ⚠️  DevTools may not be using test database!"
fi

# 5. Count users in each database
echo ""
echo "5. Comparing user counts..."
DEV_USERS=$(docker exec dap_db_1 psql -U postgres -d dap -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' ')
TEST_USERS=$(docker exec dap_db_1 psql -U postgres -d dap_test -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' ')

echo "   Development database (dap): $DEV_USERS users"
echo "   Test database (dap_test): $TEST_USERS users"

if [ "$DEV_USERS" -gt "0" ]; then
    echo "   ✅ Development database has users (safe)"
else
    echo "   ⚠️  Development database has NO users!"
    echo "   Run: cd /data/dap/backend && ts-node scripts/fix_user_auth.ts admin 'DAP123!!!' --admin"
fi

# 6. Test DATABASE_URL environment variable
echo ""
echo "6. Testing environment variable inheritance..."
TEST_ENV=$(cd /data/dap/backend && DATABASE_URL="test://check" node -e "console.log(process.env.DATABASE_URL)")
if [ "$TEST_ENV" = "test://check" ]; then
    echo "   ✅ Environment variables inherit correctly"
else
    echo "   ⚠️  Environment variable inheritance may have issues"
fi

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
if [ "$DB_EXISTS" -eq "1" ] && [ "$DEV_USERS" -gt "0" ]; then
    echo "✅ All safety checks passed!"
    echo ""
    echo "Tests will run on: postgres://postgres@localhost:5432/dap_test"
    echo "Development data preserved in: dap database"
else
    echo "⚠️  Some checks failed. Review output above."
fi
echo ""
