# DAP (Data Application Platform)

**Production-ready task and product management platform with multi-sheet Excel import/export, customer adoption planning, telemetry, and comprehensive tooling.**

## Overview

DAP helps product organizations structure work around products, licenses, outcomes, releases, and telemetry-rich tasks. The platform includes a React/Vite frontend, GraphQL/Prisma backend, and PostgreSQL database orchestrated through a single `./dap` management script.

### Feature Highlights

- **Customer Adoption Planning**: Create customized implementation roadmaps with auto-sync, HowTo documentation links, and smart task filtering
- **Product & Task Management**: Tasks with sequence management, weight, license level, documentation links, telemetry attributes, and relationships to outcomes & releases
- **Multi-Sheet Excel Workflow**: Eight-tab workbook export/import for products, tasks, licenses, releases, outcomes, custom attributes, telemetry, and instructions (ExcelJS-powered on the backend)
- **Telemetry Insight**: Task-level telemetry configuration with success criteria tracking, evaluation engine, and dashboards
- **Configuration & Deployment**: Environment-specific configs (dev/staging/prod) with no hardcoded URLs plus Docker Compose support
- **Sample Data Automation**: Enhanced 5-product dataset that can be added, removed, or fully reset via the DAP script
- **Real-Time UX**: Apollo Client with intelligent cache management keeps views synchronized without manual refreshes

For a deep dive into all features, see [FEATURES.md](FEATURES.md). For system tiers, module boundaries, and data flow, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Technology Stack

- **Frontend**: React 19 + TypeScript, Vite, Material UI, Apollo Client, DnD Kit
- **Backend**: Node.js, Apollo Server, Express 5, Prisma ORM, GraphQL WS
- **Database**: PostgreSQL with Prisma migrations
- **Automation**: Docker Compose, `./dap` lifecycle script, SQL sample-data scripts, ExcelJS import/export services
- **Testing & Tooling**: Jest, Testing Library, TypeScript project references

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Docker / Docker Compose (or Podman with Docker compatibility)

### Launch with `./dap`

```bash
cd /data/dap

# Daily development
./dap start

# Fresh database seeded with the curated sample dataset
./dap clean-restart

# Add or remove sample data without touching user-created records
./dap add-sample
./dap reset-sample

# Check service status or stop everything
./dap status
./dap stop

# Comprehensive workflow test harness
./dap test
```

The script provisions the database container, compiles backend/ frontend if needed, and streams logs to `backend.log` / `frontend.log` during execution. Use `./dap help` for the full command reference.

### Manual Docker Compose Alternative

```bash
docker compose up -d

# Apply migrations & seed manually if needed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

Access the app at http://localhost:5173 with the GraphQL API available at http://localhost:4000/graphql.

## Excel Import & Export

- Exports generate a single workbook per product with eight worksheets: Instructions, Product, Tasks, Licenses, Releases, Outcomes, CustomAttributes, Telemetry.
- Imports tolerate header variations, normalize license levels & priorities, and map license/outcome/release names back to IDs.
- Task imports resolve license levels using sheet data, linked license metadata, or existing records before defaulting to **Essential**.
- Telemetry rows are optional but preserved; custom attributes sync via JSON.
- Instructions tab documents naming conventions and required relationships.

## Telemetry

- Configure telemetry attributes per task directly inside the Task dialog (creation or edit).
- Attributes support data types, success criteria, requirement flags, ordering, and active state.
- Backend evaluation engine drives completion metrics displayed in the UI.
- See [TELEMETRY_SYSTEM_DOCUMENTATION.md](TELEMETRY_SYSTEM_DOCUMENTATION.md) for evaluator details and JSON schemas.

## Sample Data Workflow

`./dap clean-restart` or `./dap add-sample` loads a five-product dataset spanning E‑Commerce, FinTech, Healthcare, Logistics, and EdTech. Each product includes:

- Essential/Advantage/Signature licenses
- Core and supplemental outcomes & releases
- Four fully populated tasks (documentation links, telemetry mapping, relationships)

`./dap reset-sample` removes only sample data while leaving user-generated content intact. See [SAMPLE_DATA_MANAGEMENT.md](SAMPLE_DATA_MANAGEMENT.md) for command matrix and entity identifiers.

## Authentication & API Access

- GraphQL endpoint: `http://localhost:4000/graphql`
- Frontend: `http://localhost:5173`
- Headers:
  - `Authorization: admin` (full access)
  - `Authorization: user` (read + limited write)

Common GraphQL samples live in [QUICK_START.md](QUICK_START.md).

## Development Scripts

- Backend: `cd backend && npm run dev` (ts-node-dev), `npm run build`, `npm test`
- Frontend: `cd frontend && npm run dev`, `npm run build`, `npm test`
- Prisma: `cd backend && npx prisma migrate dev`, `npx prisma studio`

## Documentation Index

Production-ready documentation lives at the repository root:

### Core Documentation
- **[README.md](README.md)** – You are here! Project overview and getting started
- **[FEATURES.md](FEATURES.md)** – Comprehensive feature documentation and usage guide
- **[CHANGELOG.md](CHANGELOG.md)** – Release history with detailed change notes
- **[RELEASE_NOTES.md](RELEASE_NOTES.md)** – Current release highlights

### Setup & Deployment
- **[QUICK_START.md](QUICK_START.md)** – Fast local setup and GraphQL examples
- **[DAP-MANAGEMENT.md](DAP-MANAGEMENT.md)** – Usage of the consolidated `./dap` management script
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** – Containerized deployment steps & environment promotion
- **[CONFIG_SYSTEM_GUIDE.md](CONFIG_SYSTEM_GUIDE.md)** – Environment configuration reference

### Public URL / Production Deployment
- **[SINGLE_PORT_DEPLOYMENT.md](SINGLE_PORT_DEPLOYMENT.md)** – ✅ **Recommended:** Single port (443) nginx setup
- **[SINGLE_PORT_ARCHITECTURE.md](SINGLE_PORT_ARCHITECTURE.md)** – Visual guide and architecture diagrams
- **[QUICK_PUBLIC_URL.md](QUICK_PUBLIC_URL.md)** – Simple 5-step public URL setup
- **[PUBLIC_URL_SETUP.md](PUBLIC_URL_SETUP.md)** – Comprehensive public deployment guide
- **[setup-nginx.sh](setup-nginx.sh)** – Automated nginx setup script

### Technical References
- **[ARCHITECTURE.md](ARCHITECTURE.md)** – Layered architecture, request flows, component responsibilities
- **[TECHNICAL-DOCUMENTATION.md](TECHNICAL-DOCUMENTATION.md)** – Extended system analysis and deep-dive notes
- **[SAMPLE_DATA_MANAGEMENT.md](SAMPLE_DATA_MANAGEMENT.md)** – Details on seeding and cleaning sample data

### Archive
Historical documentation and incremental fix notes are available in the `archive/` directory.

---

Built with ❤️ to demonstrate a production-ready product & task management platform that scales across enterprise scenarios.

```graphql
mutation {
  createProduct(input: {
    name: "E-Commerce Platform"
    description: "Modern online shopping solution"
    customAttrs: {
      priority: "high"
      technology: "React"
    }
  }) {
    id
    name
    description
  }
}
```

Query products with pagination:

```graphql
query {
  products(first: 10) {
    edges {
      cursor
      node {
        id
        name
        description
        licenses {
          id
          name
          level
          isActive
        }
        outcomes {
          id
          name
          description
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Task Management

Create a task with license and outcome associations:

```graphql
mutation {
  createTask(input: {
    name: "User Authentication"
    description: "Implement secure user authentication system"
    estMinutes: 480
    weight: 15
    priority: "High"
    productId: "product-id"
    licenseId: "license-id"
    outcomeIds: ["outcome-id-1", "outcome-id-2"]
  }) {
    id
    name
    description
    estMinutes
    weight
    priority
    license {
      name
      level
    }
    outcomes {
      id
      name
    }
  }
}
```

Query tasks for a product:

```graphql
query {
  tasks(productId: "product-id", first: 20) {
    edges {
      node {
        id
        name
        description
        estMinutes
        weight
        priority
        sequenceNumber
        license {
          id
          name
          level
        }
        outcomes {
          id
          name
          description
        }
      }
    }
  }
}
```

### License Management

```graphql
mutation {
  createLicense(input: {
    name: "E-Commerce Advantage"
    description: "Advanced features with premium support"
    level: 2
    isActive: true
    productId: "product-id"
  }) {
    id
    name
    level
    isActive
  }
}
```

### CSV Import/Export

Export products to CSV:

```graphql
mutation {
  exportProductsCsv
}
```

Import products from CSV:

```graphql
mutation {
  importProductsCsv(csv: "name,description\nTest Product,Test Description")
}
```

## Development

### Project Structure

```
/data/dap/
├── backend/             # Node.js GraphQL API (TypeScript)
├── frontend/            # React + Vite application
├── config/              # Shared runtime configuration
├── docker-compose.yml   # Container orchestration entrypoint
├── dap                  # Unified management script
└── create-enhanced-sample-data.sql # Sample data seeding script
```

> ℹ️ Legacy one-off scripts, ad-hoc test runners, and exported spreadsheets were removed in the October 2025 cleanup to keep the repository lean. All common workflows are now documented below or automated through `./dap`.

### Database Schema


This production-ready application demonstrates modern full-stack development patterns with clean architecture, comprehensive testing, and professional UI/UX design.
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
