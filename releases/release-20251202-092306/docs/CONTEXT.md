# DAP Application - Complete Context Document

**Version:** 2.1.1  
**Last Updated:** December 1, 2025  
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
DAP is a customer adoption tracking system where **Products** are defined with custom attributes, license levels (Essential, Advantage, Signature), outcomes (business goals), and releases (version-specific features), each containing implementation **Tasks** with attributes like name, description, estimated minutes, weight, how-to documentation/video links, and **telemetry attributes** with configurable success criteria (supporting Boolean, Number, String, Timestamp, or JSON data types with complex AND/OR logic); products can be bundled into **Solutions** which aggregate multiple products with solution-level tasks; **Customers** are assigned products or solutions, which generates customized **Adoption Plans** that are filtered snapshots of tasks based on the selected license level, outcomes, and releases; adoption progress is tracked through task statuses (NOT_STARTED, IN_PROGRESS, DONE/COMPLETED, NOT_APPLICABLE, NO_LONGER_USING) that can be updated either **manually** by users (which takes precedence) or **automatically via telemetry** when success criteria are met, with progress calculated by weighted completion (not simple task count), comprehensive audit trails tracking who/how/when status changes occurred (MANUAL, TELEMETRY, IMPORT, or SYSTEM), and the ability to sync adoption plans when underlying products/solutions are updated while preserving customer-specific customizations and status overrides.

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
- **Web Server:** Apache httpd (development) or Nginx (production)
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

### 7. Advanced Features
- Drag-and-drop task reordering
- Real-time progress calculation
- Audit logging
- Change tracking
- Search and filtering
- Theme customization (light/dark mode)

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

| Environment | Server | URL | Purpose |
|------------|--------|-----|---------|
| **DEV** | centos1.rajarora.csslab | http://dev.rajarora.csslab/dap/ | Development & Testing |
| **PROD** | centos2.rajarora.csslab | https://myapps.cxsaaslab.com/dap/ | Production |

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

### Local Development Setup

```bash
# 1. Clone repository
cd /data/dap

# 2. Setup database (Podman)
podman run --name dap_db \
  -e POSTGRES_DB=dap \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 \
  -d postgres:16

# 3. Backend setup
cd backend
npm install
cp .env.example .env  # Edit with your settings
npx prisma migrate deploy
npx prisma generate
npm run seed  # Optional: add sample data
npm start

# 4. Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# 5. Access
# Frontend: http://localhost:5173
# Backend: http://localhost:4000/graphql
```

### Making Changes

1. **Backend Changes:**
   - Edit files in `backend/src/`
   - Server auto-restarts (nodemon)
   - Run migrations if schema changes

2. **Frontend Changes:**
   - Edit files in `frontend/src/`
   - Hot module reload enabled
   - Changes appear immediately

3. **Database Schema:**
   - Edit `backend/prisma/schema.prisma`
   - Run `npx prisma migrate dev --name description`
   - Run `npx prisma generate`

### Testing

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

---

## Recent Changes & Fixes

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
1. Test in development
2. Create release package (./deploy/create-release.sh)
3. Deploy (./deploy/release-to-prod.sh)
4. Monitor logs
5. Verify all roles work correctly
6. Update CONTEXT.md if needed

### Critical Paths

**Authentication Flow:**
`frontend/src/lib/auth.tsx` → `backend/src/lib/auth.ts` → JWT validation

**Permission Check:**
`backend/src/lib/permissions.ts::checkUserPermission` → Database lookup → Role/permission check

**Task Status Update:**
`frontend/src/components/CustomerAdoptionPanelV4.tsx` → `backend/src/schema/resolvers/customerAdoption.ts` → Database

**Menu Visibility:**
`frontend/src/components/MenuBar.tsx` → User role check → Conditional rendering

---

## Support & Resources

### Documentation
- **This Context**: `/data/dap/CONTEXT.md`
- **Architecture**: `/data/dap/docs/ARCHITECTURE.md`
- **Deployment**: `/data/dap/deploy/RELEASE_PROCESS.md`
- **Password Security**: `/data/dap/PASSWORD_SECURITY_BACKUPS.md`

### Access
- **DEV**: http://dev.rajarora.csslab/dap/
- **PROD**: https://myapps.cxsaaslab.com/dap/
- **GraphQL Playground**: http://localhost:4000/graphql (dev only)

### Key People
- **Developer**: AI Assistant + Human Operator
- **SSH User**: rajarora
- **App User**: dap (production)

---

**Last Updated:** December 1, 2025  
**Version:** 2.1.1  
**Status:** Production Ready

*This document should be updated whenever significant changes are made to the application.*
