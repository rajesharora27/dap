# Sync and Product Tasks Fixes

## ✅ Both Issues Fixed!

### Issue 1: Product Sync Changing Assignment Parameters ✅

**Problem:** When syncing an adoption plan to reflect product changes, the sync operation was automatically updating the customer's assignment parameters (licenseLevel, selectedOutcomes, selectedReleases).

**Impact:**
- Customer's manual selections were being overwritten
- All product outcomes and releases were being auto-selected
- Lost customer-specific customizations

**Root Cause:**
In `backend/src/schema/resolvers/customerAdoption.ts`, the `syncAdoptionPlan` mutation was:
1. Getting ALL product outcomes and releases
2. Updating the `CustomerProduct` record to include all of them
3. Updating the `AdoptionPlan` with these expanded selections

**Fix:**
Modified the sync logic to ONLY update tasks, NOT assignment parameters:

```typescript
// BEFORE (lines 898-918):
const allProductOutcomeIds = customerProduct.product.outcomes.map((o: any) => o.id);
const allProductReleaseIds = customerProduct.product.releases.map((r: any) => r.id);

await prisma.customerProduct.update({
  where: { id: customerProduct.id },
  data: {
    selectedOutcomes: allProductOutcomeIds,
    selectedReleases: allProductReleaseIds,
  },
});

// AFTER (lines 894-897):
// Use customer's ORIGINAL selections - do NOT modify assignment parameters
// Sync should only update tasks, not customer's outcome/release selections
const selectedOutcomeIds = (customerProduct.selectedOutcomes as string[]) || [];
const selectedReleaseIds = (customerProduct.selectedReleases as string[]) || [];
```

Also removed updating `licenseLevel` and `selectedOutcomes` in the adoption plan update (lines 1105-1111):

```typescript
// Update adoption plan - ONLY update progress and sync time
// Do NOT update licenseLevel or selectedOutcomes - those are assignment parameters
const updatedPlan = await prisma.adoptionPlan.update({
  where: { id: adoptionPlanId },
  data: {
    ...progress,
    lastSyncedAt: new Date(),
  },
```

**Result:**
- ✅ Sync only adds/removes/updates tasks based on product changes
- ✅ Customer's selected outcomes remain unchanged
- ✅ Customer's selected releases remain unchanged
- ✅ Customer's license level remains unchanged
- ✅ Only progress metrics and task lists are updated

---

### Issue 2: Product Tasks Not Showing in Solution Adoption Plan ✅

**Problem:** When viewing a solution adoption plan, product tasks were not visible.

**Impact:**
- Solution adoption plans only showed solution-level tasks (e.g., 6-9 tasks)
- Product tasks (e.g., 10-14 tasks per product) were hidden
- Users couldn't see the complete picture of what needs to be done

**Root Cause:**
The `CustomerProduct` records for products within solutions were using simple names like:
- "ACME Cisco Secure Access"
- "Chase Cisco SD-WAN"

But the `productAdoptionPlan` resolver in `backend/src/schema/resolvers/solutionAdoption.ts` expects names to follow the pattern:
- `"{SolutionName} - {ProductName}"`

For example:
- "ACME Hybrid Private Access Deployment - Cisco Secure Access Sample"
- "Chase SASE Platform - Cisco SD-WAN"

**Fix:**
Updated the sample data SQL to use the correct naming pattern:

```sql
-- BEFORE:
'ACME Cisco Secure Access'
'ACME Cisco Duo MFA'
'Chase Cisco SD-WAN'

-- AFTER:
'ACME Hybrid Private Access Deployment - Cisco Secure Access Sample'
'ACME Hybrid Private Access Deployment - Cisco Duo'
'Chase SASE Platform - Cisco SD-WAN'
```

**Result:**
- ✅ Product adoption plans are now properly linked to solution adoption plans
- ✅ Frontend can query: `solutionAdoptionPlan.products.productAdoptionPlan.tasks`
- ✅ Complete view of all tasks (solution + product tasks)

---

## Architecture Overview

### How Solution Adoption Plans Work

```
SolutionAdoptionPlan
├── tasks (CustomerSolutionTask[])              ← Solution-level tasks only
├── products (SolutionAdoptionProduct[])
│   ├── Product 1
│   │   └── productAdoptionPlan (AdoptionPlan)
│   │       └── tasks (CustomerTask[])          ← Product 1 tasks
│   ├── Product 2
│   │   └── productAdoptionPlan (AdoptionPlan)
│   │       └── tasks (CustomerTask[])          ← Product 2 tasks
│   └── Product 3
│       └── productAdoptionPlan (AdoptionPlan)
│           └── tasks (CustomerTask[])          ← Product 3 tasks
```

### Task Distribution Example: ACME Hybrid Private Access

**Solution-Level Tasks:** 6 tasks
- Solution Architecture Planning
- Identity Provider Integration
- Zero Trust Policy Framework
- Cross-Component Integration Testing
- User Experience Optimization
- Security Analytics Dashboard
- Compliance Validation
- End-to-End Testing

**Product Tasks:**
- Cisco Secure Access Sample: 3 tasks
- Cisco Duo: 4 tasks  
- Cisco Secure Firewall: 3 tasks

**Total:** 6 solution tasks + 10 product tasks = **16 tasks** for complete solution deployment

---

## GraphQL Query for Complete Task View

To get all tasks (solution + product) in a solution adoption plan:

```graphql
query GetSolutionAdoptionPlan($id: ID!) {
  solutionAdoptionPlan(id: $id) {
    id
    solutionName
    totalTasks
    completedTasks
    progressPercentage
    
    # Solution-level tasks
    tasks {
      id
      name
      status
      sequenceNumber
    }
    
    # Product adoption plans with their tasks
    products {
      id
      productName
      totalTasks
      completedTasks
      productAdoptionPlan {
        id
        tasks {
          id
          name
          status
          sequenceNumber
        }
      }
    }
  }
}
```

---

## Testing

### Test 1: Verify Product Names
```bash
docker exec dap_db_1 psql -U postgres -d dap -c "
  SELECT id, name 
  FROM \"CustomerProduct\" 
  WHERE name LIKE '%Hybrid Private Access%' OR name LIKE '%SASE%'
  ORDER BY name;
"

# Expected output:
# ACME Hybrid Private Access Deployment - Cisco Duo
# ACME Hybrid Private Access Deployment - Cisco Secure Access Sample
# ACME Hybrid Private Access Deployment - Cisco Secure Firewall
# Chase SASE Platform - Cisco Duo
# Chase SASE Platform - Cisco SD-WAN
# Chase SASE Platform - Cisco Secure Access Sample
```

### Test 2: Verify Product Adoption Plans Are Linked
```bash
docker exec dap_db_1 psql -U postgres -d dap -c "
  SELECT 
    cp.name as product_assignment,
    ap.id as adoption_plan_id,
    COUNT(ct.id) as task_count
  FROM \"CustomerProduct\" cp
  LEFT JOIN \"AdoptionPlan\" ap ON cp.id = ap.\"customerProductId\"
  LEFT JOIN \"CustomerTask\" ct ON ap.id = ct.\"adoptionPlanId\"
  WHERE cp.name LIKE '%Hybrid Private Access%' OR cp.name LIKE '%SASE%'
  GROUP BY cp.name, ap.id
  ORDER BY cp.name;
"

# Should show adoption plans with task counts for each product
```

### Test 3: Test Sync Without Changing Parameters
1. Go to a customer product
2. Note the selected outcomes and releases
3. Click "Sync" to sync with product changes
4. Verify outcomes and releases are unchanged
5. Verify only tasks were updated

---

## Files Modified

1. **`/data/dap/backend/src/schema/resolvers/customerAdoption.ts`**
   - Lines 894-897: Removed auto-update of customer selections
   - Lines 1105-1111: Removed licenseLevel and selectedOutcomes from sync update
   - Lines 1130-1134: Removed newOutcomes/newReleases from audit log

2. **`/data/dap/create-complete-sample-data.sql`**
   - Lines 667, 679, 691: Updated ACME product names to include solution name
   - Lines 705, 717, 729: Updated Chase product names to include solution name
   - Added comment explaining naming pattern requirement

---

## Benefits

### Issue 1 Fix (Sync):
- ✅ Customer customizations are preserved
- ✅ Sync operations are safer and more predictable
- ✅ Only product-level changes affect adoption plans
- ✅ Assignment parameters remain under customer control

### Issue 2 Fix (Product Tasks):
- ✅ Complete visibility of all tasks in a solution
- ✅ Proper tracking of product-level progress
- ✅ Accurate total task counts
- ✅ Better user experience when managing solutions

---

## Status
✅ **BOTH ISSUES FIXED!**
- Product sync no longer changes assignment parameters
- Product tasks now properly linked and visible in solution adoption plans



