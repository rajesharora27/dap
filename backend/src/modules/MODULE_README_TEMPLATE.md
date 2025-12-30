# {Module Name} Module

> Template for backend module documentation. Copy this file to your module as `README.md`.

## Responsibility

{One paragraph describing what this module is responsible for}

## Public API

Exports from `index.ts`:

```typescript
// Services
export { ModuleService } from './module.service';

// Resolvers
export { ModuleFieldResolvers } from './module.resolver';
export { ModuleQueryResolvers } from './module.resolver';
export { ModuleMutationResolvers } from './module.resolver';

// Types
export type { ModuleType } from './module.types';
```

## Dependencies

| Module | Purpose |
|--------|---------|
| `shared/auth` | Permission checking |
| `shared/database` | Prisma client |
| `{other_module}` | {why needed} |

## Database Tables

- `{TableName}` - {description}
- `{RelatedTable}` - {description}

## GraphQL Operations

### Queries
| Query | Description | Auth |
|-------|-------------|------|
| `{entity}` | Get single by ID | READ |
| `{entities}` | List all with pagination | READ |

### Mutations
| Mutation | Description | Auth |
|----------|-------------|------|
| `create{Entity}` | Create new | WRITE |
| `update{Entity}` | Update existing | WRITE |
| `delete{Entity}` | Soft delete | ADMIN |

## Business Rules

1. {Rule 1}
2. {Rule 2}

## Error Codes

| Code | Description |
|------|-------------|
| `{MODULE}_NOT_FOUND` | Entity does not exist |
| `{MODULE}_DUPLICATE` | Name already exists |

## Testing

```bash
npm test -- --grep "{module}"
```

## Related Documentation

- [CONTEXT.md](../../../docs/CONTEXT.md) - Application overview
- [{Related Doc}](../../../docs/{doc}.md) - {Description}

