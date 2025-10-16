# Releases and Adoption Plan Regeneration Feature

## Summary
Implemented comprehensive support for product releases and improved the edit entitlements workflow to regenerate adoption plans instead of just marking them for sync.

## Changes Made

### 1. Database Schema (Prisma)
- Added `selectedReleases` JSON field to `CustomerProduct` model
- Added `selectedReleases` JSON field to `AdoptionPlan` model
- Migration: `20251015185525_add_selected_releases`

### 2. Backend GraphQL Schema
- Updated `CustomerProductWithPlan` type to include `selectedReleases: [Release!]!`
- Updated `AdoptionPlan` type to include `selectedReleases: [Release!]!`
- Updated `AssignProductToCustomerInput` to include `selectedReleaseIds: [ID!]!`
- Updated `UpdateCustomerProductInput` to include `selectedReleaseIds: [ID!]`

### 3. Backend Resolvers

#### Updated `shouldIncludeTask` Function
- Now accepts optional `selectedReleaseIds` parameter
- Filters tasks by releases (multiple selection support)
- Release filtering works alongside license and outcome filtering

#### Updated Mutations
- **`assignProductToCustomer`**: 
  - Validates release IDs
  - Stores selectedReleases in CustomerProduct
  
- **`updateCustomerProduct`**:
  - **KEY CHANGE**: Now REGENERATES the entire adoption plan instead of just marking for sync
  - Deletes existing adoption plan and all related tasks
  - Creates new adoption plan with updated filters (license, outcomes, releases)
  - All task progress is reset (by design)
  
- **`createAdoptionPlan`**:
  - Filters tasks by selectedReleases
  - Stores selectedReleases in AdoptionPlan
  
- **`syncAdoptionPlan`**:
  - Uses selectedReleases when filtering eligible tasks
  - Adds/removes tasks based on product changes (not entitlement changes)

#### Field Resolvers
- Added `selectedReleases` resolver for `CustomerProductWithPlan`
- Added `selectedReleases` resolver for `AdoptionPlan`
- Both resolve release IDs to full Release objects

### 4. Frontend - AssignProductDialog

#### New Features
- Added `GET_RELEASES_FOR_PRODUCT` GraphQL query
- Added release selection UI with checkboxes (multiple selection)
- Added `selectedReleaseIds` state management
- Added `handleReleaseToggle` function

#### UI Updates
- Release selection panel appears after outcomes selection
- Shows release name and description
- Displays count of selected releases
- Confirmation step shows selected releases as chips
- Updated alert text to mention releases

#### Data Flow
- Fetches releases for selected product
- Sends `selectedReleaseIds` array to backend mutation
- Supports empty array (all tasks included)

### 5. Frontend - EditEntitlementsDialog

#### New Features
- Added `GET_RELEASES_FOR_PRODUCT` GraphQL query
- Added `currentSelectedReleases` prop
- Added `selectedReleaseIds` state
- Added `handleToggleRelease` function
- Updated `onSave` callback to include `selectedReleaseIds`

#### UI Updates
- **Changed warning level to ERROR**
- New warning text: "Changing the license, outcomes, or releases will regenerate the entire adoption plan. All task progress will be reset. This action cannot be undone."
- Release selection checkboxes
- Change detection includes release changes

### 6. Frontend - CustomerAdoptionPanelV4

#### Updated Queries
- `GET_CUSTOMERS`: Now includes `selectedReleases { id, name }`
- `UPDATE_CUSTOMER_PRODUCT`: Now includes `selectedReleases` in response

#### Updated Dialog Integration
- Passes `currentSelectedReleases` to EditEntitlementsDialog
- `onSave` callback sends `selectedReleaseIds` to mutation
- Proper state management for releases

## Key Behavioral Changes

### Edit vs Sync - Critical Distinction

**EDIT** (via EditEntitlementsDialog):
- **Purpose**: Change customer entitlements (license, outcomes, releases)
- **Behavior**: Deletes and regenerates entire adoption plan
- **Impact**: ALL task progress is RESET
- **Use Case**: Customer changes subscription level or scope
- **Warning**: Destructive action, cannot be undone

**SYNC** (via Sync button):
- **Purpose**: Update adoption plan when PRODUCT changes
- **Behavior**: Adds new tasks, removes obsolete tasks, preserves existing tasks
- **Impact**: Only affects new/removed tasks, existing task progress preserved
- **Use Case**: Product team adds/removes tasks from product definition
- **Warning**: Non-destructive, safe operation

### License Hierarchy
- License levels: ESSENTIAL < ADVANTAGE < SIGNATURE
- Higher license includes all lower-level tasks
- Case-insensitive comparison (supports both "Essential" and "ESSENTIAL")

### Multi-Select Filters
- **Outcomes**: Multiple selection via checkboxes
- **Releases**: Multiple selection via checkboxes
- Empty selection = ALL tasks included (no filter)
- Tasks must match at least ONE selected outcome AND at least ONE selected release

### Task Filtering Logic
A task is included if ALL of these conditions are met:
1. Task license level <= Customer license level (hierarchical)
2. Task outcome matches at least one selected outcome (OR logic)
3. Task release matches at least one selected release (OR logic)

## Testing Checklist

### Assign Product
- [ ] Select product
- [ ] Select license level
- [ ] Select multiple outcomes
- [ ] Select multiple releases
- [ ] Verify confirmation shows all selections
- [ ] Create adoption plan immediately
- [ ] Verify tasks are filtered correctly

### Edit Entitlements
- [ ] Open edit dialog
- [ ] Change license level
- [ ] Change outcomes (add/remove)
- [ ] Change releases (add/remove)
- [ ] Verify warning appears
- [ ] Save changes
- [ ] Verify adoption plan is regenerated
- [ ] Verify all task progress is reset
- [ ] Verify new tasks match new filters

### Sync Adoption Plan
- [ ] Modify product tasks in backend
- [ ] Click Sync button
- [ ] Verify only new/removed tasks are affected
- [ ] Verify existing task progress is preserved
- [ ] Verify sync respects current license/outcomes/releases

### Edge Cases
- [ ] No outcomes selected (all tasks)
- [ ] No releases selected (all tasks)
- [ ] License upgrade (more tasks appear)
- [ ] License downgrade (tasks removed)
- [ ] Product with no releases defined
- [ ] Product with no outcomes defined

## Migration Notes

### For Existing Data
- Existing CustomerProducts will have `selectedReleases: null`
- Existing AdoptionPlans will have `selectedReleases: null`
- Backend treats `null` or `[]` as "no filter" (include all)
- No data migration needed

### API Compatibility
- `selectedReleaseIds` is REQUIRED in `AssignProductToCustomerInput`
- `selectedReleaseIds` is OPTIONAL in `UpdateCustomerProductInput`
- Empty array is valid and means "no release filter"

## Performance Considerations
- Edit operation is now more expensive (delete + recreate)
- Trade-off: Correctness over performance
- Regeneration ensures adoption plan is always consistent with entitlements
- Sync operation remains efficient (incremental updates)

## Future Enhancements
1. Add confirmation dialog for edit with progress preview
2. Add ability to preserve task notes/status when regenerating
3. Add audit log for adoption plan regenerations
4. Add analytics for which filters are most commonly used
5. Consider caching release/outcome data to reduce queries

## Documentation Updates Needed
- [ ] User guide: Explain edit vs sync
- [ ] Admin guide: How to configure releases
- [ ] API docs: Update mutation signatures
- [ ] Release notes: Breaking change notice
