# Debug Guide: Telemetry Success Criteria Import Issue

## Problem
Success criteria shows as "configured" but values inside (threshold, operator, pattern, expectedValue) are empty.

## What I Added
Comprehensive logging at EVERY step of the export/import pipeline:

### Frontend Export Logs (App.tsx lines ~3180-3195)
- `[Export]` prefix
- Shows successCriteria type (string vs object)
- Shows RAW JSON structure with all keys
- Shows FINAL string being written to Excel

### Frontend Import Logs (App.tsx lines ~4225-4250)
- `[Import]` prefix with separators
- Shows raw Excel cell content
- Shows parsed JSON object with all keys
- Shows specific fields (type, operator, threshold, pattern)
- Shows mutation input being sent to backend

### Backend Resolver Logs (resolvers.ts lines ~173-190, ~204-221)
- `[Backend]` prefix
- Shows raw input received from frontend
- Shows parsed JSON object with all keys

### Backend Service Logs (telemetryService.ts)
- `[Service]` prefix  
- Shows criteria object before stringifying
- Shows stringified value being stored in DB
- Shows what was actually saved to DB

## How to Test

### Step 1: Rebuild Backend (Required!)
The backend code has changed, so you MUST rebuild:

```bash
cd backend
npm run build
```

Then restart the backend:
```bash
docker-compose restart backend
# OR
docker-compose down
docker-compose up -d
```

### Step 2: Open Browser Console
1. Open your app in browser
2. Press F12 to open Developer Tools
3. Go to "Console" tab
4. Clear console (trash icon)

### Step 3: Export Test
1. Navigate to a product with telemetry attributes
2. Click "Export" button
3. **IMMEDIATELY check console** for logs starting with `[Export]`
4. Look for:
   ```
   [Export] Attribute "YourAttributeName" successCriteria RAW: {...}
   [Export] Attribute "YourAttributeName" successCriteria keys: [...]
   [Export] Attribute "YourAttributeName" FINAL exported string: {...}
   ```

### Step 4: Check Excel File
1. Open the exported Excel file
2. Go to "Telemetry Attributes" sheet
3. Find the row with your attribute
4. **Copy the EXACT content** of the "Success Criteria" column for that row
5. Paste it somewhere to inspect

### Step 5: Check Backend Logs (Export Verification)
The export doesn't touch backend, but let's prepare for import:
```bash
# In terminal:
docker-compose logs -f backend | grep -E "\[Export|\[Import|\[Backend|\[Service\]"
```

Keep this terminal open!

### Step 6: Import Test
1. In browser console, clear logs again
2. Click "Import" button
3. Select the Excel file you just exported
4. **Watch BOTH**:
   - Browser console for `[Import]` logs
   - Backend terminal for `[Backend]` and `[Service]` logs

### Step 7: Verify Database
After import completes, query the database:

```bash
docker exec -it dap-postgres-1 psql -U postgres -d postgres -c "
SELECT 
  ta.id,
  ta.name,
  ta.\"dataType\",
  ta.\"successCriteria\"::text as criteria
FROM \"TelemetryAttribute\" ta
JOIN \"Task\" t ON ta.\"taskId\" = t.id
WHERE t.name = 'YourTaskName'
  AND ta.name = 'YourAttributeName';
"
```

## What to Look For

### ✅ GOOD Export (Values Present)
```
[Export] Attribute "CPU Usage" successCriteria RAW: {
  "type": "number_threshold",
  "operator": "greater_than",
  "threshold": 80,
  "description": "CPU must be > 80%"
}
[Export] Attribute "CPU Usage" successCriteria keys: ["type", "operator", "threshold", "description"]
[Export] FINAL exported string: {"type":"number_threshold","operator":"greater_than","threshold":80,"description":"CPU must be > 80%"}
```

Excel cell should contain:
```
{"type":"number_threshold","operator":"greater_than","threshold":80,"description":"CPU must be > 80%"}
```

### ❌ BAD Export (Values Missing)
```
[Export] Attribute "CPU Usage" successCriteria RAW: {
  "type": "number_threshold"
}
[Export] Attribute "CPU Usage" successCriteria keys: ["type"]
[Export] FINAL exported string: {"type":"number_threshold"}
```

Excel cell:
```
{"type":"number_threshold"}
OR
{}
```

**This means the DATABASE already has incomplete data!**

### ✅ GOOD Import
```
[Import] ========== Processing "CPU Usage" ==========
[Import] Raw from Excel (length 98): {"type":"number_threshold","operator":"greater_than","threshold":80,"description":"CPU must be > 80%"}
[Import] Successfully parsed JSON!
[Import] Parsed object: {
  "type": "number_threshold",
  "operator": "greater_than", 
  "threshold": 80,
  "description": "CPU must be > 80%"
}
[Import] Parsed keys: ["type", "operator", "threshold", "description"]
[Import] Has type? number_threshold
[Import] Has operator? greater_than
[Import] Has threshold? 80
```

Backend logs:
```
[Backend] Raw successCriteria input: {"type":"number_threshold","operator":"greater_than","threshold":80,"description":"CPU must be > 80%"}
[Backend] Parsed successCriteria: {
  "type": "number_threshold",
  "operator": "greater_than",
  "threshold": 80,
  "description": "CPU must be > 80%"
}
[Backend] Parsed keys: ["type", "operator", "threshold", "description"]
```

Service logs:
```
[Service] Updating attribute ... with criteria: { type: 'number_threshold', operator: 'greater_than', threshold: 80, description: 'CPU must be > 80%' }
[Service] Stringified for DB: {"type":"number_threshold","operator":"greater_than","threshold":80,"description":"CPU must be > 80%"}
[Service] Updated attribute successCriteria in DB: {"type":"number_threshold","operator":"greater_than","threshold":80,"description":"CPU must be > 80%"}
```

### ❌ BAD Import (Values Lost)
```
[Import] Parsed object: {
  "type": "number_threshold"
}
[Import] Has operator? undefined
[Import] Has threshold? undefined
```

## Diagnosis Scenarios

### Scenario 1: Export Shows Empty Object
**Symptoms:**
- `[Export] successCriteria keys: []` or `["type"]` only
- Excel has `{}` or incomplete JSON

**Cause:** Database has incomplete data

**Solution:** 
1. Open the task in UI
2. Edit the telemetry attribute  
3. Re-configure success criteria completely
4. Save
5. Try export again

### Scenario 2: Export Shows Full Object, Excel Empty
**Symptoms:**
- `[Export]` logs show all fields
- But Excel "Success Criteria" column is empty or `{}`

**Cause:** ExcelJS writing issue (unlikely but possible)

**Solution:** Check the export code logic - might be a cell writing bug

### Scenario 3: Excel Has Full Object, Import Parses Empty
**Symptoms:**
- Excel cell has complete JSON
- `[Import] Parsed keys:` shows only `["type"]` or `[]`

**Cause:** JSON.parse failing silently OR Excel reading wrong cell

**Solution:** Check Excel file format - might have hidden characters

### Scenario 4: Import Parses Full, Backend Receives Empty
**Symptoms:**
- `[Import] Parsed object:` shows all fields
- `[Backend] Parsed successCriteria:` shows only type or empty

**Cause:** GraphQL mutation not sending full object

**Solution:** Check the mutation variables being sent

### Scenario 5: Backend Receives Full, DB Gets Empty
**Symptoms:**
- `[Backend] Parsed keys:` shows all fields
- `[Service] Stringified for DB:` shows all fields
- But DB query shows `{}` or incomplete

**Cause:** Prisma or DB constraint issue

**Solution:** Check Prisma schema and DB column type

## What to Share With Me

Please provide:

### 1. Browser Console Logs
```
Copy ALL lines starting with [Export] or [Import]
Paste here:
```

### 2. Excel Cell Content
```
Exact content of Success Criteria column for the problematic attribute:
```

### 3. Backend Logs
```
Copy ALL lines with [Backend] or [Service]
Paste here:
```

### 4. Database Query Result
```
successCriteria column value from DB:
```

### 5. Screenshots
- Screenshot of editing the attribute BEFORE export (showing criteria configured)
- Screenshot of editing the attribute AFTER import (showing empty values)

## Expected Timeline

With these logs, I can:
1. **Immediately identify** which step is losing data
2. **Fix the specific problem** in minutes
3. **Verify the fix** with another test cycle

The logs will show EXACTLY where: Export → Excel → Import → Backend → Service → Database

One of these arrows is where the data disappears! 🎯
