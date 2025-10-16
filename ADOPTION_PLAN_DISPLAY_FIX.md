# Adoption Plan Display Fix

## Issue
After assigning a product to a customer, the adoption plan was not being displayed, and the Sync button was not visible.

## Root Cause
The Apollo GraphQL cache was not being properly updated after product assignment and adoption plan creation because:

1. **Missing Fields in Mutation Response**: The `ASSIGN_PRODUCT_TO_CUSTOMER` mutation didn't request the `adoptionPlan` field in its response, so the cache couldn't know that an adoption plan was created.

2. **No Cache Invalidation**: The mutations weren't configured to refetch the customer list query, leaving the UI with stale data.

## Solution

### 1. Enhanced Mutation Response Fields

Updated the `ASSIGN_PRODUCT_TO_CUSTOMER` mutation to include the adoption plan data:

```graphql
mutation AssignProductToCustomer($input: AssignProductToCustomerInput!) {
  assignProductToCustomer(input: $input) {
    id
    licenseLevel
    selectedOutcomes {
      id
      name
    }
    product {
      id
      name
    }
    adoptionPlan {          # ← ADDED
      id
      progressPercentage
      totalTasks
      completedTasks
    }
  }
}
```

### 2. Enhanced CREATE_ADOPTION_PLAN Mutation

Added `completedTasks` field for consistency:

```graphql
mutation CreateAdoptionPlan($customerProductId: ID!) {
  createAdoptionPlan(customerProductId: $customerProductId) {
    id
    totalTasks
    completedTasks        # ← ADDED
    progressPercentage
  }
}
```

### 3. Added Refetch Queries

Configured both mutations to refetch the customer list after completion:

```typescript
const [assignProduct, { loading: assigning }] = useMutation(ASSIGN_PRODUCT_TO_CUSTOMER, {
  refetchQueries: ['GetCustomers'],
  awaitRefetchQueries: true,
});

const [createAdoptionPlan, { loading: creatingPlan }] = useMutation(CREATE_ADOPTION_PLAN, {
  refetchQueries: ['GetCustomers'],
  awaitRefetchQueries: true,
});
```

## Benefits

✅ **Immediate UI Update**: Adoption plans are now immediately visible after product assignment
✅ **Sync Button Visible**: The sync button appears when needed (when `needsSync` is true or always visible based on feature)
✅ **Consistent Cache**: Apollo cache is properly synchronized with the backend state
✅ **Better UX**: No need to manually refresh the page to see newly created adoption plans

## Testing Checklist

- [x] Assign a product to a customer
- [x] Verify adoption plan is created (checkbox is checked in dialog)
- [x] Verify adoption plan appears immediately in the UI
- [x] Verify task count is displayed
- [x] Verify progress percentage is shown
- [x] Verify sync button is visible (if needed)
- [x] Verify expanding the customer shows the product and adoption plan details

## Files Modified

1. **frontend/src/components/dialogs/AssignProductDialog.tsx**
   - Line ~50: Enhanced `ASSIGN_PRODUCT_TO_CUSTOMER` mutation to include `adoptionPlan` field
   - Line ~70: Enhanced `CREATE_ADOPTION_PLAN` mutation to include `completedTasks` field
   - Line ~107-112: Added `refetchQueries` configuration to both mutations

## Related Features

This fix ensures proper integration with:
- Customer Adoption Panel V4
- Sync functionality (manual and automatic)
- Filter system (release, license, outcome filters)
- Task status management
- Progress tracking

## Technical Notes

### Apollo Cache Management

Apollo Client uses a normalized cache that stores objects by their `__typename` and `id`. When a mutation returns data, Apollo automatically updates the cache for those objects. However, if the mutation doesn't return the complete object graph, the cache won't know about related objects.

**Before the fix**:
```typescript
assignProduct → Returns CustomerProduct without adoptionPlan
createAdoptionPlan → Creates adoption plan but cache link is missing
Result: UI doesn't know adoptionPlan exists
```

**After the fix**:
```typescript
assignProduct → Returns CustomerProduct WITH adoptionPlan
createAdoptionPlan → Returns full adoption plan + refetches customers
Result: UI immediately shows adoption plan
```

### RefetchQueries vs Update Function

We chose `refetchQueries` over manual `update` function because:
1. **Simplicity**: Refetching is straightforward and less error-prone
2. **Completeness**: Ensures all related data is fetched (nested relationships)
3. **Consistency**: Guarantees cache matches backend state exactly

**Trade-off**: Slightly more network traffic (one extra query) but much more reliable.

### Await Refetch Queries

The `awaitRefetchQueries: true` option ensures mutations wait for refetch to complete before resolving. This prevents race conditions where:
1. Mutation completes
2. `onAssigned` callback fires
3. UI updates before refetch completes
4. User sees stale data briefly

## Future Improvements

1. **Optimistic Updates**: Could implement optimistic UI updates for instant feedback
2. **Subscription**: Could use GraphQL subscriptions for real-time adoption plan updates
3. **Cache Persistence**: Could persist cache to localStorage for offline support
4. **Batch Refetch**: Could batch multiple refetches if assigning multiple products

## Deployment Notes

- ✅ No database migration required
- ✅ No backend changes required (schema already supports these fields)
- ✅ Frontend-only change
- ✅ Backward compatible
- ⚠️ Clear browser cache after deployment (Ctrl+Shift+R)

---

**Fixed**: October 15, 2025
**Version**: 2.1.0
**Impact**: High - Core functionality restored
