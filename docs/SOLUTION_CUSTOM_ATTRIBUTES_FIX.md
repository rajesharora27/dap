# Solution Custom Attributes - LicenseLevel Fix

## Problem

`licenseLevel` was appearing in solution `customAttrs` even though it's a separate UI field and should not be stored as a custom attribute. This caused inconsistent display between the custom attributes tile and the edit dialog.

## Root Cause

1. **Legacy Data**: Old database entries had `licenseLevel` stored in `customAttrs`
2. **Cache Issues**: Apollo Client was caching and merging stale data
3. **No Defensive Filtering**: Code didn't filter out `licenseLevel` at multiple layers

## Solution

Implemented **defensive filtering at multiple layers** to ensure `licenseLevel` never appears in `customAttrs`:

### Backend (Final Defense)
- **`createSolution`**: Filters `licenseLevel` from `customAttrs` before saving
- **`updateSolution`**: Filters `licenseLevel` from `customAttrs` before saving
- Location: `/data/dap/backend/src/schema/resolvers/index.ts`

### Frontend (Display & Save)
- **`SolutionDialog.tsx`**: Filters on load and before save
- **`App.tsx`**: Filters on tile display
- **`SolutionManagementMain.tsx`**: Filters on tile display
- **`SolutionsPanel.tsx`**: Filters from count chip

### Apollo Cache
- **Cache eviction**: Solution cache evicted after update
- **Network-only queries**: Solutions query uses `network-only` fetch policy
- **Network-only mutations**: Update mutation uses `network-only` fetch policy

## Implementation Details

### Backend Filtering
```typescript
// In createSolution and updateSolution
const safeCustomAttrs = Object.fromEntries(
  Object.entries(input.customAttrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
);
```

### Frontend Filtering
```typescript
// On load and save
const cleanedAttrs = Object.fromEntries(
  Object.entries(attrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
);
```

## Database Cleanup

Script available: `/data/dap/backend/scripts/force-clean-solutions.ts`

Run to clean existing data:
```bash
cd /data/dap/backend && npx ts-node scripts/force-clean-solutions.ts
```

## Verification

After implementation:
1. Custom attributes tile shows only user-created attributes (no `licenseLevel`)
2. Edit dialog → Attributes tab shows same attributes as tile
3. Adding/deleting attributes works consistently
4. `licenseLevel` never appears in `customAttrs` regardless of source

## Key Principle

**`licenseLevel` is a separate UI field** (General tab), **NOT a custom attribute**. Custom attributes are pure CRUD fields, identical to products. No special handling for any attribute names.

## Files Modified

### Backend
- `/data/dap/backend/src/schema/resolvers/index.ts` - Added filtering in create/update
- `/data/dap/backend/src/lib/pagination.ts` - Removed debug logs

### Frontend
- `/data/dap/frontend/src/components/dialogs/SolutionDialog.tsx` - Added filtering on load/save
- `/data/dap/frontend/src/pages/App.tsx` - Added filtering on display
- `/data/dap/frontend/src/components/SolutionManagementMain.tsx` - Added filtering on display
- `/data/dap/frontend/src/components/SolutionsPanel.tsx` - Added filtering in count

## Status

✅ **RESOLVED** - Multi-layer defensive filtering ensures `licenseLevel` never appears in `customAttrs`

