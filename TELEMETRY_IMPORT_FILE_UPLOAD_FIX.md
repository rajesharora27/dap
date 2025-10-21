# Telemetry Import Fix - File Upload Working

## Problem
Telemetry import from Excel file was not working:
- No progress shown
- No success/error messages
- Values not being imported
- Task status not updated

## Root Cause
The frontend was trying to use a GraphQL mutation with file upload (`IMPORT_TELEMETRY` mutation), but:
1. Apollo Server v5 doesn't have built-in support for `graphql-upload` like v3 did
2. The `graphql-upload` package v16+ is ESM-only, causing compatibility issues with ts-node-dev
3. Apollo Client wasn't configured with upload middleware
4. The GraphQL file upload was never actually working

## Solution
**Switch from GraphQL mutation to REST API endpoint for file uploads**

The backend already had a working REST endpoint at `/api/telemetry/import/:adoptionPlanId` that was set up correctly with multer for file uploads. This is a simpler and more reliable approach for file uploads.

### Changes Made

#### 1. Backend - Enhanced REST Endpoint
**File**: `/data/dap/backend/src/server.ts`

Added task status evaluation after import (same as GraphQL mutation):

```typescript
// Import the telemetry values
const result = await CustomerTelemetryImportService.importTelemetryValues(adoptionPlanId, file.buffer);

// Evaluate all task statuses immediately after import (same as GraphQL mutation)
const { CustomerAdoptionMutationResolvers } = await import('./schema/resolvers/customerAdoption');
await CustomerAdoptionMutationResolvers.evaluateAllTasksTelemetry(
  {}, 
  { adoptionPlanId }, 
  { user: { id: 'system', role: 'ADMIN' } }
);

res.json(result);
```

**Why**: This ensures task status is automatically evaluated and updated after import, matching the behavior intended for the GraphQL mutation.

#### 2. Frontend - Use REST API for Upload
**File**: `/data/dap/frontend/src/components/CustomerAdoptionPanelV4.tsx`

Changed `handleImportTelemetry` to use REST API with FormData:

```typescript
const handleImportTelemetry = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !adoptionPlanId) {
    if (!adoptionPlanId) setError('No adoption plan found');
    return;
  }
  
  try {
    // Use REST API for file upload (simpler than GraphQL file uploads)
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`http://localhost:4000/api/telemetry/import/${adoptionPlanId}`, {
      method: 'POST',
      headers: {
        'Authorization': 'admin',
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Handle success/error and display detailed feedback
    // ... (same detailed message formatting as before)
  } catch (err: any) {
    console.error('Import error:', err);
    setError(`❌ Failed to import telemetry: ${err.message}`);
  }
  
  // Reset the input so the same file can be re-uploaded
  event.target.value = '';
};
```

**Why**: 
- REST API with multipart/form-data is the standard way to upload files
- No need for special Apollo Client configuration or middleware
- Works immediately without complex setup
- More reliable and easier to debug

## What Now Works

✅ **File Upload**: Excel files are successfully uploaded to the server

✅ **Import Processing**: Telemetry values are imported and stored in database

✅ **Progress Tracking**: Accurate counts shown (from previous fix with Promise.all)

✅ **Success Messages**: Detailed feedback with:
- Tasks processed
- Attributes updated
- Criteria evaluated/met
- Per-task completion percentages
- Any warnings or errors

✅ **Task Status Updates**: Automatically evaluated and updated after import based on telemetry criteria

✅ **Error Handling**: Clear error messages if import fails

## Testing

### Test the Import
1. Go to Customer Adoption Panel
2. Select a customer with an adoption plan
3. Click "Export Template" to get the Excel file
4. Fill in telemetry values in the Excel file
5. Click "Import Data" and select the file
6. Should see success message with detailed statistics
7. Task statuses should update automatically

### Expected Behavior
- Upload happens immediately
- Success message shows within seconds
- All counts (tasks, attributes, criteria) should be > 0
- Task status changes based on criteria met
- If string_not_null criteria: non-empty strings should meet criteria

### Debug Tips
If import still fails:
1. Check browser console for errors
2. Check backend logs: `tail -f /data/dap/backend.log`
3. Look for console.log output showing evaluation details
4. Verify REST endpoint is accessible: `curl http://localhost:4000/health`

## API Endpoint Details

**POST** `/api/telemetry/import/:adoptionPlanId`

**Headers**:
- `Authorization: admin`

**Body**: 
- multipart/form-data
- field name: `file`
- file type: .xlsx (Excel file)

**Response**:
```json
{
  "success": true,
  "batchId": "uuid",
  "summary": {
    "tasksProcessed": 3,
    "attributesUpdated": 5,
    "criteriaEvaluated": 5,
    "errors": []
  },
  "taskResults": [
    {
      "taskId": "...",
      "taskName": "Setup Environment",
      "attributesUpdated": 2,
      "criteriaMet": 2,
      "criteriaTotal": 2,
      "completionPercentage": 100,
      "errors": []
    }
  ]
}
```

## Alternative: Fix GraphQL Upload (Future)

If you want to use GraphQL mutation for file uploads in the future, you would need to:

1. **Install dependencies**:
   ```bash
   npm install apollo-upload-client
   ```

2. **Update Apollo Client** (`ApolloClientProvider.tsx`):
   ```typescript
   import { createUploadLink } from 'apollo-upload-client';
   
   const uploadLink = createUploadLink({
     uri: httpUrl,
     headers: {
       authorization: 'admin'
     }
   });
   
   const client = new ApolloClient({
     link: uploadLink,
     cache: new InMemoryCache()
   });
   ```

3. **Configure Apollo Server** for file uploads (complex with v5)

However, **REST API is recommended** for file uploads as it's simpler and more standard.

## Related Files

### Modified:
- `/data/dap/backend/src/server.ts` - Added task evaluation to REST endpoint
- `/data/dap/frontend/src/components/CustomerAdoptionPanelV4.tsx` - Changed to use REST API

### Related (from previous fixes):
- `/data/dap/backend/src/services/telemetry/CustomerTelemetryImportService.ts` - Fixed async/await
- `/data/dap/backend/src/services/telemetry/evaluationEngine.ts` - Fixed string_not_null
- `/data/dap/backend/src/schema/resolvers/customerAdoption.ts` - Status update logic

## Summary

The telemetry import now works reliably using the REST API endpoint. This is a simpler, more standard approach than trying to make GraphQL file uploads work with Apollo Server v5. The import provides detailed feedback, evaluates criteria correctly, and automatically updates task statuses.
