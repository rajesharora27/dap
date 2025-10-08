# Decimal Type Fix for Weight Field

## Issue Identified

**Error**: `Int cannot represent non-integer value: NaN`

The application was failing to load products because the `weight` field in Task records was being returned as `NaN` from GraphQL queries.

## Root Cause

### Database Schema
```prisma
// backend/prisma/schema.prisma
model Task {
  weight Decimal @default(0) @db.Decimal(5, 2)
  // ... other fields
}
```

The `weight` field is stored as `Decimal(5, 2)` in PostgreSQL.

### The Problem Chain

1. **Seed Script**: Was creating tasks with plain JavaScript numbers
   ```typescript
   // WRONG - JavaScript number
   weight: 9.50
   ```

2. **Prisma Behavior**: When Prisma reads Decimal fields, it returns `Prisma.Decimal` objects, not numbers

3. **GraphQL Resolver**: Some resolvers were using `t.weight` directly without conversion
   ```typescript
   // WRONG - Decimal object being used as number
   tasks.reduce((a, t) => a + t.weight, 0)
   ```

4. **Result**: JavaScript tried to add `Prisma.Decimal` objects to numbers → `NaN`

5. **GraphQL Type Error**: GraphQL schema expects `Float!` but received `NaN`

## Solutions Implemented

### 1. ✅ Fixed Seed Scripts - Create Proper Decimal Objects

**File**: `backend/src/seed.ts`

```typescript
// Import Prisma.Decimal
import { Prisma } from '@prisma/client';

// Create tasks with proper Decimal type
const task = await prisma.task.create({
  data: {
    // ... other fields
    weight: new Prisma.Decimal(taskInfo.weight), // ✅ Wrap in Prisma.Decimal
  }
});
```

**File**: `backend/src/seed-clean.ts`

```typescript
import { PrismaClient, Prisma } from '@prisma/client';

// Same fix applied
weight: new Prisma.Decimal(33),
```

### 2. ✅ Fixed Resolvers - Convert Decimal to Number

**File**: `backend/src/schema/resolvers/index.ts`

#### Task Resolver (Already Correct)
```typescript
Task: {
  weight: (parent: any) => {
    // ✅ Convert Prisma Decimal to Float for GraphQL
    if (parent.weight && typeof parent.weight === 'object' && 'toNumber' in parent.weight) {
      return parent.weight.toNumber();
    }
    return parent.weight || 0;
  },
  // ... other resolvers
}
```

#### Product statusPercent (Fixed)
```typescript
statusPercent: async (parent: any) => {
  const tasks = await prisma.task.findMany({ 
    where: { productId: parent.id, deletedAt: null } 
  });
  if (!tasks.length) return 0;
  
  // ✅ Convert Decimal to number in reduce
  const totalWeight = tasks.reduce((a: number, t: any) => {
    const weight = typeof t.weight === 'object' && 'toNumber' in t.weight 
      ? t.weight.toNumber() 
      : (t.weight || 0);
    return a + weight;
  }, 0) || 1;
  
  const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => {
    const weight = typeof t.weight === 'object' && 'toNumber' in t.weight 
      ? t.weight.toNumber() 
      : (t.weight || 0);
    return a + weight;
  }, 0);
  
  return Math.round((completed / totalWeight) * 100);
}
```

## Why This Works

### Prisma Decimal Type
- Prisma stores decimals as `Prisma.Decimal` objects for precision
- These are NOT JavaScript numbers
- Must be explicitly converted to numbers for calculations

### GraphQL Type Safety
- GraphQL schema defines: `weight: Float!`
- GraphQL expects actual JavaScript numbers, not objects
- Field resolvers convert Prisma types to GraphQL types

### Conversion Methods

1. **In Seed Scripts**: Create Decimal objects
   ```typescript
   new Prisma.Decimal(value)
   ```

2. **In Resolvers**: Convert to number
   ```typescript
   value.toNumber()
   ```

3. **Safe Conversion Pattern**:
   ```typescript
   const weight = typeof value === 'object' && 'toNumber' in value 
     ? value.toNumber() 
     : (value || 0);
   ```

## Testing

### Verify Data in Database
```bash
docker exec dap_db_1 psql -U postgres -d dap -c \
  "SELECT name, weight FROM \"Task\" WHERE \"deletedAt\" IS NULL LIMIT 5;"
```

Expected output:
```
           name            | weight 
---------------------------+--------
 ML Model Training Pipeline|  23.75
 NLP Processing Engine     |  20.50
 Computer Vision System    |  19.25
 ...
```

### Verify GraphQL Response
```graphql
query {
  products {
    edges {
      node {
        name
        tasks {
          edges {
            node {
              name
              weight
            }
          }
        }
      }
    }
  }
}
```

Expected: All weight values are numbers (not NaN)

## Files Modified

1. ✅ `backend/src/seed.ts` - Added Prisma import, wrapped weight in `new Prisma.Decimal()`
2. ✅ `backend/src/seed-clean.ts` - Added Prisma import, wrapped weight in `new Prisma.Decimal()`
3. ✅ `backend/src/schema/resolvers/index.ts` - Fixed statusPercent to convert Decimal to number

## Prevention

### When Creating Tasks
Always use `Prisma.Decimal` for decimal fields:

```typescript
import { Prisma } from '@prisma/client';

await prisma.task.create({
  data: {
    weight: new Prisma.Decimal(taskInfo.weight),
    // ... other fields
  }
});
```

### When Using Weight in Calculations
Always convert to number first:

```typescript
// ❌ WRONG
const total = tasks.reduce((sum, t) => sum + t.weight, 0);

// ✅ CORRECT
const total = tasks.reduce((sum, t) => {
  const weight = typeof t.weight === 'object' && 'toNumber' in t.weight 
    ? t.weight.toNumber() 
    : (t.weight || 0);
  return sum + weight;
}, 0);
```

### When Defining GraphQL Resolvers
Add field resolvers for Decimal fields:

```typescript
Task: {
  weight: (parent: any) => {
    if (parent.weight && typeof parent.weight === 'object' && 'toNumber' in parent.weight) {
      return parent.weight.toNumber();
    }
    return parent.weight || 0;
  }
}
```

## Related Documentation

- [Prisma Decimal Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/decimal)
- [SAMPLE_DATA_FIX.md](./SAMPLE_DATA_FIX.md) - Non-destructive sample data approach
- [COMPREHENSIVE_SAMPLE_DATA.md](./COMPREHENSIVE_SAMPLE_DATA.md) - Sample data strategy

## Status

✅ **FIXED** - Application now loads correctly with all weight values properly converted
- Seed scripts create Decimal objects
- Resolvers convert Decimal to Float
- GraphQL returns valid numbers
- Frontend displays tasks without errors
