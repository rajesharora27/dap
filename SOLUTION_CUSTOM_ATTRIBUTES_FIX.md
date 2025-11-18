# Solution Custom Attributes - Root Cause & Fix

## Root Cause

`licenseLevel` kept appearing in solution `customAttrs` because:

1. **Old Data**: Solutions had `licenseLevel` stored in `customAttrs` from previous implementation
2. **Load → Modify → Save Cycle**: 
   - Load solution → `customAttrs` includes old `licenseLevel` 
   - Add/delete attribute → modifies `customAttrs` state (which includes `licenseLevel`)
   - Save → entire `customAttrs` state saved back to DB (preserving `licenseLevel`)

## Code Status

✅ **Code is correct**: 
- `licenseLevel` is a SEPARATE state variable (line 187)
- `customAttrs` is a SEPARATE state variable (line 188)  
- They are NEVER mixed in code
- Only `customAttrs` is saved (line 278)

✅ **Implementation matches products**:
- No special handling for any attribute names
- Simple CRUD for custom attributes
- Generic, no hard-coded logic

## Fix Applied

1. **Database cleaned**: Removed `licenseLevel` from all solutions' `customAttrs`
2. **Script available**: `/data/dap/backend/scripts/remove-licenselevel-from-solutions.ts`

## User Action Required

**IMPORTANT**: You MUST refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

Why? The old solution data with `licenseLevel` in `customAttrs` is cached in:
- Apollo Client cache
- Component state
- Browser memory

Refreshing clears this cache and loads clean data from the database.

## Verification

After refresh:
1. Open a solution's edit dialog
2. Go to Custom Attributes tab
3. Should see: `BE`, `owner`, `test` (no `licenseLevel`)
4. Add a new attribute → Save → `licenseLevel` should NOT appear
5. Delete an attribute → Save → `licenseLevel` should NOT appear

## Technical Details

**SolutionDialog.tsx:**
- Line 187: `const [licenseLevel, setLicenseLevel] = useState...` ← Separate UI field
- Line 188: `const [customAttrs, setCustomAttrs] = useState...` ← Separate custom attributes
- Line 278: `customAttrs: Object.keys(customAttrs).length > 0 ? customAttrs : undefined` ← Only customAttrs saved

**No code adds licenseLevel to customAttrs** - the issue was purely old database data.

