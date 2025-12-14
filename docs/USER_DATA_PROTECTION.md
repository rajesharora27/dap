# User Data Protection Policy

## Overview

This document outlines the policies and safeguards in place to protect **User credentials and authentication data** from accidental deletion during testing, database resets, and development operations.

## Protected Tables

The following tables are **NEVER** to be truncated or deleted during:
- Database resets (`./dap reset`, `reset-dev-db.ts`)
- Test cleanup operations (`TestFactory.cleanup()`)
- Sample data operations (`dataManagement.ts`)

| Table | Description |
|-------|-------------|
| `User` | User accounts with credentials |
| `UserRole` | User-to-role assignments |
| `Permission` | Direct user permissions |
| `RolePermission` | Role-to-permission mappings |
| `Session` | Active user sessions |

## Safe Operations

### Reset Admin Password
```bash
cd backend
npx ts-node scripts/user-manager.ts reset-admin
```
This resets only the `admin` user's password to `DAP123!!!`.

### Reset Specific User Password
```bash
cd backend
npx ts-node scripts/user-manager.ts reset-user <username>
```
This resets a specific user's password without affecting other users.

### Fix User Authentication
```bash
cd backend
npx ts-node scripts/fix_user_auth.ts <username> <password> [--admin]
```
This creates or updates a user's password without affecting other users.

## Dangerous Operations (Require Confirmation)

### Reset All Users
```bash
cd backend
npx ts-node scripts/user-manager.ts reset-all --confirm
```
⚠️ **WARNING**: This deletes ALL users and recreates only default users.

This requires the `--confirm` flag to run.

## Scripts Modified for User Protection

### 1. `scripts/reset-dev-db.ts`
- ❌ NO LONGER truncates `User`, `UserRole`, `Permission`, `RolePermission` tables
- ✅ Only resets business data: `Customer`, `Product`, `Solution`

### 2. `src/__tests__/factories/TestFactory.ts`
- ❌ NO LONGER includes `User`, `Session`, `UserRole`, `Permission` in cleanup
- ✅ Only cleans business data for test isolation

### 3. `scripts/user-manager.ts`
- ❌ `reset-all` now requires `--confirm` flag
- ✅ Safe commands: `seed`, `reset-admin`, `reset-user`

## Test Isolation

Tests use a **separate test database** (`dap_test`) to prevent interference with development data:
- `TestFactory` has a safety check that refuses to run outside test environment
- DevTools test runner explicitly sets `DATABASE_URL` to test database

## Default Credentials

| User | Password | Role |
|------|----------|------|
| `admin` | `DAP123!!!` | ADMIN |
| `user` | `user` | USER |
| `smeuser` | `DAP123!!!` | SME |
| `cssuser` | `DAP123!!!` | CSS |
| `aiuser` | `DAP123!!!` | USER |

## Troubleshooting

### User credentials not working after restart
```bash
# Fix admin password
podman exec dap_db_1 psql -U postgres -d dap -c "
  UPDATE \"User\" 
  SET password = '\$2a\$10\$..hashed..', 
      \"isActive\" = true, 
      \"mustChangePassword\" = false 
  WHERE username = 'admin';"
```

Or use the fix script:
```bash
cd backend && npx ts-node scripts/fix_user_auth.ts admin 'DAP123!!!' --admin
```

---

**Last Updated**: December 2024
