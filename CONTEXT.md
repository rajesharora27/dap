# DAP Application - Complete Context Document

**Version:** 2.1.0  
**Last Updated:** November 30, 2025  
**Purpose:** Comprehensive context for AI assistants and developers

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [System Architecture](#system-architecture)
3. [Core Domain Model](#core-domain-model)
4. [Key Features](#key-features)
5. [Technology Stack](#technology-stack)
6. [Deployment Configuration](#deployment-configuration)
7. [Database Schema](#database-schema)
8. [Authentication & Authorization](#authentication--authorization)
9. [Recent Changes & Fixes](#recent-changes--fixes)
10. [Known Issues & Limitations](#known-issues--limitations)
11. [Development Workflow](#development-workflow)
12. [Production Environment](#production-environment)

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
- **Web Server:** Apache httpd (production) or Nginx
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

### 4. Authentication & Authorization
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

## Technology Stack Details

### Frontend Dependencies (Key)
```json
{
  "@apollo/client": "^3.11.11",
  "@mui/material": "^6.3.0",
  "react": "^19.0.0",
  "react-router-dom": "^7.1.0",
  "vite": "^7.1.2",
  "@dnd-kit/core": "^6.3.1"
}
```

### Backend Dependencies (Key)
```json
{
  "@apollo/server": "^4.11.3",
  "@prisma/client": "6.14.0",
  "express": "^5.0.1",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "exceljs": "^4.4.0",
  "node-cron": "^3.0.3"
}
```

### Database
- **PostgreSQL 16** with Prisma ORM
- Connection pooling enabled
- Migrations managed via Prisma
- Schema: `backend/prisma/schema.prisma`

---

## Deployment Configuration

### Development Environment (centos1 - 172.22.156.32)

**Purpose:** Development and testing

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:4000/graphql
- Database: localhost:5432

**Services:**
- Frontend: `npm run dev` (Vite dev server)
- Backend: `npm start` (nodemon for hot reload)
- Database: Podman container or systemd service

**Web Server:** Apache at `/dap/` subpath
- Config: `/etc/httpd/conf.d/dap.conf`
- URLs:
  - http://myapps.cxsaaslab.com/dap/
  - http://myapps.rajarora.csslab/dap/
  - http://centos1.rajarora.csslab/dap/
  - https://myapps-8321890.ztna.sse.cisco.io/dap/
  - http://172.22.156.32/dap/

### Production Environment (centos2 - 172.22.156.33)

**Purpose:** Production deployment

**Access:**
- Primary: http://prod.rajarora.csslab/dap/
- Alternative: http://172.22.156.33/dap/
- Alternative: http://centos2.rajarora.csslab/dap/

**Services:**
- Frontend: PM2 serve (port 3000)
- Backend: PM2 cluster mode - 4 instances (port 4000)
- Database: PostgreSQL 16 systemd service (port 5432)
- Web Server: Nginx reverse proxy (ports 80/443)

**Process Management:**
- PM2 with ecosystem.config.js
- Auto-restart on failure
- Log rotation
- Cluster mode for backend (load balancing)

**Deployment:**
- Script: `/data/dap/deploy/scripts/deploy-app.sh`
- Quick helper: `/data/dap/deploy/scripts/prod.sh`
- SSH user: `rajarora`
- App user: `dap`
- Directory: `/data/dap/app/`
- Backups: `/data/dap/backups/`
- Logs: `/data/dap/logs/`

**Key Commands:**
```bash
# Deploy to production
/data/dap/deploy/scripts/deploy-app.sh

# Check status
/data/dap/deploy/scripts/prod.sh status

# View logs
/data/dap/deploy/scripts/prod.sh logs

# Restart
/data/dap/deploy/scripts/prod.sh restart

# Rollback
/data/dap/deploy/scripts/release.sh rollback
```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=4000
HOST=127.0.0.1
DATABASE_URL=postgresql://user:pass@localhost:5432/dap?schema=public
TRUST_PROXY=true
ALLOWED_ORIGINS=http://prod.rajarora.csslab,http://172.22.156.33
JWT_SECRET=<secure-random-secret>
JWT_EXPIRES_IN=24h
```

#### Frontend (vite.config.ts)
```typescript
base: env.VITE_BASE_PATH || '/'  // Set to '/dap/' for Apache deployment
```

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

## Authentication & Authorization

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
System Role (ADMIN > SME > CS > USER)
  ↓
User-Specific Permissions (resource-level)
  ↓
Role-Based Permissions (organizational)
```

**Resource Types:**
- PRODUCT
- SOLUTION
- CUSTOMER
- SYSTEM

**Permission Levels:**
- READ - View only
- WRITE - Edit
- ADMIN - Full control

### Default Admin
- Username: `admin`
- Default Password: `DAP123` (must change on first login)
- Role: ADMIN
- Full system access

---

## Recent Changes & Fixes

### Version 2.1.0 (November 30, 2025)

#### Telemetry Deletion Fix
**Issue:** Deleting telemetry attributes from tasks did not persist in database  
**Resolution:** Verified atomic "delete all + create new" pattern working correctly  
**Files:**
- `frontend/src/components/telemetry/TelemetryConfiguration.tsx`
- `frontend/src/components/dialogs/TaskDialog.tsx`
- `backend/src/schema/resolvers/index.ts`

#### Auto-Backup Feature
**Added:** Daily automated backups with change detection  
**Features:**
- Scheduled daily at 1:00 AM
- Only backs up if database changes detected
- Configurable retention period (default: 7 days)
- UI controls in Settings → Backup & Restore
- Manual trigger available

**Implementation:**
- `backend/src/services/AutoBackupScheduler.ts`
- `backend/src/services/BackupRestoreService.ts`
- `frontend/src/components/BackupManagementPanel.tsx`

#### Production Deployment
**Status:** Deployed to centos2 (172.22.156.33)  
**Timestamp:** November 30, 2025 at 19:02:20 EST  
**Health:** All systems operational  
**Access:** http://prod.rajarora.csslab/dap/

### Previous Major Changes

#### Authentication System Overhaul
- JWT-based authentication
- Session management
- Per-resource permissions
- Role-based access control
- Password change enforcement

#### Telemetry Success Criteria
- AND/OR logic support
- Complex criteria evaluation
- Automatic task status updates
- Manual override capability

#### Customer Adoption Tracking
- Weighted progress calculation
- Task filtering by license/outcomes/releases
- Adoption plan sync mechanism
- Status update sources tracking

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

2. **Type Safety**
   - Some `any` types in resolvers
   - GraphQL type generation could be improved

3. **Test Coverage**
   - Limited automated tests
   - Manual testing primary method

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

```bash
# Manual testing checklist:
1. Login/logout
2. Create/edit/delete products
3. Create adoption plans
4. Update task statuses
5. Configure telemetry
6. Test backups
7. Check permissions
```

### Code Quality

```bash
# Backend linting
cd backend
npm run lint

# Frontend linting
cd frontend
npm run lint

# TypeScript compilation check
npm run build
```

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
Internet → Nginx (80/443)
            ↓
       /dap/ → Frontend (PM2: port 3000)
       /dap/graphql → Backend (PM2 cluster: port 4000)
       /dap/api → Backend
            ↓
       PostgreSQL (localhost:5432)
```

### Service Configuration

**Nginx Config:** `/etc/nginx/conf.d/dap.conf`
- Reverse proxy to frontend/backend
- Rate limiting enabled
- Gzip compression
- Security headers
- WebSocket support

**PM2 Ecosystem:** `/data/dap/app/ecosystem.config.js`
- Backend: cluster mode, 4 instances
- Frontend: fork mode, 1 instance
- Auto-restart enabled
- Log rotation configured
- Memory limits set

**Database:** PostgreSQL 16
- Service: `postgresql-16.service`
- Data: `/var/lib/pgsql/16/data`
- Backups: `/data/dap/backups`
- Daily automated backups

### Monitoring & Logs

**Application Logs:**
- Backend: `/data/dap/logs/backend.log`
- Frontend: `/data/dap/logs/frontend.log`
- PM2 logs: `sudo -u dap pm2 logs`

**System Logs:**
- Nginx access: `/var/log/nginx/access.log`
- Nginx error: `/var/log/nginx/error.log`
- PostgreSQL: `/var/lib/pgsql/16/data/log/`

**Monitoring:**
```bash
# PM2 dashboard
sudo -u dap pm2 monit

# System resources
htop

# Database connections
sudo -u dap psql -U dap -h localhost -d dap -c "SELECT count(*) FROM pg_stat_activity;"
```

### Security

**Firewall (firewalld):**
- HTTP (80) - Open
- HTTPS (443) - Open
- SSH (22) - Open (rate limited)
- PostgreSQL (5432) - Localhost only
- Backend (4000) - Localhost only

**SELinux:** Enforcing mode

**Fail2Ban:**
- SSH brute force protection
- Automatic IP banning
- Email alerts configured

**SSL/TLS:**
- Handled by ZTNA proxy (development)
- Can be configured with Let's Encrypt (production)

### Backup Strategy

**Automated:**
- Daily backup at 1:00 AM (via app)
- Only if database changes detected
- 7-day retention by default
- Configurable via UI

**Manual:**
```bash
# Create backup
/data/dap/deploy/scripts/prod.sh backup

# Restore backup
/data/dap/deploy/scripts/release.sh db-restore
```

**Deployment Backups:**
- Created before each deployment
- Located: `/data/dap/backups/deploy_<timestamp>/`
- Used for rollback if needed

---

## File Structure

```
/data/dap/
├── backend/                    # Backend Node.js application
│   ├── src/
│   │   ├── schema/            # GraphQL schema and resolvers
│   │   ├── services/          # Business logic services
│   │   ├── lib/               # Utilities and helpers
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
│   │   ├── pages/             # Page components
│   │   ├── graphql/           # GraphQL queries/mutations
│   │   └── App.tsx            # Main app component
│   ├── dist/                  # Built static files (production)
│   └── package.json
│
├── deploy/                     # Production deployment
│   ├── scripts/
│   │   ├── deploy-app.sh      # Main deployment script
│   │   ├── prod.sh            # Quick production helper
│   │   └── release.sh         # Release management
│   ├── config/
│   │   └── production.env     # Production environment template
│   └── README.md
│
├── config/                     # Configuration files
│   ├── apache-dap-subpath.conf # Apache config (development)
│   └── backend-env-apache.txt  # Backend env template
│
├── docs/                       # Technical documentation
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   ├── TECHNICAL-DOCUMENTATION.md
│   └── [various fix/feature docs]
│
├── CONTEXT.md                  # This file
├── README.md                   # Main readme
├── QUICK_START.md              # Quick start guide
├── DEPLOYMENT_GUIDE.md         # Comprehensive deployment
└── PRODUCTION_DEPLOYMENT_SUMMARY.md # Latest deployment info
```

---

## Quick Reference Commands

### Development

```bash
# Start development
cd /data/dap
./dap start          # Start all services
./dap status         # Check status
./dap clean-restart  # Fresh restart with sample data

# Database
cd /data/dap/backend
npx prisma studio    # Visual database browser
npx prisma migrate deploy  # Apply migrations
npm run seed         # Add sample data
```

### Production Deployment

```bash
# Full deployment to production
/data/dap/deploy/scripts/deploy-app.sh

# Production management
/data/dap/deploy/scripts/prod.sh status
/data/dap/deploy/scripts/prod.sh logs
/data/dap/deploy/scripts/prod.sh restart
/data/dap/deploy/scripts/prod.sh health

# Rollback if needed
/data/dap/deploy/scripts/release.sh rollback
```

### Useful GraphQL Queries

```graphql
# Get all products
query {
  products {
    id
    name
    tasks {
      id
      name
      telemetryAttributes {
        id
        name
        successCriteria
      }
    }
  }
}

# Get customer adoption plan
query {
  adoptionPlan(id: "plan-id") {
    progressPercentage
    tasks {
      name
      status
      telemetryAttributes {
        isMet
      }
    }
  }
}
```

---

## Important Notes for AI Assistants

### When Making Changes

1. **Always check this CONTEXT.md first** for current state
2. **Update CONTEXT.md** when making significant changes
3. **Test in development** before deploying to production
4. **Create backups** before major changes
5. **Update documentation** for new features

### Common Tasks

**Adding a new feature:**
1. Update database schema (if needed)
2. Create/update GraphQL schema
3. Implement resolvers (backend)
4. Create UI components (frontend)
5. Test thoroughly
6. Update documentation
7. Deploy to production

**Fixing a bug:**
1. Reproduce the issue
2. Identify root cause
3. Implement fix
4. Test fix thoroughly
5. Document the fix
6. Deploy to production
7. Update this CONTEXT.md

**Deploying to production:**
1. Ensure all changes committed
2. Test in development
3. Run deployment script
4. Monitor logs
5. Verify health checks
6. Update PRODUCTION_DEPLOYMENT_SUMMARY.md

### Critical Paths

**Authentication Flow:**
`frontend/src/lib/auth.tsx` → `backend/src/lib/auth.ts` → JWT validation

**Task Status Update:**
`frontend/src/components/CustomerAdoptionPanelV4.tsx` → `backend/src/schema/resolvers/customerAdoption.ts` → Database

**Telemetry Evaluation:**
`backend/src/services/telemetry/evaluationEngine.ts` → Success criteria check → Auto-status update

**Adoption Plan Creation:**
`backend/src/schema/resolvers/customerAdoption.ts::createAdoptionPlan` → Snapshot tasks → Apply filters

---

## Support & Resources

### Documentation
- **Main README:** `/data/dap/README.md`
- **This Context:** `/data/dap/CONTEXT.md`
- **Architecture:** `/data/dap/docs/ARCHITECTURE.md`
- **Features:** `/data/dap/docs/FEATURES.md`
- **Deployment:** `/data/dap/deploy/README.md`

### Access
- **Development:** http://myapps.cxsaaslab.com/dap/
- **Production:** http://prod.rajarora.csslab/dap/
- **GraphQL Playground:** http://localhost:4000/graphql (dev)

### Key People
- **Developer:** AI Assistant + Human Operator
- **SSH User:** rajarora
- **App User:** dap (production)

---

**Last Updated:** November 30, 2025  
**Version:** 2.1.0  
**Status:** Production Ready

*This document should be updated whenever significant changes are made to the application.*


