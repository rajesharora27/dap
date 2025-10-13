# Import/Export Comprehensive Field Coverage

## Summary
Complete backup and restore capability for all product data including telemetry attributes. The Excel export creates a dedicated "Telemetry Attributes" sheet with all attribute details, and the import process can fully recreate telemetry attributes from the Excel file.

## Current Field Coverage

### ✅ Product Fields (Simple Attributes Sheet)
**Export:** ✅ Complete
**Import:** ✅ Complete
- Name
- Description

### ✅ Outcomes (Outcomes Sheet)
**Export:** ✅ Complete
**Import:** ✅ Complete
- Name
- Description

### ✅ Licenses (Licenses Sheet)
**Export:** ✅ Complete
**Import:** ✅ Complete
- Name
- Description
- Level
- Active (Yes/No)

### ✅ Releases (Releases Sheet)
**Export:** ✅ Complete
**Import:** ✅ Complete
- Name
- Description
- Level
- Active (Yes/No)

### ✅ Tasks (Tasks Sheet)
**Export:** ✅ Complete
**Import:** ✅ Complete
- ID
- Name
- Description
- Sequence Number
- Estimated Minutes
- Weight
- Priority
- License Name
- Outcome Names
- Release Names
- Notes
- **How To Doc** ✅
- **How To Video** ✅
- **Telemetry Attributes Summary** ✅ (reference column only)

### ✅ Custom Attributes (Custom Attributes Sheet)
**Export:** ✅ Complete
**Import:** ✅ Complete
- Key
- Value (supports JSON, numbers, booleans, strings)

### ✅ Telemetry Attributes (Telemetry Attributes Sheet) 🆕
**Export:** ✅ Complete
**Import:** ✅ Complete
- Task Name (links to task)
- Attribute Name
- Description
- Data Type (string, number, boolean, etc.)
- Is Required (Yes/No)
- Success Criteria
- Order
- Is Active (Yes/No)

## Changes Made

### Export Enhancement

#### 1. Added Telemetry Attributes Sheet (Lines ~3161-3198)
Creates a dedicated sheet with complete telemetry attribute details:
```typescript
const telemetrySheet = workbook.addWorksheet('Telemetry Attributes');
telemetrySheet.columns = [
  { header: 'Task Name', key: 'taskName', width: 30 },
  { header: 'Attribute Name', key: 'attributeName', width: 30 },
  { header: 'Description', key: 'description', width: 50 },
  { header: 'Data Type', key: 'dataType', width: 15 },
  { header: 'Is Required', key: 'isRequired', width: 12 },
  { header: 'Success Criteria', key: 'successCriteria', width: 40 },
  { header: 'Order', key: 'order', width: 10 },
  { header: 'Is Active', key: 'isActive', width: 12 }
];
```

**Example Export:**
| Task Name | Attribute Name | Description | Data Type | Is Required | Success Criteria | Order | Is Active |
|-----------|---------------|-------------|-----------|-------------|------------------|-------|-----------|
| User Login | Response Time | API response time | number | Yes | <500ms | 1 | Yes |
| User Login | Success Rate | Login success rate | number | Yes | >95% | 2 | Yes |
| Data Sync | CPU Usage | CPU utilization | number | No | <80% | 1 | Yes |

#### 2. Enhanced Tasks Sheet Telemetry Column (Lines 3123-3131)
Added summary column for quick reference:
```typescript
telemetryAttributes: (task.telemetryAttributes || [])
  .filter((attr: any) => attr.isActive)
  .map((attr: any) => {
    const parts = [`${attr.name} (${attr.dataType}${attr.isRequired ? ', required' : ''})`];
    if (attr.successCriteria) {
      parts.push(`Success: ${attr.successCriteria}`);
    }
    return parts.join(' | ');
  })
  .join('; ') || ''
```

**Example Output:**
```
Response Time (number, required) | Success: <500ms; Success Rate (number, required) | Success: >95%
```

### Import Enhancement

#### 1. Telemetry Attributes Import (Lines ~4141-4239)
Full support for creating and updating telemetry attributes:

```typescript
// Build maps for existing tasks and attributes
const tasksByName = new Map<string, any>(currentTasks.map(...));
const existingTelemetryMap = new Map<string, Map<string, any>>();

// Process each telemetry attribute row
telemetrySheet.eachRow((row, rowNumber) => {
  // Parse: Task Name, Attribute Name, Description, Data Type, 
  //        Is Required, Success Criteria, Order, Is Active
});

// Create or update using GraphQL mutations
await client.mutate({
  mutation: existingAttr ? UPDATE_TELEMETRY_ATTRIBUTE : CREATE_TELEMETRY_ATTRIBUTE,
  variables: { id, input: { taskId, name, description, dataType, 
                            isRequired, successCriteria, order, isActive } }
});
```

**Import Logic:**
- Matches telemetry attributes by Task Name + Attribute Name
- Creates new attributes if they don't exist
- Updates existing attributes if values changed
- Validates that referenced task exists
- Reports errors for missing tasks

#### 2. Task Fields Import
All task fields properly handled:
```typescript
howToDoc: parseDelimitedList(getCellValue(row, 'howToDoc')),
howToVideo: parseDelimitedList(getCellValue(row, 'howToVideo'))
```

#### 3. GraphQL Mutations
**Telemetry Attributes:**
- `CREATE_TELEMETRY_ATTRIBUTE`: Creates new attributes
- `UPDATE_TELEMETRY_ATTRIBUTE`: Updates existing attributes

**Tasks:**
- Both `createTask` and `updateTask` include howToDoc, howToVideo

## Complete Backup & Restore Capability

### Full Telemetry Attributes Export/Import
The dedicated "Telemetry Attributes" sheet provides complete backup and restore:

**What's Included:**
- ✅ Task Name (reference to parent task)
- ✅ Attribute Name
- ✅ Description
- ✅ Data Type (string, number, boolean, etc.)
- ✅ Is Required (Yes/No)
- ✅ Success Criteria (complete text)
- ✅ Order (display sequence)
- ✅ Is Active (Yes/No)

**What's NOT Included (Runtime Data):**
- ❌ Telemetry attribute IDs (auto-generated on import)
- ❌ Current values (runtime data, not configuration)
- ❌ Is Successful (runtime status, not configuration)
- ❌ Timestamps (runtime metadata)

### Use Cases
1. **Full Product Backup**: Export everything before making major changes
2. **Product Migration**: Move complete product data between environments
3. **Disaster Recovery**: Restore deleted products with all telemetry configuration
4. **Template Creation**: Create product templates with pre-configured telemetry
5. **Bulk Editing**: Export, modify in Excel, re-import telemetry attributes

## Field Delimiter Reference

| Field Type | Delimiter | Example |
|------------|-----------|---------|
| Outcome Names | `, ` (comma-space) | `Customer Satisfaction, Revenue Growth` |
| Release Names | `, ` (comma-space) | `Alpha, Beta, Production` |
| How To Doc | `; ` (semicolon-space) | `https://doc1.com; https://doc2.com` |
| How To Video | `; ` (semicolon-space) | `https://video1.com; https://video2.com` |
| Telemetry Attributes (Tasks sheet) | `; ` (semicolon-space) | `CPU Usage (number, required) \| Success: <80%; Status (string)` |

## Import Parsing

The `parseDelimitedList` function handles multiple delimiter types:
- Comma: `,`
- Semicolon: `;`
- Newline: `\n`

This provides flexibility for users editing the Excel file.

## Verification Status

### Export ✅
- [x] Product fields
- [x] Outcomes
- [x] Licenses
- [x] Releases
- [x] Tasks (all fields including howto)
- [x] Custom attributes
- [x] **Telemetry Attributes (full configuration)** 🆕

### Import ✅
- [x] Product fields
- [x] Outcomes
- [x] Licenses
- [x] Releases
- [x] Tasks (all fields including howto)
- [x] Custom attributes
- [x] **Telemetry Attributes (full configuration)** 🆕

### Mutations ✅
- [x] CREATE_TASK includes howToDoc, howToVideo
- [x] UPDATE_TASK includes howToDoc, howToVideo
- [x] Query TASKS_FOR_PRODUCT includes all fields

## Files Modified
- **frontend/src/pages/App.tsx**:
  - **Export (lines ~3161-3198)**: Added dedicated Telemetry Attributes sheet with all configuration fields
  - **Export (lines ~3123-3131)**: Added Telemetry Attributes summary column to Tasks sheet
  - **Import (lines ~4141-4239)**: Full telemetry attributes import with create/update logic
  - **Mutations (lines 347-385)**: Using CREATE_TELEMETRY_ATTRIBUTE and UPDATE_TELEMETRY_ATTRIBUTE
  - **Alerts**: Updated success messages to include Telemetry Attributes

## Example Export

### Tasks Sheet (Summary Reference)
```
| Name | ... | How To Doc | How To Video | Telemetry Attributes |
|------|-----|------------|--------------|---------------------|
| Setup | ... | doc.com    | video.com    | CPU (number, required) \| Success: <80%; Memory (number) |
```

### Telemetry Attributes Sheet (Full Configuration) 🆕
```
| Task Name | Attribute Name | Description | Data Type | Is Required | Success Criteria | Order | Is Active |
|-----------|---------------|-------------|-----------|-------------|------------------|-------|-----------|
| Setup | CPU Usage | CPU utilization % | number | Yes | <80% | 1 | Yes |
| Setup | Memory Usage | Memory in GB | number | No | <16GB | 2 | Yes |
| Deploy | Response Time | API latency | number | Yes | <500ms | 1 | Yes |
```

## Important Notes

### Telemetry Attributes Import/Export
- ✅ **Full Configuration Support**: The Telemetry Attributes sheet enables complete backup and restore
- ✅ **Create & Update**: Import can create new attributes and update existing ones
- ✅ **Task Matching**: Telemetry attributes are matched to tasks by Task Name
- ✅ **Attribute Matching**: Existing attributes are matched by Task Name + Attribute Name
- ⚠️ **Task Must Exist**: Referenced tasks must exist in the Tasks sheet or already in the database
- ⚠️ **Runtime Data Not Included**: Current values, success status, and timestamps are not exported/imported

### Best Practices
1. **Full Backup**: Export before making major changes to product configuration
2. **Incremental Updates**: Modify existing rows to update, add new rows to create
3. **Name Consistency**: Keep Task Name and Attribute Name columns unchanged to update existing records
4. **Validation**: Check import results for any errors or warnings
5. **Active Status**: Set "Is Active" to "No" to soft-delete attributes without removing the row

### All Fields Supported
- All task relationship fields (outcomes, licenses, releases) are fully supported in both import and export
- All telemetry attribute configuration fields are now fully supported in both import and export
