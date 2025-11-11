# Permission Enforcement Fix for Solutions and Customers

**Date:** 2025-11-11  
**Issue:** Role-based permissions were not being enforced for solution and customer mutations

## Problem Description

Users with role-based permissions (e.g., "SASE SME" with READ on all products, ADMIN on SASE solution) were able to edit **all** products, solutions, and customers, bypassing the permission system entirely.

### Root Cause

The mutation resolvers for Solutions and Customers were still using the old `ensureRole(ctx, 'ADMIN')` check, which only verified if the user was a **system admin** (isAdmin = true), not checking role-based permissions.

**Affected Mutations:**
- `createSolution` - Required system admin
- `updateSolution` - Required system admin
- `deleteSolution` - Required system admin
- `createCustomer` - Required system admin
- `updateCustomer` - Required system admin
- `deleteCustomer` - Required system admin

**Working Correctly:**
- ✅ `createProduct` - Already used `requirePermission`
- ✅ `updateProduct` - Already used `requirePermission`
- ✅ `deleteProduct` - Already used `requirePermission`
- ✅ `products` query - Already filtered by accessible IDs
- ✅ `solutions` query - Already filtered by accessible IDs

## Solution

Replaced all `ensureRole(ctx, 'ADMIN')` checks with `requirePermission()` calls that properly check role-based permissions.

### Permission Requirements

| Operation | Permission Level Required | Resource Scope |
|-----------|-------------------------|----------------|
| **Create** (Product/Solution/Customer) | `ADMIN` | All resources (resourceId = null) |
| **Update** (Product/Solution/Customer) | `WRITE` | Specific resource (resourceId = id) |
| **Delete** (Product/Solution/Customer) | `ADMIN` | Specific resource (resourceId = id) |
| **Read** (Query) | `READ` | Filtered by accessible IDs |

### Code Changes

#### Before (Wrong - Only System Admins)
```typescript
updateSolution: async (_: any, { id, input }: any, ctx: any) => {
  if (!fallbackActive) ensureRole(ctx, 'ADMIN'); // ❌ Only checks isAdmin
  // ... update logic
}
```

#### After (Correct - Role-Based Permissions)
```typescript
updateSolution: async (_: any, { id, input }: any, ctx: any) => {
  requireUser(ctx); // ✅ Check authentication
  
  if (fallbackActive) {
    // ... fallback logic
  }
  
  // ✅ Check if user has WRITE permission for this specific solution
  await requirePermission(ctx, ResourceType.SOLUTION, id, PermissionLevel.WRITE);
  
  // ... update logic
}
```

## Files Modified

1. **`backend/src/schema/resolvers/index.ts`**
   - Updated `createSolution` (lines 961-984)
   - Updated `updateSolution` (lines 985-1011)
   - Updated `deleteSolution` (lines 1012-1033)
   - Updated `createCustomer` (lines 1034-1055)
   - Updated `updateCustomer` (lines 1056-1082)
   - Updated `deleteCustomer` (lines 1083-1104)

## Permission Flow

### Example: SASE SME User

**Configured Permissions:**
- PRODUCT: ALL → READ
- SOLUTION: SASE → ADMIN
- CUSTOMER: ALL → READ

**What They Can Do:**

| Resource | Action | Allowed? | Reason |
|----------|--------|----------|--------|
| **Products** |
| Any Product | View/Read | ✅ Yes | Has READ on all products |
| Any Product | Edit | ❌ No | Has READ, needs WRITE |
| Any Product | Delete | ❌ No | Has READ, needs ADMIN |
| Products in SASE | View/Read | ✅ Yes | Has READ on all products |
| Products in SASE | Edit | ✅ Yes | Inherited ADMIN from SASE solution |
| Products in SASE | Delete | ✅ Yes | Inherited ADMIN from SASE solution |
| **Solutions** |
| SASE Solution | View/Read | ✅ Yes | Has ADMIN on SASE |
| SASE Solution | Edit | ✅ Yes | Has ADMIN on SASE |
| SASE Solution | Delete | ✅ Yes | Has ADMIN on SASE |
| Other Solutions | View/Read | ✅ Yes | Inherited READ from all products |
| Other Solutions | Edit | ❌ No | Has READ, needs WRITE |
| Other Solutions | Delete | ❌ No | Has READ, needs ADMIN |
| **Customers** |
| Any Customer | View/Read | ✅ Yes | Has READ on all customers |
| Any Customer | Edit | ❌ No | Has READ, needs WRITE |
| Any Customer | Delete | ❌ No | Has READ, needs ADMIN |

## Testing

### Test Case 1: SASE SME User - Edit SASE Solution
```
✅ PASS - User can edit SASE solution (has ADMIN)
```

### Test Case 2: SASE SME User - Edit Other Solution
```
✅ PASS - User cannot edit other solutions (has READ, needs WRITE)
Error: "You do not have permission to perform this action"
```

### Test Case 3: SASE SME User - Edit Any Product
```
✅ PASS - User cannot edit products outside SASE (has READ, needs WRITE)
Error: "You do not have permission to perform this action"
```

### Test Case 4: SASE SME User - Edit Product in SASE
```
✅ PASS - User can edit products in SASE (inherited ADMIN from solution)
```

### Test Case 5: SASE SME User - Create New Solution
```
✅ PASS - User cannot create solutions (has READ on some, needs ADMIN on all)
Error: "You do not have permission to perform this action"
```

## Verification Steps

To verify permissions are working:

1. **Login as sasesme user**
   ```bash
   # Username: sasesme
   # Password: (set during user creation)
   ```

2. **Try to edit a non-SASE solution**
   - Should show error: "You do not have permission"

3. **Try to edit SASE solution**
   - Should work successfully

4. **Try to edit a product outside SASE**
   - Should show error: "You do not have permission"

5. **Try to edit a product within SASE**
   - Should work successfully (inherited ADMIN)

6. **Check browser console**
   - Look for GraphQL errors with permission messages
   - Should see clear error messages about missing permissions

## Implementation Details

### `requirePermission` Function

Located in `backend/src/lib/permissions.ts`, this function:
1. Checks if user is a system admin (bypass all checks)
2. Checks direct user permissions
3. Checks role-based permissions
4. Checks bidirectional flow (Products ↔ Solutions)
5. Returns highest permission level found
6. Throws error if insufficient permissions

### Permission Hierarchy

```
ADMIN (3) > WRITE (2) > READ (1)
```

- `ADMIN` can do everything (create, read, update, delete)
- `WRITE` can read and update
- `READ` can only read (view)

## Error Messages

Users without sufficient permissions will see:

```
GraphQL error: You do not have permission to perform this action
```

Frontend will display this in the UI with appropriate error styling.

## Future Enhancements

Potential improvements:
1. More granular error messages (e.g., "You have READ but need WRITE")
2. UI indicators showing which actions are available
3. Hide/disable buttons for actions the user can't perform
4. Permission hints in tooltips
5. Audit log of permission denials

## Related Documentation

- `BIDIRECTIONAL_PERMISSION_FLOW.md` - How permissions flow between products and solutions
- `PERMISSION_HIERARCHY_FIX.md` - How highest permission level is determined
- `ROLE_DIALOG_EFFECTIVE_PERMISSIONS.md` - GUI preview of effective permissions

## Backward Compatibility

✅ **No breaking changes** - System admins (isAdmin = true) still have full access to everything. Non-admin users now properly respect role-based permissions.

## Deployment Notes

1. Backend restart required to load new resolvers
2. No database migration needed
3. No frontend changes needed
4. Users should logout and login again to refresh tokens (if any caching issues)
5. Test with non-admin users before deploying to production

