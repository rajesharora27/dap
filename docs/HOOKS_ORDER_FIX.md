# React Hooks Order Fix - November 11, 2025

## Problem

**Error**: `React has detected a change in the order of Hooks called by App. This will lead to bugs and errors if not fixed.`

**Location**: `frontend/src/pages/App.tsx:1080`

## Root Cause

Hooks were being called **after** early return statements in the `App` component. This violated the [Rules of Hooks](https://react.dev/link/rules-of-hooks), which state:

> **Only call Hooks at the top level**. Don't call Hooks inside loops, conditions, or nested functions. Instead, always use Hooks at the top level of your React function, before any early returns.

### Original Structure (INCORRECT)

```typescript
export function App() {
  // ✅ Hooks: useApolloClient, useAuth
  const client = useApolloClient();
  const { token, isAuthenticated, isLoading } = useAuth();
  
  // ✅ Hooks: useState (many)
  const [selectedSection, setSelectedSection] = useState('products');
  // ... more useState calls ...
  
  // ✅ Hooks: useSensors
  const sensors = useSensors(/* ... */);
  
  // ✅ Hooks: useQuery (6 queries)
  const { data: productsData, ... } = useQuery(PRODUCTS, ...);
  const { data: solutionsData, ... } = useQuery(SOLUTIONS, ...);
  // ... more useQuery calls ...
  
  // ❌ EARLY RETURN #1
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // ❌ EARLY RETURN #2
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  // ❌ Hooks AFTER early returns (WRONG!)
  React.useEffect(() => { /* ... */ }, [products, selectedProduct]);
  React.useEffect(() => { /* ... */ }, [selectedSection, customers]);
  React.useEffect(() => { /* ... */ }, [selectedCustomerId]);
  React.useCallback(() => { /* ... */ }, []);
  React.useCallback(() => { /* ... */ }, []);
}
```

### Why This Caused Problems

1. **When `isLoading` is true**: 
   - All hooks up to line 957 are called
   - Early return happens at line 960
   - Hooks at lines 1080+ are **NOT** called
   - Total hooks called: ~40

2. **When `isAuthenticated` is false**:
   - All hooks up to line 957 are called
   - Early return happens at line 996
   - Hooks at lines 1080+ are **NOT** called
   - Total hooks called: ~40

3. **When authenticated and loaded**:
   - All hooks up to line 957 are called
   - No early return
   - Hooks at lines 1080+ **ARE** called
   - Total hooks called: ~45

**Result**: React sees different numbers/orders of hooks between renders → Error!

## Solution

Move **all** hooks (including `useEffect` and `useCallback`) to **before** the early return statements. Add `isAuthenticated` guards **inside** the hooks instead of relying on early returns.

### Fixed Structure (CORRECT)

```typescript
export function App() {
  // ✅ All hooks at the top level
  const client = useApolloClient();
  const { token, isAuthenticated, isLoading } = useAuth();
  
  const [selectedSection, setSelectedSection] = useState('products');
  // ... more useState calls ...
  
  const sensors = useSensors(/* ... */);
  
  const { data: productsData, ... } = useQuery(PRODUCTS, {
    skip: !isAuthenticated  // Guard inside hook
  });
  // ... more useQuery calls ...
  
  // Extract data (needs to happen before using in hooks)
  const products = productsData?.products?.edges?.map(...) || [];
  const solutions = solutionsData?.solutions?.edges?.map(...) || [];
  const customers = customersData?.customers || [];
  
  // ✅ useEffect with internal guard
  React.useEffect(() => {
    if (isAuthenticated && products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].id);
    }
  }, [isAuthenticated, products, selectedProduct]);
  
  // ✅ More useEffect hooks with internal guards
  React.useEffect(() => {
    if (isAuthenticated && selectedSection === 'customers' && ...) {
      // ...
    }
  }, [isAuthenticated, selectedSection, customers, selectedCustomerId]);
  
  React.useEffect(() => {
    if (isAuthenticated && selectedCustomerId) {
      localStorage.setItem('lastSelectedCustomerId', selectedCustomerId);
    }
  }, [isAuthenticated, selectedCustomerId]);
  
  // ✅ useCallback hooks
  const handleSolutionSelect = React.useCallback((solutionId: string) => {
    setSelectedSolution(solutionId);
  }, []);
  
  const handleProductClickFromSolution = React.useCallback((productId: string) => {
    setSelectedSection('products');
    setSelectedProduct(productId);
    setViewMode('detail');
    localStorage.setItem('lastSelectedProductId', productId);
  }, []);
  
  // ✅ NOW safe to do early returns (AFTER all hooks)
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  // Rest of component...
}
```

## Changes Made

### 1. Moved Data Extraction (Lines 959-985)

**Before**: Data extraction happened after authentication guard  
**After**: Data extraction happens before hooks that need the data

```typescript
// Extract data from GraphQL responses (for use in hooks)
const products = productsData?.products?.edges?.map((edge: any) => {
  // ... normalization logic ...
}) || [];
const solutions = solutionsData?.solutions?.edges?.map((edge: any) => edge.node) || [];
const customers = customersData?.customers || [];
```

### 2. Moved useEffect Hooks (Lines 987-1017)

**Before**: Three `useEffect` hooks at lines 1080-1181 (after auth guard)  
**After**: Three `useEffect` hooks at lines 987-1017 (before auth guard)

Added `isAuthenticated` checks **inside** each `useEffect`:

```typescript
React.useEffect(() => {
  // Added isAuthenticated guard
  if (isAuthenticated && products.length > 0 && !selectedProduct) {
    setSelectedProduct(products[0].id);
    setSelectedProductSubSection('main');
    localStorage.setItem('lastSelectedProductId', products[0].id);
  }
}, [isAuthenticated, products, selectedProduct]); // Added isAuthenticated to deps
```

### 3. Moved useCallback Hooks (Lines 1019-1029)

**Before**: Two `useCallback` hooks at lines 1183-1193 (after auth guard)  
**After**: Two `useCallback` hooks at lines 1019-1029 (before auth guard)

```typescript
const handleSolutionSelect = React.useCallback((solutionId: string) => {
  setSelectedSolution(solutionId);
}, []);

const handleProductClickFromSolution = React.useCallback((productId: string) => {
  setSelectedSection('products');
  setSelectedProduct(productId);
  setViewMode('detail');
  localStorage.setItem('lastSelectedProductId', productId);
}, []);
```

### 4. Removed Duplicates

Removed duplicate data extraction and hooks that were after the authentication guard (lines 1072-1193 in old code).

## Verification

### Hook Order Now
1. ✅ `useApolloClient()` - line 838
2. ✅ `useAuth()` - line 839
3. ✅ Multiple `useState()` calls - lines 842-900
4. ✅ `useSensors()` - lines 903-912
5. ✅ Six `useQuery()` calls - lines 915-957
6. ✅ Three `React.useEffect()` calls - lines 988, 997, 1013
7. ✅ Two `React.useCallback()` calls - lines 1020, 1024
8. ✅ **Then** early returns - lines 1032, 1068

### Result
- ✅ All hooks called in same order every render
- ✅ Same number of hooks every render
- ✅ No conditional hook calls
- ✅ No hooks after early returns
- ✅ React error resolved

## Testing

### Test 1: Loading State
1. Open app
2. Check console while loading
3. ✅ Result: No hook order errors

### Test 2: Unauthenticated State
1. Clear localStorage
2. Navigate to app
3. ✅ Result: No hook order errors, redirects to login

### Test 3: Authenticated State
1. Log in with valid credentials
2. Navigate through app
3. ✅ Result: No hook order errors, app functions normally

### Test 4: Auth State Changes
1. Log in
2. Token expires
3. Automatic logout
4. ✅ Result: No hook order errors during transition

## Best Practices

### ✅ DO

1. **Call all hooks at the top level**
   ```typescript
   function Component() {
     const data = useQuery(...);
     const [state, setState] = useState(...);
     useEffect(() => { ... }, []);
     
     // THEN do conditional rendering
     if (loading) return <Loading />;
     // ...
   }
   ```

2. **Use skip/conditions inside hooks**
   ```typescript
   const { data } = useQuery(QUERY, {
     skip: !isReady  // ✅ Skip inside hook config
   });
   
   useEffect(() => {
     if (isReady) {  // ✅ Condition inside hook
       doSomething();
     }
   }, [isReady]);
   ```

3. **Extract data before hooks that use it**
   ```typescript
   const data = queryResult?.data || [];
   
   useEffect(() => {
     // Can safely use data here
   }, [data]);
   ```

### ❌ DON'T

1. **Don't call hooks after early returns**
   ```typescript
   function Component() {
     if (condition) return <Early />;  // ❌ Early return
     useEffect(() => { ... }, []);     // ❌ Hook after return
   }
   ```

2. **Don't call hooks conditionally**
   ```typescript
   function Component() {
     if (condition) {
       useEffect(() => { ... }, []);  // ❌ Conditional hook
     }
   }
   ```

3. **Don't call hooks in loops**
   ```typescript
   function Component() {
     items.forEach(item => {
       useEffect(() => { ... }, []);  // ❌ Hook in loop
     });
   }
   ```

## Related Documentation

- [Rules of Hooks](https://react.dev/link/rules-of-hooks)
- [React Hooks FAQ](https://react.dev/reference/react/hooks)
- [useEffect Hook](https://react.dev/reference/react/useEffect)
- [useState Hook](https://react.dev/reference/react/useState)

## Impact

### Before Fix
- ❌ Console error on every render
- ❌ Unreliable component behavior
- ❌ Potential state inconsistencies

### After Fix
- ✅ Clean console output
- ✅ Consistent hook execution
- ✅ Reliable component behavior
- ✅ Proper state management

---

**Fix Date**: November 11, 2025  
**Status**: ✅ Resolved  
**Breaking Changes**: None  
**Performance Impact**: None (hooks still run same number of times)

