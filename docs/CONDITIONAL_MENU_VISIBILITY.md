# Conditional Menu Visibility Based on User Permissions

**Date:** 2025-11-11  
**Feature:** Hide menu items for resources users don't have access to

## Overview

Implemented conditional visibility for the left-side navigation menu items (Products, Solutions, Customers) based on user permissions. If a user doesn't have access to any resources of a given type, that menu item is hidden from the navigation menu.

## Problem Statement

Previously, all users would see Products, Solutions, and Customers menu items in the left sidebar, regardless of their permissions. This led to:
1. Confusion when users clicked on a menu item but saw no data
2. Unnecessary clutter in the navigation menu
3. Poor UX for users with limited access

## Solution

### 1. Access Detection

Added helper variables to check if the user has access to any resources:

```typescript
// Check if user has access to any resources (for menu visibility)
const hasProducts = products.length > 0;
const hasSolutions = solutions.length > 0;
const hasCustomers = customers.length > 0;
```

**Location:** `frontend/src/pages/App.tsx` (lines 994-997)

These variables are computed after the GraphQL queries return data. Since the backend already filters resources based on user permissions, an empty array means the user has no access to that resource type.

### 2. Conditional Menu Rendering

Wrapped each menu section (Products, Solutions, Customers) with conditional rendering:

```typescript
{/* Products Section - Only show if user has access to at least one product */}
{hasProducts && (
  <>
    <ListItemButton
      selected={selectedSection === 'products'}
      onClick={() => {
        setSelectedSection('products');
        setProductsExpanded(true);
      }}
    >
      <ListItemIcon>
        <ProductIcon />
      </ListItemIcon>
      <ListItemText primary="Products" />
      {productsExpanded ? <ExpandLess /> : <ExpandMore />}
    </ListItemButton>
    
    <Collapse in={productsExpanded && selectedSection === 'products'} timeout="auto" unmountOnExit>
      {/* ... submenu content ... */}
    </Collapse>
  </>
)}
```

**Location:** `frontend/src/pages/App.tsx` (lines 4856-4900, 4902-4946, 4948-5003)

**Changes:**
- Products menu: Wrapped with `{hasProducts && (...)}`
- Solutions menu: Wrapped with `{hasSolutions && (...)}`
- Customers menu: Wrapped with `{hasCustomers && (...)}`
- Admin menu: Already wrapped with `{user?.isAdmin && (...)}`

### 3. Auto-Redirect Logic

Added automatic section switching when a user navigates to a section they don't have access to:

```typescript
// Auto-redirect if user doesn't have access to current section
React.useEffect(() => {
  if (!isAuthenticated) return;
  
  // Check if current section is accessible
  const sectionAccessible = 
    (selectedSection === 'products' && hasProducts) ||
    (selectedSection === 'solutions' && hasSolutions) ||
    (selectedSection === 'customers' && hasCustomers) ||
    (selectedSection === 'admin' && user?.isAdmin);

  // If current section is not accessible, redirect to first available section
  if (!sectionAccessible) {
    if (hasProducts) {
      setSelectedSection('products');
    } else if (hasSolutions) {
      setSelectedSection('solutions');
    } else if (hasCustomers) {
      setSelectedSection('customers');
    } else if (user?.isAdmin) {
      setSelectedSection('admin');
    }
  }
}, [isAuthenticated, selectedSection, hasProducts, hasSolutions, hasCustomers, user?.isAdmin]);
```

**Location:** `frontend/src/pages/App.tsx` (lines 1031-1056)

**Logic:**
1. Check if the current `selectedSection` is accessible
2. If not, redirect to the first available section in priority order:
   - Products
   - Solutions
   - Customers
   - Admin (if admin user)

### 4. No Access Message

Added a fallback message for users who don't have access to any resources:

```typescript
{/* No Access Message - Show when user has no access to any section */}
{!hasProducts && !hasSolutions && !hasCustomers && !user?.isAdmin && (
  <Box sx={{ /* ... centered layout ... */ }}>
    <Paper elevation={3}>
      <Dashboard icon />
      <Typography variant="h5">No Access</Typography>
      <Typography variant="body1">
        You currently don't have access to any resources in this application.
        Please contact your administrator to request access to products, solutions, or customers.
      </Typography>
      <Divider />
      <Typography variant="body2">
        User: <strong>{user?.username || 'Unknown'}</strong>
      </Typography>
    </Paper>
  </Box>
)}
```

**Location:** `frontend/src/pages/App.tsx` (lines 6456-6506)

This message is displayed when:
- User has no products (`!hasProducts`)
- User has no solutions (`!hasSolutions`)
- User has no customers (`!hasCustomers`)
- User is not an admin (`!user?.isAdmin`)

## User Experience

### Scenario 1: User with Partial Access
- **Before**: User sees all menu items, clicks on Solutions, sees "No solutions available"
- **After**: User only sees Products and Customers in the menu (Solutions is hidden)

### Scenario 2: User with Single Resource Type Access
- **Before**: User sees all menu items, can navigate to empty sections
- **After**: User only sees the one menu item they have access to, automatically selected on login

### Scenario 3: User with No Access
- **Before**: User sees all menu items, clicks around but sees no data anywhere
- **After**: User sees a clear "No Access" message with instructions to contact administrator, no menu items visible (except Admin if they're an admin)

### Scenario 4: Admin User with No Resource Access
- **Before**: Admin user might be confused why they see menu items but no data
- **After**: Admin user sees only the Admin menu item, can manage users and roles from there

## Testing

### Test Case 1: User with All Access
1. Login as admin user
2. **Expected**: All menu items visible (Products, Solutions, Customers, Admin)
3. **Result**: ✅ PASS

### Test Case 2: User with Product-Only Access
1. Login as user with role granting access only to products
2. **Expected**: Only Products menu item visible
3. **Result**: ✅ PASS

### Test Case 3: User with Solution-Only Access
1. Login as user with role granting access only to solutions
2. **Expected**: Only Solutions menu item visible
3. **Result**: ✅ PASS

### Test Case 4: User with No Access
1. Login as user with no role assignments or role with no permissions
2. **Expected**: No menu items visible, "No Access" message displayed
3. **Result**: ✅ PASS

### Test Case 5: Auto-Redirect on Permission Loss
1. Login as user with product access
2. Admin removes product access via role change
3. User refreshes page
4. **Expected**: 
   - If user has other access (solutions/customers), redirected to that section
   - If user has no access, "No Access" message displayed
5. **Result**: ✅ PASS

### Test Case 6: Admin with No Data Access
1. Login as admin user with no role-based permissions
2. **Expected**: 
   - Products, Solutions, Customers menus hidden
   - Admin menu visible
   - Admin can manage users and assign permissions
3. **Result**: ✅ PASS

## Backend Integration

This feature relies on the existing permission enforcement in the backend:

1. **GraphQL Resolvers:**
   - `products` query filters results based on `getUserAccessibleResources()`
   - `solutions` query filters results based on `getUserAccessibleResources()`
   - `customers` query filters results based on `getUserAccessibleResources()`

2. **Permission Utility:**
   - `backend/src/lib/permissions.ts`: `getUserAccessibleResources()` returns only IDs the user can access
   - Empty array returned if user has no access to that resource type

3. **No Frontend Changes to Permission Logic:**
   - Frontend simply checks if the returned arrays are empty
   - All permission enforcement still happens on the backend

## Files Modified

1. **`frontend/src/pages/App.tsx`**
   - Added `hasProducts`, `hasSolutions`, `hasCustomers` variables (lines 994-997)
   - Added auto-redirect useEffect (lines 1031-1056)
   - Wrapped Products menu with `{hasProducts && (...)}` (lines 4856-4900)
   - Wrapped Solutions menu with `{hasSolutions && (...)}` (lines 4902-4946)
   - Wrapped Customers menu with `{hasCustomers && (...)}` (lines 4948-5003)
   - Added "No Access" message component (lines 6456-6506)

## Security Considerations

✅ **No Security Bypass:**
- Menu visibility is purely a UX enhancement
- All permission enforcement remains on the backend
- Even if a user manually navigates to a URL or manipulates the frontend, backend mutations will fail with permission errors

✅ **No Data Leakage:**
- Hidden menu items don't expose whether resources exist
- Users only see what they have access to

✅ **Admin Visibility:**
- Admin menu is already protected by `user?.isAdmin` check
- Non-admin users never see admin menu, regardless of access

## Performance Considerations

✅ **No Additional API Calls:**
- Uses existing GraphQL query results
- No separate "check access" queries needed

✅ **Reactive Updates:**
- If permissions change and queries refetch, menu visibility updates automatically
- Uses React's built-in state and effect system

## Future Enhancements

Potential improvements for this feature:

1. **Loading State Indicators:**
   - Show skeleton/loading placeholders for menu items while queries are loading
   - Prevent "flickering" if menu items appear after data loads

2. **Permission Badge:**
   - Show a small badge/icon on menu items indicating permission level (Read, Write, Admin)

3. **Expandable "Hidden Items" Section:**
   - For admins, show a collapsed section of "Hidden from non-admins" to preview what other users see

4. **Access Request Button:**
   - In the "No Access" message, add a button to submit an access request to administrators

5. **Recent/Favorites:**
   - If user previously had access to a resource, show it in a "Recently Accessed" section (grayed out) with a "Request Access Again" button

## Deployment Notes

1. Frontend restart required
2. No backend changes required
3. No database migration required
4. No breaking changes
5. Users should refresh browser (Ctrl+Shift+R) to see new menu behavior
6. Admins should verify non-admin users see expected menu items

## Rollback Plan

If issues arise, this feature can be easily rolled back by:

1. Remove the conditional wrappers (`{hasProducts && (...)}`), or
2. Force the variables to `true`:
   ```typescript
   const hasProducts = true; // products.length > 0;
   const hasSolutions = true; // solutions.length > 0;
   const hasCustomers = true; // customers.length > 0;
   ```

## Related Documentation

- `PERMISSION_ENFORCEMENT_FIX.md` - Backend permission enforcement
- `PER_RESOURCE_PERMISSIONS.md` - Per-resource permission levels
- `ROLE_DIALOG_EFFECTIVE_PERMISSIONS.md` - Role dialog permission preview
- `AUTH_IMPLEMENTATION_SUMMARY.md` - Overall authentication system

