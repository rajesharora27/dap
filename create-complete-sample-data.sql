-- Comprehensive Cisco Security & Networking Sample Data for DAP Application
-- 5 Products: Cisco Duo, Cisco SD-WAN, Cisco Secure Firewall, Cisco ISE, Cisco Secure Access Sample
-- 2 Solutions: Hybrid Private Access, SASE
-- 2 Customers: ACME, Chase
-- Each product has comprehensive tasks, telemetry attributes, licenses, releases, and outcomes

-- Clean existing sample data first (preserves manually created Cisco Secure Access if it exists)
DELETE FROM "TaskOutcome" WHERE "outcomeId" IN (
    SELECT id FROM "Outcome" WHERE "productId" IN 
    ('prod-cisco-duo', 'prod-cisco-sdwan', 'prod-cisco-firewall', 'prod-cisco-ise', 'prod-cisco-secure-access-sample')
);

DELETE FROM "TaskRelease" WHERE "releaseId" IN (
    SELECT id FROM "Release" WHERE "productId" IN 
    ('prod-cisco-duo', 'prod-cisco-sdwan', 'prod-cisco-firewall', 'prod-cisco-ise', 'prod-cisco-secure-access-sample')
);

DELETE FROM "TelemetryAttribute" WHERE "taskId" IN (
    SELECT id FROM "Task" WHERE "productId" IN 
    ('prod-cisco-duo', 'prod-cisco-sdwan', 'prod-cisco-firewall', 'prod-cisco-ise', 'prod-cisco-secure-access-sample')
);

DELETE FROM "Task" WHERE "productId" IN 
    ('prod-cisco-duo', 'prod-cisco-sdwan', 'prod-cisco-firewall', 'prod-cisco-ise', 'prod-cisco-secure-access-sample');

DELETE FROM "Outcome" WHERE "productId" IN 
    ('prod-cisco-duo', 'prod-cisco-sdwan', 'prod-cisco-firewall', 'prod-cisco-ise', 'prod-cisco-secure-access-sample');

DELETE FROM "Release" WHERE "productId" IN 
    ('prod-cisco-duo', 'prod-cisco-sdwan', 'prod-cisco-firewall', 'prod-cisco-ise', 'prod-cisco-secure-access-sample');

DELETE FROM "License" WHERE "productId" IN 
    ('prod-cisco-duo', 'prod-cisco-sdwan', 'prod-cisco-firewall', 'prod-cisco-ise', 'prod-cisco-secure-access-sample');

DELETE FROM "Product" WHERE id IN 
    ('prod-cisco-duo', 'prod-cisco-sdwan', 'prod-cisco-firewall', 'prod-cisco-ise', 'prod-cisco-secure-access-sample');

-- Insert 5 Cisco products
INSERT INTO "Product" (id, name, description, "customAttrs", "createdAt", "updatedAt") VALUES
(
    'prod-cisco-duo',
    'Cisco Duo',
    'Multi-factor authentication and zero-trust access platform with adaptive security policies',
    '{"vendor": "Cisco", "category": "Identity & Access", "deployment": "Cloud-Native", "authentication_methods": ["Push", "SMS", "TOTP", "WebAuthn", "Biometric"], "integrations": "1000+", "compliance": ["SOC 2", "FedRAMP", "HIPAA"], "management": "Admin Panel"}',
    CURRENT_TIMESTAMP - INTERVAL '90 days',
    CURRENT_TIMESTAMP
),
(
    'prod-cisco-sdwan',
    'Cisco SD-WAN',
    'Software-defined wide area network solution with cloud-first architecture and security integration',
    '{"vendor": "Cisco", "category": "Networking", "architecture": "Cloud-First", "encryption": "AES-256", "orchestration": "vManage", "analytics": "Real-time", "scalability": "10K+ sites", "management": "Centralized"}',
    CURRENT_TIMESTAMP - INTERVAL '75 days',
    CURRENT_TIMESTAMP
),
(
    'prod-cisco-firewall',
    'Cisco Secure Firewall',
    'Next-generation firewall with advanced threat protection, deep packet inspection, and application control',
    '{"vendor": "Cisco", "category": "Security", "model": "Firepower", "throughput": "10Gbps+", "features": ["IPS", "Malware Defense", "URL Filtering", "Application Control"], "management": "FMC/FDM", "certifications": ["Common Criteria", "FIPS 140-2"]}',
    CURRENT_TIMESTAMP - INTERVAL '120 days',
    CURRENT_TIMESTAMP
),
(
    'prod-cisco-ise',
    'Cisco ISE',
    'Identity Services Engine for network access control, policy enforcement, and guest management',
    '{"vendor": "Cisco", "category": "Network Security", "features": ["802.1X", "MAB", "Guest Access", "BYOD", "TrustSec"], "integration": ["Active Directory", "LDAP", "MFA"], "deployment": "On-Premise/Cloud", "scalability": "100K+ endpoints"}',
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    CURRENT_TIMESTAMP
),
(
    'prod-cisco-secure-access-sample',
    'Cisco Secure Access Sample',
    'Secure access service edge (SASE) platform combining SD-WAN, security, and zero trust network access',
    '{"vendor": "Cisco", "category": "SASE", "features": ["ZTNA", "SWG", "CASB", "FWaaS", "DLP"], "deployment": "Cloud-Native", "coverage": "Global PoPs", "performance": "Low Latency", "management": "Unified Dashboard"}',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP
);

-- Insert licenses for each product (Essential, Advantage, Signature)
INSERT INTO "License" (id, name, description, level, "isActive", "productId", "createdAt", "updatedAt") VALUES
-- Cisco Duo Licenses
('lic-duo-essential', 'Duo MFA Essential', 'Basic MFA with push and SMS authentication', 1, true, 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-duo-advantage', 'Duo MFA Advantage', 'Advanced MFA with device trust and adaptive policies', 2, true, 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-duo-signature', 'Duo Beyond', 'Complete zero-trust access with SSO and device posture', 3, true, 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Cisco SD-WAN Licenses
('lic-sdwan-essential', 'SD-WAN Essentials', 'Basic SD-WAN with secure connectivity', 1, true, 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-sdwan-advantage', 'SD-WAN Advantage', 'Advanced routing with security and analytics', 2, true, 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-sdwan-signature', 'SD-WAN Premier', 'Full platform with AI operations and advanced security', 3, true, 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Cisco Secure Firewall Licenses
('lic-firewall-essential', 'Firewall Essentials', 'Core firewall with standard threat protection', 1, true, 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-firewall-advantage', 'Firewall Advantage', 'Advanced features with IPS and malware defense', 2, true, 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-firewall-signature', 'Firewall Premier', 'Complete security suite with AI analytics', 3, true, 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Cisco ISE Licenses
('lic-ise-essential', 'ISE Base', 'Basic network access control and 802.1X', 1, true, 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-ise-advantage', 'ISE Plus', 'Advanced features with guest access and BYOD', 2, true, 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-ise-signature', 'ISE Apex', 'Complete platform with TrustSec and advanced segmentation', 3, true, 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Cisco Secure Access Licenses
('lic-secaccess-essential', 'Secure Access Essentials', 'Basic ZTNA and secure web gateway', 1, true, 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-secaccess-advantage', 'Secure Access Advantage', 'Advanced SASE with CASB and DLP', 2, true, 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-secaccess-signature', 'Secure Access Premier', 'Complete SASE platform with AI threat protection', 3, true, 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert outcomes for each product
INSERT INTO "Outcome" (id, "productId", name, description, "createdAt", "updatedAt") VALUES
-- Duo Outcomes
('outcome-duo-security', 'prod-cisco-duo', 'Enhanced Identity Security', 'Strong authentication and protection against credential theft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-duo-productivity', 'prod-cisco-duo', 'User Productivity', 'Seamless authentication experience across all applications', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-duo-compliance', 'prod-cisco-duo', 'Compliance & Audit', 'Meet identity compliance requirements with detailed audit logs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-duo-zerotrust', 'prod-cisco-duo', 'Zero Trust Access', 'Implement zero trust security with continuous verification', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- SD-WAN Outcomes
('outcome-sdwan-agility', 'prod-cisco-sdwan', 'Network Agility', 'Flexible and dynamic WAN connectivity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-sdwan-performance', 'prod-cisco-sdwan', 'Application Performance', 'Optimized application delivery across the WAN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-sdwan-security', 'prod-cisco-sdwan', 'Integrated Security', 'Built-in security for all WAN connections', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-sdwan-cost', 'prod-cisco-sdwan', 'Cost Optimization', 'Reduced networking costs with efficient bandwidth usage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Firewall Outcomes
('outcome-firewall-threat', 'prod-cisco-firewall', 'Threat Protection', 'Advanced protection against sophisticated threats', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-firewall-visibility', 'prod-cisco-firewall', 'Network Visibility', 'Complete visibility into network traffic and threats', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-firewall-compliance', 'prod-cisco-firewall', 'Security Compliance', 'Meet regulatory and security compliance requirements', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-firewall-control', 'prod-cisco-firewall', 'Application Control', 'Granular control over application usage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- ISE Outcomes
('outcome-ise-nac', 'prod-cisco-ise', 'Network Access Control', 'Secure network access with policy enforcement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-ise-visibility', 'prod-cisco-ise', 'Endpoint Visibility', 'Complete visibility into all network endpoints', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-ise-segmentation', 'prod-cisco-ise', 'Network Segmentation', 'Micro-segmentation with TrustSec technology', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-ise-guest', 'prod-cisco-ise', 'Guest Management', 'Secure and convenient guest network access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Secure Access Outcomes
('outcome-secaccess-ztna', 'prod-cisco-secure-access-sample', 'Zero Trust Network Access', 'Secure access to applications from anywhere', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-secaccess-cloud', 'prod-cisco-secure-access-sample', 'Cloud Security', 'Comprehensive cloud and SaaS application security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-secaccess-performance', 'prod-cisco-secure-access-sample', 'Global Performance', 'Low-latency access through global PoPs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-secaccess-visibility', 'prod-cisco-secure-access-sample', 'Unified Visibility', 'Single pane of glass for all security policies', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert releases for each product
INSERT INTO "Release" (id, name, description, level, "isActive", "productId", "createdAt", "updatedAt") VALUES
-- Duo Releases
('rel-duo-1.0', 'Duo v1.0', 'Core MFA capabilities with push and SMS', 1.0, true, 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-duo-2.0', 'Duo v2.0', 'Enhanced with device trust and adaptive authentication', 2.0, true, 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-duo-3.0', 'Duo v3.0', 'Zero trust access with SSO and advanced policies', 3.0, true, 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- SD-WAN Releases
('rel-sdwan-17.0', 'SD-WAN 17.x', 'Foundation release with core SD-WAN features', 17.0, true, 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-sdwan-20.0', 'SD-WAN 20.x', 'Cloud integration and enhanced security', 20.0, true, 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-sdwan-22.0', 'SD-WAN 22.x', 'AI-powered operations and advanced analytics', 22.0, true, 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Firewall Releases
('rel-firewall-7.0', 'Firepower 7.0', 'Core NGFW capabilities', 7.0, true, 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-firewall-7.2', 'Firepower 7.2', 'Enhanced threat intelligence and IPS', 7.2, true, 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-firewall-7.4', 'Firepower 7.4', 'AI-powered threat detection and automation', 7.4, true, 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- ISE Releases
('rel-ise-3.0', 'ISE 3.0', 'Core NAC and policy enforcement', 3.0, true, 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-ise-3.1', 'ISE 3.1', 'Enhanced guest access and BYOD', 3.1, true, 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-ise-3.2', 'ISE 3.2', 'Advanced TrustSec and segmentation', 3.2, true, 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Secure Access Releases
('rel-secaccess-1.0', 'Secure Access 1.0', 'Initial SASE platform release', 1.0, true, 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-secaccess-2.0', 'Secure Access 2.0', 'Enhanced ZTNA and cloud security', 2.0, true, 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks for Cisco Duo (12 tasks)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-duo-001', 'Directory Integration', 'Integrate with Active Directory or LDAP for user synchronization', 120, 8.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/duo/directory-sync'], ARRAY['https://videos.cisco.com/duo-ad'], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-002', 'MFA Policy Configuration', 'Configure multi-factor authentication policies and requirements', 90, 7.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/duo/mfa-policies'], ARRAY['https://videos.cisco.com/duo-policies'], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-003', 'Application Integration', 'Integrate Duo MFA with critical applications', 180, 10.0, 3, 'ESSENTIAL', ARRAY['https://docs.cisco.com/duo/app-integration'], ARRAY['https://videos.cisco.com/duo-apps'], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-004', 'Device Trust Setup', 'Configure device trust and health checks', 150, 9.0, 4, 'ADVANTAGE', ARRAY['https://docs.cisco.com/duo/device-trust'], ARRAY['https://videos.cisco.com/duo-devices'], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-005', 'Adaptive Authentication', 'Implement risk-based adaptive authentication policies', 120, 8.5, 5, 'ADVANTAGE', ARRAY['https://docs.cisco.com/duo/adaptive-auth'], ARRAY[]::text[], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-006', 'Self-Service Portal', 'Deploy user self-service portal for device management', 90, 6.0, 6, 'ESSENTIAL', ARRAY['https://docs.cisco.com/duo/self-service'], ARRAY[]::text[], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-007', 'SSO Integration', 'Configure single sign-on for enterprise applications', 180, 11.0, 7, 'SIGNATURE', ARRAY['https://docs.cisco.com/duo/sso'], ARRAY['https://videos.cisco.com/duo-sso'], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-008', 'Offline Access', 'Setup offline access capabilities for remote scenarios', 60, 5.0, 8, 'ADVANTAGE', ARRAY['https://docs.cisco.com/duo/offline'], ARRAY[]::text[], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-009', 'Reporting & Analytics', 'Configure authentication reporting and analytics dashboards', 75, 6.5, 9, 'ESSENTIAL', ARRAY['https://docs.cisco.com/duo/reporting'], ARRAY[]::text[], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-010', 'API Integration', 'Integrate Duo APIs for custom workflows', 120, 7.5, 10, 'SIGNATURE', ARRAY['https://docs.cisco.com/duo/api'], ARRAY['https://videos.cisco.com/duo-api'], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-011', 'Trusted Endpoints', 'Configure trusted endpoints and bypass policies', 90, 6.0, 11, 'ADVANTAGE', ARRAY['https://docs.cisco.com/duo/trusted-endpoints'], ARRAY[]::text[], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-duo-012', 'Security Monitoring', 'Setup security monitoring and anomaly detection', 105, 7.0, 12, 'SIGNATURE', ARRAY['https://docs.cisco.com/duo/monitoring'], ARRAY[]::text[], 'prod-cisco-duo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks for Cisco SD-WAN (14 tasks)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-sdwan-001', 'vManage Deployment', 'Deploy and configure vManage orchestration platform', 240, 12.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sdwan/vmanage'], ARRAY['https://videos.cisco.com/vmanage-setup'], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-002', 'Controller Setup', 'Configure vSmart controllers and vBond orchestrators', 180, 10.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sdwan/controllers'], ARRAY['https://videos.cisco.com/controller-setup'], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-003', 'Edge Device Onboarding', 'Onboard and configure edge devices (vEdge/cEdge)', 150, 9.0, 3, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sdwan/edge-onboarding'], ARRAY[]::text[], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-004', 'Overlay Network Design', 'Design and implement overlay network topology', 300, 15.0, 4, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sdwan/overlay'], ARRAY['https://videos.cisco.com/overlay-design'], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-005', 'Security Policy Templates', 'Create and deploy security policy templates', 180, 10.5, 5, 'ADVANTAGE', ARRAY['https://docs.cisco.com/sdwan/security-policies'], ARRAY[]::text[], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-006', 'Application-Aware Routing', 'Configure application-aware routing and SLA policies', 210, 11.5, 6, 'ADVANTAGE', ARRAY['https://docs.cisco.com/sdwan/app-routing'], ARRAY['https://videos.cisco.com/app-aware'], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-007', 'Cloud OnRamp', 'Setup cloud connectivity to AWS, Azure, and GCP', 180, 9.5, 7, 'ADVANTAGE', ARRAY['https://docs.cisco.com/sdwan/cloud-onramp'], ARRAY[]::text[], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-008', 'QoS Configuration', 'Implement quality of service policies', 120, 8.0, 8, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sdwan/qos'], ARRAY[]::text[], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-009', 'High Availability', 'Configure HA and redundancy for critical sites', 150, 9.0, 9, 'SIGNATURE', ARRAY['https://docs.cisco.com/sdwan/ha'], ARRAY['https://videos.cisco.com/sdwan-redundancy'], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-010', 'Network Segmentation', 'Implement VPN segmentation and service chaining', 180, 10.0, 10, 'SIGNATURE', ARRAY['https://docs.cisco.com/sdwan/segmentation'], ARRAY[]::text[], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-011', 'Analytics & Monitoring', 'Setup network analytics and monitoring dashboards', 120, 7.5, 11, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sdwan/analytics'], ARRAY[]::text[], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-012', 'Automation & APIs', 'Implement network automation using APIs', 210, 11.0, 12, 'SIGNATURE', ARRAY['https://docs.cisco.com/sdwan/apis'], ARRAY['https://videos.cisco.com/sdwan-automation'], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-013', 'DIA & Internet Breakout', 'Configure direct internet access and local breakout', 150, 8.5, 13, 'ADVANTAGE', ARRAY['https://docs.cisco.com/sdwan/dia'], ARRAY[]::text[], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-014', 'Migration & Cutover', 'Plan and execute migration from traditional WAN', 300, 13.0, 14, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sdwan/migration'], ARRAY['https://videos.cisco.com/wan-migration'], 'prod-cisco-sdwan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks for Cisco Secure Firewall (13 tasks)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-fw-001', 'Initial Firewall Setup', 'Configure basic firewall settings and interfaces', 180, 9.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/firepower/setup'], ARRAY['https://videos.cisco.com/firewall-setup'], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-002', 'Access Control Policies', 'Create and implement access control policies', 240, 12.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/firepower/acp'], ARRAY['https://videos.cisco.com/acp-policies'], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-003', 'Intrusion Prevention', 'Configure IPS with custom signatures', 180, 10.0, 3, 'ADVANTAGE', ARRAY['https://docs.cisco.com/firepower/ips'], ARRAY[]::text[], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-004', 'Malware Defense', 'Setup advanced malware protection and sandboxing', 150, 9.5, 4, 'ADVANTAGE', ARRAY['https://docs.cisco.com/firepower/malware'], ARRAY['https://videos.cisco.com/amp'], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-005', 'URL Filtering', 'Implement URL filtering and web reputation', 120, 7.5, 5, 'ADVANTAGE', ARRAY['https://docs.cisco.com/firepower/url-filtering'], ARRAY[]::text[], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-006', 'SSL Decryption', 'Configure SSL/TLS inspection for encrypted traffic', 210, 11.0, 6, 'SIGNATURE', ARRAY['https://docs.cisco.com/firepower/ssl-decrypt'], ARRAY['https://videos.cisco.com/ssl-inspection'], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-007', 'VPN Configuration', 'Setup site-to-site and remote access VPNs', 240, 12.0, 7, 'ESSENTIAL', ARRAY['https://docs.cisco.com/firepower/vpn'], ARRAY[]::text[], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-008', 'Application Control', 'Implement application visibility and control', 150, 8.5, 8, 'ADVANTAGE', ARRAY['https://docs.cisco.com/firepower/app-control'], ARRAY[]::text[], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-009', 'High Availability', 'Configure HA failover and clustering', 180, 10.0, 9, 'SIGNATURE', ARRAY['https://docs.cisco.com/firepower/ha'], ARRAY['https://videos.cisco.com/firewall-ha'], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-010', 'Threat Intelligence', 'Integrate with Talos threat intelligence feeds', 120, 7.0, 10, 'ADVANTAGE', ARRAY['https://docs.cisco.com/firepower/talos'], ARRAY[]::text[], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-011', 'Logging & Monitoring', 'Setup logging, SIEM integration, and dashboards', 135, 8.0, 11, 'ESSENTIAL', ARRAY['https://docs.cisco.com/firepower/logging'], ARRAY[]::text[], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-012', 'Security Analytics', 'Deploy advanced security analytics and reporting', 150, 9.0, 12, 'SIGNATURE', ARRAY['https://docs.cisco.com/firepower/analytics'], ARRAY['https://videos.cisco.com/security-analytics'], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-013', 'Policy Optimization', 'Optimize policies and performance tuning', 120, 7.5, 13, 'SIGNATURE', ARRAY['https://docs.cisco.com/firepower/optimization'], ARRAY[]::text[], 'prod-cisco-firewall', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks for Cisco ISE (12 tasks)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-ise-001', 'ISE Deployment', 'Deploy ISE nodes and configure distributed architecture', 240, 12.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/ise/deployment'], ARRAY['https://videos.cisco.com/ise-install'], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-002', 'Active Directory Integration', 'Integrate with AD for identity services', 150, 9.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/ise/ad-integration'], ARRAY[]::text[], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-003', 'Network Device Setup', 'Configure network devices as NAD in ISE', 120, 7.5, 3, 'ESSENTIAL', ARRAY['https://docs.cisco.com/ise/network-devices'], ARRAY[]::text[], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-004', '802.1X Configuration', 'Implement 802.1X authentication policies', 180, 10.5, 4, 'ESSENTIAL', ARRAY['https://docs.cisco.com/ise/802.1x'], ARRAY['https://videos.cisco.com/dot1x'], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-005', 'Guest Access Portal', 'Setup guest wireless with captive portal', 180, 9.5, 5, 'ADVANTAGE', ARRAY['https://docs.cisco.com/ise/guest'], ARRAY['https://videos.cisco.com/guest-access'], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-006', 'BYOD Onboarding', 'Configure BYOD device onboarding workflows', 150, 8.5, 6, 'ADVANTAGE', ARRAY['https://docs.cisco.com/ise/byod'], ARRAY[]::text[], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-007', 'Profiling Services', 'Enable device profiling and endpoint classification', 135, 8.0, 7, 'ESSENTIAL', ARRAY['https://docs.cisco.com/ise/profiling'], ARRAY[]::text[], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-008', 'TrustSec Segmentation', 'Implement TrustSec software-defined segmentation', 240, 13.0, 8, 'SIGNATURE', ARRAY['https://docs.cisco.com/ise/trustsec'], ARRAY['https://videos.cisco.com/trustsec'], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-009', 'Posture Assessment', 'Configure endpoint compliance and posture checks', 180, 10.0, 9, 'ADVANTAGE', ARRAY['https://docs.cisco.com/ise/posture'], ARRAY[]::text[], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-010', 'pxGrid Integration', 'Enable pxGrid for ecosystem integration', 150, 8.5, 10, 'SIGNATURE', ARRAY['https://docs.cisco.com/ise/pxgrid'], ARRAY['https://videos.cisco.com/pxgrid'], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-011', 'Monitoring & Reporting', 'Setup monitoring dashboards and reports', 120, 7.0, 11, 'ESSENTIAL', ARRAY['https://docs.cisco.com/ise/monitoring'], ARRAY[]::text[], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-ise-012', 'High Availability', 'Configure ISE HA and disaster recovery', 180, 10.0, 12, 'SIGNATURE', ARRAY['https://docs.cisco.com/ise/ha'], ARRAY[]::text[], 'prod-cisco-ise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks for Cisco Secure Access Sample (11 tasks)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-secaccess-001', 'SASE Architecture Design', 'Design comprehensive SASE architecture', 300, 15.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/secureaccess/architecture'], ARRAY['https://videos.cisco.com/sase-design'], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-002', 'ZTNA Configuration', 'Configure zero trust network access policies', 180, 10.5, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/secureaccess/ztna'], ARRAY[]::text[], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-003', 'Secure Web Gateway', 'Setup SWG for web traffic security', 150, 9.0, 3, 'ESSENTIAL', ARRAY['https://docs.cisco.com/secureaccess/swg'], ARRAY['https://videos.cisco.com/swg'], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-004', 'CASB Integration', 'Implement cloud access security broker', 180, 10.0, 4, 'ADVANTAGE', ARRAY['https://docs.cisco.com/secureaccess/casb'], ARRAY[]::text[], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-005', 'DLP Policies', 'Configure data loss prevention policies', 210, 11.5, 5, 'ADVANTAGE', ARRAY['https://docs.cisco.com/secureaccess/dlp'], ARRAY['https://videos.cisco.com/dlp'], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-006', 'FWaaS Deployment', 'Deploy firewall as a service capabilities', 180, 10.0, 6, 'ADVANTAGE', ARRAY['https://docs.cisco.com/secureaccess/fwaas'], ARRAY[]::text[], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-007', 'Cloud Connector', 'Setup cloud connectors for private apps', 150, 8.5, 7, 'ESSENTIAL', ARRAY['https://docs.cisco.com/secureaccess/connectors'], ARRAY[]::text[], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-008', 'Identity Integration', 'Integrate with identity providers', 120, 7.5, 8, 'ESSENTIAL', ARRAY['https://docs.cisco.com/secureaccess/identity'], ARRAY[]::text[], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-009', 'User Experience Optimization', 'Optimize for low-latency global access', 135, 8.0, 9, 'SIGNATURE', ARRAY['https://docs.cisco.com/secureaccess/optimization'], ARRAY[]::text[], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-010', 'Security Analytics', 'Deploy unified security analytics', 150, 9.0, 10, 'SIGNATURE', ARRAY['https://docs.cisco.com/secureaccess/analytics'], ARRAY['https://videos.cisco.com/sase-analytics'], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-secaccess-011', 'Compliance Reporting', 'Configure compliance and audit reporting', 120, 7.0, 11, 'ESSENTIAL', ARRAY['https://docs.cisco.com/secureaccess/compliance'], ARRAY[]::text[], 'prod-cisco-secure-access-sample', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Now insert telemetry attributes for all tasks (1-2 attributes per task for simplicity but completeness)
-- Duo Telemetry
INSERT INTO "TelemetryAttribute" (id, "taskId", name, description, "dataType", "isRequired", "successCriteria", "order", "isActive", "createdAt", "updatedAt") VALUES
('tel-duo-001-1', 'task-duo-001', 'users_synced', 'Number of users successfully synchronized', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 users synced"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-002-1', 'task-duo-002', 'policies_active', 'Number of active MFA policies', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "Minimum 3 policies configured"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-003-1', 'task-duo-003', 'apps_integrated', 'Number of applications integrated', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 apps with MFA"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-004-1', 'task-duo-004', 'trusted_devices', 'Number of trusted devices enrolled', 'NUMBER', true, '{"operator": ">=", "value": 20, "description": "Minimum 20 trusted devices"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-005-1', 'task-duo-005', 'adaptive_rules', 'Number of adaptive authentication rules', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 adaptive rules"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-006-1', 'task-duo-006', 'self_service_enabled', 'Self-service portal is active', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Portal must be enabled"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-007-1', 'task-duo-007', 'sso_apps', 'Number of SSO-enabled applications', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "Minimum 10 SSO apps"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-008-1', 'task-duo-008', 'offline_access_configured', 'Offline access is configured', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Must be enabled"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-009-1', 'task-duo-009', 'auth_success_rate', 'Authentication success rate percentage', 'NUMBER', true, '{"operator": ">=", "value": 98, "description": "98% or higher success rate"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-010-1', 'task-duo-010', 'api_calls_24h', 'API calls in last 24 hours', 'NUMBER', false, '{"operator": ">=", "value": 100, "description": "Active API usage"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-011-1', 'task-duo-011', 'trusted_networks', 'Number of trusted networks configured', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "Minimum 3 trusted networks"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-duo-012-1', 'task-duo-012', 'anomalies_detected', 'Security anomalies detected', 'NUMBER', false, '{"operator": ">=", "value": 0, "description": "Monitoring active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- SD-WAN Telemetry
INSERT INTO "TelemetryAttribute" (id, "taskId", name, description, "dataType", "isRequired", "successCriteria", "order", "isActive", "createdAt", "updatedAt") VALUES
('tel-sdwan-001-1', 'task-sdwan-001', 'vmanage_status', 'vManage operational status', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "vManage must be operational"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-002-1', 'task-sdwan-002', 'controllers_up', 'Number of controllers online', 'NUMBER', true, '{"operator": ">=", "value": 2, "description": "Minimum 2 controllers"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-003-1', 'task-sdwan-003', 'edges_onboarded', 'Number of edge devices onboarded', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 edges"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-004-1', 'task-sdwan-004', 'tunnels_established', 'Number of overlay tunnels', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "Minimum 10 tunnels"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-005-1', 'task-sdwan-005', 'security_policies', 'Number of security policies deployed', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 policies"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-006-1', 'task-sdwan-006', 'app_routes', 'Application-aware routes configured', 'NUMBER', true, '{"operator": ">=", "value": 20, "description": "Minimum 20 app routes"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-007-1', 'task-sdwan-007', 'cloud_connections', 'Active cloud connections', 'NUMBER', true, '{"operator": ">=", "value": 2, "description": "At least 2 cloud providers"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-008-1', 'task-sdwan-008', 'qos_classes', 'QoS classes configured', 'NUMBER', true, '{"operator": ">=", "value": 4, "description": "Minimum 4 QoS classes"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-009-1', 'task-sdwan-009', 'ha_configured', 'High availability configured', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "HA must be active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-010-1', 'task-sdwan-010', 'vpn_segments', 'Number of VPN segments', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "At least 3 segments"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-011-1', 'task-sdwan-011', 'bandwidth_utilization', 'Average bandwidth utilization %', 'NUMBER', true, '{"operator": "<=", "value": 80, "description": "Below 80% utilization"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-012-1', 'task-sdwan-012', 'api_automations', 'Number of API automations', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 automations"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-013-1', 'task-sdwan-013', 'dia_sites', 'Sites with DIA configured', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "Minimum 3 DIA sites"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-014-1', 'task-sdwan-014', 'migration_complete', 'Migration completion percentage', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "100% migrated"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Firewall Telemetry
INSERT INTO "TelemetryAttribute" (id, "taskId", name, description, "dataType", "isRequired", "successCriteria", "order", "isActive", "createdAt", "updatedAt") VALUES
('tel-fw-001-1', 'task-fw-001', 'interfaces_configured', 'Number of interfaces configured', 'NUMBER', true, '{"operator": ">=", "value": 4, "description": "At least 4 interfaces"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-002-1', 'task-fw-002', 'acp_rules', 'Number of access control rules', 'NUMBER', true, '{"operator": ">=", "value": 20, "description": "Minimum 20 rules"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-003-1', 'task-fw-003', 'ips_signatures', 'Active IPS signatures', 'NUMBER', true, '{"operator": ">=", "value": 1000, "description": "At least 1000 signatures"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-004-1', 'task-fw-004', 'malware_detections', 'Malware detections in 24h', 'NUMBER', false, '{"operator": ">=", "value": 1, "description": "Detecting threats"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-005-1', 'task-fw-005', 'url_categories_blocked', 'URL categories blocked', 'NUMBER', true, '{"operator": ">=", "value": 15, "description": "At least 15 categories"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-006-1', 'task-fw-006', 'ssl_inspection_rate', 'SSL traffic inspection rate %', 'NUMBER', true, '{"operator": ">=", "value": 70, "description": "70% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-007-1', 'task-fw-007', 'vpn_tunnels_active', 'Active VPN tunnels', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 tunnels"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-008-1', 'task-fw-008', 'applications_identified', 'Unique applications identified', 'NUMBER', true, '{"operator": ">=", "value": 50, "description": "At least 50 apps"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-009-1', 'task-fw-009', 'ha_sync_status', 'HA synchronization status', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "HA must be synced"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-010-1', 'task-fw-010', 'threat_feed_updates', 'Last threat feed update hours', 'NUMBER', true, '{"operator": "<=", "value": 24, "description": "Updated within 24h"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-011-1', 'task-fw-011', 'log_events_hour', 'Log events per hour', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "At least 100 events/hour"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-012-1', 'task-fw-012', 'security_events_detected', 'Security events in 24h', 'NUMBER', false, '{"operator": ">=", "value": 10, "description": "Active monitoring"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-013-1', 'task-fw-013', 'throughput_gbps', 'Current throughput in Gbps', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 Gbps"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ISE Telemetry
INSERT INTO "TelemetryAttribute" (id, "taskId", name, description, "dataType", "isRequired", "successCriteria", "order", "isActive", "createdAt", "updatedAt") VALUES
('tel-ise-001-1', 'task-ise-001', 'ise_nodes_online', 'Number of ISE nodes online', 'NUMBER', true, '{"operator": ">=", "value": 2, "description": "At least 2 nodes"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-002-1', 'task-ise-002', 'ad_join_status', 'AD integration status', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Must be joined to AD"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-003-1', 'task-ise-003', 'network_devices', 'Number of network devices configured', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 NADs"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-004-1', 'task-ise-004', 'dot1x_authentications', '802.1X authentications in 24h', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "Active 802.1X usage"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-005-1', 'task-ise-005', 'guest_sessions', 'Active guest sessions', 'NUMBER', false, '{"operator": ">=", "value": 10, "description": "Guest portal active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-006-1', 'task-ise-006', 'byod_devices', 'BYOD devices registered', 'NUMBER', true, '{"operator": ">=", "value": 50, "description": "At least 50 BYOD devices"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-007-1', 'task-ise-007', 'profiled_endpoints', 'Endpoints profiled', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "At least 100 profiled"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-008-1', 'task-ise-008', 'sgt_assignments', 'Security Group Tag assignments', 'NUMBER', true, '{"operator": ">=", "value": 20, "description": "At least 20 SGTs"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-009-1', 'task-ise-009', 'posture_checks', 'Posture assessments in 24h', 'NUMBER', true, '{"operator": ">=", "value": 50, "description": "Active posture checking"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-010-1', 'task-ise-010', 'pxgrid_clients', 'pxGrid client connections', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "At least 3 clients"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-011-1', 'task-ise-011', 'radius_success_rate', 'RADIUS authentication success %', 'NUMBER', true, '{"operator": ">=", "value": 95, "description": "95% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-ise-012-1', 'task-ise-012', 'backup_status', 'Backup completion status', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Backups must be enabled"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Secure Access Telemetry
INSERT INTO "TelemetryAttribute" (id, "taskId", name, description, "dataType", "isRequired", "successCriteria", "order", "isActive", "createdAt", "updatedAt") VALUES
('tel-secaccess-001-1', 'task-secaccess-001', 'architecture_approved', 'Architecture design approved', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Must be approved"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-002-1', 'task-secaccess-002', 'ztna_policies', 'ZTNA policies configured', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 policies"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-003-1', 'task-secaccess-003', 'web_requests_hour', 'Web requests per hour', 'NUMBER', true, '{"operator": ">=", "value": 1000, "description": "Active web traffic"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-004-1', 'task-secaccess-004', 'cloud_apps_monitored', 'Cloud applications monitored', 'NUMBER', true, '{"operator": ">=", "value": 20, "description": "At least 20 apps"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-005-1', 'task-secaccess-005', 'dlp_policies_active', 'Active DLP policies', 'NUMBER', true, '{"operator": ">=", "value": 15, "description": "At least 15 policies"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-006-1', 'task-secaccess-006', 'firewall_rules', 'FWaaS rules configured', 'NUMBER', true, '{"operator": ">=", "value": 30, "description": "At least 30 rules"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-007-1', 'task-secaccess-007', 'connectors_online', 'Cloud connectors online', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 connectors"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-008-1', 'task-secaccess-008', 'identity_providers', 'Identity providers integrated', 'NUMBER', true, '{"operator": ">=", "value": 2, "description": "At least 2 IdPs"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-009-1', 'task-secaccess-009', 'latency_ms', 'Average latency in milliseconds', 'NUMBER', true, '{"operator": "<=", "value": 50, "description": "Under 50ms latency"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-010-1', 'task-secaccess-010', 'security_incidents', 'Security incidents detected', 'NUMBER', false, '{"operator": ">=", "value": 1, "description": "Active monitoring"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-secaccess-011-1', 'task-secaccess-011', 'compliance_score', 'Compliance score percentage', 'NUMBER', true, '{"operator": ">=", "value": 90, "description": "90% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Link tasks to outcomes
INSERT INTO "TaskOutcome" (id, "taskId", "outcomeId") VALUES
-- Duo task-outcome mappings
('to-duo-001', 'task-duo-001', 'outcome-duo-security'),
('to-duo-002', 'task-duo-002', 'outcome-duo-security'),
('to-duo-003', 'task-duo-003', 'outcome-duo-productivity'),
('to-duo-004', 'task-duo-004', 'outcome-duo-zerotrust'),
('to-duo-005', 'task-duo-005', 'outcome-duo-zerotrust'),
('to-duo-006', 'task-duo-006', 'outcome-duo-productivity'),
('to-duo-007', 'task-duo-007', 'outcome-duo-productivity'),
('to-duo-008', 'task-duo-008', 'outcome-duo-security'),
('to-duo-009', 'task-duo-009', 'outcome-duo-compliance'),
('to-duo-010', 'task-duo-010', 'outcome-duo-zerotrust'),
('to-duo-011', 'task-duo-011', 'outcome-duo-security'),
('to-duo-012', 'task-duo-012', 'outcome-duo-security'),

-- SD-WAN task-outcome mappings
('to-sdwan-001', 'task-sdwan-001', 'outcome-sdwan-agility'),
('to-sdwan-002', 'task-sdwan-002', 'outcome-sdwan-agility'),
('to-sdwan-003', 'task-sdwan-003', 'outcome-sdwan-agility'),
('to-sdwan-004', 'task-sdwan-004', 'outcome-sdwan-performance'),
('to-sdwan-005', 'task-sdwan-005', 'outcome-sdwan-security'),
('to-sdwan-006', 'task-sdwan-006', 'outcome-sdwan-performance'),
('to-sdwan-007', 'task-sdwan-007', 'outcome-sdwan-agility'),
('to-sdwan-008', 'task-sdwan-008', 'outcome-sdwan-performance'),
('to-sdwan-009', 'task-sdwan-009', 'outcome-sdwan-agility'),
('to-sdwan-010', 'task-sdwan-010', 'outcome-sdwan-security'),
('to-sdwan-011', 'task-sdwan-011', 'outcome-sdwan-performance'),
('to-sdwan-012', 'task-sdwan-012', 'outcome-sdwan-cost'),
('to-sdwan-013', 'task-sdwan-013', 'outcome-sdwan-performance'),
('to-sdwan-014', 'task-sdwan-014', 'outcome-sdwan-cost'),

-- Firewall task-outcome mappings
('to-fw-001', 'task-fw-001', 'outcome-firewall-threat'),
('to-fw-002', 'task-fw-002', 'outcome-firewall-control'),
('to-fw-003', 'task-fw-003', 'outcome-firewall-threat'),
('to-fw-004', 'task-fw-004', 'outcome-firewall-threat'),
('to-fw-005', 'task-fw-005', 'outcome-firewall-control'),
('to-fw-006', 'task-fw-006', 'outcome-firewall-visibility'),
('to-fw-007', 'task-fw-007', 'outcome-firewall-threat'),
('to-fw-008', 'task-fw-008', 'outcome-firewall-control'),
('to-fw-009', 'task-fw-009', 'outcome-firewall-threat'),
('to-fw-010', 'task-fw-010', 'outcome-firewall-threat'),
('to-fw-011', 'task-fw-011', 'outcome-firewall-visibility'),
('to-fw-012', 'task-fw-012', 'outcome-firewall-visibility'),
('to-fw-013', 'task-fw-013', 'outcome-firewall-control'),

-- ISE task-outcome mappings
('to-ise-001', 'task-ise-001', 'outcome-ise-nac'),
('to-ise-002', 'task-ise-002', 'outcome-ise-nac'),
('to-ise-003', 'task-ise-003', 'outcome-ise-nac'),
('to-ise-004', 'task-ise-004', 'outcome-ise-nac'),
('to-ise-005', 'task-ise-005', 'outcome-ise-guest'),
('to-ise-006', 'task-ise-006', 'outcome-ise-guest'),
('to-ise-007', 'task-ise-007', 'outcome-ise-visibility'),
('to-ise-008', 'task-ise-008', 'outcome-ise-segmentation'),
('to-ise-009', 'task-ise-009', 'outcome-ise-nac'),
('to-ise-010', 'task-ise-010', 'outcome-ise-segmentation'),
('to-ise-011', 'task-ise-011', 'outcome-ise-visibility'),
('to-ise-012', 'task-ise-012', 'outcome-ise-nac'),

-- Secure Access task-outcome mappings
('to-secaccess-001', 'task-secaccess-001', 'outcome-secaccess-visibility'),
('to-secaccess-002', 'task-secaccess-002', 'outcome-secaccess-ztna'),
('to-secaccess-003', 'task-secaccess-003', 'outcome-secaccess-cloud'),
('to-secaccess-004', 'task-secaccess-004', 'outcome-secaccess-cloud'),
('to-secaccess-005', 'task-secaccess-005', 'outcome-secaccess-cloud'),
('to-secaccess-006', 'task-secaccess-006', 'outcome-secaccess-ztna'),
('to-secaccess-007', 'task-secaccess-007', 'outcome-secaccess-ztna'),
('to-secaccess-008', 'task-secaccess-008', 'outcome-secaccess-ztna'),
('to-secaccess-009', 'task-secaccess-009', 'outcome-secaccess-performance'),
('to-secaccess-010', 'task-secaccess-010', 'outcome-secaccess-visibility'),
('to-secaccess-011', 'task-secaccess-011', 'outcome-secaccess-visibility');

-- Link tasks to releases
INSERT INTO "TaskRelease" (id, "taskId", "releaseId") VALUES
-- Duo task-release mappings
('tr-duo-001', 'task-duo-001', 'rel-duo-1.0'),
('tr-duo-002', 'task-duo-002', 'rel-duo-1.0'),
('tr-duo-003', 'task-duo-003', 'rel-duo-1.0'),
('tr-duo-004', 'task-duo-004', 'rel-duo-2.0'),
('tr-duo-005', 'task-duo-005', 'rel-duo-2.0'),
('tr-duo-006', 'task-duo-006', 'rel-duo-1.0'),
('tr-duo-007', 'task-duo-007', 'rel-duo-3.0'),
('tr-duo-008', 'task-duo-008', 'rel-duo-2.0'),
('tr-duo-009', 'task-duo-009', 'rel-duo-1.0'),
('tr-duo-010', 'task-duo-010', 'rel-duo-3.0'),
('tr-duo-011', 'task-duo-011', 'rel-duo-2.0'),
('tr-duo-012', 'task-duo-012', 'rel-duo-3.0'),

-- SD-WAN task-release mappings
('tr-sdwan-001', 'task-sdwan-001', 'rel-sdwan-17.0'),
('tr-sdwan-002', 'task-sdwan-002', 'rel-sdwan-17.0'),
('tr-sdwan-003', 'task-sdwan-003', 'rel-sdwan-17.0'),
('tr-sdwan-004', 'task-sdwan-004', 'rel-sdwan-17.0'),
('tr-sdwan-005', 'task-sdwan-005', 'rel-sdwan-20.0'),
('tr-sdwan-006', 'task-sdwan-006', 'rel-sdwan-20.0'),
('tr-sdwan-007', 'task-sdwan-007', 'rel-sdwan-20.0'),
('tr-sdwan-008', 'task-sdwan-008', 'rel-sdwan-17.0'),
('tr-sdwan-009', 'task-sdwan-009', 'rel-sdwan-22.0'),
('tr-sdwan-010', 'task-sdwan-010', 'rel-sdwan-22.0'),
('tr-sdwan-011', 'task-sdwan-011', 'rel-sdwan-17.0'),
('tr-sdwan-012', 'task-sdwan-012', 'rel-sdwan-22.0'),
('tr-sdwan-013', 'task-sdwan-013', 'rel-sdwan-20.0'),
('tr-sdwan-014', 'task-sdwan-014', 'rel-sdwan-17.0'),

-- Firewall task-release mappings
('tr-fw-001', 'task-fw-001', 'rel-firewall-7.0'),
('tr-fw-002', 'task-fw-002', 'rel-firewall-7.0'),
('tr-fw-003', 'task-fw-003', 'rel-firewall-7.2'),
('tr-fw-004', 'task-fw-004', 'rel-firewall-7.2'),
('tr-fw-005', 'task-fw-005', 'rel-firewall-7.2'),
('tr-fw-006', 'task-fw-006', 'rel-firewall-7.4'),
('tr-fw-007', 'task-fw-007', 'rel-firewall-7.0'),
('tr-fw-008', 'task-fw-008', 'rel-firewall-7.2'),
('tr-fw-009', 'task-fw-009', 'rel-firewall-7.4'),
('tr-fw-010', 'task-fw-010', 'rel-firewall-7.2'),
('tr-fw-011', 'task-fw-011', 'rel-firewall-7.0'),
('tr-fw-012', 'task-fw-012', 'rel-firewall-7.4'),
('tr-fw-013', 'task-fw-013', 'rel-firewall-7.4'),

-- ISE task-release mappings
('tr-ise-001', 'task-ise-001', 'rel-ise-3.0'),
('tr-ise-002', 'task-ise-002', 'rel-ise-3.0'),
('tr-ise-003', 'task-ise-003', 'rel-ise-3.0'),
('tr-ise-004', 'task-ise-004', 'rel-ise-3.0'),
('tr-ise-005', 'task-ise-005', 'rel-ise-3.1'),
('tr-ise-006', 'task-ise-006', 'rel-ise-3.1'),
('tr-ise-007', 'task-ise-007', 'rel-ise-3.0'),
('tr-ise-008', 'task-ise-008', 'rel-ise-3.2'),
('tr-ise-009', 'task-ise-009', 'rel-ise-3.1'),
('tr-ise-010', 'task-ise-010', 'rel-ise-3.2'),
('tr-ise-011', 'task-ise-011', 'rel-ise-3.0'),
('tr-ise-012', 'task-ise-012', 'rel-ise-3.2'),

-- Secure Access task-release mappings
('tr-secaccess-001', 'task-secaccess-001', 'rel-secaccess-1.0'),
('tr-secaccess-002', 'task-secaccess-002', 'rel-secaccess-1.0'),
('tr-secaccess-003', 'task-secaccess-003', 'rel-secaccess-1.0'),
('tr-secaccess-004', 'task-secaccess-004', 'rel-secaccess-2.0'),
('tr-secaccess-005', 'task-secaccess-005', 'rel-secaccess-2.0'),
('tr-secaccess-006', 'task-secaccess-006', 'rel-secaccess-2.0'),
('tr-secaccess-007', 'task-secaccess-007', 'rel-secaccess-1.0'),
('tr-secaccess-008', 'task-secaccess-008', 'rel-secaccess-1.0'),
('tr-secaccess-009', 'task-secaccess-009', 'rel-secaccess-2.0'),
('tr-secaccess-010', 'task-secaccess-010', 'rel-secaccess-2.0'),
('tr-secaccess-011', 'task-secaccess-011', 'rel-secaccess-1.0');

-- Create Solutions
INSERT INTO "Solution" (id, name, description, "customAttrs", "createdAt", "updatedAt") VALUES
(
    'sol-hybrid-private-access',
    'Hybrid Private Access',
    'Comprehensive secure access solution combining ZTNA, MFA, and firewall protection for hybrid workforce',
    '{"type": "security-bundle", "target": "hybrid-workforce", "deployment": "cloud-hybrid", "duration_months": 12}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'sol-sase',
    'SASE',
    'Complete SASE platform integrating SD-WAN, secure access, and multi-factor authentication',
    '{"type": "sase-platform", "target": "distributed-enterprise", "deployment": "cloud-native", "duration_months": 24}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Insert outcomes for solutions
INSERT INTO "Outcome" (id, "solutionId", name, description, "createdAt", "updatedAt") VALUES
-- Hybrid Private Access Outcomes
('outcome-hpa-secure-work', 'sol-hybrid-private-access', 'Secure Hybrid Workforce', 'Enable secure remote and office access with zero trust', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-hpa-zero-trust', 'sol-hybrid-private-access', 'Zero Trust Architecture', 'Complete zero trust security framework implementation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-hpa-compliance', 'sol-hybrid-private-access', 'Security Compliance', 'Meet regulatory requirements for secure access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- SASE Outcomes
('outcome-sase-cloud-native', 'sol-sase', 'Cloud-Native Security', 'Fully cloud-delivered SASE platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-sase-global-perf', 'sol-sase', 'Global Performance', 'Optimized access and security from any location', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-sase-simplified-mgmt', 'sol-sase', 'Simplified Management', 'Unified platform for networking and security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert releases for solutions
INSERT INTO "Release" (id, name, description, level, "isActive", "solutionId", "createdAt", "updatedAt") VALUES
-- Hybrid Private Access Releases
('rel-hpa-1.0', 'HPA v1.0', 'Initial hybrid private access deployment', 1.0, true, 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-hpa-2.0', 'HPA v2.0', 'Enhanced with advanced threat protection', 2.0, true, 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- SASE Releases
('rel-sase-1.0', 'SASE v1.0', 'Foundation SASE platform', 1.0, true, 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-sase-2.0', 'SASE v2.0', 'Complete SASE with AI-driven security', 2.0, true, 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Link products to solutions
INSERT INTO "SolutionProduct" (id, "productId", "solutionId", "order") VALUES
-- Hybrid Private Access: Secure Access + Duo + Firewall
('sp-hpa-secaccess', 'prod-cisco-secure-access-sample', 'sol-hybrid-private-access', 1),
('sp-hpa-duo', 'prod-cisco-duo', 'sol-hybrid-private-access', 2),
('sp-hpa-firewall', 'prod-cisco-firewall', 'sol-hybrid-private-access', 3),

-- SASE: Secure Access + SD-WAN + Duo
('sp-sase-secaccess', 'prod-cisco-secure-access-sample', 'sol-sase', 1),
('sp-sase-sdwan', 'prod-cisco-sdwan', 'sol-sase', 2),
('sp-sase-duo', 'prod-cisco-duo', 'sol-sase', 3);

-- Insert solution-level tasks (Hybrid Private Access)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "solutionId", "createdAt", "updatedAt") VALUES
('task-hpa-001', 'Solution Architecture Planning', 'Design comprehensive hybrid private access architecture', 240, 12.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/hpa/architecture'], ARRAY['https://videos.cisco.com/hpa-planning'], 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-hpa-002', 'Identity Provider Integration', 'Integrate centralized identity provider across all components', 180, 10.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/hpa/idp'], ARRAY['https://videos.cisco.com/hpa-identity'], 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-hpa-003', 'Zero Trust Policy Framework', 'Establish zero trust policies across solution components', 210, 11.0, 3, 'ADVANTAGE', ARRAY['https://docs.cisco.com/hpa/zerotrust'], ARRAY[]::text[], 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-hpa-004', 'Cross-Component Integration Testing', 'Validate integration between Secure Access, Duo, and Firewall', 300, 13.0, 4, 'ESSENTIAL', ARRAY['https://docs.cisco.com/hpa/testing'], ARRAY['https://videos.cisco.com/hpa-integration'], 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-hpa-005', 'User Experience Optimization', 'Optimize end-to-end user authentication experience', 150, 8.5, 5, 'ADVANTAGE', ARRAY['https://docs.cisco.com/hpa/ux'], ARRAY[]::text[], 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-hpa-006', 'Security Analytics Dashboard', 'Deploy unified security analytics across all components', 180, 9.0, 6, 'SIGNATURE', ARRAY['https://docs.cisco.com/hpa/analytics'], ARRAY['https://videos.cisco.com/hpa-dashboard'], 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-hpa-007', 'Compliance Validation', 'Validate solution against compliance requirements', 150, 8.0, 7, 'ESSENTIAL', ARRAY['https://docs.cisco.com/hpa/compliance'], ARRAY[]::text[], 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-hpa-008', 'End-to-End Testing', 'Comprehensive testing of complete hybrid private access workflow', 240, 11.0, 8, 'ESSENTIAL', ARRAY['https://docs.cisco.com/hpa/e2e-testing'], ARRAY['https://videos.cisco.com/hpa-validation'], 'sol-hybrid-private-access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert solution-level tasks (SASE)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "solutionId", "createdAt", "updatedAt") VALUES
('task-sase-001', 'SASE Architecture Design', 'Design comprehensive SASE architecture and deployment plan', 300, 14.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sase/architecture'], ARRAY['https://videos.cisco.com/sase-design'], 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sase-002', 'Global PoP Configuration', 'Configure global points of presence for optimal performance', 240, 12.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sase/pop'], ARRAY['https://videos.cisco.com/sase-pop'], 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sase-003', 'SD-WAN and Security Integration', 'Integrate SD-WAN with security stack', 270, 13.0, 3, 'ADVANTAGE', ARRAY['https://docs.cisco.com/sase/integration'], ARRAY['https://videos.cisco.com/sase-integration'], 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sase-004', 'Cloud Gateway Deployment', 'Deploy and configure cloud security gateways', 210, 11.0, 4, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sase/gateways'], ARRAY[]::text[], 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sase-005', 'Traffic Steering Policies', 'Configure intelligent traffic steering across SASE components', 180, 10.0, 5, 'ADVANTAGE', ARRAY['https://docs.cisco.com/sase/steering'], ARRAY['https://videos.cisco.com/sase-steering'], 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sase-006', 'Performance Optimization', 'Optimize global performance and latency', 150, 8.5, 6, 'SIGNATURE', ARRAY['https://docs.cisco.com/sase/performance'], ARRAY[]::text[], 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sase-007', 'Unified Policy Management', 'Implement unified security and networking policies', 210, 11.5, 7, 'ADVANTAGE', ARRAY['https://docs.cisco.com/sase/policy'], ARRAY['https://videos.cisco.com/sase-policy'], 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sase-008', 'User Onboarding', 'Deploy and test end-user onboarding workflows', 180, 9.5, 8, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sase/onboarding'], ARRAY[]::text[], 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sase-009', 'SASE Analytics and Visibility', 'Configure unified SASE analytics dashboard', 150, 8.0, 9, 'SIGNATURE', ARRAY['https://docs.cisco.com/sase/analytics'], ARRAY['https://videos.cisco.com/sase-analytics'], 'sol-sase', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert telemetry for solution tasks
-- Hybrid Private Access Solution Telemetry
INSERT INTO "TelemetryAttribute" (id, "taskId", name, description, "dataType", "isRequired", "successCriteria", "order", "isActive", "createdAt", "updatedAt") VALUES
('tel-hpa-001-1', 'task-hpa-001', 'architecture_approved', 'Architecture design approved', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Architecture must be approved"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-hpa-002-1', 'task-hpa-002', 'idp_integrated', 'Identity provider fully integrated', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "IdP integration complete"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-hpa-003-1', 'task-hpa-003', 'policies_configured', 'Zero trust policies configured', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 policies"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-hpa-004-1', 'task-hpa-004', 'integration_tests_passed', 'Integration tests passed', 'NUMBER', true, '{"operator": ">=", "value": 20, "description": "All integration tests pass"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-hpa-005-1', 'task-hpa-005', 'user_satisfaction', 'User satisfaction score', 'NUMBER', true, '{"operator": ">=", "value": 85, "description": "85% or higher satisfaction"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-hpa-006-1', 'task-hpa-006', 'dashboards_deployed', 'Analytics dashboards deployed', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "At least 3 dashboards"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-hpa-007-1', 'task-hpa-007', 'compliance_validated', 'Compliance validation complete', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Must pass compliance"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-hpa-008-1', 'task-hpa-008', 'e2e_tests_passed', 'End-to-end tests passed', 'NUMBER', true, '{"operator": ">=", "value": 50, "description": "All E2E scenarios pass"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- SASE Solution Telemetry
INSERT INTO "TelemetryAttribute" (id, "taskId", name, description, "dataType", "isRequired", "successCriteria", "order", "isActive", "createdAt", "updatedAt") VALUES
('tel-sase-001-1', 'task-sase-001', 'architecture_designed', 'SASE architecture completed', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Architecture design complete"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sase-002-1', 'task-sase-002', 'pops_configured', 'Global PoPs configured', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 PoPs"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sase-003-1', 'task-sase-003', 'integration_complete', 'SD-WAN security integration', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Integration complete"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sase-004-1', 'task-sase-004', 'gateways_deployed', 'Cloud gateways deployed', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 gateways"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sase-005-1', 'task-sase-005', 'steering_policies', 'Traffic steering policies active', 'NUMBER', true, '{"operator": ">=", "value": 15, "description": "At least 15 policies"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sase-006-1', 'task-sase-006', 'avg_latency_ms', 'Average global latency', 'NUMBER', true, '{"operator": "<=", "value": 30, "description": "Under 30ms latency"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sase-007-1', 'task-sase-007', 'unified_policies', 'Unified policies configured', 'NUMBER', true, '{"operator": ">=", "value": 25, "description": "At least 25 policies"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sase-008-1', 'task-sase-008', 'users_onboarded', 'Users successfully onboarded', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "At least 100 users"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sase-009-1', 'task-sase-009', 'analytics_active', 'Analytics dashboard active', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Dashboard must be active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Link solution tasks to outcomes
INSERT INTO "TaskOutcome" (id, "taskId", "outcomeId") VALUES
-- Hybrid Private Access task-outcome mappings
('to-hpa-001', 'task-hpa-001', 'outcome-hpa-zero-trust'),
('to-hpa-002', 'task-hpa-002', 'outcome-hpa-zero-trust'),
('to-hpa-003', 'task-hpa-003', 'outcome-hpa-zero-trust'),
('to-hpa-004', 'task-hpa-004', 'outcome-hpa-secure-work'),
('to-hpa-005', 'task-hpa-005', 'outcome-hpa-secure-work'),
('to-hpa-006', 'task-hpa-006', 'outcome-hpa-secure-work'),
('to-hpa-007', 'task-hpa-007', 'outcome-hpa-compliance'),
('to-hpa-008', 'task-hpa-008', 'outcome-hpa-compliance'),

-- SASE task-outcome mappings
('to-sase-001', 'task-sase-001', 'outcome-sase-cloud-native'),
('to-sase-002', 'task-sase-002', 'outcome-sase-global-perf'),
('to-sase-003', 'task-sase-003', 'outcome-sase-cloud-native'),
('to-sase-004', 'task-sase-004', 'outcome-sase-cloud-native'),
('to-sase-005', 'task-sase-005', 'outcome-sase-global-perf'),
('to-sase-006', 'task-sase-006', 'outcome-sase-global-perf'),
('to-sase-007', 'task-sase-007', 'outcome-sase-simplified-mgmt'),
('to-sase-008', 'task-sase-008', 'outcome-sase-simplified-mgmt'),
('to-sase-009', 'task-sase-009', 'outcome-sase-simplified-mgmt');

-- Link solution tasks to releases
INSERT INTO "TaskRelease" (id, "taskId", "releaseId") VALUES
-- Hybrid Private Access task-release mappings
('tr-hpa-001', 'task-hpa-001', 'rel-hpa-1.0'),
('tr-hpa-002', 'task-hpa-002', 'rel-hpa-1.0'),
('tr-hpa-003', 'task-hpa-003', 'rel-hpa-1.0'),
('tr-hpa-004', 'task-hpa-004', 'rel-hpa-1.0'),
('tr-hpa-005', 'task-hpa-005', 'rel-hpa-1.0'),
('tr-hpa-006', 'task-hpa-006', 'rel-hpa-2.0'),
('tr-hpa-007', 'task-hpa-007', 'rel-hpa-1.0'),
('tr-hpa-008', 'task-hpa-008', 'rel-hpa-2.0'),

-- SASE task-release mappings
('tr-sase-001', 'task-sase-001', 'rel-sase-1.0'),
('tr-sase-002', 'task-sase-002', 'rel-sase-1.0'),
('tr-sase-003', 'task-sase-003', 'rel-sase-1.0'),
('tr-sase-004', 'task-sase-004', 'rel-sase-1.0'),
('tr-sase-005', 'task-sase-005', 'rel-sase-1.0'),
('tr-sase-006', 'task-sase-006', 'rel-sase-2.0'),
('tr-sase-007', 'task-sase-007', 'rel-sase-1.0'),
('tr-sase-008', 'task-sase-008', 'rel-sase-1.0'),
('tr-sase-009', 'task-sase-009', 'rel-sase-2.0');

-- Create Customers
INSERT INTO "Customer" (id, name, description, "createdAt", "updatedAt") VALUES
(
    'customer-acme',
    'ACME',
    'Large manufacturing company with 2000+ employees across 15 locations, implementing secure hybrid work',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'customer-chase',
    'Chase',
    'Financial services organization with 5000+ users globally, requiring SASE architecture for distributed workforce',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign solutions to customers
INSERT INTO "CustomerSolution" (id, "customerId", "solutionId", name, "licenseLevel", "selectedOutcomes", "selectedReleases", "purchasedAt", "createdAt", "updatedAt") VALUES
(
    'cs-acme-hpa',
    'customer-acme',
    'sol-hybrid-private-access',
    'ACME Hybrid Private Access Deployment',
    'ADVANTAGE',
    '["outcome-hpa-secure-work", "outcome-hpa-zero-trust", "outcome-hpa-compliance"]',
    '["rel-hpa-1.0"]',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'cs-chase-sase',
    'customer-chase',
    'sol-sase',
    'Chase SASE Platform',
    'SIGNATURE',
    '["outcome-sase-cloud-native", "outcome-sase-global-perf", "outcome-sase-simplified-mgmt"]',
    '["rel-sase-1.0", "rel-sase-2.0"]',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign individual products to customers (products within their assigned solutions)
-- NOTE: Product names MUST follow pattern: "{SolutionName} - {ProductName}" for proper linking
INSERT INTO "CustomerProduct" (id, "customerId", "productId", name, "licenseLevel", "selectedOutcomes", "selectedReleases", "purchasedAt", "createdAt", "updatedAt") VALUES
-- ACME's Hybrid Private Access products
(
    'cp-acme-secaccess',
    'customer-acme',
    'prod-cisco-secure-access-sample',
    'ACME Hybrid Private Access Deployment - Cisco Secure Access Sample',
    'ADVANTAGE',
    '["outcome-secaccess-ztna", "outcome-secaccess-cloud"]',
    '["rel-secaccess-2.0"]',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'cp-acme-duo',
    'customer-acme',
    'prod-cisco-duo',
    'ACME Hybrid Private Access Deployment - Cisco Duo',
    'ADVANTAGE',
    '["outcome-duo-security", "outcome-duo-zerotrust"]',
    '["rel-duo-2.0"]',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'cp-acme-firewall',
    'customer-acme',
    'prod-cisco-firewall',
    'ACME Hybrid Private Access Deployment - Cisco Secure Firewall',
    'ADVANTAGE',
    '["outcome-firewall-threat", "outcome-firewall-visibility"]',
    '["rel-firewall-7.2"]',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- Chase's SASE products
(
    'cp-chase-secaccess',
    'customer-chase',
    'prod-cisco-secure-access-sample',
    'Chase SASE Platform - Cisco Secure Access Sample',
    'SIGNATURE',
    '["outcome-secaccess-ztna", "outcome-secaccess-performance"]',
    '["rel-secaccess-2.0"]',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'cp-chase-sdwan',
    'customer-chase',
    'prod-cisco-sdwan',
    'Chase SASE Platform - Cisco SD-WAN',
    'SIGNATURE',
    '["outcome-sdwan-agility", "outcome-sdwan-performance", "outcome-sdwan-security"]',
    '["rel-sdwan-22.0"]',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'cp-chase-duo',
    'customer-chase',
    'prod-cisco-duo',
    'Chase SASE Platform - Cisco Duo',
    'SIGNATURE',
    '["outcome-duo-security", "outcome-duo-zerotrust"]',
    '["rel-duo-3.0"]',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Note: AdoptionPlan and CustomerTask records will be automatically created 
-- by the application's business logic when customers access their solutions through the UI
