# Task License Persistence Fix

## Problem
When editing a task, the required license was not showing/persisting in the edit dialog. The license dropdown appeared empty even though the task had a license assigned.

## Root Cause
The TaskDialog component was looking for `task.licenseId` (line 148), but the GraphQL query returns the license as a nested object:

```typescript
// GraphQL returns this:
task.license = {
  id: "...",
  name: "Premium",
  level: 3
}

// But the code was looking for this:
task.licenseId = "..."  // This doesn't exist!
```

## The Fix

### 1. Updated Task Interface (Line 39)
Added the `license` property to properly type the nested object:

```typescript
interface Task {
  // ... other fields
  licenseId?: string;  // Kept for backward compatibility
  license?: { id: string; name: string; level: number };  // Added this!
  // ... other fields
}
```

### 2. Fixed License Loading (Line 148)
Changed from accessing non-existent `task.licenseId` to accessing `task.license.id`:

```typescript
// BEFORE (Wrong)
setSelectedLicense(task.licenseId || '');

// AFTER (Correct)
setSelectedLicense((task as any).license?.id || task.licenseId || '');
```

This uses optional chaining (`?.`) to safely access `task.license.id`, and falls back to `task.licenseId` for backward compatibility.

## How It Works Now

### When Opening Edit Dialog
1. Task data includes: `task.license = { id: "abc123", name: "Premium", level: 3 }`
2. Dialog loads: `setSelectedLicense(task.license.id)` → `"abc123"`
3. Dropdown shows: "Premium (Level 3)" chip ✅

### Visual Display
The license dropdown properly shows the assigned license:
- **Single selection** with Chip display
- Shows: `License Name (Level X)`
- Matches the pattern used for Outcomes and Releases

### Comparison with Outcomes and Releases
All three now work consistently:

| Field | Data Structure | Display |
|-------|---------------|---------|
| **Outcomes** | `task.outcomes = [{ id, name }]` | Green chips with checkboxes ✅ |
| **Releases** | `task.releases = [{ id, name, level }]` | Blue chips with checkboxes ✅ |
| **License** | `task.license = { id, name, level }` | Blue chip (single select) ✅ |

## Files Modified
- `/data/dap/frontend/src/components/dialogs/TaskDialog.tsx`
  - **Line 39**: Added `license` property to Task interface
  - **Line 148**: Fixed to use `task.license?.id` instead of `task.licenseId`

## Testing
1. Hard refresh browser (Ctrl+Shift+R)
2. Select a product
3. Edit any task that has a license assigned
4. Verify the license dropdown shows the current license as a chip
5. Verify you can change it and save successfully
6. Verify outcomes and releases also display correctly (they already did)

## Related GraphQL Query
The `TASKS_FOR_PRODUCT` query in App.tsx (lines 147-200) returns:
```graphql
license {
  id
  name
  level
}
```

This structure is now properly handled throughout the edit dialog.
