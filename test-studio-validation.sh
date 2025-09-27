#!/usr/bin/env bash

echo "🧪 Testing DAP Test Studio Integration"
echo "======================================"

# Test if frontend is running
echo "📡 Testing Frontend (Port 5173)..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend is running successfully"
else
    echo "❌ Frontend not responding (HTTP $FRONTEND_RESPONSE)"
    exit 1
fi

# Test if backend GraphQL is working
echo "📡 Testing Backend GraphQL (Port 4000)..."
GRAPHQL_RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { products { edges { node { id name } } } }"}')

if echo "$GRAPHQL_RESPONSE" | grep -q '"data"'; then
    echo "✅ Backend GraphQL is working"
    echo "📊 Available products:"
    echo "$GRAPHQL_RESPONSE" | jq -r '.data.products.edges[].node | "  - \(.name) (\(.id))"' 2>/dev/null || echo "  (jq not available for pretty output)"
else
    echo "❌ Backend GraphQL not responding properly"
    echo "Response: $GRAPHQL_RESPONSE"
    exit 1
fi

echo ""
echo "🎯 Test Studio Features Available:"
echo "=================================="
echo "✅ Product Tests:"
echo "   • Create Product with All Attributes"
echo "   • Update Product All Attributes"  
echo "   • Delete Test Product"
echo ""
echo "✅ Task Tests:"
echo "   • Create Tasks with All Attributes"
echo "   • Update Tasks All Attributes"
echo "   • Delete Test Tasks"
echo ""
echo "✅ Data Management:"
echo "   • Create Sample Data Set"
echo "   • Clean Up Test Data"
echo ""
echo "🚀 ACCESS THE TEST STUDIO:"
echo "========================="
echo "1. Open: http://localhost:5173"
echo "2. Click on 'Testing' in the sidebar menu"
echo "3. Or click the 'Test Studio' FAB button"
echo ""
echo "📋 TEST STUDIO CAPABILITIES:"
echo "============================"
echo "• Run individual tests or complete test suites"
echo "• Create comprehensive test products with licenses and outcomes"
echo "• Test all CRUD operations for products and tasks"  
echo "• Data management center for sample data creation/cleanup"
echo "• Real-time test results with detailed logging"
echo "• Auto-cleanup functionality for test data"
echo ""
echo "🎉 Test Studio is ready for use!"