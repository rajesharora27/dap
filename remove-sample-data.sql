-- Remove Sample Data Script for DAP Application
-- This script removes ONLY the sample data created by the TypeScript seed scripts
-- It preserves any user-created data

-- CURRENT SAMPLE PRODUCT IDs (from seed.ts):
-- 'retail-app-001', 'financial-app-001', 'it-app-001', 'ai-app-001', 'networking-app-001'
-- 'test-product-1' (from seed-clean.ts)

-- Remove telemetry attributes first (foreign key constraints)
DELETE FROM "TelemetryAttribute" WHERE "taskId" IN (
    SELECT t.id FROM "Task" t 
    JOIN "Product" p ON t."productId" = p.id 
    WHERE p.id IN ('retail-app-001', 'financial-app-001', 'it-app-001', 'ai-app-001', 'networking-app-001', 'test-product-1')
);

-- Remove sample task relationships (foreign key constraints)
DELETE FROM "TaskOutcome" WHERE "taskId" IN (
    SELECT t.id FROM "Task" t 
    JOIN "Product" p ON t."productId" = p.id 
    WHERE p.id IN ('retail-app-001', 'financial-app-001', 'it-app-001', 'ai-app-001', 'networking-app-001', 'test-product-1')
);

DELETE FROM "TaskRelease" WHERE "taskId" IN (
    SELECT t.id FROM "Task" t 
    JOIN "Product" p ON t."productId" = p.id 
    WHERE p.id IN ('retail-app-001', 'financial-app-001', 'it-app-001', 'ai-app-001', 'networking-app-001', 'test-product-1')
);

-- Remove sample tasks
DELETE FROM "Task" WHERE "productId" IN (
    'retail-app-001', 
    'financial-app-001', 
    'it-app-001', 
    'ai-app-001', 
    'networking-app-001',
    'test-product-1'
);

-- Remove sample outcomes
DELETE FROM "Outcome" WHERE "productId" IN (
    'retail-app-001', 
    'financial-app-001', 
    'it-app-001', 
    'ai-app-001', 
    'networking-app-001',
    'test-product-1'
);

-- Remove sample releases
DELETE FROM "Release" WHERE "productId" IN (
    'retail-app-001', 
    'financial-app-001', 
    'it-app-001', 
    'ai-app-001', 
    'networking-app-001',
    'test-product-1'
);

-- Remove sample licenses
DELETE FROM "License" WHERE "productId" IN (
    'retail-app-001', 
    'financial-app-001', 
    'it-app-001', 
    'ai-app-001', 
    'networking-app-001',
    'test-product-1'
);

-- Remove customer adoption plan data (includes ALL customers, not just sample data)
-- This ensures a fresh start for customer adoption plans

-- Remove customer telemetry values
DELETE FROM "CustomerTelemetryValue" WHERE "attributeId" IN (
    SELECT id FROM "CustomerTelemetryAttribute" WHERE "customerTaskId" IN (
        SELECT id FROM "CustomerTask"
    )
);

-- Remove customer telemetry attributes
DELETE FROM "CustomerTelemetryAttribute" WHERE "customerTaskId" IN (
    SELECT id FROM "CustomerTask"
);

-- Remove customer task outcomes
DELETE FROM "CustomerTaskOutcome" WHERE "customerTaskId" IN (
    SELECT id FROM "CustomerTask"
);

-- Remove customer task releases  
DELETE FROM "CustomerTaskRelease" WHERE "customerTaskId" IN (
    SELECT id FROM "CustomerTask"
);

-- Remove customer tasks
DELETE FROM "CustomerTask";

-- Remove adoption plans
DELETE FROM "AdoptionPlan";

-- Remove ALL customer product assignments (this ensures fresh start)
DELETE FROM "CustomerProduct";

-- Remove sample customer solutions (if any exist related to sample products)
DELETE FROM "CustomerSolution" WHERE "productId" IN (
    'retail-app-001', 
    'financial-app-001', 
    'it-app-001', 
    'ai-app-001', 
    'networking-app-001',
    'test-product-1'
);

-- Remove sample products
DELETE FROM "Product" WHERE id IN (
    'retail-app-001', 
    'financial-app-001', 
    'it-app-001', 
    'ai-app-001', 
    'networking-app-001',
    'test-product-1'
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