# Authentication & RBAC Implementation Summary

## Overview

This document summarizes the authentication and role-based access control (RBAC) system that has been implemented for the Dynamic Adoption Plans application.

## Related Security Documentation

- **[Session Management](./SESSION_MANAGEMENT.md)**: Session lifecycle, clearing on restart, token expiration
- **[Backup & Restore Security](./BACKUP_RESTORE_SECURITY.md)**: Password exclusion from backups, password preservation on restore

## Key Features

### 1. **Default Password System**
- All new users are created with the default password: **`DAP123`**
- Users are automatically flagged with `mustChangePassword: true` on creation
- Admin users can reset any user's password back to the default
- Users can change their own passwords
- Admins can change any user's password

### 2. **User Management**
- **User Fields:**
  - `username`: Unique username
  - `email`: Unique email address
  - `fullName`: User's full name
  - `isAdmin`: Boolean flag for admin privileges
  - `isActive`: Boolean flag for account status
  - `mustChangePassword`: Flag requiring password change on next login
  - `createdAt`: Account creation timestamp
  - `updatedAt`: Last modification timestamp

### 3. **Role-Based Access Control**
- **Three Primary Roles:**
  - **ADMIN**: Full system access
  - **SME** (Subject Matter Expert): Access to specific products/solutions
  - **CS** (Customer Success): Access to specific customers

- **Permission Levels:**
  - **VIEW**: Read-only access
  - **EDIT**: Can modify but not delete
  - **MANAGE**: Full control (create, edit, delete)

- **Resource Types:**
  - **PRODUCT**: Individual product access
  - **SOLUTION**: Solution access (automatically grants access to all underlying products)
  - **CUSTOMER**: Customer access
  - **SYSTEM**: System-wide permissions (admin only)

### 4. **Permission Inheritance**
- Users with **SOLUTION** permissions automatically inherit access to all products within that solution
- **MANAGE** permission includes **EDIT** and **VIEW** permissions
- **EDIT** permission includes **VIEW** permission

### 5. **Session Security**
- **Automatic Session Clearing**: All sessions cleared on server restart for security
- **Token Expiration**: JWT tokens expire after configured period (default: 7 days)
- **Automatic Logout**: Users automatically logged out when token expires
- **Session Maintenance**: Old sessions (7+ days) automatically cleaned up
- **Restore Security**: All sessions cleared after database restore

See [Session Management](./SESSION_MANAGEMENT.md) for complete details.

### 6. **Backup & Restore Security**
- **Password Exclusion**: User passwords never included in backup files
- **Password Preservation**: Existing passwords preserved during restore operations
- **Session Clearing**: All sessions cleared after restore to force re-authentication
- **Safe Sharing**: Backup files can be safely shared/transferred (no password exposure)

See [Backup & Restore Security](./BACKUP_RESTORE_SECURITY.md) for complete details.

## Database Schema

### New Tables

#### `UserRole`
```sql
- id: String (Primary Key)
- userId: String (Foreign Key → User)
- roleName: String (ADMIN, SME, CS)
- createdAt: Timestamp
```

#### `Permission`
```sql
- id: String (Primary Key)
- userId: String (Foreign Key → User)
- resourceType: ResourceType (PRODUCT, SOLUTION, CUSTOMER, SYSTEM)
- resourceId: String (Nullable, NULL for system-wide)
- permissionLevel: PermissionLevel (VIEW, EDIT, MANAGE)
- grantedBy: String (Foreign Key → User)
- createdAt: Timestamp
- updatedAt: Timestamp
```

### Updated Tables

#### `User` (Extended)
Added fields:
- `fullName`: String (nullable)
- `isAdmin`: Boolean (default: false)
- `isActive`: Boolean (default: true)
- `mustChangePassword`: Boolean (default: true)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

#### `AuditLog` (Extended)
Added fields:
- `resourceType`: String (nullable)
- `resourceId`: String (nullable)
- `ipAddress`: String (nullable)

### New Enums

#### `ResourceType`
- PRODUCT
- SOLUTION
- CUSTOMER
- SYSTEM

#### `PermissionLevel`
- VIEW
- EDIT
- MANAGE

## GraphQL API

### Queries

```graphql
# Get current authenticated user
me: UserExtended

# Get all users (admin only)
users: [UserExtended!]!

# Get user by ID with permissions (admin or self only)
user(id: ID!): UserWithPermissions

# Get current user's permissions
myPermissions: [Permission!]!

# Get audit logs (admin only)
auditLogs(limit: Int, offset: Int): [AuditLogEntry!]!
```

### Mutations

```graphql
# Authentication
loginExtended(username: String!, password: String!): LoginResponse!
logout: Boolean!
refreshToken(refreshToken: String!): AuthTokens!

# User Management (admin only)
createUser(input: CreateUserInput!): UserExtended!
activateUser(userId: ID!): Boolean!
deactivateUser(userId: ID!): Boolean!

# Password Management
changePassword(input: ChangePasswordInput!): Boolean!
resetPasswordToDefault(userId: ID!): Boolean!

# Permission Management (admin only)
grantPermission(input: GrantPermissionInput!): Boolean!
revokePermission(userId: ID!, resourceType: String!, resourceId: ID): Boolean!
```

## Authentication Flow

### 1. User Login
```typescript
// Request
mutation {
  loginExtended(username: "john.doe", password: "DAP123") {
    user {
      id
      username
      email
      mustChangePassword
      isAdmin
    }
    tokens {
      token
      refreshToken
    }
  }
}

// Response includes JWT token with:
{
  userId: "user-id",
  username: "john.doe",
  email: "john@example.com",
  isAdmin: false,
  mustChangePassword: true,
  permissions: {
    products: [{id: "prod-1", level: "edit"}],
    solutions: [],
    customers: [{id: "cust-1", level: "view"}],
    system: false
  }
}
```

### 2. Token Usage
All API requests should include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### 3. Token Refresh
```typescript
mutation {
  refreshToken(refreshToken: "refresh-token-here") {
    token
    refreshToken
  }
}
```

## Service Layer

### AuthService Class

Located in `/backend/src/services/authService.ts`

**Key Methods:**
- `login(username, password)`: Authenticate user and return tokens
- `createUser(createdBy, userData)`: Create new user with default password
- `changePassword(userId, oldPassword, newPassword, changedBy)`: Change user password
- `resetPasswordToDefault(adminId, userId)`: Reset password to DAP123
- `grantPermission(grantedBy, userId, resourceType, resourceId, level)`: Grant permission
- `revokePermission(revokedBy, userId, resourceType, resourceId)`: Revoke permission
- `hasPermission(userId, resourceType, resourceId, action)`: Check if user has permission
- `getUserPermissions(userId)`: Get all permissions for a user
- `getAccessibleProducts(userId)`: Get products user can access
- `getAllUsers(requesterId)`: Get all users (admin only)
- `activateUser(adminId, userId)`: Activate user account
- `deactivateUser(adminId, userId)`: Deactivate user account

## Security Features

### 1. Password Hashing
- Uses bcryptjs with 10 salt rounds
- Passwords are never stored in plain text

### 2. JWT Tokens
- **Access Token**: Expires in 8 hours
- **Refresh Token**: Expires in 7 days
- Tokens include user ID, username, email, admin status, and permissions

### 3. Audit Logging
All authentication and permission changes are logged:
- User login/logout
- Password changes
- Permission grants/revokes
- User creation/activation/deactivation

### 4. Permission Checking
- Middleware validates tokens on all protected routes
- Permission checks happen at resolver level
- Admin users bypass all permission checks

## Usage Examples

### Creating a New User (Admin Only)

```graphql
mutation {
  createUser(input: {
    username: "jane.smith"
    email: "jane@company.com"
    fullName: "Jane Smith"
    isAdmin: false
  }) {
    id
    username
    email
    mustChangePassword  # Will be true
  }
}
```

### Granting Product Access

```graphql
mutation {
  grantPermission(input: {
    userId: "user-id-here"
    resourceType: "PRODUCT"
    resourceId: "product-id-here"
    permissionLevel: "EDIT"
  })
}
```

### Granting Solution Access (Auto-grants Product Access)

```graphql
mutation {
  grantPermission(input: {
    userId: "user-id-here"
    resourceType: "SOLUTION"
    resourceId: "solution-id-here"
    permissionLevel: "MANAGE"
  })
}
```

### Changing Password

```graphql
mutation {
  changePassword(input: {
    userId: "user-id-here"
    oldPassword: "DAP123"
    newPassword: "NewSecurePassword123!"
  })
}
```

### Resetting Password to Default

```graphql
mutation {
  resetPasswordToDefault(userId: "user-id-here")
}
```

## Seed Data

### Default Admin Account

The system is seeded with a default admin account:

- **Username**: `admin`
- **Email**: `admin@dynamicadoptionplans.com`
- **Password**: `Admin@123` (does not require change on first login)
- **Full Name**: System Administrator
- **Is Admin**: true
- **Is Active**: true

**To re-run the auth seed:**
```bash
cd backend
npm run seed:auth
```

## Configuration

### Environment Variables

```env
JWT_SECRET=your-secret-key-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/dap
```

## Frontend Integration Points

### 1. Login Form
- Should call `loginExtended` mutation
- Store both access and refresh tokens
- Check `mustChangePassword` flag and redirect to password change if true

### 2. Token Management
- Store access token in memory or secure storage
- Store refresh token in httpOnly cookie or secure storage
- Implement auto-refresh logic before token expires

### 3. Permission-Based UI
- Hide/disable UI elements based on user permissions
- Check `isAdmin` flag for admin-only features
- Validate permissions before showing edit/delete actions

### 4. Password Change Flow
- Force password change on first login if `mustChangePassword` is true
- Validate new password strength
- Show success/error messages

## Migration Steps

To apply the authentication schema to your database:

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed default admin user
npm run seed:auth
```

## Testing

### Test the Authentication

1. **Login with default admin:**
```graphql
mutation {
  loginExtended(username: "admin", password: "Admin@123") {
    user { id username email isAdmin }
    tokens { token refreshToken }
  }
}
```

2. **Create a test user:**
```graphql
mutation {
  createUser(input: {
    username: "testuser"
    email: "test@example.com"
    fullName: "Test User"
  }) {
    id
    username
    mustChangePassword
  }
}
```

3. **Grant permissions:**
```graphql
mutation {
  grantPermission(input: {
    userId: "<user-id-from-step-2>"
    resourceType: "PRODUCT"
    resourceId: "<some-product-id>"
    permissionLevel: "VIEW"
  })
}
```

4. **Test password reset:**
```graphql
mutation {
  resetPasswordToDefault(userId: "<user-id>")
}
```

## Next Steps

### Frontend Implementation
1. Create login page/component
2. Implement token storage and refresh logic
3. Add password change component
4. Create user management UI (admin only)
5. Add permission management UI (admin only)
6. Implement permission-based route guards
7. Add permission-based UI element visibility

### Additional Backend Features
1. Password complexity requirements
2. Account lockout after failed attempts
3. Password history (prevent reuse)
4. Two-factor authentication (2FA)
5. Session management
6. IP-based access restrictions
7. Email notifications for security events

## Support

For questions or issues related to authentication:
1. Check the audit logs for security events
2. Review the AuthService class for detailed implementation
3. Refer to the AUTH_DESIGN.md and AUTH_IMPLEMENTATION_GUIDE.md documents

---

**Last Updated:** November 11, 2025
**Version:** 1.0.0

