# Local Development Context

**Updated:** December 22, 2025  
**Purpose:** Cross-platform development, deployment, and environment-specific configurations.

---

## Environment Overview

| Environment | Platform | Mode | URL | Database |
|------------|----------|------|-----|----------|
| **MacBook** | macOS (Darwin) | `mac-demo` | http://localhost:5173 | Homebrew PostgreSQL |
| **centos1** | Linux | `linux-dev` | http://centos1:5173 | Docker PostgreSQL |
| **centos2** | Linux | `production` | http://centos2/dap/ | Systemd PostgreSQL |
| **dapoc** | RHEL 9 | `production` | https://myapps.cxsaaslab.com/dap/ | Systemd PostgreSQL |

---

## Configuration Model

DAP uses a **single `.env.example` template** with **Zod runtime validation**:

```
.env.example  →  .env  →  backend/.env
   (template)   (your config)  (synced)
```

**Key Files:**

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.example` | Template with all variables documented | ✅ Committed |
| `.env` | Your active configuration | ❌ Gitignored |
| `backend/.env` | Synced copy for backend | ❌ Gitignored |

**For complete configuration details, see:** `docs/ENVIRONMENT_MANAGEMENT.md`

---

## Unified `./dap` Script

The main `./dap` script automatically detects the environment and runs the appropriate mode:

```bash
# Auto-detection logic:
# 1. macOS (Darwin) → mac-demo mode
# 2. Hostname contains "centos2" or "dapoc" → production mode (delegates to ./dap-prod)
# 3. Otherwise → linux-dev mode
```

### Overriding Mode

```bash
DAP_MODE=mac-demo ./dap start     # Force Mac demo mode
DAP_MODE=linux-dev ./dap start    # Force development mode
DAP_MODE=production ./dap start   # Force production mode (uses dap-prod)
```

---

## Mac Demo Environment

### Purpose

Minimal footprint for fast offline demos. Uses local PostgreSQL (Homebrew), no Docker required.

### Initial Setup

```bash
# 1. Copy template to create your .env
cp .env.example .env

# 2. Edit .env with Mac-specific settings:
#    - DATABASE_URL: Use your macOS username (Homebrew Postgres peer auth)
#    - NODE_ENV: production
#    - VITE_BASE_PATH: /
#    - SHOW_DEV_MENU: false

# 3. Start (handles everything automatically)
./dap start
```

### Key Configuration

```bash
# In .env:
NODE_ENV=production
DATABASE_URL=postgresql://<your-mac-username>@localhost:5432/dap?schema=public&connection_limit=5
VITE_BASE_PATH=/
SHOW_DEV_MENU=false
VITE_SHOW_DEV_MENU=false
```

### Mac Demo Workflow

**Prerequisites:**
- Node.js 22+ installed
- Homebrew (for auto-installing PostgreSQL if needed)
- **NO Docker required** - uses local PostgreSQL

**Start:**

```bash
./dap start              # auto-detected on macOS
```

This command:
1. Syncs `.env` to `backend/.env`
2. Ensures PostgreSQL is installed and running (via Homebrew)
   - Auto-detects installed version (14, 15, or 16)
   - Cleans up stale lock files if PostgreSQL fails to start
3. Creates `dap` database if it doesn't exist
4. Runs migrations
5. Builds backend/frontend in production mode
6. Starts backend (port 4000) and frontend preview (port 5173)

**Stop/Status/Restart:**

```bash
./dap stop
./dap status
./dap restart
```

**Reset Database:**

```bash
./dap reset              # Reseeds with demo data
```

This command:
1. Drops and recreates the `dap` database
2. Runs migrations
3. Executes `seed-light-demo.ts` to create demo users

### Demo Users (Mac)

| User | Password | Role |
|------|----------|------|
| admin | DAP123!!! | Administrator |
| smeuser | DAP123 | SME User |
| cssuser | DAP123 | CSS User |

**Run Tests:**

```bash
./dap test               # Uses local PostgreSQL, creates dap_test database
```

### Dataset Footprint

10 products, 2 solutions, 2 customers, 10 product adoption plans, 2 solution plans, 3 users (admin/sme/css), 3 roles.

### Backups on Mac Demo

Keep at most 1–2 snapshots if needed; default flow does not auto-backup.

---

## CentOS1 Development Environment

### Purpose

Full development toolkit with hot reload, dev data, and Docker-based PostgreSQL.

### Initial Setup

```bash
# 1. Copy template
cp .env.example .env

# 2. Edit .env with development settings:
#    - DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dap
#    - NODE_ENV: development
#    - VITE_BASE_PATH: /dap/
#    - SHOW_DEV_MENU: true
```

### Key Configuration

```bash
# In .env:
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dap?schema=public
VITE_BASE_PATH=/dap/
SHOW_DEV_MENU=true
VITE_SHOW_DEV_MENU=true
GRAPHQL_PLAYGROUND=true
```

### Development Workflow

```bash
./dap start              # auto-detected on centos1
./dap stop
./dap restart
./dap test               # Uses Docker-based PostgreSQL
./dap add-sample         # Add sample data
./dap reset-sample       # Reset sample data
```

### Features

- Full Development Toolkit visible (SHOW_DEV_MENU=true)
- Hot reload enabled
- Rich dataset (Cisco sample, telemetry, dev tools)
- Docker-based PostgreSQL

---

## CentOS2 / Stage Environment

### Purpose

Pre-production testing. No development toolkit, production-like settings.

### Key Configuration

```bash
# In .env on centos2:
NODE_ENV=production
DATABASE_URL=postgresql://dap:secure-stage-password@localhost:5432/dap?schema=public&connection_limit=20
VITE_BASE_PATH=/dap/
CORS_ORIGIN=http://centos2.rajarora.csslab
SHOW_DEV_MENU=false
GRAPHQL_PLAYGROUND=false
RATE_LIMIT_ENABLED=true
```

### Deployment

When `./dap` detects hostname contains "centos2", it automatically delegates to `./dap-prod`:

```bash
./dap start              # Starts PostgreSQL + PM2 processes
./dap restart            # Runs ./dap-prod restart
./dap status             # Runs ./dap-prod status
./dap logs               # Runs ./dap-prod logs
```

---

## DAPOC / Production Environment

### Purpose

Live production deployment. Maximum security, no dev features.

### Storage Locations

All DAP data is stored on the `/data` partition (not root):

| Component | Location |
|-----------|----------|
| **DAP User Home** | `/data/dap` |
| **Application Code** | `/data/dap/app` |
| **PM2 Home** | `/data/dap/.pm2` |
| **PM2/App Logs** | `/data/dap/logs` |
| **NPM Cache** | `/data/dap/.npm` |
| **Backups** | `/data/dap/backups` |
| **PostgreSQL Data** | `/data/pgsql/16/data` |

### Key Configuration

```bash
# In .env on dapoc:
NODE_ENV=production
DATABASE_URL=postgresql://dap:STRONG-PRODUCTION-PASSWORD@localhost:5432/dap?schema=public&connection_limit=50
JWT_SECRET=UNIQUE-PRODUCTION-SECRET-64-CHARS-RECOMMENDED
VITE_BASE_PATH=/dap/
CORS_ORIGIN=https://myapps.cxsaaslab.com
SHOW_DEV_MENU=false
GRAPHQL_PLAYGROUND=false
APOLLO_INTROSPECTION=false
DEVTOOLS_ENABLED=false
RATE_LIMIT_ENABLED=true
```

### Production Commands

```bash
./dap-prod start             # Start PostgreSQL + all PM2 processes
./dap-prod restart           # Restart all services
./dap-prod restart-backend   # Restart backend only
./dap-prod restart-db        # Restart PostgreSQL
./dap-prod status            # Show status
./dap-prod logs              # View logs
./dap-prod logs backend      # View backend logs only
```

### Production Guardrails

- Uses PM2 for process management
- Uses systemd PostgreSQL service
- **`./dap start` automatically starts PostgreSQL** if not running
- No development toolkit visible
- Follow `deploy/README.md` for deployments

---

## Environment Differences Summary

| Setting | Mac Demo | CentOS1 Dev | Stage/Prod |
|---------|----------|-------------|------------|
| `NODE_ENV` | production | development | production |
| `SHOW_DEV_MENU` | false | true | false |
| `VITE_BASE_PATH` | `/` | `/dap/` | `/dap/` |
| `GRAPHQL_PLAYGROUND` | true | true | false |
| `RATE_LIMIT_ENABLED` | false | false | true |
| Database | Homebrew PostgreSQL | Docker PostgreSQL | Systemd PostgreSQL |
| Docker Required | No | Yes | No |

---

## Tab Order (UI)

Tabs in Products and Solutions pages are ordered consistently across all environments:

- Products Page: Outcomes → Releases → Licenses → Custom Attributes → **Tasks** (last)
- Solutions Page: Products → Outcomes → Releases → Custom Attributes → **Tasks** (last)

---

## Quick Reference

| Action | Mac | centos1 (Dev) | centos2/dapoc (Prod) |
|--------|-----|---------------|----------------------|
| Start | `./dap start` | `./dap start` | `./dap start` or `./dap-prod start` |
| Stop | `./dap stop` | `./dap stop` | `./dap stop` or `./dap-prod stop` |
| Restart | `./dap restart` | `./dap restart` | `./dap restart` or `./dap-prod restart` |
| Status | `./dap status` | `./dap status` | `./dap status` or `./dap-prod status` |
| Test | `./dap test` | `./dap test` | N/A |
| Reset DB | `./dap reset` | `./dap reset-sample` | N/A |

---

## Related Documentation

- **Environment Variables:** `docs/ENVIRONMENT_MANAGEMENT.md` ⭐
- **Quick Start:** `docs/DEV_QUICKSTART.md`
- **Deployment:** `docs/deployment/DEPLOYMENT_INDEX.md`
- **Mac Deploy Script:** `scripts/mac-light-deploy.sh`
- **Seed Script:** `backend/scripts/seed-light-demo.ts`
