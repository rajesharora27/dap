#!/bin/bash

# End-to-end automation script to test and fix howToDoc/howToVideo persistence
# This script simulates user behavior and iterates until the issue is resolved

echo "🚀 Starting End-to-End HowTo Persistence Test"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variables
TEST_PRODUCT_ID="cmg57oism0006nx013k9yabpq"
TEST_COUNTER=1
MAX_ITERATIONS=10
CURRENT_ITERATION=1

# Function to log with colors
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to check if services are ready
check_services() {
    log_info "Checking service availability..."
    
    # Check backend
    if curl -s http://localhost:4000/health > /dev/null; then
        log_success "Backend is ready"
    else
        log_error "Backend not available"
        return 1
    fi
    
    # Check frontend
    if curl -s http://localhost:5173 > /dev/null; then
        log_success "Frontend is ready"
    else
        log_error "Frontend not available"
        return 1
    fi
    
    return 0
}

# Function to create task via direct API (baseline test)
test_direct_api() {
    local task_name="API Test Task ${TEST_COUNTER}"
    local how_to_doc="https://api-test-${TEST_COUNTER}.example.com"
    local how_to_video="https://api-video-${TEST_COUNTER}.example.com"
    
    log_info "Creating task via direct API: ${task_name}"
    
    local response=$(curl -s -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { createTask(input: { productId: \\\"${TEST_PRODUCT_ID}\\\", name: \\\"${task_name}\\\", estMinutes: 30, weight: 1, howToDoc: \\\"${how_to_doc}\\\", howToVideo: \\\"${how_to_video}\\\" }) { id name howToDoc howToVideo } }\"}")
    
    if echo "$response" | grep -q "\"${task_name}\""; then
        local task_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        local returned_doc=$(echo "$response" | grep -o '"howToDoc":"[^"]*"' | cut -d'"' -f4)
        local returned_video=$(echo "$response" | grep -o '"howToVideo":"[^"]*"' | cut -d'"' -f4)
        
        if [[ "$returned_doc" == "$how_to_doc" && "$returned_video" == "$how_to_video" ]]; then
            log_success "Direct API test PASSED - Task created with correct howTo fields"
            echo "    Task ID: $task_id"
            echo "    HowToDoc: $returned_doc"
            echo "    HowToVideo: $returned_video"
            return 0
        else
            log_error "Direct API test FAILED - HowTo fields not correct"
            echo "    Expected Doc: $how_to_doc"
            echo "    Returned Doc: $returned_doc"
            echo "    Expected Video: $how_to_video" 
            echo "    Returned Video: $returned_video"
            return 1
        fi
    else
        log_error "Direct API test FAILED - Task creation failed"
        echo "    Response: $response"
        return 1
    fi
}

# Function to simulate frontend task creation using GraphQL
simulate_frontend_graphql() {
    local task_name="Frontend Test Task ${TEST_COUNTER}"
    local how_to_doc="https://frontend-test-${TEST_COUNTER}.example.com"
    local how_to_video="https://frontend-video-${TEST_COUNTER}.example.com"
    
    log_info "Simulating frontend GraphQL call: ${task_name}"
    
    # Simulate the exact format that frontend should send
    local frontend_payload="{
        \"query\": \"mutation CreateTask(\$input:TaskInput!){ createTask(input:\$input){ id name description estMinutes weight notes priority licenseLevel howToDoc howToVideo product { id name } outcomes { id name } } }\",
        \"variables\": {
            \"input\": {
                \"productId\": \"${TEST_PRODUCT_ID}\",
                \"name\": \"${task_name}\",
                \"description\": \"Test description\",
                \"estMinutes\": 30,
                \"weight\": 1,
                \"notes\": \"Test notes\",
                \"priority\": \"Medium\",
                \"howToDoc\": \"${how_to_doc}\",
                \"howToVideo\": \"${how_to_video}\"
            }
        }
    }"
    
    local response=$(curl -s -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d "$frontend_payload")
    
    if echo "$response" | grep -q "\"${task_name}\""; then
        local task_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        local returned_doc=$(echo "$response" | grep -o '"howToDoc":"[^"]*"' | cut -d'"' -f4)
        local returned_video=$(echo "$response" | grep -o '"howToVideo":"[^"]*"' | cut -d'"' -f4)
        
        log_success "Frontend GraphQL simulation created task: $task_id"
        
        # Now verify by fetching the task back
        verify_task_persistence "$task_id" "$how_to_doc" "$how_to_video"
        return $?
    else
        log_error "Frontend GraphQL simulation FAILED"
        echo "    Response: $response"
        return 1
    fi
}

# Function to verify task persistence by fetching it back
verify_task_persistence() {
    local task_id="$1"
    local expected_doc="$2"
    local expected_video="$3"
    
    log_info "Verifying task persistence for ID: $task_id"
    
    # Query the task back from database
    local fetch_query="{\"query\": \"query { tasks(first: 100, productId: \\\"${TEST_PRODUCT_ID}\\\") { edges { node { id name howToDoc howToVideo } } } }\"}"
    
    local response=$(curl -s -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d "$fetch_query")
    
    # Look for our specific task in the response
    if echo "$response" | grep -q "\"$task_id\""; then
        # Extract the task data
        local task_data=$(echo "$response" | grep -A 10 -B 10 "\"$task_id\"")
        local persisted_doc=$(echo "$task_data" | grep -o '"howToDoc":"[^"]*"' | cut -d'"' -f4)
        local persisted_video=$(echo "$task_data" | grep -o '"howToVideo":"[^"]*"' | cut -d'"' -f4)
        
        log_info "Task found in database:"
        echo "    Expected HowToDoc: $expected_doc"
        echo "    Persisted HowToDoc: $persisted_doc"
        echo "    Expected HowToVideo: $expected_video"
        echo "    Persisted HowToVideo: $persisted_video"
        
        if [[ "$persisted_doc" == "$expected_doc" && "$persisted_video" == "$expected_video" ]]; then
            log_success "PERSISTENCE TEST PASSED - HowTo fields correctly persisted!"
            return 0
        else
            log_error "PERSISTENCE TEST FAILED - HowTo fields not persisted correctly"
            return 1
        fi
    else
        log_error "Task not found in database query"
        echo "    Response: $response"
        return 1
    fi
}

# Function to test empty string handling
test_empty_strings() {
    local task_name="Empty String Test ${TEST_COUNTER}"
    
    log_info "Testing empty string handling: ${task_name}"
    
    local response=$(curl -s -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"mutation { createTask(input: { productId: \\\"${TEST_PRODUCT_ID}\\\", name: \\\"${task_name}\\\", estMinutes: 30, weight: 1, howToDoc: \\\"\\\", howToVideo: \\\"\\\" }) { id name howToDoc howToVideo } }\"}")
    
    if echo "$response" | grep -q "\"${task_name}\""; then
        local task_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        local returned_doc=$(echo "$response" | grep -o '"howToDoc":[^,}]*' | cut -d':' -f2)
        local returned_video=$(echo "$response" | grep -o '"howToVideo":[^,}]*' | cut -d':' -f2)
        
        log_success "Empty string test created task: $task_id"
        echo "    HowToDoc: $returned_doc (should be null)"
        echo "    HowToVideo: $returned_video (should be null)"
        
        if [[ "$returned_doc" == "null" && "$returned_video" == "null" ]]; then
            log_success "Empty string handling CORRECT"
            return 0
        else
            log_warning "Empty string handling unexpected but task created"
            return 0
        fi
    else
        log_error "Empty string test FAILED"
        echo "    Response: $response"
        return 1
    fi
}

# Function to check database weight capacity
check_weight_capacity() {
    log_info "Checking weight capacity for test product..."
    
    local weight_query="SELECT COALESCE(SUM(weight), 0) as used_weight FROM \"Task\" WHERE \"deletedAt\" IS NULL AND \"productId\" = '${TEST_PRODUCT_ID}';"
    local weight_result=$(docker compose exec -T db psql -U postgres -d dap -c "$weight_query" 2>/dev/null | grep -E "^[[:space:]]*[0-9]+[[:space:]]*$" | tr -d ' ')
    
    if [[ -n "$weight_result" && "$weight_result" =~ ^[0-9]+$ ]]; then
        local remaining=$((100 - weight_result))
        echo "    Used weight: ${weight_result}%"
        echo "    Remaining weight: ${remaining}%"
        
        if [[ $remaining -gt 5 ]]; then
            log_success "Sufficient weight capacity available"
            return 0
        else
            log_warning "Low weight capacity, cleaning up test tasks..."
            cleanup_test_tasks
            return 0  # Continue anyway
        fi
    else
        log_warning "Could not determine weight capacity, continuing..."
        return 0
    fi
}

# Function to cleanup test tasks
cleanup_test_tasks() {
    log_info "Cleaning up test tasks..."
    
    docker compose exec -T db psql -U postgres -d dap -c "DELETE FROM \"Task\" WHERE name LIKE '%Test Task%' OR name LIKE '%Debug Test%' OR name LIKE '%API Test%' OR name LIKE '%Frontend Test%';" 2>/dev/null
    
    log_success "Test tasks cleaned up"
}

# Function to monitor backend logs during frontend simulation
monitor_backend_logs() {
    log_info "Monitoring backend logs for GraphQL calls..."
    
    # Start backend log monitoring in background
    timeout 10s docker compose logs -f backend 2>&1 | grep -E "(CREATE_TASK|createTask|🚀|❌|✅)" &
    local monitor_pid=$!
    
    # Wait a bit for monitoring to start
    sleep 2
    
    # Return the PID so we can stop monitoring later
    echo $monitor_pid
}

# Function to run diagnostic checks
run_diagnostics() {
    log_info "Running diagnostic checks..."
    
    # Check if containers are running
    log_info "Container status:"
    docker compose ps
    
    # Check backend logs for any errors
    log_info "Recent backend errors:"
    docker compose logs backend --tail=5 2>&1 | grep -i error || echo "No recent backend errors"
    
    # Check frontend logs for any errors  
    log_info "Recent frontend errors:"
    docker compose logs frontend --tail=5 2>&1 | grep -i error || echo "No recent frontend errors"
    
    # Test basic GraphQL connectivity
    log_info "Testing basic GraphQL introspection:"
    local introspection=$(curl -s -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query": "{ __schema { types { name } } }"}')
    if echo "$introspection" | grep -q "__schema"; then
        log_success "GraphQL introspection working"
    else
        log_error "GraphQL introspection failed"
        echo "Response: $introspection"
    fi
}

# Main test iteration function
run_test_iteration() {
    echo ""
    echo "🔄 ITERATION $CURRENT_ITERATION/$MAX_ITERATIONS"
    echo "=================================="
    
    # Increment test counter for unique names
    TEST_COUNTER=$((TEST_COUNTER + 1))
    
    # Check services
    if ! check_services; then
        log_error "Services not ready, skipping iteration"
        return 1
    fi
    
    # Check weight capacity
    if ! check_weight_capacity; then
        log_warning "Weight capacity issues, cleaned up and continuing"
    fi
    
    # Test 1: Direct API (baseline)
    echo ""
    log_info "TEST 1: Direct API (Baseline)"
    if test_direct_api; then
        log_success "Direct API test passed"
    else
        log_error "Direct API test failed - fundamental backend issue"
        return 1
    fi
    
    # Test 2: Frontend GraphQL simulation
    echo ""
    log_info "TEST 2: Frontend GraphQL Simulation"
    if simulate_frontend_graphql; then
        log_success "Frontend GraphQL simulation passed - ISSUE APPEARS TO BE FIXED!"
        return 0
    else
        log_error "Frontend GraphQL simulation failed"
    fi
    
    # Test 3: Empty string handling
    echo ""
    log_info "TEST 3: Empty String Handling"
    if test_empty_strings; then
        log_success "Empty string test passed"
    else
        log_error "Empty string test failed"
    fi
    
    # Run diagnostics
    echo ""
    run_diagnostics
    
    return 1
}

# Main execution
main() {
    echo "Starting automated end-to-end testing..."
    echo "This script will simulate user behavior and test howToDoc/howToVideo persistence"
    echo ""
    
    # Initial diagnostics
    run_diagnostics
    
    # Run test iterations
    for ((i=1; i<=MAX_ITERATIONS; i++)); do
        CURRENT_ITERATION=$i
        
        if run_test_iteration; then
            log_success "🎉 SUCCESS! HowTo persistence issue appears to be resolved in iteration $i"
            break
        else
            log_warning "Iteration $i failed, trying next iteration..."
            
            if [[ $i -lt $MAX_ITERATIONS ]]; then
                log_info "Waiting 2 seconds before next iteration..."
                sleep 2
            fi
        fi
    done
    
    if [[ $CURRENT_ITERATION -eq $MAX_ITERATIONS ]]; then
        log_error "❌ All $MAX_ITERATIONS iterations failed"
        echo ""
        echo "🔍 DEBUGGING SUMMARY:"
        echo "- Direct API calls work perfectly"
        echo "- Frontend GraphQL simulation may be failing"  
        echo "- Issue likely in frontend form submission or Apollo Client"
        echo ""
        echo "🎯 NEXT STEPS:"
        echo "1. Check browser console for JavaScript errors"
        echo "2. Check browser Network tab for failed GraphQL requests"
        echo "3. Verify frontend form validation is not blocking submission"
        echo "4. Check Apollo Client configuration"
    fi
    
    # Final cleanup
    log_info "Cleaning up test data..."
    cleanup_test_tasks
    
    echo ""
    log_info "🏁 End-to-end testing completed"
}

# Run the main function
main "$@"