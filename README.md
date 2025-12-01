# DAP (Digital Adoption Platform)

**Version:** 2.1.0 | **Status:** ✅ Production Ready | **Last Updated:** November 30, 2025

Production-ready customer adoption and product management platform with Excel import/export, telemetry tracking, and solution bundling.

## 🌐 Access

**Development:** http://myapps.cxsaaslab.com/dap/  
**Production:** http://prod.rajarora.csslab/dap/  

**Default Login:** `admin` / `DAP123` (change on first login)

## Overview

DAP helps organizations manage product adoption through structured implementation plans. The platform includes customer adoption tracking, product/solution management, telemetry integration, and comprehensive Excel-based workflows.

### Key Features

- **Customer Adoption Planning**: Create customized implementation roadmaps with progress tracking
- **Product & Solution Management**: Organize products into solutions with hierarchical task management
- **Task Management**: Tasks with weights, license levels, documentation links, and telemetry attributes
- **Multi-Sheet Excel Workflow**: Import/export products, tasks, licenses, releases, outcomes, and telemetry
- **Telemetry Integration**: Task-level telemetry with success criteria tracking and automatic status updates
- **Solution Bundles**: Group products into solutions with unified adoption plans and progress tracking

## Technology Stack

- **Frontend**: React 19 + TypeScript, Vite, Material-UI, Apollo Client, DnD Kit
- **Backend**: Node.js, Apollo Server, Express 5, Prisma ORM, GraphQL
- **Database**: PostgreSQL with Prisma migrations
- **Tools**: Docker Compose, `./dap` management script

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Docker / Docker Compose (or Podman with Docker compatibility)

### Launch Application

```bash
cd /data/dap

# Start all services
./dap start

# Fresh start with sample data
./dap clean-restart

# Access the application
# Frontend: http://localhost:5173
# GraphQL API: http://localhost:4000/graphql
```

### Available Commands

```bash
./dap start              # Start all services
./dap stop               # Stop all services
./dap restart            # Restart services (keeps data)
./dap clean-restart      # Full refresh with sample data
./dap status             # Check service health
./dap add-sample         # Add sample data
./dap reset-sample       # Remove sample data (preserves user data)
./dap test               # Run tests
```

## Application Structure

### Main Sections

1. **Products**: Manage products with tasks, licenses, outcomes, and releases
2. **Solutions**: Bundle products into solutions with unified adoption tracking
3. **Customers**: Assign products/solutions and track adoption progress

### Workflow

1. Create products with associated tasks, licenses, outcomes, and releases
2. Optionally bundle products into solutions
3. Assign products or solutions to customers
4. Create adoption plans with task filtering by license/outcome/release
5. Track progress through task completion and telemetry
6. Export/import data via Excel for bulk updates

## Key Concepts

### Products
- Atomic units with tasks, licenses, outcomes, releases, and custom attributes
- Tasks can have weights, resources (docs/videos), and telemetry attributes
- License levels: Essential, Advantage, Signature

### Solutions
- Bundles of products with solution-level tasks
- Unified adoption plans that aggregate product progress
- Automatic product assignment when solution is assigned to customer

### Adoption Plans
- Customized implementation roadmaps for customers
- Tasks filtered by license level, selected outcomes, and releases
- Progress calculated by weight (not task count)
- Tasks marked as "Not Applicable" excluded from progress

### Telemetry
- Task-level attributes with success criteria
- Automatic status updates when criteria are met
- Import via Excel templates
- Manual status updates take precedence

## Documentation

### 📚 Quick Links

- **[Documentation Index](DOCUMENTATION_INDEX.md)** - Complete documentation catalog
- **[Context Document](CONTEXT.md)** - Comprehensive app overview (AI assistants & developers)
- **[Quick Start Guide](QUICK_START.md)** - Get started in minutes
- **[Deployment Guide](DEPLOYMENT_COMPLETE_GUIDE.md)** - All deployment scenarios
- **[Production Deployment](deploy/README.md)** - Production-specific deployment

### 🔍 By Topic

**Getting Started:**
- [Quick Start](QUICK_START.md) - Fast setup
- [Context](CONTEXT.md) - Complete overview
- [Features](docs/FEATURES.md) - Feature list

**Deployment:**
- [Complete Deployment Guide](DEPLOYMENT_COMPLETE_GUIDE.md) - Master guide
- [Production Deployment](deploy/README.md) - Production specifics
- [Apache Deployment](APACHE_DEPLOYMENT_QUICKSTART.md) - Apache setup
- [Latest Deployment](PRODUCTION_DEPLOYMENT_SUMMARY.md) - Current status

**Technical:**
- [Architecture](docs/ARCHITECTURE.md) - System design
- [Technical Docs](docs/TECHNICAL-DOCUMENTATION.md) - API details
- [Authentication](docs/AUTH_IMPLEMENTATION_SUMMARY.md) - Auth system

**Operations:**
- [Backup & Restore](AUTO_BACKUP_FEATURE.md) - Automated backups
- [Troubleshooting](CLIENT_TROUBLESHOOTING.md) - Common issues
- [Recovery Guide](RECOVERY_GUIDE.md) - Disaster recovery

**📖 Full documentation:** See [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

## Development

### Project Structure

```
/data/dap/
├── frontend/           # React application
│   └── src/
│       ├── components/ # UI components
│       ├── pages/      # Main application pages
│       └── graphql/    # GraphQL queries/mutations
├── backend/            # Node.js GraphQL API
│   └── src/
│       ├── schema/     # GraphQL schema and resolvers
│       ├── services/   # Business logic
│       └── lib/        # Utilities
├── config/             # Environment-specific configs
├── docs/               # Additional documentation
└── dap                 # Management script
```

### Database Migrations

```bash
cd backend
npx prisma migrate dev      # Create new migration
npx prisma migrate deploy   # Apply migrations (production)
npx prisma generate         # Regenerate Prisma client
```

### Building for Production

```bash
cd frontend
npm run build

cd ../backend
npm run build
```

## Troubleshooting

### Services Won't Start
```bash
./dap stop
./dap clean-restart
```

### Database Issues
```bash
# Reset database with fresh sample data
./dap clean-restart

# Check database connection
docker exec dap_db_1 psql -U postgres -d dap -c "\dt"
```

### Port Conflicts
- Frontend: Port 5173
- Backend: Port 4000
- Database: Port 5432

Check if ports are in use:
```bash
lsof -i :5173
lsof -i :4000
lsof -i :5432
```

### Cache Issues
- Clear browser cache (Ctrl+Shift+R)
- Restart services: `./dap restart`

## Support

For issues or questions:
1. Check [QUICK_START.md](QUICK_START.md) for common solutions
2. Review [docs/TECHNICAL-DOCUMENTATION.md](docs/TECHNICAL-DOCUMENTATION.md) for API details
3. Check logs: `frontend.log` and `backend.log`

## License

Proprietary - Internal Use Only
