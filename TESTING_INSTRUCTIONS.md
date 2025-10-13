# 🔍 SUCCESS CRITERIA IMPORT DEBUG SESSION - READY TO TEST

## ✅ Setup Complete

I've added comprehensive logging throughout the entire export/import pipeline and the backend is now running with the new code.

## 📋 What Was Added

### Frontend Logging (App.tsx)
**Export logging (~lines 3180-3195):**
- Shows the raw successCriteria object structure
- Shows all keys present in the object
- Shows the final string being written to Excel
- Checks if it's a string or object type

**Import logging (~lines 4225-4250):**
- Shows raw Excel cell content with character count
- Shows successfully parsed JSON structure
- Shows all keys in parsed object
- Checks for specific fields: type, operator, threshold, pattern
- Shows the exact mutation input being sent to GraphQL

### Backend Logging

**Resolver logging (resolvers.ts ~lines 173-221):**
- Shows raw input received from frontend
- Shows input type (string/object)
- Shows parsed JSON structure
- Shows all keys after parsing

**Service logging (telemetryService.ts ~lines 76-89, 143-161):**
- Shows criteria object before JSON.stringify
- Shows stringified value being stored
- Shows what actually got saved to database

## 🧪 How to Test NOW

### Step 1: Open Browser Console
1. Open your app: http://localhost:3000
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Click the **trash icon** to clear old logs

### Step 2: Test Export
1. Navigate to a product that has tasks with telemetry attributes
2. Make sure at least one telemetry attribute has success criteria configured
3. Click the **Export** button
4. **Immediately look at console** - you should see lines like:
   ```
   [Export] Attribute "YourAttributeName" successCriteria type: object
   [Export] Attribute "YourAttributeName" successCriteria RAW: {...}
   [Export] Attribute "YourAttributeName" successCriteria keys: [...]
   [Export] Attribute "YourAttributeName" FINAL exported string: ...
   ```

### Step 3: Check Excel File
1. Open the exported Excel file
2. Go to **Telemetry Attributes** sheet
3. Find your attribute's row
4. Look at the **Success Criteria** column
5. **Copy the exact text** from that cell

### Step 4: Test Import
1. Keep browser console open and visible
2. Click **Import** button
3. Select the Excel file you just exported
4. **Watch the console** - you should see:
   ```
   [Import] ========== Processing "YourAttributeName" ==========
   [Import] Raw from Excel (length XX): {...}
   [Import] Successfully parsed JSON!
   [Import] Parsed object: {...}
   [Import] Parsed keys: [...]
   [Import] Has type? ...
   [Import] Has operator? ...
   [Import] Has threshold? ...
   ```

### Step 5: Check Backend Logs
I've started monitoring backend logs in a terminal. After you do the import, run this command to see what the backend received:

```bash
docker compose logs backend | grep -E "\[Backend|\[Service\]" | tail -50
```

You should see:
```
[Backend] Creating/Updating telemetry attribute "..."
[Backend] Raw successCriteria input: {...}
[Backend] Parsed successCriteria: {...}
[Backend] Parsed keys: [...]
[Service] ... with criteria: {...}
[Service] Stringified for DB: {...}
[Service] Updated/Created attribute successCriteria in DB: {...}
```

### Step 6: Verify Database
After import, check what's actually in the database:

```bash
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -d postgres -c "
SELECT 
  ta.name,
  ta.\"dataType\",
  ta.\"successCriteria\"::text
FROM \"TelemetryAttribute\" ta
JOIN \"Task\" t ON ta.\"taskId\" = t.id
WHERE t.name = 'YourTaskName'
ORDER BY ta.name;
"
```

## 🎯 What We're Looking For

### The Million Dollar Questions:

1. **Does Export show all fields?**
   - Look for: `successCriteria keys: ["type", "operator", "threshold", ...]`
   - If it only shows `["type"]` → **Database has incomplete data already!**

2. **Does Excel contain all fields?**
   - Open Excel → Check Success Criteria column
   - Should be: `{"type":"number_threshold","operator":"greater_than","threshold":80,...}`
   - If it's `{}` or `{"type":"..."}` → **Export is broken OR database was empty**

3. **Does Import parse all fields?**
   - Look for: `Has operator? greater_than`, `Has threshold? 80`
   - If undefined → **Excel has incomplete JSON OR parsing failed**

4. **Does Backend receive all fields?**
   - Look for: `[Backend] Parsed keys: ["type", "operator", "threshold", ...]`
   - If missing keys → **Frontend is not sending full object**

5. **Does Database store all fields?**
   - Run the SQL query above
   - Should show complete JSON
   - If empty → **Backend/Prisma is not saving correctly**

## 📊 Possible Outcomes

### Outcome A: Export Shows Empty Keys
```
[Export] successCriteria keys: []
OR
[Export] successCriteria keys: ["type"]
```

**Diagnosis:** The database ALREADY has incomplete data. The problem is not in import, it's in how the criteria was originally saved.

**Next Step:** 
1. Open task in UI
2. Edit the telemetry attribute
3. Check what values show in the success criteria form
4. If empty → Reconfigure completely
5. If values show → There's a display/save bug in TelemetryConfiguration.tsx

### Outcome B: Export Shows All Keys, Excel Empty
```
[Export] successCriteria keys: ["type", "operator", "threshold"]
But Excel cell is empty or {}
```

**Diagnosis:** ExcelJS is not writing the cell correctly.

**Next Step:** Check the export code where we write to the sheet.

### Outcome C: Excel Full, Import Parses Empty
```
Excel: {"type":"number_threshold","operator":"greater_than","threshold":80}
[Import] Parsed keys: ["type"]
```

**Diagnosis:** JSON.parse is failing or Excel has hidden characters.

**Next Step:** Copy Excel cell content and try `JSON.parse()` in browser console manually.

### Outcome D: Import Parses Full, Backend Receives Empty
```
[Import] Parsed keys: ["type", "operator", "threshold"]
[Backend] Parsed keys: ["type"]
```

**Diagnosis:** GraphQL mutation is not sending all fields.

**Next Step:** Check the mutation input object construction in App.tsx.

### Outcome E: Backend Receives Full, Database Gets Empty
```
[Backend] Parsed keys: ["type", "operator", "threshold"]
[Service] Stringified for DB: {"type":"...","operator":"...","threshold":...}
But DB query shows: {}
```

**Diagnosis:** Prisma or PostgreSQL is not storing correctly.

**Next Step:** Check Prisma schema and column type definition.

## 🚀 READY TO GO!

**Everything is set up and waiting for you to:**
1. ✅ Open browser console (F12)
2. ✅ Export a product
3. ✅ Check console logs
4. ✅ Check Excel file
5. ✅ Import the file
6. ✅ Check console logs again
7. ✅ Check backend logs: `docker compose logs backend | grep -E "\[Backend|\[Service\]" | tail -50`
8. ✅ Check database with SQL query

**Then share with me:**
- Browser console output (all `[Export]` and `[Import]` lines)
- Excel Success Criteria cell content (exact copy-paste)
- Backend logs output
- Database query result
- What you see when editing the attribute after import

With these logs, I will be able to tell you EXACTLY where the data is being lost! 🎯

---

## Quick Reference Commands

### View recent backend logs:
```bash
docker compose logs backend | grep -E "\[Backend|\[Service\]" | tail -50
```

### Check database:
```bash
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -d postgres -c "
SELECT name, \"successCriteria\"::text FROM \"TelemetryAttribute\" ORDER BY name;
"
```

### Monitor backend logs in real-time:
```bash
docker compose logs -f backend | grep -E "\[Backend|\[Service\]"
```
