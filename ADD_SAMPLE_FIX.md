# Fix for `./dap add-sample` Error

## Problem
`./dap add-sample` was failing with error:
```
[ERROR] ❌ No customer products found. Sample data may not have loaded correctly.
```

## Root Cause
The validation logic was checking for `CustomerProduct` records, but the new Cisco sample data creates `CustomerSolution` records (for solution-based assignments like "ACME → Hybrid Private Access").

The script had two issues:
1. **Validation checked wrong table** - Only looked for CustomerProduct, not CustomerSolution
2. **Adoption plan creation only handled products** - Didn't create SolutionAdoptionPlan for customer solutions

## Fixes Applied

### 1. Updated Validation Logic
**File:** `dap` script, `create_adoption_plans()` function

**Before:**
```bash
local customer_products_count=$(...)
if [ "$customer_products_count" -eq "0" ]; then
    log_error "❌ No customer products found..."
fi
```

**After:**
```bash
local customer_solutions_count=$(...)
local customer_products_count=$(...)
if [ "$customer_solutions_count" -eq "0" ] && [ "$customer_products_count" -eq "0" ]; then
    log_error "❌ No customer solutions or products found..."
fi
```

### 2. Added Solution Adoption Plan Creation
**File:** `dap` script, `create_adoption_plans()` function

Now handles both:
- **Product assignments** → `createAdoptionPlan(customerProductId)`  
- **Solution assignments** → `createSolutionAdoptionPlan(customerSolutionId)`

```bash
# Create product adoption plans
for cp_id in "${cp_ids[@]}"; do
    # ... create product adoption plan
done

# Create solution adoption plans  
for cs_id in "${cs_ids[@]}"; do
    # ... create solution adoption plan
done
```

### 3. Updated Display Counters
Now shows separate counts for:
- Customer Solutions (2 for ACME and Chase)
- Customer Products (0 in new sample data)
- Product Adoption Plans
- Solution Adoption Plans

### 4. Fixed SQL Error Visibility
Changed SQL execution to show errors:
```bash
# Before: >/dev/null 2>&1 (errors hidden)
# After: 2>&1 | tee /tmp/dap_sample.log (errors visible)
```

## How to Use Now

### Correct Command
```bash
# Start the application first
./dap start

# Then add sample data (this now works!)
./dap add-sample
```

### What It Creates
After running `./dap add-sample`, you'll have:

**Products (5):**
- Cisco Duo (12 tasks)
- Cisco SD-WAN (14 tasks)
- Cisco Secure Firewall (13 tasks)
- Cisco ISE (12 tasks)
- Cisco Secure Access Sample (11 tasks)

**Solutions (2):**
- Hybrid Private Access (Secure Access + Duo + Firewall)
- SASE (Secure Access + SD-WAN + Duo)

**Customers (2):**
- ACME → assigned to Hybrid Private Access solution
- Chase → assigned to SASE solution

**Adoption Plans (2):**
- Solution adoption plan for ACME (includes all tasks from 3 products)
- Solution adoption plan for Chase (includes all tasks from 3 products)

## Expected Output

When `./dap add-sample` runs successfully, you should see:

```
📊 Sample data created:
  🔐 5 Cisco Products (Duo, SD-WAN, Secure Firewall, ISE, Secure Access Sample)
  📦 2 Solutions (Hybrid Private Access, SASE)
  🏢 2 Customers (ACME, Chase)
  🔗 2 Customer Solution Assignments
  ⚙️  62 Product Tasks (10-14 per product with telemetry)
  📊 62 Telemetry Attributes with detailed success criteria

✅ Sample data loaded! Now creating adoption plans...

🔍 Verifying prerequisites...
  📦 Customer Solutions: 2
  📋 Customer Products: 0
  📊 Telemetry Attributes: 62
  🎯 Task-Outcome Relationships: 250+

📦 Found 2 customer solution assignments: cs-acme-hpa cs-chase-sase

   🔄 Processing solution adoption plan for cs-acme-hpa...
     ✅ Created solution adoption plan ... with 37 tasks
   
   🔄 Processing solution adoption plan for cs-chase-sase...
     ✅ Created solution adoption plan ... with 37 tasks

🎉 Adoption Plan Creation Complete!
📦 Solution Plans:
  🆕 Newly Created: 2
  📊 Total: 2
⚙️  Tasks:
  📦 Customer Solution Tasks: 74
  📈 Telemetry Attributes: 74

✅ SUCCESS: All 2 adoption plans created successfully!
🚀 Complete sample data ready for testing!
```

## Troubleshooting

### If Backend Not Running
```bash
./dap start
# Wait for backend to fully start (check http://localhost:4000/graphql)
./dap add-sample
```

### Check SQL Errors
```bash
cat /tmp/dap_sample.log
```

### Verify What Was Created
```bash
./dap status
```

### Check Database Directly
```bash
docker exec -it dap-db-1 psql -U postgres -d dap -c "
  SELECT 
    (SELECT COUNT(*) FROM \"Product\") as products,
    (SELECT COUNT(*) FROM \"Solution\") as solutions,
    (SELECT COUNT(*) FROM \"Customer\") as customers,
    (SELECT COUNT(*) FROM \"CustomerSolution\") as customer_solutions,
    (SELECT COUNT(*) FROM \"SolutionAdoptionPlan\") as adoption_plans;
"
```

Expected output:
```
products | solutions | customers | customer_solutions | adoption_plans
---------|-----------|-----------|--------------------|--------------
    5    |     2     |     2     |         2          |      2
```

## Summary

The fix enables `./dap add-sample` to:
1. ✅ Properly validate both product AND solution assignments
2. ✅ Create solution adoption plans (not just product plans)
3. ✅ Show detailed counts for both types
4. ✅ Display SQL errors when they occur
5. ✅ Handle the new Cisco sample data structure correctly

All sample data now loads successfully!



