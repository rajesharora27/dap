# Telemetry Status Update Logic

## Overview
This document describes how task status updates work with telemetry data in the Digital Adoption Platform.

## Status Update Rules

### 1. Telemetry-Based Status Determination
When telemetry data is imported or evaluated:

- **DONE**: All required telemetry criteria are met
- **IN_PROGRESS**: Telemetry exists and some criteria are met, but not all required criteria
- **NOT_STARTED**: No telemetry criteria are met

### 2. Manual vs Telemetry Status Precedence

**Manual status takes precedence** with one exception:
- If a task status is manually set to `IN_PROGRESS`, `DONE`, or `NOT_APPLICABLE`, telemetry evaluation will **NOT** override it
- If a task status is `NOT_STARTED` (either initially or set manually), telemetry evaluation **CAN** update it

**Key Principle**: Once a user manually changes a task status to something other than NOT_STARTED, that manual status is preserved even when telemetry suggests a different status.

### 3. Status Update Behavior

| Current Status | Status Set By | Telemetry Suggests | Result | Reason |
|---------------|---------------|-------------------|---------|--------|
| NOT_STARTED | (initial) | DONE | ✅ DONE | Telemetry can update from NOT_STARTED |
| NOT_STARTED | manual | IN_PROGRESS | ✅ IN_PROGRESS | Telemetry can update from NOT_STARTED |
| IN_PROGRESS | manual | DONE | ❌ IN_PROGRESS | Manual status takes precedence |
| DONE | manual | IN_PROGRESS | ❌ DONE | Manual status takes precedence |
| IN_PROGRESS | telemetry | DONE | ✅ DONE | Telemetry can update its own status |
| DONE | telemetry | IN_PROGRESS | ✅ IN_PROGRESS | Telemetry can update its own status |

## Implementation Details

### Backend: `evaluateTaskTelemetry`
Location: `/data/dap/backend/src/schema/resolvers/customerAdoption.ts`

```typescript
// Manual status takes precedence over telemetry (except for NOT_STARTED)
const hasManualStatus = task.statusUpdatedBy && 
                       task.statusUpdatedBy !== 'telemetry' && 
                       task.status !== 'NOT_STARTED';

// Only update task status if:
// 1. Status has changed, AND
// 2. Either no manual status was set, OR current status is NOT_STARTED
if (newStatus !== task.status && !hasManualStatus) {
  // Update status
}
```

### Always Update Criteria Status
Even when manual status takes precedence, the `isMet` status of each telemetry attribute is **always updated**. This ensures:
- The UI shows current telemetry evaluation results
- Users can see which criteria are met/unmet
- The system tracks telemetry state even when not updating task status

## Import Feedback

### Enhanced Import Status Messages
When telemetry is imported, users receive detailed feedback:

```
✅ Telemetry Import Successful!

📊 Summary:
  • Tasks Processed: 3
  • Attributes Updated: 5
  • Criteria Evaluated: 5
  • Criteria Met: 3/5

📋 Task Details:
  • Setup Environment: 2/2 criteria met (100%)
  • Configure Settings: 1/2 criteria met (50%)
  • Deploy Application: 0/1 criteria met (0%)

🔄 Task statuses have been automatically evaluated and updated.
```

### Error Handling
If import fails or has warnings:

```
❌ Telemetry import failed:
  • Row 5: Missing required field 'currentValue'
  • Row 8: Invalid data type for attribute 'userCount'
```

## Use Cases

### Use Case 1: Automated Progress Tracking
**Scenario**: Tasks start as NOT_STARTED. As telemetry data is imported, tasks automatically progress.

- Import telemetry with partial criteria met → Task moves to IN_PROGRESS
- Import more data, all criteria met → Task moves to DONE

### Use Case 2: Manual Override
**Scenario**: A task is marked DONE manually, but telemetry later shows a criterion is no longer met.

- User manually marks task as DONE
- Telemetry import shows 1/2 criteria met
- Task **remains DONE** (manual status takes precedence)
- UI shows criteria status for transparency

### Use Case 3: Reset and Re-evaluate
**Scenario**: User wants telemetry to control status again.

- User manually sets task to NOT_STARTED
- Next telemetry import/evaluation will update the status based on criteria
- Telemetry regains control over status updates

## Related Files

### Backend
- `/data/dap/backend/src/schema/resolvers/customerAdoption.ts`
  - `evaluateTaskTelemetry`: Evaluates single task telemetry
  - `evaluateAllTasksTelemetry`: Evaluates all tasks in adoption plan

### Frontend
- `/data/dap/frontend/src/components/CustomerAdoptionPanelV4.tsx`
  - Import telemetry mutation with detailed feedback
  - Display of telemetry criteria status

### Services
- `/data/dap/backend/src/services/telemetry/evaluationEngine.ts`
  - Core telemetry evaluation logic
  - Supports multiple criteria types (boolean, number, string, timestamp, etc.)

## Testing Recommendations

1. **Test Manual Precedence**:
   - Manually set task to DONE
   - Import telemetry with unmet criteria
   - Verify task stays DONE

2. **Test Automatic Updates**:
   - Leave task at NOT_STARTED
   - Import telemetry
   - Verify task updates to IN_PROGRESS or DONE based on criteria

3. **Test Reset**:
   - Manually set task to NOT_STARTED
   - Import telemetry
   - Verify telemetry controls status again

4. **Test Import Feedback**:
   - Import valid telemetry
   - Verify detailed success message
   - Import invalid telemetry
   - Verify error details are shown
