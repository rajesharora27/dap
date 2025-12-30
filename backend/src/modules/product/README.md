# Product Module

## Responsibility

Manages the complete product lifecycle including CRUD operations, task management, custom attributes, outcomes, releases, licenses, and relationships with solutions and customers. Products are the core building blocks of the DAP system - they define implementation tasks that customers adopt.

## Public API

Exports from `index.ts`:

```typescript
// Services
export { ProductService } from './product.service';

// Resolvers
export { ProductFieldResolvers } from './product.resolver';
export { ProductQueryResolvers } from './product.resolver';
export { ProductMutationResolvers } from './product.resolver';

// Types
export type { Product, CreateProductInput, UpdateProductInput } from './product.types';

// Validation
export { CreateProductSchema, UpdateProductSchema } from './product.validation';
```

## Dependencies

| Module | Purpose |
|--------|---------|
| `shared/auth` | Permission checking (RBAC) |
| `shared/database` | Prisma client access |
| `shared/utils` | Pagination, audit logging |
| `shared/pubsub` | Real-time event publishing |
| `tag` | ProductTag management |

## Database Tables

- `Product` - Core product entity with name, description, customAttrs, resources
- `Task` - Implementation tasks belonging to product
- `ProductTag` - Tags for categorizing tasks
- `TaskTag` - Many-to-many task-tag assignments
- `License` - License levels (Essential, Advantage, Signature)
- `Outcome` - Business outcomes for the product
- `Release` - Product release versions
- `CustomAttribute` - Structured custom attributes
- `SolutionProduct` - Many-to-many with solutions

## GraphQL Operations

### Queries
| Query | Description | Auth |
|-------|-------------|------|
| `product(id)` | Get product by ID with all relations | READ |
| `products` | List all products with pagination | READ |

### Mutations
| Mutation | Description | Auth |
|----------|-------------|------|
| `createProduct` | Create new product | SME/ADMIN |
| `updateProduct` | Update product details | SME/ADMIN |
| `deleteProduct` | Soft delete product | ADMIN |

### Computed Fields
| Field | Description |
|-------|-------------|
| `statusPercent` | Weighted completion percentage |
| `completionPercentage` | Same as statusPercent (alias) |
| `tags` | Associated ProductTags |
| `tasks` | Paginated task list |
| `outcomes` | Business outcomes |
| `licenses` | License levels |
| `releases` | Product releases |
| `solutions` | Solutions containing this product |

## Business Rules

1. Product names must be unique
2. Deleting a product soft-deletes (sets deletedAt)
3. Products can belong to multiple solutions
4. License levels are hierarchical (Essential < Advantage < Signature)
5. Task weights determine completion percentage calculation
6. Custom attributes support flexible key-value data

## Error Codes

| Code | Description |
|------|-------------|
| `PRODUCT_NOT_FOUND` | Product with given ID does not exist |
| `PRODUCT_NAME_EXISTS` | Product name already taken |
| `PRODUCT_HAS_CUSTOMERS` | Cannot delete product assigned to customers |

## Testing

```bash
# Run product-specific tests
npm test -- --grep "product"

# Run integration tests
npm test -- backend/src/__tests__/integration/graphql-products.test.ts
```

## Related Documentation

- [CONTEXT.md](../../../../docs/CONTEXT.md) - Application overview
- [NAMING-CONVENTIONS.md](../../../../docs/NAMING-CONVENTIONS.md) - Naming standards
- [MODULE_REGISTRY.md](../../../../docs/MODULE_REGISTRY.md) - All modules overview

