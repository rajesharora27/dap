# ADR-0003: Apollo + GraphQL Stack

## Status

✅ Accepted

## Date

2024-10-01

## Context

DAP needs a robust API layer that supports:
- Complex nested data relationships (Products → Tasks → Telemetry)
- Flexible queries for different UI views
- Real-time updates capability
- Strong typing between frontend and backend
- Efficient data fetching (avoid over/under-fetching)

Options considered: REST, GraphQL, tRPC, gRPC

## Decision

Use **GraphQL** with **Apollo** on both frontend and backend:

### Backend
- **Apollo Server v4** on Express
- Schema-first development with TypeScript
- Resolvers organized by domain module
- DataLoader for batching (planned)

### Frontend
- **Apollo Client v3** for React
- Automatic cache management
- Generated TypeScript types from schema
- Optimistic UI updates

### Schema Organization

```graphql
# Type definitions per module
type Product {
  id: ID!
  name: String!
  tasks: [Task!]!
  # Field resolvers for relationships
}

# Queries and mutations follow naming conventions
type Query {
  product(id: ID!): Product
  products: ProductConnection!
}

type Mutation {
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: ID!, input: UpdateProductInput!): Product!
}
```

## Consequences

### Positive

- ✅ Strong typing with automatic codegen
- ✅ Clients request exactly what they need
- ✅ Single endpoint simplifies deployment
- ✅ Excellent developer tools (Apollo DevTools)
- ✅ Built-in caching on client
- ✅ Subscriptions available for real-time
- ✅ Self-documenting API (introspection)

### Negative

- ⚠️ Learning curve for team
- ⚠️ N+1 query problem requires DataLoader
- ⚠️ Caching complexity compared to REST
- ⚠️ File uploads require special handling
- ⚠️ Larger bundle size than fetch

### Neutral

- Need GraphQL Codegen setup
- Requires understanding of Apollo cache
- Error handling differs from REST conventions

## Alternatives Considered

### Alternative 1: REST API

- **Pros**: Simple, well-understood, HTTP caching
- **Cons**: Over/under-fetching, multiple endpoints, versioning
- **Why rejected**: Complex nested data would require many endpoints

### Alternative 2: tRPC

- **Pros**: Type-safe, no schema, lightweight
- **Cons**: Tight coupling, TypeScript only, less mature
- **Why rejected**: Less ecosystem, harder to document for third parties

### Alternative 3: gRPC

- **Pros**: Very fast, streaming, strong typing
- **Cons**: Complex setup, poor browser support, binary protocol
- **Why rejected**: Overkill for web application

## References

- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

