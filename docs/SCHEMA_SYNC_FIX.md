# GraphQL Schema Sync Fix - November 11, 2025

## Issue

Frontend was getting a 400 error when querying roles:
```
Cannot query field "users" on type "RoleWithPermissions"
```

## Root Cause

The GraphQL type definitions were defined in **two places**:
1. `backend/src/graphql/auth.ts` - Secondary auth schema (updated ✅)
2. `backend/src/schema/typeDefs.ts` - Main schema file (not updated ❌)

When I initially added the `users` field to `RoleWithPermissions`, I only updated the auth.ts file. The main typeDefs.ts file still had the old definition without the `users` field, causing a schema conflict.

## Files Fixed

### 1. `backend/src/schema/typeDefs.ts`

**Updated RoleWithPermissions type:**
```graphql
type RoleWithPermissions {
  id: ID!
  name: String!
  description: String
  userCount: Int
  users: [UserBasic!]  # ADDED
  permissions: [RolePermission!]!
}
```

**Added UserBasic type:**
```graphql
type UserBasic {
  id: ID!
  username: String!
  fullName: String
  email: String!
}
```

**Updated UserExtended type:**
```graphql
type UserExtended {
  id: ID!
  username: String!
  email: String!
  fullName: String
  isAdmin: Boolean!
  isActive: Boolean!
  mustChangePassword: Boolean!
  roles: [String!]  # ADDED
}
```

### 2. `backend/src/services/authService.ts`

**Updated `getAllUsers` method** to fetch and return role names:

```typescript
async getAllUsers(requesterId: string): Promise<User[]> {
  // ... auth check ...

  const users = await this.prisma.user.findMany({
    include: {
      userRoles: {
        include: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: { username: 'asc' }
  });

  return users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    isAdmin: u.isAdmin,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    roles: u.userRoles
      .filter((ur: any) => ur.role) // Only include roles that exist
      .map((ur: any) => ur.role.name)
  }));
}
```

## Why Two Schema Files?

The codebase has:
- **Main schema** (`typeDefs.ts`) - Core application types
- **Auth schema** (`graphql/auth.ts`) - Authentication-specific types

Both are merged together when the GraphQL server starts. Any type defined in either file must be consistent across both.

## Lesson Learned

When adding new fields to GraphQL types:
1. ✅ Check if the type is defined in multiple places
2. ✅ Update ALL definitions to match
3. ✅ Restart the backend to load new schema
4. ✅ Test the query in the frontend

## Verification

After the fix:
- ✅ Backend restarted successfully
- ✅ No schema validation errors
- ✅ Frontend can now query `users` field on roles
- ✅ Frontend can now query `roles` field on users

## Related Changes

This fix completes the implementation from:
- `docs/USER_ROLE_VISIBILITY_ENHANCEMENT.md` - Original enhancement
- `docs/BIDIRECTIONAL_PERMISSION_FLOW.md` - Permission system

## Status

✅ **RESOLVED** - All schema definitions are now synchronized and the frontend can query user-role relationships.

