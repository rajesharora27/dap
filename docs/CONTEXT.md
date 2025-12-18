# DAP Application - Complete Context Document

**Version:** 2.7.0
**Last Updated:** December 18, 2025  
**Purpose:** Comprehensive context for AI assistants and developers

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [System Architecture](#system-architecture)
3. [Core Domain Model](#core-domain-model)
4. [Key Features](#key-features)
5. [Technology Stack](#technology-stack)
6. [Authentication & Authorization (RBAC)](#authentication--authorization-rbac)
7. [Deployment & Release Process](#deployment--release-process)
8. [Database Schema](#database-schema)
9. [Development Workflow](#development-workflow)
10. [Production Environment](#production-environment)
11. [Recent Changes & Fixes](#recent-changes--fixes)
12. [Known Issues & Limitations](#known-issues--limitations)

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

## System Architecture

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
- **Build Tool:** Vite 7
- **UI Library:** Material-UI (MUI) v6
- **GraphQL Client:** Apollo Client
- **State Management:** React hooks + Apollo Cache
- **Drag & Drop:** DnD Kit
- **Routing:** React Router v7
- **Forms:** Material-UI controlled components

#### Backend
- **Runtime:** Node.js 20+
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
- **Production Server:** dapoc.cisco.com (RHEL 9, Nginx with SSL)
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
- `frontend/src/components/AIChat.tsx` - Chat UI

### 8. Advanced Features
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
- `frontend/src/components/MenuBar.tsx` - Role-based menu visibility
- `frontend/src/components/dialogs/*` - Permission-aware dialogs
- `frontend/src/lib/auth.tsx` - Auth context provider

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
| **PROD** | centos2.rajarora.csslab | https://myapps.cxsaaslab.com/dap/ | Production | `production` |

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
# Deploy release to centos2
./deploy/release-to-prod.sh releases/release-YYYYMMDD-HHMMSS.tar.gz

# Script automatically:
# - Creates backup of production database
# - Transfers files
# - Builds backend
# - Updates database
# - Restarts services
# - Verifies deployment
```

### Quick Patch Deployment

For small bug fixes:

```bash
cd /data/dap

# Use quick patch script (or create custom one based on APPLY_RBAC_PATCH.sh)
./APPLY_RBAC_PATCH.sh

# This:
# - Transfers only changed files
# - Builds and restarts
# - Verifies deployment
```

### Deployment Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `release-manager.sh` | **Main deployment orchestration** (deploy/patch/rollback) | `/data/dap/deploy/` |
| `health-check.sh` | System health verification (14 checks) | `/data/dap/deploy/` |
| `migration-manager.sh` | Database migration management | `/data/dap/deploy/` |
| `create-release.sh` | Create versioned release package | `/data/dap/deploy/` |
| `release-to-prod.sh` | Legacy deployment script | `/data/dap/deploy/` |

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

### Cross-Platform Development

DAP supports three deployment environments with unified CLI:

| Environment | Platform | Mode | ./dap Behavior | Environment File |
|------------|----------|------|----------------|------------------|
| **MacBook** | macOS | `mac-demo` | Light production for demos | `.env.macbook` |
| **centos1** | Linux | `linux-dev` | Full development toolkit | `.env.development` |
| **centos2** | Linux | `production` | Production (delegates to `dap-prod`) | `.env.production` |

The `./dap` script automatically detects the environment based on OS and hostname.

**For detailed cross-platform documentation, see:** `docs/DEV_CONTEXT_LOCAL.md`

### Mac Demo Setup (No Docker Required)

```bash
# 1. Clone repository
cd ~/Develop/dap

# 2. Start (auto-detected on macOS)
./dap start

# This automatically:
# - Installs PostgreSQL via Homebrew (if needed)
# - Syncs .env.macbook to backend/.env
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
# 1. Clone repository
cd /data/dap

# 2. Setup database (Docker/Podman)
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

### Version 2.6.2 (December 18, 2025)

#### Dashboard Simplification & Solutions Enhancements

**Feature 1: Simplified Dashboard Layout (Products & Solutions)**
- **Issue**: The dashboard view was previously cluttered with licenses, product chips, and a redundant summary card.
- **Fix**: Streamlined the dashboard for both Products and Solutions:
  - Removed licenses from Product name header and product chips from Solutions name header.
  - Removed the sticky Summary Card from the right column for a cleaner, full-width presentation.
  - Renamed "Description" to "Overview" and "Product Outcomes" to "Outcomes".
  - Moved "Custom Attributes" from the dashboard view to its own dedicated tab.
- **Files Changed**: `frontend/src/pages/ProductsPage.tsx`, `frontend/src/pages/SolutionsPage.tsx`

**Feature 2: Enhanced Solutions Dashboard**
- **Improvement**: Added a "Products" section directly below the Solution name header in the dashboard for immediate visibility.
- **Cleanup**: Removed the redundant description tile from the "Products" tab in the Solutions section.
- **Files Changed**: `frontend/src/pages/SolutionsPage.tsx`

**Feature 3: GraphQL Mutation Bug Fix**
- **Issue**: "Variable $input is never used" error when updating solutions with outcomes.
- **Root Cause**: Typos in `UPDATE_OUTCOME` mutation passing `$id` where `$input` was expected.
- **Fix**: Corrected the mutation definition in `SolutionDialog.tsx`.
- **Files Changed**: `frontend/src/components/dialogs/SolutionDialog.tsx`

**Feature 4: Theming & Visual Consistency**
- **Improvement**: Refactored `EntitySummary` and main entity pages to strictly use theme-derived colors via Material-UI's `alpha()` and `useTheme()`.
- **Files Changed**: `EntitySummary.tsx`, `CustomersPage.tsx`, `ProductsPage.tsx`, `SolutionsPage.tsx`

---

### Version 2.6.1 (December 17, 2025)

#### Production Infrastructure Improvements

**Feature 1: PostgreSQL Auto-Start in Production**
- **Issue**: `./dap start` on production (centos2) did not start PostgreSQL if it was stopped.
- **Fix**: Updated `dap-prod` script with `start_all()` function that:
  - Checks if PostgreSQL is running before starting PM2
  - Starts PostgreSQL via `systemctl start postgresql-16` if not running
  - Waits for PostgreSQL to accept connections (30s timeout)
  - Handles CentOS PATH issues with `pg_is_running()` helper
- **Files Changed**: `dap-prod`

**Feature 2: PostgreSQL Data Moved to /data Partition**
- **Issue**: PostgreSQL data was on root partition which had limited space.
- **Fix**: Migrated PostgreSQL data directory from `/var/lib/pgsql/16/data` to `/data/pgsql/16/data`
- **Implementation**:
  - Created `/data/pgsql/16/data` with postgres ownership
  - Copied data via rsync
  - Created systemd override at `/etc/systemd/system/postgresql-16.service.d/override.conf`
  - Verified PostgreSQL starts with new data directory
- **Result**: All DAP data now on `/data` partition (238GB available)

**Feature 3: Mac PostgreSQL Auto-Detection**
- **Issue**: Mac script hardcoded `postgresql@16` but different versions could be installed.
- **Fix**: Updated `mac-light-deploy.sh` with:
  - `detect_postgres_version()` function to find installed version
  - `cleanup_postgres_locks()` to handle stale PID files
  - Improved startup with retry after lock cleanup
- **Files Changed**: `scripts/mac-light-deploy.sh`

**Feature 4: Mac Seed Script Fixed**
- **Issue**: `seed-light-demo.ts` was empty, causing login failures after `./dap reset`.
- **Fix**: Implemented proper seeding script that creates:
  - `admin` / `DAP123!!!` (Administrator)
  - `smeuser` / `DAP123` (SME User)
  - `cssuser` / `DAP123` (CSS User)
- **Files Changed**: `backend/scripts/seed-light-demo.ts`

---

### Version 2.5.0 (December 8, 2025)

#### Terminology Standardization: Assignments & Adoption Plans

**Feature**: Unified terminology for product/solution assignments and adoption plans.

The terms "Assignment" and "Adoption Plan" are now **interchangeable** throughout the application:
- **"Product Assignment"** = **"Product Adoption Plan"** (same concept)
- **"Solution Assignment"** = **"Solution Adoption Plan"** (same concept)

When a product or solution is assigned to a customer, the result is an adoption plan that tracks their implementation progress.

**Changes Made:**

1. **Backend - AI Agent Context**:
   - `SchemaContextManager.ts`: Added business rules explaining both terms are equivalent
   - `DataContextManager.ts`: Added terminology note in LLM prompt
   - `QueryTemplates.ts`: Added new templates for "adoption plans" and "assignments"
   - `AIAgentService.ts`: Updated LLM examples to use both terms

2. **Frontend - UI Labels**:
   - `CustomerAdoptionPanelV4.tsx`: Section headers use "Product Assignments" / "Solution Assignments"
   - `CustomerPreviewDialog.tsx`: Labels use "Product Assignments" / "Solution Assignments"
   - Tooltips reference both terms: "Product assignment • Double-click to view adoption plan"

3. **AI Agent Query Support**:
   - Users can ask: "Show me all product assignments" or "List adoption plans for customer X"
   - Both queries return the same data

#### AI Agent Query Template Fixes

**Bug Fix**: Queries like "List all tasks for Cisco Secure Access without telemetry" were failing.

**Root Causes & Fixes:**

1. **Prisma Syntax Issue**: `{ relation: { none: {} } }` doesn't work for checking empty relations
   - **Fix**: Changed to `{ NOT: { relation: { some: {} } } }`
   - Updated in: `QueryTemplates.ts`, `AIAgentService.ts`, `DataContextManager.ts`

2. **Regex Pattern Issue**: Patterns didn't handle "all **the** tasks" (with article "the")
   - **Fix**: Added `(?:the\s+)?` to patterns: `/(?:find|show|list|get)\s+(?:all\s+)?(?:the\s+)?tasks?\s+/`

3. **Name Matching**: Using `equals` instead of `contains` for product names
   - **Fix**: Changed to `contains` with `mode: 'insensitive'` for partial matching

**Files Changed:**
- `backend/src/services/ai/QueryTemplates.ts` - Fixed patterns, Prisma syntax, added debug logging
- `backend/src/services/ai/AIAgentService.ts` - Updated LLM constraints and examples
- `backend/src/services/ai/DataContextManager.ts` - Updated query pattern instructions

**Debug Logging Added:**
- Template matching now logs to console for debugging
- Shows which templates match and with what confidence
- Helps diagnose when queries fall through to LLM

#### AI Agent User Account

**Feature**: AI Agent uses a dedicated user account for query execution with admin fallback.

**Implementation:**
- AI Agent looks for `aiuser` account first
- If `aiuser` doesn't exist, falls back to `admin` account
- If neither exists:
  - AI Assistant button is hidden from the GUI
  - Queries return an error message
- All AI queries execute with the AI user's RBAC permissions
- Cache is used to minimize database lookups (1 minute TTL)

**Priority Order:**
1. `aiuser` (preferred - dedicated AI account)
2. `admin` (fallback - uses admin permissions)

**Files Changed:**
- `backend/src/schema/resolvers/ai.ts` - Added AI user check with fallback, caching, availability query
- `backend/src/schema/typeDefs.ts` - Added `isAIAgentAvailable` query and `AIAgentAvailability` type
- `frontend/src/graphql/ai.ts` - Added availability query
- `frontend/src/components/AuthBar.tsx` - Conditional rendering of AI button

**Optional: Create Dedicated aiuser:**
1. Create `aiuser` account via Admin > Users & Roles
2. Assign appropriate role (recommend: `ADMIN` for full data access)
3. Restart backend or wait for cache to expire (1 minute)

**Note:** If only `admin` exists, AI Agent works but logs will indicate fallback mode.

---

#### Database Connection Pool Management

**Bug Fix**: "Too many database connections" error in production.

**Root Cause:**
- No explicit connection pool limits in Prisma configuration
- PM2 cluster mode multiplied connection usage (4 instances × default pool = exhausted connections)
- Multiple singleton patterns storing Prisma references

**Fix:**
- Added explicit `connection_limit=5` to DATABASE_URL in context.ts
- Ensured all AI services use the shared Prisma client singleton
- Added graceful shutdown handler to properly close connections
- Simplified AI service Prisma handling to prevent connection leaks

**Files Changed:**
- `backend/src/context.ts` - Added connection pool limit and graceful shutdown
- `backend/src/services/ai/AIAgentService.ts` - Uses shared Prisma client
- `backend/src/services/ai/DataContextManager.ts` - Uses shared Prisma client
- `backend/src/services/ai/QueryExecutor.ts` - Uses shared Prisma client

**Connection Math:**
- PostgreSQL default max connections: 100
- Connection limit per instance: 5
- PM2 instances: 4
- Total connections: 4 × 5 = 20 (well under 100 limit)

---

#### Entity Preview Dialogs

**Feature**: Clicking on entities in AI chat results now opens preview dialogs.

Previously only Tasks opened a preview dialog. Now all entities have preview dialogs:
- `ProductPreviewDialog` - Shows product details, outcomes, licenses, releases
- `SolutionPreviewDialog` - Shows solution details, products, outcomes
- `CustomerPreviewDialog` - Shows customer details, product/solution assignments
- `AdoptionPlanDialog` - Shows adoption plan progress and tasks

**Files Created:**
- `frontend/src/components/dialogs/ProductPreviewDialog.tsx`
- `frontend/src/components/dialogs/SolutionPreviewDialog.tsx`
- `frontend/src/components/dialogs/CustomerPreviewDialog.tsx`

**Files Modified:**
- `frontend/src/pages/App.tsx` - Added state and handlers for all preview dialogs
- `frontend/src/components/AIChat.tsx` - Enhanced type detection for navigation

---

### Version 2.2.0 (December 6, 2025)

#### AI Agent Implementation (Phases 1 & 2 Complete)

**Feature**: Core backend infrastructure for the new AI Assistant.
- **Service Skeleton**: Created `AIAgentService` with initial processing logic.
- **Schema Context**: Implemented `SchemaContextManager` to generate LLM-friendly database schema descriptions (tables, relationships, business rules).
- **Query Templates**: Created 20+ regex-based safe query templates for common questions (e.g., "products without telemetry", "customers with low adoption").
- **LLM Providers**: Implemented multi-provider support including:
  - **Cisco AI Gateway** (Enterprise standard, OAuth2 + Basic Auth)
  - **OpenAI** (GPT-4o)
  - **Gemini** (1.5 Pro)
  - **Anthropic** (Claude 3.5)
- **Safe Execution**: Implemented `QueryExecutor` with read-only enforcement, row limits, and timeouts to safely run AI-generated Prisma queries.
- **Testing**: Added comprehensive unit and integration tests (130+ tests) covering all AI components.

### Version 2.1.3 (December 4, 2025)

#### Viewer Role Security & Dev Environment Fixes

**Feature 1: Strict Viewer Read-Only Access**
- **Issue**: Viewer role potentially had write access in some edge cases.
- **Fix**: 
  - Implemented strict backend-side RBAC enforcement in all resolvers.
  - Added `ensureRole` checks to block specified mutations for VIEWER role.
  - Verified UI disables all edit/save/delete buttons for Viewers.
  - See `docs/VIEWER_ROLE_VERIFICATION.md` for details.

**Feature 2: Development Environment Stability**
- **WebSocket Fix**: Resolved WebSocket connection failures for HMR via reverse proxy (`dev.rajarora.csslab`).
- **DevTools Isolation**: Refactored development tools to prevent interference with main application.
- **API Routing**: Fixed 404 errors in dev environment API calls.

### Version 2.1.2 (December 3, 2025)

#### Development Menu Enhancements

**Enhancement 1: Fixed All Development Submenus**
- **Issue**: "Docs" submenu was not loading documentation files
- **Root Cause**: Backend API route regex pattern incorrect (`/^\/docs\/(.*)` → `/^\/docs(.*)`)
- **Fix**:
  - Corrected regex pattern in `/data/dap/backend/src/api/devTools.ts`
  - Fixed project root path resolution (from `../..` to `../../..`)
  - All 12 Development submenus now functional
- **Files Changed**:
  - `backend/src/api/devTools.ts` (lines  135-143)

**Enhancement 2: Added Tooltips to All Development Menu Items**
- **Feature**: All 12 Development menu items now have hover tooltips
- **Implementation**: Wrapped each `ListItemButton` in Material-UI `Tooltip` component
- **Tooltips Added**:
  - Database: "Manage database migrations, seed data, and schema"
  - Logs: "View real-time application logs and debugging output"
  - Tests: "Run unit tests, integration tests, and view coverage reports"
  - Build & Deploy: "Build frontend/backend and deploy to production environments"
  - CI/CD: "View GitHub Actions workflows and pipeline status"
  - Environment: "View and manage environment variables and configuration"
  - API Testing: "Test GraphQL API endpoints and explore schema"
  - Docs: "Browse project documentation, guides, and technical references"
  - Quality: "View code quality metrics, linting results, and test coverage"
  - Performance: "Monitor system performance, memory usage, and uptime"
  - Git: "View Git repository status, branches, and commit history"
  - Tasks: "Execute npm scripts and custom development tasks"
- **Files Changed**:
  - `frontend/src/pages/App.tsx` (lines 2334-2471)

**Enhancement 3: Added Overview Sections to Development Panels**
- **Feature**: Development panels now have overview sections explaining:
  - Purpose and functionality
  - Available operations/features
  - Requirements to use the panel
  - Step-by-step usage instructions
- **Panels Enhanced** (3 of 12 complete):
  1. **Tests Panel**: Overview + tooltips on all buttons (Run All Tests, individual Run buttons)
  2. **Database Panel**: Overview + tooltips on all 5 buttons (Refresh, Run Migrations, Seed, Generate, Reset)
  3. **Logs Viewer Panel**: Overview + tooltips on all 4 buttons (Pause/Resume, Refresh, Export, Clear)
- **Files Changed**:
  - `frontend/src/components/dev/DevelopmentTestsPanel.tsx`
  - `frontend/src/components/dev/DatabaseManagementPanel.tsx`
  - `frontend/src/components/dev/LogsViewerPanel.tsx`

**Enhancement 4: Consolidated Documentation**
- **Created**: Comprehensive Documentation Index (`DOCUMENTATION_INDEX.md`)
- **Features**:
  - 90+ documentation files indexed and categorized
  - 7 main categories (Getting Started, User Guides, Technical, Deployment, Development, Operations, Archive)
  - Direct links to all documents
  - Quick navigation paths for different user types (New Users, Developers, DevOps, Troubleshooting)
  - Professional formatting with tables and descriptions
- **Updated**: README.md documentation section to prominently feature new index
- **Files Created**:
  - `/data/dap/DOCUMENTATION_INDEX.md`
- **Files Modified**:
  - `/data/dap/README.md` (documentation section)

**Enhancement 5: Fixed Test Command Issues**
- **Issue**: Tests were failing because `test:integration` npm script doesn't exist
- **Fix**: Updated test commands to use actual available npm scripts from backend/package.json
  - Changed "Integration Tests" to use `npm test` (same as unit tests)
  - All test commands now match available scripts
- **Files Changed**:
  - `frontend/src/components/dev/DevelopmentTestsPanel.tsx`

#### Documentation Created
- `DEV_MENU_IMPROVEMENTS.md` - Summary of menu and docs fixes
- `DEV_PANELS_ENHANCEMENT_PROGRESS.md` - Progress tracking for panel enhancements
- `DEV_MENU_COMPLETE_SUMMARY.md` - Comprehensive status of all work
- `REMAINING_PANELS_GUIDE.md` - Quick reference for remaining panel enhancements

#### Benefits & Impact
- **Better UX**: Users understand tools before using them (tooltips)
- **Working Tools**: All Development submenus functional (Docs fix)
- **Easy Discovery**: Documentation index makes finding docs effortless
- **Self-Service**: Tooltips and overviews reduce need for support
- **Consistent Design**: All panels following same pattern
- **Developer Productivity**: Faster onboarding, less confusion

---

### Version 2.1.1 (December 1, 2025)

#### RBAC Bug Fixes

**Issue 1: CSS Users Cannot See Products/Solutions in Dropdowns**
- **Severity**: High
- **Root Cause**: Missing READ permissions in database for CSS role + frontend rendering issues
- **Fix**: 
  - Updated database permissions for CSS role (READ access to PRODUCT and SOLUTION)
  - Fixed backend `getUserAccessibleResources` to return null (all access) for CSS users
  - Fixed frontend dialog layout to ensure dropdowns render properly
  - Fixed authentication context to include `userId` field
- **Files Changed**:
  - `backend/src/lib/auth.ts` - Added userId to context
  - `backend/src/lib/permissions.ts` - Fixed fallback admin handling
  - `frontend/src/components/dialogs/AssignProductDialog.tsx` - Fixed dialog layout

**Issue 2: SME Users Cannot Delete Tasks**
- **Severity**: Medium
- **Root Cause**: Task deletion mutations only allowed ADMIN role
- **Fix**: Added SME to allowed roles for `queueTaskSoftDelete` and `processDeletionQueue` mutations
- **Files Changed**: `backend/src/schema/resolvers/index.ts`

**Issue 3: Dialog Buttons Covered by Dropdowns**
- **Severity**: Medium
- **Root Cause**: Material-UI dropdown menu overlapping dialog buttons
- **Fix**: 
  - Implemented sticky DialogActions layout
  - Added proper overflow handling
  - Set max dialog height to 90vh with scrolling
- **Files Changed**: 
  - `frontend/src/components/dialogs/AssignProductDialog.tsx`
  - `frontend/src/components/dialogs/AssignSolutionDialog.tsx`

**Issue 4: Debug Console Logs in Production**
- **Severity**: Low
- **Fix**: Removed all debug console.logs from backend and frontend
- **Files Changed**: Multiple resolver and component files

#### Standard Release Process Created

**New Documentation:**
- `deploy/RELEASE_PROCESS.md` - Complete release workflow
- `deploy/QUICK_DEPLOY_GUIDE.md` - Quick reference
- `deploy/testing-checklist.md` - Pre-deployment testing
- `DEPLOYMENT_INDEX.md` - Master deployment navigation

**New Scripts:**
- `deploy/create-release.sh` - Create versioned release packages
- `deploy/release-to-prod.sh` - Deploy releases to production
- `APPLY_RBAC_PATCH.sh` - Quick patch deployment

**Process Benefits:**
- Versioned releases with audit trail
- Automated deployment to production
- Pre-deployment testing checklist
- Automatic backup before deployment
- Rollback capability

### Version 2.1.0 (November 30, 2025)

#### Auto-Backup Feature
- Daily automated backups at 1:00 AM
- Change detection (only backup if changed)
- Configurable retention period
- **Passwords excluded from backups**
- **Existing passwords preserved on restore**

#### Telemetry Deletion Fix
- Fixed telemetry attribute deletion not persisting
- Verified atomic "delete all + create new" pattern

---

## Known Issues & Limitations

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

4. **Mobile UI**
   - Desktop-first design
   - Mobile experience not optimized

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
│   └── package.json
│
├── frontend/                   # Frontend React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── dialogs/       # Dialog components
│   │   │   └── MenuBar.tsx    # Role-based menu
│   │   ├── pages/             # Page components
│   │   ├── graphql/           # GraphQL queries/mutations
│   │   └── App.tsx            # Main app component
│   ├── dist/                  # Built static files (production)
│   └── package.json
│
├── deploy/                     # Production deployment
│   ├── create-release.sh      # Create release package
│   ├── release-to-prod.sh     # Deploy to production
│   ├── RELEASE_PROCESS.md     # Complete workflow
│   ├── QUICK_DEPLOY_GUIDE.md  # Quick reference
│   └── testing-checklist.md   # Pre-deploy tests
│
├── docs/                       # Technical documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── FEATURES.md            # Feature documentation
│   └── [various docs]         # Implementation guides
│
├── scripts/                    # Utility scripts
│   ├── fix-rbac-permissions.js    # Fix database permissions
│   └── test-with-real-user.js     # RBAC testing
│
├── CONTEXT.md                  # This file
├── README.md                   # Main readme
├── CHANGELOG.md                # Version history
└── DEPLOYMENT_INDEX.md         # Deployment navigation
```

---

## Quick Reference Commands

### Development

```bash
# Start development
cd /data/dap
./dap start          # Start all services
./dap status         # Check status
./dap restart        # Restart services

# Database
cd /data/dap/backend
npx prisma studio    # Visual database browser
npx prisma migrate deploy  # Apply migrations
npm run seed         # Add sample data
```

### Production Deployment

```bash
# Standard release
cd /data/dap
./deploy/create-release.sh
./deploy/release-to-prod.sh releases/release-*.tar.gz

# Quick patch
./APPLY_RBAC_PATCH.sh

# Monitoring
tail -f /data/dap/backend.log
sudo tail -f /var/log/httpd/error_log
```

### Testing RBAC

```bash
# Test with different users
# Admin: admin / admin
# SME: smeuser / smeuser
# CSS: cssuser / cssuser

# Verify permissions:
# - Admin: Full access to all menus
# - SME: Products, Solutions (full CRUD including task deletion)
# - CSS: Customers (full CRUD), Products/Solutions (view only in dropdowns)
```

---

## Important Notes for AI Assistants

### When Making Changes

1. **Always check this CONTEXT.md first** for current state
2. **Update CONTEXT.md** when making significant changes
3. **Test in development** before deploying to production
4. **Create backups** before major changes
5. **Update documentation** for new features
6. **Follow RBAC rules** when implementing features

### Common Tasks

**Adding a new feature:**
1. Update database schema (if needed)
2. Create/update GraphQL schema
3. Implement resolvers with permission checks
4. Create UI components with role-based visibility
5. Test with all user roles
6. Update documentation
7. Deploy via standard release process

**Fixing a bug:**
1. Reproduce the issue
2. Identify root cause
3. Implement fix
4. Test fix with all affected roles
5. Document the fix in CHANGELOG.md
6. Deploy via quick patch or standard release

**Deploying to production:**
1. Test in development (centos1)
2. Deploy to staging: `./deploy-to-stage.sh` (centos2)
3. Verify staging works correctly
4. Deploy to production: `./deploy-to-production.sh` (dapoc)
5. Monitor logs: `ssh root@dapoc "sudo -u dap pm2 logs"`
6. Verify all roles work correctly
7. Update CONTEXT.md if needed

### Critical Paths

**Authentication Flow:**
`frontend/src/lib/auth.tsx` → `backend/src/lib/auth.ts` → JWT validation

**Permission Check:**
`backend/src/lib/permissions.ts::checkUserPermission` → Database lookup → Role/permission check

**Task Status Update:**
`frontend/src/components/CustomerAdoptionPanelV4.tsx` → `backend/src/schema/resolvers/customerAdoption.ts` → Database

**Menu Visibility:**
`frontend/src/components/MenuBar.tsx` → User role check → Conditional rendering

**AI Agent Query Processing:**
`frontend/src/components/AIChat.tsx` → GraphQL `askAI` → `backend/src/services/ai/AIAgentService.ts` → `QueryTemplates.findBestMatch()` (fast path) OR `LLMProvider` (slow path) → `QueryExecutor` → Prisma → Database

### AI Agent Prisma Query Patterns

**IMPORTANT: When writing Prisma queries for the AI Agent:**

```javascript
// To find records WITH related items:
{ relation: { some: {} } }

// To find records WITHOUT related items (empty relation):
{ NOT: { relation: { some: {} } } }

// NEVER use this (doesn't work correctly):
{ relation: { none: {} } }  // ❌ WRONG

// For partial name matching:
{ name: { contains: "search term", mode: "insensitive" } }
```

### Terminology Reference

| Term | Equivalent Term | Description |
|------|----------------|-------------|
| Product Assignment | Product Adoption Plan | A product assigned to a customer with tracked progress |
| Solution Assignment | Solution Adoption Plan | A solution assigned to a customer with tracked progress |
| CustomerProduct | Product Assignment/Adoption Plan | Database table for product-customer relationship |
| CustomerSolution | Solution Assignment/Adoption Plan | Database table for solution-customer relationship |

---

## Support & Resources

### Documentation
- **This Context**: `/data/dap/CONTEXT.md`
- **Architecture**: `/data/dap/docs/ARCHITECTURE.md`
- **Deployment**: `/data/dap/deploy/RELEASE_PROCESS.md`
- **Password Security**: `/data/dap/PASSWORD_SECURITY_BACKUPS.md`

### Access
- **DEV**: http://dev.rajarora.csslab/dap/ (centos1)
- **STAGING**: http://stage.rajarora.csslab/dap/ (or centos2.rajarora.csslab) 
- **PRODUCTION**: https://dapoc.cisco.com/dap/ (SSL enabled)
- **GraphQL Playground**: http://localhost:4000/graphql (dev only)

### Default Credentials
- **Admin**: admin / admin
- **Users**: *(username)* / DAP123

### Deployment Scripts
- `./deploy-to-stage.sh` - Deploy to staging (centos2)
- `./deploy-to-production.sh` - Deploy to production (dapoc)
- `./dap` - Local development management script

### Key People
- **Developer**: AI Assistant + Human Operator
- **SSH User**: rajarora (staging), root (production)
- **App User**: dap (staging/production)

---

**Last Updated:** December 18, 2025  
**Version:** 2.7.0  
**Status:** Production Ready (SSL Enabled)

*This document should be updated whenever significant changes are made to the application.*
