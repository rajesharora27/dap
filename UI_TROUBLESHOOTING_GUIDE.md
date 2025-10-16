# URGENT: UI Not Showing Adoption Plan - Troubleshooting Guide

## Current Status

✅ **Backend is working correctly** - All customer-products have adoption plans in database
✅ **GraphQL queries return correct data** - Verified with debug scripts
❌ **Frontend UI not displaying adoption plans** - Need to investigate browser state

## Quick Diagnostic Steps

### Step 1: Check What You're Seeing

Open the browser at http://localhost:5173 and:

1. **Click "Customers" in left menu**
   - Does the menu expand? ✓ / ✗
   - Do you see customers listed? ✓ / ✗
   - Is a customer auto-selected (highlighted)? ✓ / ✗

2. **Look at the main content area**
   - Do you see customer name at the top? ✓ / ✗
   - Do you see "Select Product" dropdown? ✓ / ✗
   - Are there products in the dropdown? ✓ / ✗

3. **Select a product from dropdown**
   - Does anything appear below? ✓ / ✗
   - Do you see "Adoption Progress" card? ✓ / ✗
   - Do you see a Sync button? ✓ / ✗

### Step 2: Check Browser Console

1. **Open Browser DevTools**: Press `F12` or `Ctrl+Shift+I`
2. **Go to Console tab**
3. **Look for messages starting with**:
   - `[CustomerAdoptionPanelV4] Debug:`
   - `[CustomerAdoptionPanelV4] Auto-selecting first product:`

4. **What do you see?**
   - If you see debug logs, copy them
   - If you see errors (red text), copy those too

### Step 3: Clear Browser Cache PROPERLY

**This is CRITICAL** - Old cached JavaScript might be running:

1. **Hard Refresh**: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. **If that doesn't work, do a FULL clear**:
   - Press `F12` to open DevTools
   - Right-click the Refresh button
   - Select "Empty Cache and Hard Reload"
3. **If THAT doesn't work, use Incognito**:
   - Press `Ctrl+Shift+N` (Chrome) or `Ctrl+Shift+P` (Firefox)
   - Navigate to http://localhost:5173
   - Test there

### Step 4: Check Network Tab

1. **Open DevTools** (`F12`)
2. **Go to Network tab**
3. **Refresh the page**
4. **Filter by "graphql"**
5. **Look for "GetCustomers" query**
6. **Click on it and check the Response**:
   ```json
   {
     "data": {
       "customers": [
         {
           "id": "...",
           "name": "Acme Corporation",
           "products": [
             {
               "id": "...",
               "product": { "id": "...", "name": "Retail Management App" },
               "adoptionPlan": {  ← SHOULD BE HERE
                 "id": "...",
                 "totalTasks": 12
               }
             }
           ]
         }
       ]
     }
   }
   ```

7. **Is `adoptionPlan` present in the response?**
   - ✓ YES → Frontend issue, continue to Step 5
   - ✗ NO → Backend issue, need to restart backend

### Step 5: Verify Backend is Latest Version

```bash
cd /data/dap
./dap restart
```

Wait for services to start, then try again.

## Debug Tools Available

### 1. Debug Script (Terminal)
```bash
cd /data/dap
node debug-customer-data.js
```

**Expected Output**:
```
✅ All customer-products have adoption plans!
```

### 2. Debug UI (Browser)
```bash
# Serve the debug HTML file
cd /data/dap
python3 -m http.server 8080
```

Then open: http://localhost:8080/debug-ui.html

Should show all customers with adoption plans highlighted in green.

### 3. GraphQL Playground

Open: http://localhost:4000/graphql

Run this query:
```graphql
query GetCustomers {
  customers {
    id
    name
    products {
      id
      product {
        id
        name
      }
      licenseLevel
      adoptionPlan {
        id
        totalTasks
        completedTasks
        progressPercentage
      }
    }
  }
}
```

**Every product should have an `adoptionPlan` that is NOT null.**

## Common Issues & Solutions

### Issue 1: "No product selected" message

**Symptoms**:
- Customer is selected
- Products exist in dropdown
- But nothing is auto-selected

**Solution**:
```bash
# Check browser console for logs
# Look for: [CustomerAdoptionPanelV4] Auto-selecting first product: ...
# If missing, clear cache and refresh
```

### Issue 2: "No adoption plan found" message

**Symptoms**:
- Product is selected
- But adoption plan not showing

**Check**:
1. Look at the detailed error message in the UI
2. Check if `adoptionPlanId` is NULL
3. Check if `selectedCustomerProduct` is found

**Solution**:
```bash
# This means the adoption plan exists but isn't being found
# Check product IDs match
node debug-customer-data.js
```

### Issue 3: Dropdown shows products but empty

**Symptoms**:
- Dropdown opens
- No products listed

**Solution**:
```bash
# Customer has no products assigned
# Assign a product first
```

### Issue 4: Nothing works after assigning product

**Symptoms**:
- Assign product succeeds
- But adoption plan doesn't appear

**Solution**:
1. Check "Create Adoption Plan Immediately" was CHECKED
2. Wait 2-3 seconds for refetch
3. Manually refresh dropdown (change selection)
4. If still nothing, restart frontend:
```bash
cd /data/dap
./dap restart frontend
```

## Expected UI Flow (What SHOULD Happen)

1. **Click "Customers"**
   → Menu expands
   → First customer is auto-selected
   → Customer name appears in main area

2. **Products dropdown**
   → Shows all assigned products
   → First product is AUTO-SELECTED
   → Adoption plan appears immediately

3. **Adoption Plan Display**
   → "Adoption Progress" card shows:
     - License level chip
     - Progress bar
     - X / Y tasks completed
     - Progress percentage
   → Sync button visible (🔄)
   → Task table below with all tasks

## Files to Check

If you need to modify code yourself:

1. **Frontend Component**:
   `/data/dap/frontend/src/components/CustomerAdoptionPanelV4.tsx`
   - Lines 260-292: Customer/product selection logic
   - Lines 610-625: Sync button rendering
   - Lines 628-695: Adoption plan display

2. **Backend Resolver**:
   `/data/dap/backend/src/schema/resolvers/customerAdoption.ts`
   - Lines 398-415: assignProductToCustomer mutation

3. **Frontend Dialog**:
   `/data/dap/frontend/src/components/dialogs/AssignProductDialog.tsx`
   - Lines 50-80: Mutation definitions
   - Lines 107-115: RefetchQueries configuration

## What We Fixed

✅ Enhanced GraphQL mutations to include `adoptionPlan` field
✅ Added `refetchQueries` to both mutations
✅ Added `adoptionPlan: true` to backend include
✅ Customer menu always expands (no toggle)
✅ First customer auto-selected
✅ First product auto-selected ← NEW
✅ Added debug logging
✅ Added detailed error messages in UI

## Next Steps

1. **Clear browser cache** (most important!)
2. **Open browser console** to see debug logs
3. **Check Network tab** for GraphQL responses
4. **Share console logs** if still not working
5. **Take screenshot** of what you see

## Contact Information

If still not working after these steps, provide:
1. Screenshot of UI
2. Browser console logs
3. Output of `node debug-customer-data.js`
4. Network tab showing GetCustomers response

---

**Last Updated**: October 15, 2025
**Status**: Investigating UI display issue
**Backend**: ✅ Working correctly
**Data**: ✅ All adoption plans exist
**Frontend**: ❓ Need to verify browser state
