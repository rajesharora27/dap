# Task Tag Implementation Plan

**Created:** December 18, 2025  
**Status:** Completed  
**Version:** 2.8.0 (Solution Tags extension)

---

## Overview

Add a tagging system for tasks within products AND solutions. Tags are scoped to their respective product or solution. Tags are copied to customer adoption plans during sync.

### Key Requirements
- **Product & Solution scoped tags** - Manage tags per product and per solution
- **Tags copied to adoption plans** - Customer products/solutions get copies of tags during sync
- **Full sync** - When syncing, customer tags are completely replaced with source tags
- **Multi-tag filtering** - OR logic (show tasks with ANY selected tag) in adoption plans
- **Theme-based colors** - Predefined color palette from MUI theme
- **Export/Import support** - Tags included in export/import (Product tags prioritized, solution tags next)

---

## Database Schema

### Step 1: Create Prisma Schema

Add to `backend/prisma/schema.prisma`:

```prisma
// ===================
// PRODUCT TAGS (Existing)
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
// SOLUTION TAGS (New)
// ===================

model SolutionTag {
  id           String            @id @default(cuid())
  solutionId   String
  name         String
  color        String?
  displayOrder Int               @default(0)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  
  solution     Solution          @relation(fields: [solutionId], references: [id], onDelete: Cascade)
  taskTags     SolutionTaskTag[]
  
  @@unique([solutionId, name])
  @@index([solutionId])
}

model SolutionTaskTag {
  id        String       @id @default(cuid())
  taskId    String
  tagId     String
  createdAt DateTime     @default(now())
  
  task      Task         @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag       SolutionTag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
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

// ===================
// CUSTOMER SOLUTION TAGS (New)
// ===================

model CustomerSolutionTag {
  id                  String           @id @default(cuid())
  customerSolutionId  String
  sourceTagId         String?
  name                String
  color               String?
  displayOrder        Int              @default(0)
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  
  customerSolution    CustomerSolution @relation(fields: [customerSolutionId], references: [id], onDelete: Cascade)
  taskTags            CustomerSolutionTaskTag[]
  
  @@unique([customerSolutionId, name])
  @@index([customerSolutionId])
}

model CustomerSolutionTaskTag {
  id                     String               @id @default(cuid())
  customerSolutionTaskId String
  tagId                  String
  createdAt              DateTime             @default(now())
  
  customerSolutionTask   CustomerSolutionTask @relation(fields: [customerSolutionTaskId], references: [id], onDelete: Cascade)
  tag                    CustomerSolutionTag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([customerSolutionTaskId, tagId])
  @@index([customerSolutionTaskId])
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
  solutionTaskTags SolutionTaskTag[]
}

model CustomerProduct {
  // ... existing fields
  tags  CustomerProductTag[]
}

model CustomerProductTask {
  // ... existing fields
  taskTags  CustomerTaskTag[]
}

model Solution {
  // ... existing fields
  tags  SolutionTag[]
}

model CustomerSolution {
  // ... existing fields
  tags  CustomerSolutionTag[]
}

model CustomerSolutionTask {
  // ... existing fields
  taskTags  CustomerSolutionTaskTag[]
}
```

### Step 3: Run Migration

```bash
cd backend
npx prisma migrate dev --name add_solution_tags
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

type SolutionTag {
  id: ID!
  solutionId: ID!
  name: String!
  color: String
  displayOrder: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type CustomerSolutionTag {
  id: ID!
  customerSolutionId: ID!
  sourceTagId: ID
  name: String!
  color: String
  displayOrder: Int!
}

extend type Product {
  tags: [ProductTag!]!
}

extend type Task {
  # Existing
  tags: [ProductTag!]!
  # New
  solutionTags: [SolutionTag!]!
}

extend type CustomerProduct {
  tags: [CustomerProductTag!]!
}

extend type CustomerProductTask {
  tags: [CustomerProductTag!]!
}

extend type Solution {
  tags: [SolutionTag!]!
}

extend type CustomerSolution {
  tags: [CustomerSolutionTag!]!
}

extend type CustomerSolutionTask {
  tags: [CustomerSolutionTag!]!
}

extend type Query {
  productTags(productId: ID!): [ProductTag!]!
  customerProductTags(customerProductId: ID!): [CustomerProductTag!]!
  solutionTags(solutionId: ID!): [SolutionTag!]!
  customerSolutionTags(customerSolutionId: ID!): [CustomerSolutionTag!]!
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

  # Solution Tag Management
  createSolutionTag(solutionId: ID!, name: String!, color: String): SolutionTag!
  updateSolutionTag(id: ID!, name: String, color: String, displayOrder: Int): SolutionTag!
  deleteSolutionTag(id: ID!): Boolean!
  
  # Task Tag Assignment (Generalized or Specific)
  setSolutionTaskTags(taskId: ID!, tagIds: [ID!]!): Task!
  addSolutionTagToTask(taskId: ID!, tagId: ID!): Task!
  removeSolutionTagFromTask(taskId: ID!, tagId: ID!): Task!
}
```

### Step 5: Update Tag Resolvers

Update `backend/src/schema/resolvers/tags.ts`:
- Add resolvers for `SolutionTag` CRUD.
- Add resolvers for `CustomerSolutionTag` query.
- Add mutations for linking `SolutionTag` to `Task`.
- Update `Task.tags` to possibly aggregate? No, keep separate fields `tags` (product) and `solutionTags` (solution) for clarity, or update frontend to query both. Best to keep separate.

### Step 6: Update Solution Resolvers

Add tag relations to `backend/src/schema/resolvers/solutions.ts`.

### Step 7: Update Sync Logic

Modify `backend/src/schema/resolvers/customerProduct.ts`:

In `syncCustomerProduct` mutation:
1. Delete all existing CustomerProductTags for the customer product
2. Copy all ProductTags from source product as CustomerProductTags
3. For each CustomerProductTask, copy TaskTags as CustomerTaskTags

Sync logic for Customer Solutions is likely in `backend/src/schema/resolvers/customerSolution.ts` (or wherever `syncCustomerSolution` is).
1. Delete existing `CustomerSolutionTags`.
2. Copy `SolutionTags`.
3. Copy `SolutionTaskTags` to `CustomerSolutionTaskTags`.

---

## Frontend Implementation

### Step 8: Update Tag Types

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

interface SolutionTag {
  id: string;
  solutionId: string;
  name: string;
  color?: string;
  displayOrder: number;
}

interface CustomerSolutionTag {
  id: string;
  customerSolutionId: string;
  sourceTagId?: string;
  name: string;
  color?: string;
  displayOrder: number;
}
```

### Step 9: Create GraphQL Operations for Solutions

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

query GetSolutionTags($solutionId: ID!) {
  solutionTags(solutionId: $solutionId) {
    id
    name
    color
    displayOrder
  }
}

mutation CreateSolutionTag($solutionId: ID!, $name: String!, $color: String) {
  createSolutionTag(solutionId: $solutionId, name: $name, color: $color) {
    id
    name
    color
  }
}

mutation UpdateSolutionTag($id: ID!, $name: String, $color: String) {
  updateSolutionTag(id: $id, name: $name, color: $color) {
    id
    name
    color
  }
}

mutation DeleteSolutionTag($id: ID!) {
  deleteSolutionTag(id: $id)
}

mutation SetSolutionTaskTags($taskId: ID!, $tagIds: [ID!]!) {
  setSolutionTaskTags(taskId: $taskId, tagIds: $tagIds) {
    id
    solutionTags {
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

### Step 10: Solutions Page - Tags Tab

Modify `frontend/src/pages/SolutionsPage.tsx`:
- Similar implementation to Products Page.
- "Tags" tab for managing solution-level tags.
- List with filtering component (reusable?).

### Step 11: Task List - Tag Display

Modify task list component:
- Add tag chips after task name
- Tags displayed as small colored chips

### Step 11: Task Dialog - Handling Solution Tags

Modify `TaskDialog.tsx`:
- If `solutionId` is present (meaning it's a solution task), load available tags from `solutionTags`.
- If `productId` is present, load from `productTags`.
- Handle saving appropriate tag relations.
- Add multi-select autocomplete for tags
- Show current tags as chips
- Allow adding/removing tags

### Step 12: Customer Products - Tag Filter

Modify customer adoption panel:
- Add filter bar above task list
- Multi-select dropdown for tags
- "Show untagged" checkbox
- Filter tasks client-side based on selection

### Step 12: Customer Adoption - Tag Filter

Modify `CustomerAdoptionPanelV4.tsx`:
- Fetch available tags (product or solution based on context).
- Display filter dropdown.
- Filter task list.

---

## Export/Import Integration

### Step 14: Update Excel Export

Modify product export to include:
- New "Tags" sheet with all product tags
- Add "Tags" column to Tasks sheet (comma-separated tag names)

Modify product export to include:
- New "Tags" sheet with all product tags
- Add "Tags" column to Tasks sheet (comma-separated tag names)
- Extend to include solution tags (e.g., separate sheet or clearly distinguished in task sheet)

### Step 15: Update Excel Import

Modify product import to:
- Read "Tags" sheet and create ProductTags
- Parse "Tags" column in Tasks sheet
- Create TaskTag associations
- Extend to import solution tags and associations

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

## Testing Plan

1. **Solution Tag CRUD**: Create/Edit/Delete tags on Solution.
2. **Solution Task Assignment**: Assign tags to Solution Tasks.
3. **Product vs Solution**: Ensure Product tags don't show for Solution tasks and vice versa.
4. **Customer Sync**: Verify tags sync to Customer Solution.
5. **Filtering**: Verify filtering works in Customer Adoption Plans (both Product and Solution types).

---

## Future-Proof Sync Implementation
To ensure that any new task fields added in the future are automatically synchronized from Product/Solution tasks to Customer tasks, a generic syncing mechanism was implemented in `customerAdoption.ts` and `solutionAdoption.ts`. This mechanism:
1. Identifies all content-relevant fields from the source task.
2. Excludes identity (ID), relational, and adoption-status fields.
3. Automatically spreads the remaining fields into the customer task creation/update operations.

---

## Implementation Order

1. [x] Schema migration
2. [x] Backend resolvers
3. [x] Products page - Tags tab
4. [x] Task list - tag chips display
5. [x] Task dialog - tag assignment
6. [x] Customer sync logic (Future-proof implementation)
7. [x] Customer adoption - tag filter
8. [x] Export/Import support
9. [x] Testing
10. [x] Deploy to dev → stage → prod

---

## Files to Modify

### Backend
- `backend/prisma/schema.prisma` - Schema changes
- `backend/src/schema/typeDefs.ts` - GraphQL types
- `backend/src/schema/resolvers/tags.ts` - New file
- `backend/src/schema/resolvers/index.ts` - Export new resolvers
- `backend/src/schema/resolvers/products.ts` - Add tag relations
- `backend/src/schema/resolvers/solutions.ts` - Add tag relations
- `backend/src/schema/resolvers/customerProduct.ts` - Sync logic
- `backend/src/schema/resolvers/customerSolution.ts` - Sync logic

### Frontend
- `frontend/src/pages/ProductsPage.tsx` - Tags tab, task tag display
- `frontend/src/pages/SolutionsPage.tsx` - Tags tab, task tag display
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
