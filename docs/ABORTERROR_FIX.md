# AbortError Fix - November 11, 2025

## Problem

Users were seeing `AbortError: signal is aborted without reason` errors in the browser console when:
- Logging out
- Navigating to the login page
- Server restarts causing auth token invalidation
- Any auth state changes while Apollo Client had requests in flight

## Root Cause

The issue occurred because:

1. **Aggressive Storage Clearing**: `LoginPage.tsx` was using `localStorage.clear()` which immediately removed all data, including auth tokens
2. **In-Flight Requests**: Apollo Client had active GraphQL requests that were using those tokens
3. **Request Abortion**: When tokens were suddenly cleared, Apollo Client's fetch operations were aborted mid-flight
4. **Error Propagation**: These aborted requests bubbled up as `AbortError` exceptions

### Technical Details

```typescript
// BEFORE (LoginPage.tsx) - Aggressive clearing
useEffect(() => {
  localStorage.clear(); // ❌ Clears everything immediately
  sessionStorage.clear();
}, []);
```

This caused race conditions when:
- AuthContext was validating session
- Apollo Client was fetching data
- Navigation events were occurring

## Solution

### 1. Gentle Storage Clearing

**File**: `frontend/src/components/LoginPage.tsx`

Changed from aggressive `localStorage.clear()` to gentle, targeted clearing:

```typescript
// AFTER - Gentle clearing
useEffect(() => {
  // Only clear if not already cleared
  const hasToken = localStorage.getItem('token');
  const hasUser = localStorage.getItem('user');
  
  if (hasToken || hasUser) {
    // Clear auth-related items only
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
  }
  
  setTimeout(() => setShowLogin(true), 300);
}, []);
```

**Benefits**:
- Avoids clearing if already cleared
- No race condition with AuthContext
- Preserves other localStorage items (if any)

### 2. Apollo Client Error Handling

**File**: `frontend/src/components/ApolloClientProvider.tsx`

Added an error link to gracefully handle AbortErrors:

```typescript
import { onError } from '@apollo/client/link/error';

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  // Ignore AbortErrors - these are expected during navigation/logout
  if (networkError && networkError.name === 'AbortError') {
    console.log('🔄 Request aborted (expected during navigation):', operation.operationName);
    return;
  }

  // Log other errors normally
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  }

  if (networkError && networkError.name !== 'AbortError') {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Include error link in Apollo Client
const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  // ...
});
```

**Benefits**:
- AbortErrors logged as info, not errors
- Clear indication that abort is expected
- Better error visibility for real issues

### 3. Improved Fetch Error Handling

Updated the custom fetch wrapper to distinguish AbortErrors:

```typescript
fetch: (uri, options) => {
  return fetch(uri, options)
    .then(async response => {
      // ... response handling
      return response;
    })
    .catch(error => {
      // Ignore AbortErrors - expected during navigation/logout
      if (error.name === 'AbortError') {
        console.log('🔄 Fetch aborted (expected during navigation)');
        throw error; // Still throw so Apollo can handle it
      }
      
      console.error('🚨 Fetch Error:', error);
      throw error;
    });
}
```

### 4. Network-Only Fetch Policy

Changed Apollo Client default fetch policy to prevent cache issues:

```typescript
const apolloClient = new ApolloClient({
  // ...
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'network-only' // NEW: Prevent cache issues
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'network-only' // NEW: Prevent cache issues
    }
  }
});
```

**Benefits**:
- Fresh data after auth changes
- No stale cache during login/logout
- Consistent auth state

## Impact

### Before Fix
```
❌ Console Error: Fetch Error: AbortError: signal is aborted without reason
❌ Console Error: at @apollo_client.js:772:22
❌ Stack trace: ... (long error trace)
❌ User confused by error messages
```

### After Fix
```
✅ Console Info: 🔄 Request aborted (expected during navigation): GetProducts
✅ Console Info: 🔄 Fetch aborted (expected during navigation)
✅ Clean console, no error noise
✅ Clear indication of expected behavior
```

## Testing Performed

### Test 1: Normal Logout
1. User clicks logout
2. Observe console
3. ✅ Result: Only info messages, no errors

### Test 2: Server Restart
1. Backend restarts (clears all sessions)
2. Frontend auto-redirects to login
3. ✅ Result: Clean redirect, no AbortErrors

### Test 3: Token Expiration
1. Wait for token to expire
2. Auto-logout triggers
3. ✅ Result: Graceful logout, expected abort messages

### Test 4: Navigate to Login While Loading
1. Start loading data
2. Navigate to /login
3. ✅ Result: Requests abort cleanly, no errors

## Related Changes

- **Session Management**: Server restart clears sessions
- **Auth Context**: Token validation and auto-logout
- **Login Page**: Gentle storage clearing

## Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `frontend/src/components/LoginPage.tsx` | Gentle storage clearing | Avoid race conditions |
| `frontend/src/components/ApolloClientProvider.tsx` | Error link + fetch policy | Handle aborts gracefully |
| `docs/SESSION_SECURITY_IMPLEMENTATION.md` | Documentation update | Record fix details |
| `docs/SECURITY_QUICK_REFERENCE.md` | Troubleshooting section | Help users understand AbortErrors |

## Prevention

### Best Practices

1. **Never use `localStorage.clear()`** in auth flows
   - Use targeted removal instead
   - Check before clearing

2. **Always handle AbortErrors** in Apollo Client
   - Add error link
   - Distinguish from real errors

3. **Use appropriate fetch policies**
   - `network-only` for auth-sensitive queries
   - Cache after login, not before

4. **Log appropriately**
   - Info for expected aborts
   - Error for unexpected failures

### Code Review Checklist

- [ ] No `localStorage.clear()` in auth code
- [ ] AbortError handling in place
- [ ] Appropriate logging levels
- [ ] Fetch policies set correctly
- [ ] No race conditions in storage access

## Future Improvements

### Potential Enhancements

1. **Request Cancellation**
   - Cancel in-flight requests before logout
   - Use AbortController explicitly
   - Clean shutdown of Apollo Client

2. **Cache Management**
   - Clear Apollo cache on logout
   - Reset store on auth changes
   - Prevent stale data

3. **Loading States**
   - Show loading during logout
   - Prevent navigation during critical operations
   - Better UX feedback

4. **Error Boundaries**
   - Catch auth errors at boundary level
   - Graceful fallback UI
   - User-friendly error messages

## References

- **Apollo Client Error Handling**: https://www.apollographql.com/docs/react/data/error-handling/
- **Fetch AbortController**: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
- **Apollo Client Link Chain**: https://www.apollographql.com/docs/react/api/link/introduction/

## Support

If you encounter AbortErrors after this fix:

1. **Check Error Link**: Verify `errorLink` is in Apollo Client chain
2. **Check Storage Clearing**: Ensure gentle clearing is used
3. **Check Console**: Look for "expected during navigation" messages
4. **Check Timing**: Aborts during logout/navigation are normal

For persistent issues, check:
- Network conditions
- Server availability
- Token validity
- Auth state consistency

---

**Fix Date**: November 11, 2025  
**Status**: ✅ Resolved  
**Impact**: Frontend only  
**Breaking Changes**: None

