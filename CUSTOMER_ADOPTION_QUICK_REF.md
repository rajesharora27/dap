# Customer Adoption Plan - Quick Reference

## 📋 Overview

This feature allows customers to **purchase products** at specific **license levels** and track their progress through an **adoption plan** - a copy of all product tasks customized for that customer.

---

## 🎯 Core Concepts

```
Product (Master)              Customer Adoption Plan (Copy)
├─ Tasks (50)                 ├─ CustomerTasks (40)
├─ Licenses (3 levels)        │  └─ Filtered by license level
├─ Outcomes (5)               │  └─ Filtered by selected outcomes
└─ Telemetry Attributes       └─ Customer Telemetry (separate data)
```

**Key Principle**: Customer tasks are **snapshots** (frozen copies), not live references.

---

## 🏗️ Data Model Summary

### New Models (7)

1. **AdoptionPlan** - Overall progress tracking
2. **CustomerTask** - Copy of product task with status
3. **CustomerTaskStatus** - Enum: NOT_STARTED, IN_PROGRESS, DONE, NOT_APPLICABLE
4. **CustomerTelemetryAttribute** - Copy of telemetry attribute
5. **CustomerTelemetryValue** - Customer's telemetry data
6. **CustomerTaskOutcome** - Junction table
7. **CustomerTaskRelease** - Junction table

### Enhanced Models (1)

- **CustomerProduct** - Added: licenseLevel, selectedOutcomes, purchasedAt

---

## 🔄 Main Workflows

### Workflow 1: Create Adoption Plan

```
User Action                          System Action
───────────────────────────────────────────────────────────────
1. Select customer                   
2. Choose product                    
3. Pick license level (Essential)    
4. Select outcomes (3 of 5)          
5. Click "Assign Product"            → Create CustomerProduct
                                     → Create AdoptionPlan
                                     → Copy filtered tasks
                                     → Copy telemetry attributes
                                     → Initialize progress (0%)
6. View adoption plan dashboard      ← Return plan with 40 tasks
```

### Workflow 2: Update Task Status (Manual)

```
User Action                          System Action
───────────────────────────────────────────────────────────────
1. Open task detail                  
2. Change status to "In Progress"    → Update CustomerTask.status
3. Add note: "Started today"         → Set statusUpdatedBy = userId
4. Save                              → Set statusUpdatedAt = now()
                                     → Recalculate plan progress
5. See progress bar update           ← Return updated progress: 15%
```

### Workflow 3: Update Task Status (Telemetry)

```
System Action                        Result
───────────────────────────────────────────────────────────────
1. Customer adds telemetry value     → Store in CustomerTelemetryValue
2. Evaluate success criteria         → Check all attributes
3. All required attributes met?      → YES
4. Auto-update task status           → CustomerTask.status = DONE
                                     → statusUpdatedBy = "telemetry"
5. Recalculate progress              → Progress: 28% (+13%)
6. Send real-time notification       → WebSocket update to UI
```

### Workflow 4: Change License Level

```
User Action                          System Action
───────────────────────────────────────────────────────────────
1. Upgrade: Essential → Advantage    → Update CustomerProduct.licenseLevel
2. Click "Sync Adoption Plan"        → Show preview:
                                       - 10 new tasks will be added
                                       - 0 tasks will be removed
3. Confirm sync                      → Create 10 new CustomerTasks
                                     → Copy telemetry attributes
                                     → Recalculate totals
4. View updated plan                 ← Return plan with 50 tasks
```

---

## 📊 Progress Calculation

### Formula

```javascript
// Weight-based (more accurate)
progressPercentage = (completedWeight / totalWeight) * 100

// Example:
// - Total weight: 100.00
// - Completed tasks weight: 35.25
// - Progress: 35.25%
```

### Task Status Impact

| Status | Counts as Complete? | Included in Progress? |
|--------|--------------------|-----------------------|
| `NOT_STARTED` | ❌ No | ❌ No |
| `IN_PROGRESS` | ❌ No | ❌ No |
| `DONE` | ✅ Yes | ✅ Yes |
| `NOT_APPLICABLE` | ❌ No | ❌ No (excluded from total) |

---

## 🎯 Telemetry-Driven Status

### Automatic Status Determination

```javascript
function determineStatus(task) {
  const attributes = task.telemetryAttributes;
  const required = attributes.filter(a => a.isRequired);
  const metRequired = required.filter(a => a.isMet);
  const metAll = attributes.filter(a => a.isMet);
  
  if (metRequired.length === required.length && required.length > 0) {
    return 'DONE'; // All required criteria met
  } else if (metAll.length > 0) {
    return 'IN_PROGRESS'; // Some criteria met
  } else {
    return 'NOT_STARTED'; // No criteria met
  }
}
```

### Manual Override Rules

- ✅ User can **always** manually change status
- ✅ Manual status **persists** until next manual change
- ✅ `statusUpdatedBy` tracks who/what changed it:
  - `"telemetry"` = auto-updated (can be overridden by telemetry again)
  - `userId` = manually set (telemetry won't override)
- ✅ User can click "Reset to Telemetry-Driven" to re-enable auto-updates

---

## 🔐 Security & Permissions

### Authorization Matrix

| Action | Admin | User | Customer Portal (Future) |
|--------|-------|------|--------------------------|
| View all customers | ✅ | ❌ | ❌ |
| Create customer | ✅ | ❌ | ❌ |
| View own adoption plan | ✅ | ✅ | ✅ |
| Update task status | ✅ | ✅ | ✅ |
| Add telemetry | ✅ | ✅ | ✅ (via API) |
| Delete customer | ✅ | ❌ | ❌ |

---

## 📈 Implementation Phases

### Phase 1: Database (1-2 days) ← START HERE
- [ ] Create Prisma migration
- [ ] Add new models and enums
- [ ] Test migration
- [ ] Create seed data

### Phase 2: Backend (3-4 days)
- [ ] GraphQL types and inputs
- [ ] Query resolvers
- [ ] Mutation resolvers
- [ ] Telemetry evaluation logic
- [ ] Progress calculation

### Phase 3: Frontend - Customer Pages (2-3 days)
- [ ] Customer list
- [ ] Add/Edit customer
- [ ] Delete confirmation

### Phase 4: Frontend - Adoption Plan (5-6 days)
- [ ] Assign product flow
- [ ] Adoption plan dashboard
- [ ] Task list with status
- [ ] Task detail modal
- [ ] Status update UI
- [ ] Progress visualization

### Phase 5: Telemetry Integration (2-3 days)
- [ ] Telemetry value entry
- [ ] Auto-evaluation
- [ ] Real-time updates

### Phase 6: Testing (2-3 days)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Documentation

**Total**: ~15-22 days

---

## 🎨 UI Mockup Ideas

### Dashboard View

```
┌─────────────────────────────────────────────────────────┐
│ Acme Corporation - Retail Management App               │
│ License: Advantage | Progress: 35.25%                  │
│ ████████████░░░░░░░░░░░░░░░░░░░░░                     │
│                                                         │
│ 📊 Overview                                            │
│ ✅ Done: 15 tasks (35.25%)                            │
│ 🔄 In Progress: 8 tasks (18.50%)                      │
│ ⭕ Not Started: 17 tasks (46.25%)                     │
│ ⊘  Not Applicable: 0 tasks                            │
│                                                         │
│ 📋 Tasks                           [🔍 Filter] [⚙️ Sort] │
│ ┌─────────────────────────────────────────────────────┐│
│ │ ✅ #1 Build Cloud POS System (9.5%) - DONE         ││
│ │    📅 Completed 2 days ago by John Doe             ││
│ │                                                     ││
│ │ 🔄 #2 Implement Inventory (9.0%) - IN_PROGRESS     ││
│ │    📊 Telemetry: 3/5 criteria met                  ││
│ │    [Manual Override] [View Details]                ││
│ │                                                     ││
│ │ ⭕ #3 Customer Loyalty (8.25%) - NOT_STARTED        ││
│ │    [Start Task] [View Details]                     ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Task Detail Modal

```
┌─────────────────────────────────────────────────────────┐
│ Task: Implement Inventory Management              [✕]  │
├─────────────────────────────────────────────────────────┤
│ Status: 🔄 IN_PROGRESS                                 │
│ Weight: 9.0% | Priority: High | License: Essential     │
│                                                         │
│ Description:                                            │
│ Real-time inventory tracking with automated reordering  │
│ and barcode scanning capabilities...                   │
│                                                         │
│ 📊 Telemetry Progress (3/5 criteria met)               │
│ ✅ Deployment Status: true                             │
│ ✅ Performance Score: 88 (≥85 required)                │
│ ❌ Code Quality: IN_REVIEW (needs PASSED)              │
│ ✅ Last Updated: 1 day ago (within 7 days)             │
│ ❌ Health Check: false                                 │
│                                                         │
│ 📚 Resources:                                          │
│ • Documentation: docs.retail.com/inventory             │
│ • Video Tutorial: youtube.com/watch?v=inv-mgmt         │
│                                                         │
│ Manual Status Override:                                │
│ Status: [Dropdown: NOT_STARTED, IN_PROGRESS, DONE...] │
│ Notes: [Text area]                                     │
│ [Update Status] [Reset to Telemetry-Driven]           │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### For Developers

1. **Read**: `CUSTOMER_ADOPTION_STRATEGY.md` (full details)
2. **Review**: Database schema section
3. **Create**: Migration for new models
4. **Test**: Migration up/down
5. **Implement**: GraphQL schema
6. **Build**: Resolvers
7. **Create**: Frontend components
8. **Test**: E2E flows

### API Examples

#### Create Customer & Assign Product

```graphql
mutation {
  customer: createCustomer(input: {
    name: "Acme Corp"
    description: "Retail company"
  }) { id }
  
  assign: assignProductToCustomer(input: {
    customerId: $customerId
    productId: "retail-app-001"
    licenseLevel: ADVANTAGE
    selectedOutcomeIds: ["outcome-1", "outcome-2"]
  }) {
    adoptionPlan {
      progressPercentage
      tasks { name status }
    }
  }
}
```

#### Update Task Status

```graphql
mutation {
  updateCustomerTaskStatus(input: {
    customerTaskId: "task-123"
    status: DONE
    notes: "Completed successfully"
  }) {
    status
    adoptionPlan {
      progressPercentage
    }
  }
}
```

---

## ❓ FAQ

### Why copy tasks instead of referencing them?
**Answer**: Customers need stability. If the product changes, their adoption plan should remain unchanged unless they explicitly sync.

### Can a customer have multiple adoption plans?
**Answer**: No, one adoption plan per customer-product pair (MVP). Future: Support multiple plans.

### What happens if I downgrade license level?
**Answer**: Tasks requiring higher license are removed after sync. Progress recalculates.

### Can I add custom tasks to adoption plan?
**Answer**: Not in MVP. Future enhancement.

### How often is telemetry evaluated?
**Answer**: On-demand when values are added, or via scheduled job (e.g., hourly).

### Can customers see the original product tasks?
**Answer**: No, they only see their adoption plan (the copy).

---

## 📚 Related Documentation

- 📄 **CUSTOMER_ADOPTION_STRATEGY.md** - Full implementation strategy (this is the main doc)
- 📄 **TELEMETRY_SYSTEM_DOCUMENTATION.md** - Telemetry system details
- 📄 **SAMPLE_DATA_UPDATE.md** - Sample product data structure

---

## ✅ Ready to Start!

**Next Action**: Review this quick reference and the full strategy document, then proceed to Phase 1 (Database Schema).

Got questions? Refer to the strategy doc or ask! 🚀
