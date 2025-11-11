# Per-Resource Permission Levels & No Access Default

**Date:** 2025-11-11  
**Feature:** Ability to assign different permission levels to different resources within a role + No Access as default

## Overview

This update implements two major enhancements to the role management system:

1. **Per-Resource Permission Levels**: Different products/solutions/customers can have different permission levels within the same role
2. **No Access Default**: New roles default to "No Access" instead of "Read Only" - users only see resources explicitly assigned to them

## Problem Statement

### Before
- When creating a role with "Specific Products/Solutions", ALL selected resources had the **same** permission level
- Example: If you wanted Product A (READ) + Product B (ADMIN), you had to create **two separate roles**
- Default permissions were "All Resources + READ", which exposed everything to new roles

### After
- You can now assign **different permission levels** to each resource within a single role
- Example: In one role, assign Product A (READ), Product B (WRITE), SASE Solution (ADMIN)
- Default is **No Access** - users only see what you explicitly grant them

## Use Cases

### Use Case 1: SME with Mixed Permissions
**Scenario**: A Subject Matter Expert needs full control over one solution but read-only access to related products for context.

**Old Way** (Not Possible):
- Had to choose one permission level for all selected resources
- Required multiple roles or compromised security

**New Way**:
```
Role: "Product SME"
├─ Products:
│  ├─ Product A: READ (for reference)
│  ├─ Product B: WRITE (can update)
│  └─ Product C: ADMIN (full control)
├─ Solutions:
│  └─ SASE: ADMIN (full control)
└─ Customers:
   └─ All: READ (view only)
```

### Use Case 2: Restricted Visibility
**Scenario**: New users should see **nothing** until explicitly granted access.

**Old Way**:
- Default was "All Resources + READ"
- Had to manually change every new role to limit visibility

**New Way**:
- Default is "No Access" for all resource types
- Explicitly select what the role can access

## User Interface Changes

### Mode Selection (Radio Buttons)

For each resource type (Products, Solutions, Customers):

```
○ No Access (Not Visible)     ← NEW! Default option
○ All Products
○ Specific Products
```

### "All" Mode

When "All Products" is selected:
- **One** permission level dropdown applies to ALL products
- Simple and familiar interface

```
┌─────────────────────────────────────┐
│ Product Access                      │
│ ● All Products                      │
│                                     │
│ Permission Level: [READ  ▼]        │
│                                     │
│ ✓ All Products: READ                │
│ → All Solutions: READ (inherited)   │
└─────────────────────────────────────┘
```

### "Specific" Mode - NEW TABLE INTERFACE

When "Specific Products" is selected:
- Table with checkboxes and **individual** permission dropdowns
- Each resource can have its own permission level

```
┌───────────────────────────────────────────────────────┐
│ Select products and set individual permission levels: │
├───┬─────────────────────┬──────────────────────────┤
│ ☑ │ Checkbox            │ Permission Level         │
├───┼─────────────────────┼──────────────────────────┤
│ ☑ │ Cisco Duo           │ [READ   ▼]              │
│ ☑ │ Cisco Secure Access │ [WRITE  ▼]              │
│ ☑ │ SASE Platform       │ [ADMIN  ▼]              │
│ ☐ │ SD-WAN              │ [READ   ▼] (disabled)   │
└───┴─────────────────────┴──────────────────────────┘
3 product(s) selected
```

**Features**:
- ✅ Checkbox to select/deselect each resource
- ✅ Permission dropdown for each row (READ/WRITE/ADMIN)
- ✅ Dropdown is disabled if resource not selected
- ✅ Auto-defaults to READ when first selected
- ✅ Counter shows how many resources selected
- ✅ Hover effect on rows for better UX

### "No Access" Mode

When "No Access" is selected:
- No additional options shown
- Users with this role won't see any resources of this type
- Clean, minimal interface

```
┌─────────────────────────────────────┐
│ Product Access                      │
│ ● No Access (Not Visible)           │
│                                     │
│ Users will not see any products.    │
└─────────────────────────────────────┘
```

## Data Model Changes

### PermissionBuilder Interface

```typescript
interface PermissionBuilder {
  products: {
    mode: 'none' | 'all' | 'specific';
    selectedIds: string[];
    permissionLevel: string; // For 'all' mode
    specificPermissions: { [resourceId: string]: string }; // For 'specific' mode
  };
  solutions: {
    mode: 'none' | 'all' | 'specific';
    selectedIds: string[];
    permissionLevel: string;
    specificPermissions: { [resourceId: string]: string };
  };
  customers: {
    mode: 'none' | 'all' | 'specific';
    selectedIds: string[];
    permissionLevel: string;
    specificPermissions: { [resourceId: string]: string };
  };
}
```

### Permission Building Logic

```typescript
// When mode is 'specific', use per-resource permissions
if (permissionBuilder.products.mode === 'specific') {
  permissionBuilder.products.selectedIds.forEach(id => {
    permissions.push({
      resourceType: 'PRODUCT',
      resourceId: id,
      permissionLevel: permissionBuilder.products.specificPermissions[id] || 'READ'
    });
  });
}
```

## Example Configurations

### Example 1: SASE SME Role
```
Products:
├─ Mode: Specific
├─ Cisco Duo: READ
├─ Cisco Secure Access: WRITE
└─ Cisco SD-WAN: ADMIN

Solutions:
├─ Mode: Specific
└─ SASE: ADMIN

Customers:
├─ Mode: All
└─ Level: READ
```

**Result**: 
- Can view Cisco Duo
- Can edit Cisco Secure Access
- Full control over Cisco SD-WAN and SASE solution
- Can view all customers

### Example 2: Customer Success Role
```
Products:
├─ Mode: No Access

Solutions:
├─ Mode: All
└─ Level: READ

Customers:
├─ Mode: All
└─ Level: WRITE
```

**Result**:
- Cannot see any products
- Can view all solutions
- Can edit all customers

### Example 3: Restricted Viewer
```
Products:
├─ Mode: Specific
└─ Product A: READ

Solutions:
├─ Mode: No Access

Customers:
├─ Mode: Specific
└─ Customer X: READ
```

**Result**:
- Can only see Product A (read-only)
- Cannot see any solutions
- Can only see Customer X (read-only)

## Effective Permissions Preview

The "Effective Permissions Preview" section at the bottom of the dialog now shows:

```
📊 Effective Permissions Preview

🔷 Products
  3 specific product(s) with mixed permissions

🔶 Solutions
  SASE (ADMIN) + Other Solutions (READ) ✓ inherited

👥 Customers
  All Customers (READ)
```

This preview updates in real-time as you configure permissions, showing the actual effective permissions including bidirectional flow.

## Migration Notes

### Existing Roles
- Existing roles are **not affected**
- They continue to work exactly as before
- Edit and save to use new per-resource features

### New Roles
- Default to "No Access" for all resource types
- Admin must explicitly grant permissions
- More secure by default

## Security Benefits

1. **Principle of Least Privilege**: Users start with no access
2. **Granular Control**: Different permission levels per resource
3. **Reduced Risk**: No accidental exposure of resources
4. **Explicit Grants**: All access must be deliberately configured

## User Workflow

### Creating a New Role with Per-Resource Permissions

1. **Go to Admin → Roles**
2. **Click "Add Role"**
3. **Enter role name and description**
4. **For each resource type (Products/Solutions/Customers)**:
   
   **Option A: No Access** (default)
   - Leave as "No Access (Not Visible)"
   
   **Option B: All Resources**
   - Select "All Products/Solutions/Customers"
   - Choose one permission level (READ/WRITE/ADMIN)
   
   **Option C: Specific Resources** (new feature!)
   - Select "Specific Products/Solutions/Customers"
   - Check the resources you want to grant access to
   - For **each** selected resource, choose its permission level
   - Different resources can have different levels!

5. **Review the "Effective Permissions Preview"** at the bottom
6. **Click "Create"**

### Example Walkthrough

**Goal**: Create a role for a SASE SME who needs:
- View access to all products for context
- Full control over SASE solution
- Edit access to specific customers

**Steps**:
1. Products Tab:
   - Select "All Products"
   - Permission Level: READ

2. Solutions Tab:
   - Select "Specific Solutions"
   - Check "SASE"
   - Set dropdown to "ADMIN"

3. Customers Tab:
   - Select "Specific Customers"
   - Check "Customer A", "Customer B"
   - Set both dropdowns to "WRITE"

4. Review Preview:
   - Products: All Products (READ)
   - Solutions: SASE (ADMIN) + Other Solutions (READ) ✓
   - Customers: 2 customer(s) with WRITE permission

5. Click "Create"

## Files Modified

1. **`frontend/src/components/RoleManagement.tsx`**
   - Updated `PermissionBuilder` interface to include `specificPermissions` map
   - Changed default mode to 'none' instead of 'all'
   - Replaced Autocomplete with Table for specific resource selection
   - Added per-resource permission level dropdowns
   - Updated `buildPermissionsFromBuilder` to use specific permissions

## Technical Implementation

### State Management

```typescript
const [permissionBuilder, setPermissionBuilder] = useState({
  products: {
    mode: 'none', // Default to no access
    selectedIds: [],
    permissionLevel: 'READ',
    specificPermissions: {} // Maps resourceId → permission level
  },
  // ... same for solutions and customers
});
```

### Table Rendering

For each resource:
1. Checkbox toggles selection
2. Permission dropdown shows current level
3. Dropdown is disabled if resource not selected
4. Changing dropdown updates `specificPermissions[resourceId]`

### Permission Submission

When saving the role:
```typescript
// For specific mode, each resource gets its own permission
selectedIds.forEach(id => {
  permissions.push({
    resourceType: 'PRODUCT',
    resourceId: id,
    permissionLevel: specificPermissions[id] || 'READ'
  });
});
```

## Backward Compatibility

✅ **Fully backward compatible**
- Existing roles work unchanged
- Old UI patterns ("all" + single level) still supported
- New features are opt-in

## Future Enhancements

Potential improvements:
1. Bulk actions (select all, set all to same level)
2. Search/filter in resource tables
3. Copy permissions from another role
4. Permission templates
5. Visual permission matrix view
6. Export/import role configurations

## Testing Checklist

- ✅ Create role with "No Access" for all (user sees nothing)
- ✅ Create role with "All Products" + READ
- ✅ Create role with mixed specific products (different levels each)
- ✅ Edit existing role to use new per-resource permissions
- ✅ Verify effective permissions preview shows correctly
- ✅ Confirm backend receives correct permissions array
- ✅ Test user login with new role sees only granted resources
- ✅ Test bidirectional flow still works with specific permissions
- ✅ Test permission enforcement on mutations

## User Documentation

To assign different permission levels to different products/solutions:

1. In the role dialog, select **"Specific Products"** (or Solutions/Customers)
2. In the table that appears:
   - **Check** the checkbox for each resource you want to grant access to
   - Use the **dropdown** next to each resource to set its permission level
   - Each resource can have a different level (READ, WRITE, or ADMIN)
3. The counter at the bottom shows how many resources you've selected
4. The "Effective Permissions Preview" shows the actual permissions including inheritance

**Tips**:
- Start with "No Access" and explicitly grant what's needed
- Use "All" mode when everyone needs the same level
- Use "Specific" mode for granular, per-resource control
- Check the preview before saving to verify effective permissions

