# Customer Adoption Plan - Implementation Strategy

## Date
October 8, 2025

## Overview
This document outlines the comprehensive strategy for implementing customer adoption plan functionality, allowing customers to purchase products at specific license levels and track their progress through product tasks.

---

## 1. Requirements Analysis

### Core Requirements

#### 1.1 Customer Management
- ✅ **Already Exists**: Customer model with basic CRUD
- ✅ **Already Exists**: CustomerProduct relationship
- 🆕 **Need to Add**: License level selection per product
- 🆕 **Need to Add**: Outcome selection per product

#### 1.2 Adoption Plan Creation
- 🆕 Copy all tasks from a product → customer-specific adoption plan
- 🆕 Store selected license level and outcomes
- 🆕 Create customer-specific telemetry tracking
- 🆕 Maintain separation: customer tasks ≠ product tasks
- 🆕 Allow license/outcome changes → update adoption plan

#### 1.3 Task Status Management
- 🆕 Status values: `NOT_STARTED`, `IN_PROGRESS`, `DONE`, `NOT_APPLICABLE`
- 🆕 Manual status changes (user override)
- 🆕 Automatic status via telemetry:
  - All criteria met → `DONE`
  - Partial criteria met → `IN_PROGRESS`
  - No criteria met → `NOT_STARTED`
- 🆕 Customer-specific telemetry values

#### 1.4 Progress Tracking
- 🆕 Calculate completion % based on task weights
- 🆕 Show overall adoption plan progress
- 🆕 Track which tasks are complete/in-progress/not-started

---

## 2. Database Schema Design

### 2.1 Enhanced CustomerProduct Model

```prisma
model CustomerProduct {
  id                String              @id @default(cuid())
  customerId        String
  productId         String
  
  // License and Outcomes Selection
  licenseLevel      LicenseLevel        @default(ESSENTIAL)
  selectedOutcomes  Json?               // Array of outcome IDs customer selected
  
  // Metadata
  purchasedAt       DateTime            @default(now())
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  // Relations
  customer          Customer            @relation(fields: [customerId], references: [id])
  product           Product             @relation(fields: [productId], references: [id])
  adoptionPlan      AdoptionPlan?       // One adoption plan per product
  
  @@unique([customerId, productId])
}
```

### 2.2 New AdoptionPlan Model

```prisma
model AdoptionPlan {
  id                  String              @id @default(cuid())
  customerProductId   String              @unique
  
  // Snapshot of product details at time of creation
  productId           String              // Reference to original product
  productName         String              // Snapshot of product name
  licenseLevel        LicenseLevel        // License level when created
  selectedOutcomes    Json?               // Outcome IDs when created
  
  // Progress tracking
  totalTasks          Int                 @default(0)
  completedTasks      Int                 @default(0)
  totalWeight         Decimal             @default(0) @db.Decimal(5, 2)
  completedWeight     Decimal             @default(0) @db.Decimal(5, 2)
  progressPercentage  Decimal             @default(0) @db.Decimal(5, 2)
  
  // Metadata
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  lastSyncedAt        DateTime?           // Last time synced with product changes
  
  // Relations
  customerProduct     CustomerProduct     @relation(fields: [customerProductId], references: [id], onDelete: Cascade)
  tasks               CustomerTask[]
  
  @@index([customerProductId])
  @@index([productId])
}
```

### 2.3 New CustomerTask Model

```prisma
model CustomerTask {
  id                    String                    @id @default(cuid())
  adoptionPlanId        String
  
  // Snapshot of original task
  originalTaskId        String                    // Reference to product task
  name                  String
  description           String?
  estMinutes            Int
  weight                Decimal                   @db.Decimal(5, 2)
  sequenceNumber        Int
  priority              String?
  howToDoc              String[]
  howToVideo            String[]
  notes                 String?
  licenseLevel          LicenseLevel
  
  // Customer-specific status
  status                CustomerTaskStatus        @default(NOT_STARTED)
  statusUpdatedAt       DateTime?
  statusUpdatedBy       String?                   // User ID or "telemetry"
  statusNotes           String?                   // Why status changed
  
  // Completion tracking
  isComplete            Boolean                   @default(false)
  completedAt           DateTime?
  completedBy           String?                   // User ID or "telemetry"
  
  // Metadata
  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt
  
  // Relations
  adoptionPlan          AdoptionPlan              @relation(fields: [adoptionPlanId], references: [id], onDelete: Cascade)
  telemetryAttributes   CustomerTelemetryAttribute[]
  outcomes              CustomerTaskOutcome[]
  releases              CustomerTaskRelease[]
  
  @@index([adoptionPlanId])
  @@index([originalTaskId])
  @@index([status])
}
```

### 2.4 New CustomerTelemetryAttribute Model

```prisma
model CustomerTelemetryAttribute {
  id                String                      @id @default(cuid())
  customerTaskId    String
  
  // Snapshot of original telemetry attribute
  originalAttributeId String?                   // Reference to product telemetry attribute
  name              String
  description       String?
  dataType          TelemetryDataType
  isRequired        Boolean                     @default(false)
  successCriteria   Json                        // Same structure as TelemetryAttribute
  order             Int                         @default(0)
  
  // Customer-specific tracking
  isActive          Boolean                     @default(true)
  isMet             Boolean                     @default(false)
  lastCheckedAt     DateTime?
  
  // Metadata
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime                    @updatedAt
  
  // Relations
  customerTask      CustomerTask                @relation(fields: [customerTaskId], references: [id], onDelete: Cascade)
  values            CustomerTelemetryValue[]
  
  @@unique([customerTaskId, name])
  @@index([customerTaskId])
}
```

### 2.5 New CustomerTelemetryValue Model

```prisma
model CustomerTelemetryValue {
  id                        String                     @id @default(cuid())
  customerAttributeId       String
  
  // Value details
  value                     Json
  source                    String?                    // "manual", "api", "customer_system"
  batchId                   String?
  notes                     String?
  
  // Metadata
  createdAt                 DateTime                   @default(now())
  
  // Relations
  customerAttribute         CustomerTelemetryAttribute @relation(fields: [customerAttributeId], references: [id], onDelete: Cascade)
  
  @@index([customerAttributeId])
  @@index([batchId])
  @@index([createdAt])
}
```

### 2.6 Supporting Junction Tables

```prisma
model CustomerTaskOutcome {
  id              String        @id @default(cuid())
  customerTaskId  String
  outcomeId       String
  customerTask    CustomerTask  @relation(fields: [customerTaskId], references: [id], onDelete: Cascade)
  
  @@unique([customerTaskId, outcomeId])
}

model CustomerTaskRelease {
  id              String        @id @default(cuid())
  customerTaskId  String
  releaseId       String
  customerTask    CustomerTask  @relation(fields: [customerTaskId], references: [id], onDelete: Cascade)
  
  @@unique([customerTaskId, releaseId])
}
```

### 2.7 New Enum

```prisma
enum CustomerTaskStatus {
  NOT_STARTED
  IN_PROGRESS
  DONE
  NOT_APPLICABLE
}
```

---

## 3. Data Flow & Business Logic

### 3.1 Adoption Plan Creation Flow

```
1. Customer purchases product (or updates purchase)
   ↓
2. User selects:
   - License Level (Essential, Advantage, Signature)
   - Outcomes (which business goals to achieve)
   ↓
3. System creates/updates CustomerProduct record
   ↓
4. System creates AdoptionPlan (if new) or updates (if exists)
   ↓
5. System copies tasks from product:
   - Filter by license level (task.licenseLevel <= customer.licenseLevel)
   - Filter by selected outcomes (task in outcome.tasks)
   - Create CustomerTask for each matching task
   ↓
6. System copies telemetry attributes:
   - For each CustomerTask
   - Create CustomerTelemetryAttribute from TelemetryAttribute
   ↓
7. System copies outcome/release relationships:
   - Create CustomerTaskOutcome
   - Create CustomerTaskRelease
   ↓
8. Initialize progress tracking:
   - totalTasks = count(CustomerTask)
   - totalWeight = sum(CustomerTask.weight)
   - completedTasks = 0
   - completedWeight = 0
   - progressPercentage = 0
```

### 3.2 Task Status Update Flow (Manual)

```
1. User manually changes task status
   ↓
2. Validate status value (NOT_STARTED, IN_PROGRESS, DONE, NOT_APPLICABLE)
   ↓
3. Update CustomerTask:
   - status = new status
   - statusUpdatedAt = now()
   - statusUpdatedBy = userId
   - statusNotes = user-provided reason
   - isComplete = (status === DONE)
   - completedAt = (status === DONE) ? now() : null
   - completedBy = (status === DONE) ? userId : null
   ↓
4. Recalculate AdoptionPlan progress:
   - completedTasks = count(where status = DONE)
   - completedWeight = sum(weight where status = DONE)
   - progressPercentage = (completedWeight / totalWeight) * 100
   ↓
5. Return updated task and plan
```

### 3.3 Task Status Update Flow (Telemetry-Driven)

```
1. Customer telemetry values are added/updated
   ↓
2. For each CustomerTelemetryAttribute on the task:
   - Evaluate successCriteria against latest values
   - Update isMet = true/false
   - Update lastCheckedAt = now()
   ↓
3. Determine task status:
   - All required attributes met → DONE
   - Some attributes met → IN_PROGRESS
   - No attributes met → NOT_STARTED
   ↓
4. Update CustomerTask (only if status changed):
   - status = calculated status
   - statusUpdatedAt = now()
   - statusUpdatedBy = "telemetry"
   - statusNotes = "Automatically updated based on telemetry criteria"
   - isComplete = (status === DONE)
   - completedAt = (status === DONE) ? now() : null
   - completedBy = (status === DONE) ? "telemetry" : null
   ↓
5. Recalculate AdoptionPlan progress (same as manual flow)
   ↓
6. Trigger real-time update notification (WebSocket)
```

### 3.4 License/Outcome Change Flow

```
1. User updates CustomerProduct:
   - licenseLevel changes (e.g., Essential → Advantage)
   - selectedOutcomes changes
   ↓
2. System marks plan for sync:
   - AdoptionPlan.lastSyncedAt = null (needs sync)
   ↓
3. User triggers "Sync Adoption Plan" (or auto-sync option)
   ↓
4. System compares current tasks with product tasks:
   a. Remove CustomerTasks that no longer match:
      - task.licenseLevel > customer.licenseLevel
      - task not in selected outcomes
   b. Add new CustomerTasks that now match:
      - task.licenseLevel <= customer.licenseLevel
      - task in selected outcomes
   ↓
5. Update AdoptionPlan:
   - totalTasks, totalWeight recalculated
   - lastSyncedAt = now()
   ↓
6. Recalculate progress
```

---

## 4. GraphQL Schema Design

### 4.1 Types

```graphql
type Customer {
  id: ID!
  name: String!
  description: String
  products: [CustomerProductWithPlan!]!
  solutions: [CustomerSolutionWithPlan!]!
  createdAt: String!
  updatedAt: String!
}

type CustomerProductWithPlan {
  id: ID!
  customer: Customer!
  product: Product!
  licenseLevel: LicenseLevel!
  selectedOutcomes: [Outcome!]!
  adoptionPlan: AdoptionPlan
  purchasedAt: String!
  createdAt: String!
  updatedAt: String!
}

type AdoptionPlan {
  id: ID!
  customerProduct: CustomerProductWithPlan!
  productId: ID!
  productName: String!
  licenseLevel: LicenseLevel!
  selectedOutcomes: [Outcome!]!
  
  # Progress tracking
  totalTasks: Int!
  completedTasks: Int!
  totalWeight: Float!
  completedWeight: Float!
  progressPercentage: Float!
  
  # Tasks grouped by status
  tasks: [CustomerTask!]!
  tasksByStatus(status: CustomerTaskStatus): [CustomerTask!]!
  
  # Metadata
  createdAt: String!
  updatedAt: String!
  lastSyncedAt: String
  needsSync: Boolean! # Computed: product updated after lastSyncedAt
}

type CustomerTask {
  id: ID!
  adoptionPlan: AdoptionPlan!
  originalTaskId: ID!
  
  # Task details (snapshot)
  name: String!
  description: String
  estMinutes: Int!
  weight: Float!
  sequenceNumber: Int!
  priority: String
  howToDoc: [String!]!
  howToVideo: [String!]!
  notes: String
  licenseLevel: LicenseLevel!
  
  # Customer-specific status
  status: CustomerTaskStatus!
  statusUpdatedAt: String
  statusUpdatedBy: String # User ID or "telemetry"
  statusNotes: String
  
  # Completion
  isComplete: Boolean!
  completedAt: String
  completedBy: String
  
  # Relations
  telemetryAttributes: [CustomerTelemetryAttribute!]!
  outcomes: [Outcome!]!
  releases: [Release!]!
  
  # Computed fields
  telemetryProgress: TelemetryProgress!
  
  # Metadata
  createdAt: String!
  updatedAt: String!
}

type CustomerTelemetryAttribute {
  id: ID!
  customerTask: CustomerTask!
  originalAttributeId: ID
  
  name: String!
  description: String
  dataType: TelemetryDataType!
  isRequired: Boolean!
  successCriteria: JSON!
  order: Int!
  
  # Customer-specific tracking
  isActive: Boolean!
  isMet: Boolean!
  lastCheckedAt: String
  
  # Values
  values: [CustomerTelemetryValue!]!
  latestValue: CustomerTelemetryValue
  
  # Metadata
  createdAt: String!
  updatedAt: String!
}

type CustomerTelemetryValue {
  id: ID!
  customerAttribute: CustomerTelemetryAttribute!
  
  value: JSON!
  source: String
  batchId: String
  notes: String
  
  createdAt: String!
}

type TelemetryProgress {
  totalAttributes: Int!
  requiredAttributes: Int!
  metAttributes: Int!
  metRequiredAttributes: Int!
  completionPercentage: Float!
  allRequiredMet: Boolean!
}

enum CustomerTaskStatus {
  NOT_STARTED
  IN_PROGRESS
  DONE
  NOT_APPLICABLE
}
```

### 4.2 Queries

```graphql
extend type Query {
  # Customer queries
  customer(id: ID!): Customer
  customers: [Customer!]!
  
  # Adoption plan queries
  adoptionPlan(id: ID!): AdoptionPlan
  adoptionPlansForCustomer(customerId: ID!): [AdoptionPlan!]!
  
  # Customer task queries
  customerTask(id: ID!): CustomerTask
  customerTasksForPlan(adoptionPlanId: ID!, status: CustomerTaskStatus): [CustomerTask!]!
}
```

### 4.3 Mutations

```graphql
extend type Mutation {
  # Customer CRUD
  createCustomer(input: CreateCustomerInput!): Customer!
  updateCustomer(id: ID!, input: UpdateCustomerInput!): Customer!
  deleteCustomer(id: ID!): DeleteResult!
  
  # Customer product assignment
  assignProductToCustomer(input: AssignProductInput!): CustomerProductWithPlan!
  updateCustomerProduct(id: ID!, input: UpdateCustomerProductInput!): CustomerProductWithPlan!
  removeProductFromCustomer(id: ID!): DeleteResult!
  
  # Adoption plan management
  createAdoptionPlan(customerProductId: ID!): AdoptionPlan!
  syncAdoptionPlan(adoptionPlanId: ID!): AdoptionPlan!
  
  # Task status management
  updateCustomerTaskStatus(input: UpdateTaskStatusInput!): CustomerTask!
  bulkUpdateCustomerTaskStatus(adoptionPlanId: ID!, taskIds: [ID!]!, status: CustomerTaskStatus!, notes: String): [CustomerTask!]!
  
  # Telemetry value management
  addCustomerTelemetryValue(input: AddTelemetryValueInput!): CustomerTelemetryValue!
  bulkAddCustomerTelemetryValues(inputs: [AddTelemetryValueInput!]!): [CustomerTelemetryValue!]!
  
  # Auto-update task status based on telemetry
  evaluateTaskTelemetry(customerTaskId: ID!): CustomerTask!
  evaluateAllTasksTelemetry(adoptionPlanId: ID!): AdoptionPlan!
}
```

### 4.4 Input Types

```graphql
input CreateCustomerInput {
  name: String!
  description: String
}

input UpdateCustomerInput {
  name: String
  description: String
}

input AssignProductInput {
  customerId: ID!
  productId: ID!
  licenseLevel: LicenseLevel!
  selectedOutcomeIds: [ID!]!
}

input UpdateCustomerProductInput {
  licenseLevel: LicenseLevel
  selectedOutcomeIds: [ID!]
}

input UpdateTaskStatusInput {
  customerTaskId: ID!
  status: CustomerTaskStatus!
  notes: String
}

input AddTelemetryValueInput {
  customerAttributeId: ID!
  value: JSON!
  source: String
  batchId: String
  notes: String
}
```

---

## 5. Implementation Phases

### Phase 1: Database Schema (1-2 days)
1. Create migration for new models
2. Add enums and indexes
3. Test migrations up/down
4. Create seed data for testing

### Phase 2: Backend Resolvers (3-4 days)
1. Customer CRUD resolvers
2. CustomerProduct assignment resolvers
3. AdoptionPlan creation/sync resolvers
4. CustomerTask status management
5. Telemetry evaluation logic
6. Progress calculation utilities

### Phase 3: Frontend UI - Customer Management (2-3 days)
1. Customer list page
2. Add/Edit customer form
3. Delete customer confirmation
4. Customer detail page

### Phase 4: Frontend UI - Product Assignment (2-3 days)
1. Assign product to customer flow
2. License level selector
3. Outcome multi-select
4. Create adoption plan confirmation

### Phase 5: Frontend UI - Adoption Plan View (3-4 days)
1. Adoption plan dashboard
2. Progress visualization (charts)
3. Task list with status badges
4. Task detail view
5. Status update modal

### Phase 6: Telemetry Integration (2-3 days)
1. Customer telemetry value entry
2. Automatic status evaluation
3. Real-time progress updates
4. Telemetry criteria visualization

### Phase 7: Testing & Documentation (2-3 days)
1. Unit tests for business logic
2. Integration tests for mutations
3. E2E tests for critical flows
4. User documentation
5. API documentation

**Total Estimated Time**: 15-22 days

---

## 6. Key Design Decisions

### 6.1 Snapshot vs. Live Reference
**Decision**: Use **snapshot approach** for customer tasks
**Rationale**: 
- Customer tasks are frozen at time of purchase
- Product changes don't automatically affect customers
- Gives customers stability and predictability
- Allows explicit sync when desired
- Avoids unexpected changes to customer adoption plans

### 6.2 Telemetry Separation
**Decision**: Create **separate telemetry models** for customers
**Rationale**:
- Customer telemetry values are independent from product sample data
- Each customer has unique telemetry values
- Prevents data collision between customers
- Easier to query customer-specific data
- Clearer ownership and data lifecycle

### 6.3 Status Update Priority
**Decision**: **Manual overrides telemetry**
**Rationale**:
- Give users control over status
- Allow marking tasks as "Not Applicable"
- Support edge cases telemetry can't handle
- Telemetry suggestions, user decides

**Implementation**:
- Track `statusUpdatedBy` field
- If "telemetry", can be auto-updated
- If userId, requires user action to change again
- Provide "Reset to telemetry-driven" option

### 6.4 Progress Calculation
**Decision**: Use **weight-based completion percentage**
**Rationale**:
- More accurate than simple task count
- Reflects actual effort/importance
- Same logic as product progress
- Industry standard approach

**Formula**:
```
progressPercentage = (sum(weight where status=DONE) / sum(weight)) * 100
```

### 6.5 License/Outcome Change Behavior
**Decision**: **Require explicit sync** after changes
**Rationale**:
- Give users control over when to update
- Allow reviewing changes before applying
- Prevent accidental task deletion
- Show diff of what will change

---

## 7. API Usage Examples

### 7.1 Create Customer and Assign Product

```graphql
mutation CreateCustomerWithProduct {
  # Step 1: Create customer
  customer: createCustomer(input: {
    name: "Acme Corporation"
    description: "Large retail company"
  }) {
    id
    name
  }
  
  # Step 2: Assign product (creates adoption plan automatically)
  assignment: assignProductToCustomer(input: {
    customerId: $customerId
    productId: "retail-app-001"
    licenseLevel: ADVANTAGE
    selectedOutcomeIds: ["outcome-1", "outcome-2", "outcome-3"]
  }) {
    id
    licenseLevel
    adoptionPlan {
      id
      totalTasks
      progressPercentage
      tasks {
        id
        name
        status
      }
    }
  }
}
```

### 7.2 Update Task Status Manually

```graphql
mutation UpdateTaskStatus {
  updateCustomerTaskStatus(input: {
    customerTaskId: "task-123"
    status: IN_PROGRESS
    notes: "Customer started working on this task"
  }) {
    id
    status
    statusUpdatedAt
    statusUpdatedBy
    adoptionPlan {
      progressPercentage
      completedTasks
    }
  }
}
```

### 7.3 Add Telemetry and Auto-Evaluate

```graphql
mutation AddTelemetryAndEvaluate {
  # Add telemetry value
  addCustomerTelemetryValue(input: {
    customerAttributeId: "attr-456"
    value: { enabled: true, count: 150 }
    source: "customer_api"
    notes: "Integration deployed"
  }) {
    id
    value
  }
  
  # Evaluate task based on all telemetry
  evaluateTaskTelemetry(customerTaskId: "task-123") {
    id
    status
    statusUpdatedBy
    telemetryProgress {
      allRequiredMet
      completionPercentage
    }
  }
}
```

### 7.4 Change License Level and Sync

```graphql
mutation UpgradeLicense {
  # Update license level
  updateCustomerProduct(
    id: "cust-prod-789"
    input: { licenseLevel: SIGNATURE }
  ) {
    id
    licenseLevel
    adoptionPlan {
      needsSync
    }
  }
  
  # Sync adoption plan (adds new tasks for higher license)
  syncAdoptionPlan(adoptionPlanId: "plan-789") {
    id
    totalTasks
    tasks {
      id
      name
      licenseLevel
      status
    }
  }
}
```

---

## 8. Security Considerations

### 8.1 Authorization Rules

```typescript
// Only allow customers to see their own data
- Customer can view: own adoption plans, tasks, telemetry
- Admin can view: all customers, all plans
- User can view: customers they manage (future: add user-customer relationship)

// Mutation permissions
- Create customer: ADMIN only
- Delete customer: ADMIN only
- Update customer: ADMIN or assigned user
- Update task status: ADMIN or assigned user
- Add telemetry: ADMIN, assigned user, or API key (customer's system)
```

### 8.2 Data Isolation

```typescript
// Ensure queries are scoped to customer
WHERE CustomerTask.adoptionPlan.customerProduct.customerId = currentUser.customerId

// Use database indexes for performance
@@index([customerId])
@@index([adoptionPlanId])
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
describe('AdoptionPlan', () => {
  it('should calculate progress percentage correctly')
  it('should filter tasks by license level')
  it('should copy telemetry attributes from product')
  it('should handle missing outcomes gracefully')
})

describe('CustomerTask', () => {
  it('should update status manually')
  it('should evaluate telemetry criteria')
  it('should transition from NOT_STARTED → IN_PROGRESS → DONE')
  it('should allow marking as NOT_APPLICABLE')
})

describe('TelemetryEvaluation', () => {
  it('should mark task DONE when all required attributes met')
  it('should mark task IN_PROGRESS when some attributes met')
  it('should respect manual status overrides')
})
```

### 9.2 Integration Tests

```typescript
describe('Customer Adoption Flow', () => {
  it('should create customer and assign product')
  it('should create adoption plan with correct tasks')
  it('should update progress when task status changes')
  it('should sync plan when license level changes')
  it('should remove tasks when license downgraded')
})
```

### 9.3 E2E Tests

```typescript
describe('User Journey', () => {
  it('should create customer, assign product, and see adoption plan')
  it('should manually update task status and see progress increase')
  it('should add telemetry and see auto-status update')
  it('should upgrade license and sync plan with new tasks')
})
```

---

## 10. Performance Considerations

### 10.1 Database Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_customer_task_adoption_plan ON customer_task(adoption_plan_id);
CREATE INDEX idx_customer_task_status ON customer_task(status);
CREATE INDEX idx_customer_telemetry_attr_task ON customer_telemetry_attribute(customer_task_id);
CREATE INDEX idx_customer_telemetry_value_attr ON customer_telemetry_value(customer_attribute_id);
CREATE INDEX idx_customer_telemetry_value_created ON customer_telemetry_value(created_at);
```

### 10.2 Query Optimization

```typescript
// Use Prisma includes to avoid N+1 queries
await prisma.adoptionPlan.findUnique({
  where: { id },
  include: {
    tasks: {
      include: {
        telemetryAttributes: {
          include: {
            values: {
              orderBy: { createdAt: 'desc' },
              take: 1 // Latest value only
            }
          }
        }
      }
    }
  }
});

// Use aggregations for progress calculation
const progress = await prisma.customerTask.aggregate({
  where: { adoptionPlanId, status: 'DONE' },
  _sum: { weight: true },
  _count: true
});
```

### 10.3 Caching Strategy

```typescript
// Cache adoption plan progress (invalidate on task status change)
cacheKey = `adoption-plan:${planId}:progress`
ttl = 300 // 5 minutes

// Cache telemetry evaluation results
cacheKey = `customer-task:${taskId}:telemetry-met`
ttl = 60 // 1 minute
```

---

## 11. Future Enhancements

### 11.1 Phase 2 Features (Future)
- [ ] Customer user accounts (separate from admin users)
- [ ] Customer portal (self-service)
- [ ] Email notifications for progress milestones
- [ ] Automated reports (weekly progress emails)
- [ ] Task comments and collaboration
- [ ] File attachments to tasks
- [ ] Custom fields per customer

### 11.2 Advanced Features (Future)
- [ ] Multi-product bundles
- [ ] Custom adoption plan templates
- [ ] Task dependencies (can't start B until A is done)
- [ ] Gantt chart view of adoption timeline
- [ ] AI-powered task recommendations
- [ ] Integration with customer's tools (Jira, ServiceNow)
- [ ] Webhooks for status changes

---

## 12. Success Metrics

### 12.1 Technical Metrics
- ✅ All CRUD operations < 200ms response time
- ✅ Adoption plan creation < 2s for 50 tasks
- ✅ Telemetry evaluation < 500ms per task
- ✅ Progress calculation < 100ms
- ✅ 100% test coverage for business logic
- ✅ Zero data loss during license/outcome changes

### 12.2 User Experience Metrics
- ✅ Users can create customer and adoption plan in < 2 minutes
- ✅ Status updates reflect immediately in UI
- ✅ Progress visualization is intuitive
- ✅ Telemetry criteria are clearly explained
- ✅ License upgrade path is smooth

---

## 13. Next Steps

### Immediate Actions

1. **Review this strategy document** ✅
2. **Get stakeholder approval** on approach
3. **Create database migration** for new models
4. **Set up development branch** for customer feature
5. **Start Phase 1**: Database schema implementation

### Questions to Resolve
- [ ] Should we support multiple adoption plans per customer-product? (No for MVP)
- [ ] Should task status changes be audited? (Yes, use existing AuditLog)
- [ ] Should we support task assignment to specific users? (Future feature)
- [ ] Should customers see original product tasks? (No, only their adoption plan)
- [ ] Should we allow custom tasks in adoption plan? (Future feature)

---

## 14. Risk Mitigation

### 14.1 Data Integrity Risks

| Risk | Mitigation |
|------|------------|
| Product tasks deleted after customer copies | Store originalTaskId, allow orphaned references |
| License downgrade loses progress | Warn user before sync, show tasks that will be removed |
| Telemetry evaluation errors | Wrap in try-catch, fallback to manual status |
| Concurrent status updates | Use database transactions, last-write-wins |

### 14.2 Performance Risks

| Risk | Mitigation |
|------|------------|
| Large adoption plans (100+ tasks) | Paginate task lists, lazy-load telemetry |
| Slow telemetry evaluation | Background job queue, cache results |
| Many concurrent customers | Database connection pooling, read replicas |

---

## Conclusion

This strategy provides a comprehensive, scalable approach to implementing customer adoption plan functionality. The design maintains separation between product master data and customer-specific copies, enabling customers to track their unique progress while preserving product integrity.

**Key Principles**:
1. ✅ **Snapshot approach** - Customer tasks are independent
2. ✅ **Telemetry-driven automation** - Reduce manual status updates
3. ✅ **User control** - Manual overrides always allowed
4. ✅ **Clear progress tracking** - Weight-based calculations
5. ✅ **Flexible licensing** - Easy to upgrade/downgrade
6. ✅ **Data isolation** - Each customer's data is separate

**Ready to implement** once approved! 🚀
