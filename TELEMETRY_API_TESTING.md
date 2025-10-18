# Telemetry Export/Import API Testing Guide

This guide explains how to test the new telemetry export and import functionality.

## Overview

The telemetry simulation feature allows customers to:
1. **Export** a pre-filled Excel template with their adoption plan tasks and telemetry attributes
2. **Fill in** telemetry values offline in Excel
3. **Import** the completed template back into the system
4. **View** telemetry status and success criteria evaluation results

## Backend API Complete ✅

The following components are now implemented and ready for testing:

### Services
- ✅ `CustomerTelemetryExportService` - Generates Excel templates
- ✅ `CustomerTelemetryImportService` - Parses Excel and imports data

### GraphQL API
- ✅ Type definitions added to `typeDefs.ts`
- ✅ Resolvers implemented in `customerAdoption.ts`
- ✅ Mutations registered in main resolver index

### File Serving
- ✅ Static file endpoint at `/api/downloads/telemetry-exports`
- ✅ Files stored in `temp/telemetry-exports/` directory

## Testing Methods

### Method 1: Automated Test Script

Use the provided test script to verify export functionality:

```bash
# Start the backend server first
cd backend
npm run dev

# In another terminal, run the test
node test-telemetry-api.js <adoptionPlanId>
```

The script will:
- ✅ Call the export mutation
- ✅ Download the generated Excel file
- ✅ Query the current telemetry status
- ⚠️ Show instructions for manual import testing

### Method 2: GraphQL Playground

1. Start the backend server
2. Open GraphQL Playground at `http://localhost:4000/graphql`

#### Export Template Mutation

```graphql
mutation ExportTemplate {
  exportAdoptionPlanTelemetryTemplate(adoptionPlanId: "your-plan-id") {
    url
    filename
    taskCount
    attributeCount
    customerName
    productName
    assignmentName
  }
}
```

Expected response:
```json
{
  "data": {
    "exportAdoptionPlanTelemetryTemplate": {
      "url": "/api/downloads/telemetry-exports/telemetry_template_CustomerName_ProductName_1234567890.xlsx",
      "filename": "telemetry_template_CustomerName_ProductName_1234567890.xlsx",
      "taskCount": 10,
      "attributeCount": 25,
      "customerName": "Acme Corp",
      "productName": "Product X",
      "assignmentName": "License Assignment"
    }
  }
}
```

#### Download the Template

Use the URL from the response:
```
http://localhost:4000/api/downloads/telemetry-exports/telemetry_template_CustomerName_ProductName_1234567890.xlsx
```

#### Import Telemetry Mutation

```graphql
mutation ImportTelemetry($file: Upload!) {
  importAdoptionPlanTelemetry(
    adoptionPlanId: "your-plan-id"
    file: $file
  ) {
    success
    batchId
    summary {
      tasksProcessed
      attributesUpdated
      criteriaEvaluated
      errors
    }
    taskResults {
      taskId
      taskName
      attributesUpdated
      criteriaMet
      criteriaTotal
      completionPercentage
      errors
    }
  }
}
```

**Note**: File upload requires multipart form data. Use the GraphQL Playground's file upload feature or test via frontend.

### Method 3: Frontend Integration (Pending)

Once the frontend is implemented, testing will be more straightforward:

1. Navigate to Customer Adoption Panel
2. Open an adoption plan
3. Click "Telemetry" tab
4. Click "Export Template"
5. Open downloaded Excel file
6. Fill in telemetry values
7. Click "Import Telemetry"
8. Upload the filled template
9. View results and success criteria evaluation

## Excel Template Structure

The exported Excel file contains two sheets:

### 1. Instructions Sheet
- Comprehensive usage guide
- Data type explanations
- Success criteria reference
- Example values

### 2. Telemetry_Data Sheet

Columns:
- **Task Name** (grey, readonly) - The task this telemetry belongs to
- **Attribute Name** (grey, readonly) - The telemetry attribute name
- **Data Type** (grey, readonly) - BOOLEAN, NUMBER, PERCENTAGE, STRING, or DATE
- **Success Criteria** (grey, readonly) - The criteria for success
- **Date** (yellow, editable) - When the telemetry was recorded
- **Value** (yellow, editable) - The telemetry value
- **Source** (yellow, editable) - Where the data came from
- **Notes** (yellow, editable) - Additional context

**Color coding**:
- 🟨 Yellow = Editable fields
- ⬜ Grey = Read-only reference fields

## Expected Workflow

1. **Setup Phase**
   - Create a customer with adoption plan
   - Assign product with telemetry attributes
   - Define success criteria for attributes

2. **Export Phase**
   - Call export mutation with adoption plan ID
   - Download Excel template from URL
   - Template pre-filled with task/attribute info

3. **Data Entry Phase** (Manual)
   - Open Excel template
   - Fill in Date, Value, Source, Notes columns
   - Save the file

4. **Import Phase**
   - Call import mutation with file upload
   - Backend parses Excel
   - Creates CustomerTelemetryValue records
   - Evaluates success criteria
   - Returns detailed results

5. **Verification Phase**
   - Query adoption plan telemetry
   - Check task completion percentages
   - Review which criteria are met
   - View telemetry indicators in UI

## Data Type Validation

The import service validates values based on data type:

- **BOOLEAN**: Accepts "true", "yes", "1", "false", "no", "0" (case-insensitive)
- **NUMBER**: Must be a valid number (integers or decimals)
- **PERCENTAGE**: Must be a number between 0 and 100
- **STRING**: Any text value
- **DATE**: ISO format (YYYY-MM-DD) or Excel date serial number

## Success Criteria Evaluation

After import, the system automatically evaluates success criteria:

- Parses criteria operators: `>`, `>=`, `=`, `<=`, `<`, `contains`, `startsWith`, etc.
- Compares telemetry value against criteria
- Updates `isMet` flag on CustomerTelemetryAttribute
- Returns evaluation results in import response

## Error Handling

The import service provides detailed error reporting:

```json
{
  "success": false,
  "summary": {
    "tasksProcessed": 10,
    "attributesUpdated": 23,
    "criteriaEvaluated": 23,
    "errors": ["Row 5: Task 'Setup Database' not found", "Row 12: Invalid value 'abc' for NUMBER attribute"]
  },
  "taskResults": [...]
}
```

## Debugging Tips

### Export Issues
- Check adoption plan exists and has customer tasks
- Verify tasks have telemetry attributes
- Check server logs for service errors
- Verify temp directory exists and is writable

### Import Issues
- Ensure Excel file matches expected structure
- Check column headers match exactly
- Validate data types match attribute definitions
- Review task and attribute names (case-sensitive)
- Check for special characters in values

### File Download Issues
- Verify server is serving static files
- Check temp/telemetry-exports directory exists
- Ensure URL path is correct
- Check file permissions

## Next Steps

1. ✅ Backend API complete
2. ⏳ Frontend implementation
   - Add Telemetry tab to CustomerAdoptionPanelV4
   - Create ImportTelemetryDialog component
   - Add export/import buttons
   - Display telemetry status indicators
3. ⏳ End-to-end testing
4. ⏳ User documentation
5. ⏳ Production deployment

## Related Documentation

- `TELEMETRY_STRATEGY.md` - Overall 3-phase telemetry strategy
- `TELEMETRY_SIMULATION_PLAN.md` - Excel simulation implementation plan
- `backend/src/services/telemetry/CustomerTelemetryExportService.ts` - Export service implementation
- `backend/src/services/telemetry/CustomerTelemetryImportService.ts` - Import service implementation
