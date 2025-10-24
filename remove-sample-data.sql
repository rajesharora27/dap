-- Remove Sample Data Script for DAP Application
-- This script removes ONLY the sample data created by the seeding scripts
-- It preserves any user-created data

-- SAMPLE PRODUCT IDs TO REMOVE:
-- From create-complete-sample-data.sql:
--   'prod-firewall-ngfw', 'prod-routing-switching', 'prod-mfa-sso', 'prod-sdwan-platform', 'prod-cloud-security'
-- From old seed scripts:
--   'retail-app-001', 'financial-app-001', 'it-app-001', 'ai-app-001', 'networking-app-001', 'test-product-1'

-- Define sample product IDs as a temporary set for easier management
DO $$
DECLARE
    sample_product_ids TEXT[] := ARRAY[
        'prod-firewall-ngfw', 
        'prod-routing-switching', 
        'prod-mfa-sso', 
        'prod-sdwan-platform', 
        'prod-cloud-security',
    'retail-app-001', 
    'financial-app-001', 
    'it-app-001', 
    'ai-app-001', 
    'networking-app-001',
    'test-product-1'
    ];
BEGIN
    -- Remove telemetry values for sample products
    DELETE FROM "CustomerTelemetryValue" WHERE "customerAttributeId" IN (
        SELECT cta.id FROM "CustomerTelemetryAttribute" cta
        JOIN "CustomerTask" ct ON cta."customerTaskId" = ct.id
        JOIN "AdoptionPlan" ap ON ct."adoptionPlanId" = ap.id
        JOIN "CustomerProduct" cp ON ap."customerProductId" = cp.id
        WHERE cp."productId" = ANY(sample_product_ids)
    );

    DELETE FROM "TelemetryValue" WHERE "attributeId" IN (
        SELECT ta.id FROM "TelemetryAttribute" ta
        JOIN "Task" t ON ta."taskId" = t.id
        WHERE t."productId" = ANY(sample_product_ids)
    );

    -- Remove telemetry attributes for sample products
    DELETE FROM "CustomerTelemetryAttribute" WHERE "customerTaskId" IN (
        SELECT ct.id FROM "CustomerTask" ct
        JOIN "AdoptionPlan" ap ON ct."adoptionPlanId" = ap.id
        JOIN "CustomerProduct" cp ON ap."customerProductId" = cp.id
        WHERE cp."productId" = ANY(sample_product_ids)
    );

    DELETE FROM "TelemetryAttribute" WHERE "taskId" IN (
        SELECT id FROM "Task" WHERE "productId" = ANY(sample_product_ids)
    );

    -- Remove customer task relationships for sample products
    DELETE FROM "CustomerTaskOutcome" WHERE "customerTaskId" IN (
        SELECT ct.id FROM "CustomerTask" ct
        JOIN "AdoptionPlan" ap ON ct."adoptionPlanId" = ap.id
        JOIN "CustomerProduct" cp ON ap."customerProductId" = cp.id
        WHERE cp."productId" = ANY(sample_product_ids)
    );

    DELETE FROM "CustomerTaskRelease" WHERE "customerTaskId" IN (
        SELECT ct.id FROM "CustomerTask" ct
        JOIN "AdoptionPlan" ap ON ct."adoptionPlanId" = ap.id
        JOIN "CustomerProduct" cp ON ap."customerProductId" = cp.id
        WHERE cp."productId" = ANY(sample_product_ids)
    );

    -- Remove customer tasks for sample products
    DELETE FROM "CustomerTask" WHERE "adoptionPlanId" IN (
        SELECT ap.id FROM "AdoptionPlan" ap
        JOIN "CustomerProduct" cp ON ap."customerProductId" = cp.id
        WHERE cp."productId" = ANY(sample_product_ids)
    );

    -- Remove adoption plans for sample products
    DELETE FROM "AdoptionPlan" WHERE "customerProductId" IN (
        SELECT id FROM "CustomerProduct" WHERE "productId" = ANY(sample_product_ids)
    );

    -- Remove customer product assignments for sample products
    DELETE FROM "CustomerProduct" WHERE "productId" = ANY(sample_product_ids);

    -- Remove solution-related data for sample products
    DELETE FROM "CustomerSolutionTask" WHERE "solutionAdoptionPlanId" IN (
        SELECT sap.id FROM "SolutionAdoptionPlan" sap
        JOIN "CustomerSolution" cs ON sap."customerSolutionId" = cs.id
        JOIN "SolutionProduct" sp ON cs."solutionId" = sp."solutionId"
        WHERE sp."productId" = ANY(sample_product_ids)
    );

    DELETE FROM "SolutionAdoptionProduct" WHERE "solutionAdoptionPlanId" IN (
        SELECT sap.id FROM "SolutionAdoptionPlan" sap
        JOIN "CustomerSolution" cs ON sap."customerSolutionId" = cs.id
        JOIN "SolutionProduct" sp ON cs."solutionId" = sp."solutionId"
        WHERE sp."productId" = ANY(sample_product_ids)
    );

    DELETE FROM "SolutionAdoptionPlan" WHERE "customerSolutionId" IN (
        SELECT cs.id FROM "CustomerSolution" cs
        JOIN "SolutionProduct" sp ON cs."solutionId" = sp."solutionId"
        WHERE sp."productId" = ANY(sample_product_ids)
    );

    DELETE FROM "CustomerSolution" WHERE "solutionId" IN (
        SELECT "solutionId" FROM "SolutionProduct" WHERE "productId" = ANY(sample_product_ids)
    );

    DELETE FROM "SolutionProduct" WHERE "productId" = ANY(sample_product_ids);
    DELETE FROM "SolutionTaskOrder" WHERE "solutionId" IN (
        SELECT "solutionId" FROM "SolutionProduct" WHERE "productId" = ANY(sample_product_ids)
    );

    -- Remove sample product task relationships
    DELETE FROM "TaskOutcome" WHERE "taskId" IN (
        SELECT id FROM "Task" WHERE "productId" = ANY(sample_product_ids)
    );

    DELETE FROM "TaskRelease" WHERE "taskId" IN (
        SELECT id FROM "Task" WHERE "productId" = ANY(sample_product_ids)
    );

    -- Remove sample tasks
    DELETE FROM "Task" WHERE "productId" = ANY(sample_product_ids);

    -- Remove sample outcomes
    DELETE FROM "Outcome" WHERE "productId" = ANY(sample_product_ids);

    -- Remove sample releases
    DELETE FROM "Release" WHERE "productId" = ANY(sample_product_ids);

    -- Remove sample licenses
    DELETE FROM "License" WHERE "productId" = ANY(sample_product_ids);

    -- Finally, remove sample products themselves
    DELETE FROM "Product" WHERE id = ANY(sample_product_ids);

    -- Remove sample solutions that no longer have products
    DELETE FROM "Solution" WHERE id NOT IN (
        SELECT DISTINCT "solutionId" FROM "SolutionProduct"
    );

    -- Remove sample customers (if they were created by sample data)
    -- Only remove customers with specific sample IDs
    DELETE FROM "Customer" WHERE id IN (
        'customer-acme-corp',
        'customer-techstart-inc', 
        'customer-financial-services',
        'customer-retail-corp',
        'customer-health-system'
    );

    RAISE NOTICE 'Sample data removed successfully. User-created products and data preserved.';
END $$;

-- Note: AuditLog, ChangeItem, and ChangeSet are left untouched as they contain 
-- legitimate audit trail information that should be preserved
