# Solution Product Ordering Implementation

## Overview
Products within solutions now maintain a specific order that is preserved throughout the solution adoption workflow. Users can control this order by adding/removing products, with the first-added product appearing first.

## Database Schema
The `SolutionProduct` table includes an `order` field:
```prisma
model SolutionProduct {
  id         String   @id @default(cuid())
  productId  String
  solutionId String
  order      Int      @default(0)
  product    Product  @relation(fields: [productId], references: [id])
  solution   Solution @relation(fields: [solutionId], references: [id])

  @@unique([productId, solutionId])
}
```

The `SolutionAdoptionProduct` table includes `sequenceNumber` which mirrors the order:
```prisma
model SolutionAdoptionProduct {
  id                    String               @id @default(cuid())
  solutionAdoptionPlanId String
  productId             String
  productName           String
  sequenceNumber        Int                  // Preserves order from SolutionProduct
  status                SolutionProductStatus @default(NOT_STARTED)
  totalTasks            Int                  @default(0)
  completedTasks        Int                  @default(0)
  totalWeight           Float                @default(0)
  completedWeight       Float                @default(0)
  progressPercentage    Float                @default(0)
  ...
}
```

## GraphQL API

### Mutations

#### Add Product to Solution (Simple)
```graphql
mutation {
  addProductToSolution(solutionId: "sol-123", productId: "prod-456")
}
```
- Automatically assigns the next order number (first added = order 1, second = order 2, etc.)
- Order is calculated by finding the maximum existing order and adding 1

#### Add Product to Solution (Enhanced)
```graphql
mutation {
  addProductToSolutionEnhanced(
    solutionId: "sol-123"
    productId: "prod-456"
    order: 2
  )
}
```
- Allows explicit order specification
- If order is not provided, automatically assigns the next order number

#### Remove Product from Solution
```graphql
mutation {
  removeProductFromSolution(solutionId: "sol-123", productId: "prod-456")
}
# Or enhanced version:
mutation {
  removeProductFromSolutionEnhanced(solutionId: "sol-123", productId: "prod-456")
}
```
- Removes the product-solution association
- To reorder, users can delete and re-add products with new order values

#### Reorder Products in Solution
```graphql
mutation {
  reorderProductsInSolution(
    solutionId: "sol-123"
    productOrders: [
      { productId: "prod-A", order: 1 }
      { productId: "prod-B", order: 2 }
      { productId: "prod-C", order: 3 }
    ]
  )
}
```
- Allows batch reordering of all products in a solution
- More efficient than delete/re-add for reordering

### Input Types
```graphql
input ProductOrderInput {
  productId: ID!
  order: Int!
}
```

## Implementation Details

### 1. Adding Products to Solutions
When a product is added to a solution:
```typescript
// Calculate next order number automatically
const maxOrderProduct = await prisma.solutionProduct.findFirst({
  where: { solutionId },
  orderBy: { order: 'desc' }
});
const nextOrder = (maxOrderProduct?.order || 0) + 1;

await prisma.solutionProduct.create({ 
  productId, 
  solutionId, 
  order: nextOrder 
});
```

### 2. Creating Solution Adoption Plans
When creating a solution adoption plan, the product order is preserved:
```typescript
// Fetch solution with products ordered by 'order' field
const solution = await prisma.solution.findUnique({
  where: { id: solutionId },
  include: {
    products: {
      include: { product: true },
      orderBy: { order: 'asc' } // ✅ Products are ordered
    }
  }
});

// Create SolutionAdoptionProduct records preserving the order
for (const solutionProduct of solution.products) {
  await prisma.solutionAdoptionProduct.create({
    data: {
      solutionAdoptionPlanId: adoptionPlan.id,
      productId: solutionProduct.product.id,
      productName: solutionProduct.product.name,
      sequenceNumber: solutionProduct.order, // ✅ Original order preserved
      status: 'NOT_STARTED',
      ...
    }
  });
}
```

### 3. Syncing Solution Adoption Plans
The sync operation preserves product order:
```typescript
await prisma.solutionAdoptionProduct.update({
  where: { id: product.id },
  data: {
    totalTasks: finalTotalTasks,
    completedTasks: finalCompletedTasks,
    totalWeight: finalTotalWeight,
    completedWeight: finalCompletedWeight,
    progressPercentage: finalProgressPercentage,
    status: newStatus
    // ✅ sequenceNumber is NOT modified - order is preserved
  }
});
```

### 4. Querying Products in Order
Products are always returned in order:
```typescript
const solutionAdoptionPlan = await prisma.solutionAdoptionPlan.findUnique({
  where: { id },
  include: {
    products: {
      orderBy: { sequenceNumber: 'asc' } // ✅ Products in correct order
    }
  }
});
```

## Sample Data
The sample data demonstrates proper ordering:

```sql
INSERT INTO "SolutionProduct" (id, "productId", "solutionId", "order") VALUES
-- Hybrid Private Access: Order matters for deployment sequence
('sp-hpa-secaccess', 'prod-cisco-secure-access-sample', 'sol-hybrid-private-access', 1),
('sp-hpa-duo', 'prod-cisco-duo', 'sol-hybrid-private-access', 2),
('sp-hpa-firewall', 'prod-cisco-firewall', 'sol-hybrid-private-access', 3),

-- SASE: Order reflects implementation priority
('sp-sase-secaccess', 'prod-cisco-secure-access-sample', 'sol-sase', 1),
('sp-sase-sdwan', 'prod-cisco-sdwan', 'sol-sase', 2),
('sp-sase-duo', 'prod-cisco-duo', 'sol-sase', 3);
```

## User Workflow

### Adding Products in Order
1. **First Product**: Add product A → automatically gets order = 1
2. **Second Product**: Add product B → automatically gets order = 2
3. **Third Product**: Add product C → automatically gets order = 3

### Reordering Products
**Option 1: Delete and Re-add**
1. Remove product B (order 2)
2. Remove product C (order 3)
3. Add product C → gets order = 2 (next available)
4. Add product B → gets order = 3 (next available)
Result: A(1), C(2), B(3)

**Option 2: Batch Reorder (Recommended)**
```graphql
mutation {
  reorderProductsInSolution(
    solutionId: "sol-123"
    productOrders: [
      { productId: "A", order: 1 }
      { productId: "C", order: 2 }
      { productId: "B", order: 3 }
    ]
  )
}
```

## Solution Adoption Plan Display

### Product Order
In the solution adoption plan UI:
```
Solution: ACME Hybrid Private Access

Products (in order):
  1. Cisco Secure Access Sample [12 tasks] [Progress: 0%]
  2. Cisco Duo                  [12 tasks] [Progress: 0%]
  3. Cisco Secure Firewall      [12 tasks] [Progress: 0%]

Solution Tasks:
  - Solution-level tasks (9 tasks)
```

The order represents:
- **Recommended implementation sequence**: Deploy products in this order
- **Logical dependency flow**: Earlier products may be prerequisites for later ones
- **User-defined priority**: Users control the order based on their needs

### Task Organization
Within each solution adoption plan:
1. **Products are listed in order** (by `sequenceNumber`)
2. **Each product shows its adoption plan** (tasks, progress)
3. **Solution-level tasks** can be displayed at the end

## Files Modified
- `/data/dap/backend/src/schema/resolvers/solutionAdoption.ts`
  - Modified `createSolutionAdoptionPlan` to preserve order from `SolutionProduct.order` (lines 558-575)
- `/data/dap/backend/src/schema/resolvers/index.ts`
  - Updated `addProductToSolution` to automatically assign order (lines 1018-1039)
- `/data/dap/backend/src/schema/typeDefs.ts`
  - Already includes `addProductToSolutionEnhanced`, `removeProductFromSolutionEnhanced`, `reorderProductsInSolution` mutations
  - Already includes `ProductOrderInput` type

## Testing

### Verify Product Order
```graphql
query {
  solution(id: "sol-hybrid-private-access") {
    id
    name
    products {
      edges {
        node {
          id
          name
        }
      }
    }
  }
}
```

### Verify Solution Adoption Plan Order
```graphql
query {
  solutionAdoptionPlan(id: "sap-123") {
    id
    solutionName
    products {
      sequenceNumber
      productName
      totalTasks
      progressPercentage
    }
  }
}
```

Expected output:
```json
{
  "solutionAdoptionPlan": {
    "id": "sap-123",
    "solutionName": "ACME Hybrid Private Access",
    "products": [
      {
        "sequenceNumber": 1,
        "productName": "Cisco Secure Access Sample",
        "totalTasks": 12,
        "progressPercentage": 0
      },
      {
        "sequenceNumber": 2,
        "productName": "Cisco Duo",
        "totalTasks": 12,
        "progressPercentage": 0
      },
      {
        "sequenceNumber": 3,
        "productName": "Cisco Secure Firewall",
        "totalTasks": 12,
        "progressPercentage": 0
      }
    ]
  }
}
```

## Benefits
1. ✅ **Predictable Order**: Products always appear in the same order
2. ✅ **Implementation Sequence**: Reflects recommended deployment order
3. ✅ **User Control**: Users can reorder by delete/re-add or batch reorder
4. ✅ **Preserved Throughout**: Order is maintained from solution definition through adoption plans
5. ✅ **Automatic Ordering**: First-added products get lower order numbers automatically
6. ✅ **Flexible Reordering**: Multiple methods available (delete/re-add or batch reorder mutation)

## Date
October 26, 2025



