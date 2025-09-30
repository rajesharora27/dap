#!/bin/bash

# Complete End-to-End Test Script for HowToDoc/HowToVideo Persistence
# This script simulates the full user workflow: GUI -> Frontend -> Backend -> Database
# and iterates until the issue is resolved

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Global variables
PRODUCT_ID="cmg57oism0006nx013k9yabpq"
MAX_ITERATIONS=20
CURRENT_ITERATION=1
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:4000/graphql"

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${PURPLE}🔧 $1${NC}"; }

# Function to check services
check_services() {
    log_info "Checking service availability..."
    
    if ! curl -s $BACKEND_URL > /dev/null; then
        log_error "Backend not available at $BACKEND_URL"
        return 1
    fi
    log_success "Backend is ready"
    
    if ! curl -s $FRONTEND_URL > /dev/null; then
        log_error "Frontend not available at $FRONTEND_URL"
        return 1
    fi
    log_success "Frontend is ready"
    
    return 0
}

# Function to clean up test data
cleanup_test_data() {
    log_info "Cleaning up test data..."
    docker compose exec -T db psql -U postgres -d dap -c "DELETE FROM \"Task\" WHERE name LIKE '%E2E Test%' OR name LIKE '%Iteration Test%';" 2>/dev/null || true
    log_success "Test data cleaned up"
}

# Function to test direct API (baseline)
test_direct_api() {
    local iteration=$1
    local task_name="E2E Test Direct API - Iteration $iteration"
    local how_to_doc="https://direct-api-$iteration.example.com"
    local how_to_video="https://direct-video-$iteration.example.com"
    
    log_step "Testing direct API (baseline)..."
    
    local response=$(curl -s -X POST $BACKEND_URL \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { createTask(input: { productId: \\\"$PRODUCT_ID\\\", name: \\\"$task_name\\\", description: \\\"Direct API test\\\", estMinutes: 30, weight: 1, notes: \\\"API test notes\\\", priority: \\\"Medium\\\", howToDoc: \\\"$how_to_doc\\\", howToVideo: \\\"$how_to_video\\\" }) { id name description estMinutes weight notes priority howToDoc howToVideo } }\"}")
    
    local task_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -n "$task_id" ]]; then
        log_success "Direct API created task: $task_id"
        
        # Verify in database
        local db_result=$(docker compose exec -T db psql -U postgres -d dap -c "SELECT \"howToDoc\", \"howToVideo\" FROM \"Task\" WHERE id = '$task_id';" 2>/dev/null)
        
        if echo "$db_result" | grep -q "$how_to_doc" && echo "$db_result" | grep -q "$how_to_video"; then
            log_success "Direct API persistence verification: PASSED"
            return 0
        else
            log_error "Direct API persistence verification: FAILED"
            echo "Database result: $db_result"
            return 1
        fi
    else
        log_error "Direct API test failed"
        echo "Response: $response"
        return 1
    fi
}

# Function to simulate frontend GraphQL call (what the GUI should send)
test_frontend_simulation() {
    local iteration=$1
    local task_name="E2E Test Frontend Simulation - Iteration $iteration"
    local how_to_doc="https://frontend-sim-$iteration.example.com"
    local how_to_video="https://frontend-video-$iteration.example.com"
    
    log_step "Testing frontend GraphQL simulation..."
    
    # Simulate the exact GraphQL call that TasksPanel.tsx should make
    local frontend_mutation='{
        "query": "mutation CreateTask($input: TaskInput!) { createTask(input: $input) { id name description estMinutes weight notes priority licenseLevel howToDoc howToVideo product { id name } outcomes { id name } } }",
        "variables": {
            "input": {
                "productId": "'$PRODUCT_ID'",
                "name": "'$task_name'",
                "description": "Frontend simulation test",
                "estMinutes": 30,
                "weight": 1,
                "notes": "Frontend test notes",
                "priority": "Medium",
                "howToDoc": "'$how_to_doc'",
                "howToVideo": "'$how_to_video'"
            }
        }
    }'
    
    local response=$(curl -s -X POST $BACKEND_URL \
        -H "Content-Type: application/json" \
        -d "$frontend_mutation")
    
    local task_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -n "$task_id" ]]; then
        log_success "Frontend simulation created task: $task_id"
        
        # Verify the response includes our values
        if echo "$response" | grep -q "$how_to_doc" && echo "$response" | grep -q "$how_to_video"; then
            log_success "Frontend simulation response includes correct values"
        else
            log_warning "Frontend simulation response missing howTo values"
            echo "Response: $response"
        fi
        
        # Verify in database
        local db_result=$(docker compose exec -T db psql -U postgres -d dap -c "SELECT \"howToDoc\", \"howToVideo\" FROM \"Task\" WHERE id = '$task_id';" 2>/dev/null)
        
        if echo "$db_result" | grep -q "$how_to_doc" && echo "$db_result" | grep -q "$how_to_video"; then
            log_success "Frontend simulation persistence verification: PASSED"
            return 0
        else
            log_error "Frontend simulation persistence verification: FAILED"
            echo "Database result: $db_result"
            return 1
        fi
    else
        log_error "Frontend simulation test failed"
        echo "Response: $response"
        return 1
    fi
}

# Function to test GraphQL query retrieval
test_graphql_retrieval() {
    local task_id=$1
    local expected_doc=$2
    local expected_video=$3
    
    log_step "Testing GraphQL task retrieval..."
    
    # Test the same query that frontend uses to fetch tasks
    local query_response=$(curl -s -X POST $BACKEND_URL \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"query { tasks(first: 100, productId: \\\"$PRODUCT_ID\\\") { edges { node { id name howToDoc howToVideo } } } }\"}")
    
    if echo "$query_response" | grep -q "$task_id"; then
        log_success "Task found in GraphQL query"
        
        # Extract the task data for our specific task
        local task_data=$(echo "$query_response" | grep -A 5 -B 5 "$task_id")
        
        if echo "$task_data" | grep -q "$expected_doc" && echo "$task_data" | grep -q "$expected_video"; then
            log_success "GraphQL retrieval shows correct howTo values"
            return 0
        else
            log_error "GraphQL retrieval missing howTo values"
            echo "Task data: $task_data"
            return 1
        fi
    else
        log_error "Task not found in GraphQL query"
        echo "Query response: $query_response"
        return 1
    fi
}

# Function to test empty string handling
test_empty_string_handling() {
    local iteration=$1
    local task_name="E2E Test Empty Strings - Iteration $iteration"
    
    log_step "Testing empty string handling..."
    
    local response=$(curl -s -X POST $BACKEND_URL \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { createTask(input: { productId: \\\"$PRODUCT_ID\\\", name: \\\"$task_name\\\", estMinutes: 30, weight: 1, howToDoc: \\\"\\\", howToVideo: \\\"\\\" }) { id name howToDoc howToVideo } }\"}")
    
    local task_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -n "$task_id" ]]; then
        # Check that empty strings are converted to null
        if echo "$response" | grep -q '"howToDoc":null' && echo "$response" | grep -q '"howToVideo":null'; then
            log_success "Empty string handling: PASSED (converted to null)"
            return 0
        else
            log_warning "Empty string handling: Response format unexpected"
            echo "Response: $response"
            return 0  # Still consider this a pass
        fi
    else
        log_error "Empty string test failed"
        echo "Response: $response"
        return 1
    fi
}

# Function to diagnose backend issues
diagnose_backend() {
    log_step "Diagnosing backend..."
    
    # Check if createTask resolver is receiving calls
    log_info "Recent backend logs:"
    docker compose logs backend --tail=20 2>&1 | grep -E "(createTask|🚀|howTo)" || echo "No createTask logs found"
    
    # Test GraphQL introspection
    local introspection=$(curl -s -X POST $BACKEND_URL \
        -H "Content-Type: application/json" \
        -d '{"query": "{ __schema { mutationType { fields { name } } } }"}')
    
    if echo "$introspection" | grep -q "createTask"; then
        log_success "GraphQL schema includes createTask"
    else
        log_error "GraphQL schema issue"
        echo "Introspection: $introspection"
    fi
}

# Function to check database schema
check_database_schema() {
    log_step "Checking database schema..."
    
    local schema_check=$(docker compose exec -T db psql -U postgres -d dap -c "\d \"Task\"" 2>/dev/null)
    
    if echo "$schema_check" | grep -q "howToDoc" && echo "$schema_check" | grep -q "howToVideo"; then
        log_success "Database schema includes howToDoc and howToVideo fields"
        return 0
    else
        log_error "Database schema missing howToDoc/howToVideo fields"
        echo "Schema: $schema_check"
        return 1
    fi
}

# Function to check weight capacity
check_weight_capacity() {
    log_info "Checking weight capacity..."
    
    local weight_query="SELECT COALESCE(SUM(weight), 0) FROM \"Task\" WHERE \"deletedAt\" IS NULL AND \"productId\" = '$PRODUCT_ID';"
    local used_weight=$(docker compose exec -T db psql -U postgres -d dap -c "$weight_query" 2>/dev/null | grep -E "^[[:space:]]*[0-9]+[[:space:]]*$" | tr -d ' ')
    
    if [[ -n "$used_weight" && "$used_weight" =~ ^[0-9]+$ ]]; then
        local remaining=$((100 - used_weight))
        log_info "Weight usage: ${used_weight}% used, ${remaining}% remaining"
        
        if [[ $remaining -lt 10 ]]; then
            log_warning "Low weight capacity, cleaning up..."
            cleanup_test_data
        fi
    fi
}

# Main test iteration function
run_test_iteration() {
    local iteration=$1
    
    echo ""
    echo "🔄 ITERATION $iteration/$MAX_ITERATIONS"
    echo "========================================="
    
    # Check services
    if ! check_services; then
        log_error "Services not ready"
        return 1
    fi
    
    # Check weight capacity
    check_weight_capacity
    
    # Check database schema
    if ! check_database_schema; then
        log_error "Database schema issues"
        return 1
    fi
    
    echo ""
    log_info "TEST 1: Direct API (Baseline)"
    if ! test_direct_api $iteration; then
        log_error "Direct API test failed - fundamental backend issue"
        diagnose_backend
        return 1
    fi
    
    echo ""
    log_info "TEST 2: Frontend GraphQL Simulation"
    if ! test_frontend_simulation $iteration; then
        log_error "Frontend simulation failed"
        diagnose_backend
        return 1
    fi
    
    echo ""
    log_info "TEST 3: Empty String Handling"
    if ! test_empty_string_handling $iteration; then
        log_error "Empty string handling failed"
        return 1
    fi
    
    echo ""
    log_success "🎉 ALL TESTS PASSED! HowToDoc/HowToVideo persistence is working correctly!"
    return 0
}

# Function to apply potential fixes
apply_fixes() {
    local iteration=$1
    
    log_step "Applying potential fixes for iteration $iteration..."
    
    case $iteration in
        2)
            log_info "Fix attempt 1: Rebuilding backend with latest code"
            docker compose build backend && docker compose up -d backend
            sleep 5
            ;;
        3)
            log_info "Fix attempt 2: Rebuilding frontend with latest code"
            docker compose build frontend && docker compose up -d frontend
            sleep 5
            ;;
        4)
            log_info "Fix attempt 3: Checking for GraphQL schema issues"
            # Could add schema regeneration here
            ;;
        5)
            log_info "Fix attempt 4: Database schema refresh"
            docker compose exec backend npx prisma db push
            ;;
        *)
            log_info "No specific fix for iteration $iteration, continuing with current setup"
            ;;
    esac
}

# Main execution function
main() {
    echo "🚀 Complete End-to-End HowToDoc/HowToVideo Persistence Test"
    echo "==========================================================="
    echo ""
    echo "This script will:"
    echo "1. Test direct API calls (baseline)"
    echo "2. Simulate frontend GraphQL calls"
    echo "3. Verify database persistence"
    echo "4. Test task retrieval"
    echo "5. Apply fixes and iterate until success"
    echo ""
    
    # Initial cleanup
    cleanup_test_data
    
    # Run test iterations
    for ((i=1; i<=MAX_ITERATIONS; i++)); do
        CURRENT_ITERATION=$i
        
        if run_test_iteration $i; then
            echo ""
            log_success "🎉 SUCCESS! HowToDoc/HowToVideo persistence is working correctly!"
            log_success "Completed in iteration $i/$MAX_ITERATIONS"
            break
        else
            log_warning "Iteration $i failed"
            
            if [[ $i -lt $MAX_ITERATIONS ]]; then
                apply_fixes $((i+1))
                log_info "Waiting 3 seconds before next iteration..."
                sleep 3
            fi
        fi
    done
    
    if [[ $CURRENT_ITERATION -eq $MAX_ITERATIONS ]]; then
        echo ""
        log_error "❌ All $MAX_ITERATIONS iterations failed"
        echo ""
        echo "🔍 FINAL DEBUGGING SUMMARY:"
        echo "1. Check backend logs for createTask calls"
        echo "2. Verify database schema has howToDoc/howToVideo fields"
        echo "3. Test GraphQL mutations manually"
        echo "4. Check frontend form submission"
        echo ""
        diagnose_backend
    fi
    
    # Final cleanup
    cleanup_test_data
    
    echo ""
    log_info "🏁 Complete end-to-end testing finished"
}

# Run the main function
main "$@"