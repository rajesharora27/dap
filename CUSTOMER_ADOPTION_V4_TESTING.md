# Customer Adoption Panel V4 - Testing Guide

## New Layout (Products-Style)

### Left Sidebar
- ✅ Collapsible customer list (280px when open, 50px when collapsed)
- ✅ Customers sorted alphabetically by name
- ✅ Shows product count for each customer
- ✅ Selected customer is highlighted

### Right Main Area

#### Header Section
- ✅ Customer name and description
- ✅ Action buttons: Add, Edit, Delete, Export, Import
- ✅ Product selector dropdown
- ✅ "Assign Product" button
- ✅ "Sync" button (shows when sync needed)

#### Progress Card
- ✅ Shows license level chip
- ✅ Progress bar with percentage
- ✅ Task completion count (X / Y tasks)
- ✅ Last synced timestamp

#### Tasks Table (Always Visible)
- ✅ Columns: #, Task Name, Weight, Status, Telemetry, Actions
- ✅ Sequence number
- ✅ Task name and description
- ✅ Status timestamp and user who updated
- ✅ Status chip with icon and color
- ✅ Telemetry attribute count
- ✅ "Change" button for inline status updates

### Status Change Dialog
- ✅ Opens when clicking "Change" button
- ✅ Dropdown to select new status
- ✅ Optional notes field
- ✅ Records timestamp and user (statusUpdatedAt, statusUpdatedBy, statusNotes)

## Test Scenarios

### Scenario 1: Navigation & Layout
1. Navigate to Customers menu
2. Verify collapsible sidebar on left
3. Click collapse/expand button
4. Select a customer from the list
5. Verify customer details show on right

### Scenario 2: Customer CRUD
1. Click "Add" button
2. Fill in customer name and description
3. Save and verify it appears in list
4. Select the new customer
5. Click "Edit" button
6. Modify details and save
7. Click "Delete" button and confirm

### Scenario 3: Product Assignment
1. Select "Acme Corporation"
2. Click "Assign Product" button
3. Select a product (e.g., Cisco Secure Access)
4. Choose license level (Signature)
5. Select outcomes
6. Submit and verify product appears in dropdown

### Scenario 4: View Adoption Plan
1. Select customer with assigned product
2. Select product from dropdown
3. Verify progress card appears
4. Verify tasks table shows all tasks
5. Check task details: name, status, weight, telemetry

### Scenario 5: Change Task Status
1. Click "Change" button on any task
2. Select new status from dropdown (e.g., NOT_STARTED → IN_PROGRESS)
3. Add optional notes
4. Save and verify:
   - Status chip updates
   - Timestamp shows below task name
   - Progress bar updates
   - Task count updates

### Scenario 6: Multiple Status Changes
1. Change task from NOT_STARTED → IN_PROGRESS
2. Add note: "Starting implementation"
3. Later, change same task: IN_PROGRESS → DONE
4. Add note: "Completed successfully"
5. Verify both timestamps are recorded
6. Verify progress updates after each change

### Scenario 7: Sync Adoption Plan
1. Select customer with product
2. If "Sync Needed" chip appears, click "Sync" button
3. Verify tasks refresh
4. Verify "Sync Needed" chip disappears
5. Verify "Last synced" timestamp updates

### Scenario 8: Export Adoption Plan
1. Select customer and product
2. Click "Export" button
3. Verify Excel file downloads
4. Open file and check:
   - Customer info
   - Product info
   - All tasks listed
   - Status values
   - Telemetry data

### Scenario 9: Import Telemetry
1. Modify exported Excel file
2. Add telemetry values
3. Click "Import" button
4. Select modified Excel file
5. Verify success message
6. Verify telemetry values appear in tasks

### Scenario 10: Multi-Customer Workflow
1. Select "Acme Corporation"
2. View adoption progress
3. Change a task status
4. Switch to "Healthcare Network Inc"
5. View its adoption progress
6. Switch back to "Acme Corporation"
7. Verify previous status change is preserved

## Key Features to Validate

### Status Change Recording
- ✅ Each status change records:
  - `statusUpdatedAt`: Timestamp of change
  - `statusUpdatedBy`: User who made the change
  - `statusNotes`: Optional notes about the change
- ✅ Displayed below task name in table
- ✅ Format: "Updated: [timestamp] by [user]"

### Automatic Visibility
- ✅ Tasks always visible (no "View & Manage" button needed)
- ✅ Inline status change with "Change" button
- ✅ Status dialog is lightweight and quick

### Progress Updates
- ✅ Progress bar updates immediately after status change
- ✅ Task count updates (completed/total)
- ✅ Weight calculation reflects changes

### UI Consistency
- ✅ Layout matches Products section
- ✅ Collapsible sidebar like Products
- ✅ Action buttons in header like Products
- ✅ Similar color scheme and styling

## Expected Results

**All status changes should be recorded with:**
- Timestamp (when)
- User (who) - if authentication is enabled
- Notes (why/what) - if provided

**Progress should update automatically:**
- After any status change
- After sync operation
- After import operation

**UI should be responsive:**
- Sidebar collapse/expand smoothly
- Customer selection highlights correctly
- Product selection loads adoption plan
- Task table scrolls independently

## Backend API Used

### Queries
- `GET_CUSTOMERS` - Fetch all customers with products and adoption plans
- `GET_ADOPTION_PLAN` - Fetch detailed adoption plan with tasks

### Mutations
- `CREATE_CUSTOMER` - Add new customer
- `UPDATE_CUSTOMER` - Edit customer details
- `DELETE_CUSTOMER` - Remove customer
- `UPDATE_TASK_STATUS` - Change task status (records timestamp, user, notes)
- `SYNC_ADOPTION_PLAN` - Sync tasks from product
- `EXPORT_CUSTOMER_ADOPTION` - Export to Excel
- `IMPORT_CUSTOMER_ADOPTION` - Import from Excel

## GraphQL Schema for Status Recording

```graphql
mutation UpdateTaskStatus($input: UpdateCustomerTaskStatusInput!) {
  updateCustomerTaskStatus(input: $input) {
    id
    status
    statusUpdatedAt     # Automatically set by backend
    statusUpdatedBy     # From authentication context
    statusNotes         # From user input
  }
}

input UpdateCustomerTaskStatusInput {
  customerTaskId: ID!
  status: CustomerTaskStatus!
  notes: String        # Optional notes
}
```

## Success Criteria

✅ Layout matches Products section exactly
✅ Customers sortable alphabetically
✅ Sidebar collapsible
✅ All CRUD operations work
✅ Status changes record timestamp and user
✅ Tasks always visible (no extra clicks)
✅ Progress updates automatically
✅ Export/Import functional
✅ Sync works correctly

## Performance Notes

- Customer list loads quickly
- Product selection switches instantly
- Task table renders all tasks (no pagination initially)
- Status change updates are immediate
- Progress calculations are fast

---
**Version**: V4 - Products-Style Layout with Automatic Task Visibility
**Date**: $(date)
**Status**: Ready for Testing
