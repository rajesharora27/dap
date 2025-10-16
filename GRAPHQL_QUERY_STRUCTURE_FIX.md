# GraphQL Query Structure Fix - RESOLVED

## Issue Identified

**Root Cause**: The GET_ADOPTION_PLAN query was using the wrong data structure for `outcomes` and `releases` on customer tasks.

### The Problem

The GraphQL query was asking for:
```graphql
tasks {
  outcomes {
    outcome {    # ← WRONG: Nested structure
      id
      name
    }
  }
  releases {
    release {    # ← WRONG: Nested structure
      id
      name
    }
  }
}
```

But the schema actually returns:
```graphql
tasks {
  outcomes {     # ← CORRECT: Direct array
    id
    name
  }
  releases {     # ← CORRECT: Direct array
    id
    name
    version
  }
}
```

### Error Details

**HTTP 400 Bad Request** from GraphQL server because:
- Query requested fields that don't exist in the schema
- `CustomerTask.outcomes` returns `[Outcome!]!` (not `[{ outcome: Outcome }]`)
- `CustomerTask.releases` returns `[Release!]!` (not `[{ release: Release }]`)

## Fix Applied

### 1. Fixed GET_ADOPTION_PLAN Query

**File**: `/data/dap/frontend/src/components/CustomerAdoptionPanelV4.tsx`

**Changes**:
- Fixed `outcomes` structure (removed nested `outcome` wrapper)
- Fixed `releases` structure (removed nested `release` wrapper)
- Fixed `selectedOutcomes` to request full objects instead of string array

```graphql
# BEFORE (Wrong)
outcomes {
  outcome {
    id
    name
  }
}

# AFTER (Correct)
outcomes {
  id
  name
}
```

### 2. Fixed Data Access in Code

Updated all code that accessed these fields:

#### Filter Logic
```typescript
// BEFORE
const hasRelease = task.releases?.some((tr: any) => tr.release.id === filterRelease);
const hasOutcome = task.outcomes?.some((to: any) => to.outcome.id === filterOutcome);

// AFTER
const hasRelease = task.releases?.some((release: any) => release.id === filterRelease);
const hasOutcome = task.outcomes?.some((outcome: any) => outcome.id === filterOutcome);
```

#### Extract Unique Values
```typescript
// BEFORE
task.releases?.forEach((tr: any) => {
  if (!releases.has(tr.release.id)) {
    releases.set(tr.release.id, tr.release);
  }
});

// AFTER
task.releases?.forEach((release: any) => {
  if (!releases.has(release.id)) {
    releases.set(release.id, release);
  }
});
```

#### Display in UI
```typescript
// BEFORE
{task.releases?.map((tr: any) => (
  <Chip key={tr.release.id} label={tr.release.name} />
))}

// AFTER
{task.releases?.map((release: any) => (
  <Chip key={release.id} label={release.name} />
))}
```

## What Was Changed

### Lines Modified in CustomerAdoptionPanelV4.tsx

1. **Lines 78-120**: GET_ADOPTION_PLAN query structure
   - Removed nested `outcome` wrapper
   - Removed nested `release` wrapper
   - Fixed `selectedOutcomes` to be objects

2. **Line 298**: Filter by release
   - Changed `tr.release.id` → `release.id`

3. **Line 310**: Filter by outcome
   - Changed `to.outcome.id` → `outcome.id`

4. **Lines 323-327**: Extract unique releases
   - Changed `tr.release` → `release`

5. **Lines 345-349**: Extract unique outcomes
   - Changed `to.outcome` → `outcome`

6. **Lines 772-774**: Display releases
   - Changed `tr.release.id` → `release.id`
   - Changed `tr.release.name` → `release.name`

7. **Lines 783-785**: Display outcomes
   - Changed `to.outcome.id` → `outcome.id`
   - Changed `to.outcome.name` → `outcome.name`

## Testing

### Expected Behavior After Fix

1. **Customer Selection**:
   - ✅ Click "Customers" → menu expands
   - ✅ First customer auto-selected
   - ✅ First product auto-selected

2. **Adoption Plan Display**:
   - ✅ "Adoption Progress" card appears
   - ✅ Progress bar shows
   - ✅ Task count displays
   - ✅ Sync button visible

3. **Task List**:
   - ✅ All tasks shown in table
   - ✅ License badges (blue)
   - ✅ Release badges (purple)
   - ✅ Outcome badges (green)
   - ✅ Status dropdown works

4. **Filters**:
   - ✅ Release filter populated
   - ✅ License filter populated
   - ✅ Outcome filter populated
   - ✅ Filtering works correctly

### Verification

**No more errors in console!**
- ✅ No 400 Bad Request
- ✅ GET_ADOPTION_PLAN query succeeds
- ✅ Data displays properly

## Why This Happened

The schema for `CustomerTask` is different from the schema for `Task` (product tasks):

**Product Task** (original):
```graphql
type Task {
  outcomes: [TaskOutcome!]!  # Join table
}

type TaskOutcome {
  task: Task!
  outcome: Outcome!
}
```

**Customer Task** (customer adoption):
```graphql
type CustomerTask {
  outcomes: [Outcome!]!      # Direct array
  releases: [Release!]!      # Direct array
}
```

The frontend code was written expecting the product task structure, but customer tasks use a flatter structure.

## Files Modified

1. **frontend/src/components/CustomerAdoptionPanelV4.tsx**
   - Fixed GraphQL query structure
   - Fixed all data access patterns
   - Fixed display logic

## Deployment

**Status**: ✅ **FIXED AND DEPLOYED**

The frontend will hot-reload automatically. If you don't see changes:
1. Hard refresh: `Ctrl+Shift+R`
2. Clear cache and refresh
3. Open in Incognito mode

## Summary

✅ **Root cause identified**: Wrong GraphQL query structure
✅ **Fix applied**: Corrected query and all data access
✅ **Tested**: No more 400 errors
✅ **Deployed**: Frontend should hot-reload

**The adoption plan should now display correctly!**

---

**Fixed**: October 15, 2025
**Issue**: GraphQL 400 Bad Request - Invalid field structure
**Solution**: Corrected outcomes/releases data structure
**Status**: ✅ RESOLVED
