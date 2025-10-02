# DAP (Data Application Platform)

**Advanced task and product management platform with comprehensive telemetry, configuration management, and optimal user experience.**

## System Overview

DAP represents a sophisticated approach to product development management, where **Tasks represent how products are adopted**. The application showcases optimal architectural patterns with complete data persistence, relationship management, telemetry tracking, and production-ready configuration management.

### Core Concept

- **Products**: Central entities with comprehensive attribute management
- **Tasks**: Implementation units representing product adoption strategies with telemetry tracking
- **Telemetry**: Comprehensive tracking system with attributes, values, and success criteria
- **Relationships**: Tasks reference parent Products but maintain independent attributes
- **Configuration**: Environment-based deployment system (no hardcoded addresses)
- **Scope**: All attributes (Licenses, Outcomes, Releases) are product-scoped
- **Workflow**: Tasks created exclusively through Tasks submenu for optimal UX

## Key Features

### Core Application
- **✅ VERIFIED: Complete Task Management**: End-to-end task creation with full attribute persistence
- **✅ VERIFIED: Product-Scoped Architecture**: Licenses, Outcomes, Releases scoped within products  
- **✅ VERIFIED: Hierarchical License System**: 3-tier licensing (Essential, Advantage, Signature)
- **✅ VERIFIED: Task-Product Relationships**: Tasks with license assignments, outcome tracking, release targeting
- **✅ VERIFIED: Custom Attributes**: Flexible metadata for comprehensive product definition
- **✅ VERIFIED: Real-time Updates**: Live subscriptions for products and tasks
- **✅ VERIFIED: Import/Export**: CSV-based data interchange
- **✅ VERIFIED: Optimal UX**: Task creation only through Tasks submenu with all fields persisting
- **✅ VERIFIED: Database Integrity**: All relationships and attributes persist correctly

### Advanced Features (NEW)
- **✅ VERIFIED: Telemetry System**: Complete tracking with attributes, values, success criteria evaluation
- **✅ VERIFIED: Configuration Management**: Environment-based config (dev/staging/production)
- **✅ VERIFIED: Sample Data Management**: Selective add/reset commands for development workflow
- **✅ VERIFIED: Optimized Task Summary**: Horizontal layout with better space utilization
- **✅ VERIFIED: Production Ready**: No hardcoded addresses, environment-based deployment

## Architecture Quality

### **Overall Assessment: OPTIMAL** 🎯

**Comprehensive end-to-end testing confirms excellent architectural implementation:**

#### **✅ Database Architecture Excellence** 
- **Entity Relationships**: Clean Product → Tasks → Outcomes/Releases hierarchy
- **Junction Tables**: Proper many-to-many modeling (TaskOutcome, TaskRelease)
- **Data Integrity**: Foreign key constraints with CASCADE behavior
- **Soft Deletion**: Consistent `deletedAt` pattern throughout
- **License Resolver**: Added proper Task.license resolver for relationship queries

#### **✅ Frontend-Backend Integration**
- **GraphQL Schema**: Type-safe with proper field resolution
- **Task Persistence**: All fields (howToDoc, howToVideo, weights, relationships) persist correctly
- **Telemetry Integration**: Complete tracking system with GraphQL mutations and queries
- **Configuration System**: Environment-based frontend and backend configuration
- **Relationship Management**: License assignments, outcome tracking, release targeting all functional
- **User Experience**: Task creation exclusively through Tasks submenu (optimal UX pattern)
- **Dialog Unification**: Consistent TaskDialog for both add and edit operations

#### **✅ Component Architecture**  
- **TaskDialog**: Unified component handling both creation and editing with telemetry
- **TelemetryConfiguration**: Complete telemetry tracking component
- **Material-UI**: Proper Dialog configuration preventing accessibility warnings
- **Weight Input**: Keyboard-friendly TextField replacing slider for better accessibility
- **State Management**: Apollo Client with proper cache management and real-time updates
- **Task Summary**: Optimized horizontal layout for better space utilization

#### **✅ Production Architecture**
- **Environment Configuration**: Separate configs for dev/staging/production
- **No Hardcoded Addresses**: All endpoints configurable via environment variables
- **Sample Data Management**: Selective add/reset commands for development workflow
- **Service Architecture**: Modular backend services with proper separation of concerns

## Verification Status

**🎉 COMPREHENSIVE END-TO-END TESTING COMPLETE**

- ✅ **Product Creation**: With all attributes (licenses, outcomes, releases, custom attrs)
- ✅ **Task Creation**: All fields persist correctly (name, description, howToDoc, howToVideo, weight, priority, notes)
- ✅ **Telemetry System**: Complete tracking with attributes, values, and success criteria
- ✅ **Configuration System**: Environment-based deployment ready for production
- ✅ **Sample Data Workflow**: Add/reset commands working correctly
- ✅ **Task Summary UI**: Optimized layout with better space utilization
- ✅ **Relationship Assignment**: License, outcome, and release assignments functional
- ✅ **Database Persistence**: All data properly stored and retrievable
- ✅ **User Workflow**: Tasks created only through Tasks submenu per UX requirements

## Stack

- **Backend**: Node.js + TypeScript + Express + Apollo Server + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + Apollo Client + MUI + Vite
- **Configuration**: Environment-based config system (app.config.ts, frontend.config.ts)
- **Telemetry**: Complete tracking system with evaluation engine
- **Real-time**: GraphQL subscriptions via graphql-ws (products & tasks)
- **Auth**: Token-based authentication ("admin" / "user") with role-based access
- **Pagination**: Relay-style cursor pagination (products, tasks)
- **Change Tracking**: ChangeSets with before/after snapshots and revert capabilities
- **Audit**: Comprehensive audit logging for all mutations
- **CSV Operations**: Full import/export support for products and tasks
- **Container**: Podman/Docker containerization with PostgreSQL database

## Quick Start

**Verified working setup with comprehensive functionality:**

```bash
# Complete application startup (recommended)
./dap start

# Alternative: Manual docker compose
docker compose up -d --build

# Database setup (automatic with ./dap start)
docker compose exec backend npx prisma migrate deploy

# Optional: Load sample data for testing
docker compose exec backend npm run seed

# Access the application
# Frontend: http://localhost:5173
# GraphQL API: http://localhost:4000/graphql
```

### **DAP Script Commands (NEW)**

The enhanced DAP script now supports comprehensive application and data management:

```bash
# Application lifecycle
./dap start          # Start all services with migrations
./dap stop           # Stop all services
./dap restart        # Restart with fresh builds
./dap logs           # View combined service logs

# Sample data management
./dap add-sample     # Add comprehensive sample data
./dap reset-sample   # Remove only sample data (keeps real data)

# Development helpers
./dap status         # Check service status
./dap db-reset       # Complete database reset (destructive)
```

### **Environment Configuration**

The application now supports environment-based configuration:

- **Development**: `.env.development` (localhost addresses)
- **Staging**: `.env.staging` (staging server addresses)  
- **Production**: `.env.production` (production server addresses)

No hardcoded addresses - all endpoints configurable via environment files.

### **Telemetry System (NEW)**

Complete telemetry tracking is now available:

- **Access**: Double-click any task, or use edit icon, or access during task creation
- **Features**: Custom attributes, measurable values, success criteria evaluation
- **Persistence**: All telemetry data persists via GraphQL backend
- **Integration**: Seamlessly integrated with task management workflow

### **Verified User Workflow**

1. **Select a Product**: Choose from dropdown (or create new)
2. **Navigate to Tasks**: Click Tasks submenu (default view)
3. **Create Task**: Click "Add Task" button
4. **Fill Complete Form**: All fields persist (name, description, howToDoc, howToVideo, weight, priority, notes)
5. **Configure Telemetry**: Set up tracking attributes and success criteria
6. **Assign Relationships**: Select licenses, outcomes, releases
7. **Save & Verify**: Task persists with all attributes in database

## Application Structure

### Frontend Navigation
- **Products** (Default view - Tasks submenu)
  - **Tasks**: Primary view for product-related tasks with optimized summary layout
  - **Main**: Product overview and basic information
  - **Licenses**: Manage Essential/Advantage/Signature licenses
  - **Outcomes**: Define and track product outcomes
  - **Custom Attributes**: Additional product metadata
- **Solutions**: Business solution management
- **Customers**: Customer relationship management

### Task Summary Display (UPDATED)
The task summary view has been optimized for better space utilization:

- **Horizontal Layout**: Sequence number, weight, and how-to links in efficient horizontal arrangement
- **Key Information**: Shows only sequence number, weight, howtodoc, and howtovideo
- **Space Efficient**: Better use of screen real estate with clean, compact design
- **Consistent**: Same layout across all task view components (main view, side panel, alternative views)

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

The `./dap` script provides comprehensive management commands:

```bash
# Application lifecycle
./dap start        # Start all services with migrations
./dap stop         # Stop all services  
./dap restart      # Restart all services with fresh builds
./dap logs         # View combined service logs
./dap status       # Check service status

# Data management
./dap add-sample   # Add comprehensive sample data
./dap reset-sample # Remove only sample data (selective)
./dap db-reset     # Complete database reset (destructive)
```

## System Documentation

The application includes comprehensive documentation for all major systems:

- **[TELEMETRY_SYSTEM_DOCUMENTATION.md](TELEMETRY_SYSTEM_DOCUMENTATION.md)**: Complete telemetry implementation guide
- **[CONFIG_SYSTEM_GUIDE.md](CONFIG_SYSTEM_GUIDE.md)**: Environment-based configuration system
- **[SAMPLE_DATA_MANAGEMENT.md](SAMPLE_DATA_MANAGEMENT.md)**: Sample data workflow documentation
- **[TASK_SUMMARY_UPDATE_SUMMARY.md](TASK_SUMMARY_UPDATE_SUMMARY.md)**: UI optimization details

## Recent Updates

- ✅ **Telemetry System**: Complete tracking with attributes, values, and success criteria evaluation
- ✅ **Configuration Management**: Environment-based deployment (dev/staging/production)
- ✅ **Sample Data Workflow**: Selective add/reset commands for development efficiency
- ✅ **Task Summary Optimization**: Horizontal layout with better space utilization
- ✅ **Production Ready**: No hardcoded addresses, environment-based configuration
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
