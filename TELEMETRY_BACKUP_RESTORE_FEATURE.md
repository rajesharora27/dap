# Telemetry Attributes: Full Backup & Restore Feature

## Overview
Complete implementation of telemetry attributes export and import functionality, enabling full product backup and disaster recovery capabilities.

## Feature Summary
✅ **Complete Export**: All telemetry attribute configuration exported to dedicated Excel sheet  
✅ **Complete Import**: Full restore capability with create and update operations  
✅ **Product Recovery**: Deleted products can be fully recreated from Excel backup  
✅ **Bulk Editing**: Modify telemetry attributes in Excel and bulk import changes

## What Changed

### 1. Export Enhancement

#### New: Telemetry Attributes Sheet
A dedicated worksheet with complete telemetry configuration:

**Columns:**
- Task Name (links to parent task)
- Attribute Name
- Description
- Data Type (string, number, boolean, etc.)
- Is Required (Yes/No)
- Success Criteria (full text)
- Order (display sequence)
- Is Active (Yes/No)

**Example:**
| Task Name | Attribute Name | Description | Data Type | Is Required | Success Criteria | Order | Is Active |
|-----------|---------------|-------------|-----------|-------------|------------------|-------|-----------|
| User Login | Response Time | API response time | number | Yes | <500ms | 1 | Yes |
| User Login | Success Rate | Login success rate | number | Yes | >95% | 2 | Yes |
| Data Sync | CPU Usage | CPU utilization | number | No | <80% | 1 | Yes |

#### Enhanced: Tasks Sheet
Added summary column showing telemetry attributes overview:
```
Response Time (number, required) | Success: <500ms; Success Rate (number, required) | Success: >95%
```

### 2. Import Enhancement

#### Telemetry Attributes Import Logic
- ✅ Reads "Telemetry Attributes" sheet from Excel
- ✅ Matches tasks by Task Name
- ✅ Creates new telemetry attributes if they don't exist
- ✅ Updates existing attributes if values changed
- ✅ Validates all referenced tasks exist
- ✅ Reports errors for missing tasks
- ✅ Shows created/updated/error counts

#### Matching Logic
**Task Matching:** By Task Name (case-insensitive)  
**Attribute Matching:** By Task Name + Attribute Name (case-insensitive)

**Create:** New attribute if Task Name + Attribute Name combination doesn't exist  
**Update:** Existing attribute if any field (description, dataType, isRequired, successCriteria, order, isActive) changed  
**Skip:** If attribute exists and nothing changed

### 3. GraphQL Integration

Uses existing mutations:
- `CREATE_TELEMETRY_ATTRIBUTE`: Creates new attributes
- `UPDATE_TELEMETRY_ATTRIBUTE`: Updates existing attributes

Both mutations support all fields:
- taskId, name, description, dataType
- isRequired, successCriteria, order, isActive

## Use Cases

### 1. Full Product Backup
**Scenario:** Before making major product changes  
**Action:** Export product to Excel (includes all telemetry)  
**Benefit:** Complete restoration point if changes need to be rolled back

### 2. Product Migration
**Scenario:** Moving product configuration between environments (dev → staging → prod)  
**Action:** Export from source, import to target  
**Benefit:** Consistent telemetry configuration across environments

### 3. Disaster Recovery
**Scenario:** Product accidentally deleted  
**Action:** Import from last Excel backup  
**Benefit:** Complete product restoration including all telemetry attributes

### 4. Template Creation
**Scenario:** Creating standardized product templates  
**Action:** Configure telemetry in one product, export, reuse as template  
**Benefit:** Consistent telemetry setup for similar products

### 5. Bulk Editing
**Scenario:** Need to update success criteria for multiple attributes  
**Action:** Export, modify in Excel, import  
**Benefit:** Faster than updating each attribute individually in UI

## Field Coverage

### Exported & Imported ✅
- Task Name (reference)
- Attribute Name
- Description
- Data Type
- Is Required
- Success Criteria
- Order
- Is Active

### Not Included (Runtime Data) ❌
- Attribute IDs (auto-generated)
- Current Values (runtime data)
- Is Successful (runtime status)
- Timestamps (metadata)

## How to Use

### Export
1. Select product in left sidebar
2. Click "Export Complete" button
3. Excel file downloads with 7 sheets:
   - Simple Attributes
   - Outcomes
   - Licenses
   - Releases
   - Tasks
   - Custom Attributes
   - **Telemetry Attributes** 🆕

### Import
1. Select product in left sidebar (or will create new)
2. Click "Import from Excel" button
3. Select Excel file
4. Import processes all sheets including Telemetry Attributes
5. Review results: Created/Updated/Errors

### Modifying Telemetry Attributes in Excel

#### To Update Existing Attribute:
1. Keep Task Name and Attribute Name unchanged
2. Modify other fields (description, success criteria, etc.)
3. Import → Will update the existing attribute

#### To Create New Attribute:
1. Add new row with Task Name (must match existing task)
2. Fill in all fields
3. Import → Will create new attribute

#### To Soft-Delete Attribute:
1. Set "Is Active" to "No"
2. Import → Attribute becomes inactive (not deleted)

## Technical Details

### Files Modified
- **frontend/src/pages/App.tsx**

### Export Code (Lines ~3161-3198)
```typescript
// Add Telemetry Attributes sheet
const telemetrySheet = workbook.addWorksheet('Telemetry Attributes');
telemetrySheet.columns = [
  { header: 'Task Name', key: 'taskName', width: 30 },
  { header: 'Attribute Name', key: 'attributeName', width: 30 },
  // ... other columns
];
```

### Import Code (Lines ~4141-4239)
```typescript
// Process Telemetry Attributes sheet
const telemetrySheet = workbook.getWorksheet('Telemetry Attributes');
if (telemetrySheet) {
  // Build task and attribute maps
  const tasksByName = new Map(...);
  const existingTelemetryMap = new Map(...);
  
  // Process each row
  telemetrySheet.eachRow((row, rowNumber) => {
    // Parse and validate
    // Create or update using GraphQL mutations
  });
}
```

### GraphQL Mutations (Lines 347-385)
```graphql
mutation CreateTelemetryAttribute($input: TelemetryAttributeInput!) {
  createTelemetryAttribute(input: $input) {
    id, taskId, name, description, dataType,
    isRequired, successCriteria, order, isActive
  }
}

mutation UpdateTelemetryAttribute($id: ID!, $input: TelemetryAttributeUpdateInput!) {
  updateTelemetryAttribute(id: $id, input: $input) {
    id, taskId, name, description, dataType,
    isRequired, successCriteria, order, isActive
  }
}
```

## Validation & Error Handling

### Import Validation
- ✅ Task Name must reference existing task
- ✅ Attribute Name required
- ✅ Data Type defaults to 'string' if empty
- ✅ Is Required/Is Active parse Yes/No, true/false
- ✅ Is Active defaults to true if empty

### Error Reporting
Import shows detailed results:
```
Excel import completed!

Created: 5
Updated: 3
Errors: 1

Issues detected:
- Telemetry Attributes tab (row 12): Task "Invalid Task" not found. 
  Ensure the Task Name matches an existing task from the Tasks tab.
```

## Testing Scenarios

### Scenario 1: Full Product Backup & Restore
1. ✅ Export product with telemetry attributes
2. ✅ Delete product from database
3. ✅ Import Excel file
4. ✅ Verify all tasks and telemetry attributes recreated

### Scenario 2: Bulk Update Success Criteria
1. ✅ Export product
2. ✅ Modify Success Criteria column for multiple attributes
3. ✅ Import
4. ✅ Verify attributes updated, counts shown correctly

### Scenario 3: Add New Attributes
1. ✅ Export product
2. ✅ Add new rows with new Attribute Names
3. ✅ Import
4. ✅ Verify new attributes created for correct tasks

### Scenario 4: Deactivate Attributes
1. ✅ Export product
2. ✅ Change Is Active to "No" for some attributes
3. ✅ Import
4. ✅ Verify attributes marked inactive

### Scenario 5: Error Handling
1. ✅ Export product
2. ✅ Add row with invalid Task Name
3. ✅ Import
4. ✅ Verify error reported, other attributes still processed

## Benefits

1. **Data Safety**: Complete backup before risky operations
2. **Disaster Recovery**: Quick restoration of deleted products
3. **Efficiency**: Bulk edit telemetry configurations in Excel
4. **Consistency**: Easy replication of telemetry setup across products
5. **Transparency**: Clear audit trail of what was created/updated
6. **Flexibility**: Import can create and update in single operation

## Documentation Updated
- ✅ IMPORT_EXPORT_FIELD_COVERAGE.md - Complete rewrite with full telemetry coverage
- ✅ Alert messages updated to include "Telemetry Attributes"
- ✅ This feature documentation created

## Success Metrics
- ✅ Zero TypeScript compilation errors
- ✅ All GraphQL mutations properly integrated
- ✅ Export includes all configuration fields
- ✅ Import creates and updates attributes correctly
- ✅ Error handling and validation complete
- ✅ Documentation comprehensive

## Future Enhancements (Optional)
- [ ] Export telemetry attribute runtime data (current values, timestamps) to separate sheet
- [ ] Import validation preview before applying changes
- [ ] Telemetry attribute deletion via import (currently only soft-delete via Is Active)
- [ ] Conflict resolution UI for competing changes
- [ ] Version tracking for imported configurations

## Status
✅ **COMPLETE** - Feature fully implemented, tested, and documented
