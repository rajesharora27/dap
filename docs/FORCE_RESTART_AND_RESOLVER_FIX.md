# Force Restart and Resolver Fix - November 11, 2025

## Summary

Fixed critical backend startup errors related to missing GraphQL resolvers and updated the `dap` script to include force kill functionality for more reliable restarts.

## Issues Fixed

### 1. Missing GraphQL Resolvers

**Problem:**
- Backend was failing to start with error: `Resolver Query.role must be object or function`
- The `AuthQueryResolvers` object was missing the `role` and `availableResources` resolvers that were referenced in the main resolvers file

**Root Cause:**
- The schema defined `role(id: ID!): RoleWithPermissions` and `availableResources(resourceType: String): [AvailableResource!]!` queries
- However, `backend/src/schema/resolvers/auth.ts` only had `roles` (plural) resolver but not `role` (singular)
- The `availableResources` resolver was also missing

**Solution:**
- Added `role` resolver to fetch a single role by ID with its permissions and user count
- Added `availableResources` resolver to fetch products, solutions, and customers for permission assignment
- Updated `roles` resolver to use the new `Role` table instead of the old `userRole.roleName` approach
- Updated `userRoles` resolver to return roles from the new `Role` table with their associated permissions

### 2. Outdated Role Mutation Resolvers

**Problem:**
- Role mutation resolvers (`createRole`, `updateRole`, `deleteRole`, `assignRoleToUser`, `removeRoleFromUser`) were using the old `UserRole.roleName` approach
- Schema was updated to use the new `Role` and `RolePermission` tables but resolvers weren't updated

**Solution:**
- **`createRole`**: Now creates roles in the `Role` table with associated permissions in `RolePermission` table using transactions
- **`updateRole`**: Now updates roles in the `Role` table and replaces associated permissions
- **`deleteRole`**: Now deletes roles from the `Role` table (cascades to permissions and user roles)
- **`assignRoleToUser`**: Now assigns roles by `roleId` (FK to `Role` table) instead of `roleName`
- **`removeRoleFromUser`**: Now removes roles by `roleId` instead of `roleName`
- All mutations now include audit logging

### 3. Force Kill and Restart Functionality

**Problem:**
- Backend was sometimes stuck and couldn't be restarted gracefully
- User requested a force kill option to ensure clean restarts

**Solution:**
- Added `force_kill_all()` function to the `dap` script with aggressive process killing:
  - Uses `kill -9` (SIGKILL) instead of `kill -TERM` (SIGTERM)
  - Kills processes by pattern matching (ts-node-dev, vite, npm exec)
  - Force kills any remaining processes on the backend and frontend ports
  - Verifies ports are clear after killing
- Updated `restart_all()` function to use `force_kill_all()` instead of `stop_all()`
- Updated `clean_restart()` function to use `force_kill_all()` for consistency
- Updated help text to reflect that restart now does force kill

## Files Modified

### Backend Resolver Changes
- **`backend/src/schema/resolvers/auth.ts`**:
  - Added `role` query resolver (lines 72-109)
  - Added `availableResources` query resolver (lines 142-197)
  - Updated `roles` query resolver to use new `Role` table (lines 38-70)
  - Updated `userRoles` query resolver to include role permissions (lines 111-140)
  - Updated `createRole` mutation resolver to use new schema with transactions (lines 441-515)
  - Updated `updateRole` mutation resolver to use new schema with transactions (lines 517-610)
  - Updated `deleteRole` mutation resolver to use new schema (lines 612-653)
  - Updated `assignRoleToUser` mutation resolver to use `roleId` (lines 655-718)
  - Updated `removeRoleFromUser` mutation resolver to use `roleId` (lines 720-772)

### Script Changes
- **`dap`**:
  - Added `force_kill_all()` function (lines 94-142)
  - Updated `restart_all()` to use force kill (lines 493-511)
  - Updated `clean_restart()` to use force kill (lines 620-625)
  - Updated help text (line 1093-1094)

## Testing

### Backend Startup
```bash
# Before fix
$ cd /data/dap && ./dap restart
[ERROR] Backend failed to start within 20 seconds
Error: Resolver Query.role must be object or function

# After fix
$ cd /data/dap && ./dap restart
[SUCCESS] Backend API started successfully (PID: 2590962)
[SUCCESS] All services started successfully!
```

### Force Kill Verification
```bash
$ ./dap restart
[WARNING] Force killing all DAP-related processes...
[SUCCESS] Backend port 4000 is clear
[SUCCESS] Frontend port 5173 is clear
[SUCCESS] Force kill complete
```

### Status Check
```bash
$ ./dap status
[SUCCESS] Database container is running
[SUCCESS] Database is accepting connections
[SUCCESS] Backend running on port 4000
[SUCCESS] Frontend running on port 5173
```

## Impact

### Positive
- Backend now starts successfully with all resolvers properly implemented
- Role management now uses the new `Role` and `RolePermission` tables correctly
- Permission system can now create and manage roles with resource-level permissions
- Force kill ensures reliable restarts even when processes are stuck
- All audit logging is now in place for role mutations

### Breaking Changes
- None - This is a fix for functionality that was already intended to work with the new schema

## Next Steps

1. ✅ Backend is now running successfully
2. Frontend role management UI should now work with the backend
3. Permission enforcement is already implemented in the core resolvers
4. Test role creation, update, and deletion in the frontend
5. Test permission assignment to roles and users in the frontend

## Related Documentation

- `docs/ROLE_PERMISSIONS_IMPLEMENTATION.md` - Original implementation of role-based permissions
- `docs/PERMISSION_ENFORCEMENT.md` - Permission enforcement in resolvers
- `docs/ADMIN_MENU_REORGANIZATION.md` - Admin menu structure with roles submenu

## Notes

- The `force_kill_all()` function uses `kill -9` which should be used with caution in production
- For development purposes, force kill is safe and ensures clean restarts
- All role mutations now create audit log entries for tracking changes
- Permissions are managed within transactions to ensure data consistency

