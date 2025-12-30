# ADR-0004: Prisma ORM with PostgreSQL

## Status

✅ Accepted

## Date

2024-10-01

## Context

DAP needs a reliable database layer that supports:
- Complex relational data (35+ tables)
- Type-safe queries in TypeScript
- Easy schema migrations
- Good developer experience
- Production reliability

The application domain has many relationships (Products → Tasks → Telemetry, etc.) that benefit from a relational model.

## Decision

Use **Prisma** as the ORM with **PostgreSQL 16** as the database.

### Prisma Configuration

```prisma
// prisma/schema.prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl", "darwin-arm64"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Schema Design Patterns

1. **Soft Deletes**: Use `deletedAt DateTime?` instead of hard deletes
2. **Timestamps**: All tables have `createdAt` and `updatedAt`
3. **IDs**: Use CUIDs for distributed ID generation
4. **JSON Fields**: For flexible schema (customAttrs, resources)
5. **Enums**: For fixed value sets (LicenseLevel, TaskStatus)

### Migrations

```bash
# Development: Create and apply migration
npx prisma migrate dev --name description

# Production: Apply pending migrations
npx prisma migrate deploy

# Emergency: Push schema without migration
npx prisma db push
```

## Consequences

### Positive

- ✅ Type-safe database queries (no raw SQL bugs)
- ✅ Auto-generated TypeScript types
- ✅ Easy migrations with history
- ✅ Excellent VS Code integration
- ✅ Prisma Studio for data browsing
- ✅ PostgreSQL is battle-tested, feature-rich
- ✅ JSON columns for flexible data
- ✅ Good performance with proper indexes

### Negative

- ⚠️ Prisma adds abstraction layer (some raw SQL needed)
- ⚠️ Migration conflicts in team development
- ⚠️ Large schema file (981 lines)
- ⚠️ N+1 queries easy to create (need DataLoader)
- ⚠️ Limited control over generated SQL

### Neutral

- Need to learn Prisma Query API
- Schema changes require regenerating client
- PostgreSQL requires hosting/management

## Alternatives Considered

### Alternative 1: TypeORM

- **Pros**: Mature, decorator-based, active record
- **Cons**: Weaker TypeScript inference, more verbose
- **Why rejected**: Prisma has better DX and type safety

### Alternative 2: Drizzle ORM

- **Pros**: Lightweight, SQL-like, fast
- **Cons**: Less mature, smaller ecosystem
- **Why rejected**: Prisma was more established when project started

### Alternative 3: Raw SQL with pg driver

- **Pros**: Full control, no abstraction
- **Cons**: No type safety, manual migrations, error-prone
- **Why rejected**: Too much boilerplate for application size

### Alternative 4: MongoDB

- **Pros**: Flexible schema, easy to start
- **Cons**: Weak relationships, harder queries
- **Why rejected**: Data is highly relational

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [schema.prisma](../../backend/prisma/schema.prisma)

