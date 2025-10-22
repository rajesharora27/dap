-- ============================================================================
-- Customer Adoption Sample Data Script
-- Creates realistic customers and assigns networking/security products
-- ============================================================================

-- Insert 3 realistic customer companies
INSERT INTO "Customer" (id, name, description, "createdAt", "updatedAt") VALUES
('customer-acme-corp', 'Acme Corporation', 'Global manufacturing company with 500+ employees, expanding their digital infrastructure and security posture', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('customer-techstart-inc', 'TechStart Inc', 'Fast-growing SaaS startup with 150 employees, focusing on secure cloud-first operations and remote work enablement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('customer-financial-services', 'Meridian Financial Services', 'Regional financial institution with 300 employees, prioritizing compliance, security, and digital transformation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assign products to customers with realistic license levels and outcomes
INSERT INTO "CustomerProduct" (id, "customerId", "productId", name, "licenseLevel", "selectedOutcomes", "selectedReleases", "purchasedAt", "createdAt", "updatedAt") VALUES
-- Acme Corporation: Firewall + SD-WAN (Large enterprise needing security & connectivity)
('cp-acme-firewall', 'customer-acme-corp', 'prod-firewall-ngfw', 'Production Security Infrastructure', 'SIGNATURE', '["outcome-firewall-security", "outcome-firewall-compliance", "outcome-firewall-visibility"]', '["rel-firewall-1.0", "rel-firewall-2.0"]', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cp-acme-sdwan', 'customer-acme-corp', 'prod-sdwan-platform', 'Branch Office Connectivity', 'ADVANTAGE', '["outcome-sdwan-agility", "outcome-sdwan-cost"]', '["rel-sdwan-1.0"]', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- TechStart Inc: MFA/SSO + Cloud Security (Startup focusing on identity & cloud)  
('cp-techstart-mfa', 'customer-techstart-inc', 'prod-mfa-sso', 'Employee Identity & Access', 'ADVANTAGE', '["outcome-mfa-security", "outcome-mfa-productivity"]', '["rel-mfa-1.0", "rel-mfa-2.0"]', CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cp-techstart-cloud', 'customer-techstart-inc', 'prod-cloud-security', 'Cloud Security Posture', 'ESSENTIAL', '["outcome-cloud-protection", "outcome-cloud-visibility"]', '["rel-cloud-1.0"]', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Meridian Financial: Routing/Switching + MFA/SSO (Financial institution needing network & identity)
('cp-meridian-network', 'customer-financial-services', 'prod-routing-switching', 'Core Network Infrastructure', 'SIGNATURE', '["outcome-routing-performance", "outcome-routing-automation", "outcome-routing-scalability"]', '["rel-routing-1.0", "rel-routing-2.0"]', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cp-meridian-mfa', 'customer-financial-services', 'prod-mfa-sso', 'Customer & Employee Authentication', 'SIGNATURE', '["outcome-mfa-security", "outcome-mfa-compliance"]', '["rel-mfa-1.0"]', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Note: AdoptionPlan and CustomerTask records will be automatically created 
-- by the application's business logic when customers access their products
-- This ensures proper task synchronization and progress tracking

-- Display summary of created data
SELECT 'Customer Adoption Sample Data Created Successfully!' as "Status";
SELECT 
    c.name as "Customer",
    cp.name as "Product Assignment", 
    p.name as "Product",
    cp."licenseLevel" as "License",
    jsonb_array_length(cp."selectedOutcomes") as "Selected Outcomes"
FROM "Customer" c
JOIN "CustomerProduct" cp ON c.id = cp."customerId" 
JOIN "Product" p ON cp."productId" = p.id
WHERE c.id IN ('customer-acme-corp', 'customer-techstart-inc', 'customer-financial-services')
ORDER BY c.name, cp.name;
