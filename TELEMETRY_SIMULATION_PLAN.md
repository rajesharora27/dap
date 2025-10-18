# Telemetry Simulation - Simple Excel Import Implementation

## Overview

Simple, focused implementation of Excel-based telemetry simulation for customer adoption plans.

---

## Phase 1: Minimal Viable Implementation

### Goals
1. ✅ Generate telemetry Excel template for an adoption plan
2. ✅ Import Excel file with telemetry values
3. ✅ Evaluate success criteria automatically
4. ✅ Display telemetry status in adoption plan
5. ✅ Show which tasks meet their telemetry criteria

### Out of Scope (Future)
- ❌ Auto-status updates (manual for now)
- ❌ Complex scheduling
- ❌ Multiple data sources
- ❌ Advanced dashboards

---

## Excel Format (Simple)

### Single Sheet: "Telemetry_Data"

| Task Name | Attribute Name | Data Type | Current Value | Date | Notes |
|-----------|---------------|-----------|---------------|------|-------|
| Enable SSO | sso_enabled | BOOLEAN | true | 2025-10-18 | Completed |
| Enable SSO | provider_configured | BOOLEAN | false | 2025-10-18 | In progress |
| User Training | users_trained | NUMBER | 45 | 2025-10-18 | Growing |
| User Training | completion_rate | PERCENTAGE | 60 | 2025-10-18 | Target: 80% |

**Columns:**
- **Task Name** - Must match task name in adoption plan
- **Attribute Name** - Must match telemetry attribute name
- **Data Type** - For validation (BOOLEAN, NUMBER, PERCENTAGE, STRING, DATE)
- **Current Value** - User enters the actual value
- **Date** - When this value was recorded (defaults to today)
- **Notes** - Optional user notes

---

## Implementation Tasks

### Backend (4-5 hours)

#### 1. Export Service (2 hours)
```typescript
// backend/src/services/telemetry/CustomerTelemetryExportService.ts

class CustomerTelemetryExportService {
  // Generate Excel template for adoption plan
  async generateTelemetryTemplate(adoptionPlanId: string): Promise<Buffer>
  
  // Returns: Excel file with all tasks and their telemetry attributes
  // Sheet: Telemetry_Data with columns as defined above
}
```

**Tasks:**
- [ ] Create CustomerTelemetryExportService.ts
- [ ] Use ExcelJS to generate workbook
- [ ] Query adoption plan tasks with telemetry attributes
- [ ] Format rows with task name, attribute name, data type
- [ ] Add column headers and formatting
- [ ] Return buffer for download

#### 2. Import Service (2-3 hours)
```typescript
// backend/src/services/telemetry/CustomerTelemetryImportService.ts

class CustomerTelemetryImportService {
  // Import telemetry values from Excel
  async importTelemetryValues(
    adoptionPlanId: string, 
    fileBuffer: Buffer
  ): Promise<ImportResult>
  
  // Returns: Summary of what was imported and evaluated
}
```

**Tasks:**
- [ ] Create CustomerTelemetryImportService.ts
- [ ] Parse Excel file with ExcelJS
- [ ] Validate structure (required columns exist)
- [ ] Match task names to adoption plan tasks
- [ ] Match attribute names to customer telemetry attributes
- [ ] Create CustomerTelemetryValue records
- [ ] Evaluate success criteria for each attribute
- [ ] Update isMet flags
- [ ] Return summary report

#### 3. GraphQL API (1 hour)
```graphql
type Mutation {
  # Export telemetry template
  exportAdoptionPlanTelemetryTemplate(adoptionPlanId: ID!): TelemetryTemplateExport!
  
  # Import telemetry values
  importAdoptionPlanTelemetry(adoptionPlanId: ID!, file: Upload!): TelemetryImportResult!
}

type TelemetryTemplateExport {
  url: String!
  filename: String!
  taskCount: Int!
  attributeCount: Int!
}

type TelemetryImportResult {
  success: Boolean!
  batchId: String!
  tasksUpdated: Int!
  attributesUpdated: Int!
  errors: [String!]!
  taskResults: [TaskTelemetryResult!]!
}

type TaskTelemetryResult {
  taskName: String!
  attributesUpdated: Int!
  criteriaMet: Int!
  criteriaTotal: Int!
  completionPercentage: Float!
}
```

**Tasks:**
- [ ] Add mutations to typeDefs
- [ ] Implement exportAdoptionPlanTelemetryTemplate resolver
- [ ] Implement importAdoptionPlanTelemetry resolver
- [ ] Handle file upload with graphql-upload
- [ ] Return downloadable URL for export
- [ ] Process import and return results

### Frontend (4-5 hours)

#### 1. Telemetry Tab in Adoption Plan (2 hours)
```tsx
// Add new tab to CustomerAdoptionPanelV4.tsx

<Tabs>
  <Tab label="Overview" />
  <Tab label="Tasks" />
  <Tab label="Telemetry" />  // NEW
  <Tab label="History" />
</Tabs>

// Telemetry Tab Content
<TelemetryTab adoptionPlanId={planId}>
  <TelemetryOverview />
  <TelemetryActions />
  <TelemetryTaskList />
</TelemetryTab>
```

**Components:**
- **TelemetryOverview**: Shows last import date, overall status
- **TelemetryActions**: Export Template & Import buttons
- **TelemetryTaskList**: List of tasks with telemetry status

#### 2. Import Dialog (1 hour)
```tsx
// frontend/src/components/dialogs/ImportTelemetryDialog.tsx

function ImportTelemetryDialog({ adoptionPlanId, open, onClose }) {
  return (
    <Dialog>
      <DialogTitle>Import Telemetry Data</DialogTitle>
      <DialogContent>
        <Typography>Upload Excel file with telemetry values</Typography>
        <input type="file" accept=".xlsx" />
        <Alert>File must match the template format</Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleImport}>Import</Button>
      </DialogActions>
    </Dialog>
  );
}
```

#### 3. Telemetry Display (1-2 hours)
```tsx
// Show telemetry status in task rows

<TableRow>
  <TableCell>{task.name}</TableCell>
  <TableCell>
    {/* Telemetry Indicator */}
    <TelemetryIndicator 
      met={task.telemetryAttributesMet}
      total={task.telemetryAttributesTotal}
    />
  </TableCell>
  <TableCell>{task.status}</TableCell>
</TableRow>

// Telemetry Indicator Component
function TelemetryIndicator({ met, total }) {
  const percentage = (met / total) * 100;
  const color = percentage >= 80 ? 'success' : 
                percentage >= 50 ? 'warning' : 'error';
  
  return (
    <Chip 
      label={`${met}/${total} Met`} 
      color={color}
      size="small"
    />
  );
}
```

---

## User Workflow

### 1. Export Template
```
User Action:
1. Open adoption plan
2. Click "Telemetry" tab
3. Click "Export Template" button
4. System downloads Excel file: "<customer>-<product>-telemetry.xlsx"
5. User opens file in Excel

Result:
Excel file with all tasks and telemetry attributes, ready to fill
```

### 2. Fill Values
```
User Action:
1. Open downloaded Excel file
2. Fill "Current Value" column for each attribute
3. Update "Date" if needed (defaults to today)
4. Add optional "Notes"
5. Save file

Example:
Task: Enable SSO
- sso_enabled: true (changed from blank)
- provider_configured: true (changed from blank)
```

### 3. Import Values
```
User Action:
1. Return to DAP adoption plan
2. Click "Import Telemetry" button
3. Select updated Excel file
4. Click "Upload"

System Action:
1. Parses file
2. Creates CustomerTelemetryValue records
3. Evaluates success criteria
4. Updates isMet flags
5. Shows summary dialog

Result:
User sees which tasks now meet their telemetry criteria
```

### 4. View Results
```
User Action:
1. View "Telemetry" tab
2. See list of tasks with telemetry status
3. Green chip: All criteria met
4. Yellow chip: Some criteria met
5. Red chip: No criteria met

Example:
✓ Enable SSO - 2/2 Met (100%)
⊙ User Training - 1/2 Met (50%)
✗ API Integration - 0/3 Met (0%)
```

---

## Database Changes

### Existing Schema (No Changes Needed!) ✅

The current schema already supports everything:

```prisma
model CustomerTelemetryAttribute {
  id                String
  customerTaskId    String
  name              String
  dataType          TelemetryDataType
  successCriteria   Json
  isMet             Boolean              // ← Updated by import
  lastCheckedAt     DateTime?            // ← Updated by import
  values            CustomerTelemetryValue[]
}

model CustomerTelemetryValue {
  id                  String
  customerAttributeId String
  value               Json                 // ← Created by import
  source              String?              // ← Set to "excel"
  batchId             String?              // ← Generated for each import
  notes               String?              // ← From Excel notes column
  createdAt           DateTime
}
```

**No migrations needed!** Just use existing fields.

---

## Success Criteria Evaluation

### Using Existing Evaluation Engine ✅

```typescript
// backend/src/services/telemetry/evaluationEngine.ts
// This already exists!

import { evaluateTelemetryAttribute } from './evaluationEngine';

// After creating CustomerTelemetryValue:
const result = evaluateTelemetryAttribute(
  attribute.successCriteria,
  newValue,
  attribute.dataType
);

// Update attribute:
await prisma.customerTelemetryAttribute.update({
  where: { id: attribute.id },
  data: {
    isMet: result.isMet,
    lastCheckedAt: new Date()
  }
});
```

**No new evaluation logic needed!** Use existing engine.

---

## File Structure

```
backend/src/services/telemetry/
├── evaluationEngine.ts                          // ✅ EXISTS
├── telemetryService.ts                          // ✅ EXISTS
├── CustomerTelemetryExportService.ts            // 🆕 NEW
└── CustomerTelemetryImportService.ts            // 🆕 NEW

frontend/src/components/
├── CustomerAdoptionPanelV4.tsx                  // 📝 MODIFY (add tab)
└── dialogs/
    └── ImportTelemetryDialog.tsx                // 🆕 NEW

backend/src/schema/
├── typeDefs.ts                                  // 📝 MODIFY (add mutations)
└── resolvers/
    └── customerAdoption.ts                      // 📝 MODIFY (add resolvers)
```

---

## Testing Plan

### Manual Testing Steps

1. **Export Template**
   - [ ] Create adoption plan with tasks that have telemetry attributes
   - [ ] Export template
   - [ ] Verify Excel has correct structure
   - [ ] Verify all tasks and attributes present

2. **Import Values**
   - [ ] Fill in values in Excel
   - [ ] Import file
   - [ ] Verify CustomerTelemetryValue records created
   - [ ] Verify isMet flags updated correctly
   - [ ] Test with various data types (boolean, number, percentage)

3. **Display**
   - [ ] Verify telemetry tab shows correct data
   - [ ] Verify task list shows telemetry indicators
   - [ ] Verify colors match criteria (green/yellow/red)

4. **Error Handling**
   - [ ] Test with invalid file format
   - [ ] Test with mismatched task names
   - [ ] Test with mismatched attribute names
   - [ ] Test with invalid values for data types

---

## Timeline

### Sprint Breakdown

**Day 1-2: Backend Export**
- Create CustomerTelemetryExportService
- Implement Excel generation
- Add GraphQL mutation
- Test export functionality

**Day 3-4: Backend Import**
- Create CustomerTelemetryImportService
- Implement Excel parsing
- Add evaluation logic integration
- Add GraphQL mutation
- Test import functionality

**Day 5-6: Frontend**
- Add Telemetry tab
- Create ImportTelemetryDialog
- Add telemetry indicators
- Connect to GraphQL API
- Test end-to-end workflow

**Day 7: Testing & Polish**
- Manual testing
- Error handling improvements
- UI polish
- Documentation updates

**Total: 7 working days / ~35 hours**

---

## Example Excel File

### Generated Template (Empty)

```
| Task Name         | Attribute Name      | Data Type  | Current Value | Date       | Notes |
|-------------------|---------------------|------------|---------------|------------|-------|
| Enable SSO        | sso_enabled         | BOOLEAN    |               | 2025-10-18 |       |
| Enable SSO        | provider_configured | BOOLEAN    |               | 2025-10-18 |       |
| User Training     | users_trained       | NUMBER     |               | 2025-10-18 |       |
| User Training     | completion_rate     | PERCENTAGE |               | 2025-10-18 |       |
| API Integration   | endpoints_active    | NUMBER     |               | 2025-10-18 |       |
```

### After User Fills Values

```
| Task Name         | Attribute Name      | Data Type  | Current Value | Date       | Notes              |
|-------------------|---------------------|------------|---------------|------------|--------------------|
| Enable SSO        | sso_enabled         | BOOLEAN    | true          | 2025-10-18 | Completed today    |
| Enable SSO        | provider_configured | BOOLEAN    | true          | 2025-10-18 | Okta configured    |
| User Training     | users_trained       | NUMBER     | 45            | 2025-10-18 | Target: 100        |
| User Training     | completion_rate     | PERCENTAGE | 60            | 2025-10-18 | Need 20% more      |
| API Integration   | endpoints_active    | NUMBER     | 2             | 2025-10-18 | 3 more to enable   |
```

### After Import - System Shows

```
✓ Enable SSO - 2/2 criteria met (100%) - DONE
⊙ User Training - 1/2 criteria met (50%) - IN PROGRESS
  ✓ users_trained: 45 (need ≥30) ✓
  ✗ completion_rate: 60% (need ≥80%) ✗
✗ API Integration - 0/1 criteria met (0%) - NOT STARTED
  ✗ endpoints_active: 2 (need ≥5) ✗
```

---

## Future Enhancements (Not in This Phase)

1. **Auto-Status Updates** - Automatically mark tasks DONE when criteria met
2. **Scheduled Imports** - Daily/weekly automatic imports
3. **API Integration** - Pull from customer APIs
4. **History Tracking** - Show telemetry trends over time
5. **Advanced Dashboard** - Charts and visualizations
6. **Bulk Operations** - Import multiple adoption plans at once
7. **Validation Rules** - Custom validation per attribute
8. **Notifications** - Alert when criteria met

---

## Success Metrics

### Phase 1 (Simple Implementation)
- [ ] Can export template in <5 seconds
- [ ] Can import valid file in <10 seconds
- [ ] Evaluation accuracy: 100%
- [ ] UI shows telemetry status clearly
- [ ] No manual SQL queries needed

---

## Next Steps

1. ✅ Review this plan
2. ⏭️ Start with backend export service
3. ⏭️ Add backend import service
4. ⏭️ Build frontend UI
5. ⏭️ Test end-to-end
6. ⏭️ Deploy to dev environment
7. ⏭️ Create sample adoption plan with telemetry
8. ⏭️ Demo to stakeholders

---

**Document Version:** 1.0  
**Branch:** telemetry-simulation  
**Status:** ✅ Ready to Implement  
**Estimated Effort:** 7 days / ~35 hours
