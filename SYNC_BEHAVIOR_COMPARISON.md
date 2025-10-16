# Sync Behavior Comparison

## BEFORE FIX (Static Filtering)

```
Product: Network Management
├── Outcomes: [Security, Performance, Reliability, Compliance, Cost Optimization]
├── Releases: [v1.0, v2.0, v3.0, v4.0]
└── Tasks: [Task1, Task2, ..., Task10]

Customer: ACME Corporation
├── selectedOutcomes: [Security, Performance]  ← FROZEN at assignment
├── selectedReleases: [v1.0, v2.0]             ← FROZEN at assignment
└── licenseLevel: ADVANTAGE

Admin adds:
✨ New Outcome: "Compliance"
✨ New Task: "Audit Logging" (Compliance outcome)

ACME clicks SYNC:
┌─────────────────────────────────────────┐
│ ❌ SYNC RESULT: No changes              │
├─────────────────────────────────────────┤
│ Reason: Task filtered out               │
│ - Task has "Compliance" outcome         │
│ - ACME selectedOutcomes = [Security,    │
│   Performance] (static)                 │
│ - "Compliance" NOT in ACME's selections │
│ - Task not eligible                     │
└─────────────────────────────────────────┘

Manual Workaround Required:
1. Admin goes to ACME
2. Edit Product Assignment
3. Manually add "Compliance" to outcomes
4. Save (regenerates entire plan)
5. Now task appears
```

---

## AFTER FIX (Dynamic Sync)

```
Product: Network Management
├── Outcomes: [Security, Performance, Reliability, Compliance, Cost Optimization]
├── Releases: [v1.0, v2.0, v3.0, v4.0]
└── Tasks: [Task1, Task2, ..., Task10]

Customer: ACME Corporation
├── selectedOutcomes: [Security, Performance]  ← Will be updated
├── selectedReleases: [v1.0, v2.0]             ← Will be updated
└── licenseLevel: ADVANTAGE

Admin adds:
✨ New Outcome: "Compliance"
✨ New Task: "Audit Logging" (Compliance outcome)

ACME clicks SYNC:
┌─────────────────────────────────────────┐
│ PHASE 1: Update Selections              │
├─────────────────────────────────────────┤
│ 1. Fetch all product outcomes:          │
│    [Security, Performance, Reliability, │
│     Compliance, Cost Optimization]      │
│                                         │
│ 2. Fetch all product releases:          │
│    [v1.0, v2.0, v3.0, v4.0]             │
│                                         │
│ 3. Calculate new additions:             │
│    newOutcomes = [Compliance,           │
│                   Cost Optimization,    │
│                   Reliability]          │
│    newReleases = [v3.0, v4.0]           │
│                                         │
│ 4. Update customer selections:          │
│    selectedOutcomes ← ALL product       │
│                       outcomes          │
│    selectedReleases ← ALL product       │
│                       releases          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PHASE 2: Filter & Sync Tasks            │
├─────────────────────────────────────────┤
│ 1. Get eligible tasks:                  │
│    - License: task ≤ ADVANTAGE ✅       │
│    - Outcomes: task has ANY of [Sec,    │
│      Perf, Rel, Comp, Cost] ✅          │
│    - Releases: task has ANY of [v1.0,   │
│      v2.0, v3.0, v4.0] ✅               │
│                                         │
│ 2. New task "Audit Logging":            │
│    - License: ESSENTIAL ✅              │
│    - Outcome: Compliance ✅             │
│      (NOW in ACME's selections!)        │
│    - Release: v3.0 ✅                   │
│    → ELIGIBLE! Add to plan              │
│                                         │
│ 3. Update existing tasks (if changed)   │
│ 4. Remove obsolete tasks (if any)       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ✅ SYNC RESULT: Changes applied         │
├─────────────────────────────────────────┤
│ outcomesAdded: 3                        │
│ releasesAdded: 2                        │
│ tasksAdded: 1                           │
│ tasksUpdated: 0                         │
│ tasksRemoved: 0                         │
│                                         │
│ Audit Log: ✅ Recorded                  │
│ Customer Progress: ✅ Recalculated      │
│ lastSyncedAt: ✅ Updated                │
└─────────────────────────────────────────┘

No Manual Intervention Required! 🎉
```

---

## Key Difference

### Before: Static Filtering
```typescript
// Frozen at assignment time
const selectedOutcomes = customerProduct.selectedOutcomes; // [Security, Performance]

// Filter tasks
const eligibleTasks = tasks.filter(task => 
  task.outcomes.some(o => selectedOutcomes.includes(o))  // ❌ Compliance not in array
);
```

### After: Dynamic Sync
```typescript
// Fetch current product state
const allOutcomes = product.outcomes.map(o => o.id);  // Includes NEW outcomes

// Update customer selections FIRST
await update(customerProduct, {
  selectedOutcomes: allOutcomes  // ✅ Now includes Compliance
});

// Then filter tasks
const eligibleTasks = tasks.filter(task => 
  task.outcomes.some(o => allOutcomes.includes(o))  // ✅ Compliance in array!
);
```

---

## Visual Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    BEFORE FIX                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Product Changes → [Static Filter] → No New Tasks Appear    │
│                          ↑                                   │
│                     Uses frozen                              │
│                     selections                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    AFTER FIX                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Product Changes → [Update Selections] → [Dynamic Filter]   │
│                            ↓                      ↓          │
│                    Sync outcomes/releases    Use updated     │
│                    from product             selections       │
│                                                ↓             │
│                                        New Tasks Appear ✅   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Real World Analogy

### Before Fix (Static Cable TV Package)
```
You subscribed to "Sports + Movies" package in 2020
New channels added to package: "Sports HD", "Documentary", "Kids"
Your box still shows: Sports, Movies (old channels only)
To get new channels: Call customer service, update package manually
```

### After Fix (Dynamic Streaming Service)
```
You subscribed to "Premium" tier
New content added: Documentaries, Kids Shows, Live Sports
Click "Refresh" → All new content appears automatically
No manual intervention needed
```

---

## Database State

### Before Sync
```sql
-- CustomerProduct table
{
  id: "cp1",
  customerId: "acme",
  productId: "network-mgmt",
  selectedOutcomes: ["outcome1", "outcome2"],  -- Only Security, Performance
  selectedReleases: ["rel1", "rel2"]           -- Only v1.0, v2.0
}

-- Product table
Product "network-mgmt" has:
  - 5 outcomes (including NEW "Compliance")
  - 4 releases (including NEW "v3.0", "v4.0")
  - 10 tasks (including NEW "Audit Logging")
```

### After Sync
```sql
-- CustomerProduct table (UPDATED)
{
  id: "cp1",
  customerId: "acme",
  productId: "network-mgmt",
  selectedOutcomes: ["outcome1", "outcome2", "outcome3", "outcome4", "outcome5"],  -- ALL 5 outcomes
  selectedReleases: ["rel1", "rel2", "rel3", "rel4"]  -- ALL 4 releases
}

-- AdoptionPlan updated
{
  lastSyncedAt: "2025-10-16T10:30:00Z",
  totalTasks: 10,  -- Was 9, now 10 (added "Audit Logging")
  ...
}

-- CustomerTask created
{
  name: "Audit Logging",
  originalTaskId: "task10",
  status: "NOT_STARTED",
  ...
}

-- AuditLog created
{
  action: "SYNC_ADOPTION_PLAN",
  details: {
    outcomesAdded: 3,
    releasesAdded: 2,
    tasksAdded: 1
  }
}
```

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Customer Selections** | Static (frozen at assignment) | Dynamic (synced with product) |
| **New Outcomes** | Ignored | Auto-included |
| **New Releases** | Ignored | Auto-included |
| **New Tasks** | Filtered out | Appear after sync |
| **Manual Work** | Required | Not required |
| **Audit Trail** | Basic | Enhanced (outcomes/releases tracked) |
| **User Experience** | Frustrating | Seamless |
