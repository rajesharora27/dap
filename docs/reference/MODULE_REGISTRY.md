# Module Registry

> Central registry of all backend modules and frontend features in DAP.

**Last Updated:** December 30, 2025

---

## Backend Modules (20)

Located in `backend/src/modules/`

### Core Business Modules

| Module | Responsibility | Dependencies | Owner | Docs |
|--------|---------------|--------------|-------|------|
| **product** | Product CRUD, tasks, attributes, outcomes, releases, licenses | tag, shared/* | SME Team | [README](../backend/src/modules/product/README.md) |
| **solution** | Solution bundles, product grouping, solution-level tasks | product, tag, shared/* | SME Team | [README](../backend/src/modules/solution/README.md) |
| **customer** | Customer management, adoption plans, progress tracking | product, solution, telemetry | CSS Team | [README](../backend/src/modules/customer/README.md) |
| **task** | Task CRUD, ordering, soft delete queue | product, solution | SME Team | - |
| **tag** | Product tags, solution tags, task tagging | product, solution | SME Team | - |

### Supporting Modules

| Module | Responsibility | Dependencies | Owner | Docs |
|--------|---------------|--------------|-------|------|
| **license** | License level management (Essential/Advantage/Signature) | product, solution | SME Team | - |
| **outcome** | Business outcomes for products and solutions | product, solution | SME Team | - |
| **release** | Product/solution release versions | product, solution | SME Team | - |
| **telemetry** | Telemetry attributes, values, evaluation engine | task, customer | Platform | - |

### System Modules

| Module | Responsibility | Dependencies | Owner | Docs |
|--------|---------------|--------------|-------|------|
| **auth** | Authentication, JWT, sessions, password management | shared/auth | Platform | [README](../backend/src/modules/auth/README.md) |
| **admin** | User management, role management | auth, shared/* | Platform | - |
| **backup** | Database backup, restore, auto-scheduler | shared/database | Platform | - |
| **audit** | Audit logging, entity history | shared/* | Platform | - |
| **change-tracking** | Change sets, revert functionality | shared/* | Platform | - |

### Data Management Modules

| Module | Responsibility | Dependencies | Owner | Docs |
|--------|---------------|--------------|-------|------|
| **import** | Excel/CSV import, export, validation | product, solution, customer | Platform | - |
| **search** | Global search across entities | product, solution, customer | Platform | - |

### Advanced Modules

| Module | Responsibility | Dependencies | Owner | Docs |
|--------|---------------|--------------|-------|------|
| **ai** | Natural language queries, LLM integration | shared/*, all modules | Platform | [README](../backend/src/modules/ai/README.md) |
| **dev-tools** | Development utilities, database tools | shared/* | Platform | - |
| **my-diary** | User todos and bookmarks | auth | Platform | - |
| **common** | Shared scalars, common types | - | Platform | - |

---

## Frontend Features (22)

Located in `frontend/src/features/`

### Core Business Features

| Feature | Responsibility | Dependencies | Route | Components |
|---------|---------------|--------------|-------|------------|
| **products** | Product management UI, task tables, summary dashboard | tags, tasks, product-* | /products | ProductDialog, ProductsPanel, ProductSummaryDashboard |
| **solutions** | Solution management UI, product bundling | products, tags | /solutions | SolutionDialog, SolutionsPanel |
| **customers** | Customer management, assignment UI, adoption views | products, solutions | /customers | CustomerDialog, CustomersPanel, CustomerDetailView |
| **tasks** | Task editing, ordering, validation criteria | telemetry | - | TaskDialog, SortableTaskItem |
| **tags** | Tag management, task tagging | - | - | TagDialog |

### Product Sub-Features

| Feature | Responsibility | Dependencies | Route | Components |
|---------|---------------|--------------|-------|------------|
| **product-licenses** | License level management | products | - | LicenseDialog |
| **product-outcomes** | Outcome management | products | - | OutcomeDialog |
| **product-releases** | Release management | products | - | ReleaseDialog |

### Adoption Features

| Feature | Responsibility | Dependencies | Route | Components |
|---------|---------------|--------------|-------|------------|
| **adoption-plans** | Adoption plan views, progress tracking | customers, products, solutions | - | AdoptionTaskTable, ProductAdoptionPlanView |
| **telemetry** | Telemetry configuration, value display | tasks | - | TelemetryDialog, TelemetryPanel |

### System Features

| Feature | Responsibility | Dependencies | Route | Components |
|---------|---------------|--------------|-------|------------|
| **auth** | Login, logout, user profile | - | /login | LoginPage, AuthBar, UserProfileDialog |
| **admin** | User/role management UI | auth | - | UserManagement, RoleManagement |
| **backups** | Backup management UI | - | - | BackupManagementPanel |
| **audit** | Audit log viewer, change sets | - | - | AuditPanel, ChangeSetsPanel |

### Data Features

| Feature | Responsibility | Dependencies | Route | Components |
|---------|---------------|--------------|-------|------------|
| **data-management** | Import/export, bulk operations | products, solutions, customers | - | BulkImportDialog, DataManager |
| **import-wizard** | Step-by-step import UI | data-management | - | (in development) |
| **search** | Global search UI | - | - | SearchPanel |

### Utility Features

| Feature | Responsibility | Dependencies | Route | Components |
|---------|---------------|--------------|-------|------------|
| **ai-assistant** | AI chat interface | - | - | AIChat |
| **dev-tools** | Development panels | - | - | 12 panel components |
| **my-diary** | Personal todos and bookmarks | auth | /diary | DiaryPage, TodoTab, BookmarkTab |

---

## Shared Code

### Backend (`backend/src/shared/`)

| Directory | Contents |
|-----------|----------|
| `auth/` | `permissions.ts`, `auth-helpers.ts` - RBAC logic |
| `database/` | Prisma client, connection helpers |
| `graphql/` | Context, scalars |
| `utils/` | Pagination, audit logging, validation |
| `pubsub/` | Real-time event publishing |
| `monitoring/` | Performance tracking |

### Frontend (`frontend/src/shared/`)

| Directory | Contents |
|-----------|----------|
| `components/` | Reusable UI: FAIcon, ErrorBoundary, ColumnVisibilityToggle, inline-editors |
| `hooks/` | `useResizableColumns` |
| `services/` | Excel service, Sentry |
| `theme/` | Status styles, tab styles |
| `types/` | Shared TypeScript types |
| `validation/` | Shared validation logic |

---

## Dependency Graph

```
                    ┌──────────────────┐
                    │      auth        │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌──────────┐       ┌──────────┐       ┌──────────┐
   │ product  │◄─────►│ solution │       │ customer │
   └────┬─────┘       └────┬─────┘       └────┬─────┘
        │                  │                   │
        │                  │                   │
        ▼                  ▼                   ▼
   ┌──────────┐       ┌──────────┐       ┌──────────┐
   │   task   │       │   tag    │       │ telemetry│
   └──────────┘       └──────────┘       └──────────┘
        │
        ▼
   ┌──────────┐
   │ telemetry│
   └──────────┘

Legend:
  ──► depends on
  ◄─► bidirectional dependency
```

---

## Adding New Modules

### Backend Module

1. Create directory: `backend/src/modules/{name}/`
2. Add required files:
   - `{name}.resolver.ts`
   - `{name}.service.ts`
   - `{name}.typeDefs.ts`
   - `{name}.types.ts`
   - `index.ts`
   - `README.md` (copy from `MODULE_README_TEMPLATE.md`)
3. Register in `backend/src/schema/typeDefs.ts`
4. Update this registry

### Frontend Feature

1. Create directory: `frontend/src/features/{name}/`
2. Add required structure:
   - `components/`
   - `graphql/`
   - `hooks/`
   - `index.ts`
3. Export public API from `index.ts`
4. Update this registry

---

## Related Documentation

- [CONTEXT.md](./CONTEXT.md) - Application overview
- [ADRs](./adr/) - Architecture decisions
- [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) - Code quality ratings

