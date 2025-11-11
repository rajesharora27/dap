# Role and User Management Enhancement

## Overview
This document describes the enhancements made to the User Management and Role Management interfaces to support bidirectional editing of user-role assignments and to ensure proper permission flow between roles, users, products, and solutions.

## Date
November 11, 2025

## Changes Implemented

### 1. User Management - Role Assignment Interface

**File**: `frontend/src/components/UserManagement.tsx`

#### Features Added:
- **Multi-Select Role Assignment**: When editing a user, administrators can now assign multiple roles using a multi-select dropdown
- **Visual Role Display**: Selected roles are displayed as chips for easy identification
- **Current Roles Preview**: Shows existing role assignments when opening the edit dialog
- **Bidirectional Sync**: Role assignments are synchronized with the backend when updating a user

#### User Interface:
```typescript
// Role Assignment Section in User Edit Dialog
{editingUser && (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      Assigned Roles
    </Typography>
    <FormControl fullWidth>
      <InputLabel>Select Roles</InputLabel>
      <Select
        multiple
        value={selectedRoles}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((roleId) => (
              <Chip 
                key={roleId} 
                label={role.name} 
                size="small" 
                color="secondary"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      >
        {rolesData?.roles?.map((role) => (
          <MenuItem key={role.id} value={role.id}>
            <Checkbox checked={selectedRoles.includes(role.id)} />
            <ListItemText 
              primary={role.name} 
              secondary={role.description}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <Alert severity="info" sx={{ mt: 1 }}>
      <Typography variant="body2">
        <strong>Permission Flow:</strong> Roles grant permissions to resources (Products/Solutions/Customers).
        Solution access automatically grants access to all its products, and vice versa.
      </Typography>
    </Alert>
  </Box>
)}
```

#### Backend Synchronization:
When updating a user, the system:
1. Fetches current role assignments from the backend
2. Compares with selected roles in the UI
3. Adds newly selected roles using `assignRoleToUser` mutation
4. Removes deselected roles using `removeRoleFromUser` mutation
5. Refetches user data to update the UI

```typescript
// Sync roles: Get current roles from backend
const currentRoles = userRolesData?.userRoles?.map((r: any) => r.id) || [];
const rolesToAdd = selectedRoles.filter((roleId: string) => !currentRoles.includes(roleId));
const rolesToRemove = currentRoles.filter((roleId: string) => !selectedRoles.includes(roleId));

// Add new roles
for (const roleId of rolesToAdd) {
  await assignRoleToUser({ variables: { userId: editingUser.id, roleId } });
}

// Remove unselected roles
for (const roleId of rolesToRemove) {
  await removeRoleFromUser({ variables: { userId: editingUser.id, roleId } });
}
```

### 2. Role Management - User Assignment Interface

**File**: `frontend/src/components/RoleManagement.tsx`

#### Features Added:
- **Assigned Users Tab**: New tab in the role edit dialog showing all users assigned to the role
- **Multi-Select User Assignment**: Administrators can add/remove users from a role using a multi-select dropdown
- **Visual User Display**: Selected users are displayed as chips with username and email
- **Current Users Preview**: Shows existing user assignments when opening the edit dialog
- **Bidirectional Sync**: User assignments are synchronized with the backend when updating a role

#### User Interface:
```typescript
// Tabs in Role Edit Dialog
<Tabs value={permissionTab} onChange={(_, v) => setPermissionTab(v)}>
  <Tab label="Products" />
  <Tab label="Solutions" />
  <Tab label="Customers" />
  {editingRole && <Tab label="Assigned Users" />}
</Tabs>

// Assigned Users Tab Content
{editingRole && permissionTab === 3 && (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      Users with this role
    </Typography>
    <FormControl fullWidth>
      <InputLabel>Select Users</InputLabel>
      <Select
        multiple
        value={selectedUsers}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((userId) => (
              <Chip 
                key={userId} 
                label={user.username} 
                size="small" 
                color="secondary"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      >
        {usersData?.users?.map((user) => (
          <MenuItem key={user.id} value={user.id}>
            <Checkbox checked={selectedUsers.includes(user.id)} />
            <ListItemText 
              primary={user.username} 
              secondary={user.email}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <Alert severity="info" sx={{ mt: 2 }}>
      <Typography variant="body2">
        <strong>Permission Flow:</strong> Users assigned to this role will inherit all permissions defined in the Products, Solutions, and Customers tabs.
        Changes will take effect immediately after saving.
      </Typography>
    </Alert>
  </Box>
)}
```

#### Backend Synchronization:
When updating a role, the system:
1. Fetches current user assignments from the backend
2. Compares with selected users in the UI
3. Adds newly selected users using `assignRoleToUser` mutation
4. Removes deselected users using `removeRoleFromUser` mutation
5. Refetches role data to update the UI

```typescript
// Sync user assignments: Get current users with this role
const currentUsers = editingRole.users?.map((u: any) => u.id) || [];
const usersToAdd = selectedUsers.filter((userId: string) => !currentUsers.includes(userId));
const usersToRemove = currentUsers.filter((userId: string) => !selectedUsers.includes(userId));

// Add new users to role
for (const userId of usersToAdd) {
  await assignRoleToUser({ variables: { userId, roleId: editingRole.id } });
}

// Remove unselected users from role
for (const userId of usersToRemove) {
  await removeRoleFromUser({ variables: { userId, roleId: editingRole.id } });
}
```

### 3. Permission Flow Architecture

#### Overview
The system implements a comprehensive permission flow that ensures:
- Users inherit permissions from their assigned roles
- Permissions flow bidirectionally between products and solutions
- Admin users have full access to all resources
- Inactive users have no access, regardless of permissions

#### Permission Hierarchy
```
READ < WRITE < ADMIN
```

#### Bidirectional Permission Flow: Products ↔ Solutions

**File**: `backend/src/lib/permissions.ts`

The permission system implements sophisticated cross-resource permission logic:

1. **All Products → All Solutions**
   - If a user has access to "all products", they automatically have access to "all solutions"
   
2. **Solution → Its Products**
   - If a user has access to a specific solution, they automatically have access to all products within that solution
   
3. **All Products in Solution → Solution**
   - If a user has access to all products that make up a solution, they automatically have access to that solution

#### Example Scenarios:

**Scenario 1: Admin for All Products**
```
User Role: Product Manager
Permission: ADMIN on all PRODUCTS

Result:
- Can manage all products
- Can manage all solutions
- Changes flow both ways
```

**Scenario 2: Admin for Specific Solution**
```
User Role: Solution Owner
Permission: ADMIN on "Enterprise Solution"
Products in Enterprise Solution: Product A, Product B, Product C

Result:
- Can manage "Enterprise Solution"
- Can manage Product A, Product B, Product C
- Cannot manage other solutions or their products
```

**Scenario 3: Admin for All Products in a Solution**
```
User Role: Product Team Lead
Permission: ADMIN on Product A, Product B, Product C
"Enterprise Solution" contains: Product A, Product B, Product C

Result:
- Can manage Product A, Product B, Product C
- Can manage "Enterprise Solution" (because they have all its products)
- Cannot manage other solutions
```

### 4. GraphQL Queries and Mutations

#### Queries Used:
- `GET_ROLES`: Fetches all roles with their permissions and assigned users
- `GET_USERS`: Fetches all users for display in role assignment
- `GET_USER_ROLES`: Fetches roles assigned to a specific user

#### Mutations Used:
- `assignRoleToUser(userId: ID!, roleId: ID!)`: Assigns a role to a user
- `removeRoleFromUser(userId: ID!, roleId: ID!)`: Removes a role from a user
- `updateUser(userId: ID!, input: UpdateUserInput!)`: Updates user details
- `updateRole(roleId: ID!, input: UpdateRoleInput!)`: Updates role details and permissions

### 5. State Management

#### UserManagement Component:
```typescript
const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

// Load user roles when editing user
React.useEffect(() => {
  if (editingUser && userRolesData?.userRoles) {
    setSelectedRoles(userRolesData.userRoles.map((r: Role) => r.id));
  } else {
    setSelectedRoles([]);
  }
}, [editingUser, userRolesData]);
```

#### RoleManagement Component:
```typescript
const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

// Load assigned users when editing role
React.useEffect(() => {
  if (editingRole && editingRole.users) {
    setSelectedUsers(editingRole.users.map((u: any) => u.id));
  } else {
    setSelectedUsers([]);
  }
}, [editingRole]);
```

## User Workflow

### Editing User Roles (Admin Flow)
1. Navigate to Admin → Users
2. Double-click on a user row (or click Edit button)
3. The Edit User dialog opens with current user details
4. Scroll to the "Assigned Roles" section
5. Select/deselect roles using the multi-select dropdown
6. Click "Update" to save changes
7. System synchronizes role assignments with backend
8. Success message displayed: "User and roles updated successfully!"

### Editing Role Users (Admin Flow)
1. Navigate to Admin → Roles
2. Double-click on a role row (or click Edit button)
3. The Edit Role dialog opens with current role details
4. Navigate to the "Assigned Users" tab
5. Select/deselect users using the multi-select dropdown
6. Click "Update" to save changes
7. System synchronizes user assignments with backend
8. Success message displayed: "Role and user assignments updated successfully!"

## Benefits

1. **Bidirectional Editing**: Administrators can manage user-role relationships from either the User or Role management interface
2. **Intuitive UI**: Multi-select dropdowns with checkboxes and chips make it easy to see and modify assignments
3. **Permission Visibility**: Inline alerts explain how permissions flow between resources
4. **Consistent UX**: Both interfaces follow the same design patterns and interaction models
5. **Real-time Sync**: Changes are immediately synchronized with the backend and reflected in the UI
6. **Error Handling**: Comprehensive error messages guide users when something goes wrong

## Technical Notes

### Performance Considerations
- Role assignments are only loaded when editing a user (lazy loading)
- User assignments are only loaded when editing a role (lazy loading)
- Multi-select dropdowns use controlled components for optimal React performance
- GraphQL queries are optimized to fetch only necessary fields

### Error Handling
- Validation errors are displayed inline with helpful messages
- Backend errors are caught and displayed to the user
- Failed mutations don't close the dialog, allowing users to correct errors
- Success/error messages auto-dismiss after 3-5 seconds

### Accessibility
- All form controls have proper labels
- Keyboard navigation is fully supported
- ARIA attributes are used for screen reader compatibility
- Color contrast meets WCAG AA standards

## Testing Recommendations

1. **User Role Assignment**:
   - Assign multiple roles to a user
   - Remove all roles from a user
   - Assign the same role to multiple users
   - Verify roles appear in the user table after assignment

2. **Role User Assignment**:
   - Assign a role to multiple users
   - Remove all users from a role
   - Assign multiple roles to the same user
   - Verify user count updates in the role table

3. **Permission Flow**:
   - Grant "all products" permission and verify solution access
   - Grant solution permission and verify product access
   - Grant product permissions and verify solution access when all products are covered

4. **Edge Cases**:
   - Edit user with no existing roles
   - Edit role with no existing users
   - Rapidly assign/remove roles
   - Test with admin vs. non-admin users

## Future Enhancements

1. **Bulk Operations**: Add ability to assign/remove roles to/from multiple users at once
2. **Permission Preview**: Show effective permissions for a user considering all their roles
3. **Role Templates**: Create role templates for common permission sets
4. **Audit Trail**: Log all role assignment changes for compliance
5. **Permission Conflicts**: Detect and warn about conflicting permissions across roles

## Related Documentation

- `BIDIRECTIONAL_PERMISSION_FLOW.md`: Details on product-solution permission flow
- `USER_ROLE_VISIBILITY_ENHANCEMENT.md`: Initial implementation of role/user visibility in tables
- `AUTH_IMPLEMENTATION_SUMMARY.md`: Complete authentication and authorization system documentation
- `backend/src/lib/permissions.ts`: Core permission checking logic
- `backend/src/schema/resolvers/auth.ts`: GraphQL resolvers for user and role management

