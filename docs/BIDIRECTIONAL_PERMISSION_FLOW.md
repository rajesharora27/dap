# Bidirectional Permission Flow - Products ↔ Solutions

## Overview

Implemented bidirectional permission flow between Products and Solutions based on the principle that permissions should flow logically between related resources.

**Core Principle:** Since solutions are composed of products, permissions should flow bidirectionally:
1. **All Products → All Solutions**: If someone is admin for all products, they naturally should be admin for all solutions
2. **Solution → Products**: If someone is admin for a solution, they should be admin for all products in that solution
3. **Products → Solution**: If someone has access to all products in a solution, they should have access to that solution

## Permission Flow Rules

### Rule 1: All Products → All Solutions
```
User Permission: All Products (ADMIN)
    ↓
Grants Access: All Solutions (ADMIN)
```

**Rationale**: Products are the building blocks of solutions. If you control all products, you implicitly control all solutions.

### Rule 2: Solution Access → Product Access
```
User Permission: Specific Solution (ADMIN)
    ↓
Grants Access: All Products in that Solution (ADMIN)
```

**Rationale**: To manage a solution, you need access to all its component products.

### Rule 3: All Solution Products → Solution Access
```
User Permission: Product A (ADMIN), Product B (ADMIN), Product C (ADMIN)
Solution X = {Product A, Product B, Product C}
    ↓
Grants Access: Solution X (ADMIN)
```

**Rationale**: If you have access to all products in a solution, you should be able to manage that solution.

## Implementation

### Modified Functions

#### 1. `checkUserPermission()` - Individual Resource Access Check

**Location:** `backend/src/lib/permissions.ts` (lines 23-262)

**New Logic for PRODUCT Access:**
1. Check direct product permissions (existing)
2. Check role-based product permissions (existing)
3. **NEW:** Check if user has access via solutions containing this product
   - Find all solutions containing the product
   - Check if user has permission on any of those solutions
   - If yes, grant product access

**New Logic for SOLUTION Access:**
1. Check direct solution permissions (existing)
2. Check role-based solution permissions (existing)
3. **NEW:** Check if user has "all products" permission → grants "all solutions"
4. **NEW:** Check if user has access to ALL products in the specific solution
   - If yes, grant solution access

#### 2. `getUserAccessibleResources()` - Batch Resource Filtering

**Location:** `backend/src/lib/permissions.ts` (lines 279-561)

**New Logic for PRODUCTS:**
1. Get direct product permissions (existing)
2. Get role-based product permissions (existing)
3. **NEW:** Get all solution permissions
4. **NEW:** For each accessible solution, add all its products to accessible products list
5. **NEW:** If user has "all solutions" access → return null (all products)

**New Logic for SOLUTIONS:**
1. Get direct solution permissions (existing)
2. Get role-based solution permissions (existing)
3. **NEW:** Check if user has "all products" permission
   - If yes → return null (all solutions)
4. **NEW:** Get all products user has access to
5. **NEW:** For each solution, check if user has access to ALL its products
   - If yes, add solution to accessible list

## Examples

### Example 1: Admin for All Products
```typescript
// User has permission
Permission {
  resourceType: PRODUCT,
  resourceId: null, // All products
  permissionLevel: ADMIN
}

// Result:
- Can access ALL products ✅
- Can access ALL solutions ✅ (via bidirectional flow)
```

### Example 2: Admin for Specific Solution
```typescript
// User has permission
Permission {
  resourceType: SOLUTION,
  resourceId: "solution-sase",
  permissionLevel: ADMIN
}

// Solution "solution-sase" contains:
- Product: "cisco-duo"
- Product: "cisco-sdwan"
- Product: "cisco-firewall"

// Result:
- Can access "solution-sase" ✅
- Can access "cisco-duo" ✅ (via bidirectional flow)
- Can access "cisco-sdwan" ✅ (via bidirectional flow)
- Can access "cisco-firewall" ✅ (via bidirectional flow)
```

### Example 3: Access to All Products in a Solution
```typescript
// User has permissions
Permission { resourceType: PRODUCT, resourceId: "cisco-duo", permissionLevel: ADMIN }
Permission { resourceType: PRODUCT, resourceId: "cisco-sdwan", permissionLevel: ADMIN }
Permission { resourceType: PRODUCT, resourceId: "cisco-firewall", permissionLevel: ADMIN }

// Solution "solution-sase" contains exactly these three products

// Result:
- Can access "cisco-duo" ✅
- Can access "cisco-sdwan" ✅
- Can access "cisco-firewall" ✅
- Can access "solution-sase" ✅ (via bidirectional flow)
```

### Example 4: Partial Product Access
```typescript
// User has permissions
Permission { resourceType: PRODUCT, resourceId: "cisco-duo", permissionLevel: ADMIN }
Permission { resourceType: PRODUCT, resourceId: "cisco-sdwan", permissionLevel: ADMIN }

// Solution "solution-sase" contains:
- Product: "cisco-duo" ✅
- Product: "cisco-sdwan" ✅
- Product: "cisco-firewall" ❌ (no access)

// Result:
- Can access "cisco-duo" ✅
- Can access "cisco-sdwan" ✅
- CANNOT access "solution-sase" ❌ (missing access to "cisco-firewall")
```

## Database Queries

The implementation efficiently handles permission checks with minimal database queries:

### For Product Access Check:
1. Check user and admin status (1 query)
2. Check direct permissions (1 query)
3. Check role permissions (1 query)
4. **NEW:** If specific product, find solutions containing it (1 query)
5. **NEW:** Check solution permissions (1 query per solution)

### For Solution Access Check:
1. Check user and admin status (1 query)
2. Check direct solution permissions (1 query)
3. Check role permissions (1 query)
4. **NEW:** Check "all products" permission (1 query)
5. **NEW:** If specific solution, get solution products (1 query)
6. **NEW:** Check permissions for each product (optimized with batch queries)

## Performance Considerations

### Optimizations Implemented:
1. **Early Exit**: Returns immediately when "all access" is granted
2. **Caching Potential**: User roles and permissions are fetched once
3. **No Recursion**: Carefully designed to avoid recursive calls between products and solutions
4. **Batch Queries**: Uses `IN` clauses to fetch multiple permissions at once

### Potential Improvements:
1. Add caching layer for permission checks (e.g., Redis)
2. Pre-compute permission matrices for complex role hierarchies
3. Add database indexes on frequently queried permission fields

## Testing Scenarios

### Test Case 1: All Products Permission
```bash
# Create role with "all products" admin
createRole({
  name: "Product Manager",
  permissions: [{
    resourceType: PRODUCT,
    resourceId: null,
    permissionLevel: ADMIN
  }]
})

# Expected: Can access all products AND all solutions
```

### Test Case 2: Solution Admin
```bash
# Create role with specific solution admin
createRole({
  name: "SASE Admin",
  permissions: [{
    resourceType: SOLUTION,
    resourceId: "solution-sase",
    permissionLevel: ADMIN
  }]
})

# Expected: Can access solution AND all its products
```

### Test Case 3: Partial Product Access
```bash
# Create role with access to 2 out of 3 products in a solution
createRole({
  name: "Partial Access",
  permissions: [
    { resourceType: PRODUCT, resourceId: "product-1", permissionLevel: ADMIN },
    { resourceType: PRODUCT, resourceId: "product-2", permissionLevel: ADMIN }
  ]
})

# Expected: Can access those 2 products, but NOT the solution
```

## Migration Impact

### Breaking Changes
None - this is an enhancement that adds more access, never restricts existing access.

### Backward Compatibility
✅ **Fully backward compatible**
- Existing permissions continue to work as before
- New bidirectional flow only GRANTS additional access, never restricts
- Admin users bypass all checks (unchanged)

## Files Modified

- **`backend/src/lib/permissions.ts`**
  - Updated `checkUserPermission()` to handle bidirectional flow (lines 98-261)
  - Updated `getUserAccessibleResources()` to handle bidirectional flow (lines 353-558)
  - Added comprehensive comments explaining the logic

## Related Documentation

- `docs/ROLE_PERMISSIONS_IMPLEMENTATION.md` - Original RBAC design
- `docs/PERMISSION_ENFORCEMENT.md` - Permission enforcement in resolvers
- `docs/MISSING_DATABASE_COLUMNS_FIX.md` - Database schema fixes

## Future Enhancements

### Potential Features:
1. **Customer-Level Bidirectional Flow**: Similar logic for customers and their assigned products/solutions
2. **Permission Inheritance**: Child resources inherit permissions from parent resources
3. **Permission Delegation**: Allow users to delegate their permissions to others
4. **Audit Trail**: Track when bidirectional permissions are used to grant access
5. **UI Indicators**: Show in UI when access is granted via bidirectional flow

### Configuration Options:
Consider adding settings to enable/disable bidirectional flow:
```typescript
{
  "permissions": {
    "bidirectionalFlow": {
      "enabled": true,
      "productsToSolutions": true,
      "solutionsToProducts": true
    }
  }
}
```

## Summary

The bidirectional permission flow creates a more intuitive and maintainable permission system where:
- **Product managers** can manage all solutions automatically
- **Solution administrators** can manage all component products automatically  
- **Permission grants are logical** and follow the natural hierarchy of resources
- **No additional configuration** required - it "just works"

This enhancement significantly improves the user experience for administrators and reduces the complexity of permission management.

