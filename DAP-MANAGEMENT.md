# DAP Application Management

## ✅ Simplified Workflow

**All scripts have been consolidated into one:** `./dap`

### Quick Start
```bash
# Start application for daily development
./dap start

# Clean restart with fresh sample data (fixes GUI showing old data)
./dap clean-restart

# Check what's running
./dap status

# Stop everything
./dap stop
```

### Commands
- `./dap start` – Start all services (database, backend, frontend)
- `./dap stop` – Stop all services cleanly
- `./dap restart` – Restart all services (keeps existing data)
- `./dap clean-restart` – Stop, wipe data, reseed the enhanced sample dataset
- `./dap add-sample` – Add the enhanced sample dataset without touching existing data
- `./dap reset-sample` – Remove only sample data, keep user-created content
- `./dap status` – Show status of all components and record counts
- `./dap test` – Run the end-to-end validation workflow
- `./dap help` – Show detailed help

### What It Manages
- **PostgreSQL Database** (Docker container `dap_db_1`)
- **Backend GraphQL API** (Node.js on port 4000)
- **Frontend React App** (Vite dev server on port 5173)

### Sample Data Provided
When using `clean-restart`, you get:
- **5 comprehensive products**: E-Commerce Platform, FinTech Suite, Healthcare Ecosystem, Logistics Optimizer, EdTech Platform
- **20 telemetry-enabled tasks**: Four per product with documentation links, releases, outcomes, and license requirements
- **Complete relationships**: Licenses, outcomes, releases, and customers wired to each product
- **Clean database**: All prior data removed before seeding

### Browser Cache Issues
If the GUI shows old data after restart:
1. Use `./dap clean-restart` (not just `restart`)
2. Press **Ctrl+Shift+R** for hard refresh
3. Or open a private/incognito window

## 🗂️ Legacy Scripts
All historical shell helpers and ad-hoc utilities have been removed from the repository as of October 2025. The `./dap` script now encapsulates every supported workflow, so there is no longer a `scripts-archive/` folder to maintain.

**Use `./dap` for everything now!**

## 🚀 Development Workflow
1. `./dap start` - Begin development session
2. Code changes are auto-reloaded
3. `./dap status` - Check if everything is running
4. `./dap stop` - End development session

For GUI showing old data issues: `./dap clean-restart`