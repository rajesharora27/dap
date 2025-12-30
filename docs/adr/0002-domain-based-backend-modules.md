# ADR-0002: Domain-Based Backend Modules

## Status

✅ Accepted

## Date

2024-12-01

## Context

The backend needed a clear organizational structure that would:
- Scale with application complexity
- Enable clear ownership of business domains
- Support the GraphQL schema organization
- Make it easy to locate resolvers, services, and types

Initial structure mixed GraphQL schema definitions with business logic, making it difficult to understand the data flow.

## Decision

Adopt a **Domain-Based Module Architecture** where each business domain has its own module under `src/modules/`:

```
src/modules/{domain}/
├── {domain}.resolver.ts      # GraphQL resolvers
├── {domain}.service.ts       # Business logic
├── {domain}.typeDefs.ts      # GraphQL type definitions
├── {domain}.types.ts         # TypeScript types
├── {domain}.validation.ts    # Input validation (Zod)
├── {domain}.schema.graphql   # Optional: SDL schema
├── __tests__/                # Module tests
├── index.ts                  # Public API
└── README.md                 # Module documentation
```

### Modules

| Domain | Responsibility |
|--------|---------------|
| `product` | Product CRUD, tasks, attributes |
| `solution` | Solution bundles, product grouping |
| `customer` | Customer management, adoption plans |
| `task` | Task CRUD, ordering |
| `auth` | Authentication, sessions |
| `tag` | Product and solution tags |
| `telemetry` | Telemetry attributes and values |
| `backup` | Database backup/restore |
| `import` | Excel/CSV import/export |
| `ai` | Natural language queries |

### Shared Code

Cross-cutting concerns live in `src/shared/`:

```
src/shared/
├── auth/          # Permission checking
├── database/      # Prisma client
├── graphql/       # Context, scalars
├── utils/         # Pagination, audit
└── pubsub/        # Real-time events
```

## Consequences

### Positive

- ✅ Clear separation of business domains
- ✅ Each module is self-contained
- ✅ Easy to locate all code for a domain
- ✅ Supports feature teams owning modules
- ✅ GraphQL resolvers co-located with business logic
- ✅ Testing can be done per-module

### Negative

- ⚠️ Some cross-module dependencies inevitable
- ⚠️ Must carefully manage shared code
- ⚠️ Circular dependencies possible if not careful

### Neutral

- Requires pre-commit hook to enforce structure
- Each module needs proper `index.ts` exports
- Documentation needed per module (README.md)

## Alternatives Considered

### Alternative 1: Layer-Based (resolvers/services/models)

- **Pros**: Simple, common pattern
- **Cons**: Related code scattered, hard to understand full feature
- **Why rejected**: Doesn't scale with complexity

### Alternative 2: Clean Architecture (Use Cases)

- **Pros**: Strong separation, testable
- **Cons**: Too much abstraction for current needs
- **Why rejected**: Overhead not justified for team size

### Alternative 3: Monolithic with Folders

- **Pros**: Simple, no module boundaries
- **Cons**: No clear ownership, everything depends on everything
- **Why rejected**: Already causing pain points

## References

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [CONTEXT.md - Backend Architecture](../CONTEXT.md)
- [enforce-modular-layout.sh](../../scripts/enforce-modular-layout.sh)

