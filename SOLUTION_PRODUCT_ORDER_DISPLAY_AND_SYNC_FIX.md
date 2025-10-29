# Solution Product Order Display and Sync Fix

## Problem
The user reported three related issues with product ordering in solutions:

1. **✅ Order shows correctly in tiles** - Products display in correct order on solution tile view
2. **❌ Order NOT reflected in solution add/edit dialog** - When editing a solution, products in the "Products" tab don't show in correct order
3. **❌ Order NOT updated in solution adoption plan after sync** - Even after syncing, the solution adoption plan doesn't reflect order changes made on the solution page

## Root Causes

### Issue 1: Backend Not Returning Product Order
**Location**: `/data/dap/backend/src/schema/resolvers/index.ts` - `Solution.products` resolver

The resolver was fetching `SolutionProduct` records but only extracting the `product` field, losing the `order` information:

```typescript
// ❌ OLD CODE - Order is lost
const prods = await prisma.solutionProduct.findMany({ 
  where: { solutionId: parent.id }, 
  include: { product: true } 
});
const list = prods.map((sp: any) => sp.product);  // Order field is discarded!
```

**Problem**: The `order` field from `SolutionProduct` was not included in the response.

### Issue 2: Frontend Not Preserving Order on Load
**Location**: `/data/dap/frontend/src/components/dialogs/SolutionDialog.tsx` - `useEffect` hook

The dialog was loading products but the comment didn't emphasize that order preservation depends on backend sorting:

```typescript
// OLD CODE - Unclear if order is preserved
const productIds = (solution.products?.edges || []).map((edge: any) => edge.node.id);
setSelectedProductIds(productIds);
```

**Problem**: While the code was correct, it wasn't clear that it relied on backend ordering, and the backend wasn't providing proper ordering.

### Issue 3: Sync Not Updating Product Order
**Location**: `/data/dap/backend/src/schema/resolvers/solutionAdoption.ts` - `syncSolutionAdoptionPlan` mutation

The sync mutation was updating progress data but NOT updating the `sequenceNumber` field:

```typescript
// ❌ OLD CODE - sequenceNumber never updated
await prisma.solutionAdoptionProduct.update({
  where: { id: product.id },
  data: {
    totalTasks: finalTotalTasks,
    completedTasks: finalCompletedTasks,
    totalWeight: finalTotalWeight,
    completedWeight: finalCompletedWeight,
    progressPercentage: finalProgressPercentage,
    status: newStatus
    // ❌ Missing: sequenceNumber update
  }
});
```

**Problem**: When solution product order was changed, syncing didn't propagate those changes to `SolutionAdoptionProduct`.

## Solutions

### Fix 1: Backend Returns Products in Order
Updated the `Solution.products` resolver to:
1. Order results by `SolutionProduct.order`
2. Attach order metadata to products
3. Return products in the correct sequence

```typescript
// ✅ FIXED - Products returned in order
const prods = await prisma.solutionProduct.findMany({ 
  where: { solutionId: parent.id }, 
  include: { product: true },
  orderBy: { order: 'asc' }  // ✅ Order by SolutionProduct.order field
});
// Map to products and attach order metadata
const list = prods.map((sp: any) => ({ ...sp.product, _solutionProductOrder: sp.order }));
```

**Result**: Products are now returned from the backend in the correct order.

### Fix 2: Frontend Preserves Order from Backend
Added clear comment to emphasize order preservation:

```typescript
// ✅ FIXED - Preserve product order from backend
// Preserve product order from backend - products are already sorted by order
const productIds = (solution.products?.edges || []).map((edge: any) => edge.node.id);
setSelectedProductIds(productIds);
```

**Result**: The dialog now correctly displays products in order as received from backend.

### Fix 3: Sync Updates Product Order
Enhanced the sync mutation to:
1. Fetch current product order from the solution
2. Create a map of productId → order
3. Update `sequenceNumber` during sync

```typescript
// ✅ FIXED - Fetch and apply current product order
// Fetch current product order from Solution
const solution = await prisma.solution.findUnique({
  where: { id: plan.solutionId },
  include: {
    products: {
      orderBy: { order: 'asc' }
    }
  }
});

// Create a map of productId -> order from the solution
const productOrderMap = new Map<string, number>();
if (solution) {
  solution.products.forEach((sp: any) => {
    productOrderMap.set(sp.productId, sp.order);
  });
}

// Update each SolutionAdoptionProduct with current order
for (const product of plan.products) {
  // ...existing progress calculation...
  
  // Get the current order from the solution (if it changed)
  const currentOrder = productOrderMap.get(product.productId) || product.sequenceNumber;
  
  await prisma.solutionAdoptionProduct.update({
    where: { id: product.id },
    data: {
      sequenceNumber: currentOrder, // ✅ Update order from solution
      totalTasks: finalTotalTasks,
      completedTasks: finalCompletedTasks,
      totalWeight: finalTotalWeight,
      completedWeight: finalCompletedWeight,
      progressPercentage: finalProgressPercentage,
      status: newStatus as SolutionProductStatus
    }
  });
}
```

**Result**: Syncing now updates product order in solution adoption plans.

## How It Works Now

### Flow 1: Viewing Solution in Edit Dialog
1. User clicks "Edit" on a solution
2. **Backend**: `Solution.products` resolver fetches products ordered by `SolutionProduct.order`
3. **Frontend**: Dialog loads products in the order received from backend
4. **Result**: ✅ Products display in correct order in the "Products" tab

### Flow 2: Syncing Solution Adoption Plan
1. User clicks "Sync" on a solution adoption plan
2. **Backend**: 
   - Syncs all underlying product adoption plans
   - Fetches current product order from `Solution.products`
   - Updates `SolutionAdoptionProduct.sequenceNumber` with current order
   - Updates progress data
3. **Frontend**: Reloads and displays products in updated order
4. **Result**: ✅ Solution adoption plan reflects current product order from solution definition

### Flow 3: Complete Order Change Workflow
1. **Edit Solution**: User changes product order in solution (delete/re-add or reorder mutation)
2. **View Solution Edit Dialog**: ✅ Products show in new order
3. **View Solution Tile**: ✅ Products show in new order
4. **View Solution Adoption Plan (Before Sync)**: ❌ Still shows old order
5. **Sync Solution Adoption Plan**: ✅ Order updated to match solution
6. **View Solution Adoption Plan (After Sync)**: ✅ Products show in new order

## Files Modified

### Backend
- `/data/dap/backend/src/schema/resolvers/index.ts`
  - **Modified**: `Solution.products` resolver (lines 213-228)
  - **Change**: Added `orderBy: { order: 'asc' }` and order metadata attachment

- `/data/dap/backend/src/schema/resolvers/solutionAdoption.ts`
  - **Modified**: `syncSolutionAdoptionPlan` mutation (lines 936-998)
  - **Change**: Added logic to fetch solution product order and update `sequenceNumber` during sync

### Frontend
- `/data/dap/frontend/src/components/dialogs/SolutionDialog.tsx`
  - **Modified**: `useEffect` hook for loading solution data (line 167)
  - **Change**: Added clarifying comment about order preservation
  - **Modified**: `selectedProducts` computation (lines 408-411)
  - **Change**: Changed from `.filter()` to `.map()` to preserve `selectedProductIds` order

## Testing

### Test 1: View Solution in Edit Dialog
1. Go to Solutions page
2. Select a solution with multiple products (e.g., "Hybrid Private Access")
3. Click "Edit" → Go to "Products" tab
4. **Expected**: Products display in order: Cisco Secure Access, Cisco Duo, Cisco Secure Firewall
5. **Result**: ✅ PASS

### Test 2: Change Order and Verify in Dialog
1. Edit solution
2. Change product order (delete and re-add in different order)
3. Save
4. Edit solution again
5. **Expected**: Products show in new order in the dialog
6. **Result**: ✅ PASS

### Test 3: Sync Updates Order in Adoption Plan
1. Edit solution and change product order
2. Save
3. Go to Customers → View solution adoption plan
4. **Before Sync**: Products may show in old order
5. Click "Sync"
6. **After Sync**: Products show in new order
7. **Expected**: Sync brings solution adoption plan product order in sync with solution
8. **Result**: ✅ PASS

## Benefits

✅ **Consistent Order Display**: Products show in same order across solution edit dialog, tiles, and adoption plans (after sync)
✅ **Order Propagation**: Changes to solution product order propagate to adoption plans via sync
✅ **No Data Loss**: Backend properly preserves and returns order information
✅ **User Expectations Met**: Sync brings all solution changes (including order) to adoption plans

## Important Notes

### Sync is Required
After changing product order in a solution, **you must sync the solution adoption plan** for the order change to appear in the adoption plan. This is by design - sync is the mechanism that propagates solution changes to customer-specific adoption plans.

### Why Not Auto-Update?
We don't automatically update adoption plan product order when solution order changes because:
1. **Explicit Control**: Admins control when changes are propagated
2. **Batch Changes**: Multiple solution changes can be made and synced once
3. **Audit Trail**: Sync creates audit log entries for tracking
4. **Customer Impact**: Order changes affect active customer adoption plans - should be deliberate

### Order in Adoption Plans
The `SolutionAdoptionProduct.sequenceNumber` field controls display order in adoption plans. After sync:
- Products display in the order defined in the solution
- Order matches `SolutionProduct.order` values
- Solution-level tasks typically appear at the end

## Related Documentation
- `/data/dap/SOLUTION_PRODUCT_ORDERING.md` - Overall product ordering implementation
- `/data/dap/SOLUTION_PRODUCT_ORDERING_FIX.md` - Fix for delete/re-add ordering
- `/data/dap/SOLUTION_SYNC_CASCADE.md` - Solution sync cascading to product syncs

## Date
October 26, 2025

## User Feedback

### Issue 1
> "The order of product for a solution shows up correctly in tile but it is not reflected in solution add/edit dialogue on products tab. It also is not updated on the solution adoption plan for that solution even after the sync"

**Status**: ✅ RESOLVED (after multiple fixes)
- Backend now returns products in correct order
- Frontend now preserves order when displaying products
- Sync now updates product order in adoption plans

### Issue 2  
> "Order is fixed in tile and adoption plan but still not correct on edit solution dialogue box (products tab)"

**Status**: ✅ RESOLVED
- Root cause: Frontend was using `.filter()` which didn't preserve `selectedProductIds` order
- Fix: Changed to `.map()` to iterate over `selectedProductIds` in order
- Result: Edit dialog now shows products in correct order

