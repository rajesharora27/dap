# Edit Product Entitlements and Sync Button Fix

## Date: October 15, 2025

## Issues Resolved

### 1. Added Edit Product Entitlements Feature
- **Problem**: No way to change license level or outcomes after product assignment
- **Solution**: Created new Edit button and dialog to modify customer product entitlements

### 2. Fixed Sync Button Not Updating Adoption Plan
- **Problem**: Sync button wasn't properly refreshing the adoption plan data
- **Solution**: Added refetchQueries and awaitRefetchQueries to SYNC_ADOPTION_PLAN mutation

## Changes Made

### Backend (No Changes Required)
The `updateCustomerProduct` mutation already existed and was fully functional:
- Location: `backend/src/schema/resolvers/customerAdoption.ts` lines 417-468
- Accepts: `licenseLevel` and `selectedOutcomeIds`
- Automatically marks adoption plan for sync when changes are made

### Frontend Changes

#### 1. New Component: EditEntitlementsDialog.tsx
**File**: `frontend/src/components/dialogs/EditEntitlementsDialog.tsx`

New dialog component that allows editing:
- **License Level**: Dropdown with ESSENTIAL, STANDARD, PREMIUM, ENTERPRISE options
- **Outcomes**: Checkboxes for all available outcomes for the product
- **Change Detection**: Highlights when changes are made and warns that sync is needed
- **Validation**: Save button disabled when no changes detected

#### 2. Updated CustomerAdoptionPanelV4.tsx

**GraphQL Mutations Fixed**:
```typescript
// Fixed SYNC_ADOPTION_PLAN structure (lines 163-199)
- Removed nested structure: outcomes.outcome → outcomes
- Removed nested structure: releases.release → releases  
- Changed version → level for releases
- Added refetchQueries: ['GetAdoptionPlan', 'GetCustomers']
- Added awaitRefetchQueries: true

// Added UPDATE_CUSTOMER_PRODUCT mutation (lines 201-212)
- Accepts id and input (licenseLevel, selectedOutcomeIds)
- Returns updated customerProduct with adoptionPlan needsSync status
```

**State Management**:
```typescript
// Added new state for edit dialog (line 252)
const [editEntitlementsDialogOpen, setEditEntitlementsDialogOpen] = useState(false);
```

**Mutation Hooks**:
```typescript
// Fixed syncAdoptionPlan (lines 419-427)
- Added refetchQueries: ['GetAdoptionPlan', 'GetCustomers']
- Added awaitRefetchQueries: true
- Ensures data refreshes properly after sync

// Added updateCustomerProduct (lines 429-438)
- Refetches queries after update
- Shows success message with reminder to sync
- Closes dialog on completion
```

**UI Changes**:
```typescript
// Added Edit button next to license chip (lines 666-675)
- IconButton with Edit icon
- Tooltip: "Edit license and outcomes"
- Opens EditEntitlementsDialog

// Added EditEntitlementsDialog (lines 998-1020)
- Passes customerProductId, productId, current values
- Calls updateCustomerProduct mutation on save
```

**Query Updates**:
```typescript
// Updated GET_CUSTOMERS query (lines 57-81)
- Added selectedOutcomes field to products
- Needed for displaying current selections in edit dialog
```

## User Workflow

### Editing Product Entitlements

1. **Open Adoption Panel**: Select customer and product
2. **Click Edit Button**: IconButton next to license level chip
3. **Modify Entitlements**: 
   - Change license level from dropdown
   - Check/uncheck outcomes
   - See warning that sync will be needed
4. **Save Changes**: Click "Save Changes" button
5. **Sync Tasks**: Click "Sync" button to update adoption plan tasks based on new entitlements
6. **Verify**: Check that tasks are updated according to new license and outcomes

### Syncing Adoption Plan

1. **When to Sync**:
   - After editing entitlements (license/outcomes)
   - When "Sync Needed ⚠️" badge appears
   - When product tasks have been updated
   - After manual database changes

2. **How to Sync**:
   - Click "Sync" button in header (next to Assign Product)
   - Or click "Sync ⚠️" badge in progress card

3. **What Happens**:
   - Fetches latest product tasks
   - Filters tasks by new license level
   - Filters tasks by selected outcomes
   - Adds new customer tasks
   - Removes tasks no longer applicable
   - Updates progress percentage
   - Sets lastSyncedAt timestamp
   - Removes needsSync flag

## Technical Details

### GraphQL Structure Fixes

**Before (Nested - WRONG)**:
```graphql
outcomes {
  outcome {
    id
    name
  }
}
releases {
  release {
    id
    name
    version  # This field doesn't exist!
  }
}
```

**After (Flat - CORRECT)**:
```graphql
outcomes {
  id
  name
}
releases {
  id
  name
  level  # Correct field name
}
```

### Mutation Configurations

**SYNC_ADOPTION_PLAN**:
```typescript
const [syncAdoptionPlan] = useMutation(SYNC_ADOPTION_PLAN, {
  refetchQueries: ['GetAdoptionPlan', 'GetCustomers'],  // ✅ Added
  awaitRefetchQueries: true,                             // ✅ Added
  onCompleted: () => {
    refetchPlan();    // Manual refetch
    refetch();        // Manual refetch
    setSuccess('Adoption plan synced successfully');
  },
});
```

**UPDATE_CUSTOMER_PRODUCT**:
```typescript
const [updateCustomerProduct] = useMutation(UPDATE_CUSTOMER_PRODUCT, {
  refetchQueries: ['GetAdoptionPlan', 'GetCustomers'],  // ✅ Added
  awaitRefetchQueries: true,                             // ✅ Added
  onCompleted: () => {
    setEditEntitlementsDialogOpen(false);
    refetchPlan();
    refetch();
    setSuccess('Product entitlements updated successfully. Use the Sync button to update tasks.');
  },
});
```

## Testing Steps

### Test Edit Entitlements
1. ✅ Open a customer with assigned product
2. ✅ Click Edit button next to license chip
3. ✅ Change license level (e.g., ESSENTIAL → STANDARD)
4. ✅ Check/uncheck some outcomes
5. ✅ Verify warning shows about needing sync
6. ✅ Click Save Changes
7. ✅ Verify success message appears
8. ✅ Verify license chip updates
9. ✅ Verify "Sync Needed ⚠️" badge appears

### Test Sync Button
1. ✅ After editing entitlements, click Sync button
2. ✅ Verify success message: "Adoption plan synced successfully"
3. ✅ Verify "Sync Needed ⚠️" badge disappears
4. ✅ Verify tasks update according to new license/outcomes
5. ✅ Verify progress percentage recalculates
6. ✅ Verify lastSyncedAt updates in progress card
7. ✅ Check browser console for no errors
8. ✅ Verify Network tab shows 200 responses for mutations

### Test Data Persistence
1. ✅ Edit entitlements and sync
2. ✅ Refresh browser page
3. ✅ Verify changes persisted
4. ✅ Verify sync status correct
5. ✅ Verify tasks still filtered correctly

## Files Modified

1. **frontend/src/components/CustomerAdoptionPanelV4.tsx**
   - Fixed SYNC_ADOPTION_PLAN mutation structure
   - Added UPDATE_CUSTOMER_PRODUCT mutation
   - Added edit entitlements dialog state
   - Added edit button to UI
   - Enhanced sync mutation with refetchQueries
   - Added selectedOutcomes to GET_CUSTOMERS query
   - Imported EditEntitlementsDialog component
   - Rendered EditEntitlementsDialog

2. **frontend/src/components/dialogs/EditEntitlementsDialog.tsx** (NEW)
   - Complete new component for editing entitlements
   - License level dropdown
   - Outcomes checkboxes with descriptions
   - Change detection and warnings
   - Integrated with updateCustomerProduct mutation

## Benefits

1. **User Flexibility**: Customers can now change license levels and outcomes without reassigning products
2. **Data Integrity**: Sync mechanism ensures adoption plan tasks match current entitlements
3. **Clear Workflow**: Visual indicators (Sync Needed badge) guide users to sync after changes
4. **Better UX**: Edit button directly next to license chip for discoverability
5. **Proper Validation**: Changes are validated and properly persisted
6. **Cache Management**: Automatic query refetching ensures UI stays in sync with server

## Known Limitations

1. **Release Selection**: Currently releases are determined automatically by license level, not manually selectable
   - This is by design in the current schema
   - Releases are inherited based on license tier

2. **Bulk Operations**: Can only edit one customer-product at a time
   - Future enhancement could add bulk edit capability

3. **Outcome Dependencies**: No validation of outcome dependencies or conflicts
   - Future enhancement could add business rules

## Next Steps

1. ✅ Test in browser with real data
2. ✅ Verify all GraphQL queries return 200
3. ✅ Confirm tasks update correctly after sync
4. ✅ Test edge cases (no outcomes selected, changing license multiple times)
5. ✅ Verify audit logs capture entitlement changes
6. 📝 Update user documentation with new edit workflow
7. 📝 Add unit tests for EditEntitlementsDialog
8. 📝 Add integration tests for update flow
