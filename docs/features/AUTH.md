# Authentication & Authorization (RBAC)

**Version:** 1.0.0  
**Last Updated:** January 9, 2026  

This document outlines the design, architecture, and implementation of the Authentication and Role-Based Access Control (RBAC) system for the DAP application.

---

## 1. Overview & Architecture

The system uses **JWT (JSON Web Tokens)** for stateless authentication, paired with a robust RBAC model implemented in PostgreSQL.

### Authentication Flow
1. **Login**: User provides credentials -> Backend verifies -> Returns JWT + Refresh Token.
2. **Access**: JWT sent in `Authorization: Bearer <token>` header.
3. **RBAC**: Middleware decodes token; Resolvers check permissions against the database contexts.
4. **Refresh**: Short-lived Access Tokens (1h) refeshed via Long-lived Refresh Tokens (7d).

### Core Features
- **Stateless Auth**: JWT-based.
- **Granular RBAC**: View/Edit/Manage levels per resource.
- **Inheritance**: Solution access grants access to underlying products.
- **Audit Logging**: All auth and permission events are logged.
- **Secure Defaults**: New users must change password; strict password policies.

---

## 2. Role-Based Access Control (RBAC)

### Roles
| Role | Code | Description |
|------|------|-------------|
| **Administrator** | `ADMIN` | Full system access. Bypasses permission checks. |
| **Subject Matter Expert** | `SME` | Manages specific Products or Solutions. |
| **Customer Success** | `CS` | Manages specific Customers and their adoption plans. |

### Permission Matrix
| Level | Value | Abilities |
|-------|-------|-----------|
| **VIEW** | 1 | Read-only access to resource. |
| **EDIT** | 2 | Modify existing resource. implied VIEW. |
| **MANAGE** | 3 | Create/Delete resource. implied EDIT, VIEW. |

### Inheritance Rules
1. **Solution Inheritance**: If a user has `SME` access to a **Solution**, they automatically inherit that access level for all **Products** within that Solution.
2. **Hierarchy**: `MANAGE` > `EDIT` > `VIEW`.

---

## 3. Database Schema

### Users & Roles
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  must_change_password BOOLEAN DEFAULT TRUE
  -- ... audit fields
);

CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'product', 'solution', 'customer', 'system'
  resource_id TEXT,            -- NULL for system-wide
  permission_level TEXT NOT NULL, -- 'view', 'edit', 'manage'
  granted_by TEXT
);
```

### Audit Log
Tracks `login`, `logout`, `grant_permission`, `revoke_permission`, `create_user`, etc.

---

## 4. GraphQL API Reference

### Authentication
```graphql
mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    token
    refreshToken
    user { id username permissions { ... } }
  }
}

mutation RefreshToken($token: String!) { ... }
```

### Permission Management (Admin Only)
```graphql
mutation GrantPermission($input: GrantPermissionInput!) {
  grantPermission(input: {
    userId: "..."
    resourceType: "PRODUCT"
    resourceId: "..."
    permissionLevel: "EDIT"
  })
}

mutation RevokePermission($userId: ID!, $resourceType: String!, $resourceId: ID)
```

### User Management
```graphql
mutation CreateUser($input: CreateUserInput!)
mutation ResetPassword($userId: ID!)
mutation ChangePassword($old: String!, $new: String!)
```

---

## 5. Implementation Details

### Backend (`/backend/src/modules/auth`)
- **`AuthService`**: Handles hashing, JWT generation, and permission logic (`hasPermission`, `getAccessibleProducts`).
- **`AuthGuard`**: Middleware for route protection.
- **Resolvers**: Apply field-level security using `AuthService`.

### Frontend (`/frontend/src/features/auth`)
- **`AuthContext`**: Manages `user`, `token`, and provides helpers (`canViewProduct`, `canEditSolution`).
- **`ProtectedRoute`**: React component to block access to unauthorized routes.
- **Permission Hooks**: `usePermission` hook for conditional UI rendering.

### Security Best Practices Implemented
- **BCrypt**: 10 rounds for password hashing.
- **HTTP/Secure Cookies**: (Recommended) or LocalStorage for tokens.
- **Token Rotation**: Refresh tokens rotate on use.
- **Session Clearing**: Restoring DB clears all active sessions.

---

## 6. How to Use (Dev Guide)

**Granting Access to a Developer:**
```bash
# In GraphQL Playground
mutation {
  grantPermission(input: {
    userId: "dev-user-id",
    resourceType: "SYSTEM",
    permissionLevel: "MANAGE" 
  })
}
```

**Resetting Admin Password:**
If locked out, use the seed script:
```bash
cd backend && npm run seed:auth
# Resets admin/Admin@123
```
