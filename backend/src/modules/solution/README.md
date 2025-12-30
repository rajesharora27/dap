# Solution Module

## Responsibility

Manages solutions which are bundles of products. Solutions provide a way to group related products together for customers who need multiple products as a cohesive package. Each solution can have its own tasks, outcomes, releases, and licenses that complement the included products.

## Public API

Exports from `index.ts`:

```typescript
// Services
export { SolutionService } from './solution.service';
export { SolutionReportingService } from './solution-reporting.service';

// Resolvers
export { SolutionFieldResolvers } from './solution.resolver';
export { SolutionQueryResolvers } from './solution.resolver';
export { SolutionMutationResolvers } from './solution.resolver';
export { SolutionAdoptionResolvers } from './solution-adoption.resolver';

// Types
export type { Solution, CreateSolutionInput, UpdateSolutionInput } from './solution.types';

// Validation
export { CreateSolutionSchema, UpdateSolutionSchema } from './solution.validation';
```

## Dependencies

| Module | Purpose |
|--------|---------|
| `shared/auth` | Permission checking (RBAC) |
| `shared/database` | Prisma client access |
| `shared/utils` | Pagination, audit logging |
| `product` | Product relationships |
| `tag` | SolutionTag management |
| `customer` | Customer solution assignments |

## Database Tables

- `Solution` - Core solution entity
- `SolutionProduct` - Many-to-many with products (with order)
- `SolutionTag` - Tags for solution tasks
- `SolutionTaskTag` - Task-tag assignments
- `SolutionTaskOrder` - Task ordering within solution
- `Task` - Solution-level tasks (solutionId set)
- `License` - Solution-level licenses
- `Outcome` - Solution-level outcomes
- `Release` - Solution-level releases
- `CustomerSolution` - Customer assignments
- `SolutionAdoptionPlan` - Customer adoption tracking

## GraphQL Operations

### Queries
| Query | Description | Auth |
|-------|-------------|------|
| `solution(id)` | Get solution by ID with relations | READ |
| `solutions` | List all solutions | READ |
| `solutionProducts(solutionId)` | Get products in solution | READ |

### Mutations
| Mutation | Description | Auth |
|----------|-------------|------|
| `createSolution` | Create new solution | SME/ADMIN |
| `updateSolution` | Update solution details | SME/ADMIN |
| `deleteSolution` | Soft delete solution | ADMIN |
| `addProductToSolution` | Add product to solution | SME/ADMIN |
| `removeProductFromSolution` | Remove product | SME/ADMIN |
| `reorderSolutionProducts` | Change product order | SME/ADMIN |

### Computed Fields
| Field | Description |
|-------|-------------|
| `products` | Products included in solution (ordered) |
| `tasks` | All tasks (solution + product tasks) |
| `tags` | Solution tags |
| `outcomes` | Solution-level outcomes |
| `releases` | Solution-level releases |
| `licenses` | Solution-level licenses |

## Business Rules

1. Solution names should be descriptive of the bundle
2. Products can belong to multiple solutions
3. Product order in solution is preserved
4. Solution tasks are separate from product tasks
5. When assigned to customer, all product tasks are included
6. Syncing solution adoption plan recursively syncs product plans

## Error Codes

| Code | Description |
|------|-------------|
| `SOLUTION_NOT_FOUND` | Solution with given ID does not exist |
| `SOLUTION_PRODUCT_EXISTS` | Product already in solution |
| `SOLUTION_HAS_CUSTOMERS` | Cannot delete solution assigned to customers |

## Testing

```bash
# Run solution-specific tests
npm test -- --grep "solution"

# Run integration tests
npm test -- backend/src/__tests__/integration/graphql-solutions.test.ts
```

## Related Documentation

- [CONTEXT.md](../../../../docs/CONTEXT.md) - Application overview
- [product/README.md](../product/README.md) - Product module
- [customer/README.md](../customer/README.md) - Customer module

