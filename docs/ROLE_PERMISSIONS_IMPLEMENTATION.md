# Role-Based Access Control (RBAC) Implementation - In Progress

## Overview

Implementing a comprehensive role-based access control system where roles can be assigned permissions to specific resources (Products, Solutions, Customers) or all resources of a type.

## Database Schema Changes (✅ COMPLETED)

### New Tables

#### `Role` Table
```prisma
model Role {
  id          String           @id @default(cuid())
  name        String           @unique
  description String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  userRoles   UserRole[]
  permissions RolePermission[]
}
```

#### `RolePermission` Table
```prisma
model RolePermission {
  id              String          @id @default(cuid())
  roleId          String
  resourceType    ResourceType    // PRODUCT, SOLUTION, CUSTOMER
  resourceId      String?         // NULL = "all" resources of this type
  permissionLevel PermissionLevel // READ, WRITE, ADMIN
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  role            Role            @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, resourceType, resourceId])
}
```

### Updated Tables

#### `UserRole` (Updated)
```prisma
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String?  // New: FK to Role table
  roleName  String?  // Deprecated: kept for backward compatibility
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role?    @relation(fields: [roleId], references: [id], onDelete: Cascade)
}
```

#### `User` (Updated)
- Changed `role` field from `Role` enum to `SystemRole` enum to avoid naming conflict

## GraphQL Schema Changes (✅ COMPLETED)

### New Types

```graphql
type RolePermission {
  id: ID!
  resourceType: String!
  resourceId: String          # null for "all resources"
  permissionLevel: String!
}

type RoleWithPermissions {
  id: ID!
  name: String!
  description: String
  userCount: Int
  permissions: [RolePermission!]!
}

type AvailableResource {
  id: ID!
  name: String!
  type: String!              # PRODUCT, SOLUTION, or CUSTOMER
}

input ResourcePermissionInput {
  resourceType: String!
  resourceId: String         # null for "all resources"
  permissionLevel: String!
}

input CreateRoleInput {
  name: String!
  description: String
  permissions: [ResourcePermissionInput!]
}

input UpdateRoleInput {
  name: String
  description: String
  permissions: [ResourcePermissionInput!]
}
```

### Updated Queries

```graphql
extend type Query {
  # ... existing queries
  roles: [RoleWithPermissions!]!
  role(id: ID!): RoleWithPermissions
  userRoles(userId: ID!): [RoleWithPermissions!]!
  availableResources(resourceType: String): [AvailableResource!]!
}
```

### Updated Mutations

```graphql
extend type Mutation {
  createRole(input: CreateRoleInput!): RoleWithPermissions!
  updateRole(roleId: ID!, input: UpdateRoleInput!): RoleWithPermissions!
  deleteRole(roleId: ID!): Boolean!
  assignRoleToUser(userId: ID!, roleId: ID!): Boolean!
  removeRoleFromUser(userId: ID!, roleId: ID!): Boolean!
}
```

## Backend Resolvers (🔄 IN PROGRESS)

### Query Resolvers (✅ COMPLETED)

- ✅ `roles` - Returns all roles with their permissions
- ✅ `role(id)` - Returns specific role with permissions
- ✅ `userRoles(userId)` - Returns all roles assigned to a user
- ✅ `availableResources(resourceType?)` - Returns all products/solutions/customers for permission assignment

### Mutation Resolvers (🔄 TODO)

Need to implement:
- `createRole` - Create role with permissions
- `updateRole` - Update role and its permissions
- `deleteRole` - Delete role and cascade to user assignments
- `assignRoleToUser` - Assign existing role to user
- `removeRoleFromUser` - Remove role from user

## Frontend UI Updates (🔄 TODO)

### RoleManagement Component

#### Tabs Structure
1. **Roles Tab** (List view)
   - Table showing all roles
   - Columns: Name, Description, Users, Permissions Summary, Actions

2. **Create/Edit Role Dialog**
   - Basic Info section:
     - Role Name (required)
     - Description (optional)
   
   - Permissions section with three tabs:
     - **Products** tab
       - Checkbox: "All Products" OR
       - Multi-select list of specific products
       - Permission level dropdown per selection
     
     - **Solutions** tab
       - Checkbox: "All Solutions" OR
       - Multi-select list of specific solutions
       - Permission level dropdown per selection
     
     - **Customers** tab
       - Checkbox: "All Customers" OR
       - Multi-select list of specific customers
       - Permission level dropdown per selection

#### Permission Levels
- `READ` - View only
- `WRITE` - View and edit
- `ADMIN` - Full control

#### UI Mockup

```
┌────────────────────────────────────────────────────────────┐
│ Role Management                                    [+ Add] │
├────────────────────────────────────────────────────────────┤
│ Name         │ Description  │ Users │ Permissions │ Actions│
├──────────────┼──────────────┼───────┼─────────────┼────────┤
│ SME          │ Subject Mat..│   5   │ All Product │ ✏️ 🗑️  │
│ CS Manager   │ Customer Su..│   3   │ All Custom..│ ✏️ 🗑️  │
│ Product Team │ Product Man..│   8   │ 5 Products  │ ✏️ 🗑️  │
└────────────────────────────────────────────────────────────┘
```

#### Create/Edit Dialog

```
┌──────────────────────────────────────────────────────────┐
│ Create New Role                                     [×]  │
├──────────────────────────────────────────────────────────┤
│ Role Name: [_____________________________]              │
│                                                          │
│ Description:                                            │
│ [_______________________________________________]       │
│ [_______________________________________________]       │
│                                                          │
│ Permissions                                             │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Products │ Solutions │ Customers │                  │
│ ├────────────────────────────────────────────────────┤  │
│ │ ☐ All Products                                     │  │
│ │                                                     │  │
│ │ OR select specific products:                       │  │
│ │ ┌────────────────────────────────────────────┐    │  │
│ │ │ ☑ Platform A              [WRITE ▾]        │    │  │
│ │ │ ☑ Platform B              [READ  ▾]        │    │  │
│ │ │ ☐ Platform C              [WRITE ▾]        │    │  │
│ │ │ ☐ Analytics Suite         [READ  ▾]        │    │  │
│ │ └────────────────────────────────────────────┘    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│                          [Cancel]  [Create Role]         │
└──────────────────────────────────────────────────────────┘
```

## Permission Checking (🔄 TODO)

### Middleware/Helper Function

```typescript
// backend/src/lib/permissions.ts
export async function checkUserPermission(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  requiredLevel: PermissionLevel,
  prisma: PrismaClient
): Promise<boolean> {
  // 1. Check if user is admin (bypass)
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.isAdmin) return true;

  // 2. Check direct user permissions
  const userPerm = await prisma.permission.findFirst({
    where: {
      userId,
      resourceType,
      OR: [
        { resourceId: null },      // System-wide
        { resourceId: resourceId }  // Specific resource
      ]
    }
  });
  if (userPerm && hasPermissionLevel(userPerm.permissionLevel, requiredLevel)) {
    return true;
  }

  // 3. Check role-based permissions
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            where: {
              resourceType,
              OR: [
                { resourceId: null },      // All resources of type
                { resourceId: resourceId }  // Specific resource
              ]
            }
          }
        }
      }
    }
  });

  for (const ur of userRoles) {
    if (ur.role?.permissions.length > 0) {
      const rolePerm = ur.role.permissions[0];
      if (hasPermissionLevel(rolePerm.permissionLevel, requiredLevel)) {
        return true;
      }
    }
  }

  return false;
}

function hasPermissionLevel(
  actual: PermissionLevel,
  required: PermissionLevel
): boolean {
  const levels = { READ: 1, WRITE: 2, ADMIN: 3 };
  return levels[actual] >= levels[required];
}
```

### Usage in Resolvers

```typescript
// Example: Product Query Resolver
product: async (_: any, { id }: any, context: any) => {
  requireUser(context);
  
  // Check if user has permission to view this product
  const hasAccess = await checkUserPermission(
    context.user.userId,
    'PRODUCT',
    id,
    'READ',
    context.prisma
  );
  
  if (!hasAccess) {
    throw new Error('You do not have permission to view this product');
  }
  
  return context.prisma.product.findUnique({ where: { id } });
}
```

## Migration Plan

### Phase 1: Schema & Backend (Current)
1. ✅ Update Prisma schema
2. ✅ Run database migration
3. ✅ Update GraphQL types
4. 🔄 Implement query resolvers
5. 🔄 Implement mutation resolvers
6. 🔄 Add permission checking helpers

### Phase 2: Frontend UI
1. 🔄 Update RoleManagement component
2. 🔄 Add permission selection UI
3. 🔄 Add resource selection dialogs
4. 🔄 Integrate with backend GraphQL

### Phase 3: Permission Enforcement
1. 🔄 Add permission checks to all resolvers
2. 🔄 Filter query results based on permissions
3. 🔄 Update frontend to hide unauthorized actions

### Phase 4: Testing & Polish
1. 🔄 Test role creation with various permission combinations
2. 🔄 Test permission enforcement
3. 🔄 Test edge cases (deleted resources, etc.)
4. 🔄 Add user documentation

## Examples

### Example 1: SME Role - All Products, Read-Only
```json
{
  "name": "SME",
  "description": "Subject Matter Expert with read access to all products",
  "permissions": [
    {
      "resourceType": "PRODUCT",
      "resourceId": null,
      "permissionLevel": "READ"
    }
  ]
}
```

### Example 2: Product Manager - Specific Products, Write Access
```json
{
  "name": "Product Manager - Platform A",
  "description": "Manages Platform A and Platform B products",
  "permissions": [
    {
      "resourceType": "PRODUCT",
      "resourceId": "product-a-id",
      "permissionLevel": "WRITE"
    },
    {
      "resourceType": "PRODUCT",
      "resourceId": "product-b-id",
      "permissionLevel": "WRITE"
    }
  ]
}
```

### Example 3: CS Manager - All Customers, Admin Access
```json
{
  "name": "CS Manager",
  "description": "Customer Success Manager with full access to all customers",
  "permissions": [
    {
      "resourceType": "CUSTOMER",
      "resourceId": null,
      "permissionLevel": "ADMIN"
    }
  ]
}
```

## API Examples

### Create Role
```graphql
mutation {
  createRole(input: {
    name: "SME"
    description: "Subject Matter Expert"
    permissions: [
      {
        resourceType: "PRODUCT"
        resourceId: null
        permissionLevel: "READ"
      }
    ]
  }) {
    id
    name
    permissions {
      resourceType
      resourceId
      permissionLevel
    }
  }
}
```

### Assign Role to User
```graphql
mutation {
  assignRoleToUser(
    userId: "user-id"
    roleId: "role-id"
  )
}
```

### Get Available Resources
```graphql
query {
  availableResources(resourceType: "PRODUCT") {
    id
    name
    type
  }
}
```

## Status

- ✅ Database schema updated
- ✅ GraphQL schema updated
- ✅ Query resolvers implemented
- 🔄 Mutation resolvers (IN PROGRESS)
- 🔄 Frontend UI (TODO)
- 🔄 Permission checking (TODO)

---

**Last Updated**: 2025-11-11
**Status**: 🔄 In Progress
**Next Steps**: Complete mutation resolvers, then update frontend UI

