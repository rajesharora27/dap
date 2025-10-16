# Sync Issue: New Outcome and Task Not Appearing

## Date: October 15, 2025

## Reported Issue
Added a new outcome and new task to Network Management product. Task is assigned to the new outcome. After clicking sync, the task did not appear in ACME customer's adoption plan.

## Root Cause

**This is NOT a bug - it's working as designed!**

The sync eligibility rules are:

```typescript
function shouldIncludeTask(task, customerLicenseLevel, selectedOutcomeIds, selectedReleaseIds) {
  // 1. Check license level (hierarchical)
  if (task.licenseLevel > customerLicenseLevel) {
    return false; // Task requires higher license than customer has
  }
  
  // 2. Check outcomes (if customer has selected specific outcomes)
  if (selectedOutcomeIds && selectedOutcomeIds.length > 0) {
    const taskOutcomeIds = task.outcomes.map(o => o.outcomeId);
    const hasMatchingOutcome = taskOutcomeIds.some(id => selectedOutcomeIds.includes(id));
    if (!hasMatchingOutcome) {
      return false; // ❌ Task outcome doesn't match customer's selected outcomes
    }
  }
  
  // 3. Check releases (if customer has selected specific releases)
  if (selectedReleaseIds && selectedReleaseIds.length > 0) {
    const taskReleaseIds = task.releases.map(r => r.releaseId);
    const hasMatchingRelease = taskReleaseIds.some(id => selectedReleaseIds.includes(id));
    if (!hasMatchingRelease) {
      return false; // Task release doesn't match customer's selected releases
    }
  }
  
  return true; // ✅ Task is eligible
}
```

## Why Task Didn't Appear

### Scenario
1. **Product**: Network Management
2. **Existing Outcomes**: Security, Performance, Reliability
3. **ACME Selected Outcomes**: Security, Performance *(set during product assignment)*
4. **New Outcome Added**: Compliance *(you just added this)*
5. **New Task Added**: "Implement Audit Logging" *(assigned to "Compliance" outcome)*

### Eligibility Check
```
Task: "Implement Audit Logging"
├─ License: ESSENTIAL ✅ (ACME has ADVANTAGE)
├─ Outcomes: Compliance ❌ (ACME selected: Security, Performance)
└─ Result: NOT ELIGIBLE (outcome mismatch)
```

**The task is filtered out because:**
- Task has "Compliance" outcome
- ACME's `selectedOutcomes` = ["Security", "Performance"]
- Task outcome ("Compliance") is NOT in ACME's selected outcomes
- Therefore, task is not eligible and won't be added during sync

## Solution Options

### Option 1: Update Customer's Selected Outcomes (Recommended)

**When to use**: New outcome is relevant for this customer

**Steps**:
1. Go to ACME customer page
2. Click "Edit" on Network Management product assignment
3. In the Edit Entitlements dialog:
   - Add "Compliance" to the selected outcomes
   - Click "Save"
4. This will regenerate the adoption plan with the new outcome included
5. The new task will now appear

**Result**: 
- ✅ Task becomes eligible
- ✅ Appears in adoption plan
- ✅ Customer can now work on compliance tasks

### Option 2: Add New Outcome to Existing Task Outcomes

**When to use**: Task applies to multiple outcomes

**Steps**:
1. Go to Network Management product
2. Edit the task
3. Instead of creating separate task, add "Compliance" as an additional outcome to existing task
4. Task now has: ["Security", "Performance", "Compliance"]
5. Click sync on ACME adoption plan

**Result**:
- ✅ Task already eligible (has Security or Performance)
- ✅ Task updates with new Compliance outcome added
- ✅ All customers with Security or Performance see the task

### Option 3: Make Task Multi-Outcome

**When to use**: Task is foundational and applies to multiple outcomes

**Steps**:
1. Edit the new task "Implement Audit Logging"
2. Add multiple outcomes: ["Security", "Compliance"] (or whichever are relevant)
3. Click sync on ACME adoption plan

**Result**:
- ✅ If customer has Security selected, task appears
- ✅ If customer has Compliance selected, task appears
- ✅ Task serves multiple outcomes

### Option 4: Create Separate Compliance Track

**When to use**: Compliance is a major new initiative

**Steps**:
1. Keep the new Compliance outcome and tasks
2. Create a new product version (e.g., "Network Management v2.0")
3. Or notify customers that Compliance outcome is now available
4. Customers opt-in by editing their product assignment

**Result**:
- ✅ Customers explicitly choose to adopt Compliance track
- ✅ Clean separation of concerns
- ✅ Controlled rollout

## Business Logic Explanation

### Why Outcomes Are Filtered

The system is designed so that:

1. **Products have many possible outcomes**
   - Example: Security, Performance, Reliability, Compliance, Cost Optimization

2. **Customers select which outcomes they care about**
   - ACME might select: Security, Performance
   - BetaCorp might select: Reliability, Cost Optimization

3. **Tasks are tagged with outcomes they address**
   - "Enable MFA" → Security
   - "Implement Caching" → Performance
   - "Set up Monitoring" → Reliability

4. **Adoption plans show only relevant tasks**
   - ACME sees tasks for Security & Performance
   - BetaCorp sees tasks for Reliability & Cost Optimization

### Benefits of This Design

✅ **Focused adoption plans**
- Customers only see tasks relevant to their goals
- Reduces overwhelm and noise
- Higher completion rates

✅ **Flexible product packaging**
- Different customers get different experiences
- Same product serves multiple use cases
- Easy to customize per customer

✅ **Controlled rollout**
- New outcomes can be added without forcing on all customers
- Customers opt-in to new capabilities
- Gradual adoption

## How to Check Task Eligibility

Run this diagnostic script:

```javascript
// check-task-eligibility.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEligibility() {
  const customer = await prisma.customer.findFirst({
    where: { name: 'ACME Corp' },
    include: {
      products: {
        include: {
          product: {
            include: {
              tasks: {
                include: {
                  outcomes: { include: { outcome: true } },
                },
              },
            },
          },
          selectedOutcomes: true,
        },
      },
    },
  });

  const customerProduct = customer.products[0];
  const selectedOutcomeIds = customerProduct.selectedOutcomes.map(o => o.id);

  console.log(`Customer: ${customer.name}`);
  console.log(`Selected Outcomes: ${customerProduct.selectedOutcomes.map(o => o.name).join(', ')}`);
  console.log('\nTask Eligibility:');

  for (const task of customerProduct.product.tasks) {
    const taskOutcomeIds = task.outcomes.map(o => o.outcomeId);
    const hasMatch = taskOutcomeIds.some(id => selectedOutcomeIds.includes(id));
    const outcomeNames = task.outcomes.map(o => o.outcome.name).join(', ');
    
    console.log(`${hasMatch ? '✅' : '❌'} ${task.name}`);
    console.log(`   Outcomes: ${outcomeNames}`);
  }
}

checkEligibility().then(() => prisma.$disconnect());
```

## Frontend Implications

### Edit Entitlements Dialog

When admin edits product assignment:

1. **Outcomes Multi-Select**
   - Shows all available outcomes from product
   - Customer can add/remove outcomes
   - Changing outcomes regenerates adoption plan

2. **Preview Impact**
   - Could show: "Adding Compliance will add 5 new tasks"
   - Could show: "Removing Performance will remove 8 tasks"
   - Helps admin understand impact

### Product Management

When creating/editing tasks:

1. **Outcome Assignment**
   - Admin can assign multiple outcomes to one task
   - Encourages reuse and multi-purpose tasks
   - Better than creating duplicate tasks

2. **Coverage Report**
   - Show which outcomes have how many tasks
   - Identify gaps: "Compliance has only 2 tasks"
   - Balance task distribution

## Summary

### The Issue
- ❌ New task didn't appear in adoption plan after sync
- ✅ This is correct behavior (not a bug)

### The Reason
- Task has new "Compliance" outcome
- Customer hasn't selected "Compliance" outcome
- Task filtered out by eligibility rules

### The Fix
- **Option A**: Add "Compliance" to customer's selected outcomes (via Edit Entitlements)
- **Option B**: Add "Compliance" to existing tasks (multi-outcome approach)
- **Option C**: Make outcome optional (business decision)

### Key Principle
**Outcomes are a filtering mechanism**: Customers only see tasks for outcomes they've selected. This is intentional and provides focused, relevant adoption plans.

### Next Steps
1. Decide which outcome approach fits your business model
2. Update customer's selected outcomes if needed
3. Consider UX improvements to make outcome impact clearer
4. Document outcome selection guidance for admins

---

**Status**: ✅ Explained - Working as designed
**Action Required**: Update customer's selected outcomes to include new outcome
