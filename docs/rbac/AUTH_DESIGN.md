# Authentication & Authorization Design

## Overview
This document outlines the authentication and role-based access control (RBAC) system for the Dynamic Adoption Plans application.

## Authentication Strategy

### 1. Authentication Flow
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────▶│   Backend    │─────▶│  Database   │
│  (React)    │◀─────│   (GraphQL)  │◀─────│  (SQLite)   │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │   1. Login          │
       │────────────────────▶│
       │                     │
       │   2. JWT Token      │
       │◀────────────────────│
       │                     │
       │   3. Requests       │
       │    + Token          │
       │────────────────────▶│
       │                     │
       │   4. Verify Token   │
       │    & Permissions    │
       │                     │
```

### 2. JWT Token Structure
```json
{
  "userId": "uuid",
  "username": "john.doe@company.com",
  "roles": ["admin", "sme_product_123", "cs_customer_456"],
  "permissions": {
    "products": ["product_123", "product_456"],
    "solutions": ["solution_789"],
    "customers": ["customer_456", "customer_789"]
  },
  "isAdmin": true,
  "exp": 1234567890
}
```

## Authorization Model

### 1. Resource Types
- **Products**: Individual products
- **Solutions**: Solution bundles (includes access to underlying products)
- **Customers**: Customer accounts
- **System**: System-wide operations (backup, restore, custom attributes)

### 2. Permission Types
- **view**: Read access to resource
- **edit**: Modify existing resource
- **create**: Create new instances
- **delete**: Delete resource
- **manage**: Full control (create, edit, delete)

### 3. Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                         ADMIN                            │
│              (Full access to everything)                 │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼─────────┐
│   SME ROLE     │  │   CS ROLE   │  │  CUSTOM ROLES    │
│  (Subject      │  │ (Customer   │  │  (Granular       │
│   Matter       │  │  Success)   │  │   Permissions)   │
│   Expert)      │  │             │  │                  │
└────────────────┘  └─────────────┘  └──────────────────┘
```

### 4. Role Definitions

#### Admin Role
```yaml
role: ADMIN
access:
  - all_products: manage
  - all_solutions: manage
  - all_customers: manage
  - system_settings: manage
  - user_management: manage
  - backup_restore: manage
```

#### SME (Subject Matter Expert) Role
```yaml
role: SME
resource_type: product | solution
resources: [product_id, solution_id]
permissions:
  - view: true
  - edit: true
  - create: true  # Can create related items
  - delete: true
  - manage_tasks: true
  - manage_outcomes: true
  - manage_licenses: true
  - manage_releases: true
notes:
  - SME for a solution automatically gets access to all underlying products
  - Can only create solutions using products they have SME access to
```

#### CS (Customer Success) Role
```yaml
role: CS
resource_type: customer
resources: [customer_id_1, customer_id_2]
permissions:
  - view: true
  - edit: true  # Can edit customer adoption data
  - create: false  # Cannot create new customers
  - delete: false  # Cannot delete customers
  - manage_adoption: true
  - track_progress: true
notes:
  - Can view products/solutions assigned to their customers (read-only)
  - Can update customer adoption data only
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Roles Table
```sql
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,  -- e.g., 'ADMIN', 'SME', 'CS'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Permissions Table
```sql
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,  -- 'product', 'solution', 'customer', 'system'
  resource_id TEXT,  -- NULL for global permissions (e.g., admin)
  permission_level TEXT NOT NULL,  -- 'view', 'edit', 'manage'
  granted_by TEXT,  -- user_id of admin who granted this
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id)
);

-- Index for fast permission lookups
CREATE INDEX idx_permissions_user ON permissions(user_id);
CREATE INDEX idx_permissions_resource ON permissions(resource_type, resource_id);
```

### User_Roles Table
```sql
CREATE TABLE user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);
```

### Audit Log Table
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,  -- 'login', 'view', 'create', 'edit', 'delete'
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,  -- JSON string with additional context
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
```

## Permission Checking Logic

### 1. Solution SME Access Rules
```typescript
/**
 * When checking if user has access to a product:
 * 1. Check if user is admin -> GRANT ACCESS
 * 2. Check if user has direct product SME permission -> GRANT ACCESS
 * 3. Check if user has SME access to any solution that includes this product -> GRANT ACCESS
 * 4. Otherwise -> DENY ACCESS
 */
function hasProductAccess(userId: string, productId: string, action: string): boolean {
  // Admin check
  if (isAdmin(userId)) return true;
  
  // Direct product permission
  if (hasDirectPermission(userId, 'product', productId, action)) return true;
  
  // Check via solution permission
  const solutionsWithProduct = getSolutionsContainingProduct(productId);
  for (const solution of solutionsWithProduct) {
    if (hasDirectPermission(userId, 'solution', solution.id, action)) {
      return true;
    }
  }
  
  return false;
}
```

### 2. Solution Creation Rules
```typescript
/**
 * User can create a solution only if they have SME access to ALL products in the solution
 */
function canCreateSolution(userId: string, productIds: string[]): boolean {
  if (isAdmin(userId)) return true;
  
  for (const productId of productIds) {
    if (!hasProductAccess(userId, productId, 'manage')) {
      return false;
    }
  }
  
  return true;
}
```

### 3. Customer Access Rules
```typescript
/**
 * CS role can view products/solutions assigned to their customers (read-only)
 */
function canViewProductViaCustomer(userId: string, productId: string): boolean {
  if (isAdmin(userId)) return true;
  
  // Direct access
  if (hasProductAccess(userId, productId, 'view')) return true;
  
  // Check if any customer they manage uses this product
  const userCustomers = getCustomersForUser(userId);
  for (const customer of userCustomers) {
    if (customerHasProduct(customer.id, productId)) {
      return true; // Read-only access
    }
  }
  
  return false;
}
```

## GraphQL Authorization

### 1. Field-Level Authorization
```typescript
// Example: Product field resolver with authorization
@Query()
@UseGuards(AuthGuard)
async product(
  @Args('id') id: string,
  @CurrentUser() user: User
) {
  // Check permission
  if (!await this.authService.hasProductAccess(user.id, id, 'view')) {
    throw new ForbiddenException('You do not have access to this product');
  }
  
  return this.productService.findOne(id);
}

@Mutation()
@UseGuards(AuthGuard)
async updateProduct(
  @Args('id') id: string,
  @Args('input') input: UpdateProductInput,
  @CurrentUser() user: User
) {
  // Check permission
  if (!await this.authService.hasProductAccess(user.id, id, 'edit')) {
    throw new ForbiddenException('You do not have permission to edit this product');
  }
  
  return this.productService.update(id, input);
}
```

### 2. Query Filtering
```typescript
/**
 * When fetching products list, automatically filter based on user permissions
 */
@Query()
@UseGuards(AuthGuard)
async products(@CurrentUser() user: User) {
  if (user.isAdmin) {
    // Admin sees all products
    return this.productService.findAll();
  }
  
  // Get products user has access to
  const accessibleProductIds = await this.authService.getAccessibleProducts(user.id);
  return this.productService.findByIds(accessibleProductIds);
}
```

## Frontend Implementation

### 1. Auth Context
```typescript
// frontend/src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (resource: string, resourceId: string, action: string) => boolean;
  canViewProduct: (productId: string) => boolean;
  canEditProduct: (productId: string) => boolean;
  canViewSolution: (solutionId: string) => boolean;
  canEditSolution: (solutionId: string) => boolean;
  canViewCustomer: (customerId: string) => boolean;
  canEditCustomer: (customerId: string) => boolean;
}
```

### 2. Protected Routes
```typescript
// frontend/src/components/ProtectedRoute.tsx
function ProtectedRoute({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode;
  requiredPermission?: Permission;
}) {
  const { isAuthenticated, hasPermission } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredPermission && !hasPermission(
    requiredPermission.resource,
    requiredPermission.resourceId,
    requiredPermission.action
  )) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
}
```

### 3. Conditional UI Rendering
```typescript
// Hide/show UI elements based on permissions
function ProductActions({ productId }: { productId: string }) {
  const { canEditProduct, canDeleteProduct } = useAuth();
  
  return (
    <Box>
      {canEditProduct(productId) && (
        <Button onClick={handleEdit}>Edit</Button>
      )}
      {canDeleteProduct(productId) && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </Box>
  );
}
```

## Security Considerations

### 1. Password Security
- Use bcrypt with salt rounds >= 10
- Enforce strong password requirements
- Implement password reset flow with secure tokens

### 2. Token Security
- JWT tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Store tokens in httpOnly cookies (not localStorage)
- Implement token rotation on refresh

### 3. API Security
- Rate limiting on authentication endpoints
- CSRF protection
- Input validation and sanitization
- SQL injection prevention (use parameterized queries)

### 4. Audit Trail
- Log all authentication attempts (success/failure)
- Log all permission changes
- Log all data access and modifications
- Retain logs for compliance (90 days minimum)

## Implementation Phases

### Phase 1: Authentication Foundation
1. Create database schema
2. Implement user registration/login
3. JWT token generation and validation
4. Basic admin role

### Phase 2: Role-Based Permissions
1. Implement permission checking logic
2. Add SME and CS roles
3. Create permission management UI (admin only)
4. Add user management interface

### Phase 3: Resource-Level Authorization
1. Add GraphQL authorization decorators
2. Implement field-level security
3. Add query filtering based on permissions
4. Update frontend to respect permissions

### Phase 4: Advanced Features
1. Permission inheritance (solution -> products)
2. Granular permission management
3. Audit logging and reporting
4. Permission delegation

## Example Permission Scenarios

### Scenario 1: SME for Product A
```yaml
User: alice@company.com
Permissions:
  - product_A: manage
  
Can:
  - View Product A
  - Edit Product A
  - Create tasks for Product A
  - Delete tasks for Product A
  - View customers using Product A (read-only)
  
Cannot:
  - Edit Product B
  - Create Solution (unless has access to all products in solution)
  - Edit customer data
```

### Scenario 2: SME for Solution X (contains Products A, B, C)
```yaml
User: bob@company.com
Permissions:
  - solution_X: manage
  
Can:
  - View and edit Solution X
  - View and edit Products A, B, C (inherited from solution)
  - Create tasks for Products A, B, C
  - Create new solutions using Products A, B, C
  
Cannot:
  - Edit Product D (not in Solution X)
  - Edit customer adoption data
```

### Scenario 3: CS for Customers 1 and 2
```yaml
User: carol@company.com
Permissions:
  - customer_1: manage
  - customer_2: manage
  
Can:
  - View Customer 1 and 2 details
  - Edit adoption data for Customers 1 and 2
  - View products/solutions assigned to Customers 1 and 2 (read-only)
  - Track progress and outcomes
  
Cannot:
  - Create or edit products
  - Create or edit solutions
  - View other customers
  - Delete customers
```

### Scenario 4: Admin
```yaml
User: admin@company.com
Permissions:
  - system: admin
  
Can:
  - Everything (full access)
  - Manage users and permissions
  - Backup and restore
  - System configuration
```

## API Examples

### Login
```graphql
mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    token
    refreshToken
    user {
      id
      username
      email
      isAdmin
      permissions {
        products
        solutions
        customers
      }
    }
  }
}
```

### Check Permission
```graphql
query CheckPermission($resourceType: String!, $resourceId: String!, $action: String!) {
  hasPermission(
    resourceType: $resourceType
    resourceId: $resourceId
    action: $action
  )
}
```

### Grant Permission (Admin Only)
```graphql
mutation GrantPermission($input: GrantPermissionInput!) {
  grantPermission(input: $input) {
    id
    userId
    resourceType
    resourceId
    permissionLevel
  }
}

input GrantPermissionInput {
  userId: String!
  resourceType: String!  # 'product', 'solution', 'customer'
  resourceId: String!
  permissionLevel: String!  # 'view', 'edit', 'manage'
}
```

### Get User Permissions
```graphql
query GetUserPermissions($userId: String!) {
  userPermissions(userId: $userId) {
    products {
      id
      name
      permissionLevel
    }
    solutions {
      id
      name
      permissionLevel
    }
    customers {
      id
      name
      permissionLevel
    }
  }
}
```

