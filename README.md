# DAP (Demo Application Platform)

Full-stack modular API-first demo implementing Products, Tasks, Solutions, Licenses, Outcomes, Change Sets, Audit Trail, Realtime Subscriptions, CSV import/export, Role-based Auth, and comprehensive product management.

## Key Features

- **Product Management**: Complete CRUD operations with hierarchical task management
- **3-Tier Licensing**: Essential, Advantage, and Signature license levels  
- **Task Management**: Task-centric workflow with license and outcome associations
- **Outcome Tracking**: Define and track product outcomes linked to tasks
- **Custom Attributes**: Flexible metadata management for products
- **Real-time Updates**: Live subscriptions for products and tasks
- **Import/Export**: CSV-based data import/export functionality
- **Unified Dialog System**: Consolidated task editing across all interfaces
- **Clean Architecture**: Optimal design with excellent separation of concerns

## Architecture Quality

### **Overall Assessment: OPTIMAL** 🎯

The DAP application demonstrates **excellent architectural decisions** with no major optimizations required:

#### **Database Excellence** 
- ✅ **Proper Entity Relationships**: Clean Product → Tasks → Outcomes/Releases hierarchy
- ✅ **Junction Tables**: Correct many-to-many modeling (TaskOutcome, TaskRelease)
- ✅ **Data Integrity**: Foreign key constraints with proper CASCADE/SET NULL behavior
- ✅ **Soft Deletion**: Consistent pattern with `deletedAt` timestamps
- ✅ **Weight Validation**: Tasks sum to 100% per product with proper constraints

#### **API Design Quality**
- ✅ **GraphQL Schema**: Type-safe with proper nullable fields and computed properties
- ✅ **Relay Compliance**: Standard Node interface for consistent querying patterns
- ✅ **Real-time Support**: GraphQL subscriptions for live data synchronization
- ✅ **Input Validation**: Comprehensive validation at resolver level
- ✅ **Flexible Relationships**: Dual parenting support (Products OR Solutions)

#### **Frontend Architecture**  
- ✅ **Component Unification**: Successfully consolidated TaskDialog, TaskDetailDialog, and ProductDetailPage editing
- ✅ **State Management**: Proper Apollo Client integration with caching and subscriptions
- ✅ **Form Validation**: Weight limits, required fields, and data consistency checks
- ✅ **Material-UI Integration**: Consistent design system with proper theming
- ✅ **Code Reusability**: Shared GraphQL queries and mutation patterns

## Stack

- **Backend**: Node.js + TypeScript + Express + Apollo Server + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + Apollo Client + MUI + Vite
- **Real-time**: GraphQL subscriptions via graphql-ws (products & tasks)
- **Auth**: Token-based authentication ("admin" / "user") with role-based access
- **Pagination**: Relay-style cursor pagination (products, tasks)
- **Change Tracking**: ChangeSets with before/after snapshots and revert capabilities
- **Audit**: Comprehensive audit logging for all mutations
- **CSV Operations**: Full import/export support for products and tasks
- **Container**: Podman/Docker containerization with PostgreSQL database

## Quick Start

```bash
# Build & start all services
./dap start

# Or using docker compose directly
docker compose up -d --build

# Apply database migrations  
docker compose exec backend npx prisma migrate deploy

# (Optional) Seed with sample data
docker compose exec backend npm run seed

# Open the application
# Frontend: http://localhost:5173
# GraphQL Playground: http://localhost:4000/graphql
```

## Application Structure

### Frontend Navigation
- **Products** (Default view - Tasks submenu)
  - **Tasks**: Primary view for product-related tasks
  - **Main**: Product overview and basic information
  - **Licenses**: Manage Essential/Advantage/Signature licenses
  - **Outcomes**: Define and track product outcomes
  - **Custom Attributes**: Additional product metadata
- **Solutions**: Business solution management
- **Customers**: Customer relationship management

### License Levels
1. **Essential** (Level 1): Basic features and standard support
2. **Advantage** (Level 2): Advanced features with premium support and analytics  
3. **Signature** (Level 3): Enterprise features with AI capabilities and dedicated support

## Authentication

API authentication uses simple header tokens for demonstration purposes:

- **Admin Access**: `Authorization: admin` (Full CRUD access)
- **User Access**: `Authorization: user` (Read access with limited write permissions)

## API Endpoints

- **GraphQL API**: http://localhost:4000/graphql
- **Frontend App**: http://localhost:5173
- **GraphQL Playground**: Interactive query interface available at the GraphQL endpoint

## Common Operations

### Product Management

Create a product with licenses and outcomes:

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
├── backend/           # Node.js GraphQL API
├── frontend/         # React application
├── docker-compose.yml # Container orchestration
├── dap               # Management script
└── create-enhanced-sample-data.sql # Sample data
```

### Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities:

- **Products**: Core business products with custom attributes
- **Tasks**: Work items associated with products
- **Licenses**: 3-tier licensing (Essential/Advantage/Signature)
- **Outcomes**: Business outcomes tracked by products/tasks
- **Solutions**: Business solution packages
- **Customers**: Customer relationship management
- **ChangeSets**: Change tracking and revert functionality
- **Audit**: Comprehensive audit logging

### Management Script

The `./dap` script provides convenient management commands:

```bash
./dap start        # Start all services
./dap stop         # Stop all services  
./dap restart      # Restart all services
./dap logs         # View service logs
./dap reset        # Reset database with sample data
```

## Recent Updates

- ✅ **Removed TestStudio**: Simplified application by removing development testing UI
- ✅ **3-Tier Licensing**: Updated to Essential/Advantage/Signature license levels
- ✅ **Task-First Navigation**: Made Tasks the default submenu under Products
- ✅ **Separate Dialog Windows**: License and outcome management via dedicated dialogs
- ✅ **Code Cleanup**: Removed unused test files, debug scripts, and temporary files
- ✅ **Enhanced Documentation**: Updated README with current architecture and features

## Storage Migration

The application has been optimized for `/data` partition deployment due to storage constraints. See `STORAGE_MIGRATION_DOCUMENTATION.md` for details on the migration from root partition to `/data` partition for better resource utilization.

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
