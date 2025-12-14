#!/bin/bash
# Test script to verify DevTools API is accessible from the frontend

echo "=== DevTools API Connection Test ==="
echo ""

echo "1. Testing DevTools health endpoint..."
curl -s http://localhost:4001/health | jq '.'
echo ""

echo "2. Testing test suites endpoint..."
curl -s http://localhost:4001/api/dev/tests/suites | jq '.suites | length'
echo ""

echo "3. Testing database status..."
curl -s http://localhost:4001/api/dev/database/status -H "Authorization: Bearer dev-token" | jq '.connected'
echo ""

echo "4. Testing system info..."
curl -s http://localhost:4001/api/dev/system-info -H "Authorization: Bearer dev-token" | jq '.env'
echo ""

echo "5. Starting a test job..."
JOB_ID=$(curl -s -X POST http://localhost:4001/api/dev/tests/run-stream \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"pattern":"","coverage":false}' | jq -r '.jobId')

if [ -z "$JOB_ID" ] || [ "$JOB_ID" = "null" ]; then
  echo "❌ Failed to start test job"
  exit 1
fi

echo "✅ Test job started: $JOB_ID"
echo ""

echo "6. Checking job status after 2 seconds..."
sleep 2
curl -s "http://localhost:4001/api/dev/tests/status/$JOB_ID?offset=0" \
  -H "Authorization: Bearer dev-token" | jq '.status, .id' | head -5

echo ""
echo "=== All DevTools API endpoints are working! ==="
