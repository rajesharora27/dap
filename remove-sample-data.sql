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

-- Remove sample customer relationships
DELETE FROM "CustomerProduct" WHERE "productId" IN (
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