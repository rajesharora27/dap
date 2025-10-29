# Clean-Restart Adoption Plan Fix

## ✅ Issue Resolved!

### Problem
1. `./dap clean-restart` did not create adoption plans after loading sample data
2. Solution adoption plans showed 0 tasks or incorrect counts
3. Users had to manually run `./dap add-sample` after `clean-restart`

### Root Cause
The `clean_restart()` function was:
1. Loading sample data (products, solutions, customers, and assignments) via SQL
2. Starting backend and frontend services
3. **BUT NOT creating adoption plans** ❌

This meant:
- `CustomerSolution` and `CustomerProduct` records existed
- But no `AdoptionPlan` or `SolutionAdoptionPlan` records were created
- Users couldn't see any tasks in the adoption plans

### Solution
Modified the `clean_restart()` function to automatically call `create_adoption_plans()` after starting the backend:

```bash
# Start services
echo ""
start_backend || exit 1
start_frontend || exit 1

# Wait for backend to be ready and create adoption plans
echo ""
log_info "Creating adoption plans for all customer assignments..."
sleep 3  # Give backend time to fully initialize

if ! create_adoption_plans; then
    log_warning "⚠️  Failed to create adoption plans automatically"
    log_info "You can create them manually by running: ./dap add-sample"
fi
```

## Verification Results

### Solution Adoption Plans ✅
```
┌─────────────────────────┬──────────┬────────────┬─────────────┐
│ Solution                │ Customer │ Total Tasks│ Total Weight│
├─────────────────────────┼──────────┼────────────┼─────────────┤
│ Hybrid Private Access   │ ACME     │ 6          │ 62.50       │
│ SASE                    │ Chase    │ 9          │ 97.50       │
└─────────────────────────┴──────────┴────────────┴─────────────┘
```

### Product Adoption Plans ✅
```
┌──────────┬────────────────────────────┬───────┐
│ Customer │ Product                    │ Tasks │
├──────────┼────────────────────────────┼───────┤
│ ACME     │ Cisco Duo                  │ 4     │
│ ACME     │ Cisco Secure Access Sample │ 3     │
│ ACME     │ Cisco Secure Firewall      │ 3     │
│ Chase    │ Cisco Duo                  │ 2     │
│ Chase    │ Cisco SD-WAN               │ 2     │
│ Chase    │ Cisco Secure Access Sample │ 2     │
└──────────┴────────────────────────────┴───────┘
```

### Overall Statistics ✅
```
✅ 8 Adoption Plans Created:
   - 6 Product Plans (16 total tasks)
   - 2 Solution Plans (15 total tasks)

✅ 31 Task Instances with Telemetry:
   - 16 Product Task instances
   - 15 Solution Task instances

✅ All task counts are correct!
```

## Testing

### Quick Test
```bash
# 1. Clean restart (will automatically create adoption plans)
./dap clean-restart

# 2. Verify solution adoption plans
docker exec dap_db_1 psql -U postgres -d dap -c "
  SELECT s.name, sap.\"totalTasks\", sap.\"totalWeight\"
  FROM \"SolutionAdoptionPlan\" sap
  JOIN \"CustomerSolution\" cs ON sap.\"customerSolutionId\" = cs.id
  JOIN \"Solution\" s ON cs.\"solutionId\" = s.id;
"

# Expected output:
#        name           | totalTasks | totalWeight
# ----------------------+------------+-------------
#  Hybrid Private Access |     6      |   62.50
#  SASE                  |     9      |   97.50
```

### Verify in Browser
1. Navigate to http://localhost:5173
2. Go to Customers → ACME → Solutions
3. Click on "Hybrid Private Access"
4. You should see **6 solution tasks** listed
5. Go to Customers → Chase → Solutions
6. Click on "SASE"
7. You should see **9 solution tasks** listed

## What Happens Now

### After `./dap clean-restart`:
1. ✅ Database is cleaned
2. ✅ Sample data is loaded (products, solutions, customers, assignments)
3. ✅ Backend starts
4. ✅ Frontend starts
5. ✅ **Adoption plans are automatically created** (NEW!)
6. ✅ Solution adoption plans show correct task counts
7. ✅ Product adoption plans show correct task counts

### User Experience
- Users can now run `./dap clean-restart` and immediately see all adoption plans with correct task counts
- No need to manually run `./dap add-sample` afterwards
- One command does everything!

## Comparison: Before vs After

### Before ❌
```bash
$ ./dap clean-restart
# ... database cleaned, services started ...
# ❌ NO adoption plans created

# User has to manually run:
$ ./dap add-sample
# ... now adoption plans are created ...
```

### After ✅
```bash
$ ./dap clean-restart
# ... database cleaned, services started ...
# ✅ Adoption plans automatically created!
# ✅ Solution plans have correct task counts!
# ✅ Ready to use immediately!
```

## Benefits
1. **Better UX:** One command does everything
2. **Correct Data:** Task counts are accurate from the start
3. **Faster Setup:** No need for extra commands
4. **Consistent State:** Database is always in a complete, usable state after clean-restart

## Technical Details

### Task Count Calculation
Solution adoption plans correctly calculate task counts by:
1. Filtering solution tasks by license level (hierarchical)
2. Filtering by selected outcomes (must match at least one)
3. Filtering by selected releases (must match at least one)
4. Creating `CustomerSolutionTask` records for each eligible task
5. Calculating total weight and task count

### Example: ACME Hybrid Private Access
- License Level: **ADVANTAGE**
- Selected Outcomes: `["outcome-hpa-secure-work", "outcome-hpa-zero-trust", "outcome-hpa-compliance"]`
- Selected Releases: `["rel-hpa-1.0"]`
- **Result:** 6 tasks (out of 8 total HPA tasks)
  - 2 tasks excluded because they require **SIGNATURE** license or **rel-hpa-2.0** release

### Example: Chase SASE
- License Level: **SIGNATURE** (highest)
- Selected Outcomes: `["outcome-sase-cloud-native", "outcome-sase-global-perf", "outcome-sase-simplified-mgmt"]`
- Selected Releases: `["rel-sase-1.0", "rel-sase-2.0"]`
- **Result:** 9 tasks (all SASE tasks included)
  - All tasks included because SIGNATURE license has access to everything

## Files Modified
- `/data/dap/dap` - Updated `clean_restart()` function to automatically create adoption plans

## Status
✅ **FIXED** - `./dap clean-restart` now creates adoption plans automatically with correct task counts!



