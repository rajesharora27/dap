#!/bin/bash

echo "🔍 Simple HowTo Persistence Verification Test"
echo "============================================="
echo ""

PRODUCT_ID="cmg57oism0006nx013k9yabpq"
TEST_NAME="Simple Verification $(date +%s)"
TEST_DOC="https://verify-$(date +%s).example.com"
TEST_VIDEO="https://verify-video-$(date +%s).example.com"

echo "📝 Creating task via API:"
echo "   Name: $TEST_NAME"
echo "   HowToDoc: $TEST_DOC"
echo "   HowToVideo: $TEST_VIDEO"

# Create task
CREATE_RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"mutation { createTask(input: { productId: \\\"${PRODUCT_ID}\\\", name: \\\"${TEST_NAME}\\\", estMinutes: 30, weight: 1, howToDoc: \\\"${TEST_DOC}\\\", howToVideo: \\\"${TEST_VIDEO}\\\" }) { id name howToDoc howToVideo } }\"}")

echo ""
echo "📤 Create Response:"
echo "$CREATE_RESPONSE"

# Extract task ID
TASK_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [[ -n "$TASK_ID" ]]; then
    echo ""
    echo "✅ Task created with ID: $TASK_ID"
    
    echo ""
    echo "🔍 Verifying in database:"
    docker compose exec -T db psql -U postgres -d dap -c "SELECT id, name, \"howToDoc\", \"howToVideo\" FROM \"Task\" WHERE id = '$TASK_ID';"
    
    echo ""
    echo "📥 Fetching via GraphQL query:"
    FETCH_RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"query { tasks(first: 100, productId: \\\"${PRODUCT_ID}\\\") { edges { node { id name howToDoc howToVideo } } } }\"}")
    
    # Look for our task in the response
    echo "$FETCH_RESPONSE" | grep -A 3 -B 3 "$TASK_ID" || echo "Task not found in GraphQL query response"
    
    echo ""
    echo "🧪 Testing individual task fetch:"
    # Try to fetch just this task (if there's a way to do it)
    SINGLE_RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"query { tasks(first: 1, productId: \\\"${PRODUCT_ID}\\\", where: { id: \\\"${TASK_ID}\\\" }) { edges { node { id name howToDoc howToVideo } } } }\"}")
    
    echo "Single task query response:"
    echo "$SINGLE_RESPONSE"
    
else
    echo "❌ Failed to create task"
fi

echo ""
echo "🏁 Test completed"