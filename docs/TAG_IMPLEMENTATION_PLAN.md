# Task Tag Implementation Plan

**Created:** December 18, 2025  
**Status:** Ready for Implementation  
**Version:** 2.7.1 (target)

---

## Overview

Add a tagging system for tasks within products. Tags are product-scoped, meaning each product has its own set of tags. Tags are copied to customer adoption plans during sync.

### Key Requirements
- **Product-scoped tags** - Each product manages its own tag set
- **Tags copied to adoption plans** - Customer products get copies of tags during sync
- **Full sync** - When syncing, customer tags are completely replaced with product tags
- **Multi-tag filtering** - OR logic (show tasks with ANY selected tag) - only in adoption plans
- **Theme-based colors** - Predefined color palette from MUI theme
- **Export/Import support** - Tags included in product Excel export/import

---

## Database Schema

### Step 1: Create Prisma Schema

Add to `backend/prisma/schema.prisma`:

```prisma
// ===================
// PRODUCT TAGS
// ===================

model ProductTag {
  id           String    @id @default(cuid())
  productId    String
  name         String
  color        String?   // Theme color key, e.g., "primary", "success", "error"
  displayOrder Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  product      Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  taskTags     TaskTag[]
  
  @@unique([productId, name])
  @@index([productId])
}

model TaskTag {
  id        String     @id @default(cuid())
  taskId    String
  tagId     String
  createdAt DateTime   @default(now())
  
  task      Task       @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag       ProductTag @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([taskId, tagId])
  @@index([taskId])
  @@index([tagId])
}

// ===================
// CUSTOMER PRODUCT TAGS
// ===================

model CustomerProductTag {
  id                String          @id @default(cuid())
  customerProductId String
  sourceTagId       String?         // Original ProductTag ID for sync tracking
  name              String
  color             String?
  displayOrder      Int             @default(0)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  customerProduct   CustomerProduct @relation(fields: [customerProductId], references: [id], onDelete: Cascade)
  taskTags          CustomerTaskTag[]
  
  @@unique([customerProductId, name])
  @@index([customerProductId])
}

model CustomerTaskTag {
  id                    String             @id @default(cuid())
  customerProductTaskId String
  tagId                 String
  createdAt             DateTime           @default(now())
  
  customerProductTask   CustomerProductTask @relation(fields: [customerProductTaskId], references: [id], onDelete: Cascade)
  tag                   CustomerProductTag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([customerProductTaskId, tagId])
  @@index([customerProductTaskId])
  @@index([tagId])
}
```

### Step 2: Update Existing Models

Add relations to existing models:

```prisma
model Product {
  // ... existing fields
  tags  ProductTag[]
}

model Task {
  // ... existing fields
  taskTags  TaskTag[]
}

model CustomerProduct {
  // ... existing fields
  tags  CustomerProductTag[]
}

model CustomerProductTask {
  // ... existing fields
  taskTags  CustomerTaskTag[]
}
```

### Step 3: Run Migration

```bash
cd backend
npx prisma migrate dev --name add_task_tags
npx prisma generate
```

---

## Backend Implementation

### Step 4: GraphQL Type Definitions

Add to `backend/src/schema/typeDefs.ts`:

```graphql
type ProductTag {
  id: ID!
  productId: ID!
  name: String!
  color: String
  displayOrder: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type CustomerProductTag {
  id: ID!
  customerProductId: ID!
  sourceTagId: ID
  name: String!
  color: String
  displayOrder: Int!
}

extend type Product {
  tags: [ProductTag!]!
}

extend type Task {
  tags: [ProductTag!]!
}

extend type CustomerProduct {
  tags: [CustomerProductTag!]!
}

extend type CustomerProductTask {
  tags: [CustomerProductTag!]!
}

extend type Query {
  productTags(productId: ID!): [ProductTag!]!
  customerProductTags(customerProductId: ID!): [CustomerProductTag!]!
}

extend type Mutation {
  # Product Tag Management
  createProductTag(productId: ID!, name: String!, color: String): ProductTag!
  updateProductTag(id: ID!, name: String, color: String, displayOrder: Int): ProductTag!
  deleteProductTag(id: ID!): Boolean!
  
  # Task Tag Assignment
  setTaskTags(taskId: ID!, tagIds: [ID!]!): Task!
  addTagToTask(taskId: ID!, tagId: ID!): Task!
  removeTagFromTask(taskId: ID!, tagId: ID!): Task!
}
```

### Step 5: Create Tag Resolvers

Create `backend/src/schema/resolvers/tags.ts`:

```typescript
// Resolvers for:
// - Query.productTags
// - Query.customerProductTags
// - Mutation.createProductTag
// - Mutation.updateProductTag
// - Mutation.deleteProductTag
// - Mutation.setTaskTags
// - Mutation.addTagToTask
// - Mutation.removeTagFromTask
// - Product.tags (field resolver)
// - Task.tags (field resolver)
// - CustomerProduct.tags (field resolver)
// - CustomerProductTask.tags (field resolver)
```

### Step 6: Update Product Resolvers

Add tag relations to existing product queries.

### Step 7: Update Sync Logic

Modify `backend/src/schema/resolvers/customerProduct.ts`:

In `syncCustomerProduct` mutation:
1. Delete all existing CustomerProductTags for the customer product
2. Copy all ProductTags from source product as CustomerProductTags
3. For each CustomerProductTask, copy TaskTags as CustomerTaskTags

---

## Frontend Implementation

### Step 8: Create Tag Types

Add to `frontend/src/types/` or inline:

```typescript
interface ProductTag {
  id: string;
  productId: string;
  name: string;
  color?: string;
  displayOrder: number;
}

interface CustomerProductTag {
  id: string;
  customerProductId: string;
  sourceTagId?: string;
  name: string;
  color?: string;
  displayOrder: number;
}
```

### Step 9: Create GraphQL Operations

Add to frontend GraphQL:

```graphql
query GetProductTags($productId: ID!) {
  productTags(productId: $productId) {
    id
    name
    color
    displayOrder
  }
}

mutation CreateProductTag($productId: ID!, $name: String!, $color: String) {
  createProductTag(productId: $productId, name: $name, color: $color) {
    id
    name
    color
  }
}

mutation UpdateProductTag($id: ID!, $name: String, $color: String) {
  updateProductTag(id: $id, name: $name, color: $color) {
    id
    name
    color
  }
}

mutation DeleteProductTag($id: ID!) {
  deleteProductTag(id: $id)
}

mutation SetTaskTags($taskId: ID!, $tagIds: [ID!]!) {
  setTaskTags(taskId: $taskId, tagIds: $tagIds) {
    id
    tags {
      id
      name
      color
    }
  }
}
```

### Step 10: Products Page - Tags Tab

Modify `frontend/src/pages/ProductsPage.tsx`:

1. Add "Tags" to `selectedSubSection` options (between "outcomes" and "releases" or after "customAttributes")
2. Add tab for Tags in the tab bar
3. Create Tags management panel:
   - List of tags with color chips
   - Add new tag button
   - Edit tag (name, color)
   - Delete tag with confirmation
4. Theme color palette selector component

### Step 11: Task List - Tag Display

Modify task list component:
- Add tag chips after task name
- Tags displayed as small colored chips

### Step 12: Task Dialog - Tag Assignment

Modify `TaskDialog.tsx`:
- Add multi-select autocomplete for tags
- Show current tags as chips
- Allow adding/removing tags

### Step 13: Customer Products - Tag Filter

Modify customer adoption panel:
- Add filter bar above task list
- Multi-select dropdown for tags
- "Show untagged" checkbox
- Filter tasks client-side based on selection

---

## Export/Import Integration

### Step 14: Update Excel Export

Modify product export to include:
- New "Tags" sheet with all product tags
- Add "Tags" column to Tasks sheet (comma-separated tag names)

### Step 15: Update Excel Import

Modify product import to:
- Read "Tags" sheet and create ProductTags
- Parse "Tags" column in Tasks sheet
- Create TaskTag associations

---

## Theme Color Palette

### Step 16: Define Color Options

Available tag colors (from MUI theme):
- `primary` - Blue
- `secondary` - Purple
- `success` - Green
- `warning` - Orange
- `error` - Red
- `info` - Light Blue
- `default` - Gray

Store color as theme key string, render with `theme.palette[color].main`.

---

## Testing

### Step 17: Test Cases

1. **Tag CRUD**
   - Create tag with name and color
   - Update tag name/color
   - Delete tag (verify cascade)
   - Prevent duplicate names (case-insensitive)

2. **Task Tag Assignment**
   - Assign single tag to task
   - Assign multiple tags to task
   - Remove tag from task
   - Replace all tags on task

3. **Customer Sync**
   - Sync copies all tags
   - Sync copies task-tag associations
   - Re-sync replaces tags completely

4. **Filtering (Customer)**
   - Filter by single tag
   - Filter by multiple tags (OR logic)
   - Filter untagged tasks

5. **Export/Import**
   - Export includes tags
   - Import creates tags
   - Import associates tags to tasks

---

## Implementation Order

1. ☐ Schema migration
2. ☐ Backend resolvers
3. ☐ Products page - Tags tab
4. ☐ Task list - tag chips display
5. ☐ Task dialog - tag assignment
6. ☐ Customer sync logic
7. ☐ Customer adoption - tag filter
8. ☐ Export/Import support
9. ☐ Testing
10. ☐ Deploy to dev → stage → prod

---

## Files to Modify

### Backend
- `backend/prisma/schema.prisma` - Schema changes
- `backend/src/schema/typeDefs.ts` - GraphQL types
- `backend/src/schema/resolvers/tags.ts` - New file
- `backend/src/schema/resolvers/index.ts` - Export new resolvers
- `backend/src/schema/resolvers/products.ts` - Add tag relations
- `backend/src/schema/resolvers/customerProduct.ts` - Sync logic

### Frontend
- `frontend/src/pages/ProductsPage.tsx` - Tags tab, task tag display
- `frontend/src/components/dialogs/TaskDialog.tsx` - Tag assignment
- `frontend/src/components/CustomerAdoptionPanelV4.tsx` - Tag filter
- `frontend/src/graphql/` - New queries/mutations

---

## Rollback Plan

If issues arise:
1. Revert Prisma migration: `npx prisma migrate resolve --rolled-back add_task_tags`
2. Restore previous code from git
3. Tags are additive - no existing data affected

---

**Document saved for implementation continuity.**
