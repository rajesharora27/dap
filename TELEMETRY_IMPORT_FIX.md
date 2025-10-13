# Telemetry Success Criteria Import and Display Fix

## Problem
When importing a NEW product from Excel with telemetry success criteria:
- Task creation worked correctly
- Telemetry attributes were created in database with complete values ✅
- BUT the GUI showed success criteria as "enabled" without displaying the actual values (threshold, operator, expectedValue, etc.)

## Root Causes

### Issue #1: Import Architecture Bug - Task Map Scope
The import flow had an architectural bug in the scope management of task maps:

### The Broken Flow:
1. **Line 3515**: Query `currentTasks` from database
2. **Line 3524-3525**: Initialize `tasksById` and `tasksByName` maps from `currentTasks`
3. **Line 3843-3844** (OLD): Tasks section redefined `tasksById` and `tasksByName` as LOCAL variables
4. **Line 4034+**: New tasks created and added to LOCAL maps
5. **Line 4072**: New tasks added to `currentTasks` array
6. **Line 4175** (REMOVED): Telemetry section REBUILT `tasksByName` from `currentTasks`
7. **Line 4216**: Task lookup failed because newly created task objects didn't have `telemetryAttributes` populated

### The Issue:
Even though newly created tasks were in `currentTasks`, they were bare objects without relationships loaded. The telemetry processing needed the task objects that were in the local maps (with proper GraphQL response data including telemetryAttributes field).

## Solution
**Moved task map initialization to shared scope:**

### Changes Made:

1. **Lines 3524-3527**: Defined `tasksById` and `tasksByName` at the beginning of import
   ```typescript
   // Initialize task maps that will be used by both Tasks and Telemetry sections
   const tasksById = new Map<string, any>(currentTasks.map((task: any) => [task.id, task]));
   const tasksByName = new Map<string, any>(currentTasks.map((task: any) => [task.name.toLowerCase().trim(), task]));
   ```

2. **Line 3845** (was 3841-3842): Removed duplicate map initialization from Tasks section
   ```typescript
   // tasksById and tasksByName are already defined at the beginning of import
   ```

3. **Line 4174** (was 4175): Removed map rebuild in Telemetry section
   ```typescript
   // tasksByName is already built and maintained during task import - no need to rebuild
   ```

### The Fixed Flow:
1. **Line 3515**: Query `currentTasks` from database
2. **Line 3524-3525**: Initialize SHARED `tasksById` and `tasksByName` maps
3. **Tasks section**: Uses and updates the shared maps
4. **Line 4034+**: New tasks created with full GraphQL response
5. **Line 4070-4072**: New tasks added to shared maps AND `currentTasks`
6. **Telemetry section**: Uses the SAME shared maps with complete task data
7. **Line 4216**: Task lookup succeeds with full telemetry data

## Benefits
- Task maps are maintained consistently throughout the import
- Newly created tasks are immediately available to subsequent sections
- Task objects retain complete GraphQL response data including relationships
- No duplicate map initializations
- Cleaner, more maintainable code

## Testing
To test the fix:
1. Create an Excel file with a NEW product (doesn't exist in database)
2. Include Tasks sheet with task definitions
3. Include Telemetry Attributes sheet with success criteria containing:
   - type (e.g., "boolean_flag")
   - expectedValue (e.g., true)
   - threshold (for numeric types)
   - operator (for numeric types)
   - pattern (for string types)
   - description
4. Import the Excel file
5. Verify telemetry attributes are created with complete success criteria

### Issue #2: Display Bug - Success Criteria Not Parsed

**The Real Problem:**
- Database had complete success criteria values (verified with check-telemetry-criteria.js)
- Backend was returning `successCriteria` as JSON STRING (correct for GraphQL JSON scalar type)
- Frontend was NOT parsing the string into an object
- TelemetryConfiguration component expected an object with properties like `.threshold`, `.operator`, `.expectedValue`
- Since it received a string, all property accessors returned undefined
- Result: GUI showed criteria as "configured" but couldn't display the values

**The Fix:**
Added JSON parsing when tasks are loaded from GraphQL query (App.tsx, line 772-791):

```typescript
const tasks = [...(tasksData?.tasks?.edges?.map((edge: any) => {
  const node = edge.node;
  // Parse successCriteria from JSON string to object for each telemetry attribute
  // Create new objects to avoid mutating Apollo cache (prevents infinite render loop)
  if (node.telemetryAttributes && Array.isArray(node.telemetryAttributes)) {
    const parsedAttributes = node.telemetryAttributes.map((attr: any) => {
      if (attr.successCriteria && typeof attr.successCriteria === 'string' && attr.successCriteria.trim()) {
        try {
          return { ...attr, successCriteria: JSON.parse(attr.successCriteria) };
        } catch (e) {
          console.error(`Failed to parse successCriteria for attribute "${attr.name}":`, e);
          return attr; // Return original if parsing fails
        }
      }
      return attr;
    });
    return { ...node, telemetryAttributes: parsedAttributes };
  }
  return node;
}) || [])]
```

**CRITICAL:** The code creates NEW objects instead of mutating the original node from Apollo's cache. Mutating Apollo cache data causes infinite render loops!

Now the frontend correctly:
1. Receives JSON string from GraphQL
2. Parses it to object
3. TelemetryConfiguration can access properties like `criteria.expectedValue`, `criteria.threshold`, etc.
4. Values display correctly in the GUI

## Files Modified
- `/data/dap/frontend/src/pages/App.tsx`
  - **Lines 3524-3527**: Added shared map initialization (Fix #1)
  - **Line 3845**: Removed duplicate maps from Tasks section (Fix #1)
  - **Line 4174**: Removed map rebuild from Telemetry section (Fix #1)
  - **Lines 772-788**: Added successCriteria JSON parsing when loading tasks (Fix #2) ⭐

## Verification
Created `/data/dap/check-telemetry-criteria.js` to verify database contents - confirmed all values were correctly stored.
