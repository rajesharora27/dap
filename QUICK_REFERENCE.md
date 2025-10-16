# Quick Reference: Customer Adoption Plan Features

## Overview
Complete customer adoption management with edit, sync, and delete capabilities.

## Features at a Glance

| Feature | Button | Location | Purpose |
|---------|--------|----------|---------|
| **Edit Entitlements** | ✏️ Edit icon | Next to license chip | Change license level and outcomes |
| **Sync Adoption Plan** | Sync button | Top bar | Update tasks based on current entitlements |
| **Remove Product** | Remove Product (red) | Top bar | Delete product from customer |

## Quick Actions

### Edit License & Outcomes
```
1. Click ✏️ icon next to license chip
2. Change license level (Essential/Advantage/Signature)
3. Check/uncheck outcomes
4. Click "Save Changes"
5. Click "Sync" to update tasks
```

### Sync Tasks
```
1. Click "Sync" button (shows ⚠️ if needed)
2. Wait for "Syncing..." to complete
3. Tasks automatically update
```

### Remove Product
```
1. Click "Remove Product" button
2. Confirm in dialog
3. Product and adoption plan deleted
```

## Button States

### Sync Button
- **Normal**: Blue "Sync" button
- **Needs Sync**: Orange "Sync ⚠️" with warning icon
- **Loading**: "Syncing..." with disabled state
- **After Sync**: Blue "Sync" without warning

### Remove Product Button
- **Normal**: Red "Remove Product" button
- **Loading**: "Removing..." with disabled state

### Edit Button
- **Always**: Small edit icon (✏️) next to license chip

## What Happens When...

### You Edit Entitlements
- Entitlements saved to database
- "Sync Needed ⚠️" badge appears
- Tasks NOT updated yet (need to sync)

### You Click Sync
- Fetches latest product tasks
- Filters by license level
- Filters by selected outcomes  
- Adds new tasks
- Removes obsolete tasks
- Updates progress percentage
- Clears "Sync Needed" badge

### You Delete Product
- Customer-product assignment deleted
- Adoption plan deleted
- All customer tasks deleted
- Progress data deleted
- ⚠️ **Cannot be undone**

## Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| ⚠️ badge | Sync needed after changes |
| "Syncing..." | Operation in progress |
| "Removing..." | Delete in progress |
| Green alert | Success message |
| Red alert | Error message |

## Common Workflows

### Change License Level
```
Edit (✏️) → Select new license → Save → Sync → Done
```

### Add/Remove Outcomes
```
Edit (✏️) → Check/uncheck → Save → Sync → Done
```

### Start Fresh with Product
```
Remove Product → Confirm → Assign Product → Configure → Done
```

## Error Messages

| Message | Cause | Solution |
|---------|-------|----------|
| "Failed to sync: ..." | Network/backend error | Check connection, try again |
| "Failed to remove product: ..." | Permission/database error | Check permissions, contact admin |
| "Sync Needed ⚠️" | Entitlements changed | Click Sync button |

## Tips

1. **Always Sync After Editing**: Changes won't take effect until you sync
2. **Check Progress Bar**: Shows completion percentage after sync
3. **Review Before Deleting**: Cannot undo product deletion
4. **Watch for ⚠️**: Indicates action required (sync needed)
5. **Wait for Loading**: Don't click buttons repeatedly while loading

## Keyboard Shortcuts

*Note: Standard browser/Material-UI shortcuts apply*
- `Tab` - Navigate between buttons
- `Enter` - Activate focused button
- `Esc` - Close dialogs

## Testing

Run test scripts to verify functionality:
```bash
# Test edit and sync
node test-edit-entitlements-and-sync.js

# Test sync and delete
node test-sync-and-delete.js
```

## Support

- Documentation: `COMPLETE_IMPLEMENTATION_SUMMARY.md`
- Edit feature: `EDIT_ENTITLEMENTS_AND_SYNC_FIX.md`
- Sync/delete: `SYNC_AND_DELETE_PRODUCT_FIX.md`
