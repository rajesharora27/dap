# Sample Data Management in DAP

The DAP application now includes enhanced sample data management capabilities that allow developers to work with sample data more efficiently during development and testing.

## New Commands

### `./dap add-sample`
Adds comprehensive sample data to an existing database without affecting any user-created data.

**Use Case**: When you have a running application with some user data and want to add sample data for testing new features.

**What it adds**:
- 5 comprehensive products (ecommerce, fintech, healthcare, logistics, edtech)
- Associated licenses, outcomes, and releases for each product
- Tasks with howToDoc and howToVideo fields
- Complete data relationships and constraints

**Example**:
```bash
./dap start          # Start with existing data
./dap add-sample     # Add sample data alongside user data
```

### `./dap reset-sample`
Removes only the sample data that was added by the DAP script, preserving all user-created data.

**Use Case**: When you want to clean up sample data but keep all the real data you've created during development.

**What it removes**:
- Sample products with IDs: `prod-ecommerce-advanced`, `prod-fintech-suite`, `prod-healthcare-ecosystem`, `prod-logistics-optimizer`, `prod-edtech-platform`
- All associated tasks, licenses, outcomes, and releases for these products
- Sample customers and relationships
- **Preserves**: All user-created products, tasks, and other data

**Example**:
```bash
./dap reset-sample   # Remove sample data, keep user data
./dap add-sample     # Add fresh sample data
```

## Comparison with Existing Commands

| Command | Database State | Sample Data | User Data |
|---------|----------------|-------------|-----------|
| `./dap clean-restart` | Completely reset | Fresh sample data | **DELETED** |
| `./dap add-sample` | Preserved | Added | **PRESERVED** |
| `./dap reset-sample` | Preserved | **REMOVED** | **PRESERVED** |

## Sample Data Identification

The system identifies sample data by consistent naming patterns:

**Products**:
- `prod-ecommerce-advanced` - Advanced E-commerce Platform
- `prod-fintech-suite` - Financial Technology Suite  
- `prod-healthcare-ecosystem` - Healthcare Management Ecosystem
- `prod-logistics-optimizer` - Logistics & Supply Chain Optimizer
- `prod-edtech-platform` - Educational Technology Platform

**Licenses**: Follow pattern `lic-{product-type}-*` (e.g., `lic-ecom-basic`, `lic-fintech-pro`)

**Customers**: Follow pattern `cust-{domain}-{type}` (e.g., `cust-enterprise-retail`)

## Development Workflow Examples

### Scenario 1: Fresh Development Start
```bash
./dap clean-restart    # Start with clean database and sample data
# Develop and test features
```

### Scenario 2: Adding Sample Data to Existing Work
```bash
./dap start           # Continue with existing data
./dap add-sample      # Add sample data for testing
# Test new features with both real and sample data
```

### Scenario 3: Cleaning Up Sample Data
```bash
./dap reset-sample    # Remove sample data clutter
# Continue with clean user data only
```

### Scenario 4: Refreshing Sample Data
```bash
./dap reset-sample    # Remove old sample data
./dap add-sample      # Add fresh sample data
# Work with updated sample data
```

## Technical Implementation

The sample data management is implemented through two SQL scripts:

1. **`create-enhanced-sample-data.sql`**: Comprehensive sample data creation script
2. **`remove-sample-data.sql`**: Selective sample data removal script that preserves user data

Both scripts are executed safely within the PostgreSQL container and include proper foreign key handling and constraint management.

## Benefits

1. **Flexible Development**: Work with or without sample data as needed
2. **Data Safety**: Never accidentally lose user-created data
3. **Clean Testing**: Reset sample data without affecting development work
4. **Incremental Workflow**: Add sample data when needed, remove when done
5. **Professional Development**: Separate sample data from real development data

This enhanced workflow supports both rapid prototyping with rich sample data and careful development with real user data, making the DAP application more development-friendly and production-ready.