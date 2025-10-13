# Telemetry Success Criteria Import Fix

## Issue
Telemetry attributes were being imported from Excel, but the success criteria field was not being properly imported. The success criteria would be lost during the import process.

## Root Cause
The success criteria is stored in the database as a JSON string (e.g., `{"type":"number_threshold","operator":"greater_than","threshold":80}`), and the backend GraphQL mutation expects it as a JSON string that it then parses.

However, the import logic was:
1. Reading the success criteria from Excel as a plain string
2. Passing it directly to the backend without validation
3. Not ensuring it was valid JSON

## Solution

### Export Enhancement (Lines ~3175-3199)
```typescript
// Export successCriteria as JSON string for reliable import
let successCriteriaStr = '';
if (attr.successCriteria) {
  // If it's already a string (from DB), use it
  if (typeof attr.successCriteria === 'string') {
    successCriteriaStr = attr.successCriteria;
  } else {
    // If it's an object, stringify it
    successCriteriaStr = JSON.stringify(attr.successCriteria);
  }
}
```

**What it does:**
- Ensures success criteria is exported as a valid JSON string
- Handles both string and object formats from the database
- Empty criteria exports as empty string

### Import Enhancement (Lines ~4208-4226)
```typescript
// Process successCriteria - it should be a JSON string for the backend
let successCriteriaForBackend = '';
if (telemetryRow.successCriteria) {
  const criteriaStr = telemetryRow.successCriteria.trim();
  if (criteriaStr) {
    // Check if it's already valid JSON
    try {
      JSON.parse(criteriaStr);
      // It's valid JSON, use as-is
      successCriteriaForBackend = criteriaStr;
    } catch {
      // Not valid JSON - might be empty or malformed, use empty string
      successCriteriaForBackend = '';
    }
  }
}
```

**What it does:**
- Validates that success criteria from Excel is valid JSON
- Only imports if it's valid JSON (to prevent backend errors)
- Silently skips malformed criteria (sets to empty string)
- Preserves valid JSON criteria exactly as exported

## Data Flow

### Export Flow
1. **Database** → Query returns `successCriteria` as string (JSON)
2. **Frontend** → Ensures it's a string, stringifies if object
3. **Excel** → Stores as text in "Success Criteria" column
4. **Example:** `{"type":"number_threshold","operator":"greater_than","threshold":80}`

### Import Flow
1. **Excel** → Read "Success Criteria" column as string
2. **Validation** → Verify it's valid JSON
3. **Frontend** → Pass validated JSON string to mutation
4. **Backend** → Parse JSON string to object
5. **Database** → Store as JSONB

## Excel Format

### Success Criteria Column Examples

**Valid (Will Import):**
```
{"type":"number_threshold","operator":"greater_than","threshold":80}
{"type":"string_match","mode":"exact","pattern":"SUCCESS"}
{"type":"boolean_flag","expectedValue":true}
{"type":"string_not_null","description":"Value must not be null"}
{"type":"timestamp_comparison","mode":"within_days","withinDays":7}
```

**Invalid (Will Skip):**
```
<80%                          (Not JSON)
Greater than 80               (Not JSON)
{"type":"incomplete           (Malformed JSON)
[Empty]                       (Empty, will import as empty)
```

## Use Cases

### Use Case 1: Full Backup & Restore
**Scenario:** Export product, delete it, restore from Excel
**Result:** ✅ All telemetry attributes restored WITH success criteria

### Use Case 2: Product Migration
**Scenario:** Export from dev, import to production
**Result:** ✅ Telemetry success criteria properly copied

### Use Case 3: Bulk Edit in Excel
**Scenario:** Export, modify criteria JSON in Excel, re-import
**Result:** ✅ Updated criteria applied if valid JSON

### Use Case 4: Manual Excel Creation
**Scenario:** Create new telemetry rows in Excel with criteria
**Result:** ✅ Success criteria imported if valid JSON format

## Important Notes

### ⚠️ Manual Editing in Excel

If you need to manually edit success criteria in Excel:

1. **Keep JSON Format:** Success criteria must be valid JSON
2. **Use Quotes:** All keys and string values need double quotes
3. **No Trailing Commas:** JSON doesn't allow trailing commas
4. **Validate:** Use a JSON validator before importing

### ✅ Recommended Approach

**Best Practice:** Don't manually edit success criteria in Excel. Instead:
1. Configure criteria using the UI
2. Export to backup
3. Import to restore

**Why?** The UI ensures criteria are properly formatted as valid JSON.

### 📝 Success Criteria Types Reference

#### Number Threshold
```json
{
  "type": "number_threshold",
  "operator": "greater_than",
  "threshold": 80,
  "description": "Value must be greater than 80"
}
```

#### String Match
```json
{
  "type": "string_match",
  "mode": "exact",
  "pattern": "SUCCESS",
  "caseSensitive": false,
  "description": "Value must exactly match 'SUCCESS'"
}
```

#### String Not Null
```json
{
  "type": "string_not_null",
  "description": "Value must not be null/empty"
}
```

#### Boolean Flag
```json
{
  "type": "boolean_flag",
  "expectedValue": true,
  "description": "Value must be true"
}
```

#### Timestamp Comparison
```json
{
  "type": "timestamp_comparison",
  "mode": "within_days",
  "referenceTime": "now",
  "withinDays": 7,
  "description": "Timestamp must be within 7 days of now"
}
```

#### Timestamp Not Null
```json
{
  "type": "timestamp_not_null",
  "description": "Timestamp must not be null"
}
```

## Testing

### Test Scenario 1: Export and Re-import
1. ✅ Create task with telemetry attribute with success criteria
2. ✅ Export to Excel
3. ✅ Delete telemetry attribute
4. ✅ Import from Excel
5. ✅ Verify success criteria restored correctly

### Test Scenario 2: Invalid JSON in Excel
1. ✅ Export to Excel
2. ✅ Manually change success criteria to invalid JSON
3. ✅ Import
4. ✅ Verify attribute created but criteria is empty (not error)

### Test Scenario 3: Multiple Criteria Types
1. ✅ Create attributes with different criteria types
2. ✅ Export
3. ✅ Import to different product
4. ✅ Verify all criteria types import correctly

## Error Handling

**Invalid JSON:** Silently skipped, attribute created with empty criteria
**Missing Column:** Attribute created with empty criteria
**Empty String:** Attribute created with empty criteria
**Valid JSON:** Criteria imported successfully

**No Errors Thrown:** Import continues even if criteria is invalid, ensuring other attributes still import.

## Files Modified

1. **frontend/src/pages/App.tsx**
   - Lines ~3175-3199: Enhanced export to ensure JSON string format
   - Lines ~4208-4226: Added JSON validation on import

## Benefits

1. ✅ **Complete Backup:** Success criteria now included in backups
2. ✅ **Disaster Recovery:** Can fully restore deleted products
3. ✅ **Migration:** Success criteria properly copies between environments
4. ✅ **Validation:** Invalid JSON silently handled without breaking import
5. ✅ **Backward Compatible:** Works with existing exports

## Status
✅ **COMPLETE** - Success criteria now properly imports from Excel
- ✅ Export ensures valid JSON format
- ✅ Import validates JSON before applying
- ✅ Error handling prevents import failures
- ✅ All success criteria types supported
- ✅ Zero TypeScript errors
