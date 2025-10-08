# Sample Data Script Fix

## Issue Identified
The `./dap add-sample` command was using `create-enhanced-sample-data.sql` which:
1. **Deleted ALL existing data** (lines 5-18 had DELETE FROM statements for all tables)
2. **Only had 6 tasks per product** (not the 10-15 tasks we wanted)
3. **Was out of sync** with the comprehensive `seed.ts` TypeScript file

## Root Cause
```bash
# Old implementation (line 426 of dap script)
docker exec -i "$DB_CONTAINER" psql -U postgres -d dap < "$PROJECT_DIR/create-enhanced-sample-data.sql"
```

This directly executed SQL that started with:
```sql
-- Lines 5-18 of create-enhanced-sample-data.sql
DELETE FROM "TaskOutcome";
DELETE FROM "TaskRelease";
DELETE FROM "Task";
DELETE FROM "Outcome";
DELETE FROM "Release";
DELETE FROM "License";
-- ... deletes ALL tables
```

## Solution Implemented

### Updated `./dap add-sample` Command
Now uses the TypeScript seed script instead:
```bash
npm run seed  # Runs backend/src/seed.ts
```

### Why This Fixes the Issues

1. **Non-Destructive**: Uses Prisma's `upsert` instead of DELETE+INSERT
   ```typescript
   // Example from seed.ts
   await prisma.product.upsert({
     where: { id: 'retail-app-001' },
     update: {}, // Don't overwrite if exists
     create: { /* new data */ }
   });
   ```

2. **Comprehensive Data**: seed.ts has:
   - Retail App: 15 tasks (100% weight)
   - Financial App: 14 tasks (100% weight)
   - IT/AI/Networking Apps: Will be expanded to 12+ tasks each

3. **Consistent**: Single source of truth for sample data

### Benefits

✅ **Safe**: Preserves user-created products/tasks/data
✅ **Complete**: Uses comprehensive task lists (10-15 per product)
✅ **Maintainable**: TypeScript with type safety instead of raw SQL
✅ **Idempotent**: Can run multiple times safely

## Updated Commands

### Add Sample Data (Non-Destructive)
```bash
./dap add-sample
```
- Adds sample products if they don't exist
- Preserves all existing user data
- Uses `upsert` logic with specific IDs

### Remove Sample Data Only
```bash
./dap reset-sample
```
- Removes only sample products (by specific IDs)
- Keeps user-created data intact
- Uses targeted DELETE WHERE id IN (...)

## Sample Product IDs
The following IDs are reserved for sample data:
- `retail-app-001` - Retail Management App (15 tasks)
- `financial-app-001` - Financial Services App (14 tasks)
- `it-app-001` - IT Operations App (expanding)
- `ai-app-001` - AI-Powered Analytics App (expanding)
- `networking-app-001` - Network Management App (expanding)

**User data should NEVER use these IDs** - they use UUIDs instead.

## Migration Path

### Old Workflow (Destructive)
```bash
./dap add-sample  # ❌ Deleted everything, added basic data
```

### New Workflow (Safe)
```bash
./dap add-sample  # ✅ Adds comprehensive data, preserves existing
```

## Next Steps
1. ✅ Updated `./dap` script to use `npm run seed`
2. 🔄 Complete expansion of IT/AI/Networking apps to 12+ tasks
3. 🔄 Update `seed-clean.ts` to match (minimal version)
4. 📝 Deprecate `create-enhanced-sample-data.sql` (keep for reference)

## Testing
```bash
# Test the fix
./dap add-sample

# Verify data
docker exec dap-db psql -U postgres -d dap -c "SELECT id, name FROM \"Product\";"
docker exec dap-db psql -U postgres -d dap -c "SELECT COUNT(*) FROM \"Task\" GROUP BY \"productId\";"
```

Expected output:
- All previous user products still exist
- Sample products added with 10+ tasks each
- No data loss

## Related Files
- `/data/dap/dap` - Main script (add_sample_data function updated)
- `/data/dap/backend/src/seed.ts` - Comprehensive sample data (non-destructive)
- `/data/dap/backend/src/seed-clean.ts` - Minimal sample data
- `/data/dap/create-enhanced-sample-data.sql` - Old destructive version (deprecated)
- `/data/dap/remove-sample-data.sql` - Targeted removal of sample data only
