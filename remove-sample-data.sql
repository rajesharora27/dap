-- Remove Sample Data Script for DAP Application
-- This script removes ONLY the sample data created by create-enhanced-sample-data.sql
-- It preserves any user-created data

-- Remove sample task relationships first (foreign key constraints)
DELETE FROM "TaskOutcome" WHERE "taskId" IN (
    SELECT t.id FROM "Task" t 
    JOIN "Product" p ON t."productId" = p.id 
    WHERE p.id IN ('prod-ecommerce-advanced', 'prod-fintech-suite', 'prod-healthcare-ecosystem', 'prod-logistics-optimizer', 'prod-edtech-platform')
);

DELETE FROM "TaskRelease" WHERE "taskId" IN (
    SELECT t.id FROM "Task" t 
    JOIN "Product" p ON t."productId" = p.id 
    WHERE p.id IN ('prod-ecommerce-advanced', 'prod-fintech-suite', 'prod-healthcare-ecosystem', 'prod-logistics-optimizer', 'prod-edtech-platform')
);

-- Remove sample tasks
DELETE FROM "Task" WHERE "productId" IN (
    'prod-ecommerce-advanced', 
    'prod-fintech-suite', 
    'prod-healthcare-ecosystem', 
    'prod-logistics-optimizer', 
    'prod-edtech-platform'
);

-- Remove sample outcomes
DELETE FROM "Outcome" WHERE "productId" IN (
    'prod-ecommerce-advanced', 
    'prod-fintech-suite', 
    'prod-healthcare-ecosystem', 
    'prod-logistics-optimizer', 
    'prod-edtech-platform'
);

-- Remove sample releases
DELETE FROM "Release" WHERE "productId" IN (
    'prod-ecommerce-advanced', 
    'prod-fintech-suite', 
    'prod-healthcare-ecosystem', 
    'prod-logistics-optimizer', 
    'prod-edtech-platform'
);

-- Remove sample licenses
DELETE FROM "License" WHERE "productId" IN (
    'prod-ecommerce-advanced', 
    'prod-fintech-suite', 
    'prod-healthcare-ecosystem', 
    'prod-logistics-optimizer', 
    'prod-edtech-platform'
);

-- Remove sample customer relationships
DELETE FROM "CustomerProduct" WHERE "productId" IN (
    'prod-ecommerce-advanced', 
    'prod-fintech-suite', 
    'prod-healthcare-ecosystem', 
    'prod-logistics-optimizer', 
    'prod-edtech-platform'
);

-- Remove sample customers (only those created by the sample script)
-- Note: We identify sample customers by their IDs which follow a pattern
DELETE FROM "Customer" WHERE id IN (
    'cust-enterprise-retail', 
    'cust-financial-corp', 
    'cust-healthcare-network', 
    'cust-logistics-global', 
    'cust-education-university'
);

-- Remove sample products (this will cascade to related data if foreign keys are set up properly)
DELETE FROM "Product" WHERE id IN (
    'prod-ecommerce-advanced', 
    'prod-fintech-suite', 
    'prod-healthcare-ecosystem', 
    'prod-logistics-optimizer', 
    'prod-edtech-platform'
);

-- Clean up any sample telemetry data (optional, as this might include user-generated telemetry)
-- DELETE FROM "Telemetry" WHERE "entityId" IN (
--     'prod-ecommerce-advanced', 
--     'prod-fintech-suite', 
--     'prod-healthcare-ecosystem', 
--     'prod-logistics-optimizer', 
--     'prod-edtech-platform'
-- );

-- Note: AuditLog, ChangeItem, and ChangeSet are left untouched as they may contain 
-- legitimate audit trail information that should be preserved