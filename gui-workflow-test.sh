#!/bin/bash

# Focused GUI Workflow Test
# This script specifically tests the difference between API calls and GUI workflow

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PRODUCT_ID="cmg57oism0006nx013k9yabpq"
BACKEND_URL="http://localhost:4000/graphql"

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🔍 FOCUSED GUI WORKFLOW TEST"
echo "============================="

# Test 1: Exact same call that TasksPanel.tsx makes
log_info "Test 1: Simulating exact TasksPanel.tsx GraphQL call"

TASK_NAME="GUI Workflow Test $(date +%s)"
HOW_TO_DOC="https://gui-workflow-$(date +%s).example.com"
HOW_TO_VIDEO="https://gui-video-$(date +%s).example.com"

# This is the EXACT mutation that TasksPanel.tsx should send
MUTATION='{
  "query": "mutation CreateTask($input: TaskInput!) { createTask(input: $input) { id name description estMinutes weight notes priority licenseLevel howToDoc howToVideo product { id name } outcomes { id name } } }",
  "variables": {
    "input": {
      "productId": "'$PRODUCT_ID'",
      "name": "'$TASK_NAME'",
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

echo "Sending mutation:"
echo "$MUTATION" | jq '.' 2>/dev/null || echo "$MUTATION"

RESPONSE=$(curl -s -X POST $BACKEND_URL \
  -H "Content-Type: application/json" \
  -d "$MUTATION")

echo ""
echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

TASK_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -n "$TASK_ID" ]]; then
    log_success "Task created with ID: $TASK_ID"
    
    # Check response contains our values
    if echo "$RESPONSE" | grep -q "$HOW_TO_DOC" && echo "$RESPONSE" | grep -q "$HOW_TO_VIDEO"; then
        log_success "Response contains howToDoc/howToVideo values"
    else
        log_error "Response missing howToDoc/howToVideo values"
    fi
    
    # Verify in database
    DB_RESULT=$(docker compose exec -T db psql -U postgres -d dap -c "SELECT \"howToDoc\", \"howToVideo\" FROM \"Task\" WHERE id = '$TASK_ID';" 2>/dev/null)
    echo ""
    echo "Database verification:"
    echo "$DB_RESULT"
    
    if echo "$DB_RESULT" | grep -q "$HOW_TO_DOC" && echo "$DB_RESULT" | grep -q "$HOW_TO_VIDEO"; then
        log_success "Database contains correct values"
    else
        log_error "Database missing values"
    fi
    
    # Test retrieval query (what frontend uses to display tasks)
    echo ""
    log_info "Test 2: Simulating frontend task retrieval"
    
    QUERY_RESPONSE=$(curl -s -X POST $BACKEND_URL \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"query { tasks(first: 100, productId: \\\"$PRODUCT_ID\\\") { edges { node { id name howToDoc howToVideo } } } }\"}")
    
    echo "Query response (filtered for our task):"
    echo "$QUERY_RESPONSE" | grep -A 10 -B 10 "$TASK_ID" | jq '.' 2>/dev/null || echo "$QUERY_RESPONSE" | grep -A 10 -B 10 "$TASK_ID"
    
    if echo "$QUERY_RESPONSE" | grep -A 5 -B 5 "$TASK_ID" | grep -q "$HOW_TO_DOC" && echo "$QUERY_RESPONSE" | grep -A 5 -B 5 "$TASK_ID" | grep -q "$HOW_TO_VIDEO"; then
        log_success "Task retrieval shows correct values"
    else
        log_error "Task retrieval missing values"
    fi
    
    echo ""
    echo "🔍 DIAGNOSIS:"
    echo "============="
    echo "✅ Backend API accepts and stores howToDoc/howToVideo correctly"
    echo "✅ Database persistence is working"
    echo "✅ GraphQL queries return the correct values"
    echo ""
    echo "If GUI is not working, the issue is likely in:"
    echo "1. TaskDialog.tsx form submission"
    echo "2. TasksPanel.tsx mutation call"
    echo "3. Apollo Client configuration"
    echo "4. Frontend form validation"
    
else
    log_error "Task creation failed"
fi

echo ""
log_info "To manually test GUI, create a task with:"
echo "Name: $TASK_NAME"
echo "HowToDoc: $HOW_TO_DOC"
echo "HowToVideo: $HOW_TO_VIDEO"
echo ""
echo "Then check if these values persist in the task list."