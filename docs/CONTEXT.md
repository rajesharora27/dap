# DAP Application - Complete Context Document

**Version:** 3.0.0
**Last Updated:** December 27, 2025 (Desktop-first UI redesign)
**Purpose:** Comprehensive context for AI assistants and developers

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Component Naming Convention](#component-naming-convention)
3. [System Architecture](#system-architecture)
4. [Core Domain Model](#core-domain-model)
5. [Key Features](#key-features)
6. [Technology Stack](#technology-stack)
7. [Authentication & Authorization (RBAC)](#authentication--authorization-rbac)
8. [Deployment & Release Process](#deployment--release-process)
9. [Database Schema](#database-schema)
10. [Development Workflow](#development-workflow)
11. [Production Environment](#production-environment)
12. [Recent Changes & Fixes](#recent-changes--fixes)
13. [Known Issues & Limitations](#known-issues--limitations)

---

## Application Overview

**DAP (Digital Adoption Platform)** is a comprehensive customer adoption tracking system designed to help organizations manage and monitor the implementation and adoption of their products and solutions across customer deployments.

### Purpose
- Track customer implementation progress across products and solutions
- Monitor task completion through manual updates and automated telemetry
- Manage adoption plans with customizable license levels, outcomes, and releases
- Provide real-time visibility into customer adoption metrics

### Core Value Proposition
**DAP enables organizations to:**
1. Create structured implementation roadmaps (adoption plans)
2. Track progress automatically via telemetry or manually
3. Manage complex product/solution hierarchies
4. Monitor adoption across multiple customer deployments
5. Generate insights from adoption data

### One-Paragraph Summary
DAP is a customer adoption tracking system where an **Executive Dashboard** provides high-level strategy and product readiness visibility; **Products** are defined with custom attributes, license levels (Essential, Advantage, Signature), outcomes (business goals), and releases; products are bundled into **Solutions**; and **Customers** are assigned adoption plans. The system emphasizes a product-first approach, where structured implementation plans are defined centrally and then instantiated for customers, tracking progress via manual updates or automated telemetry.

---

## Component Naming Convention

> **Full Documentation:** See `docs/NAMING_CONVENTION.md` for complete details.

### Quick Reference

| Term | Definition | When Created |
|------|-----------|--------------|
| **Product** | A standalone product with tasks, licenses, outcomes | Defined by SME |
| **Solution** | A bundle of Products | Defined by SME |
| **Task** | Implementation step (template) | Defined in Product/Solution |
| **Customer** | Organization adopting products | Created by CSS |
| **AdoptionPlan** | Customer's copy of Product tasks | When Product assigned to Customer |
| **SolutionAdoptionPlan** | Customer's copy of Solution tasks | When Solution assigned to Customer |
| **CustomerTask** | Customer-specific task instance | Part of AdoptionPlan |
| **CustomerSolutionTask** | Customer-specific task in solution | Part of SolutionAdoptionPlan |

### Prompt Usage Tips

| ❌ Ambiguous | ✅ Clear |
|-------------|---------|
| "the task" | "Product task" or "CustomerTask" |
| "adoption plan" | "AdoptionPlan" or "SolutionAdoptionPlan" |
| "the tags" | "ProductTag", "TaskTag", or "CustomerTaskTag" |
| "solution task" | "Task in Solution" (template) vs "CustomerSolutionTask" (copy) |

---

## System Architecture

### Modular Architecture Policy

> [!IMPORTANT]
> **Strict Modular Adherence:** All future development in DAP MUST adhere to the established modular architecture. Monolithic or shared-utility-only folders (like `api/`, `middleware/`, or `validation/` at the source root) are deprecated.

#### Backend (Domain-Based)
The backend is organized into domain-specific modules under `backend/src/modules/`. Each module is self-contained and should export its interface via a barrel file (`index.ts`).

**Key Modules:**
- `product`: Product management, modeling, and attributes.
- `solution`: Product bundling and solution-level tasks.
- `customer`: Customer management and assignment logic.
- `task`: Core task definitions and lifecycle.
- `auth`: Authentication middleware and helpers.
- `dev-tools`: Admin-only development utilities and diagnostics.
- `import`: Excel/CSV processing and data synchronization.

#### Frontend (Feature-Based)
The frontend follows a feature-based organization under `frontend/src/features/`. Shared UI elements and utilities are strictly categorized under `frontend/src/shared/`.

**Key Feature Folders:**
- `adoption-plans`: Progress tracking and customer-facing implementation views.
- `data-management`: Bulk import/export and telemetry synchronization.
- `products` / `solutions`: Modeling and definition interfaces.
- `auth`: Login, RBAC, and session management.

**Shared Directory Structure:**
- `shared/components`: Reusable UI components (e.g., `FAIcon`, `custom-attributes`).
- `shared/theme`: Project-wide styling (e.g., `statusStyles`, `tabStyles`).
- `shared/validation`: Shared validation logic for both frontend and backend parity.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Users (Web Browsers)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Web Server (Apache/Nginx)                       │
│  - HTTP/HTTPS termination                                    │
│  - Reverse proxy to backend                                  │
│  - Static file serving                                       │
│  - /dap/ subpath routing                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴───────────────┐
        │                                │
        ↓                                ↓
┌──────────────────┐          ┌──────────────────┐
│   Frontend (SPA) │          │  Backend (API)   │
│   React 19       │          │  Node.js         │
│   TypeScript     │          │  GraphQL         │
│   Apollo Client  │          │  Apollo Server   │
│   Material-UI    │          │  Express 5       │
│   Port: 3000*    │          │  Port: 4000      │
│   (*or static)   │          │  (localhost)     │
└──────────────────┘          └────────┬─────────┘
                                       │
                                       ↓
                              ┌──────────────────┐
                              │   PostgreSQL 16  │
                              │   Port: 5432     │
                              │   (localhost)    │
                              └──────────────────┘
```

### Technology Stack

#### Frontend
- **Framework:** React 19 with TypeScript
- **Architecture:** Feature-Based Modular Architecture (Strict)
  - Features are isolated in `src/features/[feature-name]`
  - Shared assets in `src/shared/` (theme, components, validation, types)
- **Build Tool:** Vite 7
- **UI Library:** Material-UI (MUI) v6
- **GraphQL Client:** Apollo Client

#### Backend
- **Runtime:** Node.js 20+
- **Architecture:** Domain-Based Modular Architecture (Strict)
  - Modules encapsulated in `src/modules/[domain-name]`
  - Each module contains its own resolvers, services, and validation
- **Framework:** Express 5
- **GraphQL:** Apollo Server v4
- **ORM:** Prisma 6.14.0
- **Database:** PostgreSQL 16
- **Authentication:** JWT with bcrypt
- **File Processing:** ExcelJS, csv-parse
- **Process Management:** PM2 (production)

#### Infrastructure
- **Development Server:** centos1.rajarora.csslab (Node.js 20.12.1)
- **Staging Server:** centos2.rajarora.csslab (CentOS 8, Apache httpd)
- **Production Server:** dapoc (RHEL 9, Nginx with SSL)
- **Deployment:** SSH-based deployment scripts
- **Database Backups:** Automated daily backups
- **Monitoring:** PM2 monitoring, application logs

---

## Core Domain Model

### Entity Relationships

```
Product ──────────────────┐
  │                       │
  ├─ Tasks               ├─ Solutions (many-to-many)
  ├─ Licenses            │   │
  ├─ Outcomes            │   ├─ Tasks
  ├─ Releases            │   ├─ Licenses
  ├─ Custom Attributes   │   ├─ Outcomes
  │                      │   └─ Releases
  │                      │
  └─ Customer Products ──┴─ Customer Solutions
       │                       │
       └─ Adoption Plan ───────┴─ Solution Adoption Plan
            │                       │
            ├─ Customer Tasks ──────┼─ Customer Solution Tasks
            │    │                  │    │
            │    └─ Telemetry ──────┴────┴─ Telemetry Attributes
            │         Attributes              │
            │              │                  └─ Success Criteria
            │              └─ Telemetry Values    (AND/OR logic)
            │
            └─ Progress Tracking
                 (weighted completion)
```

### Key Entities

#### 1. **Product**
- Name, description
- Custom attributes (flexible key-value pairs)
- License levels (Essential, Advantage, Signature)
- Outcomes (business goals)
- Releases (version levels)
- Tasks (implementation steps)

#### 2. **Solution**
- Bundle of products
- Solution-level tasks
- Unified adoption tracking
- Aggregates product progress

#### 3. **Task**
- Implementation step
- Weight (percentage, decimals allowed)
- Estimated minutes
- Sequence number
- License level requirement
- How-to docs and videos
- Outcomes and releases associations
- Telemetry attributes

#### 4. **Customer**
- Can have multiple products
- Can have multiple solutions
- Each assignment creates adoption plan(s)

#### 5. **Adoption Plan**
- Snapshot of tasks at creation time
- Filtered by license/outcomes/releases
- Tracks progress (weighted)
- Contains customer-specific task copies
- Can be synced with source product/solution

#### 6. **Telemetry Attribute**
- Attached to tasks
- Data type: BOOLEAN, NUMBER, STRING, TIMESTAMP, JSON
- Success criteria (supports AND/OR logic)
- Can auto-update task status when criteria met
- Values tracked over time

### Status Model

#### Task Statuses (Customer Tasks)
- `NOT_STARTED` - Not yet begun
- `IN_PROGRESS` - Work in progress
- `DONE` / `COMPLETED` - Finished successfully
- `NOT_APPLICABLE` - Does not apply to this customer
- `NO_LONGER_USING` - Was implemented but telemetry shows discontinued

#### Status Update Sources
- `MANUAL` - Updated via GUI by user (takes precedence)
- `TELEMETRY` - Automatically updated via telemetry evaluation
- `IMPORT` - Updated via CSV/Excel import
- `SYSTEM` - Updated by system (e.g., adoption plan creation)

---

## Key Features

### 1. Product & Solution Management
- Create/edit/delete products and solutions
- Organize products into solution bundles
- Manage hierarchical license levels
- Define outcomes and releases
- Custom attributes (flexible schema)
- Task management with weights

### 2. Customer Adoption Tracking
- Assign products/solutions to customers
- Generate adoption plans
- Filter tasks by license/outcomes/releases
- Track progress (weighted completion)
- Manual and automatic status updates
- Sync plans with product updates

### 3. Telemetry Integration
- Define telemetry attributes on tasks
- Configure success criteria (AND/OR logic)
- Automatic task status updates
- Manual telemetry value entry
- Excel import/export for bulk updates
- Historical value tracking

### 4. Authentication & Authorization (RBAC)
- JWT-based authentication
- Role-based access control (RBAC)
- Per-resource permissions
- User management
- Session management with auto-expiry
- Password change enforcement

### 5. Backup & Restore
- Manual database backup/restore
- Automated daily backups (1:00 AM)
- Change detection (only backup if changed)
- Configurable retention periods
- Backup metadata tracking
- UI-based backup management
- **Passwords excluded from backups** (for security)
- **Existing passwords preserved on restore**

### 6. Excel Import/Export
- Multi-sheet workbooks
- Products, tasks, licenses, outcomes, releases
- Telemetry attributes and values
- Bulk data management
- Template generation

### 7. AI Agent (Natural Language Queries)

**Feature**: Ask questions about your data in natural language.

- **Requires aiuser**: A dedicated `aiuser` account must exist for AI Agent to function
- **Query Templates**: 20+ pre-built patterns for common queries (fast path)
- **LLM Fallback**: Complex queries processed by AI (Gemini/OpenAI/Anthropic)
- **Data Context**: Real-time database context injected into LLM prompts
- **Safe Execution**: Read-only queries with row limits and timeouts
- **Admin Refresh**: Manual data context refresh via UI button
- **RBAC Integration**: All queries execute with aiuser's permissions

**Example Queries:**
- "List all tasks for Cisco Secure Access without telemetry"
- "Show customers with low adoption"
- "Products without telemetry configured"
- "Adoption plans for customer Acme"
- "Tasks with high weight"

**Architecture:**
```
User Query → QueryTemplates (regex match) → Direct Prisma Query (fast)
         ↘ No Match → LLM + SchemaContext + DataContext → Generated Query
```

**Files:**
- `backend/src/services/ai/AIAgentService.ts` - Main orchestration
- `backend/src/services/ai/QueryTemplates.ts` - Fast-path templates
- `backend/src/services/ai/SchemaContextManager.ts` - Schema context
- `backend/src/services/ai/DataContextManager.ts` - Dynamic data context
- `frontend/src/features/ai-assistant/components/AIChat.tsx` - Chat UI

### 8. Task Tagging System
The tagging system allows categorizing tasks within products and solutions to help CSS and customers filter and prioritize adoption activities.
- **Hierarchical Scoping**: Tags are defined at the Product or Solution level.
- **Automatic Syncing**: Tags and their assignments are synchronized to customer adoption plans during create/sync operations.
- **Multi-tag Filtering**: Users can filter task lists by one or more tags using OR logic.
- **Theme Integration**: Tags use standardized colors from the MUI theme palette.
- **Future-Proof Sync**: A generic field-copying mechanism ensures that any new task fields added in the future are automatically synchronized.

### 10. Scoped Task Locking
The task locking system protects master task metadata in Product and Solution modeling views while maintaining flexibility for customer adoption plans.
- **Product/Solution Scoping**: Locking is exclusively applied to the source modeling views to prevent accidental changes to shared task definitions (names, weights, descriptions).
- **Flexible Customer Plans**: Adoption plans in the Customer view are always unlocked, allowing CSS and customers to update statuses and sync data freely.
- **Visual Indicators**: Clear Lock/LockOpen icons in the modeling toolbar communicate the current protection state.

### 9. Advanced Features
- Drag-and-drop task reordering
- Real-time progress calculation
- Audit logging
- Change tracking
- Search and filtering
- Theme customization (light/dark mode)

### 9. Development Toolkit

**Admin-only development tools** for monitoring, testing, and managing the application during development.

#### Available Development Tools

**Core Tools:**
1. **Database Management**
   - Run migrations (Prisma schema updates)
   - Seed development data
   - Generate Prisma client
   - Reset database (destructive)
   - View migration history

2. **Logs Viewer**
   - Real-time application logs
   - Filter by level (Error, Warn, Info, Debug)
   - Search log messages
   - Export to text file
   - Auto-refresh every 2 seconds

3. **Tests**
   - Run unit tests
   - Generate coverage reports
   - Run linting
   - View test output in real-time

**DevOps Tools:**
4. **Build & Deploy**
   - Build frontend (React → static assets)
   - Build backend (TypeScript → JavaScript)
   - Deployment simulation

5. **CI/CD**
   - View GitHub Actions workflows
   - Monitor pipeline status
   - Track build results

**Utilities:**
6. **Environment Variables**
   - View .env configuration
   - Show/hide sensitive values
   - Identify secrets vs public variables

7. **API Testing**
   - Execute GraphQL queries
   - Test mutations
   - Pass variables in JSON
   - View formatted responses

8. **Documentation Browser**
   - Search 90+ documentation files
   - Browse by category
   - View markdown content
   - Quick navigation to guides

**Advanced:**
9. **Code Quality**
   - Test coverage statistics
   - Linting results
   - Quality metrics

10. **Performance Monitor**
    - Real-time memory usage
    - CPU statistics
    - System uptime
    - Auto-refresh

11. **Git Integration**
    - Current branch status
    - Commit history
    - Changed files
    - Repository info

12. **Task Runner**
    - Execute npm scripts
    - View package.json tasks
    - Real-time output

#### Access Requirements
- **Admin users only** in production
- **Any user in development mode** (import.meta.env.DEV)
- Accessed via Development menu in sidebar
- Each tool has contextual help and tooltips

#### Documentation
- **Complete Documentation Index**: See `DOCUMENTATION_INDEX.md`
- **Development Menu Guide**: See `DEVELOPMENT_MENU_GUIDE.md`
- **Panel Enhancement Progress**: See `DEV_PANELS_ENHANCEMENT_PROGRESS.md`

---

## Authentication & Authorization (RBAC)

### Authentication Flow

1. User submits email/password
2. Backend validates credentials (bcrypt)
3. JWT token issued (24h expiry)
4. Token stored in localStorage
5. Token sent in Authorization header
6. Backend validates token on each request
7. Session tracked in database

### Authorization Model

**Hierarchy:**
```
System Role (ADMIN > SME > CS/CSS > USER)
  ↓
User-Specific Permissions (resource-level)
  ↓
Role-Based Permissions (organizational)
```

### Roles and Permissions

#### System Roles

**1. ADMIN (Administrator)**
- **Full System Access**: Complete CRUD on all resources
- **User Management**: Create, edit, delete users
- **Role Management**: Assign/remove roles
- **System Configuration**: Backup/restore, settings
- **Database Access**: All operations
- **Menu Access**: All menus visible

**2. SME (Subject Matter Expert)**
- **Products**: Full CRUD (CREATE, READ, UPDATE, DELETE)
  - Can create/edit/delete products
  - Can manage all product attributes
  - Can configure telemetry
- **Solutions**: Full CRUD
  - Can create/edit/delete solutions
  - Can bundle products into solutions
- **Tasks**: Full CRUD including **deletion**
  - Can create/edit/delete tasks
  - Can queue tasks for deletion
  - Can process deletion queue
- **Customers**: No access
- **Menu Access**: Products, Solutions
- **Limited System Access**: No backup/restore, no user management

**3. CS/CSS (Customer Success)**
- **Customers**: Full CRUD
  - Can create/edit/delete customers
  - Can assign products to customers
  - Can assign solutions to customers
  - Can manage adoption plans
- **Products**: READ only
  - Can view products
  - Can see products in dropdown when assigning
  - **Cannot create/edit/delete products**
- **Solutions**: READ only
  - Can view solutions
  - Can see solutions in dropdown when assigning
  - **Cannot create/edit/delete solutions**
- **Tasks**: READ only (within customer context)
- **Menu Access**: Customers only
- **No System Access**: No backup/restore, no user management

**4. USER (Basic User)**
- **Products**: READ only (if granted)
- **Solutions**: READ only (if granted)
- **Customers**: READ only (if granted)
- **No create/edit/delete capabilities**
- **Menu Access**: Based on permissions
- **No System Access**

### Resource Types
- `PRODUCT` - Product management
- `SOLUTION` - Solution management
- `CUSTOMER` - Customer management
- `SYSTEM` - System-wide operations

### Permission Levels
- `READ` - View only
- `WRITE` - Edit existing
- `ADMIN` - Full control (create, edit, delete)

### Permission Hierarchy
```
ADMIN > WRITE > READ
```

### Default Admin
- **Username**: `admin`
- **Default Password**: `DAP123` (must change on first login)
- **Role**: ADMIN
- **Full System Access**: Yes

### Test Users
- **smeuser** / `smeuser` - SME role for testing
- **cssuser** / `cssuser` - CSS role for testing

### RBAC Implementation Details

#### Backend Authorization
**Files:**
- `backend/src/lib/permissions.ts` - Core permission logic
- `backend/src/lib/auth.ts` - Authentication helpers
- `backend/src/schema/resolvers/index.ts` - GraphQL resolvers with permission checks

**Key Functions:**
- `checkUserPermission(userId, resourceType, resourceId, requiredLevel)` - Check if user has permission
- `getUserAccessibleResources(userId, resourceType, minPermissionLevel)` - Get list of accessible resource IDs or null (all)
- `requirePermission(ctx, resourceType, resourceId, level)` - Throw error if permission not met
- `ensureRole(ctx, allowedRoles)` - Ensure user has one of the allowed roles

**Permission Resolution Order:**
1. Check if user is ADMIN (isAdmin === true) → Full access
2. Check system role (SME, CS/CSS) → Role-specific access
3. Check user-specific permissions → Resource-level access
4. Check role-based permissions → Organizational access
5. Deny if none match

**Special Handling:**
- SME users: Automatically get ADMIN access to PRODUCT and SOLUTION (all resources)
- CS/CSS users: Automatically get ADMIN access to CUSTOMER (all resources) + READ access to PRODUCT and SOLUTION (all resources)
- Admin users (isAdmin=true): Full access to everything
- Fallback 'admin' user (in dev): Full access when no database user exists

#### Frontend Authorization
**Files:**
- `frontend/src/features/auth/components/AuthBar.tsx` - Role-based menu visibility
- `frontend/src/features/*/components/*Dialog.tsx` - Permission-aware dialogs
- `frontend/src/features/auth/context/AuthContext.tsx` - Auth context provider

**Menu Visibility:**
- Admin: Products, Solutions, Customers, Users & Roles, Backup & Restore
- SME: Products, Solutions
- CS/CSS: Customers
- USER: Based on specific permissions

#### Database Schema
**Tables:**
- `User` - User accounts (isAdmin, role fields)
- `Role` - Role definitions (name, description)
- `Permission` - Per-resource permissions (userId, resourceType, resourceId, level)
- `UserRole` - User-role assignments (many-to-many)
- `RolePermission` - Role-based permissions

---

## Deployment & Release Process

### Environments

| Environment | Server | URL | Purpose | Mode |
|------------|--------|-----|---------|------|
| **MAC** | MacBook | http://localhost:5173 | Offline Demos | `mac-demo` |
| **DEV** | centos1.rajarora.csslab | http://dev.rajarora.csslab/dap/ | Development & Testing | `linux-dev` |
| **PROD** | dapoc | https://myapps.cxsaaslab.com/dap/ | Production | `production` |

### Standard Release Workflow

#### 1. Development & Testing (DEV - centos1)

```bash
cd /data/dap

# Make changes
# Test thoroughly

# Build and test
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# Restart services
./dap restart

# Test in browser: http://dev.rajarora.csslab/dap/
```

**Pre-Deployment Checklist:**
- [ ] All code tested locally
- [ ] No console errors (F12)
- [ ] No backend errors in logs
- [ ] All RBAC roles tested (admin, smeuser, cssuser)
- [ ] UI looks correct
- [ ] Debug logs removed
- [ ] Documentation updated

#### 2. Create Release Package

```bash
cd /data/dap

# Run release creation script
./deploy/create-release.sh

# This creates:
# - releases/release-YYYYMMDD-HHMMSS.tar.gz
# - releases/release-YYYYMMDD-HHMMSS.manifest.txt
# - releases/release-YYYYMMDD-HHMMSS.md (release notes)
```

#### 3. Deploy to Production

```bash
# Standard Production Deployment (dapoc)
./deploy-to-production.sh

# This script automatically:
# - Connects to dapoc (PROD_USER=dap, PROD_HOST=dapoc)
# - Creates a backup of the current production backend
# - Activates maintenance mode
# - Transfers and updates code
# - Updates database schema (prisma db push)
# - Restarts services via PM2
# - Verifies deployment
```

### Quick Patch Deployment

For small bug fixes:

```bash
# Use deployment script with skip build flags (if built locally)
./deploy-to-production.sh --skip-build-backend --skip-build-frontend
```

### Deployment Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `deploy-to-production.sh` | **Main Production Deployment Script** | Project Root |
| `release-manager.sh` | Orchestration (deploy/patch/rollback) | `/data/dap/deploy/` |
| `health-check.sh` | System health verification (14 checks) | `/data/dap/deploy/` |
| `create-release.sh` | Create versioned release package | `/data/dap/deploy/` |

### Rollback Procedure

If deployment fails:

```bash
# On centos2
cd /data/dap

# Restore from backup (created before deployment)
curl -X POST http://localhost:4000/graphql \
  -d '{"query":"mutation { restoreBackup(filename: \"PRE_DEPLOYMENT_BACKUP.sql\") { success } }"}'

# Or use GUI: Backup & Restore → Restore

# Restart services
./dap restart
```

### Deployment Documentation

- **Robust Release Process**: `deploy/ROBUST_RELEASE_PROCESS.md` ⭐ (Complete guide with rollback)
- **Deployment Summary**: `deploy/DEPLOYMENT_SUMMARY.md` (Quick commands)
- **Standard Process**: `deploy/RELEASE_PROCESS.md` (Original workflow)
- **Quick Reference**: `deploy/QUICK_DEPLOY_GUIDE.md`
- **Testing Checklist**: `deploy/testing-checklist.md`
- **Deployment Index**: `DEPLOYMENT_INDEX.md`

---

## Database Schema

### Core Tables

1. **User** - System users with authentication
2. **Session** - Active user sessions
3. **Product** - Products with custom attributes
4. **Solution** - Product bundles
5. **Customer** - Customer organizations
6. **Task** - Implementation tasks
7. **License** - Hierarchical license levels
8. **Outcome** - Business outcomes
9. **Release** - Version releases
10. **TelemetryAttribute** - Telemetry definitions
11. **TelemetryValue** - Historical telemetry data
12. **CustomerProduct** - Product assignments
13. **CustomerSolution** - Solution assignments
14. **AdoptionPlan** - Product adoption tracking
15. **SolutionAdoptionPlan** - Solution adoption tracking
16. **CustomerTask** - Customer-specific task copies
17. **CustomerSolutionTask** - Solution task copies
18. **CustomerTelemetryAttribute** - Customer telemetry tracking
19. **AuditLog** - System audit trail
20. **Permission** - Per-resource permissions
21. **Role** - Role definitions
22. **UserRole** - User-role assignments
23. **RolePermission** - Role-based permissions

### Key Relationships

- Product → Tasks (one-to-many)
- Product → CustomerProduct → AdoptionPlan (one-to-many)
- Solution → Tasks (one-to-many)
- Solution ↔ Product (many-to-many via SolutionProduct)
- Task → TelemetryAttribute (one-to-many)
- CustomerTask → CustomerTelemetryAttribute (one-to-many)
- User → Permission (many-to-many)
- User → Role (many-to-many via UserRole)

### Schema Location
`backend/prisma/schema.prisma`

### Migration Management
```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name description

# Push schema changes (use carefully)
npx prisma db push
```

---

## Development Workflow

### Configuration Model

DAP uses a **single `.env.example` template** with **Zod runtime validation**:

```
.env.example  →  .env  →  backend/.env
   (template)   (your config)  (synced)
```

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.example` | Template with all variables documented | ✅ Committed |
| `.env` | Your active configuration | ❌ Gitignored |
| `backend/.env` | Synced copy for backend | ❌ Gitignored |

The backend validates all variables at startup using Zod schemas. Missing required variables cause immediate startup failure with clear error messages.

**For complete environment configuration details, see:** `docs/ENVIRONMENT_MANAGEMENT.md`

### Cross-Platform Development

DAP supports four deployment environments with unified CLI:

| Environment | Platform | Mode | ./dap Behavior |
|------------|----------|------|----------------|
| **MacBook** | macOS | `mac-demo` | Light production for demos |
| **centos1** | Linux | `linux-dev` | Full development toolkit |
| **centos2** | Linux | `production` | Staging (delegates to `dap-prod`) |
| **dapoc** | RHEL 9 | `production` | Production (delegates to `dap-prod`) |

The `./dap` script automatically detects the environment based on OS and hostname.

**For detailed cross-platform documentation, see:** `docs/DEV_QUICKSTART.md`

### Mac Demo Setup (No Docker Required)

```bash
# 1. Clone repository and setup config
cd ~/Develop/dap
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, etc.

# 2. Start (auto-detected on macOS)
./dap start

# This automatically:
# - Syncs .env to backend/.env
# - Installs PostgreSQL via Homebrew (if needed)
# - Runs migrations
# - Builds backend/frontend
# - Starts services on ports 4000/5173

# 3. Access
# Frontend: http://localhost:5173
# Backend: http://localhost:4000/graphql

# 4. Run tests
./dap test

# 5. Reset database with demo data
./dap reset
```

### Linux Development Setup (Docker-based)

```bash
# 1. Clone repository and setup config
cd /data/dap
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, etc.

# 2. Setup database (Docker/Podman) - if not using ./dap managed container
docker run --name dap_db \
  -e POSTGRES_DB=dap \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:16

# 3. Start
./dap start

# 4. Access
# Frontend: http://localhost:5173
# Backend: http://localhost:4000/graphql
```

### Making Changes

1. **Backend Changes:**
   - Edit files in `backend/src/`
   - Server auto-restarts (nodemon in dev, manual restart in Mac demo)
   - Run migrations if schema changes

2. **Frontend Changes:**
   - Edit files in `frontend/src/`
   - Hot module reload enabled in dev
   - Mac demo requires rebuild: `./dap restart`

3. **Database Schema:**
   - Edit `backend/prisma/schema.prisma`
   - Run `npx prisma migrate dev --name description`
   - Run `npx prisma generate`

### Testing

**Automated Tests:**
```bash
./dap test               # Runs comprehensive E2E tests
./dap test --pattern=auth  # Run specific tests
```

**Manual Testing Checklist:**
1. Login/logout with different roles
2. Create/edit/delete products (Admin/SME)
3. Create/edit/delete customers (Admin/CSS)
4. Assign products to customers (Admin/CSS)
5. Update task statuses
6. Configure telemetry
7. Test backups
8. Check permissions for each role

---

## Production Environment

### Server Details

**Production Server:** centos2  
**IP:** 172.22.156.33  
**OS:** CentOS Stream 9 / Rocky Linux 9  
**RAM:** 64GB  
**CPU:** Multi-core (PM2 cluster utilizes all)

### Deployment Architecture

```
Internet → Apache (80/443)
            ↓
       /dap/ → Frontend (Static files)
       /dap/graphql → Backend (Node.js: port 4000)
            ↓
       PostgreSQL (localhost:5432)
```

### Service Configuration

**Apache Config:** `/etc/httpd/conf.d/dap.conf`
- Reverse proxy to backend
- Static file serving
- Cache-Control headers for no-cache
- Security headers

**Backend:** Node.js with Express
- Port: 4000 (localhost only)
- Process management: systemd or PM2
- Hot reload disabled in production

**Database:** PostgreSQL 16
- Service: `postgresql.service`
- Port: 5432 (localhost only)
- Daily automated backups

### Monitoring & Logs

**Application Logs:**
- Backend: `/data/dap/backend.log`
- Frontend: Browser console (in production)

**System Logs:**
- Apache access: `/var/log/httpd/access_log`
- Apache error: `/var/log/httpd/error_log`
- PostgreSQL: `/var/lib/pgsql/data/log/`

**Monitoring:**
```bash
# Check backend
curl http://localhost:4000/graphql -X POST \
  -d '{"query":"{ __typename }"}'

# Check frontend
curl http://localhost/dap/ | grep index-

# View logs
tail -f /data/dap/backend.log
sudo tail -f /var/log/httpd/error_log
```

### Security

**Firewall (firewalld):**
- HTTP (80) - Open
- HTTPS (443) - Open
- SSH (22) - Open (rate limited)
- PostgreSQL (5432) - Localhost only
- Backend (4000) - Localhost only

**SSL/TLS:**
- Handled by ZTNA proxy (development)
- Can be configured with Let's Encrypt (production)

**Backup Strategy:**
- Daily automated backups at 1:00 AM
- 7-day retention by default
- Passwords excluded from backup files
- Existing passwords preserved on restore
- Manual backups before deployments

### Production Storage Locations

All DAP data is stored on `/data` partition (not root):

| Component | Location |
|-----------|----------|
| **DAP User Home** | `/data/dap` |
| **Application Code** | `/data/dap/app` |
| **PM2 Home** | `/data/dap/.pm2` |
| **PM2/App Logs** | `/data/dap/logs` |
| **NPM Cache** | `/data/dap/.npm` |
| **Backups** | `/data/dap/backups` |
| **PostgreSQL Data** | `/data/pgsql/16/data` |

> **Note:** PostgreSQL data moved from `/var/lib/pgsql/16/data` via systemd override.

---

## Recent Changes & Fixes

### Version 3.0.0 (December 24, 2025)

#### Theme Alignment & Help Refresh
- **Universal Theme Alignment**: Replaced all hardcoded colors (navy, slate) with theme-aware variables (`primary.main`, `divider`, `alpha()`).
- **Modernized Login & Header**: The entire user journey—from login through navigation—now adapts to the active brand theme.
- **Help Documentation Overhaul**: Introduced a 3-step tile-based "Getting Started" guide and added documentation for Tags and Task Locking.

#### Feature Scoping & Logic Improvements
- **Scoped Task Locking**: Restricted task locking to Product and Solution modeling views, unblocking all Customer-side operations.
- **Consistent Telemetry Support**: Standardized telemetry import/export operations across all views with improved authentication.
- **Dashboard Metric Fixes**: Corrected customer summary dashboard statistics (Velocity, Completion) and improved dynamic coloring.

### Version 3.1.0 (December 27, 2025)

#### Customer Deployment Refinements
- **Unified Assignment UI**: Streamlined "Assign Product/Solution" using consistent tab-header icons and dropdown actions.
- **Visual Consistency**: Replaced text-based chips with standardized icons (Article, Video) across all task lists.
- **Terminology Updates**: Renamed "Telemetry" column to "Validation Criteria" to better reflect business purpose.
- **Bug Fixes**: Resolved issue where Tags were hidden in Solution Adoption Plans due to data stripping and stale column preferences.

### Version 2.9.5 (December 22, 2025)

#### Frontend Modular Refactoring (Complete)

**Overview**: The entire frontend codebase has been refactored from a monolithic `src/components` structure to a modern, Domain-Driven Design (DDD) **Feature-Based Architecture**.

**Key Architectural Changes:**
1.  **Feature Modules**: Code is now organized by business domain in `frontend/src/features/`. Each feature contains its own:
    - `components/` - React components
    - `hooks/` - Feature-specific hooks
    - `graphql/` - GraphQL queries/mutations
    - `types/` - TypeScript interfaces
    - `index.ts` - Public API (Barrels)
2.  **Shared Resources**: Truly reusable code lives in `frontend/src/shared/`.
3.  **Strict Boundaries**: Features interact only via their public exports. Cross-feature dependencies are minimized and explicit.
4.  **Type Safety**: All `any` types removed. Strictly typed interfaces for all components and logic.
5.  **Global Aliases**: Clean imports using `@features/*`, `@shared/*`, `@/*`.

**New Directory Structure:**
```
frontend/src/
├── features/               # Feature modules
│   ├── products/           # Product management
│   ├── solutions/          # Solution management
│   ├── customers/          # Customer & adoption
│   ├── tasks/              # Task management
│   ├── auth/               # Authentication
│   ├── admin/              # User/System admin
│   ├── ai-assistant/       # AI functionality
│   ├── telemetry/          # Telemetry system
│   └── ... (dev-tools, backups, audit, search)
├── shared/                 # Reusable code
│   ├── components/         # Shared UI (FAIcon, Dialogs)
│   ├── types/              # Shared types
│   └── utils/              # Shared utilities
├── pages/                  # Route components
├── providers/              # Global providers
└── config/                 # Configuration
```

**Benefits:**
- **Scalability**: New features can be added without cluttering a central folder.
- **Maintainability**: Clear ownership and boundaries for every piece of code.
- **Testing**: Easier to isolate and test features.
- **Onboarding**: Developers can understand the system by looking at the folder structure.

---

## Known Issues & Limitations

### Active Issues

1. **First Login Authentication Race Condition** (Parked)
   - Products, Solutions, Customers pages may show "No token found" on first load after restart
   - Workaround: Refresh the page after login
   - Tracked in: `docs/TODO.md` (P2 priority)

### Current Limitations

1. **Single Tenant**
   - Currently designed for single organization use
   - No multi-tenancy support

2. **Telemetry Integration**
   - Manual telemetry value entry
   - No automated API integration yet
   - Excel import as workaround

3. **Reporting**
   - Limited built-in reporting
   - Data accessible via GraphQL

4. **Desktop-First Design**
   - UI optimized for laptops and desktop monitors (1280px+)
   - Medium-sized controls by default (not compact/small)
   - Full use of horizontal screen real estate
   - Mobile experience is secondary and not prioritized

5. **Real-time Updates**
   - No WebSocket-based live updates
   - Requires manual refresh

### Known Technical Debt

1. **Large Bundle Size**
   - Frontend bundle > 2MB
   - No code splitting implemented
   - Performance impact on slow connections

2. **Test Coverage**
   - Limited automated tests
   - Manual testing primary method

---

## File Structure

```
/data/dap/
├── backend/                    # Backend Node.js application
│   ├── src/
│   │   ├── schema/            # GraphQL schema and resolvers
│   │   ├── services/          # Business logic services
│   │   ├── lib/               # Utilities and helpers
│   │   │   ├── auth.ts        # Authentication helpers
│   │   │   └── permissions.ts # RBAC permission logic
│   │   └── server.ts          # Main server file
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations
│   ├── dist/                  # Compiled JavaScript (production)
├── frontend/                   # Frontend React application
│   ├── src/
│   │   ├── features/          # Feature modules (Domain-Driven)
│   │   │   ├── products/
│   │   │   ├── solutions/
│   │   │   ├── customers/
│   │   │   ├── auth/
│   │   │   └── ...
│   │   ├── shared/            # Shared components & utilities
│   │   ├── pages/             # Top-level route pages
│   │   ├── providers/         # Context providers
│   │   ├── lib/               # 3rd party lib initialization
│   │   └── main.tsx           # Entry point
│   ├── public/                # Static assets
│   └── dist/                  # Built assets (production)
├── docs/                       # Documentation
├── scripts/                    # Helper scripts
└── deploy/                     # Deployment configuration
```
