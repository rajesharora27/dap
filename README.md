# DAP (Demo Application Platform)

Full-stack modular API-first demo implementing Products, Tasks, Solutions, Change Sets, Audit Trail, Realtime Subscriptions, CSV import/export, Role-based Auth, Telemetry, Dependencies, Soft Delete Queue.

## Stack

- Backend: Node.js + TypeScript + Express + Apollo Server + Prisma + PostgreSQL
- Frontend: React + TypeScript + Apollo Client + MUI
- Realtime: graphql-ws subscriptions (products & tasks)
- Auth: Simple header token ("admin" / "user") placeholder
- Pagination: Relay-style forward & backward cursor pagination (products, tasks)
- Change Tracking: ChangeSets capturing before/after for product updates with revert
- Audit: Central audit log for all mutations
- CSV: Products & Tasks import/export
- Telemetry: Task telemetry ingestion + query
- Dependencies: Task dependency graph (basic CRUD)
- Locking: Optimistic editing locks (in DB)

## Quick Start

```bash
# Build & start all services
docker compose up -d --build
# Apply migrations
docker compose exec backend npx prisma migrate deploy
# (Optional) Seed
docker compose exec backend npm run seed
# Open apps
xdg-open http://localhost:5173 || open http://localhost:5173
```

GraphQL endpoint: http://localhost:4000/graphql

Auth headers:

- `Authorization: admin` (ADMIN)
- `Authorization: user` (USER)

## Selected Operations

Products pagination:

```graphql
query {
  products(first: 10) {
    edges {
      cursor
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Backward pagination:

```graphql
query {
  products(last: 5, before: "<cursor>") {
    edges {
      node {
        id
        name
      }
    }
    pageInfo {
      hasPreviousPage
      startCursor
    }
  }
}
```

Change sets:

```graphql
mutation {
  beginChangeSet
}
mutation Update {
  updateProduct(id: "...", input: { name: "New" }) {
    id
    name
  }
}
mutation Commit {
  commitChangeSet(id: "<csId>")
}
mutation Revert {
  revertChangeSet(id: "<csId>")
}
```

CSV:

```graphql
mutation {
  exportProductsCsv
}
mutation {
  importProductsCsv(csv: "id,name,description\n...")
}
```

Telemetry:

```graphql
mutation {
  addTelemetry(taskId: "...", data: { k: "v" })
}
query {
  telemetry(taskId: "...") {
    id
    data
    createdAt
  }
}
```

Dependencies:

```graphql
mutation {
  addTaskDependency(taskId: "A", dependsOnId: "B")
}
query {
  taskDependencies(taskId: "A") {
    id
    dependsOnId
  }
}
```

Soft delete queue:

```graphql
mutation {
  queueTaskSoftDelete(id: "...")
}
mutation {
  processDeletionQueue(limit: 20)
}
```

## Development (local without Docker)

```bash
# Backend
cd backend
npm install
npx prisma generate
npm run dev
# Frontend
cd ../frontend
npm install
npm run dev
```

## Testing

```bash
cd backend
npm test
```

(Tests auto-skip if DB not reachable.)

## Next Ideas / TODO

- Proper authentication & JWT issuance
- GraphQL schema directives for auth
- Rich diff visualizations for ChangeSets
- Web UI for CSV import previews
- Task dependency visualization (graph / Gantt)
- Telemetry retention job & metrics aggregation
- Kubernetes deployment manifests
- Performance & caching layer

---

This repository is a living demo; extend safely before production use.
