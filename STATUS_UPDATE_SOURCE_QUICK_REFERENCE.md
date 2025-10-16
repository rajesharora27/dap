# Status Update Source - Quick Reference

## What is it?
A new field that tracks **how** a task status was changed - manually by a user, automatically by telemetry, via import, or by the system.

## Four Source Types

### 🔵 MANUAL (Blue)
- **When**: User changes status via GUI
- **Who**: User ID stored in `statusUpdatedBy`
- **Example**: Project manager marks task as complete

### 🟢 TELEMETRY (Green)
- **When**: System evaluates telemetry and auto-updates
- **Who**: 'telemetry' stored in `statusUpdatedBy`
- **Example**: Task auto-completed when telemetry criteria met

### 🔷 IMPORT (Light Blue)
- **When**: Status imported from Excel/CSV file
- **Who**: 'import' stored in `statusUpdatedBy`
- **Example**: Bulk update via spreadsheet import

### ⚪ SYSTEM (Gray)
- **When**: System creates or syncs tasks
- **Who**: null (no specific user)
- **Example**: Initial adoption plan creation, product sync

## Where to See It

### Task List (Hover View)
- Hover over any task in the adoption plan
- Look for colored chip next to "Updated:" timestamp
- Color indicates source type

### Task Details Dialog
- Double-click any task to open details
- Scroll to bottom
- See chip next to "Last updated:" field

## Key Benefits

✅ **Transparency**: Know if change was manual or automatic
✅ **Audit Trail**: Track how adoption plans evolve
✅ **Data Quality**: Identify manual intervention patterns
✅ **Trust**: Clear distinction between user and system actions

## Common Scenarios

| Scenario | Source | Color | statusUpdatedBy |
|----------|--------|-------|-----------------|
| User clicks "Mark Complete" | MANUAL | 🔵 Blue | User's ID |
| Telemetry evaluation runs | TELEMETRY | 🟢 Green | "telemetry" |
| Import Excel file with statuses | IMPORT | 🔷 Light Blue | "import" |
| Assign product to customer | SYSTEM | ⚪ Gray | null |
| Edit entitlements (regenerate plan) | SYSTEM | ⚪ Gray | null |
| Sync adoption plan | SYSTEM | ⚪ Gray | null |

## GraphQL Field

```graphql
type CustomerTask {
  statusUpdateSource: StatusUpdateSource  # New field
}

enum StatusUpdateSource {
  MANUAL
  TELEMETRY
  IMPORT
  SYSTEM
}
```

## Database Field

```prisma
model CustomerTask {
  statusUpdateSource StatusUpdateSource? @default(SYSTEM)
}
```

## Color Coding Logic

```typescript
color={
  task.statusUpdateSource === 'MANUAL' ? 'primary' :      // Blue
  task.statusUpdateSource === 'TELEMETRY' ? 'success' :   // Green
  task.statusUpdateSource === 'IMPORT' ? 'info' :         // Light Blue
  'default'                                                // Gray (SYSTEM)
}
```

## Migration Applied

- **Migration**: `20251015_add_status_update_source`
- **Date**: October 15, 2025
- **Impact**: All existing tasks default to SYSTEM
- **Backward Compatible**: Yes

## Testing

### Quick Test
1. Create adoption plan → Tasks should show SYSTEM (gray)
2. Manually change a task status → Should show MANUAL (blue)
3. If telemetry configured → Auto-update should show TELEMETRY (green)
4. Import Excel → Imported status should show IMPORT (light blue)

## Related Features

- **Progress Calculation**: Works with statusUpdateSource
- **Status History**: Future enhancement to track all changes
- **Telemetry Integration**: Automatically sets TELEMETRY source
- **Import/Export**: Sets IMPORT source for file imports

## Questions?

- See [STATUS_UPDATE_SOURCE_FEATURE.md](./STATUS_UPDATE_SOURCE_FEATURE.md) for detailed documentation
- See [PROGRESS_CALCULATION_FIX.md](./PROGRESS_CALCULATION_FIX.md) for related progress fixes
