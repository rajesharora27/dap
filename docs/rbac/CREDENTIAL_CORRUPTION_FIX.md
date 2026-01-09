# Credential Corruption Root Cause Analysis

**Date:** 2025-12-12  
**Issue:** Users get wiped after running tests through Development Toolkit

## Root Cause

The test runner has **TWO different Prisma client instances** that could be connecting to different databases:

### 1. Test Setup Client (`/backend/src/__tests__/setup.ts`)
```typescript
export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap_test'
        }
    }
});
```
✅ **Correctly uses `dap_test` database**

### 2. TestFactory Client (`/backend/src/__tests__/factories/TestFactory.ts`)
```typescript
const prisma = new PrismaClient();
```
❌ **Uses default DATABASE_URL from environment!**

## The Problem

When tests run through the Development Toolkit Test Panel:

1. **DevTools API** (`/backend/src/api/devTools.ts` line 231) sets:
   ```typescript
   DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/dap_test?schema=public'
   ```

2. **BUT** - The `TestFactory.ts` creates its own Prisma client **WITHOUT** explicit datasource configuration

3. **IF** the environment variable isn't properly inherited, TestFactory could connect to the development database (`dap`)

4. **TestFactory.cleanup()** (line 126-151) runs `TRUNCATE TABLE` on multiple tables including `User`

5. **Result:** Development database users get wiped!

## Evidence

- DevTools backend sets `DATABASE_URL` for test process (✅ Correct)
- TestFactory uses `new PrismaClient()` without datasource config (❌ Dangerous)
- TestFactory.cleanup() truncates User table (❌ Destructive)
- After running tests, users are gone (✅ Confirms the issue)

## Why This Happens Intermittently

The issue occurs when:
- The spawned test process doesn't properly inherit the `DATABASE_URL` environment variable
- OR when tests import TestFactory before the environment is set
- OR when Prisma caches the connection before the env var is updated

## Solutions

### Immediate Fix: Update TestFactory

Replace line 5 in `/backend/src/__tests__/factories/TestFactory.ts`:

**Current (WRONG):**
```typescript
const prisma = new PrismaClient();
```

**Fixed:**
```typescript
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public'
        }
    }
});
```

### Additional Safeguards

1. **Add database name check in cleanup()**:
```typescript
static async cleanup() {
    // SAFETY CHECK: Only allow cleanup in test database
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl.includes('dap_test')) {
        throw new Error('❌ SAFETY: cleanup() can only run in dap_test database!');
    }
    
    const tablenames = [...];
    // ... rest of cleanup
}
```

2. **Add environment validation at test start**:
```typescript
// In setup.ts
if (!process.env.DATABASE_URL?.includes('dap_test')) {
    console.error('❌ Tests MUST use dap_test database!');
    console.error('Current DATABASE_URL:', process.env.DATABASE_URL);
    process.exit(1);
}
```

3. **Create separate test database user**:
```sql
-- Create test-only user that can't access development database
CREATE USER test_user WITH PASSWORD 'test_password';
GRANT ALL ON DATABASE dap_test TO test_user;
REVOKE ALL ON DATABASE dap FROM test_user;
```

## Temporary Workaround

After running tests, automatically recreate admin user:

```bash
./scripts/ensure-admin-user.sh
```

This script:
- Checks if users exist in database
- Auto-creates admin user if missing
- Called automatically after `./dap restart`

## Implementation Plan

1. ✅ **Create ensure-admin-user.sh script** - DONE
2. ⚠️  **Fix TestFactory.ts Prisma client** - NEEDED
3. ⚠️  **Add safety checks to cleanup()** - NEEDED  
4. ⚠️  **Add database validation to setup.ts** - NEEDED
5. ⏳ **Update ./dap restart to call ensure-admin-user.sh** - PENDING

## Files to Modify

1. `/data/dap/backend/src/__tests__/factories/TestFactory.ts` - Fix Prisma client initialization
2. `/data/dap/backend/src/__tests__/setup.ts` - Add database validation
3. `/data/dap/dap` - Add ensure-admin-user.sh call after restart
