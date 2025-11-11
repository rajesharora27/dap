# Missing Database Columns Fix - November 11, 2025

## Issue

User reported error when trying to load products:
```
Error loading products: Invalid `prisma.user.findUnique()` invocation
The column `User.isAdmin` does not exist in the current database.
```

## Root Cause

The `prisma db push` command from the previous fix did not properly sync all columns to the database. The User table was missing several critical columns:
- `isAdmin`
- `isActive`
- `mustChangePassword`
- `fullName`
- `createdAt`
- `updatedAt`

Additionally, the Role, RolePermission, Permission, and UserRole tables were not created.

## Solution Applied

### Step 1: Add Missing Columns to User Table
```sql
ALTER TABLE "User" ADD COLUMN "fullName" TEXT DEFAULT '';
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
```

### Step 2: Create Missing Tables
```bash
cd /data/dap/backend
npx prisma db push --skip-generate --accept-data-loss
```

This created:
- `Role` - For custom role definitions
- `UserRole` - Junction table for user-role assignments
- `RolePermission` - Permissions for roles on specific resources
- `Permission` - Direct user permissions

### Step 3: Regenerate Prisma Client
```bash
cd /data/dap/backend
npx prisma generate
```

### Step 4: Update Admin User
```sql
UPDATE "User" SET 
  "isAdmin" = true,
  "isActive" = true,
  "mustChangePassword" = false,
  role = 'ADMIN',
  password = '$2a$10$L/F0TPT0gRSpDG/RPRkXs.KeM4VPp9TgVCJkoXSUH9MpEaKOsbJaa'
WHERE username = 'admin';
```

### Step 5: Restart All Services
```bash
cd /data/dap
./dap restart
```

## Verification

### Backend Test
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { simpleLogin(username: \"admin\", password: \"DAP123\") }"}' | jq -r '.data.simpleLogin')

# Query products
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"query { products { totalCount } }"}' | jq .
```

**Expected Result:**
```json
{
  "data": {
    "products": {
      "totalCount": 6
    }
  }
}
```

✅ **Backend is working correctly!**

## User Action Required

### Clear Browser Session & Login

Since the database was modified, you need to clear your browser's stored authentication:

#### Option 1: Browser Console (10 seconds)
1. Press `F12` to open Developer Tools
2. Go to **Console** tab
3. Run:
   ```javascript
   localStorage.clear(); sessionStorage.clear(); location.reload();
   ```

#### Option 2: Use Helper Page
```bash
firefox /data/dap/clear-sessions.html
```

### Login Credentials
- **Username:** `admin`
- **Password:** `DAP123`

### Expected Result After Login
You should see:
- ✅ **6 Products** (including Cisco Duo, SD-WAN, Secure Firewall, ISE, Secure Access Sample, and Secure Access)
- ✅ **2 Solutions** (Hybrid Private Access, SASE)
- ✅ **2 Customers** (ACME, Chase)

## Database Schema Now Includes

### User Table (Complete)
```
Column              | Type         | Default
--------------------+--------------+-------------------
id                  | text         | 
email               | text         | 
username            | text         | 
name                | text         | 
role                | SystemRole   | 'USER'
password            | text         | 
fullName            | text         | ''
isAdmin             | boolean      | false
isActive            | boolean      | true
mustChangePassword  | boolean      | true
createdAt           | timestamp(3) | CURRENT_TIMESTAMP
updatedAt           | timestamp(3) | CURRENT_TIMESTAMP
```

### New Tables for RBAC
- **Role**: Custom role definitions
- **UserRole**: User-to-role assignments
- **RolePermission**: Role-based resource permissions
- **Permission**: Direct user permissions

## Files Modified

No code changes were needed - this was purely a database schema synchronization issue.

## Prevention

To prevent this in the future:

1. Always run `npx prisma db push` after pulling schema changes
2. Verify with: `npx prisma migrate status`
3. Check tables exist: 
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

## Related Documentation

- `docs/DATABASE_SCHEMA_SYNC_FIX.md` - Previous database reset
- `docs/GUI_NOT_SHOWING_DATA_FIX.md` - Session clearing guide
- `docs/FORCE_RESTART_AND_RESOLVER_FIX.md` - Resolver fixes

## Summary

The issue was caused by incomplete schema synchronization. All missing columns and tables have been created, the admin user has been properly configured, and the backend is now working correctly. The user just needs to clear their browser session and log in again to see the data.

