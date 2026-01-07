# Application Blueprint Template

**Version:** 1.5.0  
**Last Updated:** January 6, 2026  
**Purpose:** Generate new applications with 100/100 architecture score from day one  
**Based On:** DAP (Digital Adoption Platform) - Production-proven architecture

> **v1.5.0 Additions:** Comprehensive Entity Auditing, Enhanced Audit Detail Panels, Historical Data Attribution Fallbacks
> **v1.4.0 Additions:** Session Inactivity Management (Sliding Window), RBAC Default Read-All Strategy
> **v1.3.0 Additions:** Optimistic UI patterns, Route Error Boundaries, Focus Management (a11y)

---

## How to Use This Document

This document serves as a **comprehensive prompt** for generating new applications. When starting a new project:

1. **Copy this document** to your new project
2. **Fill in the Application Specification** section with your specific requirements
3. **Use this document as context** when prompting AI assistants to generate code
4. **All generated code must comply** with the standards in this document

---

## Application Specification

> ⚠️ **FILL IN THIS SECTION** with your specific application requirements

### Application Name
```
[YOUR_APP_NAME]
```

### Purpose
```
[Describe what the application does in 2-3 sentences]
```

### Core Entities
```
[List the main domain entities, e.g., Product, Customer, Order]

Entity 1: [Name]
- Field 1: [type]
- Field 2: [type]
- Relationships: [...]

Entity 2: [Name]
- Field 1: [type]
- ...
```

### User Roles
```
[List roles with their permissions]

Role 1: ADMIN
- Full system access

Role 2: [ROLE_NAME]
- [Permission 1]
- [Permission 2]
```

### Key Features
```
[List main features]

1. [Feature 1]: [Brief description]
2. [Feature 2]: [Brief description]
3. ...
```

### Technical Requirements
```
Database: PostgreSQL (default) / [Other]
Authentication: JWT + Refresh Tokens (default) / [Other]
Frontend Framework: React + TypeScript (default) / [Other]
Backend Framework: Node.js + GraphQL (default) / [Other]
```

---

# ARCHITECTURE REQUIREMENTS

> **MANDATORY:** All code must comply with these requirements to maintain 100/100 score

---

## 1. Project Structure

### 1.1 Root Directory Structure

```
[app-name]/
├── backend/                    # Node.js GraphQL API
│   ├── src/
│   │   ├── modules/           # Domain modules (MANDATORY)
│   │   ├── shared/            # Shared utilities (MANDATORY)
│   │   ├── schema/            # GraphQL schema composition
│   │   ├── config/            # Configuration
│   │   └── server.ts          # Entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── Dockerfile             # Production container
│   ├── Dockerfile.dev         # Development container
│   └── package.json
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── features/          # Feature modules (MANDATORY)
│   │   ├── shared/            # Shared components (MANDATORY)
│   │   ├── pages/             # Route page components
│   │   ├── providers/         # Context providers
│   │   ├── routes/            # Route definitions
│   │   └── main.tsx           # Entry point
│   ├── Dockerfile             # Production container
│   ├── Dockerfile.dev         # Development container
│   └── package.json
│
├── e2e/                        # End-to-end tests
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
│   ├── hooks/                 # Git hooks
│   │   ├── pre-commit
│   │   └── pre-push
│   ├── enforce-modular-layout.sh
│   └── quality-check.sh
│
├── docker-compose.yml          # Production
├── docker-compose.dev.yml      # Development
├── package.json                # Root package.json
├── README.md
├── SECURITY.md
└── .env.example
```

### 1.2 Backend Module Structure (MANDATORY)

Every backend domain MUST have this structure:

```
backend/src/modules/[domain]/
├── [domain].service.ts         # Business logic
├── [domain].resolver.ts        # GraphQL resolvers
├── [domain].schema.graphql     # GraphQL type definitions
├── [domain].types.ts           # TypeScript interfaces
├── [domain].validation.ts      # Zod validation schemas
├── __tests__/                  # Module tests
│   └── [domain].service.test.ts
└── index.ts                    # Barrel export (PUBLIC API)
```

**Example: Product Module**
```
backend/src/modules/product/
├── product.service.ts
├── product.resolver.ts
├── product.schema.graphql
├── product.types.ts
├── product.validation.ts
├── __tests__/
│   └── product.service.test.ts
└── index.ts
```

### 1.3 Frontend Feature Structure (MANDATORY)

Every frontend feature MUST have this structure:

```
frontend/src/features/[feature]/
├── components/                 # React components
│   ├── [Feature]Dialog.tsx
│   ├── [Feature]List.tsx
│   ├── [Feature]Card.tsx
│   └── shared/                # Feature-specific shared
├── hooks/                      # Custom hooks
│   └── use[Feature].ts
├── graphql/                    # GraphQL operations
│   ├── queries.ts
│   └── mutations.ts
├── types/                      # TypeScript interfaces
│   └── index.ts
└── index.ts                    # Barrel export (PUBLIC API)
```

### 1.4 Shared Directory Structure

**Backend Shared:**
```
backend/src/shared/
├── auth/                       # Authentication utilities
│   ├── permissions.ts         # RBAC logic
│   └── jwt.ts                 # Token handling
├── errors/                     # Error handling
│   ├── AppError.ts            # Structured error class
│   ├── ErrorCodes.ts          # Error code enum
│   └── asyncHandler.ts        # Async wrapper
├── database/                   # Database utilities
│   ├── prisma.ts              # Prisma client
│   └── dataloaders.ts         # DataLoader instances
├── cache/                      # Caching
│   └── CacheService.ts        # LRU cache
├── health/                     # Health checks
│   └── healthCheck.ts
├── graphql/                    # GraphQL utilities
│   ├── context.ts             # Request context
│   └── queryComplexity.ts     # Query limits
└── utils/                      # General utilities
```

**Frontend Shared:**
```
frontend/src/shared/
├── components/                 # Reusable UI components
│   ├── dialogs/               # Dialog components
│   ├── forms/                 # Form components
│   ├── tables/                # Table components
│   └── layout/                # Layout components
├── hooks/                      # Shared hooks
├── utils/                      # Utility functions
├── types/                      # Shared types
├── theme/                      # Theme configuration
└── validation/                 # Validation utilities
```

---

## 2. Naming Conventions

### 2.1 Files and Directories

| Type | Convention | Example |
|------|------------|---------|
| Directories | kebab-case | `user-management/` |
| React Components | PascalCase.tsx | `ProductCard.tsx` |
| Hooks | camelCase with `use` | `useProducts.ts` |
| Services | camelCase.service.ts | `product.service.ts` |
| Types | camelCase.types.ts | `product.types.ts` |
| Tests | *.test.ts | `product.service.test.ts` |
| GraphQL | camelCase.schema.graphql | `product.schema.graphql` |

### 2.2 Code Naming

```typescript
// Variables - camelCase
const productName = 'Widget';
const isLoading = true;
const hasPermission = false;

// Constants - SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;
const API_TIMEOUT = 5000;
const DEFAULT_PAGE_SIZE = 20;

// Functions - camelCase with verb
function getProducts() {}
function createProduct() {}
function validateInput() {}
async function fetchUserData() {}

// Classes - PascalCase
class ProductService {}
class AppError {}

// Interfaces - PascalCase with 'I' prefix optional
interface Product {}
interface CreateProductInput {}
interface IProductService {} // Optional 'I' prefix

// Types - PascalCase
type ProductStatus = 'active' | 'inactive';
type ProductId = string;

// Enums - PascalCase with SCREAMING_SNAKE values
enum ErrorCodes {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

// React Components - PascalCase
const ProductCard: React.FC<ProductCardProps> = () => {};
const useProducts = () => {}; // Hooks start with 'use'

// Boolean variables - is/has/can/should prefix
const isActive = true;
const hasChildren = false;
const canEdit = true;
const shouldRefresh = false;
```

### 2.3 GraphQL Naming

```graphql
# Types - PascalCase
type Product {
  id: ID!
  name: String!
}

# Input Types - PascalCase with 'Input' suffix
input CreateProductInput {
  name: String!
}

input UpdateProductInput {
  name: String
}

# Queries - camelCase, noun-based
type Query {
  product(id: ID!): Product           # Single item
  products: ProductConnection!         # List with pagination
  productsByCategory(category: String!): [Product!]!
}

# Mutations - camelCase, verb + noun
type Mutation {
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: ID!, input: UpdateProductInput!): Product!
  deleteProduct(id: ID!): Boolean!
}

# Subscriptions - camelCase, event-based
type Subscription {
  productCreated: Product!
  productUpdated: Product!
}

# Enums - SCREAMING_SNAKE_CASE values
enum ProductStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

# Connections (Relay) - PascalCase with 'Connection' suffix
type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}
```

---

## 3. Code Quality Standards

### 3.1 TypeScript Configuration (MANDATORY)

**Backend tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Frontend tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"],
      "@pages/*": ["src/pages/*"],
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3.2 Error Handling Pattern (MANDATORY)

```typescript
// backend/src/shared/errors/ErrorCodes.ts
export enum ErrorCodes {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Business errors
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
}

// backend/src/shared/errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCodes,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

// Usage - ALWAYS use AppError, never raw Error
// ✅ CORRECT
throw new AppError('Product not found', ErrorCodes.NOT_FOUND, 404);

// ❌ WRONG - Never do this
throw new Error('Product not found');
```

### 3.3 Async Handler Pattern (MANDATORY)

```typescript
// backend/src/shared/errors/asyncHandler.ts
type AsyncFunction<T> = (...args: unknown[]) => Promise<T>;

export function asyncHandler<T>(fn: AsyncFunction<T>): AsyncFunction<T> {
  return async (...args: unknown[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      // Wrap unknown errors
      throw new AppError(
        error instanceof Error ? error.message : 'Unknown error',
        ErrorCodes.INTERNAL_ERROR,
        500
      );
    }
  };
}

// Usage in services
export const ProductService = {
  create: asyncHandler(async (input: CreateProductInput): Promise<Product> => {
    // Business logic here - errors are automatically handled
    const product = await prisma.product.create({ data: input });
    return product;
  }),
};
```

### 3.4 DataLoader Pattern (MANDATORY for GraphQL)

```typescript
// backend/src/shared/database/dataloaders.ts
import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export function createLoaders(prisma: PrismaClient) {
  return {
    // Entity loaders
    productById: new DataLoader<string, Product | null>(async (ids) => {
      const products = await prisma.product.findMany({
        where: { id: { in: [...ids] } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));
      return ids.map((id) => productMap.get(id) ?? null);
    }),

    // Relationship loaders
    tasksByProduct: new DataLoader<string, Task[]>(async (productIds) => {
      const tasks = await prisma.task.findMany({
        where: { productId: { in: [...productIds] } },
        orderBy: { sequenceNumber: 'asc' },
      });
      const tasksByProduct = new Map<string, Task[]>();
      tasks.forEach((task) => {
        const existing = tasksByProduct.get(task.productId) || [];
        existing.push(task);
        tasksByProduct.set(task.productId, existing);
      });
      return productIds.map((id) => tasksByProduct.get(id) || []);
    }),
  };
}

// Usage in resolvers - ALWAYS use DataLoader
// ✅ CORRECT
const ProductResolvers = {
  Product: {
    tasks: (parent: Product, _: unknown, ctx: Context) => {
      return ctx.loaders.tasksByProduct.load(parent.id);
    },
  },
};

// ❌ WRONG - N+1 query problem
const ProductResolvers = {
  Product: {
    tasks: (parent: Product) => {
      return prisma.task.findMany({ where: { productId: parent.id } });
    },
  },
};
```

### 3.5 JSDoc Documentation (MANDATORY for Public APIs)

```typescript
/**
 * Creates a new product in the database.
 *
 * @param input - The product creation parameters
 * @returns The created product with generated ID
 * @throws {AppError} NOT_FOUND if category doesn't exist
 * @throws {AppError} DUPLICATE_ENTRY if name already exists
 *
 * @example
 * ```typescript
 * const product = await ProductService.create({
 *   name: 'New Product',
 *   description: 'Product description',
 *   categoryId: 'cat-123',
 * });
 * ```
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  // Implementation
}
```

### 3.6 React Component Pattern

```tsx
// ✅ CORRECT - Full typed component with JSDoc
import React, { memo, useCallback } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

/**
 * Props for ProductCard component.
 */
interface ProductCardProps {
  /** The product to display */
  product: Product;
  /** Called when edit button is clicked */
  onEdit?: (product: Product) => void;
  /** Whether the card is in loading state */
  isLoading?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Displays a product card with name, description, and edit capability.
 *
 * @example
 * ```tsx
 * <ProductCard
 *   product={product}
 *   onEdit={handleEdit}
 *   isLoading={false}
 * />
 * ```
 */
export const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  onEdit,
  isLoading = false,
  className,
}) => {
  const handleEditClick = useCallback(() => {
    onEdit?.(product);
  }, [onEdit, product]);

  if (isLoading) {
    return <ProductCardSkeleton />;
  }

  return (
    <Box className={className} data-testid="product-card">
      <Typography variant="h6">{product.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {product.description}
      </Typography>
      {onEdit && (
        <IconButton onClick={handleEditClick} aria-label="Edit product">
          <EditIcon />
        </IconButton>
      )}
    </Box>
  );
});

ProductCard.displayName = 'ProductCard';
```

### 3.7 Server-Side Sorting Pattern (MANDATORY for Paginated Lists)

> ⚠️ **CRITICAL:** Never sort paginated data client-side. This only sorts the visible page, not the entire dataset.

```typescript
// ❌ WRONG - Client-side sorting (only sorts visible 25 items!)
const sortedProducts = React.useMemo(() => {
  return [...products].sort((a, b) => a.name.localeCompare(b.name));
}, [products]);

// ✅ CORRECT - Server-side sorting via GraphQL
```

**Step 1: Add sorting types to GraphQL schema**
```graphql
enum ProductSortField {
  NAME
  CREATED_AT
  UPDATED_AT
}

enum SortDirection {
  ASC
  DESC
}

input ProductOrderByInput {
  field: ProductSortField!
  direction: SortDirection!
}

type Query {
  products(
    first: Int
    after: String
    orderBy: ProductOrderByInput
  ): ProductConnection!
}
```

**Step 2: Update pagination utility**
```typescript
// backend/src/shared/utils/pagination.ts
export async function fetchProductsPaginated(args: {
  first?: number;
  after?: string;
  orderBy?: { field: string; direction: 'ASC' | 'DESC' };
}) {
  const sortField = args.orderBy?.field === 'NAME' ? 'name' : 'updatedAt';
  const sortDir = args.orderBy?.direction?.toLowerCase() || 'desc';

  const rows = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: [{ [sortField]: sortDir }, { id: 'asc' }],
    take: args.first || 25,
  });
  // ... build connection
}
```

**Step 3: Frontend triggers network request on sort change**
```tsx
// frontend/src/features/products/components/ProductsPanel.tsx
const handleSortChange = (field: string, direction: 'ASC' | 'DESC') => {
  setArgs({
    first: 25,
    orderBy: { field, direction }
  }); // Triggers network request!
};
```

### 3.8 Route Guard Pattern (MANDATORY for Protected Routes)

> ⚠️ **CRITICAL:** Never use conditional rendering inside `<Routes>`. Use wrapper components.

```tsx
// ❌ WRONG - Conditional rendering inside Routes
<Routes>
  {user?.isAdmin && (
    <Route path="/admin/*" element={<AdminRoutes />} />
  )}
</Routes>

// ✅ CORRECT - Route guard wrapper component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Usage with flat route structure
<Routes>
  <Route path="/admin/users" element={
    <AdminRoute>
      <UserManagement />
    </AdminRoute>
  } />
  <Route path="/admin/roles" element={
    <AdminRoute>
      <RoleManagement />
    </AdminRoute>
  } />
</Routes>
```

### 3.9 Optimistic Mutation Pattern (MANDATORY for Delete/Update)

> ⚠️ **CRITICAL:** Never wait for server response before updating UI for common actions like delete.

```typescript
// ❌ WRONG - Wait for server before UI update (sluggish)
const handleDelete = async (id: string) => {
  await deleteProduct({ variables: { id } }); // User waits...
  await refetch(); // User waits more...
};

// ✅ CORRECT - Optimistic update with automatic rollback
const [deleteProduct] = useMutation(DELETE_PRODUCT, {
  // Update cache BEFORE server responds
  update(cache, _, { variables }) {
    const existingData = cache.readQuery({ query: PRODUCTS, variables: args });
    if (existingData?.products?.edges) {
      const newEdges = existingData.products.edges.filter(
        (edge: any) => edge.node.id !== variables.id
      );
      cache.writeQuery({
        query: PRODUCTS,
        variables: args,
        data: { products: { ...existingData.products, edges: newEdges }}
      });
    }
  },
  // Optimistic response for instant UI
  optimisticResponse: ({ id }) => ({ deleteProduct: true }),
  // Error = automatic rollback + toast
  onError: (error) => showToast(`Delete failed: ${error.message}. Item restored.`, 'error'),
  onCompleted: () => showToast('Deleted successfully', 'success')
});
```

**User Experience Flow:**
1. ⚡ Click delete → Dialog closes **instantly**
2. ⚡ Item removed from table **instantly**
3. 📡 Server request fires in background
4. ✅ Success → Green toast notification
5. ❌ Failure → Red toast + **automatic rollback** (item reappears)

### 3.10 Route Error Boundary Pattern (MANDATORY for Resilience)

> ⚠️ **CRITICAL:** A crash in one page should not crash the entire app.

```tsx
// frontend/src/shared/components/RouteErrorBoundary.tsx
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
          <Typography variant="h5">{this.props.routeName} failed to load</Typography>
          <Typography>The rest of the app is still working—navigate using the sidebar.</Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button onClick={this.handleRetry}>Try Again</Button>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}

// Combined Suspense + Error Boundary wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; routeName: string }> = 
  ({ children, routeName, fallback = <PageSkeleton /> }) => (
    <RouteErrorBoundary routeName={routeName}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </RouteErrorBoundary>
  );

// Usage in routes
<Route path="/products" element={<ProtectedRoute routeName="Products"><ProductsPage /></ProtectedRoute>} />
<Route path="/solutions" element={<ProtectedRoute routeName="Solutions"><SolutionsPage /></ProtectedRoute>} />
```

**Result:** If `/products` throws an error, user sees "Products failed to load" but can still click "Dashboard" in sidebar.

### 3.11 Focus Management Pattern (MANDATORY for a11y)

> ⚠️ **CRITICAL:** Keyboard users must not lose focus after pagination or data refresh.

```tsx
// Refs for focus targets
const tableContainerRef = useRef<HTMLDivElement>(null);
const prevButtonRef = useRef<HTMLButtonElement>(null);
const [pendingFocus, setPendingFocus] = useState<'table' | 'prev' | null>(null);

// Focus management after data loads
useEffect(() => {
  if (!loading && pendingFocus) {
    setTimeout(() => {
      if (pendingFocus === 'table') {
        tableContainerRef.current?.focus();
        tableContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (pendingFocus === 'prev') {
        prevButtonRef.current?.focus();
      }
      setPendingFocus(null);
    }, 100);
  }
}, [loading, pendingFocus]);

// Pagination handlers set pending focus
const loadNext = () => { setArgs({...}); setPendingFocus('prev'); };
const loadPrev = () => { setArgs({...}); setPendingFocus('table'); };

// Table container must be focusable
<TableContainer ref={tableContainerRef} tabIndex={-1} sx={{
  '&:focus': { outline: 'none' },
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
}}>
```

**Accessibility Rules:**
- After **Next Page**: Focus moves to "Previous" button (user can go back)
- After **Previous Page**: Focus moves to top of table
- All interactive elements have `aria-label` attributes

---

## 4. Database Schema Design

### 4.1 Prisma Schema Conventions

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================================================
// CORE ENTITIES
// =============================================================================

/// Product entity representing items in the catalog
model Product {
  id          String    @id @default(cuid())
  name        String
  description String?
  status      ProductStatus @default(ACTIVE)
  customAttrs Json?     /// Flexible JSON for custom attributes
  
  // Audit fields (MANDATORY on all entities)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime? /// Soft delete support
  
  // Relationships
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  tasks       Task[]
  tags        ProductTag[]
  
  // Indexes for common queries
  @@index([status])
  @@index([categoryId])
  @@index([deletedAt]) // Soft delete filtering
  @@index([createdAt])
  
  // Unique constraints
  @@unique([name, deletedAt]) // Allow same name if one is deleted
}

/// Task entity representing work items
model Task {
  id             String    @id @default(cuid())
  name           String
  description    String?
  weight         Float     @default(0)  /// Percentage weight (0-100)
  sequenceNumber Int       /// Execution order
  status         TaskStatus @default(NOT_STARTED)
  
  // Audit fields
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?
  
  // Relationships
  productId      String?
  product        Product?  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  // Unique sequence per product
  @@unique([productId, sequenceNumber])
  @@index([productId])
  @@index([status])
  @@index([deletedAt])
}

// =============================================================================
// ENUMS
// =============================================================================

enum ProductStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum TaskStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// =============================================================================
// JUNCTION TABLES (Many-to-Many)
// =============================================================================

/// Junction table for Product-Tag relationship
model ProductTag {
  id        String   @id @default(cuid())
  productId String
  tagId     String
  order     Int      @default(0) /// For ordering tags
  
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([productId, tagId])
  @@index([productId])
  @@index([tagId])
}
```

### 4.2 Database Schema Rules

1. **Always include audit fields**: `createdAt`, `updatedAt`, `deletedAt`
2. **Use soft deletes**: `deletedAt DateTime?` instead of hard deletes
3. **Add indexes**: On foreign keys, status fields, and common query patterns
4. **Use enums**: For status fields and other constrained values
5. **Document models**: Use `///` comments for model documentation
6. **Cascade deletes**: Use `onDelete: Cascade` where appropriate
7. **CUID for IDs**: Use `@default(cuid())` for primary keys

---

## 5. Security Requirements

### 5.1 Authentication (JWT)

```typescript
// backend/src/shared/auth/jwt.ts
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '8h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
}
```

### 5.2 RBAC (Role-Based Access Control)

```typescript
// backend/src/shared/auth/permissions.ts
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  VIEWER = 'VIEWER',
}

export enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN',
}

export enum Resource {
  PRODUCT = 'PRODUCT',
  CUSTOMER = 'CUSTOMER',
  SYSTEM = 'SYSTEM',
}

const rolePermissions: Record<Role, Record<Resource, Permission[]>> = {
  [Role.ADMIN]: {
    [Resource.PRODUCT]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
    [Resource.CUSTOMER]: [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN],
    [Resource.SYSTEM]: [Permission.ADMIN],
  },
  [Role.MANAGER]: {
    [Resource.PRODUCT]: [Permission.READ, Permission.WRITE],
    [Resource.CUSTOMER]: [Permission.READ, Permission.WRITE],
    [Resource.SYSTEM]: [],
  },
  [Role.USER]: {
    [Resource.PRODUCT]: [Permission.READ],
    [Resource.CUSTOMER]: [Permission.READ, Permission.WRITE],
    [Resource.SYSTEM]: [],
  },
  [Role.VIEWER]: {
    [Resource.PRODUCT]: [Permission.READ],
    [Resource.CUSTOMER]: [Permission.READ],
    [Resource.SYSTEM]: [],
  },
};

export function hasPermission(
  role: Role,
  resource: Resource,
  permission: Permission
): boolean {
  return rolePermissions[role]?.[resource]?.includes(permission) ?? false;
}

export function requirePermission(
  ctx: Context,
  resource: Resource,
  permission: Permission
): void {
  if (!ctx.user) {
    throw new AppError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401);
  }
  if (!hasPermission(ctx.user.role as Role, resource, permission)) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }
}
```

### 5.3 RBAC Default Read-Only Strategy (MANDATORY for Catalog Visibility)

> ⚠️ **CRITICAL:** To reduce administration friction, the system provides a "Default Read-All" capability for common catalog resources.

**Pattern:**
- All `USER` role accounts have baseline `READ` visibility to `PRODUCT`, `SOLUTION`, and `CUSTOMER`.
- This is controlled by a feature flag: `RBAC_DEFAULT_USER_READ_ALL`.
- Logic: `canRead = user.isAdmin || (isUser && RBAC_DEFAULT_USER_READ_ALL) || rolePermissions.has(READ)`.

### 5.4 Session Inactivity Management (Sliding Window)

> ⚠️ **CRITICAL:** High-security applications MUST implement session expiration that resets on activity.

**Pattern:**
1. **Initial Expiration**: Set `expiresAt` during login/signup based on `SESSION_INACTIVITY_TIMEOUT_MS`.
2. **Heartbeat Extension**: On every valid GraphQL request, extend the `expiresAt` of the current session.
3. **Automated Cleanup**: A background process or scheduled job clears sessions where `expiresAt < now`.

**Implementation Example (`context.ts`):**
```typescript
// On every request
if (session && envConfig.auth.sessionTimeoutMs) {
  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt: new Date(Date.now() + envConfig.auth.sessionTimeoutMs) }
  });
}
```

### 5.5 Security Headers (MANDATORY)

```typescript
// backend/src/server.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  } : false,
  xFrameOptions: { action: 'sameorigin' },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  strictTransportSecurity: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
  } : false,
}));
```

### 5.4 Production Security Validation (MANDATORY)

> ⚠️ **CRITICAL:** The application MUST crash at startup if critical secrets are missing in production. Never use hardcoded fallbacks for security-sensitive values.

```typescript
// backend/src/config/env.ts
const CRITICAL_SECRETS = ['JWT_SECRET', 'DATABASE_URL'] as const;

function validateCriticalSecrets(): void {
  if (process.env.NODE_ENV !== 'production') return;
  
  const missing: string[] = [];
  for (const secret of CRITICAL_SECRETS) {
    if (!process.env[secret]?.trim()) {
      missing.push(secret);
    }
  }
  
  // Check for insecure patterns
  const jwtSecret = process.env.JWT_SECRET || '';
  const dangerousPatterns = ['dev-secret', 'changeme', 'test', 'password'];
  for (const pattern of dangerousPatterns) {
    if (jwtSecret.toLowerCase().includes(pattern)) {
      console.error('⛔ SECURITY VIOLATION: JWT_SECRET contains insecure pattern');
      process.exit(1);
    }
  }
  
  if (missing.length > 0) {
    console.error(`⛔ FATAL: Missing secrets: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  if (jwtSecret.length < 32) {
    console.error('⛔ SECURITY VIOLATION: JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }
}

// Run at module load (before server starts)
validateCriticalSecrets();
```

**Anti-Pattern - NEVER do this:**
```typescript
// ❌ WRONG - Hardcoded fallback secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const DEFAULT_PASSWORD = 'password123';

// ✅ CORRECT - Import from validated config
import { envConfig } from '../../config/env';
const JWT_SECRET = envConfig.auth.jwtSecret; // Validated at startup
```

### 5.5 Log Sanitization (MANDATORY)

> ⚠️ **CRITICAL:** Never log passwords, tokens, or connection strings. Even in error messages.

```typescript
// backend/src/shared/utils/logSanitizer.ts
const REDACTION_PATTERNS = [
  // JWT tokens
  { pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: '[JWT_REDACTED]' },
  // Database connection strings
  { pattern: /(postgres|mysql|mongodb):\/\/[^:]+:([^@]+)@/gi, replacement: '$1://user:[REDACTED]@' },
  // Bearer tokens
  { pattern: /(Bearer\s+)[A-Za-z0-9_\-\.]{20,}/gi, replacement: '$1[TOKEN_REDACTED]' },
  // Passwords in JSON
  { pattern: /("?password"?\s*[:=]\s*"?)([^"'\s]{6,})("?)/gi, replacement: '$1[REDACTED]$3' },
];

export function sanitizeLog(message: string): string {
  let text = message;
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}
```

**Anti-Patterns - NEVER do this:**
```typescript
// ❌ WRONG - Logging passwords
await this.logAudit(userId, 'create_user', null, null, 
  `Created user with password ${DEFAULT_PASSWORD}`);

// ❌ WRONG - Logging connection strings in errors
console.error(`Database error: ${process.env.DATABASE_URL}`);

// ❌ WRONG - Logging tokens
console.log(`User authenticated with token: ${token}`);

// ✅ CORRECT - Sanitized logging
await this.logAudit(userId, 'create_user', null, null, 
  'Created user with default password');

// ✅ CORRECT - Generic error messages
console.error('Database connection failed');

// ✅ CORRECT - No token in logs
console.log('User authenticated successfully');
```

### 5.6 User Enumeration Prevention (MANDATORY)

> ⚠️ **CRITICAL:** Auth errors must never reveal whether a username/email exists.

```typescript
// ❌ WRONG - Different messages reveal user existence
if (!user) throw new Error('User not found');
if (!user.isActive) throw new Error('Account is disabled');
if (!validPassword) throw new Error('Invalid password');

// ✅ CORRECT - Unified message for all auth failures
if (!user || !user.isActive) {
  console.warn('[Auth] Login attempt failed'); // Don't log username!
  throw new Error('Invalid credentials');
}
if (!validPassword) {
  console.warn('[Auth] Login attempt failed');
  throw new Error('Invalid credentials');
}
```

**Why this matters:**
- "User not found" → Attacker knows this email is NOT registered
- "Account disabled" → Attacker knows this email IS registered
- "Invalid credentials" → Attacker learns nothing

---

## 6. Testing Requirements

### 6.1 Test Structure

```
backend/src/__tests__/
├── factories/
│   └── TestFactory.ts          # Faker-based data factories
├── modules/
│   └── [module]/
│       └── [module].service.test.ts
├── shared/
│   └── errors/
│       ├── AppError.test.ts
│       └── asyncHandler.test.ts
└── integration/
    └── graphql.test.ts

frontend/src/__tests__/
├── testUtils.tsx               # Test utilities
├── components/
│   └── [Component].test.tsx
└── hooks/
    └── use[Hook].test.ts

e2e/
├── auth.spec.ts
├── [feature].spec.ts
└── navigation.spec.ts
```

### 6.2 Test Examples

**Unit Test:**
```typescript
// backend/src/__tests__/modules/product/product.service.test.ts
import { ProductService } from '@modules/product';
import { prismaMock } from '../../../setup';
import { TestFactory } from '../../factories/TestFactory';

describe('ProductService', () => {
  describe('create', () => {
    it('should create a product with valid input', async () => {
      const input = TestFactory.createProductInput();
      const expected = TestFactory.product(input);
      
      prismaMock.product.create.mockResolvedValue(expected);
      
      const result = await ProductService.create(input);
      
      expect(result).toEqual(expected);
      expect(prismaMock.product.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it('should throw DUPLICATE_ENTRY for existing name', async () => {
      const input = TestFactory.createProductInput({ name: 'Existing' });
      prismaMock.product.findFirst.mockResolvedValue(TestFactory.product());
      
      await expect(ProductService.create(input))
        .rejects.toThrow('already exists');
    });
  });
});
```

**Component Test:**
```tsx
// frontend/src/__tests__/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@features/products/components/ProductCard';
import { TestFactory } from '../testUtils';

describe('ProductCard', () => {
  it('renders product name', () => {
    const product = TestFactory.product({ name: 'Test Product' });
    
    render(<ProductCard product={product} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('calls onEdit when clicked', () => {
    const product = TestFactory.product();
    const handleEdit = jest.fn();
    
    render(<ProductCard product={product} onEdit={handleEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(handleEdit).toHaveBeenCalledWith(product);
  });
});
```

**E2E Test:**
```typescript
// e2e/products.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('can create a new product', async ({ page }) => {
    await page.goto('/products');
    await page.click('button:has-text("Add Product")');
    
    await page.fill('[name="name"]', 'New Product');
    await page.fill('[name="description"]', 'Description');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=New Product')).toBeVisible();
  });
});
```

### 6.3 Coverage Requirements

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### 6.4 Test Environment Safety Guards (MANDATORY)

> ⚠️ **CRITICAL:** Tests must be deterministic and must never run against a real/dev database by accident.

**Required Guards:**
- **Dedicated Test DB**: Default `DATABASE_URL` to an isolated database (e.g., `dap_test`).
- **Refuse Non-Test DBs**: If `DATABASE_URL` does not look like a test DB, abort tests unless explicitly overridden.
- **Deterministic Secrets**: If your runtime validates secrets at import time (e.g. `JWT_SECRET` min length), tests must set a safe in-process value to prevent env drift.
- **No Hardcoded Credentials**: Never commit passwords/tokens/keys in source (including “default/demo” passwords). Prefer generated secrets in tests and env-provided values for dev tooling/UI.

### 6.7 RBAC Testing Requirements (MANDATORY)

> ⚠️ **CRITICAL:** RBAC regressions must be caught by tests that exercise the real GraphQL schema + resolvers.

**Rules:**
- Add at least one integration test suite that hits `/graphql` and verifies:
  - **READ vs WRITE** enforcement for a non-admin user
  - Role-based permissions (`RolePermission`) are respected
  - “Type-level” grants (`resourceId=null`) are required for create operations
- Include at least one toggle/regression test for any RBAC feature flags (e.g. default read-all, legacy shortcuts).

### 6.6 GraphQL Contract Gate (MANDATORY)

> ⚠️ **CRITICAL:** Prevent frontend GraphQL operations from drifting away from the backend schema.

**Rule:**
- CI MUST run a contract gate that fails if frontend codegen output changes after regenerating against the current backend schema.

**Implementation Pattern:**
- Add a script that:
  - Runs frontend codegen
  - Fails if `frontend/src/generated/graphql.ts` has uncommitted diffs

```bash
bash scripts/check-graphql-contract.sh
```

**Why this matters:**
- Catches contract drift before runtime (prevents 400s like “missing required field” / “unknown field”).

### 6.5 Integration Test Rule: Exercise the Real GraphQL Resolver Path

> ✅ Integration tests should look like “create task” tests: they call `/graphql` with the real schema + resolvers and validate responses.

**Rules:**
- Prefer calling GraphQL mutations/queries over invoking services directly when validating end-to-end behavior.
- Use a real `Authorization: Bearer <jwt>` and a `context.user` shape that matches production (`userId`, `role`, `isAdmin`).
- Avoid “magic” tokens unless your auth stack explicitly supports them.

---

## 7. Git Hooks & Quality Gates

### 7.1 Pre-Commit Hook

```bash
#!/bin/bash
# scripts/hooks/pre-commit

set -e

echo "Running pre-commit checks..."

# 1. TypeScript compilation
echo "[1/4] TypeScript check..."
cd backend && npx tsc --noEmit
cd ../frontend && npx tsc --noEmit
cd ..

# 2. ESLint
echo "[2/4] ESLint..."
npm run lint

# 3. Modular layout
echo "[3/4] Modular layout..."
bash scripts/enforce-modular-layout.sh

# 4. Circular dependencies
echo "[4/4] Circular dependencies..."
npm run check:circular

echo "✓ All pre-commit checks passed"
```

### 7.2 Pre-Push Hook

```bash
#!/bin/bash
# scripts/hooks/pre-push

set -e

echo "Running pre-push checks..."

# 1. All pre-commit checks
bash scripts/hooks/pre-commit

# 2. Tests
echo "[5/6] Running tests..."
npm test

# 3. Build verification
echo "[6/6] Build verification..."
cd backend && npm run build
cd ../frontend && npm run build
cd ..

echo "✓ All pre-push checks passed"
```

### 7.3 Package.json Scripts

```json
{
  "scripts": {
    "prepare": "bash scripts/install-hooks.sh || true",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint",
    "typecheck": "npm run typecheck:backend && npm run typecheck:frontend",
    "typecheck:backend": "cd backend && npx tsc --noEmit",
    "typecheck:frontend": "cd frontend && npx tsc --noEmit",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "test:coverage": "npm run test:coverage:backend && npm run test:coverage:frontend",
    "test:e2e": "npx playwright test",
    "check:circular": "npm run check:circular:backend && npm run check:circular:frontend",
    "check:circular:backend": "cd backend && npx madge --circular src/",
    "check:circular:frontend": "cd frontend && npx madge --circular src/",
    "check:all": "npm run lint && npm run typecheck && npm run check:circular && npm test",
    "quality:quick": "npm run lint && npm run typecheck && npm run check:circular",
    "quality:full": "npm run check:all && npm run test:e2e"
  }
}
```

---

## 8. DevOps Requirements

### 8.1 Docker Configuration

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# Stage 2: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Runtime
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1
CMD ["node", "dist/server.js"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### 8.2 Health Check Endpoints

```typescript
// backend/src/shared/health/healthCheck.ts
import { Router } from 'express';
import { prisma } from '../database/prisma';

export function createHealthRouter(): Router {
  const router = Router();

  // Detailed health check
  router.get('/health', async (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        database: await checkDatabase(),
        memory: checkMemory(),
      },
    };
    res.json(health);
  });

  // Kubernetes liveness probe
  router.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'alive' });
  });

  // Kubernetes readiness probe
  router.get('/health/ready', async (req, res) => {
    const dbHealthy = await checkDatabase();
    if (dbHealthy.status === 'healthy') {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database' });
    }
  });

  return router;
}
```

---

## 9. Documentation Requirements

### 9.1 Required Documentation Files

```
docs/
├── README.md                   # Project overview (in root)
├── CONTEXT.md                  # Comprehensive app context
├── DEVELOPER.md                # Developer guide
├── API_REFERENCE.md            # GraphQL API docs
├── ARCHITECTURE.md             # System design
├── SECURITY.md                 # Security policy (in root)
├── QUALITY_STANDARDS.md        # Quality requirements
├── SCHEMA_REFERENCE.md         # Database schema docs
└── CHANGELOG.md                # Version history (in root)
```

### 9.2 README.md Template

```markdown
# [Application Name]

**Version:** X.X.X | **Status:** [Status] | **Last Updated:** [Date]

[One-line description]

## Quick Start

\`\`\`bash
# Clone and setup
git clone [repo-url]
cd [app-name]
npm install

# Start development
./[app] start
\`\`\`

## Documentation

- [Developer Guide](docs/DEVELOPER.md)
- [API Reference](docs/API_REFERENCE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Quality Standards](docs/QUALITY_STANDARDS.md)

## Technology Stack

- **Frontend:** React 19 + TypeScript + Material-UI
- **Backend:** Node.js + GraphQL + Apollo Server
- **Database:** PostgreSQL + Prisma
- **Testing:** Jest + Playwright

## License

[License]
```

### 9.3 Documentation Security Rule: Never Publish Credentials

> ⚠️ **CRITICAL:** Documentation is part of your repository. Do not include passwords, tokens, private keys, certificates, or “default/demo” credentials in docs.

**Rules:**
- Use placeholders like `<DEFAULT_PASSWORD>` / `<ADMIN_PASSWORD>` / `<TOKEN>`.
- If the UI requires a “default password” for admin-created accounts, it must be **environment-configured**:
  - Backend: `DEFAULT_USER_PASSWORD`
  - Frontend: `VITE_DEFAULT_USER_PASSWORD`

**Rationale:**
- Repos are routinely copied, shared, and indexed; any credential in docs should be treated as compromised.

---

## 10. Checklist for 100/100 Score

### Architecture & Structure (10/10)
- [ ] Backend modules in `src/modules/[domain]/`
- [ ] Frontend features in `src/features/[feature]/`
- [ ] Barrel exports (`index.ts`) for all modules
- [ ] No circular dependencies
- [ ] Shared code in `src/shared/`

### Code Quality (10/10)
- [ ] TypeScript strict mode enabled
- [ ] No `any` types
- [ ] JSDoc on all public APIs
- [ ] Structured error handling (AppError)
- [ ] Async handler pattern

### Testing (10/10)
- [ ] Unit tests for services
- [ ] Component tests for UI
- [ ] E2E tests for critical flows
- [ ] 70%+ coverage threshold
- [ ] Test factories with Faker

### Database (10/10)
- [ ] Audit fields on all models
- [ ] Soft delete pattern
- [ ] Proper indexing
- [ ] Model documentation
- [ ] Enums for status fields

### Security (10/10)
- [ ] JWT + refresh tokens
- [ ] RBAC implementation
- [ ] Security headers (Helmet)
- [ ] Input validation (Zod)
- [ ] Password hashing (bcrypt)
- [ ] Log sanitization (no secrets in logs)
- [ ] User enumeration prevention (unified auth errors)
- [ ] Production secret validation (crash on missing)

### API Design (10/10)
- [ ] Relay pagination
- [ ] DataLoader for N+1
- [ ] Query complexity limits
- [ ] Structured errors
- [ ] Schema documentation

### Frontend (10/10)
- [ ] Feature-based organization
- [ ] Lazy loading for routes
- [ ] Type-safe components
- [ ] Custom hooks abstraction
- [ ] Theme configuration
- [ ] Optimistic mutations (instant UI feedback)
- [ ] Route error boundaries (granular fault tolerance)
- [ ] Focus management (a11y for keyboard users)

### DevOps (10/10)
- [ ] Multi-stage Dockerfiles
- [ ] Health check endpoints
- [ ] Docker Compose configs
- [ ] CI/CD pipeline
- [ ] Git hooks

### Documentation (10/10)
- [ ] README with quick start
- [ ] Developer guide
- [ ] API reference
- [ ] Architecture docs
- [ ] Security policy

### Performance (10/10)
- [ ] Code splitting (Vite chunks)
- [ ] Lazy loading (React.lazy)
- [ ] DataLoader batching
- [ ] Query complexity limits
- [ ] Caching strategy

### Frontend Hosting Consistency (MANDATORY)

> ⚠️ **CRITICAL:** The bundler `base` path must match how the SPA is served, or you will get a blank screen with `index-*.js` / `vendor-*.js` 404s.

**Rules:**
- If the app is served at **root** (e.g. `http://localhost:5173/`), base should be `/`.
- If the app is served under a subpath (e.g. `https://host/dap/`), base must be `/dap/` so assets load from `/dap/assets/...`.
- Validate by checking DevTools → Network: the referenced `/assets/*.js` requests must return **200**.

### Frontend Hosting Resilience (MANDATORY)

> ⚠️ **CRITICAL:** Lazy route chunks must be resilient to stale cached entry bundles after rebuilds/deploys.

**Required Pattern:**
- When a dynamically imported chunk fails to load (e.g. `Failed to fetch dynamically imported module` / `ChunkLoadError`):
  - Show a user-friendly message
  - Provide a **full reload** action that refreshes `index.html` and asset hashes
- If using preview/static hosting, ensure `index.html` is not cached aggressively (`Cache-Control: no-store` or equivalent).

---

## Using This Blueprint

### Step 1: Create New Project

```bash
mkdir my-new-app
cd my-new-app
git init
```

### Step 2: Copy Blueprint

Copy this document to `docs/APPLICATION_BLUEPRINT.md`

### Step 3: Fill Application Specification

Edit the "Application Specification" section with your requirements.

### Step 4: Generate Initial Structure

Use AI assistant with this prompt:

```
I'm creating a new application. Please use the APPLICATION_BLUEPRINT.md 
as the foundation. Generate the initial project structure following all 
the architecture, naming, and code quality standards defined in the 
blueprint.

Application details:
- Name: [Your app name]
- Purpose: [Your app purpose]
- Entities: [Your entities]
```

### Step 5: Verify Score

After generating code, run:

```bash
npm run check:all
```

All checks must pass to maintain 100/100 score.

---

**This blueprint ensures your application starts with and maintains a 100/100 architecture score.**

