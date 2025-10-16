# Status Update Source Feature

## Overview
Added a new `statusUpdateSource` field to track whether task status changes were made manually (via GUI), automatically via telemetry, through import, or by the system. This provides better visibility into how adoption plan tasks are being updated.

## Implementation Date
October 15, 2025

## Changes Summary

### 1. Database Schema Changes

#### New Enum: StatusUpdateSource
```prisma
enum StatusUpdateSource {
  MANUAL      // User updated via GUI
  TELEMETRY   // Automatically updated based on telemetry evaluation
  IMPORT      // Updated via Excel/CSV import
  SYSTEM      // Created/updated by system (initial plan creation, sync)
}
```

#### Updated CustomerTask Model
```prisma
model CustomerTask {
  // ... existing fields ...
  statusUpdateSource StatusUpdateSource? @default(SYSTEM)
  // ... other fields ...
}
```

**Migration**: `20251015_add_status_update_source`
- Added `StatusUpdateSource` enum with 4 values
- Added `statusUpdateSource` field to `CustomerTask` table
- Default value: `SYSTEM`
- Field is optional (nullable)

### 2. GraphQL Schema Changes

#### Type Definition Updates (`backend/src/schema/typeDefs.ts`)

**New Enum**:
```graphql
enum StatusUpdateSource {
  MANUAL
  TELEMETRY
  IMPORT
  SYSTEM
}
```

**Updated CustomerTask Type**:
```graphql
type CustomerTask {
  # ... existing fields ...
  statusUpdateSource: StatusUpdateSource
  # ... other fields ...
}
```

### 3. Backend Resolver Changes

All task status updates now set the appropriate `statusUpdateSource`:

#### Manual Updates (`updateCustomerTaskStatus`)
**File**: `backend/src/schema/resolvers/customerAdoption.ts`

```typescript
const updateData: any = {
  status,
  statusUpdatedAt: new Date(),
  statusUpdatedBy: ctx.user?.id || 'unknown',
  statusUpdateSource: 'MANUAL',  // ← Set to MANUAL for GUI updates
  statusNotes: notes,
  // ...
};
```

**Trigger**: User changes task status via GUI
**Source**: MANUAL

#### Telemetry Evaluation (`evaluateTaskTelemetry`)
**File**: `backend/src/schema/resolvers/customerAdoption.ts`

```typescript
await prisma.customerTask.update({
  where: { id: customerTaskId },
  data: {
    status: newStatus,
    statusUpdatedAt: new Date(),
    statusUpdatedBy: 'telemetry',
    statusUpdateSource: 'TELEMETRY',  // ← Set to TELEMETRY for auto-eval
    statusNotes: 'Automatically updated based on telemetry criteria',
    // ...
  },
});
```

**Trigger**: Telemetry evaluation determines task completion
**Source**: TELEMETRY

#### Excel/CSV Import (`importCustomerAdoptionFromExcel`)
**File**: `backend/src/schema/resolvers/customerAdoption.ts`

```typescript
await prisma.customerTask.update({
  where: { id: task.id },
  data: {
    status: taskStatus,
    statusUpdatedAt: new Date(),
    statusUpdatedBy: 'import',
    statusUpdateSource: 'IMPORT',  // ← Set to IMPORT for file imports
    // ...
  },
});
```

**Trigger**: User imports adoption plan data from Excel/CSV
**Source**: IMPORT

#### System Operations
**Files**: `backend/src/schema/resolvers/customerAdoption.ts`

**createAdoptionPlan**:
```typescript
await prisma.customerTask.create({
  data: {
    // ... task fields ...
    status: 'NOT_STARTED',
    statusUpdateSource: 'SYSTEM',  // ← Set to SYSTEM for initial creation
  },
});
```

**syncAdoptionPlan**:
```typescript
await prisma.customerTask.create({
  data: {
    // ... task fields ...
    status: 'NOT_STARTED',
    statusUpdateSource: 'SYSTEM',  // ← Set to SYSTEM for sync operations
  },
});
```

**Triggers**: 
- Initial adoption plan creation
- Adoption plan synchronization
- Product assignment/update

**Source**: SYSTEM

### 4. Frontend Changes

#### Query Updates

**CustomerAdoptionPanelV4.tsx** - GET_ADOPTION_PLAN:
```graphql
query GetAdoptionPlan($id: ID!) {
  adoptionPlan(id: $id) {
    tasks {
      id
      status
      statusUpdatedAt
      statusUpdatedBy
      statusUpdateSource  # ← Added
      # ...
    }
  }
}
```

**CustomerAdoptionPanelV4.tsx** - UPDATE_TASK_STATUS:
```graphql
mutation UpdateTaskStatus($input: UpdateCustomerTaskStatusInput!) {
  updateCustomerTaskStatus(input: $input) {
    id
    status
    statusUpdatedAt
    statusUpdatedBy
    statusUpdateSource  # ← Added
    # ...
  }
}
```

**AdoptionPlanDialog.tsx** - GET_ADOPTION_PLAN_DETAILS:
```graphql
query GetAdoptionPlanDetails($id: ID!) {
  adoptionPlan(id: $id) {
    tasks {
      # ...
      statusUpdateSource  # ← Added
      # ...
    }
  }
}
```

#### UI Display Updates

**Task List (Hover Info)**:
File: `frontend/src/components/CustomerAdoptionPanelV4.tsx`

```tsx
{task.statusUpdatedAt && (
  <Typography variant="caption" display="block" color="text.secondary">
    Updated: {new Date(task.statusUpdatedAt).toLocaleString()}
    {task.statusUpdatedBy && ` by ${task.statusUpdatedBy}`}
    {task.statusUpdateSource && (
      <Chip 
        label={task.statusUpdateSource}
        size="small"
        color={
          task.statusUpdateSource === 'MANUAL' ? 'primary' :
          task.statusUpdateSource === 'TELEMETRY' ? 'success' :
          task.statusUpdateSource === 'IMPORT' ? 'info' :
          'default'
        }
      />
    )}
  </Typography>
)}
```

**Visual Indicators**:
- 🔵 **MANUAL** - Blue chip (primary color)
- 🟢 **TELEMETRY** - Green chip (success color)
- 🔷 **IMPORT** - Light blue chip (info color)
- ⚪ **SYSTEM** - Gray chip (default color)

**Task Details Dialog**:
File: `frontend/src/components/CustomerAdoptionPanelV4.tsx`

Shows statusUpdateSource chip next to the last updated timestamp in the task details dialog.

## Use Cases

### 1. Manual Status Updates
**Scenario**: Project manager reviews task and marks it complete

**Flow**:
1. User opens adoption plan
2. Finds task in list
3. Clicks status dropdown
4. Selects "COMPLETED"
5. Adds notes (optional)
6. Saves

**Result**:
- `status` → COMPLETED
- `statusUpdatedBy` → User ID
- `statusUpdateSource` → MANUAL
- `statusUpdatedAt` → Current timestamp

### 2. Automatic Telemetry Evaluation
**Scenario**: System evaluates telemetry data and determines task is complete

**Flow**:
1. Telemetry data ingested for customer
2. System evaluates task telemetry attributes
3. All required criteria met
4. System automatically updates task status

**Result**:
- `status` → DONE
- `statusUpdatedBy` → 'telemetry'
- `statusUpdateSource` → TELEMETRY
- `statusNotes` → 'Automatically updated based on telemetry criteria'

### 3. Excel/CSV Import
**Scenario**: Customer provides adoption plan status updates via spreadsheet

**Flow**:
1. User downloads adoption plan template
2. Customer fills in status updates
3. User imports Excel file
4. System processes and updates tasks

**Result**:
- `status` → (from import)
- `statusUpdatedBy` → 'import'
- `statusUpdateSource` → IMPORT
- `statusUpdatedAt` → Import timestamp

### 4. System Operations
**Scenario**: New adoption plan created or synchronized

**Flow**:
1. User assigns product to customer
2. System creates adoption plan
3. System generates tasks from product template

**Result**:
- `status` → NOT_STARTED
- `statusUpdatedBy` → null
- `statusUpdateSource` → SYSTEM
- `statusUpdatedAt` → Creation timestamp

## Benefits

### 1. Audit Trail Clarity
- Clear distinction between manual and automatic updates
- Better understanding of adoption plan data sources
- Improved transparency in status change history

### 2. Trust & Confidence
- Users can see which changes were made by people vs. systems
- Telemetry-driven updates clearly identified
- Manual overrides easily distinguished from automatic updates

### 3. Data Quality
- Identify tasks primarily updated manually vs. telemetry
- Understand which customers are engaging with the platform
- Detect potential telemetry configuration issues

### 4. Reporting & Analytics
- Track manual intervention rates
- Measure telemetry automation effectiveness
- Identify patterns in update sources

## Data Migration

### Existing Records
- All existing CustomerTask records default to `statusUpdateSource: SYSTEM`
- This is safe because existing tasks were created by the system
- No data loss or inconsistency

### Future Updates
- New manual updates → MANUAL
- Telemetry evaluations → TELEMETRY
- File imports → IMPORT
- System operations → SYSTEM

## Testing Checklist

### Manual Updates
- [ ] Create new adoption plan
- [ ] Manually change task status via GUI
- [ ] Verify statusUpdateSource shows "MANUAL" 
- [ ] Verify blue chip appears in task hover
- [ ] Verify statusUpdatedBy shows user ID

### Telemetry Updates
- [ ] Configure task with telemetry attributes
- [ ] Add telemetry values that meet criteria
- [ ] Trigger telemetry evaluation
- [ ] Verify statusUpdateSource shows "TELEMETRY"
- [ ] Verify green chip appears
- [ ] Verify statusUpdatedBy shows "telemetry"

### Import Updates
- [ ] Export adoption plan to Excel
- [ ] Modify task statuses in Excel
- [ ] Import Excel file
- [ ] Verify statusUpdateSource shows "IMPORT"
- [ ] Verify light blue chip appears
- [ ] Verify statusUpdatedBy shows "import"

### System Updates
- [ ] Assign new product to customer
- [ ] Verify initial tasks have statusUpdateSource "SYSTEM"
- [ ] Edit product entitlements (triggers regeneration)
- [ ] Verify new tasks have statusUpdateSource "SYSTEM"
- [ ] Sync adoption plan
- [ ] Verify added tasks have statusUpdateSource "SYSTEM"

### UI Display
- [ ] Hover over task in adoption plan list
- [ ] Verify statusUpdateSource chip displays correctly
- [ ] Verify colors: MANUAL=blue, TELEMETRY=green, IMPORT=light blue, SYSTEM=gray
- [ ] Double-click task to open details dialog
- [ ] Verify statusUpdateSource chip appears in dialog
- [ ] Verify chip is next to "Last updated" timestamp

## API Examples

### Query Task with Update Source
```graphql
query {
  adoptionPlan(id: "123") {
    tasks {
      id
      name
      status
      statusUpdateSource
      statusUpdatedBy
      statusUpdatedAt
    }
  }
}
```

**Response**:
```json
{
  "data": {
    "adoptionPlan": {
      "tasks": [
        {
          "id": "task-1",
          "name": "Configure SSO",
          "status": "COMPLETED",
          "statusUpdateSource": "MANUAL",
          "statusUpdatedBy": "user-456",
          "statusUpdatedAt": "2025-10-15T10:30:00Z"
        },
        {
          "id": "task-2",
          "name": "Deploy 100 Clients",
          "status": "DONE",
          "statusUpdateSource": "TELEMETRY",
          "statusUpdatedBy": "telemetry",
          "statusUpdatedAt": "2025-10-15T11:45:00Z"
        }
      ]
    }
  }
}
```

### Update Task Status (Manual)
```graphql
mutation {
  updateCustomerTaskStatus(input: {
    customerTaskId: "task-1"
    status: COMPLETED
    notes: "Completed SSO configuration"
  }) {
    id
    status
    statusUpdateSource  # Will be MANUAL
    statusUpdatedBy
  }
}
```

## Database Schema

### StatusUpdateSource Enum Values

| Value     | Description                              | Set By                    |
|-----------|------------------------------------------|---------------------------|
| MANUAL    | User updated via GUI                     | updateCustomerTaskStatus  |
| TELEMETRY | Automatically updated by telemetry eval  | evaluateTaskTelemetry     |
| IMPORT    | Updated via Excel/CSV import             | importCustomerAdoption    |
| SYSTEM    | Created/updated by system operations     | createAdoptionPlan, sync  |

### CustomerTask Fields Related to Status

| Field               | Type                 | Description                          |
|---------------------|----------------------|--------------------------------------|
| status              | CustomerTaskStatus   | Current task status                  |
| statusUpdateSource  | StatusUpdateSource   | How status was last changed          |
| statusUpdatedAt     | DateTime             | When status was last changed         |
| statusUpdatedBy     | String               | Who/what changed status              |
| statusNotes         | String               | Notes about status change            |

## Future Enhancements

### Potential Additions
1. **Status Change History**: Track all status changes with sources over time
2. **Source Analytics**: Dashboard showing breakdown of update sources
3. **Source-based Filtering**: Filter tasks by update source
4. **Notification Rules**: Alert on specific update source patterns
5. **API Integration Source**: Add API as another source type
6. **Batch Update Source**: Track bulk update operations separately

### Reporting Opportunities
- Manual intervention rate by customer
- Telemetry adoption effectiveness
- Time to manual intervention after telemetry update
- Customer engagement metrics based on manual updates

## Related Documentation
- [Progress Calculation Fix](./PROGRESS_CALCULATION_FIX.md)
- [Customer Adoption Management](./CUSTOMER_ADOPTION_FEATURE.md)
- [Telemetry Integration](./TELEMETRY_INTEGRATION.md)
- [Import/Export Features](./EXPORT_IMPORT_FEATURE_SUMMARY.md)

## Version History

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0     | 2025-10-15 | Initial implementation of statusUpdateSource |
