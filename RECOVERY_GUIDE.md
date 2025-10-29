# Recovery Guide: Lost Data After clean-restart

## What Happened

The `./dap clean-restart` command is designed for **complete database reset** and deletes ALL data, including your manually created "Cisco Secure Access" product. This was not clearly documented before.

## Issues Fixed

1. ✅ **SQL errors now visible** - Previously hidden by `>/dev/null 2>&1`
2. ✅ **Added clear warnings** - 5-second countdown with warning messages
3. ✅ **Updated documentation** - Clear labels showing which commands preserve data
4. ✅ **Removed duplicate seeding** - Solutions are now only created once via SQL file

## How to Recover Your Data

### Option 1: If You Have a Backup
If you exported your "Cisco Secure Access" product data:
```bash
# Start the application
./dap start

# Import your backup via the frontend UI
# Go to Settings → Import/Export → Import Data
```

### Option 2: Recreate Your Product Manually
```bash
# Start the application
./dap start

# In the UI:
# 1. Go to Products
# 2. Click "Add Product"
# 3. Name: "Cisco Secure Access"
# 4. Add your description and custom attributes
# 5. Add tasks, licenses, outcomes, releases as needed
```

### Option 3: Load Sample Data + Add Your Custom Product
```bash
# Load the Cisco sample data (includes 5 products + solutions)
./dap add-sample

# Then add your custom "Cisco Secure Access" product via UI
```

## Correct Commands for Daily Use

### ✅ SAFE Commands (Preserve User Data)

**Add sample data without deleting existing data:**
```bash
./dap add-sample
```
This adds:
- 5 Cisco products (Duo, SD-WAN, Firewall, ISE, Secure Access Sample)
- 2 Solutions (Hybrid Private Access, SASE)
- 2 Customers (ACME, Chase)
- Does NOT delete your existing products

**Remove only sample data:**
```bash
./dap reset-sample
```
This removes:
- Sample products with IDs like `prod-cisco-*`
- Sample customers like `customer-acme`, `customer-chase`
- Sample solutions
- **Preserves** your manually created products

**Normal restart (keeps all data):**
```bash
./dap restart
```

### ⚠️ DESTRUCTIVE Command (Wipes Everything)

**Complete database reset:**
```bash
./dap clean-restart
```
- Deletes **EVERYTHING** including user-created products
- Now shows a 5-second warning with option to cancel
- Only use when you want a completely fresh start
- **DO NOT USE** if you want to preserve any data

## Checking What Data You Have

```bash
./dap status
```

This shows:
- Number of products
- Number of tasks
- Number of customers
- Service status

## Updated Help Text

Run this to see the updated, clearer documentation:
```bash
./dap help
```

Key changes:
- ✅ marks safe commands that preserve data
- ⚠️ marks destructive commands
- Clear warnings about data loss

## Best Practices Going Forward

1. **Regular Exports**: Use the frontend's Export feature to backup your custom products
2. **Use add-sample**: For loading Cisco sample data while keeping your data
3. **Avoid clean-restart**: Unless you truly want to wipe everything
4. **Check status first**: Run `./dap status` to see what data you have

## Sample Data Structure

After running `./dap add-sample`, you'll have:

**Products:**
- Cisco Duo (12 tasks)
- Cisco SD-WAN (14 tasks)  
- Cisco Secure Firewall (13 tasks)
- Cisco ISE (12 tasks)
- Cisco Secure Access Sample (11 tasks)

**Solutions:**
- Hybrid Private Access (Secure Access + Duo + Firewall)
- SASE (Secure Access + SD-WAN + Duo)

**Customers:**
- ACME (assigned to Hybrid Private Access)
- Chase (assigned to SASE)

Plus your manually created products remain untouched!

## Testing the Fix

To verify SQL execution now shows errors:

```bash
# This will now show any SQL errors clearly
./dap add-sample
```

If there are issues, you'll see the actual error messages instead of silent failures.

## Questions?

- Check the updated help: `./dap help`
- View sample data documentation: `cat SAMPLE_DATA_UPDATE.md`
- Check current status: `./dap status`

## Summary

**Problem**: `clean-restart` silently deleted all data  
**Fix**: Added warnings, improved error visibility, updated docs  
**Solution**: Use `./dap add-sample` instead to preserve your data  



