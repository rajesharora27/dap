# DAP GraphQL API Reference

**Version:** 3.0.0  
**Last Updated:** December 30, 2025  
**Status:** Production Ready ✅

This document provides a comprehensive reference for the DAP GraphQL API, including all queries, mutations, subscriptions, and types.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Queries](#queries)
4. [Mutations](#mutations)
5. [Subscriptions](#subscriptions)
6. [Types](#types)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Examples](#examples)

---

## Getting Started

### Endpoint

```
Production: https://myapps.cxsaaslab.com/dap/graphql
Development: http://localhost:4000/graphql
```

### GraphQL Playground

Access the interactive GraphQL Playground at `/graphql` endpoint for schema exploration and query testing.

### Request Format

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "{ products { edges { node { id name } } } }"}' \
  http://localhost:4000/graphql
```

---

## Authentication

DAP uses JWT (JSON Web Token) authentication.

### Login

```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      email
      name
      isAdmin
      role {
        id
        name
        permissions
      }
    }
  }
}
```

### Using the Token

Include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Logout

```graphql
mutation Logout {
  logout
}
```

---

## Queries

### Products

#### List All Products

```graphql
query Products {
  products {
    edges {
      node {
        id
        name
        description
        statusPercent
        customAttrs
        createdAt
        updatedAt
      }
    }
  }
}
```

#### Get Single Product

```graphql
query Product($id: ID!) {
  product(id: $id) {
    id
    name
    description
    statusPercent
    customAttrs
    tasks {
      id
      name
      description
      weight
      sequenceNumber
      license {
        id
        name
        level
      }
    }
    tags {
      id
      name
      color
    }
    outcomes {
      id
      name
      description
    }
    releases {
      id
      name
      level
    }
    licenses {
      id
      name
      level
    }
  }
}
```

### Solutions

#### List All Solutions

```graphql
query Solutions {
  solutions {
    edges {
      node {
        id
        name
        description
        products {
          id
          name
        }
        tags {
          id
          name
        }
        outcomes {
          id
          name
        }
      }
    }
  }
}
```

#### Get Single Solution

```graphql
query Solution($id: ID!) {
  solution(id: $id) {
    id
    name
    description
    customAttrs
    products {
      id
      name
      description
    }
    tasks {
      id
      name
      weight
    }
  }
}
```

### Customers

#### List All Customers

```graphql
query Customers {
  customers {
    edges {
      node {
        id
        name
        industry
        size
        region
        notes
        assignedProducts {
          id
          product {
            id
            name
          }
          licenseLevel
        }
        assignedSolutions {
          id
          solution {
            id
            name
          }
        }
      }
    }
  }
}
```

#### Customer Adoption Plans

```graphql
query CustomerAdoptionPlans($customerId: ID!) {
  customerAdoptionPlans(customerId: $customerId) {
    id
    product {
      id
      name
    }
    tasks {
      id
      name
      status
      statusUpdatedAt
      statusUpdatedBy
      adoptionNotes
      weight
    }
    progressPercent
    lastSyncedAt
  }
}
```

### Tasks

#### List Tasks by Product

```graphql
query TasksByProduct($productId: ID!) {
  tasks(productId: $productId) {
    id
    name
    description
    weight
    sequenceNumber
    successCriteria
    howToDoc
    howToVideo
    license {
      id
      name
      level
    }
    outcomes {
      id
      name
    }
    releases {
      id
      name
    }
    telemetryAttributes {
      id
      key
      successCriteria
      isMet
    }
  }
}
```

### Users & Roles (Admin Only)

```graphql
query Users {
  users {
    id
    email
    name
    isAdmin
    role {
      id
      name
    }
    lastLoginAt
    createdAt
  }
}

query Roles {
  roles {
    id
    name
    description
    permissions
    userCount
  }
}
```

---

## Mutations

### Products

#### Create Product

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
    name
    description
  }
}

# Variables
{
  "input": {
    "name": "Cisco Secure Access",
    "description": "Zero Trust Network Access solution"
  }
}
```

#### Update Product

```graphql
mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
    name
    description
    customAttrs
  }
}
```

#### Delete Product

```graphql
mutation DeleteProduct($id: ID!) {
  deleteProduct(id: $id)
}
```

### Tasks

#### Create Task

```graphql
mutation CreateTask($input: CreateTaskInput!) {
  createTask(input: $input) {
    id
    name
    description
    weight
    sequenceNumber
    productId
    licenseId
  }
}

# Variables
{
  "input": {
    "name": "Configure SSO",
    "description": "Set up Single Sign-On integration",
    "weight": 15,
    "sequenceNumber": 1,
    "productId": "product-uuid",
    "licenseId": "license-uuid"
  }
}
```

#### Update Task

```graphql
mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
  updateTask(id: $id, input: $input) {
    id
    name
    description
    weight
    successCriteria
    howToDoc
    howToVideo
  }
}
```

#### Reorder Tasks

```graphql
mutation ReorderTasks($productId: ID!, $taskIds: [ID!]!) {
  reorderTasks(productId: $productId, taskIds: $taskIds) {
    id
    sequenceNumber
  }
}
```

### Tags

#### Add Tag to Product

```graphql
mutation AddTagToProduct($productId: ID!, $tagId: ID!) {
  addTagToProduct(productId: $productId, tagId: $tagId) {
    id
    tags {
      id
      name
    }
  }
}
```

#### Remove Tag from Product

```graphql
mutation RemoveTagFromProduct($productId: ID!, $tagId: ID!) {
  removeTagFromProduct(productId: $productId, tagId: $tagId) {
    id
    tags {
      id
      name
    }
  }
}
```

#### Reorder Product Tags

```graphql
mutation ReorderProductTags($productId: ID!, $tagIds: [ID!]!) {
  reorderProductTags(productId: $productId, tagIds: $tagIds) {
    id
    tags {
      id
      name
    }
  }
}
```

### Outcomes

#### Create Outcome

```graphql
mutation CreateOutcome($input: CreateOutcomeInput!) {
  createOutcome(input: $input) {
    id
    name
    description
    productId
  }
}
```

#### Update Outcome

```graphql
mutation UpdateOutcome($id: ID!, $input: UpdateOutcomeInput!) {
  updateOutcome(id: $id, input: $input) {
    id
    name
    description
  }
}
```

### Releases

#### Create Release

```graphql
mutation CreateRelease($input: CreateReleaseInput!) {
  createRelease(input: $input) {
    id
    name
    level
    productId
  }
}
```

### Licenses

#### Create License

```graphql
mutation CreateLicense($input: CreateLicenseInput!) {
  createLicense(input: $input) {
    id
    name
    level  # 1=Essential, 2=Advantage, 3=Signature
    productId
  }
}
```

### Customer Adoption

#### Assign Product to Customer

```graphql
mutation AssignProductToCustomer($input: AssignProductInput!) {
  assignProductToCustomer(input: $input) {
    id
    customer {
      id
      name
    }
    product {
      id
      name
    }
    licenseLevel
  }
}
```

#### Update Customer Task Status

```graphql
mutation UpdateCustomerTaskStatus($input: UpdateCustomerTaskStatusInput!) {
  updateCustomerTaskStatus(input: $input) {
    id
    status
    statusUpdatedAt
    statusUpdatedBy
    adoptionNotes
  }
}

# Status values: NOT_STARTED, IN_PROGRESS, DONE, BLOCKED, NOT_APPLICABLE, NO_LONGER_USING
```

#### Sync Adoption Plan

```graphql
mutation SyncAdoptionPlan($customerId: ID!, $productIds: [ID!]!) {
  syncAdoptionPlan(customerId: $customerId, productIds: $productIds) {
    id
    tasks {
      id
      name
      status
    }
    lastSyncedAt
  }
}
```

### Telemetry

#### Import Telemetry Data

```graphql
mutation ImportTelemetryData($input: ImportTelemetryInput!) {
  importTelemetryData(input: $input) {
    success
    imported
    errors
  }
}
```

#### Evaluate All Tasks Telemetry

```graphql
mutation EvaluateAllTasksTelemetry($customerId: ID!, $productId: ID!) {
  evaluateAllTasksTelemetry(customerId: $customerId, productId: $productId) {
    evaluated
    updated
    tasks {
      id
      status
    }
  }
}
```

### Backup & Restore (Admin Only)

```graphql
mutation CreateBackup {
  createBackup {
    filename
    size
    createdAt
  }
}

mutation RestoreBackup($filename: String!) {
  restoreBackup(filename: $filename) {
    success
    message
  }
}
```

---

## Subscriptions

### Real-time Updates

```graphql
subscription OnProductUpdated($productId: ID!) {
  productUpdated(productId: $productId) {
    id
    name
    statusPercent
  }
}

subscription OnTaskStatusChanged($customerId: ID!) {
  taskStatusChanged(customerId: $customerId) {
    taskId
    status
    updatedBy
    updatedAt
  }
}
```

---

## Types

### Enums

```graphql
enum CustomerTaskStatus {
  NOT_STARTED
  IN_PROGRESS
  DONE
  BLOCKED
  NOT_APPLICABLE
  NO_LONGER_USING
}

enum LicenseLevel {
  ESSENTIAL    # Level 1
  ADVANTAGE    # Level 2
  SIGNATURE    # Level 3
}
```

### Input Types

```graphql
input CreateProductInput {
  name: String!
  description: String
  customAttrs: JSON
}

input UpdateProductInput {
  name: String
  description: String
  customAttrs: JSON
}

input CreateTaskInput {
  name: String!
  description: String
  weight: Float!
  sequenceNumber: Int
  productId: ID
  solutionId: ID
  licenseId: ID
  successCriteria: String
  howToDoc: String
  howToVideo: String
}
```

---

## Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Not authorized",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["products"],
      "extensions": {
        "code": "UNAUTHORIZED",
        "http": { "status": 401 }
      }
    }
  ],
  "data": null
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required or token expired |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `BAD_USER_INPUT` | Invalid input data |
| `VALIDATION_ERROR` | Business rule validation failed |
| `INTERNAL_ERROR` | Server-side error |
| `GRAPHQL_COMPLEXITY_EXCEEDED` | Query too complex |
| `GRAPHQL_DEPTH_EXCEEDED` | Query too deeply nested |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| GraphQL | 100 requests | 15 seconds |
| Login | 5 attempts | 15 minutes |
| File Upload | 10 requests | 1 minute |

Exceeding limits returns HTTP 429 with retry-after header.

---

## Examples

### Complete Product Creation Flow

```graphql
# 1. Create the product
mutation CreateProduct {
  createProduct(input: {
    name: "Cisco Duo",
    description: "Multi-factor authentication"
  }) {
    id
    name
  }
}

# 2. Add a license
mutation CreateLicense {
  createLicense(input: {
    name: "Essential",
    level: 1,
    productId: "product-id"
  }) {
    id
  }
}

# 3. Add outcomes
mutation CreateOutcome {
  createOutcome(input: {
    name: "MFA Enabled",
    description: "All users have MFA configured",
    productId: "product-id"
  }) {
    id
  }
}

# 4. Add tasks
mutation CreateTask {
  createTask(input: {
    name: "Configure Directory Sync",
    description: "Set up AD/LDAP sync",
    weight: 20,
    productId: "product-id",
    licenseId: "license-id"
  }) {
    id
  }
}
```

### Customer Adoption Workflow

```graphql
# 1. Assign product to customer
mutation AssignProduct {
  assignProductToCustomer(input: {
    customerId: "customer-id",
    productId: "product-id",
    licenseLevel: 2
  }) {
    id
  }
}

# 2. View adoption plan
query GetAdoptionPlan {
  customerAdoptionPlans(customerId: "customer-id") {
    id
    tasks {
      id
      name
      status
    }
    progressPercent
  }
}

# 3. Update task status
mutation UpdateStatus {
  updateCustomerTaskStatus(input: {
    customerTaskId: "task-id",
    status: IN_PROGRESS,
    notes: "Started implementation"
  }) {
    id
    status
  }
}
```

---

## Health Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /health` | Detailed health status | JSON with db, cache, memory |
| `GET /health/live` | Kubernetes liveness | `{ "alive": true }` |
| `GET /health/ready` | Kubernetes readiness | `{ "ready": true }` |
| `GET /health/metrics` | Prometheus metrics | text/plain |

---

## Changelog

- **3.0.0** (Dec 2025): Added DataLoader, query complexity limits
- **2.9.0** (Dec 2025): Enhanced telemetry evaluation
- **2.0.0** (Oct 2025): Customer adoption planning
- **1.0.0** (Sep 2025): Initial release

---

*For additional help, see the [GraphQL Playground](http://localhost:4000/graphql) or [CONTEXT.md](CONTEXT.md)*

