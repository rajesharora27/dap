#!/bin/bash

# Simple monitoring test
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 SIMPLE GUI TEST MONITORING${NC}"
echo "=============================="
echo ""

# Test values
TEST_ID=$(date +%s)
TEST_NAME="Simple GUI Test $TEST_ID"
TEST_DOC="https://gui-test-$TEST_ID.example.com"
TEST_VIDEO="https://gui-video-$TEST_ID.example.com"

echo -e "${GREEN}📝 Test Values:${NC}"
echo "   Task Name: $TEST_NAME"
echo "   HowToDoc: $TEST_DOC"  
echo "   HowToVideo: $TEST_VIDEO"
echo ""

echo -e "${BLUE}🌐 Frontend URL: http://localhost:5173${NC}"
echo ""
echo "Instructions:"
echo "1. Open the GUI in your browser"
echo "2. Create a task with the exact values above"
echo "3. Check the browser console for debug logs"
echo "4. Check if the task appears with the howTo values"
echo ""

# Continuously check for the test task
echo "Monitoring for new task creation..."
while true; do
    sleep 3
    RESPONSE=$(curl -s -X POST http://localhost:4000/graphql \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"query { tasks(first: 10, productId: \\\"cmg57oism0006nx013k9yabpq\\\") { edges { node { id name howToDoc howToVideo createdAt } } } }\"}")
    
    if echo "$RESPONSE" | grep -q "$TEST_NAME"; then
        echo ""
        echo -e "${GREEN}✅ Task found!${NC}"
        echo "$RESPONSE" | grep -A 3 -B 3 "$TEST_NAME"
        
        if echo "$RESPONSE" | grep -q "$TEST_DOC" && echo "$RESPONSE" | grep -q "$TEST_VIDEO"; then
            echo ""
            echo -e "${GREEN}🎉 SUCCESS! HowToDoc and HowToVideo values are preserved!${NC}"
            echo -e "${GREEN}🎯 The issue has been RESOLVED!${NC}"
        else
            echo ""
            echo -e "${BLUE}⚠️  Task found but missing howToDoc/howToVideo values${NC}"
            echo "This indicates the GUI is not sending the values properly."
        fi
        break
    fi
    
    echo -n "."
done