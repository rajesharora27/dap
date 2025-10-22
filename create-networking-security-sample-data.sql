-- Comprehensive Networking & Security Sample Data for DAP Application
-- 5 Products: IT Firewall, Routing/Switching, MFA/SSO, SD-WAN, Cloud Security
-- Each product has 10-20 tasks with telemetry attributes and success criteria

-- Clean existing sample data first
DELETE FROM "TaskOutcome" WHERE "outcomeId" IN (
    SELECT id FROM "Outcome" WHERE "productId" IN 
    ('prod-firewall-ngfw', 'prod-routing-switching', 'prod-mfa-sso', 'prod-sdwan-platform', 'prod-cloud-security')
);

DELETE FROM "TaskRelease" WHERE "releaseId" IN (
    SELECT id FROM "Release" WHERE "productId" IN 
    ('prod-firewall-ngfw', 'prod-routing-switching', 'prod-mfa-sso', 'prod-sdwan-platform', 'prod-cloud-security')
);

DELETE FROM "TelemetryAttribute" WHERE "taskId" IN (
    SELECT id FROM "Task" WHERE "productId" IN 
    ('prod-firewall-ngfw', 'prod-routing-switching', 'prod-mfa-sso', 'prod-sdwan-platform', 'prod-cloud-security')
);

DELETE FROM "Task" WHERE "productId" IN 
    ('prod-firewall-ngfw', 'prod-routing-switching', 'prod-mfa-sso', 'prod-sdwan-platform', 'prod-cloud-security');

DELETE FROM "Outcome" WHERE "productId" IN 
    ('prod-firewall-ngfw', 'prod-routing-switching', 'prod-mfa-sso', 'prod-sdwan-platform', 'prod-cloud-security');

DELETE FROM "Release" WHERE "productId" IN 
    ('prod-firewall-ngfw', 'prod-routing-switching', 'prod-mfa-sso', 'prod-sdwan-platform', 'prod-cloud-security');

DELETE FROM "License" WHERE "productId" IN 
    ('prod-firewall-ngfw', 'prod-routing-switching', 'prod-mfa-sso', 'prod-sdwan-platform', 'prod-cloud-security');

DELETE FROM "Product" WHERE id IN 
    ('prod-firewall-ngfw', 'prod-routing-switching', 'prod-mfa-sso', 'prod-sdwan-platform', 'prod-cloud-security');

-- Insert 5 networking/security products
INSERT INTO "Product" (id, name, description, "customAttrs", "createdAt", "updatedAt") VALUES
(
    'prod-firewall-ngfw',
    'Next-Generation Firewall',
    'Advanced firewall solution with deep packet inspection, threat intelligence, and application control',
    '{"vendor": "Cisco", "model": "ASA-X", "throughput": "10Gbps", "concurrent_sessions": "1M+", "deployment": "On-Premise/Cloud", "certifications": ["Common Criteria", "FIPS 140-2"], "management": "ASDM/FMC"}',
    CURRENT_TIMESTAMP - INTERVAL '120 days',
    CURRENT_TIMESTAMP
),
(
    'prod-routing-switching',
    'Enterprise Routing & Switching',
    'High-performance routing and switching platform with advanced QoS, MPLS, and SDN capabilities',
    '{"series": "Catalyst 9000", "port_density": "48-port", "switching_capacity": "480Gbps", "routing_protocols": ["OSPF", "BGP", "EIGRP"], "power": "PoE+", "management": "DNA Center", "warranty": "Lifetime"}',
    CURRENT_TIMESTAMP - INTERVAL '90 days',
    CURRENT_TIMESTAMP
),
(
    'prod-mfa-sso',
    'Multi-Factor Authentication & SSO',
    'Zero-trust authentication platform with adaptive MFA, single sign-on, and identity governance',
    '{"authentication_methods": ["TOTP", "Push", "Biometric", "Hardware Token"], "protocols": ["SAML 2.0", "OAuth 2.0", "OpenID Connect"], "integrations": "1000+", "compliance": ["SOC 2", "GDPR"], "deployment": "Cloud-Native"}',
    CURRENT_TIMESTAMP - INTERVAL '75 days',
    CURRENT_TIMESTAMP
),
(
    'prod-sdwan-platform',
    'SD-WAN Platform',
    'Software-defined WAN solution with dynamic path selection, security integration, and centralized management',
    '{"architecture": "Cloud-First", "encryption": "AES-256", "overlay_protocols": ["IPsec", "GRE"], "analytics": "Real-time", "orchestration": "vManage", "edge_devices": "vEdge/cEdge", "scalability": "10K+ sites"}',
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    CURRENT_TIMESTAMP
),
(
    'prod-cloud-security',
    'Cloud Security Platform',
    'Comprehensive cloud security with CASB, CWPP, and multi-cloud protection capabilities',
    '{"coverage": "AWS/Azure/GCP", "protection": ["Data Loss Prevention", "Malware Detection", "Compliance"], "apis": "RESTful", "deployment_time": "Minutes", "visibility": "360-degree", "compliance": ["SOC 2", "ISO 27001"]}',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP
);

-- Insert licenses for each product (Essential, Advantage, Signature)
INSERT INTO "License" (id, name, description, level, "isActive", "productId", "createdAt", "updatedAt") VALUES
-- Firewall Licenses
('lic-firewall-essential', 'Firewall Essential', 'Basic firewall features with standard threat protection', 1, true, 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-firewall-advantage', 'Firewall Advantage', 'Advanced features with IPS, anti-malware, and URL filtering', 2, true, 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-firewall-signature', 'Firewall Signature', 'Complete security suite with advanced analytics and automation', 3, true, 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Routing/Switching Licenses
('lic-routing-essential', 'Network Essential', 'Basic routing and switching with standard protocols', 1, true, 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-routing-advantage', 'Network Advantage', 'Advanced features with SD-Access and automation', 2, true, 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-routing-signature', 'Network Signature', 'Premier features with AI insights and advanced security', 3, true, 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- MFA/SSO Licenses
('lic-mfa-essential', 'Identity Essential', 'Basic MFA and SSO capabilities', 1, true, 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-mfa-advantage', 'Identity Advantage', 'Advanced authentication with risk analytics', 2, true, 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-mfa-signature', 'Identity Signature', 'Complete identity governance with AI-driven security', 3, true, 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- SD-WAN Licenses
('lic-sdwan-essential', 'SD-WAN Essential', 'Basic SD-WAN with secure connectivity', 1, true, 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-sdwan-advantage', 'SD-WAN Advantage', 'Advanced features with security and analytics', 2, true, 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-sdwan-signature', 'SD-WAN Signature', 'Complete platform with AI operations and security', 3, true, 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Cloud Security Licenses
('lic-cloud-essential', 'Cloud Security Essential', 'Basic cloud protection and visibility', 1, true, 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-cloud-advantage', 'Cloud Security Advantage', 'Advanced threat protection and compliance', 2, true, 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-cloud-signature', 'Cloud Security Signature', 'Complete security suite with AI and automation', 3, true, 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert outcomes for each product
INSERT INTO "Outcome" (id, "productId", name, description, "createdAt", "updatedAt") VALUES
-- Firewall Outcomes
('outcome-firewall-security', 'prod-firewall-ngfw', 'Enhanced Network Security', 'Comprehensive protection against advanced threats and attacks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-firewall-compliance', 'prod-firewall-ngfw', 'Security Compliance', 'Meet regulatory requirements and security standards', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-firewall-visibility', 'prod-firewall-ngfw', 'Network Visibility', 'Complete visibility into network traffic and security events', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Routing/Switching Outcomes
('outcome-routing-performance', 'prod-routing-switching', 'Network Performance', 'Optimized network performance with low latency and high throughput', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-routing-automation', 'prod-routing-switching', 'Network Automation', 'Automated network operations and configuration management', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-routing-scalability', 'prod-routing-switching', 'Network Scalability', 'Scalable infrastructure supporting business growth', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- MFA/SSO Outcomes
('outcome-mfa-security', 'prod-mfa-sso', 'Identity Security', 'Strong authentication and access control protection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-mfa-productivity', 'prod-mfa-sso', 'User Productivity', 'Seamless user experience with single sign-on', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-mfa-compliance', 'prod-mfa-sso', 'Identity Compliance', 'Meet identity and access management compliance requirements', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- SD-WAN Outcomes
('outcome-sdwan-agility', 'prod-sdwan-platform', 'Network Agility', 'Flexible and dynamic network connectivity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-sdwan-cost', 'prod-sdwan-platform', 'Cost Optimization', 'Reduced networking costs and improved ROI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-sdwan-security', 'prod-sdwan-platform', 'Secure Connectivity', 'End-to-end security for all network connections', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Cloud Security Outcomes
('outcome-cloud-protection', 'prod-cloud-security', 'Cloud Protection', 'Comprehensive security across multi-cloud environments', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-cloud-compliance', 'prod-cloud-security', 'Cloud Compliance', 'Maintain compliance in cloud deployments', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-cloud-visibility', 'prod-cloud-security', 'Cloud Visibility', 'Complete visibility and control over cloud resources', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert releases for each product
INSERT INTO "Release" (id, name, description, level, "isActive", "productId", "createdAt", "updatedAt") VALUES
-- Firewall Releases
('rel-firewall-1.0', 'Firewall v1.0', 'Initial release with core security features', 1.0, true, 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-firewall-2.0', 'Firewall v2.0', 'Enhanced threat detection and reporting', 2.0, true, 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-firewall-3.0', 'Firewall v3.0', 'AI-powered security with advanced analytics', 3.0, true, 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Routing/Switching Releases
('rel-routing-1.0', 'Network v1.0', 'Foundation release with core networking', 1.0, true, 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-routing-2.0', 'Network v2.0', 'Enhanced automation and management', 2.0, true, 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- MFA/SSO Releases
('rel-mfa-1.0', 'Identity v1.0', 'Core authentication and SSO features', 1.0, true, 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-mfa-2.0', 'Identity v2.0', 'Advanced risk analytics and governance', 2.0, true, 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- SD-WAN Releases
('rel-sdwan-1.0', 'SD-WAN v1.0', 'Basic SD-WAN connectivity and management', 1.0, true, 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-sdwan-2.0', 'SD-WAN v2.0', 'Enhanced security integration and analytics', 2.0, true, 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Cloud Security Releases  
('rel-cloud-1.0', 'Cloud Security v1.0', 'Multi-cloud security foundation', 1.0, true, 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rel-cloud-2.0', 'Cloud Security v2.0', 'Advanced AI-driven threat protection', 2.0, true, 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks with telemetry attributes for Firewall product (15 tasks)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-fw-001', 'Initial Firewall Configuration', 'Configure basic firewall settings including interfaces, zones, and default policies', 180, 8.5, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/firewall-basic-config'], ARRAY['https://videos.cisco.com/fw-basic-setup'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-002', 'Security Policy Creation', 'Define and implement comprehensive security policies for network traffic control', 240, 12.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/security-policies'], ARRAY['https://videos.cisco.com/security-policies'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-003', 'Threat Intelligence Integration', 'Configure threat intelligence feeds and reputation-based filtering', 150, 7.5, 3, 'ADVANTAGE', ARRAY['https://docs.cisco.com/threat-intel'], ARRAY['https://videos.cisco.com/threat-feeds'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-004', 'IPS Configuration', 'Setup Intrusion Prevention System with custom signatures and policies', 200, 10.0, 4, 'ADVANTAGE', ARRAY['https://docs.cisco.com/ips-config'], ARRAY['https://videos.cisco.com/ips-setup'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-005', 'URL Filtering Setup', 'Configure web filtering and URL categorization policies', 120, 6.0, 5, 'ADVANTAGE', ARRAY['https://docs.cisco.com/url-filtering'], ARRAY['https://videos.cisco.com/web-filter'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-006', 'VPN Configuration', 'Setup site-to-site and remote access VPN tunnels', 300, 15.0, 6, 'ESSENTIAL', ARRAY['https://docs.cisco.com/vpn-config'], ARRAY['https://videos.cisco.com/vpn-setup'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-007', 'High Availability Setup', 'Configure firewall clustering for redundancy and failover', 180, 9.0, 7, 'SIGNATURE', ARRAY['https://docs.cisco.com/ha-config'], ARRAY['https://videos.cisco.com/ha-setup'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-008', 'Logging and Monitoring', 'Setup comprehensive logging, SIEM integration, and monitoring dashboards', 150, 7.0, 8, 'ESSENTIAL', ARRAY['https://docs.cisco.com/logging'], ARRAY['https://videos.cisco.com/monitoring'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-009', 'SSL Inspection', 'Configure SSL/TLS decryption and inspection for encrypted traffic', 240, 11.5, 9, 'SIGNATURE', ARRAY['https://docs.cisco.com/ssl-inspect'], ARRAY['https://videos.cisco.com/ssl-decrypt'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-010', 'Application Control', 'Implement application visibility and control policies', 180, 8.0, 10, 'ADVANTAGE', ARRAY['https://docs.cisco.com/app-control'], ARRAY['https://videos.cisco.com/app-policies'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-011', 'User Identity Integration', 'Configure user authentication and identity-based policies', 200, 9.5, 11, 'SIGNATURE', ARRAY['https://docs.cisco.com/user-identity'], ARRAY['https://videos.cisco.com/identity-auth'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-012', 'Malware Protection', 'Setup anti-malware scanning and sandboxing capabilities', 150, 7.5, 12, 'ADVANTAGE', ARRAY['https://docs.cisco.com/malware-protection'], ARRAY['https://videos.cisco.com/sandbox'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-013', 'Performance Optimization', 'Optimize firewall performance and throughput settings', 120, 6.0, 13, 'SIGNATURE', ARRAY['https://docs.cisco.com/performance-tuning'], ARRAY['https://videos.cisco.com/optimization'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-014', 'Backup and Recovery', 'Configure automated backup and disaster recovery procedures', 90, 4.5, 14, 'ESSENTIAL', ARRAY['https://docs.cisco.com/backup-recovery'], ARRAY['https://videos.cisco.com/backup'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-fw-015', 'Security Analytics', 'Deploy advanced security analytics and threat hunting capabilities', 180, 8.5, 15, 'SIGNATURE', ARRAY['https://docs.cisco.com/security-analytics'], ARRAY['https://videos.cisco.com/threat-hunting'], 'prod-firewall-ngfw', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks for Routing/Switching product (12 tasks)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-rt-001', 'Initial Switch Configuration', 'Configure basic switch settings including VLANs, trunking, and management', 120, 10.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/switch-config'], ARRAY['https://videos.cisco.com/switch-basic'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-002', 'Routing Protocol Setup', 'Configure OSPF, EIGRP, and BGP routing protocols', 240, 18.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/routing-protocols'], ARRAY['https://videos.cisco.com/routing-setup'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-003', 'QoS Implementation', 'Setup Quality of Service policies for traffic prioritization', 180, 14.0, 3, 'ADVANTAGE', ARRAY['https://docs.cisco.com/qos-config'], ARRAY['https://videos.cisco.com/qos-setup'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-004', 'Network Security', 'Configure port security, 802.1X, and access control lists', 150, 12.0, 4, 'ESSENTIAL', ARRAY['https://docs.cisco.com/network-security'], ARRAY['https://videos.cisco.com/net-security'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-005', 'Spanning Tree Protocol', 'Configure STP, RSTP, and MST for loop prevention', 120, 9.0, 5, 'ESSENTIAL', ARRAY['https://docs.cisco.com/stp-config'], ARRAY['https://videos.cisco.com/stp-setup'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-006', 'MPLS Configuration', 'Setup MPLS VPNs and traffic engineering', 300, 20.0, 6, 'SIGNATURE', ARRAY['https://docs.cisco.com/mpls-config'], ARRAY['https://videos.cisco.com/mpls-setup'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-007', 'Network Automation', 'Implement network automation with DNA Center and APIs', 180, 13.0, 7, 'ADVANTAGE', ARRAY['https://docs.cisco.com/dna-automation'], ARRAY['https://videos.cisco.com/automation'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-008', 'Monitoring and Analytics', 'Setup network monitoring, telemetry, and analytics', 120, 8.0, 8, 'ESSENTIAL', ARRAY['https://docs.cisco.com/monitoring'], ARRAY['https://videos.cisco.com/analytics'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-009', 'High Availability', 'Configure VSS, StackWise, and redundancy protocols', 150, 11.0, 9, 'ADVANTAGE', ARRAY['https://docs.cisco.com/ha-switching'], ARRAY['https://videos.cisco.com/redundancy'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-010', 'SD-Access Integration', 'Deploy Software-Defined Access fabric', 240, 16.0, 10, 'SIGNATURE', ARRAY['https://docs.cisco.com/sd-access'], ARRAY['https://videos.cisco.com/sda-fabric'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-011', 'Network Segmentation', 'Implement micro-segmentation and zero-trust networking', 180, 12.0, 11, 'SIGNATURE', ARRAY['https://docs.cisco.com/segmentation'], ARRAY['https://videos.cisco.com/zero-trust'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-rt-012', 'Performance Optimization', 'Optimize network performance and troubleshoot bottlenecks', 120, 7.0, 12, 'ADVANTAGE', ARRAY['https://docs.cisco.com/performance'], ARRAY['https://videos.cisco.com/optimization'], 'prod-routing-switching', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks for MFA/SSO product (14 tasks)  
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-mfa-001', 'Identity Provider Setup', 'Configure primary identity provider and directory integration', 150, 8.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/idp-setup'], ARRAY['https://videos.cisco.com/identity-provider'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-002', 'MFA Policy Configuration', 'Define multi-factor authentication policies and rules', 180, 12.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/mfa-policies'], ARRAY['https://videos.cisco.com/mfa-config'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-003', 'SSO Application Integration', 'Integrate applications with single sign-on capabilities', 240, 15.0, 3, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sso-integration'], ARRAY['https://videos.cisco.com/sso-apps'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-004', 'Risk-Based Authentication', 'Configure adaptive authentication based on risk factors', 200, 13.0, 4, 'ADVANTAGE', ARRAY['https://docs.cisco.com/risk-auth'], ARRAY['https://videos.cisco.com/adaptive-auth'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-005', 'Device Registration', 'Setup mobile device registration and management', 120, 7.0, 5, 'ESSENTIAL', ARRAY['https://docs.cisco.com/device-mgmt'], ARRAY['https://videos.cisco.com/mobile-devices'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-006', 'Privileged Access Management', 'Configure PAM for administrative and privileged accounts', 300, 18.0, 6, 'SIGNATURE', ARRAY['https://docs.cisco.com/pam-config'], ARRAY['https://videos.cisco.com/privileged-access'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-007', 'Identity Governance', 'Implement access reviews, certifications, and governance workflows', 250, 14.0, 7, 'SIGNATURE', ARRAY['https://docs.cisco.com/governance'], ARRAY['https://videos.cisco.com/access-reviews'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-008', 'API Security', 'Secure APIs with OAuth, OpenID Connect, and token management', 180, 10.0, 8, 'ADVANTAGE', ARRAY['https://docs.cisco.com/api-security'], ARRAY['https://videos.cisco.com/oauth-setup'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-009', 'User Provisioning', 'Automate user lifecycle management and provisioning', 150, 9.0, 9, 'ADVANTAGE', ARRAY['https://docs.cisco.com/provisioning'], ARRAY['https://videos.cisco.com/user-lifecycle'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-010', 'Fraud Detection', 'Configure fraud detection and anomaly detection systems', 200, 12.0, 10, 'SIGNATURE', ARRAY['https://docs.cisco.com/fraud-detection'], ARRAY['https://videos.cisco.com/anomaly-detection'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-011', 'Reporting and Analytics', 'Setup identity analytics, reporting, and compliance dashboards', 120, 6.0, 11, 'ESSENTIAL', ARRAY['https://docs.cisco.com/identity-analytics'], ARRAY['https://videos.cisco.com/reporting'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-012', 'Zero Trust Integration', 'Integrate with zero trust architecture and continuous verification', 180, 11.0, 12, 'SIGNATURE', ARRAY['https://docs.cisco.com/zero-trust'], ARRAY['https://videos.cisco.com/continuous-auth'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-013', 'Backup and Recovery', 'Configure identity system backup and disaster recovery', 90, 5.0, 13, 'ESSENTIAL', ARRAY['https://docs.cisco.com/identity-backup'], ARRAY['https://videos.cisco.com/disaster-recovery'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-mfa-014', 'Performance Tuning', 'Optimize authentication performance and scalability', 120, 7.0, 14, 'ADVANTAGE', ARRAY['https://docs.cisco.com/identity-performance'], ARRAY['https://videos.cisco.com/auth-optimization'], 'prod-mfa-sso', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks for SD-WAN product (16 tasks)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-sdwan-001', 'vManage Deployment', 'Deploy and configure vManage orchestrator and management platform', 240, 12.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/vmanage-deploy'], ARRAY['https://videos.cisco.com/vmanage-setup'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-002', 'Edge Device Onboarding', 'Configure and onboard vEdge/cEdge devices to the fabric', 180, 10.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/edge-onboarding'], ARRAY['https://videos.cisco.com/edge-setup'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-003', 'Overlay Network Design', 'Design and configure overlay network topology and policies', 300, 15.0, 3, 'ESSENTIAL', ARRAY['https://docs.cisco.com/overlay-design'], ARRAY['https://videos.cisco.com/network-topology'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-004', 'Security Policy Templates', 'Create and deploy security policy templates across the fabric', 200, 11.0, 4, 'ADVANTAGE', ARRAY['https://docs.cisco.com/security-templates'], ARRAY['https://videos.cisco.com/security-policies'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-005', 'Traffic Engineering', 'Configure traffic policies, SLA classes, and path selection', 250, 13.0, 5, 'ADVANTAGE', ARRAY['https://docs.cisco.com/traffic-engineering'], ARRAY['https://videos.cisco.com/path-selection'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-006', 'Application-Aware Routing', 'Implement application-aware routing and optimization', 200, 11.5, 6, 'SIGNATURE', ARRAY['https://docs.cisco.com/app-aware-routing'], ARRAY['https://videos.cisco.com/app-optimization'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-007', 'Cloud OnRamp Integration', 'Configure cloud connectivity and multi-cloud integration', 180, 9.0, 7, 'ADVANTAGE', ARRAY['https://docs.cisco.com/cloud-onramp'], ARRAY['https://videos.cisco.com/cloud-connect'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-008', 'Network Segmentation', 'Implement VPN segmentation and service chaining', 150, 8.0, 8, 'SIGNATURE', ARRAY['https://docs.cisco.com/network-segmentation'], ARRAY['https://videos.cisco.com/vpn-segmentation'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-009', 'Analytics and Monitoring', 'Setup network analytics, monitoring, and troubleshooting tools', 120, 6.5, 9, 'ESSENTIAL', ARRAY['https://docs.cisco.com/sdwan-analytics'], ARRAY['https://videos.cisco.com/network-monitoring'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-010', 'High Availability', 'Configure redundancy, failover, and disaster recovery', 180, 9.5, 10, 'SIGNATURE', ARRAY['https://docs.cisco.com/sdwan-ha'], ARRAY['https://videos.cisco.com/redundancy'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-011', 'Quality of Service', 'Implement QoS policies and bandwidth management', 150, 7.5, 11, 'ADVANTAGE', ARRAY['https://docs.cisco.com/sdwan-qos'], ARRAY['https://videos.cisco.com/bandwidth-mgmt'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-012', 'Integration with Security Tools', 'Integrate with third-party security tools and services', 200, 10.5, 12, 'SIGNATURE', ARRAY['https://docs.cisco.com/security-integration'], ARRAY['https://videos.cisco.com/security-tools'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-013', 'Automation and Orchestration', 'Implement network automation and zero-touch provisioning', 240, 12.5, 13, 'SIGNATURE', ARRAY['https://docs.cisco.com/sdwan-automation'], ARRAY['https://videos.cisco.com/zero-touch'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-014', 'Performance Optimization', 'Optimize network performance and application delivery', 120, 6.0, 14, 'ADVANTAGE', ARRAY['https://docs.cisco.com/performance-opt'], ARRAY['https://videos.cisco.com/app-delivery'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-015', 'Compliance and Reporting', 'Configure compliance monitoring and regulatory reporting', 90, 4.5, 15, 'ESSENTIAL', ARRAY['https://docs.cisco.com/compliance'], ARRAY['https://videos.cisco.com/reporting'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-sdwan-016', 'Migration Strategy', 'Plan and execute migration from traditional WAN to SD-WAN', 300, 15.0, 16, 'SIGNATURE', ARRAY['https://docs.cisco.com/migration'], ARRAY['https://videos.cisco.com/wan-migration'], 'prod-sdwan-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert tasks for Cloud Security product (18 tasks)
INSERT INTO "Task" (id, name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", "howToDoc", "howToVideo", "productId", "createdAt", "updatedAt") VALUES
('task-cloud-001', 'Multi-Cloud Discovery', 'Discover and inventory assets across AWS, Azure, and GCP environments', 120, 6.0, 1, 'ESSENTIAL', ARRAY['https://docs.cisco.com/cloud-discovery'], ARRAY['https://videos.cisco.com/asset-inventory'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-002', 'Cloud Security Posture', 'Assess and monitor cloud security posture and compliance', 180, 9.0, 2, 'ESSENTIAL', ARRAY['https://docs.cisco.com/security-posture'], ARRAY['https://videos.cisco.com/compliance-monitoring'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-003', 'Data Loss Prevention', 'Configure DLP policies for cloud applications and storage', 240, 12.0, 3, 'ADVANTAGE', ARRAY['https://docs.cisco.com/cloud-dlp'], ARRAY['https://videos.cisco.com/data-protection'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-004', 'Cloud Access Security Broker', 'Deploy CASB for SaaS and cloud application protection', 200, 10.5, 4, 'ADVANTAGE', ARRAY['https://docs.cisco.com/casb-deploy'], ARRAY['https://videos.cisco.com/casb-setup'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-005', 'Container Security', 'Implement container and Kubernetes security scanning', 150, 8.0, 5, 'SIGNATURE', ARRAY['https://docs.cisco.com/container-security'], ARRAY['https://videos.cisco.com/k8s-security'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-006', 'Serverless Protection', 'Configure serverless function security and monitoring', 120, 6.5, 6, 'SIGNATURE', ARRAY['https://docs.cisco.com/serverless-security'], ARRAY['https://videos.cisco.com/function-protection'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-007', 'Identity and Access Management', 'Integrate with cloud IAM and implement zero trust policies', 180, 9.5, 7, 'ESSENTIAL', ARRAY['https://docs.cisco.com/cloud-iam'], ARRAY['https://videos.cisco.com/zero-trust-cloud'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-008', 'Network Security Groups', 'Configure cloud network security and micro-segmentation', 150, 7.5, 8, 'ADVANTAGE', ARRAY['https://docs.cisco.com/cloud-network-security'], ARRAY['https://videos.cisco.com/micro-segmentation'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-009', 'Vulnerability Management', 'Implement cloud workload vulnerability scanning and remediation', 200, 10.0, 9, 'ESSENTIAL', ARRAY['https://docs.cisco.com/vuln-management'], ARRAY['https://videos.cisco.com/vulnerability-scanning'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-010', 'Threat Detection and Response', 'Deploy cloud threat detection and automated response capabilities', 250, 13.0, 10, 'SIGNATURE', ARRAY['https://docs.cisco.com/threat-detection'], ARRAY['https://videos.cisco.com/automated-response'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-011', 'Data Encryption', 'Configure cloud data encryption at rest and in transit', 180, 9.0, 11, 'ADVANTAGE', ARRAY['https://docs.cisco.com/cloud-encryption'], ARRAY['https://videos.cisco.com/data-encryption'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-012', 'API Security', 'Secure cloud APIs with authentication, authorization, and monitoring', 150, 7.0, 12, 'ADVANTAGE', ARRAY['https://docs.cisco.com/api-security'], ARRAY['https://videos.cisco.com/api-protection'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-013', 'DevSecOps Integration', 'Integrate security into CI/CD pipelines and DevOps workflows', 240, 12.0, 13, 'SIGNATURE', ARRAY['https://docs.cisco.com/devsecops'], ARRAY['https://videos.cisco.com/cicd-security'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-014', 'Cloud Backup Security', 'Secure cloud backup and disaster recovery processes', 120, 6.0, 14, 'ESSENTIAL', ARRAY['https://docs.cisco.com/backup-security'], ARRAY['https://videos.cisco.com/secure-backup'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-015', 'Compliance Automation', 'Automate compliance reporting for cloud security frameworks', 180, 8.5, 15, 'ADVANTAGE', ARRAY['https://docs.cisco.com/compliance-automation'], ARRAY['https://videos.cisco.com/automated-compliance'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-016', 'Security Analytics', 'Deploy cloud security analytics and machine learning detection', 200, 11.0, 16, 'SIGNATURE', ARRAY['https://docs.cisco.com/security-analytics'], ARRAY['https://videos.cisco.com/ml-detection'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-017', 'Incident Response', 'Configure cloud incident response and forensics capabilities', 150, 7.5, 17, 'SIGNATURE', ARRAY['https://docs.cisco.com/incident-response'], ARRAY['https://videos.cisco.com/cloud-forensics'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('task-cloud-018', 'Cost Optimization', 'Optimize cloud security costs and resource utilization', 90, 4.5, 18, 'ESSENTIAL', ARRAY['https://docs.cisco.com/cost-optimization'], ARRAY['https://videos.cisco.com/resource-optimization'], 'prod-cloud-security', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Now insert telemetry attributes for all tasks (each task gets 1-2 attributes)
INSERT INTO "TelemetryAttribute" (id, "taskId", name, description, "dataType", "isRequired", "successCriteria", "order", "isActive", "createdAt", "updatedAt") VALUES

-- Firewall Telemetry Attributes
('tel-fw-001-1', 'task-fw-001', 'interfaces_configured', 'Number of firewall interfaces properly configured', 'NUMBER', true, '{"operator": ">=", "value": 2, "description": "At least 2 interfaces must be configured"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-001-2', 'task-fw-001', 'default_policy_active', 'Default security policy is active and blocking', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Default deny policy must be active"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-002-1', 'task-fw-002', 'security_policies_count', 'Number of active security policies configured', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "Minimum 10 security policies required"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-002-2', 'task-fw-002', 'policy_hit_rate', 'Percentage of policies with traffic hits in last 24h', 'NUMBER', false, '{"operator": ">=", "value": 80, "description": "At least 80% of policies should see traffic"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-003-1', 'task-fw-003', 'threat_feeds_active', 'Number of active threat intelligence feeds', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "Minimum 3 threat feeds must be active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-003-2', 'task-fw-003', 'reputation_blocks_24h', 'Threats blocked by reputation in last 24 hours', 'NUMBER', false, '{"operator": ">=", "value": 1, "description": "Should block at least 1 threat per day"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-004-1', 'task-fw-004', 'ips_signatures_enabled', 'Number of active IPS signatures', 'NUMBER', true, '{"operator": ">=", "value": 1000, "description": "Minimum 1000 IPS signatures enabled"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-004-2', 'task-fw-004', 'ips_events_24h', 'IPS events detected in last 24 hours', 'NUMBER', false, '{"operator": ">=", "value": 10, "description": "Should detect security events"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-005-1', 'task-fw-005', 'url_categories_blocked', 'Number of URL categories being blocked', 'NUMBER', true, '{"operator": ">=", "value": 15, "description": "Block at least 15 risky URL categories"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-006-1', 'task-fw-006', 'active_vpn_tunnels', 'Number of active VPN tunnels', 'NUMBER', true, '{"operator": ">=", "value": 2, "description": "At least 2 VPN tunnels must be established"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-fw-006-2', 'task-fw-006', 'vpn_tunnel_uptime', 'VPN tunnel uptime percentage', 'NUMBER', true, '{"operator": ">=", "value": 99, "description": "VPN uptime must be 99% or higher"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-007-1', 'task-fw-007', 'ha_sync_status', 'High availability synchronization status', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "HA sync must be active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-008-1', 'task-fw-008', 'log_events_per_hour', 'Security log events generated per hour', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "Should generate at least 100 log events per hour"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-009-1', 'task-fw-009', 'ssl_sessions_inspected', 'Percentage of SSL sessions being inspected', 'NUMBER', true, '{"operator": ">=", "value": 70, "description": "At least 70% of SSL traffic must be inspected"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-010-1', 'task-fw-010', 'applications_identified', 'Number of unique applications identified', 'NUMBER', true, '{"operator": ">=", "value": 50, "description": "Should identify at least 50 different applications"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-011-1', 'task-fw-011', 'authenticated_users', 'Number of successfully authenticated users in 24h', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 users should authenticate daily"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-012-1', 'task-fw-012', 'malware_detections_24h', 'Malware samples detected in last 24 hours', 'NUMBER', false, '{"operator": ">=", "value": 1, "description": "Should detect malware attempts"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-013-1', 'task-fw-013', 'throughput_mbps', 'Current firewall throughput in Mbps', 'NUMBER', true, '{"operator": ">=", "value": 1000, "description": "Should achieve minimum 1Gbps throughput"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-014-1', 'task-fw-014', 'backup_success_rate', 'Configuration backup success rate percentage', 'NUMBER', true, '{"operator": ">=", "value": 95, "description": "Backup success rate must be 95% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-fw-015-1', 'task-fw-015', 'security_incidents_detected', 'Security incidents detected by analytics', 'NUMBER', false, '{"operator": ">=", "value": 1, "description": "Analytics should detect security incidents"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Routing/Switching Telemetry Attributes
('tel-rt-001-1', 'task-rt-001', 'vlans_configured', 'Number of VLANs properly configured', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 VLANs must be configured"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-002-1', 'task-rt-002', 'routing_convergence_time', 'Network convergence time in seconds', 'NUMBER', true, '{"operator": "<=", "value": 30, "description": "Routing convergence must be under 30 seconds"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-rt-002-2', 'task-rt-002', 'active_routing_peers', 'Number of active routing protocol peers', 'NUMBER', true, '{"operator": ">=", "value": 2, "description": "At least 2 routing peers must be active"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-003-1', 'task-rt-003', 'qos_policies_active', 'Number of active QoS policies', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "Minimum 3 QoS policies must be active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-004-1', 'task-rt-004', 'secured_ports_percentage', 'Percentage of ports with security enabled', 'NUMBER', true, '{"operator": ">=", "value": 90, "description": "90% of ports must have security features enabled"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-005-1', 'task-rt-005', 'stp_convergence_time', 'STP convergence time in seconds', 'NUMBER', true, '{"operator": "<=", "value": 50, "description": "STP convergence must be under 50 seconds"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-006-1', 'task-rt-006', 'mpls_labels_in_use', 'Number of MPLS labels currently in use', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "At least 100 MPLS labels should be in use"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-007-1', 'task-rt-007', 'automated_deployments_24h', 'Successful automated deployments in last 24h', 'NUMBER', false, '{"operator": ">=", "value": 1, "description": "Should have automated deployments"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-008-1', 'task-rt-008', 'network_uptime_percentage', 'Network uptime percentage', 'NUMBER', true, '{"operator": ">=", "value": 99.9, "description": "Network uptime must be 99.9% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-009-1', 'task-rt-009', 'redundant_paths_available', 'Number of redundant network paths available', 'NUMBER', true, '{"operator": ">=", "value": 2, "description": "At least 2 redundant paths must be available"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-010-1', 'task-rt-010', 'sda_fabric_nodes', 'Number of nodes in SD-Access fabric', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "SD-Access fabric must have at least 3 nodes"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-011-1', 'task-rt-011', 'security_groups_configured', 'Number of security groups configured', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 security groups for segmentation"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-rt-012-1', 'task-rt-012', 'network_latency_ms', 'Average network latency in milliseconds', 'NUMBER', true, '{"operator": "<=", "value": 10, "description": "Network latency must be under 10ms"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- MFA/SSO Telemetry Attributes  
('tel-mfa-001-1', 'task-mfa-001', 'directory_sync_success', 'Directory synchronization success rate', 'NUMBER', true, '{"operator": ">=", "value": 95, "description": "Directory sync success must be 95% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-002-1', 'task-mfa-002', 'mfa_success_rate', 'MFA authentication success rate percentage', 'NUMBER', true, '{"operator": ">=", "value": 98, "description": "MFA success rate must be 98% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-mfa-002-2', 'task-mfa-002', 'mfa_methods_configured', 'Number of MFA methods configured', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "At least 3 MFA methods must be available"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-003-1', 'task-mfa-003', 'sso_applications_integrated', 'Number of applications integrated with SSO', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 applications must support SSO"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-004-1', 'task-mfa-004', 'risk_scores_calculated', 'Risk scores calculated in last 24h', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "Should calculate risk for authentication attempts"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-005-1', 'task-mfa-005', 'registered_devices', 'Number of registered mobile devices', 'NUMBER', true, '{"operator": ">=", "value": 20, "description": "At least 20 devices should be registered"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-006-1', 'task-mfa-006', 'privileged_sessions_monitored', 'Privileged sessions under active monitoring', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "Should monitor privileged access sessions"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-007-1', 'task-mfa-007', 'access_reviews_completed', 'Access reviews completed this month', 'NUMBER', false, '{"operator": ">=", "value": 1, "description": "Should complete monthly access reviews"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-008-1', 'task-mfa-008', 'api_tokens_issued_24h', 'API tokens issued in last 24 hours', 'NUMBER', false, '{"operator": ">=", "value": 50, "description": "Should issue API tokens for applications"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-009-1', 'task-mfa-009', 'user_provisioning_time_minutes', 'Average user provisioning time in minutes', 'NUMBER', true, '{"operator": "<=", "value": 10, "description": "User provisioning should complete within 10 minutes"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-010-1', 'task-mfa-010', 'fraud_attempts_blocked', 'Fraud attempts blocked in last 24h', 'NUMBER', false, '{"operator": ">=", "value": 1, "description": "Should detect and block fraud attempts"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-011-1', 'task-mfa-011', 'compliance_reports_generated', 'Compliance reports generated this month', 'NUMBER', true, '{"operator": ">=", "value": 1, "description": "Should generate monthly compliance reports"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-012-1', 'task-mfa-012', 'continuous_verification_checks', 'Continuous verification checks in last hour', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "Should perform continuous verification"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-013-1', 'task-mfa-013', 'backup_recovery_test_success', 'Backup recovery test success status', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Backup recovery tests must pass"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-mfa-014-1', 'task-mfa-014', 'authentication_latency_ms', 'Average authentication latency in milliseconds', 'NUMBER', true, '{"operator": "<=", "value": 500, "description": "Authentication must complete within 500ms"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- SD-WAN Telemetry Attributes
('tel-sdwan-001-1', 'task-sdwan-001', 'vmanage_cluster_health', 'vManage cluster health status', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "vManage cluster must be healthy"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-002-1', 'task-sdwan-002', 'edge_devices_online', 'Number of edge devices online', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 edge devices must be online"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-003-1', 'task-sdwan-003', 'overlay_tunnels_established', 'Number of overlay tunnels established', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 overlay tunnels must be active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-sdwan-003-2', 'task-sdwan-003', 'tunnel_uptime_percentage', 'Overlay tunnel uptime percentage', 'NUMBER', true, '{"operator": ">=", "value": 99, "description": "Tunnel uptime must be 99% or higher"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-004-1', 'task-sdwan-004', 'security_policies_deployed', 'Number of security policies deployed', 'NUMBER', true, '{"operator": ">=", "value": 15, "description": "At least 15 security policies must be deployed"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-005-1', 'task-sdwan-005', 'sla_classes_configured', 'Number of SLA classes configured', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "At least 5 SLA classes must be configured"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-006-1', 'task-sdwan-006', 'application_routes_learned', 'Application-aware routes learned', 'NUMBER', true, '{"operator": ">=", "value": 50, "description": "Should learn routes for at least 50 applications"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-007-1', 'task-sdwan-007', 'cloud_connections_active', 'Active cloud connections', 'NUMBER', true, '{"operator": ">=", "value": 2, "description": "At least 2 cloud connections must be active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-008-1', 'task-sdwan-008', 'network_segments_configured', 'Number of network segments configured', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "At least 3 network segments must be configured"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-009-1', 'task-sdwan-009', 'analytics_data_points_hour', 'Analytics data points collected per hour', 'NUMBER', true, '{"operator": ">=", "value": 1000, "description": "Should collect at least 1000 data points per hour"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-010-1', 'task-sdwan-010', 'failover_test_success', 'Failover test success status', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "Failover tests must pass successfully"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-011-1', 'task-sdwan-011', 'qos_queues_utilized', 'Percentage of QoS queues being utilized', 'NUMBER', true, '{"operator": ">=", "value": 70, "description": "At least 70% of QoS queues should be utilized"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-012-1', 'task-sdwan-012', 'security_integrations_active', 'Number of active security integrations', 'NUMBER', true, '{"operator": ">=", "value": 3, "description": "At least 3 security integrations must be active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-013-1', 'task-sdwan-013', 'zero_touch_deployments_24h', 'Zero-touch deployments in last 24h', 'NUMBER', false, '{"operator": ">=", "value": 1, "description": "Should perform zero-touch deployments"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-014-1', 'task-sdwan-014', 'network_optimization_score', 'Network optimization score percentage', 'NUMBER', true, '{"operator": ">=", "value": 85, "description": "Network optimization score must be 85% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-015-1', 'task-sdwan-015', 'compliance_checks_passed', 'Compliance checks passed percentage', 'NUMBER', true, '{"operator": ">=", "value": 95, "description": "95% of compliance checks must pass"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-sdwan-016-1', 'task-sdwan-016', 'migration_progress_percentage', 'WAN migration progress percentage', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "Migration must be 100% complete"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Cloud Security Telemetry Attributes
('tel-cloud-001-1', 'task-cloud-001', 'cloud_assets_discovered', 'Number of cloud assets discovered', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "Should discover at least 100 cloud assets"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-002-1', 'task-cloud-002', 'security_posture_score', 'Overall security posture score percentage', 'NUMBER', true, '{"operator": ">=", "value": 85, "description": "Security posture score must be 85% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-cloud-002-2', 'task-cloud-002', 'compliance_violations', 'Number of compliance violations detected', 'NUMBER', true, '{"operator": "<=", "value": 5, "description": "Should have 5 or fewer compliance violations"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-003-1', 'task-cloud-003', 'dlp_policies_active', 'Number of active DLP policies', 'NUMBER', true, '{"operator": ">=", "value": 10, "description": "At least 10 DLP policies must be active"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-004-1', 'task-cloud-004', 'casb_protected_apps', 'Number of CASB-protected applications', 'NUMBER', true, '{"operator": ">=", "value": 20, "description": "At least 20 applications must be CASB-protected"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-005-1', 'task-cloud-005', 'containers_scanned_24h', 'Container images scanned in last 24h', 'NUMBER', true, '{"operator": ">=", "value": 50, "description": "Should scan at least 50 container images daily"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-006-1', 'task-cloud-006', 'serverless_functions_monitored', 'Serverless functions under monitoring', 'NUMBER', true, '{"operator": ">=", "value": 25, "description": "Should monitor at least 25 serverless functions"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-007-1', 'task-cloud-007', 'iam_policies_evaluated', 'IAM policies evaluated for compliance', 'NUMBER', true, '{"operator": ">=", "value": 100, "description": "Should evaluate at least 100 IAM policies"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-008-1', 'task-cloud-008', 'network_security_groups', 'Number of network security groups configured', 'NUMBER', true, '{"operator": ">=", "value": 15, "description": "At least 15 network security groups must be configured"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-009-1', 'task-cloud-009', 'vulnerabilities_remediated_rate', 'Vulnerability remediation rate percentage', 'NUMBER', true, '{"operator": ">=", "value": 90, "description": "90% of vulnerabilities must be remediated"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-010-1', 'task-cloud-010', 'threats_detected_24h', 'Threats detected in last 24 hours', 'NUMBER', false, '{"operator": ">=", "value": 10, "description": "Should detect security threats"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tel-cloud-010-2', 'task-cloud-010', 'response_time_minutes', 'Average threat response time in minutes', 'NUMBER', true, '{"operator": "<=", "value": 15, "description": "Threat response must be within 15 minutes"}', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-011-1', 'task-cloud-011', 'encrypted_data_percentage', 'Percentage of data encrypted', 'NUMBER', true, '{"operator": ">=", "value": 95, "description": "At least 95% of data must be encrypted"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-012-1', 'task-cloud-012', 'api_security_events_24h', 'API security events in last 24h', 'NUMBER', false, '{"operator": ">=", "value": 100, "description": "Should monitor API security events"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-013-1', 'task-cloud-013', 'secure_pipelines_percentage', 'Percentage of secure CI/CD pipelines', 'NUMBER', true, '{"operator": ">=", "value": 90, "description": "90% of pipelines must have security integration"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-014-1', 'task-cloud-014', 'backup_encryption_status', 'Backup encryption enabled status', 'BOOLEAN', true, '{"operator": "==", "value": true, "description": "All backups must be encrypted"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-015-1', 'task-cloud-015', 'automated_compliance_reports', 'Automated compliance reports generated monthly', 'NUMBER', true, '{"operator": ">=", "value": 5, "description": "Should generate at least 5 compliance reports monthly"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-016-1', 'task-cloud-016', 'ml_model_accuracy_percentage', 'ML detection model accuracy percentage', 'NUMBER', true, '{"operator": ">=", "value": 92, "description": "ML model accuracy must be 92% or higher"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-017-1', 'task-cloud-017', 'incident_response_time_minutes', 'Average incident response time in minutes', 'NUMBER', true, '{"operator": "<=", "value": 30, "description": "Incident response must be within 30 minutes"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('tel-cloud-018-1', 'task-cloud-018', 'cost_optimization_percentage', 'Cost optimization achieved percentage', 'NUMBER', true, '{"operator": ">=", "value": 20, "description": "Should achieve at least 20% cost optimization"}', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Link tasks to outcomes
INSERT INTO "TaskOutcome" (id, "taskId", "outcomeId") VALUES
-- Firewall task-outcome mappings
('to-fw-001', 'task-fw-001', 'outcome-firewall-security'),
('to-fw-002', 'task-fw-002', 'outcome-firewall-security'),
('to-fw-003', 'task-fw-003', 'outcome-firewall-security'),
('to-fw-004', 'task-fw-004', 'outcome-firewall-security'),
('to-fw-005', 'task-fw-005', 'outcome-firewall-security'),
('to-fw-006', 'task-fw-006', 'outcome-firewall-security'),
('to-fw-007', 'task-fw-007', 'outcome-firewall-security'),
('to-fw-008', 'task-fw-008', 'outcome-firewall-visibility'),
('to-fw-009', 'task-fw-009', 'outcome-firewall-security'),
('to-fw-010', 'task-fw-010', 'outcome-firewall-visibility'),
('to-fw-011', 'task-fw-011', 'outcome-firewall-security'),
('to-fw-012', 'task-fw-012', 'outcome-firewall-security'),
('to-fw-013', 'task-fw-013', 'outcome-firewall-security'),
('to-fw-014', 'task-fw-014', 'outcome-firewall-compliance'),
('to-fw-015', 'task-fw-015', 'outcome-firewall-visibility'),

-- Routing task-outcome mappings  
('to-rt-001', 'task-rt-001', 'outcome-routing-performance'),
('to-rt-002', 'task-rt-002', 'outcome-routing-performance'),
('to-rt-003', 'task-rt-003', 'outcome-routing-performance'),
('to-rt-004', 'task-rt-004', 'outcome-routing-scalability'),
('to-rt-005', 'task-rt-005', 'outcome-routing-performance'),
('to-rt-006', 'task-rt-006', 'outcome-routing-scalability'),
('to-rt-007', 'task-rt-007', 'outcome-routing-automation'),
('to-rt-008', 'task-rt-008', 'outcome-routing-performance'),
('to-rt-009', 'task-rt-009', 'outcome-routing-scalability'),
('to-rt-010', 'task-rt-010', 'outcome-routing-automation'),
('to-rt-011', 'task-rt-011', 'outcome-routing-scalability'),
('to-rt-012', 'task-rt-012', 'outcome-routing-performance'),

-- MFA task-outcome mappings
('to-mfa-001', 'task-mfa-001', 'outcome-mfa-security'),
('to-mfa-002', 'task-mfa-002', 'outcome-mfa-security'),
('to-mfa-003', 'task-mfa-003', 'outcome-mfa-productivity'),
('to-mfa-004', 'task-mfa-004', 'outcome-mfa-security'),
('to-mfa-005', 'task-mfa-005', 'outcome-mfa-productivity'),
('to-mfa-006', 'task-mfa-006', 'outcome-mfa-security'),
('to-mfa-007', 'task-mfa-007', 'outcome-mfa-compliance'),
('to-mfa-008', 'task-mfa-008', 'outcome-mfa-security'),
('to-mfa-009', 'task-mfa-009', 'outcome-mfa-productivity'),
('to-mfa-010', 'task-mfa-010', 'outcome-mfa-security'),
('to-mfa-011', 'task-mfa-011', 'outcome-mfa-compliance'),
('to-mfa-012', 'task-mfa-012', 'outcome-mfa-security'),
('to-mfa-013', 'task-mfa-013', 'outcome-mfa-compliance'),
('to-mfa-014', 'task-mfa-014', 'outcome-mfa-productivity'),

-- SD-WAN task-outcome mappings
('to-sdwan-001', 'task-sdwan-001', 'outcome-sdwan-agility'),
('to-sdwan-002', 'task-sdwan-002', 'outcome-sdwan-agility'),
('to-sdwan-003', 'task-sdwan-003', 'outcome-sdwan-agility'),
('to-sdwan-004', 'task-sdwan-004', 'outcome-sdwan-security'),
('to-sdwan-005', 'task-sdwan-005', 'outcome-sdwan-agility'),
('to-sdwan-006', 'task-sdwan-006', 'outcome-sdwan-agility'),
('to-sdwan-007', 'task-sdwan-007', 'outcome-sdwan-cost'),
('to-sdwan-008', 'task-sdwan-008', 'outcome-sdwan-security'),
('to-sdwan-009', 'task-sdwan-009', 'outcome-sdwan-agility'),
('to-sdwan-010', 'task-sdwan-010', 'outcome-sdwan-security'),
('to-sdwan-011', 'task-sdwan-011', 'outcome-sdwan-agility'),
('to-sdwan-012', 'task-sdwan-012', 'outcome-sdwan-security'),
('to-sdwan-013', 'task-sdwan-013', 'outcome-sdwan-cost'),
('to-sdwan-014', 'task-sdwan-014', 'outcome-sdwan-agility'),
('to-sdwan-015', 'task-sdwan-015', 'outcome-sdwan-security'),
('to-sdwan-016', 'task-sdwan-016', 'outcome-sdwan-cost'),

-- Cloud Security task-outcome mappings
('to-cloud-001', 'task-cloud-001', 'outcome-cloud-visibility'),
('to-cloud-002', 'task-cloud-002', 'outcome-cloud-compliance'),
('to-cloud-003', 'task-cloud-003', 'outcome-cloud-protection'),
('to-cloud-004', 'task-cloud-004', 'outcome-cloud-protection'),
('to-cloud-005', 'task-cloud-005', 'outcome-cloud-protection'),
('to-cloud-006', 'task-cloud-006', 'outcome-cloud-protection'),
('to-cloud-007', 'task-cloud-007', 'outcome-cloud-protection'),
('to-cloud-008', 'task-cloud-008', 'outcome-cloud-protection'),
('to-cloud-009', 'task-cloud-009', 'outcome-cloud-protection'),
('to-cloud-010', 'task-cloud-010', 'outcome-cloud-protection'),
('to-cloud-011', 'task-cloud-011', 'outcome-cloud-protection'),
('to-cloud-012', 'task-cloud-012', 'outcome-cloud-protection'),
('to-cloud-013', 'task-cloud-013', 'outcome-cloud-protection'),
('to-cloud-014', 'task-cloud-014', 'outcome-cloud-protection'),
('to-cloud-015', 'task-cloud-015', 'outcome-cloud-compliance'),
('to-cloud-016', 'task-cloud-016', 'outcome-cloud-protection'),
('to-cloud-017', 'task-cloud-017', 'outcome-cloud-protection'),
('to-cloud-018', 'task-cloud-018', 'outcome-cloud-visibility');

-- Link tasks to releases
INSERT INTO "TaskRelease" (id, "taskId", "releaseId") VALUES
-- Firewall task-release mappings
('tr-fw-001', 'task-fw-001', 'rel-firewall-1.0'),
('tr-fw-002', 'task-fw-002', 'rel-firewall-1.0'),
('tr-fw-003', 'task-fw-003', 'rel-firewall-2.0'),
('tr-fw-004', 'task-fw-004', 'rel-firewall-2.0'),
('tr-fw-005', 'task-fw-005', 'rel-firewall-2.0'),
('tr-fw-006', 'task-fw-006', 'rel-firewall-1.0'),
('tr-fw-007', 'task-fw-007', 'rel-firewall-2.0'),
('tr-fw-008', 'task-fw-008', 'rel-firewall-1.0'),
('tr-fw-009', 'task-fw-009', 'rel-firewall-3.0'),
('tr-fw-010', 'task-fw-010', 'rel-firewall-2.0'),
('tr-fw-011', 'task-fw-011', 'rel-firewall-3.0'),
('tr-fw-012', 'task-fw-012', 'rel-firewall-2.0'),
('tr-fw-013', 'task-fw-013', 'rel-firewall-3.0'),
('tr-fw-014', 'task-fw-014', 'rel-firewall-1.0'),
('tr-fw-015', 'task-fw-015', 'rel-firewall-3.0'),

-- Routing task-release mappings
('tr-rt-001', 'task-rt-001', 'rel-routing-1.0'),
('tr-rt-002', 'task-rt-002', 'rel-routing-1.0'),
('tr-rt-003', 'task-rt-003', 'rel-routing-1.0'),
('tr-rt-004', 'task-rt-004', 'rel-routing-1.0'),
('tr-rt-005', 'task-rt-005', 'rel-routing-1.0'),
('tr-rt-006', 'task-rt-006', 'rel-routing-2.0'),
('tr-rt-007', 'task-rt-007', 'rel-routing-2.0'),
('tr-rt-008', 'task-rt-008', 'rel-routing-1.0'),
('tr-rt-009', 'task-rt-009', 'rel-routing-2.0'),
('tr-rt-010', 'task-rt-010', 'rel-routing-2.0'),
('tr-rt-011', 'task-rt-011', 'rel-routing-2.0'),
('tr-rt-012', 'task-rt-012', 'rel-routing-2.0'),

-- MFA task-release mappings
('tr-mfa-001', 'task-mfa-001', 'rel-mfa-1.0'),
('tr-mfa-002', 'task-mfa-002', 'rel-mfa-1.0'),
('tr-mfa-003', 'task-mfa-003', 'rel-mfa-1.0'),
('tr-mfa-004', 'task-mfa-004', 'rel-mfa-2.0'),
('tr-mfa-005', 'task-mfa-005', 'rel-mfa-1.0'),
('tr-mfa-006', 'task-mfa-006', 'rel-mfa-2.0'),
('tr-mfa-007', 'task-mfa-007', 'rel-mfa-2.0'),
('tr-mfa-008', 'task-mfa-008', 'rel-mfa-1.0'),
('tr-mfa-009', 'task-mfa-009', 'rel-mfa-1.0'),
('tr-mfa-010', 'task-mfa-010', 'rel-mfa-2.0'),
('tr-mfa-011', 'task-mfa-011', 'rel-mfa-1.0'),
('tr-mfa-012', 'task-mfa-012', 'rel-mfa-2.0'),
('tr-mfa-013', 'task-mfa-013', 'rel-mfa-1.0'),
('tr-mfa-014', 'task-mfa-014', 'rel-mfa-2.0'),

-- SD-WAN task-release mappings  
('tr-sdwan-001', 'task-sdwan-001', 'rel-sdwan-1.0'),
('tr-sdwan-002', 'task-sdwan-002', 'rel-sdwan-1.0'),
('tr-sdwan-003', 'task-sdwan-003', 'rel-sdwan-1.0'),
('tr-sdwan-004', 'task-sdwan-004', 'rel-sdwan-1.0'),
('tr-sdwan-005', 'task-sdwan-005', 'rel-sdwan-1.0'),
('tr-sdwan-006', 'task-sdwan-006', 'rel-sdwan-2.0'),
('tr-sdwan-007', 'task-sdwan-007', 'rel-sdwan-1.0'),
('tr-sdwan-008', 'task-sdwan-008', 'rel-sdwan-2.0'),
('tr-sdwan-009', 'task-sdwan-009', 'rel-sdwan-1.0'),
('tr-sdwan-010', 'task-sdwan-010', 'rel-sdwan-2.0'),
('tr-sdwan-011', 'task-sdwan-011', 'rel-sdwan-1.0'),
('tr-sdwan-012', 'task-sdwan-012', 'rel-sdwan-2.0'),
('tr-sdwan-013', 'task-sdwan-013', 'rel-sdwan-2.0'),
('tr-sdwan-014', 'task-sdwan-014', 'rel-sdwan-2.0'),
('tr-sdwan-015', 'task-sdwan-015', 'rel-sdwan-1.0'),
('tr-sdwan-016', 'task-sdwan-016', 'rel-sdwan-2.0'),

-- Cloud Security task-release mappings
('tr-cloud-001', 'task-cloud-001', 'rel-cloud-1.0'),
('tr-cloud-002', 'task-cloud-002', 'rel-cloud-1.0'),
('tr-cloud-003', 'task-cloud-003', 'rel-cloud-1.0'),
('tr-cloud-004', 'task-cloud-004', 'rel-cloud-1.0'),
('tr-cloud-005', 'task-cloud-005', 'rel-cloud-2.0'),
('tr-cloud-006', 'task-cloud-006', 'rel-cloud-2.0'),
('tr-cloud-007', 'task-cloud-007', 'rel-cloud-1.0'),
('tr-cloud-008', 'task-cloud-008', 'rel-cloud-1.0'),
('tr-cloud-009', 'task-cloud-009', 'rel-cloud-1.0'),
('tr-cloud-010', 'task-cloud-010', 'rel-cloud-2.0'),
('tr-cloud-011', 'task-cloud-011', 'rel-cloud-1.0'),
('tr-cloud-012', 'task-cloud-012', 'rel-cloud-1.0'),
('tr-cloud-013', 'task-cloud-013', 'rel-cloud-2.0'),
('tr-cloud-014', 'task-cloud-014', 'rel-cloud-1.0'),
('tr-cloud-015', 'task-cloud-015', 'rel-cloud-1.0'),
('tr-cloud-016', 'task-cloud-016', 'rel-cloud-2.0'),
('tr-cloud-017', 'task-cloud-017', 'rel-cloud-2.0'),
('tr-cloud-018', 'task-cloud-018', 'rel-cloud-1.0');
