# Tests Panel Debugging Guide

**Date:** 2025-12-12  
**Issue:** Tests panel in development toolkit

## Changes Made

### 1. Enhanced Error Handling in EnhancedTestsPanel.tsx

**Location:** `/data/dap/frontend/src/components/dev/EnhancedTestsPanel.tsx`

#### Improvements:
1. **Better error reporting in fetchSuites():**
   - Added console logging with `[Tests Panel]` prefix for easier debugging
   - Logs the actual API URL being called
   - Checks HTTP response status before parsing JSON
   - Displays errors in the test output panel instead of just console

2. **Better error handling in runTests():**
   - Logs the API URL for test execution
   - Checks HTTP status and provides detailed error messages
   - Shows full error response text when available
   - Better JSON parsing error handling

### 2. Created DevTools Connection Tester

**Location:** `/data/dap/frontend/src/components/dev/DevToolsConnectionTest.tsx`

This is a new diagnostic component that:
- Tests the connection to DevTools backend
- Verifies API base URL configuration
- Tests health endpoint
- Tests test suites API
- Tests database API
- Checks CORS configuration
- Displays all results in a user-friendly UI

**To use this tester:**
```tsx
import { DevToolsConnectionTest } from './components/dev/DevToolsConnectionTest';

// Add to your development menu or render directly
<DevToolsConnectionTest />
```

### 3. Created Backend API Test Script

**Location:** `/data/dap/scripts/test-devtools-api.sh`

This bash script tests all DevTools endpoints from the command line:
```bash
chmod +x scripts/test-devtools-api.sh
./scripts/test-devtools-api.sh
```

**Tests:**
- Health endpoint
- Test suites listing
- Database status
- System info
- Test job creation and monitoring

## Verification

### Backend API Status: ✅ WORKING

All DevTools backend endpoints are functioning correctly:
- Port 4001 is accessible
- All API endpoints respond correctly
- CORS is configured (allows all origins in dev)
- Auth fallback works (dev mode allows requests without token)

### Test Results:
```bash
$ ./scripts/test-devtools-api.sh
✅ Health endpoint: OK
✅ Test suites: 15 suites found
✅ Database status: Connected
✅ System info: development environment
✅ Test job creation: Working
```

## Debugging Steps

If the Tests panel still shows errors in the UI:

### 1. Open Browser Console
The enhanced error handling now logs detailed information:
```
[Tests Panel] Fetching test suites from: http://localhost:4001/api/dev/tests/suites
[Tests Panel] Received suites: 15
[Tests Panel] Starting test job at: http://localhost:4001/api/dev/tests/run-stream
[Tests Panel] Test job response: { jobId: "test-xxx", status: "started" }
```

### 2. Check Network Tab
- Look for failed requests to `http://localhost:4001`
- Check if requests are being redirected
- Verify CORS headers are present

### 3. Common Issues and Solutions

#### Issue: "Failed to fetch"
**Cause:** DevTools backend not running or wrong port  
**Solution:** 
```bash
# Check if DevTools backend is running
curl http://localhost:4001/health

# Start it if needed
cd /data/dap/backend
npm run dev:devtools
```

#### Issue: "HTTP 403" or "HTTP 401"
**Cause:** Authentication issue  
**Solution:** The dev mode should have fallback auth. Check `devTools.ts` middleware at lines 46-59.

#### Issue: "CORS error"
**Cause:** CORS not properly configured  
**Solution:** Verify `devtools-service.ts` has:
```typescript
app.use(cors({
    origin: true, // Allow all origins in dev
    credentials: true
}));
```

#### Issue: Network requests going to wrong URL
**Cause:** `getDevApiBaseUrl()` returning incorrect value  
**Solution:** Check `frontend.config.ts`. Should return:
- `http://localhost:4001` in local development
- `/dap` when accessed through Apache proxy

### 4. Use the Connection Tester

Add the `DevToolsConnectionTest` component to your development toolkit to see exactly what's failing:

```tsx
// In your dev menu component
import { DevToolsConnectionTest } from './components/dev/DevToolsConnectionTest';

// Add a tab or button to show it
<DevToolsConnectionTest />
```

This will show you:
- What URL is being used
- Which specific API calls are failing
- Exact error messages
- CORS status

## Expected Behavior

When working correctly, the Tests panel should:

1. **On load:**
   - Fetch 15 test suites
   - Display them categorized by type (unit/integration/e2e)
   - Show checkboxes to filter tests

2. **When running tests:**
   - Start a job and get job ID
   - Poll for status every second
   - Stream output to the panel
   - Show final results (passed/failed counts)

3. **Console output:**
   ```
   [Tests Panel] Fetching test suites from: http://localhost:4001/api/dev/tests/suites
   [Tests Panel] Received suites: 15
   ```

## Additional Notes

### Why This Works in Terminal But Might Fail in UI

The UI and terminal use different mechanisms:
- **Terminal:** Direct HTTP requests via curl (bypasses browser security)
- **UI:** Browser fetch API (subject to CORS, mixed content, CSP)

### Production vs Development

**Development mode (localhost:5173):**
- Frontend connects directly to `http://localhost:4001`
- CORS is required
- Both services must be running

**Production mode (Apache proxy):**
- Frontend makes relative requests
- Apache proxies `/dap/api/dev/*` to `http://localhost:4001/api/dev/*`
- No CORS needed
- Single origin

## Files Modified

1. `/data/dap/frontend/src/components/dev/EnhancedTestsPanel.tsx` - Enhanced error handling
2. `/data/dap/frontend/src/components/dev/DevToolsConnectionTest.tsx` - New diagnostic tool
3. `/data/dap/scripts/test-devtools-api.sh` - New test script

## Next Steps

1. **Open the Tests panel in the browser**
2. **Open browser DevTools console** (F12)
3. **Look for the new log messages** starting with `[Tests Panel]`
4. **If there are errors**, they will now show in both console and UI
5. **Use the connection tester** to identify the exact failure point

The enhanced logging should make it immediately clear what's failing.
