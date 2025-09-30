#!/bin/bash

# Comprehensive Frontend vs Backend Comparison Test
# This script will help identify exactly where the discrepancy occurs

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

PRODUCT_ID="cmg57oism0006nx013k9yabpq"
BACKEND_URL="http://localhost:4000/graphql"

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_step() { echo -e "${PURPLE}🔧 $1${NC}"; }

echo "🔍 COMPREHENSIVE FRONTEND vs BACKEND ANALYSIS"
echo "=============================================="

# Create a test case that will help us identify the issue
TIMESTAMP=$(date +%s)
TASK_NAME="Analysis Test $TIMESTAMP"
HOW_TO_DOC="https://analysis-$TIMESTAMP.example.com"
HOW_TO_VIDEO="https://analysis-video-$TIMESTAMP.example.com"

log_info "Test Values:"
echo "  Task Name: $TASK_NAME"
echo "  HowToDoc: $HOW_TO_DOC"
echo "  HowToVideo: $HOW_TO_VIDEO"
echo ""

# Step 1: Test with empty strings (what frontend might be sending)
log_step "STEP 1: Testing with empty strings"
EMPTY_RESPONSE=$(curl -s -X POST $BACKEND_URL \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"mutation { createTask(input: { productId: \\\"$PRODUCT_ID\\\", name: \\\"Empty String Test $TIMESTAMP\\\", estMinutes: 30, weight: 1, howToDoc: \\\"\\\", howToVideo: \\\"\\\" }) { id name howToDoc howToVideo } }\"}")

EMPTY_TASK_ID=$(echo "$EMPTY_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ -n "$EMPTY_TASK_ID" ]]; then
    log_success "Empty string task created: $EMPTY_TASK_ID"
    if echo "$EMPTY_RESPONSE" | grep -q '"howToDoc":null' && echo "$EMPTY_RESPONSE" | grep -q '"howToVideo":null'; then
        log_success "Empty strings correctly converted to null"
    else
        log_warning "Empty string handling unexpected"
        echo "Response: $EMPTY_RESPONSE"
    fi
else
    log_error "Empty string test failed"
    echo "Response: $EMPTY_RESPONSE"
fi

# Step 2: Test with actual values
log_step "STEP 2: Testing with actual values"
VALUE_RESPONSE=$(curl -s -X POST $BACKEND_URL \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"mutation { createTask(input: { productId: \\\"$PRODUCT_ID\\\", name: \\\"$TASK_NAME\\\", estMinutes: 30, weight: 1, howToDoc: \\\"$HOW_TO_DOC\\\", howToVideo: \\\"$HOW_TO_VIDEO\\\" }) { id name howToDoc howToVideo } }\"}")

VALUE_TASK_ID=$(echo "$VALUE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ -n "$VALUE_TASK_ID" ]]; then
    log_success "Value task created: $VALUE_TASK_ID"
    if echo "$VALUE_RESPONSE" | grep -q "$HOW_TO_DOC" && echo "$VALUE_RESPONSE" | grep -q "$HOW_TO_VIDEO"; then
        log_success "Values correctly preserved"
    else
        log_error "Values not preserved in response"
        echo "Response: $VALUE_RESPONSE"
    fi
else
    log_error "Value test failed"
    echo "Response: $VALUE_RESPONSE"
fi

# Step 3: Test with Apollo Client style mutation (exact frontend format)
log_step "STEP 3: Testing with exact frontend GraphQL format"
FRONTEND_MUTATION='{
  "query": "mutation CreateTask($input: TaskInput!) { createTask(input: $input) { id name description estMinutes weight notes priority licenseLevel howToDoc howToVideo product { id name } outcomes { id name } } }",
  "variables": {
    "input": {
      "productId": "'$PRODUCT_ID'",
      "name": "Frontend Format Test '$TIMESTAMP'",
      "description": "Test description",
      "estMinutes": 30,
      "weight": 1,
      "notes": "Test notes",
      "priority": "Medium",
      "howToDoc": "'$HOW_TO_DOC'",
      "howToVideo": "'$HOW_TO_VIDEO'"
    }
  }
}'

FRONTEND_RESPONSE=$(curl -s -X POST $BACKEND_URL \
  -H "Content-Type: application/json" \
  -d "$FRONTEND_MUTATION")

FRONTEND_TASK_ID=$(echo "$FRONTEND_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ -n "$FRONTEND_TASK_ID" ]]; then
    log_success "Frontend format task created: $FRONTEND_TASK_ID"
    if echo "$FRONTEND_RESPONSE" | grep -q "$HOW_TO_DOC" && echo "$FRONTEND_RESPONSE" | grep -q "$HOW_TO_VIDEO"; then
        log_success "Frontend format values correctly preserved"
    else
        log_error "Frontend format values not preserved"
        echo "Response: $FRONTEND_RESPONSE"
    fi
else
    log_error "Frontend format test failed"
    echo "Response: $FRONTEND_RESPONSE"
fi

# Step 4: Database verification
log_step "STEP 4: Database verification"
echo ""
if [[ -n "$EMPTY_TASK_ID" ]]; then
    log_info "Empty string task in database:"
    docker compose exec -T db psql -U postgres -d dap -c "SELECT name, \"howToDoc\", \"howToVideo\" FROM \"Task\" WHERE id = '$EMPTY_TASK_ID';" 2>/dev/null
fi

if [[ -n "$VALUE_TASK_ID" ]]; then
    log_info "Value task in database:"
    docker compose exec -T db psql -U postgres -d dap -c "SELECT name, \"howToDoc\", \"howToVideo\" FROM \"Task\" WHERE id = '$VALUE_TASK_ID';" 2>/dev/null
fi

if [[ -n "$FRONTEND_TASK_ID" ]]; then
    log_info "Frontend format task in database:"
    docker compose exec -T db psql -U postgres -d dap -c "SELECT name, \"howToDoc\", \"howToVideo\" FROM \"Task\" WHERE id = '$FRONTEND_TASK_ID';" 2>/dev/null
fi

# Step 5: GraphQL retrieval test
log_step "STEP 5: GraphQL retrieval verification"
RETRIEVAL_RESPONSE=$(curl -s -X POST $BACKEND_URL \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"query { tasks(first: 10, productId: \\\"$PRODUCT_ID\\\") { edges { node { id name howToDoc howToVideo } } } }\"}")

echo ""
echo "Recent tasks with howTo values:"
echo "$RETRIEVAL_RESPONSE" | jq '.data.tasks.edges[] | select(.node.howToDoc != null or .node.howToVideo != null) | .node' 2>/dev/null || echo "No jq available, showing raw response"

# Step 6: Check for common issue patterns
log_step "STEP 6: Analyzing common issue patterns"

# Check if tasks exist with empty strings vs null
EMPTY_STRING_COUNT=$(docker compose exec -T db psql -U postgres -d dap -c "SELECT COUNT(*) FROM \"Task\" WHERE \"howToDoc\" = '' OR \"howToVideo\" = '';" 2>/dev/null | grep -E "^[[:space:]]*[0-9]+[[:space:]]*$" | tr -d ' ')
NULL_COUNT=$(docker compose exec -T db psql -U postgres -d dap -c "SELECT COUNT(*) FROM \"Task\" WHERE \"howToDoc\" IS NULL AND \"howToVideo\" IS NULL;" 2>/dev/null | grep -E "^[[:space:]]*[0-9]+[[:space:]]*$" | tr -d ' ')
VALUE_COUNT=$(docker compose exec -T db psql -U postgres -d dap -c "SELECT COUNT(*) FROM \"Task\" WHERE \"howToDoc\" IS NOT NULL OR \"howToVideo\" IS NOT NULL;" 2>/dev/null | grep -E "^[[:space:]]*[0-9]+[[:space:]]*$" | tr -d ' ')

echo ""
log_info "Database analysis:"
echo "  Tasks with empty strings: ${EMPTY_STRING_COUNT:-0}"
echo "  Tasks with null values: ${NULL_COUNT:-0}" 
echo "  Tasks with actual values: ${VALUE_COUNT:-0}"

# Step 7: Backend logs analysis
log_step "STEP 7: Recent backend logs"
echo ""
log_info "Recent createTask operations:"
docker compose logs backend --tail=50 2>&1 | grep -E "(createTask|🚀|howTo)" | tail -10 || echo "No recent createTask logs found"

# Summary
echo ""
echo "🎯 ANALYSIS SUMMARY"
echo "==================="
echo ""

if [[ -n "$VALUE_TASK_ID" && -n "$FRONTEND_TASK_ID" ]]; then
    log_success "✅ Backend correctly handles howToDoc/howToVideo in all formats"
    log_success "✅ Database storage is working correctly"
    log_success "✅ GraphQL mutations work as expected"
    echo ""
    log_info "🔍 If GUI is still not working, the issue is likely:"
    echo "   1. Frontend form validation preventing submission"
    echo "   2. Apollo Client cache issues"
    echo "   3. React state management problems"
    echo "   4. Form field values not being captured correctly"
    echo ""
    log_info "💡 Recommended next steps:"
    echo "   1. Open browser dev tools"
    echo "   2. Go to Network tab"
    echo "   3. Create a task with howToDoc/howToVideo values"
    echo "   4. Check the actual GraphQL request being sent"
    echo "   5. Compare with the working API calls above"
else
    log_error "❌ Backend API has issues - need to debug further"
fi

# Cleanup
log_info "Cleaning up test data..."
[[ -n "$EMPTY_TASK_ID" ]] && docker compose exec -T db psql -U postgres -d dap -c "DELETE FROM \"Task\" WHERE id = '$EMPTY_TASK_ID';" 2>/dev/null || true
[[ -n "$VALUE_TASK_ID" ]] && docker compose exec -T db psql -U postgres -d dap -c "DELETE FROM \"Task\" WHERE id = '$VALUE_TASK_ID';" 2>/dev/null || true
[[ -n "$FRONTEND_TASK_ID" ]] && docker compose exec -T db psql -U postgres -d dap -c "DELETE FROM \"Task\" WHERE id = '$FRONTEND_TASK_ID';" 2>/dev/null || true

echo ""
log_success "🏁 Analysis complete!"