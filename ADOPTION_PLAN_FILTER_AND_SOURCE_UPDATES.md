# Adoption Plan Filter Updates and Status Update Source Display

## Date: October 15, 2025

## Overview
Updated the adoption plan to:
1. **Remove license filter** - License is set during product assignment and cannot be changed in adoption plan
2. **Pre-filter tasks by license** - Tasks are already filtered by assigned license level at creation
3. **Display status update source** - Show how task status was updated (Manual/Telemetry/Import/System)

## Changes Made

### 1. Removed License Filter

#### Rationale
- License level is determined when product is assigned to customer
- License can only be changed via "Edit Product Assignment" dialog
- Tasks in adoption plan are already pre-filtered based on assigned license
- No need for additional license filtering in adoption plan view

#### What Changed
**Before**:
- Three filters: Releases (multi-select), License (single-select), Outcomes (multi-select)
- License dropdown with "All Licenses" option
- Users could filter tasks by license level

**After**:
- Two filters: Releases (multi-select), Outcomes (multi-select)
- License filter removed entirely
- Tasks are pre-filtered by assigned license level

#### Code Changes

**Removed State**:
```typescript
// Removed:
const [filterLicense, setFilterLicense] = useState<string>('');
```

**Updated Comments**:
```typescript
// Filter states - releases and outcomes support multiple selections
// Note: License filter removed - tasks are pre-filtered by assigned license level
const [filterReleases, setFilterReleases] = useState<string[]>([]);
const [filterOutcomes, setFilterOutcomes] = useState<string[]>([]);
```

**Removed availableLicenses**:
```typescript
// Removed this entire useMemo block:
const availableLicenses = React.useMemo(() => {
  // ... license collection logic
}, [planData?.adoptionPlan?.tasks]);
```

**Updated Filtering Logic**:
```typescript
// Filter tasks based on release and outcome
// Note: Tasks are already pre-filtered by license level (based on product assignment)
const filteredTasks = React.useMemo(() => {
  if (!planData?.adoptionPlan?.tasks) return [];
  
  return planData.adoptionPlan.tasks.filter((task: any) => {
    // Filter by releases (multiple selection)
    if (filterReleases.length > 0) {
      const hasSelectedRelease = task.releases?.some((release: any) => 
        filterReleases.includes(release.id)
      );
      if (!hasSelectedRelease) return false;
    }
    
    // Filter by outcomes (multiple selection)
    if (filterOutcomes.length > 0) {
      const hasSelectedOutcome = task.outcomes?.some((outcome: any) => 
        filterOutcomes.includes(outcome.id)
      );
      if (!hasSelectedOutcome) return false;
    }
    
    return true;
  });
}, [planData?.adoptionPlan?.tasks, filterReleases, filterOutcomes]);
// Note: filterLicense removed from dependencies
```

**Removed License Filter UI**:
```typescript
// Removed entire FormControl for License dropdown
// Only Releases and Outcomes dropdowns remain
```

**Updated Clear Filters**:
```typescript
// Before:
{(filterReleases.length > 0 || filterLicense !== '' || filterOutcomes.length > 0) && (
  <Button onClick={() => {
    setFilterReleases([]);
    setFilterLicense('');
    setFilterOutcomes([]);
  }}>
    Clear Filters
  </Button>
)}

// After:
{(filterReleases.length > 0 || filterOutcomes.length > 0) && (
  <Button onClick={() => {
    setFilterReleases([]);
    setFilterOutcomes([]);
  }}>
    Clear Filters
  </Button>
)}
```

### 2. Added Status Update Source Column

#### Purpose
Show users **how** a task status was updated:
- **MANUAL** - User updated via GUI (blue)
- **TELEMETRY** - Automatically updated based on telemetry evaluation (green)
- **IMPORT** - Updated via Excel/CSV import (light blue)
- **SYSTEM** - Created/updated by system operations (gray)

#### UI Changes

**Table Header Updated**:
```typescript
<TableHead>
  <TableRow>
    <TableCell width={60}>#</TableCell>
    <TableCell>Task Name</TableCell>
    <TableCell width={100}>Weight</TableCell>
    <TableCell width={150}>Status</TableCell>
    <TableCell width={120}>Updated Via</TableCell>  {/* ← NEW COLUMN */}
    <TableCell width={120}>Telemetry</TableCell>
    <TableCell width={100}>Actions</TableCell>
  </TableRow>
</TableHead>
```

**New Column Display**:
```typescript
<TableCell>
  {task.statusUpdateSource ? (
    <Chip 
      label={task.statusUpdateSource}
      size="small"
      color={
        task.statusUpdateSource === 'MANUAL' ? 'primary' :      // Blue
        task.statusUpdateSource === 'TELEMETRY' ? 'success' :   // Green
        task.statusUpdateSource === 'IMPORT' ? 'info' :         // Light Blue
        'default'                                                // Gray (SYSTEM)
      }
    />
  ) : (
    <Typography variant="caption" color="text.secondary">-</Typography>
  )}
</TableCell>
```

**Updated Empty State**:
```typescript
// Changed colSpan from 6 to 7 to account for new column
<TableCell colSpan={7} align="center">
  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
    No tasks match the selected filters
  </Typography>
</TableCell>
```

## How License Assignment Works

### Product Assignment Flow
```
1. User clicks "Assign Product to Customer"
   ↓
2. Select Product
   ↓
3. Select License Level (Essential/Advantage/Signature)
   ↓
4. Select Releases (optional, multiple)
   ↓
5. Select Outcomes (optional, multiple)
   ↓
6. Backend creates adoption plan
   ↓
7. Backend filters tasks based on:
   - License level (hierarchical - higher includes lower)
   - Selected releases (if any)
   - Selected outcomes (if any)
   ↓
8. Only qualifying tasks added to adoption plan
```

### Task Pre-Filtering Logic (Backend)

Tasks are included in adoption plan if they meet ALL conditions:

```typescript
function shouldIncludeTask(task, customerLicense, selectedOutcomes, selectedReleases) {
  // 1. License check (hierarchical)
  if (!isLicenseEligible(task.licenseLevel, customerLicense)) {
    return false;
  }
  
  // 2. Outcomes check (if customer selected any)
  if (selectedOutcomes.length > 0) {
    const hasSelectedOutcome = task.outcomes.some(o => selectedOutcomes.includes(o.id));
    if (!hasSelectedOutcome) return false;
  }
  
  // 3. Releases check (if customer selected any)
  if (selectedReleases.length > 0) {
    const hasSelectedRelease = task.releases.some(r => selectedReleases.includes(r.id));
    if (!hasSelectedRelease) return false;
  }
  
  return true;
}
```

### Changing License Level

To change a customer's license level:

1. Navigate to customer's adoption plan
2. Click "Edit Product Assignment" (not via adoption plan filters)
3. Select new license level
4. Backend regenerates adoption plan with new license filter
5. Tasks are recalculated based on new license

**Important**: Changing license regenerates the entire adoption plan!

## Status Update Source Display

### Visual Indicators

| Source | Color | Badge | When Set |
|--------|-------|-------|----------|
| MANUAL | 🔵 Blue | `primary` | User changes status via GUI |
| TELEMETRY | 🟢 Green | `success` | System evaluates telemetry and auto-updates |
| IMPORT | 🔷 Light Blue | `info` | Status imported from Excel/CSV |
| SYSTEM | ⚪ Gray | `default` | Initial creation, sync operations |

### Where It Displays

#### Task Table (Main View)
New "Updated Via" column shows color-coded chip:
```
#  | Task Name            | Weight | Status    | Updated Via | Telemetry | Actions
1  | Configure SSO        | 10%    | COMPLETED | MANUAL      | None      | [dropdown]
2  | Deploy 100 Clients   | 15%    | DONE      | TELEMETRY   | 2 attrs   | [dropdown]
3  | Import User Data     | 8%     | IN_PROGRESS| IMPORT     | None      | [dropdown]
```

#### Task Hover Info
Also shows in hover tooltip (already implemented):
```
Updated: 2025-10-15 10:30:00 by user-123 [MANUAL]
```

#### Task Details Dialog
Shows in details dialog (already implemented):
```
Last updated: 2025-10-15 10:30:00 by user-123 [MANUAL]
```

### User Understanding

**What users see**:
- Blue "MANUAL" chip → "I changed this status"
- Green "TELEMETRY" chip → "System auto-updated based on telemetry data"
- Light Blue "IMPORT" chip → "Status came from file import"
- Gray "SYSTEM" chip → "Task just created or plan synced"

**Benefits**:
- Clear visibility into data sources
- Trust in automation (telemetry-driven updates)
- Audit trail for manual changes
- Understanding of system operations

## Filter Workflow Now

### Available Filters (Adoption Plan View)

```
┌─────────────────────────────────────────────────────┐
│ Tasks                                    [Filters] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Releases ▼]    [Outcomes ▼]    [Clear Filters]  │
│   Multi-select    Multi-select                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**No License Filter** - License is fixed at product assignment level

### Use Case Examples

#### Example 1: View Tasks for Specific Releases
**Scenario**: Customer wants to see tasks for Release 2.0 and 3.0

**Steps**:
1. Open adoption plan (tasks already filtered by assigned license)
2. Click "Releases" dropdown
3. Check "Release 2.0" and "Release 3.0"
4. View filtered tasks

**Result**: Shows tasks that:
- Match assigned license level (pre-filtered) AND
- Belong to Release 2.0 OR 3.0

#### Example 2: View Security and Compliance Tasks
**Scenario**: Focus on security and compliance outcomes

**Steps**:
1. Open adoption plan
2. Click "Outcomes" dropdown
3. Check "Security" and "Compliance"
4. View filtered tasks

**Result**: Shows tasks that:
- Match assigned license level (pre-filtered) AND
- Have Security OR Compliance outcome

#### Example 3: Identify Manually Updated Tasks
**Scenario**: See which tasks were manually changed vs auto-updated

**How**:
- Look at "Updated Via" column
- Blue chips (MANUAL) = Manual updates
- Green chips (TELEMETRY) = Auto-updates
- Light blue chips (IMPORT) = Imported
- Gray chips (SYSTEM) = System-generated

**Insight**: Understand data quality and customer engagement

## Migration Impact

### Existing Adoption Plans
- ✅ **No impact** - Tasks already pre-filtered by license
- ✅ **No data migration needed**
- ✅ **Backward compatible**

### User Experience
- ✅ **Simpler filtering** - Two filters instead of three
- ✅ **Clearer purpose** - Filters for releases/outcomes, not license
- ✅ **Better understanding** - License shown in task hover, not as filter

### Performance
- ✅ **Improved** - One less filter to process
- ✅ **Fewer state updates** - Removed license filter state
- ✅ **Cleaner code** - Removed unnecessary filter logic

## Testing Checklist

### License Assignment
- [ ] Assign product with Essential license
- [ ] Verify only Essential tasks appear in adoption plan
- [ ] Assign same product with Advantage license to different customer
- [ ] Verify Advantage tasks (which include Essential) appear

### Editing License Level
- [ ] Open adoption plan
- [ ] Click "Edit Product Assignment"
- [ ] Change license from Essential to Advantage
- [ ] Verify adoption plan regenerates with new tasks
- [ ] Confirm old Essential-only progress is preserved or recalculated

### Filter Behavior
- [ ] Open adoption plan
- [ ] Verify only two filters shown (Releases, Outcomes)
- [ ] Verify no License filter dropdown
- [ ] Select multiple releases - tasks filtered correctly
- [ ] Select multiple outcomes - tasks filtered correctly
- [ ] Click Clear Filters - all filters reset

### Status Update Source Display
- [ ] Manually change task status - "MANUAL" chip appears in blue
- [ ] Import Excel with status updates - "IMPORT" chip appears in light blue
- [ ] Trigger telemetry evaluation - "TELEMETRY" chip appears in green
- [ ] Create new adoption plan - "SYSTEM" chip appears in gray
- [ ] Verify chip colors match documentation

### Task Table
- [ ] Verify "Updated Via" column appears
- [ ] Verify column shows appropriate chips
- [ ] Verify empty state shows "-" for no source
- [ ] Verify column width is appropriate (120px)

### Visual Consistency
- [ ] MANUAL chips are blue (primary color)
- [ ] TELEMETRY chips are green (success color)
- [ ] IMPORT chips are light blue (info color)
- [ ] SYSTEM chips are gray (default color)
- [ ] All chips same size and style

## Documentation Updates Needed

- [ ] Update user guide to explain license assignment flow
- [ ] Document that license cannot be changed in adoption plan
- [ ] Explain how to change license (via Edit Product Assignment)
- [ ] Document status update source meanings
- [ ] Add screenshots showing new "Updated Via" column
- [ ] Update filter documentation (remove license filter)

## Benefits Summary

### 1. Clearer License Management
- ✅ License set at product assignment, not in plan view
- ✅ Eliminates confusion about license filtering
- ✅ Matches business logic (license is customer entitlement)

### 2. Better Data Transparency
- ✅ Users see how status was updated (manual vs automatic)
- ✅ Trust in telemetry-driven automation
- ✅ Audit trail for manual interventions

### 3. Improved UX
- ✅ Simpler filtering (2 filters instead of 3)
- ✅ Clearer intent (filter by release/outcome, not license)
- ✅ Better visual feedback (color-coded update source)

### 4. Technical Benefits
- ✅ Reduced state management complexity
- ✅ Fewer filter operations
- ✅ Cleaner code architecture

## Related Features

- **License Assignment**: Set during product assignment dialog
- **Edit Product Assignment**: Change license (regenerates plan)
- **Status Update Source**: Track how status was changed
- **Task Pre-filtering**: Backend filters tasks by license
- **Multi-select Filters**: Releases and outcomes support multiple selections

## Files Modified

### Frontend
- `/frontend/src/components/CustomerAdoptionPanelV4.tsx`
  - Removed `filterLicense` state
  - Removed `availableLicenses` useMemo
  - Updated `filteredTasks` logic (removed license filter)
  - Removed license filter UI component
  - Updated clear filters logic
  - Added "Updated Via" table column
  - Added statusUpdateSource chip display
  - Updated colSpan for empty state

## Summary

Successfully updated adoption plan to:
1. ✅ **Removed license filter** - License is fixed at assignment level
2. ✅ **Pre-filter tasks by license** - Tasks already filtered by backend
3. ✅ **Display status update source** - Show MANUAL/TELEMETRY/IMPORT/SYSTEM with color coding

**Key Principle**: 
- License is a **customer entitlement** set at assignment, not a filter
- Tasks are **pre-filtered** based on license before reaching UI
- Status update source provides **transparency** into how data changes

**Status**: ✅ Complete and ready for testing
