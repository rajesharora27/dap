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
- `./dap start` - Start all services (database, backend, frontend)
- `./dap stop` - Stop all services cleanly
- `./dap restart` - Restart all services (keeps existing data)
- `./dap clean-restart` - Fresh start with clean 3-product sample data
- `./dap status` - Show status of all components
- `./dap help` - Show detailed help

### What It Manages
- **PostgreSQL Database** (Docker container `dap_db_1`)
- **Backend GraphQL API** (Node.js on port 4000)
- **Frontend React App** (Vite dev server on port 5173)

### Sample Data Provided
When using `clean-restart`, you get:
- **3 realistic products**: E-Commerce Platform, Mobile Banking App, Healthcare CRM
- **15 meaningful tasks**: 5 per product with proper priorities and license levels
- **Clean database**: No accumulated test data

### Browser Cache Issues
If the GUI shows old data after restart:
1. Use `./dap clean-restart` (not just `restart`)
2. Press **Ctrl+Shift+R** for hard refresh
3. Or open a private/incognito window

## 🗂️ Old Scripts (Archived)
All previous scripts moved to `scripts-archive/` directory:
- ~~app-control.sh~~
- ~~cache-restart.sh~~  
- ~~cleanup-database.sh~~
- ~~sql-cleanup.sh~~
- ~~add-sample-tasks.sh~~
- ~~All scripts/* files~~

**Use `./dap` for everything now!**

## 🚀 Development Workflow
1. `./dap start` - Begin development session
2. Code changes are auto-reloaded
3. `./dap status` - Check if everything is running
4. `./dap stop` - End development session

For GUI showing old data issues: `./dap clean-restart`