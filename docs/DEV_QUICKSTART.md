# DAP Development Quick Start

Quick reference for daily development workflow across all environments.

## The `./dap` Script (Unified)

The `./dap` script works on **all environments** and auto-detects which mode to use:

| Environment | Auto-detected Mode | How Detected |
|-------------|-------------------|--------------|
| MacBook | `mac-demo` | OS = Darwin |
| centos1 | `linux-dev` | Hostname contains "centos1" |
| centos2 | `production` | Hostname contains "centos2" |
| dapoc | `production` | Hostname contains "dapoc" |

### All Available Commands

```bash
# Basic lifecycle
./dap start              # Start all services
./dap stop               # Stop all services
./dap restart            # Restart all services
./dap status             # Show status

# Database management
./dap reset              # Reset database with demo data
./dap migrate            # Run database migrations
./dap restart-db         # Restart PostgreSQL (clears connections)

# Selective restart
./dap restart backend    # Restart backend only
./dap restart frontend   # Restart frontend only
./dap restart-devtools   # Restart devtools service

# Rebuild (preserves data)
./dap rebuild            # Rebuild frontend + backend
./dap rebuild backend    # Rebuild backend only
./dap rebuild frontend   # Rebuild frontend only

# Data management
./dap add-sample         # Add sample data (preserves existing)
./dap reset-sample       # Remove sample data only
./dap clean-restart      # ⚠️ WIPES ALL DATA

# Testing
./dap test               # Run comprehensive E2E tests
./dap unit-test          # Run unit tests

# Development mode (interactive)
./dap dev                # Start in dev mode with live logs

# Help
./dap help               # Show all commands
```

---

## Environment Overview

| Environment | Host | URL | Start Command |
|-------------|------|-----|---------------|
| **MACDEV** | MacBook (local) | http://localhost:5173 | `./dap start` |
| **LINUXDEV** | centos1 | http://centos1.rajarora.csslab:5173 | `./dap start` |
| **STAGE** | centos2 | http://centos2.rajarora.csslab/dap/ | `./deploy-to-stage.sh` |
| **PROD** | dapoc | https://dapoc.cisco.com/dap/ | `./deploy-to-production.sh` |

---

## Configuration Model

DAP uses a **single `.env.example` template** with environment-specific customization:

```
.env.example  →  .env  →  backend/.env
   (template)   (your config)  (synced)
```

**Initial Setup (any environment):**

```bash
# 1. Copy template to create your .env
cp .env.example .env

# 2. Edit .env for your environment (see docs/ENVIRONMENT_MANAGEMENT.md)

# 3. Start
./dap start
```

**For complete configuration details, see:** `docs/ENVIRONMENT_MANAGEMENT.md`

---

## MacBook Development (Primary)

### Daily Workflow

```bash
# Start the development stack
./dap start

# Check status
./dap status

# Stop when done
./dap stop

# Restart (rebuilds everything)
./dap restart

# Reset database with demo data
./dap reset
```

### What `./dap start` Does

1. ✅ Syncs `.env` → `backend/.env`
2. ✅ Starts PostgreSQL (via Homebrew)
3. ✅ Runs database migrations
4. ✅ Builds backend (production mode)
5. ✅ Builds frontend with `VITE_BASE_PATH=/`
6. ✅ Starts backend on port 4000
7. ✅ Starts frontend on port 5173

### Troubleshooting MacBook

**App not loading?**

```bash
# Check status first
./dap status

# If something is stuck, stop and restart
./dap stop
./dap start

# Check logs
tail -50 backend.log
tail -50 tmp/mac-frontend.log
```

**Database issues?**

```bash
# Reset database
./dap reset

# Or manually check PostgreSQL
brew services list | grep postgres
pg_isready -h localhost -p 5432
```

---

## CentOS1 Development (Shared Dev)

```bash
# SSH to centos1
ssh rajarora@centos1.rajarora.csslab

# Navigate to project
cd /data/dap

# Start (uses Docker for PostgreSQL)
./dap start

# Access at http://centos1.rajarora.csslab:5173
```

---

## Deploying to Stage (CentOS2)

```bash
# SSH to centos1 (deploy FROM centos1, not MacBook)
ssh rajarora@centos1.rajarora.csslab
cd /data/dap

# Make sure code is up to date
git pull

# Deploy to stage
./deploy-to-stage.sh

# Verify: http://centos2.rajarora.csslab/dap/
```

---

## Deploying to Production (DAPOC)

> ⚠️ **ONLY deploy after verifying on Stage!**

```bash
# SSH to centos1
ssh rajarora@centos1.rajarora.csslab
cd /data/dap

# Make sure you've tested on Stage first!
./deploy-to-production.sh

# Verify: https://dapoc.cisco.com/dap/
```

### Production Rollback

```bash
# On dapoc server
ssh root@dapoc
cd /data/dap/app

# Restore from backup
tar xzf /tmp/dap-backend-backup-YYYYMMDD-HHMMSS.tar.gz

# Restart
sudo -u dap pm2 restart all
```

---

## Configuration Quick Reference

| Environment | NODE_ENV | VITE_BASE_PATH | SHOW_DEV_MENU | Database |
|-------------|----------|----------------|---------------|----------|
| Mac Demo | production | `/` | false | Homebrew PostgreSQL |
| Linux Dev | development | `/dap/` | true | Docker PostgreSQL |
| Stage | production | `/dap/` | false | Systemd PostgreSQL |
| Production | production | `/dap/` | false | Systemd PostgreSQL |

**Key `.env` variables to customize:**

```bash
NODE_ENV=production|development
DATABASE_URL=postgresql://user:pass@localhost:5432/dap
JWT_SECRET=your-secret-at-least-32-characters
VITE_BASE_PATH=/|/dap/
SHOW_DEV_MENU=true|false
```

---

## Quick Health Checks

```bash
# Backend
curl -s http://localhost:4000/health | jq .

# GraphQL
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | jq .

# Frontend
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173
```

---

## Default Credentials (Demo Data)

| User | Password | Role |
|------|----------|------|
| admin | DAP123!!! | Administrator |
| smeuser | DAP123 | SME User |
| cssuser | DAP123 | CSS User |

Use `./dap reset` to reset database with demo data and these users.

---

## Related Documentation

- **Environment Management:** `docs/ENVIRONMENT_MANAGEMENT.md` ⭐
- **Local Development:** `docs/DEV_CONTEXT_LOCAL.md`
- **Deployment:** `docs/deployment/DEPLOYMENT_INDEX.md`
