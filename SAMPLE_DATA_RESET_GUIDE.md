# Sample Data & Customer Reset Documentation

## Overview
Updated the DAP reset script to provide a complete fresh start for customer adoption management by removing all customer product assignments and adoption plans.

## Changes Made

### 1. Enhanced `remove-sample-data.sql`

#### New Deletion Steps (in order)
The script now removes customer adoption data in the correct dependency order:

```sql
1. CustomerTelemetryValue       → Remove telemetry values
2. CustomerTelemetryAttribute   → Remove telemetry attributes  
3. CustomerTaskOutcome          → Remove task-outcome relationships
4. CustomerTaskRelease          → Remove task-release relationships
5. CustomerTask                 → Remove all customer tasks
6. AdoptionPlan                 → Remove all adoption plans
7. CustomerProduct              → Remove ALL customer-product assignments
8. CustomerSolution             → Remove sample customer solutions
```

#### What's Removed
- ✅ **All Customer Adoption Plans** - Complete fresh start
- ✅ **All Customer Product Assignments** - No products assigned to any customer
- ✅ **All Customer Tasks** - No adoption plan tasks
- ✅ **All Customer Telemetry** - No task tracking data
- ✅ **Sample Products** - The 5 sample products and test product
- ✅ **Sample Product Data** - Tasks, licenses, releases, outcomes

#### What's Preserved
- ✅ **Customer Records** - All customer definitions remain
- ✅ **User-Created Products** - Any products you created
- ✅ **User-Created Tasks** - Tasks for your custom products
- ✅ **User Accounts** - Admin and user accounts
- ✅ **Audit Logs** - Historical change tracking

### 2. Updated DAP Script Output

The `./dap reset-sample` command now provides clearer feedback:

```bash
📊 Removed sample products:
  • retail-app-001 (Retail Management App)
  • financial-app-001 (Financial Services App)
  • it-app-001 (IT Operations App)
  • ai-app-001 (AI-Powered Analytics App)
  • networking-app-001 (Network Management App)
  • test-product-1 (Test E-Commerce Platform)

📊 Removed ALL customer adoption data:
  • All customer product assignments
  • All adoption plans
  • All customer tasks and telemetry
  • Customer solutions for sample products

📊 Remaining database contains:
  📦 X Products (user-created)
  📋 X Tasks (user-created)
  👥 Customers (preserved, but unassigned)

✅ Ready for fresh customer assignments!
```

## Sample Data Structure

### Products Created by Seed Script

The seed script (`backend/src/seed.ts`) creates 5 comprehensive sample products:

#### 1. Retail Management App (`retail-app-001`)
- **Description**: POS, inventory, and customer analytics
- **Tasks**: 15 tasks covering:
  - Point of Sale System
  - Inventory Management
  - Multi-store Operations
  - Customer Loyalty Program
  - E-commerce Integration
  - Reporting & Analytics
  - And more...
- **Licenses**: 3 tiers (Starter, Professional, Enterprise)
- **Releases**: 5 releases (Alpha → v3.0)
- **Outcomes**: 5 business outcomes

#### 2. Financial Services App (`financial-app-001`)
- **Description**: Trading, portfolio management, compliance
- **Tasks**: 15 tasks covering:
  - Trading Execution Engine
  - Portfolio Management
  - Risk Analytics
  - Compliance & Reporting
  - Algorithmic Trading
  - Real-time Market Data
  - And more...
- **Licenses**: 3 tiers (Basic, Professional, Enterprise)
- **Releases**: 5 releases (v1.0 → v3.0)
- **Outcomes**: 5 business outcomes

#### 3. IT Operations App (`it-app-001`)
- **Description**: Monitoring, incident management, automation
- **Tasks**: 15 tasks covering:
  - Infrastructure Monitoring
  - Incident Management
  - Automation & Runbooks
  - Asset Management
  - Change Management
  - Service Catalog
  - And more...
- **Licenses**: 3 tiers (Essential, Advanced, Enterprise)
- **Releases**: 5 releases (v1.0 → v3.0 AIOps)
- **Outcomes**: 5 business outcomes

#### 4. AI-Powered Analytics App (`ai-app-001`)
- **Description**: ML platform with NLP and computer vision
- **Tasks**: 15 tasks covering:
  - ML Model Training
  - Natural Language Processing
  - Computer Vision
  - Model Deployment
  - MLOps Pipeline
  - AutoML
  - And more...
- **Licenses**: 3 tiers (Starter, Professional, Enterprise)
- **Releases**: 5 releases (v1.0 → v3.0 AutoML)
- **Outcomes**: 5 business outcomes

#### 5. Network Management App (`networking-app-001`)
- **Description**: Network monitoring, security, SD-WAN
- **Tasks**: 15 tasks covering:
  - Network Discovery
  - Performance Monitoring
  - Firewall Management
  - SD-WAN Orchestration
  - Zero Trust Architecture
  - Security Analytics
  - And more...
- **Licenses**: 3 tiers (Monitor, Professional, Enterprise)
- **Releases**: 5 releases (v1.0 → v3.0 Zero Trust)
- **Outcomes**: 5 business outcomes

### Task Details

Each product has **15 comprehensive tasks** with:
- ✅ Name and description
- ✅ Estimated minutes
- ✅ Weight (for progress calculation)
- ✅ Priority (Critical, High, Medium)
- ✅ License level requirement (ESSENTIAL, ADVANTAGE, SIGNATURE)
- ✅ How-to documentation links
- ✅ How-to video links
- ✅ Detailed notes
- ✅ Associated releases (multiple)
- ✅ Associated outcomes

### Telemetry Attributes

Each task has **5 telemetry attributes** with sample data:
1. **Deployment Status** (BOOLEAN) - 3 historical values
2. **Performance Score** (NUMBER) - 3 historical values
3. **Code Quality** (STRING) - 3 historical values
4. **Last Updated** (TIMESTAMP) - 3 historical values
5. **Composite Health Check** (BOOLEAN) - 3 historical values

## Use Cases

### Use Case 1: Complete Fresh Start
**Scenario**: Want to start completely fresh with customer adoption management

**Steps**:
```bash
./dap reset-sample
```

**Result**:
- All sample products removed
- All customer product assignments removed
- All adoption plans removed
- Customers remain but unassigned
- Ready to assign products and create adoption plans

### Use Case 2: Reload Sample Data
**Scenario**: Accidentally modified sample products, want to restore original

**Steps**:
```bash
./dap reset-sample      # Remove everything
./dap add-sample        # Recreate sample data
```

**Result**:
- Fresh sample products with all tasks
- Clean slate for testing
- All 5 products with complete metadata

### Use Case 3: Test Customer Workflows
**Scenario**: Testing customer adoption workflows from scratch

**Steps**:
```bash
./dap reset-sample                    # Clean state
# In UI: Navigate to Customers
# Assign products to customers
# Create adoption plans
# Test sync functionality
# Test filtering
```

**Result**:
- Clean test environment
- No leftover test data
- Repeatable testing

### Use Case 4: Demo Preparation
**Scenario**: Preparing for product demo

**Steps**:
```bash
./dap reset-sample      # Remove old demo data
./dap add-sample        # Fresh sample products
# Create demo customer assignments
# Set up adoption plans
# Mark some tasks as complete for progress
```

**Result**:
- Clean demo environment
- Professional looking data
- Known starting state

## Common Commands

### Reset Everything (Sample Data + Customer Assignments)
```bash
./dap reset-sample
```
**Removes**: Sample products, ALL customer assignments, ALL adoption plans

### Recreate Sample Data
```bash
./dap add-sample
```
**Creates**: 5 sample products with 15 tasks each, licenses, releases, outcomes

### Complete Restart
```bash
./dap stop              # Stop all services
./dap reset             # Nuclear reset (all data)
./dap start             # Start services
./dap add-sample        # Add sample data
```
**Result**: Completely fresh database with only sample data

### Restart with Sample Data
```bash
./dap clean-restart
```
**Equivalent to**: stop + reset + start + add-sample

## Database Entities

### Sample Products Table

| Product ID | Name | Tasks | Licenses | Releases | Outcomes |
|------------|------|-------|----------|----------|----------|
| retail-app-001 | Retail Management App | 15 | 3 | 5 | 5 |
| financial-app-001 | Financial Services App | 15 | 3 | 5 | 5 |
| it-app-001 | IT Operations App | 15 | 3 | 5 | 5 |
| ai-app-001 | AI-Powered Analytics App | 15 | 3 | 5 | 5 |
| networking-app-001 | Network Management App | 15 | 3 | 5 | 5 |

**Total**: 75 tasks, 15 licenses, 25 releases, 25 outcomes

### Customer Adoption Entities

| Entity | Description | Removed by reset-sample |
|--------|-------------|-------------------------|
| Customer | Customer definition | ❌ Preserved |
| CustomerProduct | Product assignment to customer | ✅ Removed (ALL) |
| AdoptionPlan | Adoption plan for customer-product | ✅ Removed (ALL) |
| CustomerTask | Task copy in adoption plan | ✅ Removed (ALL) |
| CustomerTelemetryAttribute | Telemetry tracking for customer task | ✅ Removed (ALL) |
| CustomerTelemetryValue | Telemetry values | ✅ Removed (ALL) |

## Verification

### Check Sample Products
```bash
./dap status
```
Look for product count in status output.

### Check Customer Assignments (via GraphQL)
```graphql
query {
  customers {
    id
    name
    products {
      id
      product {
        name
      }
    }
  }
}
```
**Expected after reset-sample**: Customers exist but `products` array is empty

### Check Adoption Plans (via GraphQL)
```graphql
query {
  customers {
    id
    name
    products {
      id
      adoptionPlan {
        id
        totalTasks
      }
    }
  }
}
```
**Expected after reset-sample**: No `adoptionPlan` data

## Troubleshooting

### Q: reset-sample fails with foreign key constraint errors
**A**: The SQL script handles dependencies in the correct order. If you still get errors:
```bash
./dap stop
./dap reset              # Nuclear reset
./dap start
./dap add-sample         # Fresh sample data
```

### Q: Customers disappeared after reset-sample
**A**: This shouldn't happen. The script preserves Customer records. Check:
```bash
docker exec <db_container> psql -U postgres -d dap -c "SELECT COUNT(*) FROM \"Customer\";"
```
If count is 0, customers were accidentally removed. Recreate them in the UI.

### Q: Sample products not appearing after add-sample
**A**: Check seed script ran successfully:
```bash
./dap add-sample
# Look for: "Created product: <name>"
# Look for: "Created task: <name>"
```

### Q: Tasks missing from sample products
**A**: This was the original issue. The seed script creates tasks. Verify:
```bash
docker exec <db_container> psql -U postgres -d dap -c "SELECT COUNT(*) FROM \"Task\" WHERE \"productId\" = 'retail-app-001';"
```
**Expected**: 15 tasks

## Best Practices

### Before Demo
```bash
./dap reset-sample      # Clean slate
./dap add-sample        # Fresh data
# Create demo scenarios in UI
```

### Before Testing
```bash
./dap reset-sample      # Remove test data
# Run tests with clean state
```

### Before Development
```bash
./dap clean-restart     # Full reset
# Develop with known state
```

### Periodic Cleanup
```bash
# Every few days:
./dap reset-sample      # Remove accumulated test data
./dap add-sample        # Fresh sample data
```

## Summary

The `reset-sample` command now provides a **complete fresh start** for customer adoption management:

✅ **Removes**: Sample products, ALL customer-product assignments, ALL adoption plans, ALL customer tasks
✅ **Preserves**: Customer definitions, user accounts, user-created products, audit logs
✅ **Result**: Clean state ready for fresh product assignments and adoption plan creation

**Command**: `./dap reset-sample`

**Use when**: You want to start fresh with customer adoption management or prepare for demos/testing

---

**Last Updated**: October 15, 2025
**Version**: 2.0 (Enhanced with customer adoption reset)
