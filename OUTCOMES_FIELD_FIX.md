# Outcomes Field Fix

## Issue
The "Expected Outcomes" field was not visible in Task Add/Edit dialogs.

## Root Cause
Both `TaskDialog.tsx` and `TaskDetailDialog.tsx` had the Outcomes field wrapped in a conditional:
```tsx
{outcomes.length > 0 && (
  <FormControl fullWidth margin="normal">
    <InputLabel>Expected Outcomes</InputLabel>
    ...
  </FormControl>
)}
```

This meant the field only appeared when outcomes existed for the product. If no outcomes were defined or loaded yet, the field would be completely hidden from the UI.

## Solution
Removed the `outcomes.length > 0` conditional wrapper from both dialog components, making the Outcomes field always visible regardless of whether outcomes exist.

### Files Modified
1. **frontend/src/components/dialogs/TaskDialog.tsx** (line ~340)
   - Removed conditional wrapper around Outcomes FormControl
   - Field now always visible in task creation dialog

2. **frontend/src/components/TaskDetailDialog.tsx** (line ~335)
   - Removed conditional wrapper around Outcomes FormControl
   - Field now always visible in task editing dialog

## Implementation Details

### Before:
```tsx
{outcomes.length > 0 && (
  <Box sx={{ mt: 2 }}>
    <FormControl fullWidth margin="normal">
      <InputLabel>Expected Outcomes</InputLabel>
      <Select multiple ...>
        ...
      </Select>
    </FormControl>
  </Box>
)}
```

### After:
```tsx
<Box sx={{ mt: 2 }}>
  <FormControl fullWidth margin="normal">
    <InputLabel>Expected Outcomes</InputLabel>
    <Select multiple ...>
      ...
    </Select>
  </FormControl>
</Box>
```

## User Experience
- ✅ Outcomes field is now always visible when creating tasks
- ✅ Outcomes field is now always visible when editing tasks
- ✅ If no outcomes are defined for the product, the dropdown will be empty (consistent with how Licenses and Releases fields work)
- ✅ Users can see the field exists even if they need to add outcomes first

## Testing
- No TypeScript errors in either file
- Field behavior now consistent with other multi-select fields (Licenses, Releases)
- Maintains all existing functionality (multi-select, chips display, etc.)

## Related Components
- **TaskDialog**: Used for creating new tasks (Add Task button)
- **TaskDetailDialog**: Used for editing existing tasks (Edit Task)
- **App.tsx**: Passes outcomes array to TaskDialog from GraphQL OUTCOMES query
- **TaskDetailDialog**: Fetches outcomes independently via OUTCOMES_FOR_PRODUCT query
