# DAP Naming Conventions

This document defines the standard naming conventions for the DAP (Digital Adoption Platform) codebase. All new code should follow these conventions, and existing code should be refactored to comply over time.

---

## Table of Contents
1. [GraphQL Operations](#graphql-operations)
2. [TypeScript/JavaScript](#typescriptjavascript)
3. [React Components](#react-components)
4. [File and Directory Naming](#file-and-directory-naming)
5. [Database and Prisma](#database-and-prisma)
6. [CSS and Styling](#css-and-styling)

---

## GraphQL Operations

### Queries

**Pattern:** `{Entity}` or `{Context}{Entity}`

| Rule | Example | Notes |
|------|---------|-------|
| Single resource | `Product`, `Customer`, `Task` | No prefix, PascalCase |
| List of resources | `Products`, `Customers`, `Tasks` | Plural form |
| Filtered/scoped | `ProductTasks`, `SolutionOutcomes` | `{Parent}{Child}` pattern |
| With details | `ProductWithDetails`, `SolutionsWithDetails` | Use `WithDetails` suffix when fetching related data |

**DO NOT use:**
- ❌ `GetProduct` - The `Get` prefix is redundant (queries always "get")
- ❌ `ProductQuery` - The `Query` suffix is redundant
- ❌ `FetchProducts` - Use declarative names, not imperative

**Correct Examples:**
```graphql
query Product($id: ID!) { ... }
query Products { ... }
query ProductTasks($productId: ID!) { ... }
query SolutionsWithDetails { ... }
query AdoptionPlan($id: ID!) { ... }
```

### Mutations

**Pattern:** `{Action}{Entity}`

| Rule | Example | Notes |
|------|---------|-------|
| Create | `CreateProduct`, `CreateTask` | Always `Create` prefix |
| Update | `UpdateProduct`, `UpdateTask` | Always `Update` prefix |
| Delete | `DeleteProduct`, `DeleteTask` | Always `Delete` prefix |
| Other actions | `AssignProductToCustomer`, `SyncAdoptionPlan` | Descriptive verb + entity |

**Correct Examples:**
```graphql
mutation CreateProduct($input: ProductInput!) { ... }
mutation UpdateCustomer($id: ID!, $input: CustomerInput!) { ... }
mutation DeleteTask($id: ID!) { ... }
mutation AssignProductToCustomer($input: AssignInput!) { ... }
mutation SyncAdoptionPlan($adoptionPlanId: ID!) { ... }
```

### Subscriptions

**Pattern:** `On{Event}{Entity}` or `{Entity}{Event}`

```graphql
subscription OnTaskUpdated($taskId: ID!) { ... }
subscription CustomerStatusChanged($customerId: ID!) { ... }
```

### Query/Mutation Constants

**Pattern:** `SCREAMING_SNAKE_CASE`

```typescript
// Queries
export const PRODUCTS = gql`...`;
export const PRODUCT = gql`...`;
export const PRODUCT_TASKS = gql`...`;
export const SOLUTIONS_WITH_DETAILS = gql`...`;

// Mutations  
export const CREATE_PRODUCT = gql`...`;
export const UPDATE_PRODUCT = gql`...`;
export const DELETE_PRODUCT = gql`...`;
```

### refetchQueries

Always use the **exact query operation name** (the name inside the GraphQL string):

```typescript
// Query definition
export const PRODUCT_TASKS = gql`
  query ProductTasks($productId: ID!) { ... }  // ← Operation name is "ProductTasks"
`;

// Mutation with refetch
await client.mutate({
  mutation: CREATE_TASK,
  refetchQueries: ['ProductTasks']  // ← Must match operation name exactly
});
```

---

## TypeScript/JavaScript

### Variables and Functions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `productName`, `isLoading`, `taskCount` |
| Functions | camelCase | `handleSubmit`, `fetchProducts`, `calculateTotal` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_URL`, `DEFAULT_PAGE_SIZE` |
| Private fields | `_` prefix (optional) | `_internalState`, `_cache` |

### Types and Interfaces

| Type | Convention | Example |
|------|------------|---------|
| Interfaces | PascalCase, `I` prefix optional | `Product`, `CustomerInput`, `IUserService` |
| Types | PascalCase | `TaskStatus`, `LicenseLevel` |
| Enums | PascalCase | `TaskStatus`, `LicenseLevel` |
| Enum values | SCREAMING_SNAKE_CASE | `IN_PROGRESS`, `NOT_STARTED` |

### Boolean Variables

Use `is`, `has`, `can`, `should` prefixes:

```typescript
const isLoading = true;
const hasPermission = false;
const canEdit = user.role === 'admin';
const shouldRefetch = data.isStale;
```

---

## React Components

### Component Names

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductDialog`, `TaskList`, `CustomerCard` |
| Hooks | camelCase with `use` prefix | `useProducts`, `useAuth`, `useProductEditing` |
| HOCs | camelCase with `with` prefix | `withAuth`, `withErrorBoundary` |

### Component File Structure

```
ComponentName/
├── ComponentName.tsx       # Main component
├── ComponentName.test.tsx  # Tests
├── ComponentName.styles.ts # Styled components (if applicable)
└── index.ts               # Barrel export
```

Or for simpler components:
```
ComponentName.tsx
```

### Props Interfaces

**Pattern:** `{ComponentName}Props`

```typescript
interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  productId?: string;
}

export const ProductDialog: React.FC<ProductDialogProps> = ({ open, onClose, productId }) => {
  // ...
};
```

### Event Handlers

**Pattern:** `handle{Event}` for internal handlers, `on{Event}` for props

```typescript
interface Props {
  onSelect: (id: string) => void;  // Prop passed from parent
  onClose: () => void;
}

const MyComponent: React.FC<Props> = ({ onSelect, onClose }) => {
  const handleClick = () => {   // Internal handler
    onSelect(selectedId);
  };
  
  const handleSubmit = async () => {
    await save();
    onClose();
  };
};
```

---

## File and Directory Naming

### Files

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `ProductDialog.tsx`, `TaskList.tsx` |
| Hooks | camelCase with prefix | `useProducts.ts`, `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts`, `validateInput.ts` |
| Constants | camelCase | `constants.ts`, `config.ts` |
| Types | camelCase | `types.ts`, `product.types.ts` |
| GraphQL | camelCase with suffix | `products.queries.ts`, `products.mutations.ts` |
| Tests | Match source + `.test` | `ProductDialog.test.tsx` |

### Directories

| Type | Convention | Example |
|------|------------|---------|
| Features | kebab-case | `product-outcomes/`, `adoption-plans/` |
| Components | kebab-case or PascalCase | `shared/components/` |
| Modules (backend) | kebab-case | `customer/`, `import/`, `auth/` |

### Feature Structure

```
features/
├── products/
│   ├── components/
│   │   ├── ProductDialog.tsx
│   │   ├── ProductList.tsx
│   │   └── index.ts
│   ├── graphql/
│   │   ├── products.queries.ts
│   │   ├── products.mutations.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useProducts.ts
│   │   └── useProductEditing.ts
│   ├── types.ts
│   └── index.ts
```

---

## Database and Prisma

### Model Names

**Pattern:** PascalCase, singular

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  createdAt   DateTime @default(now())
}

model CustomerProduct {
  id         String @id @default(cuid())
  customerId String
  productId  String
}
```

### Field Names

**Pattern:** camelCase

```prisma
model Task {
  id              String    @id
  name            String
  estMinutes      Int
  sequenceNumber  Int
  isComplete      Boolean
  completedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Relation Fields

```prisma
model Task {
  productId String
  product   Product @relation(fields: [productId], references: [id])
  
  outcomes  Outcome[]           // Many-to-many
  tags      TaskTag[]           // Join table relation
}
```

---

## CSS and Styling

### MUI sx prop

Use meaningful property names:

```tsx
<Box sx={{
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  p: 3,
  bgcolor: 'background.paper',
  borderRadius: 2,
}}>
```

### Theme Tokens

Use theme tokens instead of hardcoded values:

```tsx
// ✅ Good
sx={{ color: 'primary.main', bgcolor: 'background.default' }}

// ❌ Bad
sx={{ color: '#1976d2', bgcolor: '#ffffff' }}
```

---

## Summary Checklist

When writing new code, verify:

- [ ] GraphQL queries use `{Entity}` pattern (no `Get` prefix, no `Query` suffix)
- [ ] GraphQL mutations use `{Action}{Entity}` pattern
- [ ] Query constants are `SCREAMING_SNAKE_CASE`
- [ ] `refetchQueries` use exact operation names
- [ ] React components are PascalCase
- [ ] Hooks start with `use`
- [ ] Event handlers use `handle{Event}` internally, `on{Event}` for props
- [ ] Files follow the naming conventions for their type
- [ ] Boolean variables use `is`, `has`, `can`, `should` prefixes

---

## Migration Notes

When refactoring existing code:

1. Update query operation names to remove `Get` prefix and `Query` suffix
2. Update all `refetchQueries` to use the new operation names
3. Consolidate duplicate queries into shared modules
4. Export queries from feature `index.ts` for easy importing

**Example refactoring:**
```typescript
// Before
const GET_PRODUCTS_QUERY = gql`query GetProductsQuery { ... }`;
refetchQueries: ['GetProductsQuery']

// After  
const PRODUCTS = gql`query Products { ... }`;
refetchQueries: ['Products']
```
