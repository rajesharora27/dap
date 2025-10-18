# Telemetry Strategy for Customer Adoption Tracking

## Executive Summary

This document outlines a comprehensive telemetry strategy for tracking customer adoption progress that works in both **simulation mode** (current) and **production mode** (future). The strategy enables progress tracking through a combination of telemetry data and manual status updates.

---

## Current System Architecture

### Existing Infrastructure ✅

The system already has robust telemetry infrastructure:

**Product Level (Template):**
- `TelemetryAttribute` - Defines telemetry parameters for tasks
- `TelemetryValue` - Historical values for product telemetry
- Success criteria evaluation engine
- Data types: BOOLEAN, NUMBER, STRING, PERCENTAGE, DATE

**Customer Level (Instance):**
- `CustomerTelemetryAttribute` - Snapshot of attributes per adoption plan
- `CustomerTelemetryValue` - Time-series values per customer
- `isMet` flag - Whether success criteria is satisfied
- `lastCheckedAt` - Last evaluation timestamp
- Task status tracking with `statusUpdateSource` (MANUAL, TELEMETRY, IMPORT, SYSTEM)

---

## Proposed Strategy

### Phase 1: Simulation Mode (Current - 3-6 months)

**Goal:** Demonstrate telemetry-driven adoption tracking without live data feeds

#### 1.1 Excel-Based Telemetry Simulation

**Product Telemetry Templates:**
```
File: telemetry-templates/<product-name>-telemetry-template.xlsx

Sheets:
1. Instructions - How to use the template
2. Telemetry Attributes - All tasks with their telemetry parameters
3. Sample Values - Example data for demo purposes
4. Daily Values - Where users input simulated daily values
```

**Template Structure:**
| Task Name | Attribute Name | Data Type | Success Criteria | Current Value | Last Updated | Notes |
|-----------|---------------|-----------|------------------|---------------|--------------|-------|
| Enable SSO | sso_enabled | BOOLEAN | {"operator": "equals", "value": true} | false | 2025-10-18 | Pending config |
| User Onboarding | user_count | NUMBER | {"operator": ">=", "value": 100} | 45 | 2025-10-18 | Growing daily |

#### 1.2 Per-Adoption Plan Telemetry Files

**Adoption Plan Telemetry:**
```
File: telemetry-data/<customer-name>-<product-name>-telemetry.xlsx

This is a COPY of the template, customized per customer with:
- Actual customer values
- Customer-specific dates
- Implementation notes
- Progress indicators
```

#### 1.3 On-Demand Import Workflow

**User Workflow:**
1. Navigate to Customer Adoption Plan
2. Click "Update Telemetry" button
3. Select Excel file for this adoption plan
4. System reads file and updates `CustomerTelemetryValue` records
5. System evaluates success criteria for each attribute
6. System updates `isMet` flags and `lastCheckedAt` timestamps
7. System optionally auto-updates task status based on telemetry
8. Dashboard shows updated progress

**Backend Process:**
```typescript
importCustomerTelemetry(adoptionPlanId, excelFile) {
  1. Parse Excel file
  2. Validate structure matches adoption plan
  3. For each task/attribute:
     - Create new CustomerTelemetryValue record
     - Evaluate success criteria
     - Update CustomerTelemetryAttribute.isMet
     - Calculate task completion percentage
  4. Determine if task status should auto-update
  5. Recalculate adoption plan progress
  6. Return summary report
}
```

---

### Phase 2: Hybrid Mode (Transition - 6-12 months)

**Goal:** Mix simulated and real telemetry data sources

#### 2.1 Multiple Data Sources

Support multiple telemetry input methods:
1. **Excel Import** (manual simulation)
2. **API Integration** (customer systems)
3. **Database Polling** (read from customer DBs)
4. **Webhook Events** (real-time updates)

#### 2.2 Batch Daily Updates

**Scheduled Job:**
```
Daily at 2 AM UTC:
1. Poll configured customer data sources
2. Fetch telemetry values
3. Store as CustomerTelemetryValue with source="api" or "database"
4. Evaluate criteria
5. Update task statuses where criteria met
6. Send notification digest
```

---

### Phase 3: Production Mode (12+ months)

**Goal:** Fully automated telemetry-driven adoption tracking

#### 3.1 Real-Time Telemetry Pipeline

**Architecture:**
```
Customer Product → Telemetry Collector → Message Queue → 
DAP Telemetry Service → Evaluation Engine → 
Customer Adoption Dashboard
```

**Key Components:**
1. **Telemetry Collector API** - Receives telemetry from customer systems
2. **Message Queue** (Kafka/RabbitMQ) - Buffers incoming telemetry
3. **Telemetry Processor** - Validates, enriches, stores telemetry
4. **Evaluation Engine** - Assesses success criteria in real-time
5. **Notification Service** - Alerts on milestone achievements

#### 3.2 Customer Instrumentation

**Integration Methods:**
- **SDK/Agent** - Embedded in customer product instance
- **Log Forwarding** - Parse customer application logs
- **API Polling** - Regular API calls to customer systems
- **Database Replication** - Read replica of customer analytics DB

---

## Data Model & Schema

### Current Schema (Already Exists) ✅

```prisma
model CustomerTelemetryAttribute {
  id                  String
  customerTaskId      String
  originalAttributeId String?        // Links to product template
  name                String
  dataType            TelemetryDataType
  successCriteria     Json           // Evaluation rules
  isMet               Boolean        // Computed: criteria satisfied?
  lastCheckedAt       DateTime?      // Last evaluation time
  values              CustomerTelemetryValue[]
}

model CustomerTelemetryValue {
  id                  String
  customerAttributeId String
  value               Json           // Actual telemetry value
  source              String?        // "excel", "api", "database", "webhook"
  batchId             String?        // For grouping daily imports
  notes               String?
  createdAt           DateTime
}
```

### New Fields Needed (Minimal Changes)

**AdoptionPlan Model Enhancement:**
```prisma
model AdoptionPlan {
  // ... existing fields ...
  
  // Telemetry configuration
  telemetryEnabled       Boolean   @default(false)
  telemetryLastImportAt  DateTime?
  telemetrySource        String?   // "excel", "api", "database"
  telemetrySchedule      String?   // Cron expression for auto-updates
  telemetryConfig        Json?     // Source-specific config
}
```

---

## Implementation Roadmap

### Milestone 1: Excel Import Foundation (2-3 weeks)

**Backend:**
- [ ] Create `TelemetryExportService` - Generate template Excel files
- [ ] Create `CustomerTelemetryImportService` - Parse and import customer telemetry
- [ ] Add GraphQL mutations:
  - `exportTelemetryTemplate(productId): File`
  - `exportAdoptionPlanTelemetry(adoptionPlanId): File`
  - `importCustomerTelemetry(adoptionPlanId, file): ImportSummary`
- [ ] Evaluation engine integration (already exists)
- [ ] Batch ID generation for imports

**Frontend:**
- [ ] "Update Telemetry" button in adoption plan view
- [ ] File upload dialog with validation
- [ ] Import progress indicator
- [ ] Success/error summary display
- [ ] "Export Template" button
- [ ] Telemetry progress visualization

**Excel Format:**
```
Sheet: Telemetry_Values
Columns:
- Task Name (required)
- Attribute Name (required)
- Data Type (auto-filled from template)
- Current Value (user fills)
- Date (user fills, defaults to today)
- Notes (optional)
- Success Criteria (read-only, for reference)
- Is Met (computed after import)
```

### Milestone 2: Telemetry Dashboard (3-4 weeks)

**Features:**
- [ ] Telemetry overview per adoption plan
- [ ] Task-level telemetry progress bars
- [ ] Attribute-level current values and trends
- [ ] Timeline view of telemetry updates
- [ ] Manual vs. telemetry status comparison
- [ ] Success criteria met/unmet indicators

**Visualizations:**
- Line charts for numeric attributes over time
- Boolean toggles for yes/no attributes
- Progress rings for percentage completion
- Color coding: Green (met), Yellow (partial), Red (not met)

### Milestone 3: Auto-Status Updates (2 weeks)

**Logic:**
```typescript
After telemetry import:
1. For each task in adoption plan:
   - Count required telemetry attributes
   - Count how many are "isMet"
   - Calculate percentage: metCount / requiredCount
   
2. If percentage >= threshold (e.g., 80%):
   - Check current task status
   - If status < IN_PROGRESS: Skip (don't auto-start)
   - If status == IN_PROGRESS: Auto-update to DONE
   - If status == DONE: Leave as is
   - Add statusNotes: "[AUTO] Task completed via telemetry (85% criteria met)"
   - Set statusUpdateSource: "TELEMETRY"
```

**Configuration:**
- [ ] Per-adoption-plan auto-update toggle
- [ ] Threshold percentage setting (default 80%)
- [ ] Task-level overrides
- [ ] Notification on auto-updates

### Milestone 4: Scheduled Imports (Future)

**Features:**
- [ ] Configure data source per adoption plan
- [ ] Schedule definition (daily, weekly, etc.)
- [ ] API endpoint registration
- [ ] Database connection strings (encrypted)
- [ ] Polling intervals
- [ ] Error handling and retries

---

## Excel Template Design

### Sheet 1: Instructions

```
DAP Customer Telemetry Import Template

Customer: [Customer Name]
Product: [Product Name]
Adoption Plan: [Assignment Name]
Generated: [Date]

Instructions:
1. DO NOT modify the structure of this file
2. Fill in the "Current Value" column with actual values
3. Update the "Date" column (defaults to today)
4. Add optional notes in the "Notes" column
5. Save the file and upload via DAP's "Update Telemetry" feature

Data Types:
- BOOLEAN: Use true/false or yes/no or 1/0
- NUMBER: Enter numeric values (e.g., 150, 45.5)
- PERCENTAGE: Enter values 0-100 (e.g., 75 for 75%)
- STRING: Enter text values
- DATE: Use YYYY-MM-DD format

Success Criteria:
Each attribute has predefined success criteria.
After import, the system will automatically evaluate if criteria are met.
```

### Sheet 2: Telemetry_Values

```
| Task Seq | Task Name | Attribute Name | Data Type | Success Criteria (Info) | Current Value | Date | Notes | Is Met (Read-Only) |
|----------|-----------|----------------|-----------|------------------------|---------------|------|-------|-------------------|
| 1 | Enable SSO | sso_enabled | BOOLEAN | Must be true | [USER FILLS] | 2025-10-18 | | Will compute |
| 1 | Enable SSO | provider_configured | BOOLEAN | Must be true | [USER FILLS] | 2025-10-18 | | Will compute |
| 2 | User Training | users_trained | NUMBER | >= 100 | [USER FILLS] | 2025-10-18 | | Will compute |
| 2 | User Training | completion_rate | PERCENTAGE | >= 80 | [USER FILLS] | 2025-10-18 | | Will compute |
```

### Sheet 3: Task_Summary (Auto-Generated After Import)

```
| Task Name | Total Attributes | Attributes Met | Completion % | Current Status | Recommended Status |
|-----------|------------------|----------------|--------------|----------------|-------------------|
| Enable SSO | 2 | 1 | 50% | IN_PROGRESS | Keep as is |
| User Training | 2 | 2 | 100% | IN_PROGRESS | AUTO-DONE |
```

---

## Progress Calculation Logic

### Task-Level Completion

```typescript
calculateTaskTelemetryCompletion(customerTaskId: string): {
  totalAttributes: number;
  metAttributes: number;
  percentage: number;
  allRequired: boolean;
  recommendation: 'DONE' | 'STAY' | 'BLOCKED';
} {
  const attributes = getCustomerTelemetryAttributes(customerTaskId);
  const required = attributes.filter(a => a.isRequired);
  const met = required.filter(a => a.isMet);
  
  const percentage = (met.length / required.length) * 100;
  
  let recommendation = 'STAY';
  if (percentage >= 80) recommendation = 'DONE';
  if (percentage === 0) recommendation = 'BLOCKED';
  
  return {
    totalAttributes: required.length,
    metAttributes: met.length,
    percentage,
    allRequired: met.length === required.length,
    recommendation
  };
}
```

### Adoption Plan Progress

```typescript
calculateAdoptionPlanProgress(adoptionPlanId: string): {
  manual: { completed: number; total: number; percentage: number };
  telemetry: { completed: number; total: number; percentage: number };
  combined: { completed: number; total: number; percentage: number };
} {
  // Current logic (manual status only)
  const manualProgress = calculateManualProgress();
  
  // New logic (telemetry-based)
  const telemetryProgress = calculateTelemetryProgress();
  
  // Combined view
  const combined = {
    completed: Math.max(manualProgress.completed, telemetryProgress.completed),
    total: manualProgress.total,
    percentage: (combined.completed / combined.total) * 100
  };
  
  return { manual, telemetry, combined };
}
```

---

## API Design

### GraphQL Mutations

```graphql
# Generate telemetry template for a product
mutation ExportTelemetryTemplate($productId: ID!) {
  exportTelemetryTemplate(productId: $productId) {
    url
    filename
    expiresAt
  }
}

# Export current telemetry values for an adoption plan
mutation ExportAdoptionPlanTelemetry($adoptionPlanId: ID!) {
  exportAdoptionPlanTelemetry(adoptionPlanId: $adoptionPlanId) {
    url
    filename
    taskCount
    attributeCount
    lastUpdated
  }
}

# Import telemetry values from Excel
mutation ImportCustomerTelemetry($adoptionPlanId: ID!, $file: Upload!) {
  importCustomerTelemetry(adoptionPlanId: $adoptionPlanId, file: $file) {
    success
    batchId
    summary {
      tasksProcessed
      attributesUpdated
      criteriaEvaluated
      taskStatusChanged
      errors
    }
    taskResults {
      taskId
      taskName
      attributesUpdated
      telemetryCompletion
      statusChanged
      newStatus
    }
  }
}

# Configure telemetry auto-update
mutation ConfigureAdoptionPlanTelemetry($input: TelemetryConfigInput!) {
  configureAdoptionPlanTelemetry(input: $input) {
    id
    telemetryEnabled
    telemetrySource
    telemetrySchedule
  }
}
```

### GraphQL Queries

```graphql
# Get telemetry status for adoption plan
query GetAdoptionPlanTelemetry($adoptionPlanId: ID!) {
  adoptionPlan(id: $adoptionPlanId) {
    id
    telemetryEnabled
    telemetryLastImportAt
    telemetryProgress {
      totalAttributes
      metAttributes
      percentage
    }
    tasks {
      id
      name
      status
      telemetryAttributes {
        id
        name
        dataType
        isMet
        lastCheckedAt
        latestValue {
          value
          source
          createdAt
        }
      }
      telemetryCompletion {
        percentage
        recommendation
      }
    }
  }
}
```

---

## UI/UX Design

### Adoption Plan View Enhancements

**New "Telemetry" Tab:**
```
┌─────────────────────────────────────────────────────┐
│ [Overview] [Tasks] [Telemetry] [History]           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Telemetry Status: Enabled ✓                       │
│  Last Updated: 2025-10-18 14:30 UTC                │
│  Next Update: Manual                                │
│                                                      │
│  [Update Telemetry] [Export Template] [Configure]  │
│                                                      │
│  Progress Overview:                                 │
│  ┌──────────────────────────────────────┐          │
│  │ Manual Status    ████████░░  80%     │          │
│  │ Telemetry        ██████░░░░  60%     │          │
│  │ Combined         ████████░░  80%     │          │
│  └──────────────────────────────────────┘          │
│                                                      │
│  Tasks by Telemetry Status:                        │
│  ┌──────────────────────────────────────┐          │
│  │ ✓ Enable SSO             100% Met    │          │
│  │ ⊙ User Training           50% Met    │          │
│  │ ✗ API Integration          0% Met    │          │
│  └──────────────────────────────────────┘          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Task Row Enhancements:**
```
Task: Enable SSO                        Status: IN_PROGRESS
Description: Configure single sign-on...
┌─────────────────────────────────────────────────────┐
│ Telemetry: 2/2 Met (100%)  [View Details ▼]       │
│                                                      │
│ • sso_enabled: true ✓                               │
│   Last updated: 2025-10-18 (via Excel)             │
│                                                      │
│ • provider_configured: true ✓                       │
│   Last updated: 2025-10-18 (via Excel)             │
│                                                      │
│ Recommendation: AUTO-COMPLETE THIS TASK             │
│ [Apply Recommendation]                              │
└─────────────────────────────────────────────────────┘
```

---

## Benefits of This Strategy

### Immediate (Simulation Mode)
1. ✅ **Demo-Ready**: Show telemetry-driven adoption without real data
2. ✅ **Flexible**: Excel files easy to create and update
3. ✅ **Low Overhead**: No integration work required upfront
4. ✅ **Realistic**: Mimics production behavior

### Medium-Term (Hybrid Mode)
1. ✅ **Gradual Migration**: Mix manual and automated sources
2. ✅ **Risk Mitigation**: Test integrations incrementally
3. ✅ **Customer Choice**: Let customers choose their data source
4. ✅ **Validation**: Compare manual vs. telemetry accuracy

### Long-Term (Production Mode)
1. ✅ **Automated**: Zero manual telemetry entry
2. ✅ **Real-Time**: Near-instant adoption updates
3. ✅ **Scalable**: Handle hundreds of customers
4. ✅ **Accurate**: Eliminate human error and bias

---

## Security & Privacy Considerations

### Data Protection
- Customer telemetry data encrypted at rest
- Access control: Only customer admins can import telemetry
- Audit logging: Track who imported what and when
- Data retention: Configurable (e.g., 90 days for time-series)

### Excel File Security
- Validate file structure before processing
- Scan for malicious content
- Limit file size (e.g., 10MB max)
- Delete uploaded files after processing

### API Security (Future)
- API key authentication
- Rate limiting
- IP whitelisting
- TLS encryption

---

## Testing Strategy

### Simulation Mode Testing
1. Create sample telemetry templates
2. Fill with various data scenarios
3. Import and verify evaluations
4. Test auto-status updates
5. Validate progress calculations

### Integration Testing (Future)
1. Mock API endpoints
2. Simulate database polling
3. Test error handling
4. Verify data consistency
5. Load testing with multiple customers

---

## Migration Path

### From Current State → Simulation Mode
**Week 1-2:**
- Implement Excel export service
- Create sample templates for existing products

**Week 3-4:**
- Implement Excel import service
- Add telemetry tab to adoption plan UI

**Week 5:**
- Test with sample data
- Gather feedback
- Refine UX

### From Simulation → Hybrid Mode
**Month 3-4:**
- Design API integration framework
- Implement database polling
- Add scheduling capabilities

**Month 5-6:**
- Pilot with 1-2 customers
- Monitor accuracy
- Adjust thresholds

### From Hybrid → Production Mode
**Month 9-12:**
- Build real-time pipeline
- Deploy telemetry collectors
- Create customer SDKs
- Full automation

---

## Success Metrics

### Simulation Mode KPIs
- Template generation time < 5 seconds
- Import success rate > 95%
- Evaluation accuracy 100%
- User satisfaction with UI

### Production Mode KPIs
- Telemetry freshness < 1 hour
- Auto-status accuracy > 90%
- Customer adoption correlation > 85%
- Support ticket reduction by 30%

---

## Conclusion

This strategy provides a **pragmatic, phased approach** to telemetry-driven adoption tracking:

1. **Start Simple**: Excel imports for immediate value
2. **Build Incrementally**: Add automation over time
3. **Stay Flexible**: Support multiple data sources
4. **Think Long-Term**: Architecture supports production scale

The existing database schema already supports this strategy with minimal changes needed. The focus should be on building the import/export services and UI first, then gradually adding automation.

---

## Next Steps

**Immediate Actions:**
1. ✅ Review and approve this strategy
2. ⏭️ Design Excel template format in detail
3. ⏭️ Create sample telemetry data for 2-3 products
4. ⏭️ Start Milestone 1 implementation

**Questions to Resolve:**
- Default threshold for auto-status updates (80%? 100%?)?
- Should we auto-update to DONE or just recommend?
- Excel file naming convention?
- Where to store generated templates (S3? Local file system?)?
- Telemetry history retention period?

---

**Document Version:** 1.0  
**Last Updated:** October 18, 2025  
**Author:** DAP Development Team  
**Status:** ✅ Ready for Review
