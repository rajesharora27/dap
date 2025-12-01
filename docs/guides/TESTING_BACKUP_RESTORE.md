# Testing Backup & Restore - Quick Guide

## Method 1: Automated Test Script (Recommended)

I've created a comprehensive test script that automates the entire process:

### Run the Test

```bash
cd /data/dap
./test-backup-restore.sh
```

**What it does:**
1. ✅ Checks current database state
2. ✅ Creates a backup
3. ✅ Adds a test customer
4. ✅ Restores from backup
5. ✅ Verifies the test customer is gone
6. ✅ Lists all backups

**Note**: The script will ask for confirmation before restoring (since it deletes data).

---

## Method 2: Manual Testing via Web UI

### Step 1: Access Backup & Restore

1. Open your browser to the DAP application
2. Click **"Backup & Restore"** in the left sidebar (below Customers)

### Step 2: Create a Backup

1. Click the **"Create Backup"** button at the top
2. Wait 1-5 seconds for completion
3. You'll see a success message with the backup filename
4. The backup appears in the list below

**Example:**
```
✓ Backup created successfully: dap_backup_2025-11-03T22-15-30-123Z.sql
  Size: 397 KB
  Records: 2 customers, 6 products, 2 solutions, 133 tasks
```

### Step 3: Make a Test Change

1. Navigate to **Customers** section
2. Click **"Add Customer"** 
3. Create a customer named **"TEST RESTORE CUSTOMER"**
4. Add description: **"This should disappear after restore"**
5. Save the customer
6. Verify it appears in the customers list

### Step 4: Restore from Backup

1. Go back to **Backup & Restore** section
2. Find the backup you created in Step 2
3. Click the **blue "Restore" button** (circular arrow icon)
4. **Read the warning dialog carefully!**
5. Type **"RESTORE"** (case-sensitive) in the text field
6. Click **"Restore Database"**
7. Wait for the restore to complete
8. The page will automatically reload

### Step 5: Verify Restoration

1. Navigate to **Customers** section
2. Verify that **"TEST RESTORE CUSTOMER"** is gone
3. Verify all original customers are back
4. Verify all products and solutions are intact

**Success!** If the test customer is gone and original data is back, restore works! ✅

---

## Method 3: Manual Testing via GraphQL API

### Step 1: Create a Backup

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createBackup { success filename size message metadata { recordCounts { customers products } } } }"}' | jq '.'
```

**Expected Response:**
```json
{
  "data": {
    "createBackup": {
      "success": true,
      "filename": "dap_backup_2025-11-03T22-15-30-123Z.sql",
      "size": 397106,
      "message": "Backup created successfully: ...",
      "metadata": {
        "recordCounts": {
          "customers": 2,
          "products": 6
        }
      }
    }
  }
}
```

### Step 2: List Backups

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { listBackups { id filename timestamp size recordCounts { customers products solutions } } }"}' | jq '.'
```

### Step 3: Create Test Customer

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createCustomer(input: { name: \"TEST RESTORE CUSTOMER\", description: \"Test\" }) { id name } }"}' | jq '.'
```

### Step 4: Verify Customer Was Added

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { customers { id name } }"}' | jq '.data.customers[] | .name'
```

### Step 5: Restore from Backup

⚠️ **WARNING**: Replace `BACKUP_FILENAME` with the actual filename from Step 1!

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { restoreBackup(filename: \"dap_backup_2025-11-03T22-15-30-123Z.sql\") { success message recordsRestored { customers products } } }"}' | jq '.'
```

**Expected Response:**
```json
{
  "data": {
    "restoreBackup": {
      "success": true,
      "message": "Database restored successfully from ...",
      "recordsRestored": {
        "customers": 2,
        "products": 6
      }
    }
  }
}
```

### Step 6: Verify Restoration

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { customers { id name } }"}' | jq '.data.customers[] | .name'
```

**Expected**: "TEST RESTORE CUSTOMER" should NOT appear in the list

---

## Quick Health Checks

### Check Backend Status

```bash
curl http://localhost:4000/health | jq '.'
```

Expected: `{"status": "ok"}`

### Count Current Backups

```bash
ls -lh /data/dap/backend/temp/backups/*.sql 2>/dev/null | wc -l
```

### View Backup Metadata

```bash
cat /data/dap/backend/temp/backups/metadata/*.json | jq '.'
```

---

## Troubleshooting

### Backup Creation Fails

**Check container is running:**
```bash
podman ps | grep postgres
```

**Check backend logs:**
```bash
tail -50 /tmp/backend-startup.log
```

### Restore Fails

**Check if backup file exists:**
```bash
ls -lh /data/dap/backend/temp/backups/
```

**Try creating a fresh backup:**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createBackup { success filename } }"}' | jq '.'
```

### Web UI Not Showing Backup Section

**Hard refresh the browser:**
- Chrome/Firefox: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache if needed

**Check if frontend is running:**
```bash
curl http://localhost:3000
```

---

## Expected Test Results

### ✅ Success Indicators

1. **Backup Creation**:
   - Success message appears
   - File size is reasonable (100KB - 10MB depending on data)
   - Record counts match current database

2. **Backup Listing**:
   - All backups appear with metadata
   - Timestamps are correct
   - File sizes are shown

3. **Restore**:
   - Confirmation dialog appears
   - Success message after restore
   - Page reloads automatically
   - Data matches backup state

4. **Data Verification**:
   - Test customer is removed
   - Original customers are intact
   - Products and solutions are correct

### ❌ Failure Indicators

1. **"Command not found" errors**: PostgreSQL container issue
2. **"Permission denied" errors**: File system permissions issue
3. **"File not found" errors**: Backup directory issue
4. **Empty backup files (<1KB)**: Database dump failed

---

## Safe Testing Tips

1. ✅ **Always create a backup BEFORE testing restore**
2. ✅ **Test in development first, never in production**
3. ✅ **Keep at least 3 recent backups**
4. ✅ **Download important backups for offline storage**
5. ⚠️ **Restore DELETES all current data**
6. ⚠️ **Type "RESTORE" carefully (case-sensitive)**

---

## Next Steps After Testing

Once you've verified backup & restore works:

1. **Create a backup schedule** (daily/weekly)
2. **Set up automated backup cleanup** (keep last 10)
3. **Download critical backups** for disaster recovery
4. **Document your backup procedure** for your team
5. **Test restore periodically** to ensure backups are valid

---

**Questions or Issues?**

Check the comprehensive guide: `BACKUP_AND_RESTORE_GUIDE.md`

