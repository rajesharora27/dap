# Clean-Restart Error Fix

## Problem
The `./dap clean-restart` command was throwing multiple SQL errors:

```
ERROR:  cannot determine type of empty array
LINE 6: ...RRAY['https://docs.cisco.com/duo/adaptive-auth'], ARRAY[], '...
                                                             ^
HINT:  Explicitly cast to the desired type, for example ARRAY[]::integer[].
```

## Root Cause
The `create-complete-sample-data.sql` file contained empty arrays `ARRAY[]` for the `howToVideo` field in many task insertions. PostgreSQL cannot determine the type of an empty array without an explicit type cast.

## Solution
All empty arrays were fixed by explicitly casting them to `text[]` type:

**Before:**
```sql
ARRAY['https://docs.cisco.com/duo/adaptive-auth'], ARRAY[], 'prod-cisco-duo'
```

**After:**
```sql
ARRAY['https://docs.cisco.com/duo/adaptive-auth'], ARRAY[]::text[], 'prod-cisco-duo'
```

## Changes Made
- Fixed 28 instances of empty arrays in the Task insertion statements
- All empty `howToVideo` arrays now properly cast as `ARRAY[]::text[]`

## Verification
After the fix, `./dap clean-restart` runs successfully and creates:

✅ **5 Products:**
- Cisco Duo (12 tasks)
- Cisco SD-WAN (14 tasks)
- Cisco Secure Firewall (13 tasks)
- Cisco ISE (12 tasks)
- Cisco Secure Access Sample (11 tasks)

✅ **2 Solutions:**
- Hybrid Private Access
- SASE

✅ **2 Customers:**
- ACME (assigned Hybrid Private Access)
- Chase (assigned SASE)

✅ **62 Tasks** with full attributes (estMinutes, weight, sequenceNumber, licenseLevel, howToDoc, howToVideo)

✅ **62 Telemetry Attributes** (1 per task)

✅ **15 Licenses** (Essential, Advantage, Signature/Premier/Beyond tiers)

✅ **20 Outcomes** (4 per product)

## Testing
```bash
# Clean restart (DESTRUCTIVE - deletes all data)
./dap clean-restart

# Check status
./dap status

# Verify data
docker exec dap_db_1 psql -U postgres -d dap -c "SELECT name, COUNT(*) as task_count FROM \"Product\" p LEFT JOIN \"Task\" t ON p.id = t.\"productId\" GROUP BY p.name;"
```

## Status
✅ **FIXED** - `./dap clean-restart` now works without errors!



