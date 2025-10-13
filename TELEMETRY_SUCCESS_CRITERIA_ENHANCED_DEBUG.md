# Telemetry Success Criteria Import - Enhanced Debugging

## Issue Description
Success criteria field is enabled (present) but the **criteria values are empty**. The structure is created but without the actual configuration (threshold, operator, pattern, expectedValue, etc.).

## Enhanced Logging Added

### Export Logging
When exporting, you'll now see:
```
[Export] Attribute "CPU Usage" successCriteria type: string
[Export] Attribute "CPU Usage" successCriteria value: {"type":"number_threshold","operator":"greater_than","threshold":80}
[Export] Attribute "CPU Usage" exported as: {"type":"number_threshold","operator":"greater_than","threshold":80}
```

### Import Logging
When importing, you'll now see:
```
[Import] Raw success criteria from Excel for "CPU Usage": {"type":"number_threshold","operator":"greater_than","threshold":80}
[Import] Parsed success criteria: {type: "number_threshold", operator: "greater_than", threshold: 80}
[Import] Updating telemetry attribute "CPU Usage" for task "Setup"
[Import] Existing criteria: {"type":"number_threshold","operator":"less_than","threshold":70}
[Import] New criteria: {"type":"number_threshold","operator":"greater_than","threshold":80}
[Import] Mutation input: {
  "taskId": "task-123",
  "name": "CPU Usage",
  "successCriteria": "{\"type\":\"number_threshold\",\"operator\":\"greater_than\",\"threshold\":80}",
  ...
}
```

## Testing Steps

### Step 1: Export and Check Console
1. Open browser console (F12)
2. Navigate to product with telemetry
3. Click "Export Complete"
4. **Check console output:**

**✅ Good Export:**
```
[Export] Attribute "CPU Usage" successCriteria type: string
[Export] Attribute "CPU Usage" successCriteria value: {"type":"number_threshold"...}
[Export] Attribute "CPU Usage" exported as: {"type":"number_threshold"...}
```

**❌ Problem - Empty Criteria:**
```
[Export] Attribute "CPU Usage" has no successCriteria
```
→ The attribute doesn't have criteria configured in the database

**❌ Problem - Wrong Type:**
```
[Export] Attribute "CPU Usage" successCriteria type: object
[Export] Attribute "CPU Usage" successCriteria value: {}
```
→ Empty object being exported

### Step 2: Check Excel File
1. Open the exported Excel file
2. Go to "Telemetry Attributes" sheet
3. Find your attribute row
4. Check "Success Criteria" column

**✅ Should contain:**
```json
{"type":"number_threshold","operator":"greater_than","threshold":80}
```

**❌ Problems:**
- Empty cell → Not exported
- `{}` → Empty object exported
- Invalid JSON → Export corrupted

### Step 3: Import and Check Console
1. Keep console open (F12)
2. Import the Excel file
3. **Check console output:**

**✅ Good Import:**
```
[Import] Raw success criteria from Excel for "CPU Usage": {"type":"number_threshold","operator":"greater_than","threshold":80}
[Import] Parsed success criteria: Object {type: "number_threshold", operator: "greater_than", threshold: 80}
[Import] Updating telemetry attribute "CPU Usage" for task "Setup"
[Import] Mutation input: {
  "successCriteria": "{\"type\":\"number_threshold\",\"operator\":\"greater_than\",\"threshold\":80}"
}
```

**❌ Problem - Empty from Excel:**
```
[Import] No success criteria in Excel for "CPU Usage"
```
→ Excel file doesn't have data in that column

**❌ Problem - Invalid JSON:**
```
[Import] Raw success criteria from Excel for "CPU Usage": {type:number_threshold...
[Import] Invalid JSON for success criteria: ...
```
→ JSON in Excel is malformed (missing quotes, etc.)

**❌ Problem - Empty Object:**
```
[Import] Parsed success criteria: Object {}
[Import] Mutation input: {
  "successCriteria": "{}"
}
```
→ Empty object being imported

### Step 4: Verify After Import
1. Navigate to the task
2. Click on the telemetry attribute
3. Check if success criteria shows the values

**✅ Should show:**
- Operator: "greater_than"
- Threshold: 80
- etc.

**❌ If not showing:**
- Check browser console for mutation response
- Check backend logs for errors
- Query database directly

## Diagnostic Scenarios

### Scenario 1: Export Shows Empty
**Console:**
```
[Export] Attribute "CPU Usage" has no successCriteria
```

**Cause:** Attribute doesn't have criteria configured

**Solution:**
1. Open task in UI
2. Edit telemetry attribute
3. Configure success criteria
4. Save
5. Export again

### Scenario 2: Export Shows "{}"
**Console:**
```
[Export] Attribute "CPU Usage" successCriteria value: {}
[Export] Attribute "CPU Usage" exported as: {}
```

**Cause:** Database has empty object

**Solution:**
1. Delete the attribute's success criteria
2. Reconfigure from scratch
3. Export again

### Scenario 3: Import Can't Parse JSON
**Console:**
```
[Import] Invalid JSON for success criteria: {type:number_threshold...
```

**Cause:** Excel file has malformed JSON (probably manually edited)

**Solution:**
1. Don't manually edit the Success Criteria column
2. Re-export from UI
3. Import fresh export

### Scenario 4: Import Sends Empty String
**Console:**
```
[Import] Mutation input: {
  "successCriteria": ""
}
```

**Cause:** Excel cell is empty or validation failed

**Solution:**
1. Check Excel file - is Success Criteria column populated?
2. If empty, re-export from a product that has criteria
3. If populated but still showing empty, JSON might be invalid

### Scenario 5: Import Succeeds But Values Not Showing
**Console:**
```
[Import] Mutation input: {
  "successCriteria": "{\"type\":\"number_threshold\",\"operator\":\"greater_than\",\"threshold\":80}"
}
```

**Cause:** Backend might not be saving it correctly

**Solution:**
1. Check backend logs for errors
2. Query database:
```sql
SELECT "successCriteria" 
FROM "TelemetryAttribute" 
WHERE name = 'CPU Usage';
```
3. Check if backend resolver is parsing correctly

## Database Check

If import logs look correct but UI doesn't show values, check the database:

```sql
-- Check what's actually stored
SELECT 
  ta.name,
  ta."successCriteria",
  ta."dataType"
FROM "TelemetryAttribute" ta
JOIN "Task" t ON ta."taskId" = t.id
WHERE t.name = 'Your Task Name'
  AND ta.name = 'Your Attribute Name';
```

**Expected Result:**
```
name         | successCriteria                                                    | dataType
-------------|--------------------------------------------------------------------|----------
CPU Usage    | {"type": "number_threshold", "operator": "greater_than", ...}     | NUMBER
```

**Problem Result:**
```
name         | successCriteria | dataType
-------------|-----------------|----------
CPU Usage    | {}              | NUMBER
CPU Usage    | null            | NUMBER
CPU Usage    |                 | NUMBER
```

## Backend Resolver Check

The resolver should do:
```typescript
successCriteria: input.successCriteria ? JSON.parse(input.successCriteria) : undefined
```

If it's receiving:
```
input.successCriteria = '{"type":"number_threshold","operator":"greater_than","threshold":80}'
```

It should parse to:
```javascript
{
  type: "number_threshold",
  operator: "greater_than",
  threshold: 80
}
```

## What to Share for Debugging

Please provide:

1. **Export Console Output:**
```
[Export] Attribute "..." successCriteria type: ...
[Export] Attribute "..." successCriteria value: ...
[Export] Attribute "..." exported as: ...
```

2. **Excel Cell Content:**
```
Open Excel → Success Criteria column → Copy value
```

3. **Import Console Output:**
```
[Import] Raw success criteria from Excel...
[Import] Parsed success criteria: ...
[Import] Mutation input: ...
```

4. **Database Query Result:**
```sql
SELECT "successCriteria" FROM "TelemetryAttribute" WHERE name = '...';
```

5. **UI Behavior:**
- Does the attribute show "Success Criteria Configured" badge?
- Can you edit the criteria?
- What values show when you edit?

## Expected Full Flow

### Export
```
1. DB: {"type":"number_threshold",...} (JSONB)
   ↓
2. GraphQL Query: Returns as string
   ↓
3. Frontend: Ensures string format
   ↓
4. Excel: {"type":"number_threshold",...} (text)
```

### Import
```
1. Excel: {"type":"number_threshold",...} (text)
   ↓
2. Frontend: Reads as string, validates JSON
   ↓
3. GraphQL Mutation: Sends as string
   ↓
4. Backend Resolver: JSON.parse(string) → object
   ↓
5. DB: Store as JSONB
```

## Files Modified

- **frontend/src/pages/App.tsx**
  - Export logging (Lines ~3178-3194)
  - Import validation logging (Lines ~4208-4229)
  - Update logging (Lines ~4262-4273)
  - Create logging (Lines ~4277-4281)

## Status
🔍 **ENHANCED DEBUGGING** - Comprehensive logging added at every step

Run export and import with console open, and share the complete console output to diagnose the exact issue.
