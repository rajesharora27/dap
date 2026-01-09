# DAP GraphQL Schema Documentation

**Version:** 3.0.0  
**Last Updated:** December 30, 2025  
**GraphQL Version:** GraphQL.js 16.x  
**Server:** Apollo Server 4.x

---

## Table of Contents

1. [Overview](#overview)
2. [Schema Architecture](#schema-architecture)
3. [Core Types](#core-types)
4. [Relay Specification](#relay-specification)
5. [Input Validation](#input-validation)
6. [Error Handling](#error-handling)
7. [Subscriptions](#subscriptions)
8. [Schema Conventions](#schema-conventions)
9. [Module Reference](#module-reference)
10. [Best Practices](#best-practices)

---

## Overview

DAP uses a modular GraphQL schema with the following characteristics:

- **Relay Specification Compliance**: Node interface, Connections, Edges
- **Modular Type Definitions**: Each domain has its own typeDefs file
- **Input Validation**: Zod schemas for mutation inputs
- **Error Codes**: Structured error handling with typed codes
- **Real-time Updates**: GraphQL Subscriptions via WebSocket

### Schema Statistics

| Metric | Count |
|--------|-------|
| Types | 60+ |
| Queries | 30+ |
| Mutations | 50+ |
| Subscriptions | 5+ |
| Input Types | 25+ |
| Enums | 10+ |

---

## Schema Architecture

### Module Structure

```
backend/src/
├── schema/
│   ├── typeDefs.ts              # Main schema aggregation
│   └── resolvers/
│       └── index.ts             # Resolver aggregation
│
└── modules/
    ├── common/
    │   └── common.typeDefs.ts   # Shared types (Node, PageInfo, etc.)
    ├── auth/
    │   └── auth.typeDefs.ts     # Authentication types
    ├── product/
    │   ├── product.typeDefs.ts  # Product types
    │   ├── product.schema.graphql
    │   └── product.resolver.ts
    ├── solution/
    │   └── ...
    ├── customer/
    │   └── ...
    ├── task/
    │   └── ...
    ├── tag/
    │   └── ...
    ├── telemetry/
    │   └── ...
    └── [other modules]/
```

### Type Definition Pattern

Each module exports a `gql` tagged template:

```typescript
// product.typeDefs.ts
import gql from 'graphql-tag';

export const productTypeDefs = gql`
  """
  Product entity representing a software product with tasks and configurations.
  """
  type Product implements Node {
    id: ID!
    name: String!
    description: String
    # ... fields
  }

  extend type Query {
    product(id: ID!): Product
    products(first: Int, after: String): ProductConnection!
  }

  extend type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;
```

---

## Core Types

### Base Interfaces

```graphql
"""
Relay Node interface - all entities implement this
"""
interface Node {
  id: ID!
}

"""
Standard pagination info for connections
"""
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

"""
Generic resource link (documentation, videos, etc.)
"""
type Resource {
  label: String!
  url: String!
}

input ResourceInput {
  label: String!
  url: String!
}
```

### Scalar Types

```graphql
"""
JSON scalar for flexible data storage
"""
scalar JSON

"""
DateTime scalar (ISO 8601 format)
"""
scalar DateTime

"""
Decimal scalar for precise numeric values
"""
scalar Decimal
```

---

## Relay Specification

DAP follows the [Relay Connection Specification](https://relay.dev/graphql/connections.htm) for pagination.

### Connection Pattern

```graphql
type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProductEdge {
  cursor: String!
  node: Product!
}
```

### Usage Example

```graphql
query {
  products(first: 10, after: "cursor123") {
    edges {
      cursor
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

### Pagination Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `first` | Int | Forward pagination: first N items |
| `after` | String | Forward pagination: after cursor |
| `last` | Int | Backward pagination: last N items |
| `before` | String | Backward pagination: before cursor |

---

## Input Validation

### Zod Schema Integration

All mutations use Zod schemas for input validation:

```typescript
// product.validation.ts
import { z } from 'zod';

export const ProductInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  resources: z.array(ResourceSchema).optional(),
  customAttrs: z.record(z.any()).optional(),
});

// In resolver
const validated = ProductInputSchema.parse(input);
```

### Common Validation Rules

| Field Type | Validation |
|------------|------------|
| `name` | 1-255 characters, non-empty |
| `description` | Max 2000 characters |
| `email` | Valid email format |
| `url` | Valid URL format |
| `id` | CUID format |
| `weight` | 0-100, decimal |

### Error Response

```json
{
  "errors": [{
    "message": "Validation failed",
    "extensions": {
      "code": "BAD_USER_INPUT",
      "validationErrors": [
        { "field": "name", "message": "Name is required" }
      ]
    }
  }]
}
```

---

## Error Handling

### Error Codes

```typescript
enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Authorization
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  BAD_USER_INPUT = 'BAD_USER_INPUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  GRAPHQL_COMPLEXITY_EXCEEDED = 'GRAPHQL_COMPLEXITY_EXCEEDED',
  GRAPHQL_DEPTH_EXCEEDED = 'GRAPHQL_DEPTH_EXCEEDED',
}
```

### Error Response Format

```graphql
type Error {
  message: String!
  code: String!
  path: [String!]
  extensions: JSON
}
```

### Handling Errors in Resolvers

```typescript
import { AppError, ErrorCodes } from '../../shared/errors';

// Throwing structured errors
if (!product) {
  throw new AppError(
    ErrorCodes.NOT_FOUND,
    `Product with ID ${id} not found`,
    404
  );
}
```

---

## Subscriptions

### Available Subscriptions

```graphql
type Subscription {
  """
  Emitted when a product is updated
  """
  productUpdated(productId: ID): Product!
  
  """
  Emitted when a task status changes
  """
  taskStatusChanged(customerId: ID!): TaskStatusChange!
  
  """
  Emitted when adoption plan progress updates
  """
  adoptionPlanProgress(adoptionPlanId: ID!): AdoptionPlanProgress!
  
  """
  Emitted when telemetry data is imported
  """
  telemetryImported(productId: ID!): TelemetryImportResult!
  
  """
  System-wide notifications for admins
  """
  systemNotification: SystemNotification!
}
```

### Subscription Implementation

```typescript
// Using graphql-subscriptions PubSub
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// Publishing events
pubsub.publish('PRODUCT_UPDATED', { productUpdated: product });

// Subscribing
Subscription: {
  productUpdated: {
    subscribe: (_, { productId }) => {
      return pubsub.asyncIterator(['PRODUCT_UPDATED']);
    },
    resolve: (payload, { productId }) => {
      if (productId && payload.productUpdated.id !== productId) {
        return null; // Filter by productId
      }
      return payload.productUpdated;
    }
  }
}
```

### Client Usage

```typescript
// Apollo Client subscription
const { data } = useSubscription(PRODUCT_UPDATED, {
  variables: { productId },
  onData: ({ data }) => {
    console.log('Product updated:', data.productUpdated);
  }
});
```

---

## Schema Conventions

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Types | PascalCase | `Product`, `CustomerTask` |
| Fields | camelCase | `createdAt`, `statusPercent` |
| Queries | camelCase, noun | `product`, `products` |
| Mutations | camelCase, verb+noun | `createProduct`, `updateTask` |
| Inputs | PascalCase + "Input" | `ProductInput`, `TaskInput` |
| Enums | SCREAMING_SNAKE | `NOT_STARTED`, `IN_PROGRESS` |

### Field Patterns

```graphql
type Entity {
  # Identity
  id: ID!
  
  # Core data
  name: String!
  description: String
  
  # Status/flags
  isActive: Boolean!
  status: EntityStatus!
  
  # Metadata
  createdAt: DateTime!
  updatedAt: DateTime!
  deletedAt: DateTime
  
  # Relations (plural)
  tasks: [Task!]!
  tags: [Tag!]!
  
  # Connections (paginated)
  customers(first: Int, after: String): CustomerConnection!
}
```

### Mutation Patterns

```graphql
# Create - returns created entity
createProduct(input: ProductInput!): Product!

# Update - returns updated entity
updateProduct(id: ID!, input: ProductInput!): Product!

# Delete - returns boolean
deleteProduct(id: ID!): Boolean!

# Bulk operations - return count
deleteProducts(ids: [ID!]!): Int!

# Actions - return result type
syncAdoptionPlan(planId: ID!): SyncResult!
```

---

## Module Reference

### Product Module

```graphql
type Product implements Node {
  id: ID!
  name: String!
  description: String
  resources: [Resource!]
  customAttrs: JSON
  statusPercent: Int!
  tasks: [Task!]!
  licenses: [License!]!
  outcomes: [Outcome!]!
  releases: [Release!]!
  tags: [ProductTag!]!
}

# Queries
product(id: ID!): Product
products(first: Int, after: String): ProductConnection!

# Mutations
createProduct(input: ProductInput!): Product!
updateProduct(id: ID!, input: ProductInput!): Product!
deleteProduct(id: ID!): Boolean!
```

### Task Module

```graphql
type Task implements Node {
  id: ID!
  name: String!
  description: String
  weight: Decimal!
  sequenceNumber: Int!
  estMinutes: Int!
  licenseLevel: LicenseLevel!
  howToDoc: [String!]!
  howToVideo: [String!]!
  successCriteria: String
  outcomes: [Outcome!]!
  releases: [Release!]!
  tags: [TaskTag!]!
  telemetryAttributes: [TelemetryAttribute!]!
}

# Queries
task(id: ID!): Task
tasks(productId: ID, solutionId: ID): [Task!]!

# Mutations
createTask(input: TaskInput!): Task!
updateTask(id: ID!, input: TaskInput!): Task!
deleteTask(id: ID!): Boolean!
reorderTasks(productId: ID!, taskIds: [ID!]!): [Task!]!
```

### Customer Module

```graphql
type Customer implements Node {
  id: ID!
  name: String!
  description: String
  products: [CustomerProduct!]!
  solutions: [CustomerSolution!]!
}

type CustomerProduct {
  id: ID!
  product: Product!
  licenseLevel: LicenseLevel!
  adoptionPlan: AdoptionPlan
}

# Queries
customer(id: ID!): Customer
customers(first: Int, after: String): CustomerConnection!

# Mutations
createCustomer(input: CustomerInput!): Customer!
assignProductToCustomer(input: AssignProductInput!): CustomerProduct!
updateCustomerTaskStatus(input: UpdateTaskStatusInput!): CustomerTask!
```

---

## Best Practices

### Query Design

1. **Use Connections for Lists**: Always use Relay connections for paginated lists
2. **Limit Nested Queries**: Avoid deeply nested queries (max 5 levels)
3. **Use DataLoader**: Batch database queries to prevent N+1
4. **Include totalCount**: Help clients know if more data exists

### Mutation Design

1. **Use Input Types**: Group mutation arguments in input types
2. **Return Updated Entity**: Return the full entity after mutation
3. **Validate Early**: Validate inputs before database operations
4. **Use Transactions**: Wrap related operations in transactions

### Error Handling

1. **Use Error Codes**: Always include structured error codes
2. **Provide Context**: Include helpful error messages
3. **Log Server Errors**: Log but don't expose internal details
4. **Validate Authorization**: Check permissions before operations

### Performance

1. **Query Complexity**: Enforced via `queryComplexityPlugin`
2. **Query Depth**: Limited to 15 levels
3. **DataLoader**: Batches all entity lookups
4. **Caching**: Apollo cache with appropriate policies

---

## GraphQL Playground

Access the interactive GraphQL Playground at:

- **Development**: http://localhost:4000/graphql
- **Production**: https://your-domain/graphql (with auth)

Features:
- Schema exploration
- Query autocompletion
- Query history
- Documentation browser

---

*For API usage examples, see [API_REFERENCE.md](API_REFERENCE.md)*  
*For error codes, see [shared/errors/ErrorCodes.ts](../backend/src/shared/errors/ErrorCodes.ts)*

