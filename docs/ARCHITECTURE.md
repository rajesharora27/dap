# DAP Architecture Overview

## 1. System Slice

| Tier | Responsibilities | Key Tech | Source | Runtime |
|------|------------------|----------|--------|---------|
| **Client (Presentation)** | Render product & task workspace, orchestrate Excel import/export UI, manage telemetry dialogs, invoke GraphQL mutations/queries, enforce UX rules (tasks-first navigation) | React 19, TypeScript, Vite, Material UI, Apollo Client, DnD Kit | `frontend/src` | `frontend` container (Vite dev server locally; static assets via `vite build`) |
| **API (Application)** | GraphQL schema & resolvers, Excel workbook generation/parsing, telemetry evaluation, command orchestration for sample data, authentication boundary | Node.js 20, Apollo Server 5, Express 5, Prisma ORM, ExcelJS, GraphQL-WS | `backend/src` (resolvers, services, telemetry) | `backend` container (Node runtime) |
| **Data (Persistence)** | Relational data storage, migrations, sample data scripts, transactional integrity | PostgreSQL 16, Prisma migrations | `backend/prisma` + SQL scripts | `db` container |

Supporting assets:
- **Automation**: `./dap` orchestrates all tiers, database seeding, E2E validation.
- **Containerization**: `docker-compose.yml` provisions db, backend, and frontend services with health checks.
- **Configuration**: `.env.*`, `config/app.config.ts`, and `frontend/src/config/frontend.config.ts` supply environment-specific settings.

## 2. Module Map

### Frontend (`frontend/src`)
The frontend is organized into **Features** and **Shared** assets.

- `features/`: Isolated feature modules.
  - `adoption-plans/`: Customer task tables and progress groups.
  - `data-management/`: Bulk import dialogs and progress hooks.
  - `auth/`: Login, authentication context, and RBAC components.
- `shared/`: Reusable project assets.
  - `components/`: UI components (e.g., `FAIcon`, `custom-attributes`).
  - `theme/`: Standardized colors and styles (`statusStyles`, `tabStyles`).
  - `validation/`: Shared frontend validation utilities.
- `pages/`: High-level page containers (e.g., `ProductsPage.tsx`, `SolutionsPage.tsx`).

### Backend (`backend/src`)
The backend follows a **Domain-Based** modular structure.

- `modules/`: Self-contained domain logic.
  - `product/`: Product services, resolvers, and domain-specific validation.
  - `solution/`: Solution-level logic and bundling.
  - `customer/`: Customer-specific assignments and metrics.
  - `task/`: Core task management.
  - `auth/`: Authentication middleware and security logic.
  - `dev-tools/`: Specialized development and maintenance services.
  - `import/`: Data ingestion and synchronization services.
- `schema/`: Holistic GraphQL schema definitions.
- `shared/`: Project-wide utilities (Prisma client, GraphQL context, logging).

## 3. Core Flows

### 3.1 Product & Task Browsing
```
User selects product → App.tsx loads PRODUCT query → Apollo cache populates →
Task list requests TASKS_FOR_PRODUCT → DnD Kit renders re-orderable task list →
Task detail dialog fetches telemetry + relationships lazily when opened.
```

### 3.2 Task Lifecycle
1. **Create/Edit**: TaskDialog collects fields, telemetry, and relationships.
2. **Validation**: Frontend enforces remaining weight, required name/estimates.
3. **Submission**: Apollo mutation invokes `createTask` / `updateTask` resolvers.
4. **Resolver**: Backend normalizes license/priority, links to product/outcomes/releases, triggers telemetry persistence.
5. **Result**: Apollo cache updates via returned Task node; subscriptions broadcast to other clients.

### 3.3 Excel Export
1. User taps *Export Product Workbook* (UI button in Products view).
2. Frontend calls GraphQL mutation `exportProductExcel(productId)`.
3. `ExcelExportService` builds workbook:
   - Tab order: Instructions → Product → Tasks → Licenses → Releases → Outcomes → CustomAttributes → Telemetry.
   - Tasks tab includes normalized license level & relationships.
4. Response streams a base64 workbook; frontend triggers download.

### 3.4 Excel Import
1. User selects workbook via import dialog (frontend).
2. `App.tsx` parses worksheets with ExcelJS, mapping headers dynamically and normalizing license/priority via shared helpers.
3. Tasks, licenses, releases, and outcomes are batched into upsert operations:
   - License/outcome/release names are matched case-insensitively; new items created as needed.
   - Task rows resolve license level precedence: sheet value → linked license metadata → existing DB value → default *Essential*.
4. Backend mutations persist changes; warnings surface in console for unknown references.
5. Post-import, UI refetches product + task queries for confirmation.

### 3.6 AI Agent & Natural Language Queries
1. **Query Orchestration**: `AIAgentService` receives natural language questions.
2. **Hybrid Processing**:
   - **Fast Path**: `QueryTemplates` uses regex patterns to match common queries (e.g., "show products") and executes direct Prisma queries.
   - **LLM Fallback**: Unmatched queries are sent to an LLM (Gemini/OpenAI) with injected `SchemaContext` and real-time `DataContext`.
3. **Safe Execution**: Generated queries are validated and executed with the `aiuser` role's permissions (read-only, row-limited).
4. **Context Management**: `DataContextManager` maintains a summarized snapshot of the database for LLM efficiency, refreshable via Admin UI.

## 4. Data Model Snapshot

```
Product (id, name, description, customAttrs)
 ├─ Licenses (Essential/Advantage/Signature) [level enum]
 ├─ Releases (name, level, isActive)
 ├─ Outcomes (name, description)
 └─ Tasks
      ├─ licenseId (optional, points to product license)
      ├─ licenseLevel (enum, persisted even without direct license)
      ├─ outcomeIds (many-to-many via TaskOutcome)
      ├─ releaseIds (many-to-many via TaskRelease)
      ├─ telemetryAttributes (embedded config table)
      └─ telemetry values (currentValue table)
```

Other notable relations:
- `Customer` ↔ `Product` via `CustomerProduct` (many-to-many).
- `Solution` ↔ `Product` via `SolutionProduct` (many-to-many).
- Soft deletion via `deletedAt` on major entities.

## 5. GraphQL Surface

Key operations:
- Queries: `products`, `tasks`, `solutions`, `customers`, `outcomes` (Relay connections where applicable).
- Mutations: CRUD for products, tasks, licenses, releases, outcomes; telemetry attribute create/update/delete; Excel export/import; deletion queue.
- Subscriptions: product/task live updates (via `graphql-ws`).

Schema conventions:
- Relay-style pagination (`edges`, `pageInfo`).
- Node interface IDs for global object identification.
- Input types (`TaskInput`, `TaskUpdateInput`) ensure license level normalization and telemetry embedding.

## 6. Operational Concerns

- **Logging**: Backend writes to `backend.log`; frontend dev server writes to `frontend.log` (rotated per `./dap`).
- **Health Checks**: Postgres `pg_isready` ensures DB availability before backend starts.
- **Builds**: `npm run build` (backend TypeScript), `npm run build` (frontend Vite) executed in CI/CD or locally.
- **Sample Data**: SQL scripts `create-enhanced-sample-data.sql` & `remove-sample-data.sql` seeded through DAP commands.
- **Security Hooks**: Simple header auth now, but resolvers isolate business logic so JWT/role expansion can slot in later.

## 7. Extensibility Notes

- **Excel**: Services expose cohesive entry points (`ExcelExportService`, `ExcelImportService`). Extend by adding new worksheet builders/parsers and updating header alias maps.
- **Telemetry**: Evaluation engine designed for additional data types & criteria; plug-in architecture via strategy objects.
- **UI**: Component-driven architecture; sub-navigation lives in `App.tsx` making it straightforward to add new tabs (e.g., Analytics).
- **Deployment**: Docker Compose baseline; architecture supports lifting into Kubernetes with minimal change (config-driven ports/URLs).

---

The architecture favors explicit modules with clear seams so future teams can extend Excel automation, telemetry analytics, or deployment targets without untangling legacy scripts.
