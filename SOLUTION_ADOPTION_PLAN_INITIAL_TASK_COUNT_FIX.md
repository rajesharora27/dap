# Solution Adoption Plan Initial Task Count Fix

## Problem
When a solution adoption plan was loaded initially, the task counts shown by progress bars were incorrect. The counts would only become correct after running a sync operation.

## Root Cause
The `createSolutionAdoptionPlan` mutation was:
1. Creating the solution adoption plan with only solution-level task counts
2. Creating product adoption plans for underlying products
3. **BUT** not aggregating the product task counts back into the solution adoption plan

This resulted in:
- **Initial load**: Only solution task counts (e.g., 9 tasks from solution)
- **After sync**: Correct aggregated counts (e.g., 9 solution tasks + 36 product tasks = 45 total)

## Solution
Modified `/data/dap/backend/src/schema/resolvers/solutionAdoption.ts` in the `createSolutionAdoptionPlan` mutation to add a new step after creating product adoption plans:

### New Aggregation Logic
```typescript
// STEP: Aggregate product adoption plan progress into solution adoption plan
// Re-fetch customer products with their newly created adoption plans
const customerProductsWithPlans = await prisma.customerProduct.findMany({
  where: {
    customerId: customerSolution.customerId,
    name: {
      startsWith: `${customerSolution.name} - `
    }
  },
  include: {
    adoptionPlan: {
      include: {
        tasks: true
      }
    }
  }
});

// Calculate aggregated totals: solution tasks + product tasks
let totalTasksWithProducts = progress.totalTasks; // Solution tasks
let totalWeightWithProducts = Number(progress.totalWeight); // Solution weight

for (const cp of customerProductsWithPlans) {
  if (cp.adoptionPlan) {
    totalTasksWithProducts += cp.adoptionPlan.totalTasks;
    totalWeightWithProducts += Number(cp.adoptionPlan.totalWeight);
  }
}

// Update solution adoption plan with aggregated totals
await prisma.solutionAdoptionPlan.update({
  where: { id: adoptionPlan.id },
  data: {
    totalTasks: totalTasksWithProducts,
    totalWeight: totalWeightWithProducts
  }
});

// Update SolutionAdoptionProduct records with actual product adoption plan data
for (const cp of customerProductsWithPlans) {
  if (cp.adoptionPlan) {
    const solutionProduct = await prisma.solutionAdoptionProduct.findFirst({
      where: {
        solutionAdoptionPlanId: adoptionPlan.id,
        productId: cp.productId
      }
    });
    
    if (solutionProduct) {
      await prisma.solutionAdoptionProduct.update({
        where: { id: solutionProduct.id },
        data: {
          totalTasks: cp.adoptionPlan.totalTasks,
          totalWeight: Number(cp.adoptionPlan.totalWeight),
          status: cp.adoptionPlan.totalTasks > 0 ? 'NOT_STARTED' : 'NOT_STARTED'
        }
      });
    }
  }
}
```

## What Changed
1. **After creating product adoption plans**, the code now re-fetches them with their task data
2. **Aggregates task counts** from all product adoption plans into the solution adoption plan
3. **Updates `SolutionAdoptionProduct` records** with actual task counts from product adoption plans
4. **Console logging** now shows: "Solution adoption plan created with X solution tasks + Y product tasks = Z total tasks"

## Result
- ✅ Initial load now shows correct task counts in all progress bars
- ✅ Solution adoption plan includes both solution and product tasks
- ✅ Each product within the solution shows its correct task count
- ✅ No sync required to see accurate data
- ✅ Consistent behavior between initial load and sync

## Testing
To verify the fix:
1. Run `./dap clean-restart` to create fresh data
2. Navigate to a solution adoption plan (e.g., ACME's Hybrid Private Access)
3. Verify progress bars show correct counts:
   - Overall solution progress bar
   - Individual product progress bars
   - Solution-specific tasks progress bar
4. All counts should be correct immediately, without needing to sync

## Example Output
**ACME - Hybrid Private Access:**
- Solution tasks: 9
- Cisco Secure Access Sample tasks: 12
- Cisco Duo tasks: 12
- Cisco Secure Firewall tasks: 12
- **Total: 45 tasks** ✅ (shown immediately on initial load)

**Chase - SASE:**
- Solution tasks: 8
- Cisco Secure Access Sample tasks: 12
- Cisco SD-WAN tasks: 14
- Cisco Duo tasks: 12
- **Total: 46 tasks** ✅ (shown immediately on initial load)

## Files Modified
- `/data/dap/backend/src/schema/resolvers/solutionAdoption.ts`
  - Modified `createSolutionAdoptionPlan` mutation (lines ~735-795)

## Date
October 26, 2025



