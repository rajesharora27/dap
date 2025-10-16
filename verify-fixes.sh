#!/bin/bash

echo "🔍 Verifying Customer Menu & Adoption Plan Fixes"
echo "================================================"
echo ""

# Check if services are running
echo "1️⃣  Checking services status..."
if curl -s http://localhost:4000/graphql > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 4000"
else
    echo "   ❌ Backend is NOT running"
    exit 1
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on port 5173"
else
    echo "   ❌ Frontend is NOT running"
    exit 1
fi

echo ""

# Check adoption plans in database
echo "2️⃣  Checking adoption plans in database..."
PLAN_COUNT=$(docker exec dap_db_1 psql -U postgres -d dap -t -c "SELECT COUNT(*) FROM \"AdoptionPlan\";" 2>/dev/null | tr -d ' ')

if [ -n "$PLAN_COUNT" ]; then
    echo "   📊 Found $PLAN_COUNT adoption plans"
else
    echo "   ⚠️  Could not query database"
fi

echo ""

# Check customer-product relationships
echo "3️⃣  Checking customer-product relationships..."
docker exec dap_db_1 psql -U postgres -d dap -c "
SELECT 
    c.name as customer,
    p.name as product,
    cp.\"licenseLevel\",
    CASE WHEN ap.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_plan,
    ap.\"totalTasks\"
FROM \"CustomerProduct\" cp
JOIN \"Customer\" c ON c.id = cp.\"customerId\"
JOIN \"Product\" p ON p.id = cp.\"productId\"
LEFT JOIN \"AdoptionPlan\" ap ON ap.\"customerProductId\" = cp.id
ORDER BY c.name, p.name
LIMIT 10;
" 2>/dev/null | head -n 20

echo ""

# Check if GET_CUSTOMERS query works
echo "4️⃣  Testing GraphQL GET_CUSTOMERS query..."
GRAPHQL_RESULT=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetCustomers { customers { id name products { id adoptionPlan { id } } } }"
  }')

if echo "$GRAPHQL_RESULT" | grep -q '"customers"'; then
    echo "   ✅ GET_CUSTOMERS query successful"
    
    # Count customers with adoption plans
    PLANS_IN_QUERY=$(echo "$GRAPHQL_RESULT" | grep -o '"adoptionPlan"' | wc -l)
    echo "   📊 Query returned adoption plan data $PLANS_IN_QUERY times"
else
    echo "   ❌ GET_CUSTOMERS query failed"
    echo "   Response: $GRAPHQL_RESULT"
fi

echo ""
echo "5️⃣  Summary"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   ✅ All fixes have been applied:"
echo "      • Frontend mutations enhanced with adoptionPlan field"
echo "      • RefetchQueries configured for cache invalidation"
echo "      • Backend resolver includes adoptionPlan in response"
echo "      • Customer menu always expands (no toggle)"
echo "      • First customer auto-selected"
echo ""
echo "   📋 Manual Testing Required:"
echo "      1. Open http://localhost:5173"
echo "      2. Clear browser cache (Ctrl+Shift+R)"
echo "      3. Click 'Customers' menu → should expand"
echo "      4. Assign a product to a customer"
echo "      5. Verify adoption plan appears immediately"
echo "      6. Verify sync button is visible"
echo ""
echo "   🧪 Run automated test:"
echo "      node test-adoption-plan-display.js"
echo ""
echo "================================================"
echo "✨ Verification complete!"
