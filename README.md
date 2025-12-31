# DAP (Digital Adoption Platform)

**Version:** 2.2.2 | **Status:** ✅ Production Ready | **Last Updated:** December 3, 2025

Production-ready customer adoption and product management platform with Excel import/export, telemetry tracking, and solution bundling.

## 🌐 Access

**Development:** http://dev.rajarora.csslab/dap/  
**Production:** https://myapps.cxsaaslab.com/dap/

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
- **Backup & Restore**: Full database backup and restore capabilities with production reliability (podman fallback)

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

### 📚 Complete Documentation Index

**[📖 DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Your central hub for all DAP documentation

The Documentation Index provides a comprehensive, categorized list of all documentation with quick navigation to:
- Getting Started guides
- User guides and features
- Technical documentation
- Deployment guides
- Development resources
- Operations and troubleshooting

### 🎯 Quick Links

- **[Quick Start](QUICK_START.md)** - Get started in minutes
- **[Developer Manual](docs/DEVELOPER.md)** - Complete guide for developers ⭐
- **[Context Document](CONTEXT.md)** - Comprehensive app overview (AI assistants & developers)
- **[Quality Standards](docs/QUALITY_STANDARDS.md)** - Maintain 100/100 architecture score
- **[API Reference](docs/API_REFERENCE.md)** - GraphQL API documentation
- **[Features](docs/FEATURES.md)** - Complete feature list
- **[Architecture](docs/ARCHITECTURE.md)** - System design
- **[Deployment Guide](deploy/README.md)** - Production deployment
- **[Security Policy](SECURITY.md)** - Security guidelines & vulnerability reporting
- **[Contributing](docs/CONTRIBUTING.md)** - Contribution guidelines

### 📖 Full Documentation

For a complete, categorized list of all documentation, see **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)**.

## Development

### Project Structure

```
/data/dap/
├── frontend/           # React application
│   └── src/
│       ├── features/   # Feature modules (Domain-Driven)
│       ├── shared/     # Shared components & utils
│       ├── pages/      # Main application pages
│       └── providers/  # Context providers
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

### Deploying to Production

To deploy changes to the production server (`centos2`):

```bash
./deploy-to-production.sh
```

This script:
1. Builds frontend and backend locally
2. Transfers files to production server
3. Restarts services (Nginx, Backend via PM2)

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
