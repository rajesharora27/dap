# GUI Not Showing Data Fix - November 11, 2025

## Issue

User reports that the GUI is not showing any data (Products, Solutions, Customers tabs are empty) with no console errors.

## Root Cause

After the database reset, the frontend still has an old authentication token in `localStorage` that references a user ID that no longer exists in the database. The token is technically valid (not expired) but references a non-existent user, causing all queries to fail silently.

## Quick Fix (3 Options)

### Option 1: Browser Console (Fastest)

1. Open browser Developer Tools (`F12` or `Ctrl+Shift+I`)
2. Go to **Console** tab
3. Run these commands:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

### Option 2: Use Clear Sessions Page

1. Open this file in your browser:
   ```
   file:///data/dap/clear-sessions.html
   ```
   OR
   ```bash
   firefox /data/dap/clear-sessions.html
   ```

2. Click the "Clear Session & Redirect to Login" button

### Option 3: Browser Settings

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Expand **Storage** in left sidebar
4. Right-click **Local Storage** → **Clear**
5. Right-click **Session Storage** → **Clear**
6. Reload page (`Ctrl+R`)

**Firefox:**
1. Press `F12` to open DevTools
2. Go to **Storage** tab
3. Expand **Local Storage** in left sidebar
4. Right-click → **Delete All**
5. Expand **Session Storage** → Right-click → **Delete All**
6. Reload page (`Ctrl+R`)

## Login Credentials

After clearing the session:
- **Username:** `admin`
- **Password:** `DAP123`

## Technical Details

### Why This Happened

1. Database was reset using `npx prisma migrate reset --force`
2. Admin user was recreated with a new user ID: `cmhuzmrsv0000su8glqglbezz`
3. Old JWT token in localStorage referenced the old user ID
4. Backend couldn't find user with old ID, causing queries to fail
5. Frontend didn't detect the authentication error and didn't redirect to login

### What Was Fixed

**Backend:** Already properly validates tokens and rejects requests with invalid users

**Frontend:** Updated `ApolloClientProvider.tsx` to:
1. Detect authentication errors in GraphQL responses
2. Automatically clear localStorage and sessionStorage
3. Redirect to login page when authentication fails

**New Error Detection** (lines 39-51):
```typescript
// Check for authentication errors
if (message.includes('Authentication required') || 
    message.includes('Not authenticated') ||
    message.includes('Invalid token') ||
    message.includes('User not found') ||
    message.includes('prisma.user.findUnique') && message.includes('undefined')) {
  console.warn('🔒 Authentication error detected - clearing session');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.clear();
  // Reload to trigger login page
  setTimeout(() => window.location.href = '/', 100);
}
```

## Verification

After clearing the session and logging in, verify data is loading:

```bash
# Check that products are visible
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_NEW_TOKEN" \
  -d '{"query":"query { products { totalCount } }"}' | jq .
```

Expected response:
```json
{
  "data": {
    "products": {
      "totalCount": 5
    }
  }
}
```

## Prevention

This issue will be automatically prevented in the future because:

1. **Auto-detection:** Frontend now automatically detects invalid tokens
2. **Auto-logout:** Invalid tokens trigger automatic logout and redirect
3. **Clear errors:** Authentication errors are logged to console

## Files Modified

- **`frontend/src/components/ApolloClientProvider.tsx`**:
  - Added authentication error detection in `errorLink`
  - Automatically clears session on auth errors
  - Redirects to login page after clearing session

- **`clear-sessions.html`** (NEW):
  - Helper page to manually clear sessions
  - Located at `/data/dap/clear-sessions.html`

## Related Issues

This is a continuation of the database schema sync issue from earlier today:
- `docs/DATABASE_SCHEMA_SYNC_FIX.md` - Database reset that caused this
- `docs/FORCE_RESTART_AND_RESOLVER_FIX.md` - Resolver fixes

## Next Steps for User

1. **Clear session** using one of the three options above
2. **Log in** with admin credentials
3. **Verify data** is now visible in all tabs
4. **Refresh browser** (`Ctrl+Shift+R`) if needed

## Future Improvements

Consider implementing:
1. Token refresh mechanism to avoid forced re-logins
2. Better error messages when authentication fails
3. Visual indicator when session is invalid
4. Automatic retry with token refresh on 401 errors

