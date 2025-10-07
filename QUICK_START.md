# Quick Start Guide for DAP Application

## Services Management

### Using the DAP Management Script
```bash
cd /data/dap

# Start all services
./dap start

# Stop all services  
./dap stop

# Restart all services (keeps current data)
./dap restart

# Full refresh with clean sample data
./dap clean-restart

# Sample data lifecycle
./dap add-sample
./dap reset-sample

# Health & validation
./dap status
./dap test
```

### Manual Service Management
```bash
# Start individual services
docker compose up -d db            # Database only
docker compose up -d backend       # Backend API only  
docker compose up -d frontend      # Frontend only

# Check service health
curl -s http://localhost:4000/health           # Backend health
curl -s http://localhost:5173                  # Frontend accessibility
curl -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"query{__typename}"}'
```

## Application Access

- **Frontend Application**: http://localhost:5173
- **GraphQL Playground**: http://localhost:4000/graphql
- **Backend API**: http://localhost:4000

### Default Navigation
1. **Products** (Opens to Tasks submenu by default)
   - **Tasks**: Primary work items and task management
   - **Main**: Product overview and details
   - **Licenses**: Essential/Advantage/Signature license management
   - **Outcomes**: Business outcome tracking
   - **Custom Attributes**: Additional product metadata

2. **Solutions**: Business solution packages
3. **Customers**: Customer relationship management

## Sample Data

The enhanced dataset provides:
- **5 Enterprise Products**: E-Commerce, FinTech, Healthcare, Logistics, EdTech
- **20 Fully Populated Tasks**: Four per product with telemetry, docs, releases, outcomes
- **License Levels**: Essential (Level 1), Advantage (Level 2), Signature (Level 3)
- **Outcomes & Releases**: Linked to every task for traceability
- **Custom Attributes**: Rich metadata attached to products

## Authentication

For API testing, use these authentication headers:
```bash
# Admin access (full CRUD operations)
Authorization: admin

# User access (read + limited write)
Authorization: user
```

## Common Operations

### Create a Product
```graphql
mutation {
  createProduct(input: {
    name: "My New Product"
    description: "Product description"
    customAttrs: {
      priority: "high"
      technology: "React"
    }
  }) {
    id
    name
  }
}
```

### Create a Task with License and Outcomes
```graphql
mutation {
  createTask(input: {
    name: "User Authentication"
    description: "Implement secure authentication"
    estMinutes: 480
    weight: 15
    priority: "High"
    productId: "product-id"
    licenseId: "license-id"
    outcomeIds: ["outcome-id"]
  }) {
    id
    name
  }
}
```

## Key Achievements
✅ **Task-Centric Workflow**: Tasks are now the primary focus when viewing products  
✅ **3-Tier Licensing**: Simplified Essential/Advantage/Signature license structure  
✅ **Separate Dialog Windows**: Clean UI with dedicated dialogs for each attribute type  
✅ **Streamlined Architecture**: Removed testing UI and focused on core business functionality  
✅ **Production Ready**: Optimized for /data partition deployment with comprehensive documentation
