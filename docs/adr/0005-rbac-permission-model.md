# ADR-0005: RBAC Permission Model

## Status

✅ Accepted

## Date

2024-11-01

## Context

DAP needs access control that supports:
- Different user roles (Admin, SME, CSS, User)
- Resource-level permissions (specific products/customers)
- Role-based default permissions
- Bidirectional access (Product ↔ Solution)
- Scalability as organization grows

Requirements:
1. Admins have full access to everything
2. SME (Subject Matter Experts) manage Products and Solutions
3. CSS (Customer Success) manage Customers
4. Users have limited, explicitly granted access

## Decision

Implement a **hybrid RBAC model** with:

### System Roles

```typescript
enum SystemRole {
  ADMIN    // Full access to everything
  SME      // Products + Solutions (full CRUD)
  CSS      // Customers (full CRUD) + Products/Solutions (READ)
  USER     // Explicit permissions only
  VIEWER   // Read-only access to everything
}
```

### Permission Levels

```typescript
enum PermissionLevel {
  READ   // View only
  WRITE  // Edit existing
  ADMIN  // Full CRUD including delete
}

// Hierarchy: ADMIN > WRITE > READ
```

### Resource Types

```typescript
enum ResourceType {
  PRODUCT
  SOLUTION
  CUSTOMER
  SYSTEM
}
```

### Permission Resolution

```
1. Is user.isAdmin? → Full access
2. Check SystemRole (SME/CSS) → Role-based access
3. Check direct Permission → Resource-specific access
4. Check Role Permissions → Role-based resource access
5. Check bidirectional → Solution ↔ Product inheritance
6. Deny if no match
```

### Bidirectional Flow

- Access to ALL Products → Access to ALL Solutions
- Access to ALL Solutions → Access to ALL Products
- Access to specific Solution → Access to its Products
- Access to ALL Products in a Solution → Access to that Solution

## Consequences

### Positive

- ✅ Simple role-based defaults for most users
- ✅ Granular permissions when needed
- ✅ Bidirectional inheritance reduces permission setup
- ✅ Clear permission hierarchy
- ✅ Supports future multi-tenant scenarios
- ✅ 894-line battle-tested implementation

### Negative

- ⚠️ Complex bidirectional logic (hard to debug)
- ⚠️ Performance cost of multiple DB queries per check
- ⚠️ Can be confusing how permission was granted
- ⚠️ No permission caching (every request checks DB)

### Neutral

- Frontend must also enforce visibility
- UI needs role-aware components
- Audit log should track permission changes

## Implementation

### Database Schema

```prisma
model Permission {
  id              String          @id
  userId          String
  resourceType    ResourceType
  resourceId      String?         // null = all resources
  permissionLevel PermissionLevel
}

model Role {
  id          String           @id
  name        String           @unique
  permissions RolePermission[]
}

model UserRole {
  userId String
  roleId String
}
```

### Key Functions

```typescript
// Check if user has permission
checkUserPermission(userId, resourceType, resourceId, requiredLevel)

// Get accessible resource IDs (null = all)
getUserAccessibleResources(userId, resourceType, minLevel)

// Throw if no permission
requirePermission(context, resourceType, resourceId, level)
```

## Alternatives Considered

### Alternative 1: Simple Role-Only (no resource permissions)

- **Pros**: Simple, easy to understand
- **Cons**: Can't grant access to specific resources
- **Why rejected**: Need granular control for enterprise use

### Alternative 2: ACL (Access Control Lists)

- **Pros**: Very granular, per-object permissions
- **Cons**: Complex management, performance issues at scale
- **Why rejected**: Overkill for current requirements

### Alternative 3: ABAC (Attribute-Based)

- **Pros**: Very flexible, policy-based
- **Cons**: Complex to implement and debug
- **Why rejected**: Too complex for current team size

## References

- [CONTEXT.md - RBAC Section](../CONTEXT.md)
- [permissions.ts](../../backend/src/shared/auth/permissions.ts)
- [RBAC Wikipedia](https://en.wikipedia.org/wiki/Role-based_access_control)

