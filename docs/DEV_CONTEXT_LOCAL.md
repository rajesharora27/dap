## Local Development Context (Mac Demo + CentOS1 Dev + CentOS2 Prod)

**Updated:** 2025-12-17  
**Purpose:** Document cross-platform development, deployment, and environment-specific configurations.

---

## Environment Overview

| Environment | Platform | Mode | ./dap Behavior | Environment File |
|------------|----------|------|----------------|------------------|
| **MacBook** | macOS (Darwin) | `mac-demo` | Light production for demos | `.env.macbook` |
| **centos1** | Linux | `linux-dev` | Full development toolkit | `.env.development` |
| **centos2** | Linux | `production` | Production (delegates to `dap-prod`) | `.env.production` |

---

## Unified `./dap` Script

The main `./dap` script automatically detects the environment and runs the appropriate mode:

```bash
# Auto-detection logic:
# 1. macOS (Darwin) → mac-demo mode
# 2. Hostname contains "centos2" → production mode (delegates to ./dap-prod)
# 3. Hostname contains "centos1" → linux-dev mode
# 4. Default → linux-dev mode
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

### Environment File: `.env.macbook`
Located at project root. Key settings:
- `DATABASE_URL` - Local PostgreSQL (passwordless, uses macOS username)
- `NODE_ENV=production` - Production mode for realistic demo
- `SHOW_DEV_MENU=false` - Development toolkit disabled
- `GRAPHQL_PLAYGROUND=true` - GraphQL Playground enabled
- Relaxed rate limiting for demo use

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
1. Syncs `.env.macbook` to `backend/.env`
2. Ensures PostgreSQL is installed and running (via Homebrew)
   - **Auto-detects installed version** (14, 15, or 16)
   - **Cleans up stale lock files** if PostgreSQL fails to start
3. Creates `dap` database if it doesn't exist
4. Runs migrations
5. Builds backend/frontend in production mode with correct env vars:
   - `VITE_BASE_PATH=/` (assets at root)
   - `VITE_SHOW_DEV_MENU=false` (no dev toolkit)
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
- `admin` / `DAP123!!!` (Administrator)
- `smeuser` / `DAP123` (SME User)
- `cssuser` / `DAP123` (CSS User)

**Run Tests:**
```bash
./dap test               # Uses local PostgreSQL, creates dap_test database
```

### Dataset Footprint
10 products, 2 solutions, 2 customers, 10 product adoption plans, 2 solution plans, 5 users (admin/sme/css/viewer/demo), 3 roles.

### Backups on Mac demo
Keep at most 1–2 snapshots if needed; default flow does not auto-backup.

---

## CentOS1 Development Environment

### Purpose
Full development toolkit with hot reload, dev data, and Docker-based PostgreSQL.

### Environment File: `.env.development`
Located at project root.

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

## CentOS2 Production Environment

### Purpose
Clean production deployment. No development toolkit, no updating user tables/application data.

### Environment File: `.env.production`
Located at project root.

### Production Storage Locations

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

> **Note:** PostgreSQL data directory was moved from `/var/lib/pgsql/16/data` to `/data/pgsql/16/data` via systemd override (`/etc/systemd/system/postgresql-16.service.d/override.conf`).

### Production Workflow
When `./dap` detects hostname contains "centos2", it automatically delegates to `./dap-prod`:

```bash
./dap start              # Starts PostgreSQL + PM2 processes
./dap restart            # Runs ./dap-prod restart
./dap status             # Runs ./dap-prod status
./dap logs               # Runs ./dap-prod logs
```

### Direct `dap-prod` Usage
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
- **`./dap start` now automatically starts PostgreSQL** if not running
- No development toolkit visible
- Follow `deploy/README.md` for deployments

---

## Code Consistency

**The application code (frontend and backend) is the same across all environments.** Only environment variables differ:

| Setting | Mac Demo | Development | Production |
|---------|----------|-------------|------------|
| `NODE_ENV` | production | development | production |
| `SHOW_DEV_MENU` | false | true | false |
| `VITE_BASE_PATH` | `/` | `/dap/` | `/dap/` |
| Database | Local PostgreSQL | Docker PostgreSQL | Systemd PostgreSQL |
| Docker Required | No | Yes | No |

---

## Tab Order (UI)

Tabs in Products and Solutions pages are ordered consistently across all environments:
- Products Page: Outcomes → Releases → Licenses → Custom Attributes → **Tasks** (last)
- Solutions Page: Products → Outcomes → Releases → Custom Attributes → **Tasks** (last)

---

## Quick Reference

| Action | Mac | centos1 (Dev) | centos2 (Prod) |
|--------|-----|---------------|----------------|
| Start | `./dap start` | `./dap start` | `./dap start` or `./dap-prod start` |
| Stop | `./dap stop` | `./dap stop` | `./dap stop` or `./dap-prod stop` |
| Restart | `./dap restart` | `./dap restart` | `./dap restart` or `./dap-prod restart` |
| Status | `./dap status` | `./dap status` | `./dap status` or `./dap-prod status` |
| Test | `./dap test` | `./dap test` | N/A |
| Reset DB | `./dap reset` | `./dap reset-sample` | N/A |

---

## Related Files

- `.env.macbook` - Mac demo configuration
- `.env.development` - Development configuration
- `.env.production` - Production configuration
- `scripts/mac-light-deploy.sh` - Mac demo deployment script
- `dap` - Main application manager script
- `dap-prod` - Production manager script
- `backend/scripts/seed-light-demo.ts` - Mac demo seeding script

---

## Notes

- If you need the dev stack on macOS temporarily, set `DAP_MODE=linux-dev` when running `./dap`.
- The Mac demo intentionally avoids Docker and heavy tooling to keep startup fast for live demos.
- The `./dap` script unifies the CLI experience across all platforms.
- **Mac:** Auto-detects PostgreSQL version (14/15/16) and cleans stale lock files on startup failures.
- **Production:** All data stored on `/data` partition to avoid filling root filesystem.
