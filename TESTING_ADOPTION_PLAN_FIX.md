# Testing Guide: Adoption Plan Display Fix

## Quick Test in UI

### Prerequisites
- Application is running (`./dap status` shows all services running)
- Browser open to http://localhost:5173
- Clear browser cache (Ctrl+Shift+R)

### Test Steps

#### 1. Navigate to Customer Adoption Management
- Click on "Customer Adoption" in the navigation menu
- You should see the customer list

#### 2. Create or Select a Customer
**Option A: Use existing customer**
- Expand any existing customer in the list

**Option B: Create new customer**
- Click "Add Customer" button
- Enter customer name and description
- Click "Save"

#### 3. Assign a Product
- Click the "Assign Product" button for your selected customer
- **Step 1: Select Product**
  - Choose any product from the dropdown (e.g., "Retail Management App")
  - Click "Next"
  
- **Step 2: Configure License and Outcomes**
  - Select a license level (Essential, Advantage, or Signature)
  - Optionally select desired outcomes
  - Click "Next"
  
- **Step 3: Confirm**
  - Verify the "Create Adoption Plan Immediately" checkbox is **CHECKED** ✅
  - Click "Assign Product"

#### 4. Verify Adoption Plan is Displayed

**Expected Results** ✅:

1. **Product appears in customer's product list**
   - Expand the customer
   - You should see the assigned product listed

2. **Adoption plan info is visible**
   ```
   Product: Retail Management App
   License: Essential
   📊 Adoption Plan
      - Total Tasks: 15 (or the actual count)
      - Progress: 0%
      - Status: Not Started
   ```

3. **Sync button is visible**
   - Look for the sync icon button (🔄)
   - It should be enabled and clickable

4. **Can expand to see tasks**
   - Click the expand icon next to the product
   - You should see all tasks listed
   - Tasks should have:
     - Name
     - Status (NOT_STARTED initially)
     - Weight
     - Sequence number
     - License level badge (blue)
     - Release badges (purple)
     - Outcome badges (green)

### What Was Fixed

**Before the fix** ❌:
- Product assigned successfully
- But adoption plan not visible
- No sync button
- No task list
- Had to manually refresh page

**After the fix** ✅:
- Product assigned successfully
- Adoption plan immediately visible
- Sync button appears
- Task list expandable
- No page refresh needed

### If Test Fails

#### Issue: Product assigned but adoption plan not visible

**Possible causes**:
1. **Browser cache not cleared**
   - Solution: Press Ctrl+Shift+R to hard refresh
   - Or open in Incognito/Private window (Ctrl+Shift+N)

2. **"Create Adoption Plan Immediately" was unchecked**
   - Solution: Assign product again, ensure checkbox is checked
   - Or manually create adoption plan using sync button

3. **Frontend not restarted**
   - Solution: `./dap restart frontend`

4. **Backend not up-to-date**
   - Solution: `./dap restart`

#### Issue: Sync button not visible

**Check**:
1. Is adoption plan created? (should see task count and progress)
2. Is `needsSync` flag set? (run database query)
3. Are you looking at the right component? (CustomerAdoptionPanelV4)

### Automated Test

Run the automated test to verify the fix:

```bash
cd /data/dap
node test-adoption-plan-display.js
```

**Expected output**:
```
🎉 TEST SUITE PASSED - Fix verified!
```

If test fails, check:
- Backend is running on port 4000
- Database is accessible
- GraphQL endpoint is responding

### Database Verification

If you want to verify at the database level:

```bash
# Check adoption plans exist
docker exec dap_db_1 psql -U postgres -d dap -c "SELECT id, \"customerProductId\", \"totalTasks\", \"progressPercentage\" FROM \"AdoptionPlan\" LIMIT 5;"

# Check customer products have adoption plans
docker exec dap_db_1 psql -U postgres -d dap -c "SELECT cp.id, cp.\"customerId\", cp.\"productId\", cp.\"licenseLevel\", ap.id as plan_id FROM \"CustomerProduct\" cp LEFT JOIN \"AdoptionPlan\" ap ON ap.\"customerProductId\" = cp.id;"
```

### GraphQL Playground Test

Test directly in GraphQL playground (http://localhost:4000/graphql):

```graphql
# 1. Get customers with adoption plans
query GetCustomers {
  customers {
    id
    name
    products {
      id
      product {
        name
      }
      adoptionPlan {
        id
        totalTasks
        progressPercentage
      }
    }
  }
}

# 2. Assign product and check response
mutation AssignProduct {
  assignProductToCustomer(input: {
    customerId: "YOUR_CUSTOMER_ID"
    productId: "retail-app-001"
    licenseLevel: Essential
    selectedOutcomeIds: []
  }) {
    id
    adoptionPlan {    # ← This should now be present
      id
      totalTasks
    }
  }
}

# 3. Create adoption plan
mutation CreatePlan {
  createAdoptionPlan(customerProductId: "YOUR_CUSTOMER_PRODUCT_ID") {
    id
    totalTasks
    completedTasks
    progressPercentage
  }
}
```

## Troubleshooting

### Cache Issues

**Symptom**: Old data showing, adoption plan not updating

**Solutions**:
1. Hard refresh: Ctrl+Shift+R
2. Clear browser cache completely
3. Open in Private/Incognito window
4. Disable cache in DevTools (Network tab → Disable cache)

### Data Not Syncing

**Symptom**: Assignment succeeds but UI doesn't update

**Check**:
1. Are refetchQueries working?
   - Open browser DevTools → Network tab
   - Assign product
   - Look for GetCustomers query after mutation
   - Should see two requests: mutation + refetch

2. Is mutation returning adoptionPlan?
   - Open browser DevTools → Network tab
   - Find assignProductToCustomer mutation
   - Check response includes adoptionPlan field

### Backend Issues

**Symptom**: Mutations fail or return errors

**Check logs**:
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log
```

**Common errors**:
- "Adoption plan already exists" → Customer product already has a plan
- "Customer product not found" → Invalid customerProductId
- "Task not found" → Product has no tasks (check sample data)

## Success Criteria

✅ Product assignment works
✅ Adoption plan created automatically (when checkbox checked)
✅ Adoption plan visible immediately (no refresh)
✅ Task count and progress shown
✅ Sync button visible and functional
✅ Can expand to see task list
✅ Tasks have all metadata (badges, releases, outcomes)
✅ Status dropdown works for tasks
✅ Filters work (release, license, outcome)

---

**Test Date**: October 15, 2025
**Version**: 2.1.0
**Status**: ✅ All tests passing
