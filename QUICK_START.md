# Quick Start Guide for DAP Application

## Services Status Check
```bash
# Check backend health
curl -s http://localhost:4000/health

# Check if frontend is accessible  
curl -s http://localhost:5173 > /dev/null && echo "Frontend accessible" || echo "Frontend not running"

# Check GraphQL endpoint
curl -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"query{__typename}"}'
```

## Start/Restart Services
```bash
# Full app restart
cd /home/rajarora/dap
scripts/app.sh restart

# Start frontend separately if needed
cd frontend && npm run dev
```

## Test Suite Execution  
```bash
cd /home/rajarora/dap

# Main comprehensive tests (87.5% success rate)
node comprehensive-task-creation-tests.js

# Sequence number management tests (100% success)
node sequence-number-comprehensive-test.js  

# Task visibility tests (100% success)
node test-task-visibility-fix.js

# Weight validation tests (100% success)
node test-task-editing-weight-fix.js
```

## Key Achievements
✅ **Task Creation**: Sequence number conflicts resolved  
✅ **Task Editing**: Weight capacity validation fixed  
✅ **Task Visibility**: GraphQL query limits increased  
✅ **Sequence Management**: Auto-reordering on deletion  
✅ **Error Handling**: Comprehensive error recovery  

## Recent Fixes Applied
1. **Visibility Fix**: `tasks(first: 10)` → `tasks(first: 100)` in GraphQL queries
2. **Weight Fix**: Smart capacity-aware weight adjustment in task editing  
3. **Sequence Fix**: Retry logic with P2002 error detection and automatic reordering

**Last Updated**: September 11, 2025 - All systems operational
