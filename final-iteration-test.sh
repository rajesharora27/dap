#!/bin/bash

# Final Iteration Test with Backend Monitoring
# This script will continuously monitor backend logs while you test the GUI

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${PURPLE}🔧 $1${NC}"; }

echo "🔧 FINAL ITERATION TEST WITH BACKEND MONITORING"
echo "==============================================="
echo ""

# Check if services are running
if ! curl -s http://localhost:4000/graphql > /dev/null; then
    log_error "Backend not running. Start with: docker compose up -d"
    exit 1
fi

if ! curl -s http://localhost:5173 > /dev/null; then
    log_error "Frontend not running. Start with: docker compose up -d"
    exit 1
fi

log_success "✅ Both frontend and backend are running"
echo ""

# Create a unique test identifier
TEST_ID=$(date +%s)
TEST_NAME="Final Test $TEST_ID"
TEST_DOC_URL="https://final-test-$TEST_ID.example.com"
TEST_VIDEO_URL="https://final-video-$TEST_ID.example.com"

log_info "🎯 Test Case Details:"
echo "   Task Name: $TEST_NAME"
echo "   HowToDoc: $TEST_DOC_URL"
echo "   HowToVideo: $TEST_VIDEO_URL"
echo ""

# Function to check for new tasks with our test values
check_for_test_task() {
    local response=$(curl -s -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"query { tasks(first: 20, productId: \\\"cmg57oism0006nx013k9yabpq\\\") { edges { node { id name howToDoc howToVideo createdAt } } } }\"}")
    
    echo "$response" | grep -A 5 -B 5 "$TEST_NAME" 2>/dev/null || echo ""
}

# Prove the API works first
log_step "STEP 1: Proving API works with our test values"
API_RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"mutation { createTask(input: { productId: \\\"cmg57oism0006nx013k9yabpq\\\", name: \\\"API Proof $TEST_ID\\\", estMinutes: 30, weight: 1, howToDoc: \\\"$TEST_DOC_URL\\\", howToVideo: \\\"$TEST_VIDEO_URL\\\" }) { id name howToDoc howToVideo } }\"}")

API_TASK_ID=$(echo "$API_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ -n "$API_TASK_ID" ]]; then
    log_success "✅ API test successful. Task ID: $API_TASK_ID"
    if echo "$API_RESPONSE" | grep -q "$TEST_DOC_URL" && echo "$API_RESPONSE" | grep -q "$TEST_VIDEO_URL"; then
        log_success "✅ API correctly preserved howToDoc/howToVideo values"
    else
        log_error "❌ API did not preserve values"
        echo "$API_RESPONSE"
    fi
else
    log_error "❌ API test failed"
    echo "$API_RESPONSE"
    exit 1
fi

echo ""
echo "🎯 NOW TEST THE GUI:"
echo "===================="
echo ""
log_info "1. Open browser to: http://localhost:5173"
log_info "2. Select the 'Test Product for HowTo Debug' product"
log_info "3. Click 'Add Task' button"
log_info "4. Fill in the form with these EXACT values:"
echo ""
echo "   📝 Task Name: $TEST_NAME"
echo "   📝 HowToDoc: $TEST_DOC_URL"
echo "   📝 HowToVideo: $TEST_VIDEO_URL"
echo "   📝 Other fields: Use any reasonable values"
echo ""
log_info "5. Click 'Save Task'"
log_info "6. Check if the task appears in the list with the howTo values"
echo ""

# Start monitoring backend logs in background
log_step "Starting backend log monitoring..."
echo ""
echo "📊 BACKEND LOG MONITOR (watching for createTask operations):"
echo "==========================================================="

# Monitor backend logs and check for our test task periodically
monitor_count=0
max_monitor=60  # Monitor for 60 iterations (about 2 minutes)

while [ $monitor_count -lt $max_monitor ]; do
    # Check backend logs for createTask operations
    recent_logs=$(docker compose logs backend --tail=10 2>&1 | grep -E "(createTask|🚀|📝|howTo)" 2>/dev/null || echo "")
    
    if [[ -n "$recent_logs" ]]; then
        echo ""
        echo "🔍 Recent backend activity:"
        echo "$recent_logs"
        echo ""
    fi
    
    # Check if our test task was created via GUI
    gui_task_check=$(check_for_test_task)
    if [[ -n "$gui_task_check" ]]; then
        echo ""
        log_success "🎉 GUI task detected!"
        echo "$gui_task_check"
        
        # Analyze the task
        if echo "$gui_task_check" | grep -q "$TEST_DOC_URL" && echo "$gui_task_check" | grep -q "$TEST_VIDEO_URL"; then
            echo ""
            log_success "🎉🎉 SUCCESS! GUI correctly created task with howToDoc/howToVideo values!"
            log_success "🎯 The issue has been RESOLVED!"
        else
            echo ""
            log_error "❌ GUI task missing howToDoc/howToVideo values"
            log_error "🔍 This confirms the GUI is not sending the values correctly"
            
            # Show what was actually sent
            echo ""
            echo "🔍 What the GUI actually sent:"
            echo "$gui_task_check"
        fi
        break
    fi
    
    # Show a dot to indicate monitoring is active
    echo -n "."
    sleep 2
    monitor_count=$((monitor_count + 1))
done

if [ $monitor_count -eq $max_monitor ]; then
    echo ""
    log_warning "⏰ Monitoring timeout reached"
    log_info "If you didn't test the GUI yet, you can run this script again"
fi

echo ""
echo "🔍 FINAL ANALYSIS:"
echo "=================="
echo ""

# Check current task list for our test values
current_tasks=$(check_for_test_task)
if [[ -n "$current_tasks" ]]; then
    log_info "Tasks with our test name found:"
    echo "$current_tasks"
else
    log_info "No tasks with our test name found yet"
fi

echo ""
log_info "💡 DEBUGGING TIPS:"
echo "   1. Open browser dev tools (F12)"
echo "   2. Go to Network tab"
echo "   3. Filter by 'graphql'"
echo "   4. Create a task and watch the network request"
echo "   5. Check the request payload for howToDoc/howToVideo values"
echo ""
echo "   If values are missing in the network request:"
echo "   → Problem is in TaskDialog.tsx form handling"
echo ""
echo "   If values are present in the network request but not in database:"
echo "   → Problem is in backend (but our tests show backend works)"
echo ""
echo "   If values are in database but not shown in GUI:"
echo "   → Problem is in TasksPanel.tsx display logic"

# Cleanup API test task
if [[ -n "$API_TASK_ID" ]]; then
    docker compose exec -T db psql -U postgres -d dap -c "DELETE FROM \"Task\" WHERE id = '$API_TASK_ID';" 2>/dev/null || true
fi

echo ""
log_info "🏁 Test ready. Please test the GUI now and report the results!"