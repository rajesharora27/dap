# Customer Module

## Responsibility

Manages customers and their adoption journeys. This module handles customer CRUD, product/solution assignments, adoption plan creation and synchronization, task status tracking, and progress calculations. It's the primary module used by CSS (Customer Success) roles.

## Public API

Exports from `index.ts`:

```typescript
// Services
export { CustomerService } from './customer.service';
export { CustomerAdoptionService } from './customer-adoption.service';

// Resolvers
export { CustomerFieldResolvers } from './customer.resolver';
export { CustomerQueryResolvers } from './customer.resolver';
export { CustomerMutationResolvers } from './customer.resolver';
export { CustomerAdoptionResolvers } from './customer-adoption.resolver';

// Types
export type { Customer, CreateCustomerInput, UpdateCustomerInput } from './customer.types';

// Validation
export { CreateCustomerSchema, UpdateCustomerSchema } from './customer.validation';
```

## Dependencies

| Module | Purpose |
|--------|---------|
| `shared/auth` | Permission checking (RBAC) |
| `shared/database` | Prisma client access |
| `shared/utils` | Pagination, audit logging |
| `product` | Product assignments |
| `solution` | Solution assignments |
| `telemetry` | Telemetry attribute sync |

## Database Tables

### Core
- `Customer` - Customer organizations

### Product Assignments
- `CustomerProduct` - Product assignments with license level
- `AdoptionPlan` - Product adoption tracking
- `CustomerTask` - Customer-specific task copies
- `CustomerProductTag` - Synced product tags
- `CustomerTaskTag` - Task-tag assignments
- `AdoptionPlanFilterPreference` - Saved filter preferences

### Solution Assignments
- `CustomerSolution` - Solution assignments
- `SolutionAdoptionPlan` - Solution adoption tracking
- `CustomerSolutionTask` - Solution task copies
- `SolutionAdoptionProduct` - Per-product progress in solution
- `CustomerSolutionTag` - Synced solution tags
- `CustomerSolutionTaskTag` - Task-tag assignments

### Telemetry
- `CustomerTelemetryAttribute` - Synced telemetry definitions
- `CustomerTelemetryValue` - Recorded telemetry values

## GraphQL Operations

### Queries
| Query | Description | Auth |
|-------|-------------|------|
| `customer(id)` | Get customer by ID | READ |
| `customers` | List all customers | READ |
| `customerProducts(customerId)` | Get assigned products | READ |
| `customerSolutions(customerId)` | Get assigned solutions | READ |
| `adoptionPlan(id)` | Get product adoption plan | READ |
| `solutionAdoptionPlan(id)` | Get solution adoption plan | READ |

### Mutations
| Mutation | Description | Auth |
|----------|-------------|------|
| `createCustomer` | Create new customer | CSS/ADMIN |
| `updateCustomer` | Update customer details | CSS/ADMIN |
| `deleteCustomer` | Delete customer | ADMIN |
| `assignProductToCustomer` | Assign product with license | CSS/ADMIN |
| `assignSolutionToCustomer` | Assign solution | CSS/ADMIN |
| `updateCustomerTaskStatus` | Update task status | CSS/ADMIN |
| `syncAdoptionPlan` | Sync with source product | CSS/ADMIN |
| `syncSolutionAdoptionPlan` | Sync with source solution | CSS/ADMIN |

### Computed Fields
| Field | Description |
|-------|-------------|
| `products` | Assigned products with adoption plans |
| `solutions` | Assigned solutions with adoption plans |
| `progressPercentage` | Overall adoption progress |

## Business Rules

1. Customers can have multiple products and solutions
2. Each product/solution assignment creates an adoption plan
3. Adoption plans are snapshots - changes to source require sync
4. Task statuses: NOT_STARTED, IN_PROGRESS, COMPLETED, DONE, NOT_APPLICABLE, NO_LONGER_USING
5. Progress is calculated using weighted task completion
6. Syncing solution adoption plan recursively syncs product plans
7. Tags, outcomes, releases sync during adoption plan creation/sync

## Error Codes

| Code | Description |
|------|-------------|
| `CUSTOMER_NOT_FOUND` | Customer does not exist |
| `CUSTOMER_PRODUCT_EXISTS` | Product already assigned |
| `CUSTOMER_SOLUTION_EXISTS` | Solution already assigned |
| `ADOPTION_PLAN_NOT_FOUND` | Adoption plan does not exist |

## Testing

```bash
# Run customer-specific tests
npm test -- --grep "customer"

# Run integration tests
npm test -- backend/src/__tests__/integration/graphql-customers.test.ts
```

## Related Documentation

- [CONTEXT.md](../../../../docs/CONTEXT.md) - Application overview
- [product/README.md](../product/README.md) - Product module
- [solution/README.md](../solution/README.md) - Solution module

