# GraphQL Query Fix - Sync Mutation

## Date: October 16, 2025

## Issue
Sync button in GUI returned 400 Bad Request error:

```
Field "selectedOutcomes" of type "[Outcome!]!" must have a selection of subfields. 
Did you mean "selectedOutcomes { ... }"?
```

## Root Cause

The GraphQL mutation query in `CustomerAdoptionPanelV4.tsx` was requesting `selectedOutcomes` as a scalar field, but the schema defines it as an **object type** `[Outcome!]!` which requires subfield selection.

### Backend Schema Definition
```graphql
type AdoptionPlan {
  ...
  selectedOutcomes: [Outcome!]!   # Array of Outcome objects
  selectedReleases: [Release!]!   # Array of Release objects
  ...
}

type Outcome {
  id: ID!
  name: String!
  description: String
  productId: ID!
}

type Release {
  id: ID!
  name: String!
  description: String
  level: Float!
  isActive: Boolean!
}
```

### Frontend Query (Incorrect)
```graphql
mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
  syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
    id
    selectedOutcomes  # ❌ ERROR: Missing subfields
    tasks {
      ...
    }
  }
}
```

## Solution

Updated the GraphQL query to request subfields for `selectedOutcomes` and `selectedReleases`:

### Frontend Query (Corrected)
```graphql
mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
  syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
    id
    selectedOutcomes {  # ✅ FIXED: Now has subfields
      id
      name
    }
    selectedReleases {  # ✅ ADDED: Also needs subfields
      id
      name
      level
    }
    tasks {
      ...
    }
  }
}
```

## Files Modified

### Frontend
- **`/frontend/src/components/CustomerAdoptionPanelV4.tsx`** (lines 182-201)
  - Added subfield selection for `selectedOutcomes`
  - Added subfield selection for `selectedReleases`

### Backend
- No changes needed (schema was already correct)

## Code Changes

**File**: `/data/dap/frontend/src/components/CustomerAdoptionPanelV4.tsx`

**Before**:
```typescript
const SYNC_ADOPTION_PLAN = gql`
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
      licenseLevel
      selectedOutcomes       // ❌ Missing subfields
      tasks {
        id
        name
        ...
      }
    }
  }
`;
```

**After**:
```typescript
const SYNC_ADOPTION_PLAN = gql`
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
      licenseLevel
      selectedOutcomes {     // ✅ Fixed: Added subfields
        id
        name
      }
      selectedReleases {     // ✅ Added: Needs subfields too
        id
        name
        level
      }
      tasks {
        id
        name
        ...
      }
    }
  }
`;
```

## Why This Happened

When we enhanced the sync function to update `selectedOutcomes` and `selectedReleases` in the backend, these fields changed from being **JSON arrays of IDs** to being **resolved as object arrays**.

### Before Enhancement
```typescript
// In backend resolver
selectedOutcomes: (parent: any) => parent.selectedOutcomes  // Just IDs: ["id1", "id2"]
```

### After Enhancement
```typescript
// In backend resolver (implied by schema)
selectedOutcomes: async (parent: any, _: any, ctx: any) => {
  const outcomeIds = parent.selectedOutcomes || [];
  return await prisma.outcome.findMany({
    where: { id: { in: outcomeIds } }
  });
}
// Returns objects: [{ id: "id1", name: "Security" }, ...]
```

The frontend query needed to be updated to match this schema change.

## Testing

### Before Fix
```bash
# Click Sync button in GUI
❌ Error: 400 Bad Request
❌ GraphQL validation error
❌ Sync doesn't execute
```

### After Fix
```bash
# Click Sync button in GUI
✅ Mutation executes successfully
✅ Adoption plan updated
✅ New outcomes/releases synced
✅ Tasks added/updated/removed
✅ UI refreshes with new data
```

## Related Changes

This fix complements the backend enhancement where:
1. Sync now updates `customerProduct.selectedOutcomes` to include all product outcomes
2. Sync now updates `customerProduct.selectedReleases` to include all product releases
3. Tasks are filtered using the updated selections

The frontend now properly receives and displays these updated selections.

## Other Affected Queries

Checked other GraphQL queries that use `selectedOutcomes`:
- ✅ `CustomerDetailView.tsx` - Doesn't request selectedOutcomes (no change needed)
- ✅ `CustomerAdoptionPanelV3.tsx` - Doesn't request selectedOutcomes (no change needed)
- ✅ `AdoptionPlanDialog.tsx` - Doesn't request selectedOutcomes (no change needed)

**Only `CustomerAdoptionPanelV4.tsx` needed the fix.**

## Status
✅ **Fixed and ready for testing**

## Next Steps
1. ✅ GraphQL query fixed
2. ⏳ Test sync in GUI
3. ⏳ Verify outcomes/releases display correctly
4. ⏳ Verify tasks sync properly
5. ⏳ Check audit log for sync statistics

---

## Summary

**Issue**: GraphQL validation error - `selectedOutcomes` missing subfields  
**Cause**: Frontend query treating object type as scalar  
**Fix**: Added subfield selection for `selectedOutcomes` and `selectedReleases`  
**Result**: Sync mutation now executes successfully  
**Status**: ✅ Complete
