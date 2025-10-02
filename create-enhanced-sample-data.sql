-- Enhanced Sample Data Script for DAP Application
-- 5 Products with comprehensive attributes that satisfy ALL mandatory constraints
-- Each product has mandatory Essential license, outcome with product name, and release 1.0
-- All tasks include howToDoc and howToVideo fields

-- Clean existing data first
DELETE FROM "TaskOutcome";
DELETE FROM "TaskRelease";
DELETE FROM "Task";
DELETE FROM "Outcome";
DELETE FROM "Release";
DELETE FROM "License";
DELETE FROM "CustomerProduct";
DELETE FROM "CustomerSolution";
DELETE FROM "Product";
DELETE FROM "Solution";
DELETE FROM "Customer";
DELETE FROM "AuditLog";
DELETE FROM "ChangeItem";
DELETE FROM "ChangeSet";
DELETE FROM "Telemetry";

-- Insert 5 comprehensive products with mandatory attributes
INSERT INTO "Product" (id, name, description, "customAttrs", "createdAt", "updatedAt") VALUES
(
    'prod-ecommerce-advanced',
    'Advanced E-Commerce Platform',
    'Next-generation e-commerce solution with AI-powered recommendations, multi-vendor support, and advanced analytics',
    '{"version": "3.2.1", "priority": "high", "technology_stack": ["React", "Node.js", "PostgreSQL", "Redis"], "target_market": "Enterprise", "scalability": "High", "compliance": ["PCI-DSS", "GDPR"], "deployment": "Cloud-Native", "maintenance_level": "Premium"}',
    CURRENT_TIMESTAMP - INTERVAL '90 days',
    CURRENT_TIMESTAMP
),
(
    'prod-fintech-suite',
    'FinTech Banking Suite',
    'Comprehensive banking platform with blockchain integration, digital wallet, and advanced fraud detection',
    '{"version": "2.1.0", "priority": "critical", "technology_stack": ["Microservices", "Kubernetes", "MongoDB", "Blockchain"], "security_level": "Maximum", "platform": "Multi-Platform", "compliance": ["SOX", "PCI-DSS", "Basel III"], "api_endpoints": 150, "transaction_volume": "1M+/day"}',
    CURRENT_TIMESTAMP - INTERVAL '120 days',
    CURRENT_TIMESTAMP
),
(
    'prod-healthcare-ecosystem',
    'Healthcare Management Ecosystem',
    'Integrated healthcare platform with telemedicine, AI diagnostics, and comprehensive patient management',
    '{"version": "4.0.2", "priority": "high", "technology_stack": ["Vue.js", "Python", "TensorFlow", "PostgreSQL"], "industry": "Healthcare", "compliance": ["HIPAA", "FDA", "HL7-FHIR"], "ai_features": true, "interoperability": "Full", "patient_capacity": "100K+"}',
    CURRENT_TIMESTAMP - INTERVAL '60 days',
    CURRENT_TIMESTAMP
),
(
    'prod-logistics-optimizer',
    'Smart Logistics & Supply Chain Optimizer',
    'AI-driven supply chain management with real-time tracking, predictive analytics, and automated routing',
    '{"version": "1.8.5", "priority": "medium", "technology_stack": ["Angular", "Java Spring", "Apache Kafka", "Elasticsearch"], "industry": "Logistics", "features": ["Route Optimization", "Predictive Analytics", "IoT Integration"], "coverage": "Global", "real_time_tracking": true}',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP
),
(
    'prod-edtech-platform',
    'Educational Technology Platform',
    'Comprehensive learning management system with virtual classrooms, AI tutoring, and adaptive learning paths',
    '{"version": "2.3.0", "priority": "medium", "technology_stack": ["React", "GraphQL", "PostgreSQL", "WebRTC"], "industry": "Education", "target_audience": "K-12 to Higher Ed", "features": ["Virtual Classroom", "AI Tutoring", "Adaptive Learning"], "student_capacity": "50K+", "accessibility": "WCAG 2.1 AA"}',
    CURRENT_TIMESTAMP - INTERVAL '75 days',
    CURRENT_TIMESTAMP
);

-- MANDATORY LICENSES: Each product must have Essential (Level 1) license
INSERT INTO "License" (id, name, description, level, "isActive", "productId", "createdAt", "updatedAt") VALUES
-- E-Commerce Licenses (Essential + additional)
('lic-ecom-essential', 'Essential', 'Essential license with core e-commerce features', 1, true, 'prod-ecommerce-advanced', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-ecom-advantage', 'Advantage', 'Advanced features with premium analytics and support', 2, true, 'prod-ecommerce-advanced', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-ecom-signature', 'Signature', 'Enterprise features with AI capabilities and dedicated support', 3, true, 'prod-ecommerce-advanced', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- FinTech Licenses (Essential + additional)
('lic-fintech-essential', 'Essential', 'Essential license with core banking features', 1, true, 'prod-fintech-suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-fintech-advantage', 'Advantage', 'Advanced trading and analytics with enhanced security', 2, true, 'prod-fintech-suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-fintech-signature', 'Signature', 'Full blockchain and crypto features with premium compliance', 3, true, 'prod-fintech-suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Healthcare Licenses (Essential + additional)
('lic-health-essential', 'Essential', 'Essential license with core healthcare management', 1, true, 'prod-healthcare-ecosystem', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-health-advantage', 'Advantage', 'Advanced AI diagnostics and telemedicine features', 2, true, 'prod-healthcare-ecosystem', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-health-signature', 'Signature', 'Enterprise healthcare with full AI and compliance suite', 3, true, 'prod-healthcare-ecosystem', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Logistics Licenses (Essential + additional)
('lic-logistics-essential', 'Essential', 'Essential license with basic logistics and tracking', 1, true, 'prod-logistics-optimizer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-logistics-advantage', 'Advantage', 'Advanced route optimization and predictive analytics', 2, true, 'prod-logistics-optimizer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-logistics-signature', 'Signature', 'Enterprise logistics with full AI and IoT integration', 3, true, 'prod-logistics-optimizer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- EdTech Licenses (Essential + additional)
('lic-edtech-essential', 'Essential', 'Essential license with basic learning management', 1, true, 'prod-edtech-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-edtech-advantage', 'Advantage', 'Advanced adaptive learning and assessment tools', 2, true, 'prod-edtech-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-edtech-signature', 'Signature', 'Enterprise education with full AI tutoring and analytics', 3, true, 'prod-edtech-platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- MANDATORY OUTCOMES: Each product must have outcome with product name + additional outcomes
INSERT INTO "Outcome" (id, "productId", name, description, "createdAt", "updatedAt") VALUES
-- E-Commerce Outcomes (Product name + additional)
('outcome-ecom-product-name', 'prod-ecommerce-advanced', 'Advanced E-Commerce Platform', 'Primary outcome representing the comprehensive e-commerce platform delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-ecom-revenue', 'prod-ecommerce-advanced', 'Increased Online Revenue', 'Measurable increase in online sales revenue through platform optimization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-ecom-conversion', 'prod-ecommerce-advanced', 'Improved Conversion Rate', 'Enhanced user experience leading to higher conversion rates', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- FinTech Outcomes (Product name + additional)
('outcome-fintech-product-name', 'prod-fintech-suite', 'FinTech Banking Suite', 'Primary outcome representing the comprehensive banking platform delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-fintech-security', 'prod-fintech-suite', 'Enhanced Security Posture', 'Improved fraud detection and security measures reducing financial risks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-fintech-compliance', 'prod-fintech-suite', 'Regulatory Compliance', 'Full compliance with banking regulations and industry standards', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Healthcare Outcomes (Product name + additional)
('outcome-health-product-name', 'prod-healthcare-ecosystem', 'Healthcare Management Ecosystem', 'Primary outcome representing the comprehensive healthcare platform delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-health-efficiency', 'prod-healthcare-ecosystem', 'Operational Efficiency', 'Streamlined healthcare operations reducing administrative overhead', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-health-outcomes', 'prod-healthcare-ecosystem', 'Improved Patient Outcomes', 'Better patient care through AI-assisted diagnostics and care coordination', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Logistics Outcomes (Product name + additional)
('outcome-logistics-product-name', 'prod-logistics-optimizer', 'Smart Logistics & Supply Chain Optimizer', 'Primary outcome representing the comprehensive logistics platform delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-logistics-efficiency', 'prod-logistics-optimizer', 'Supply Chain Efficiency', 'Optimized supply chain operations with reduced costs and improved delivery times', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-logistics-visibility', 'prod-logistics-optimizer', 'Enhanced Visibility', 'Real-time tracking and analytics providing complete supply chain visibility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- EdTech Outcomes (Product name + additional)
('outcome-edtech-product-name', 'prod-edtech-platform', 'Educational Technology Platform', 'Primary outcome representing the comprehensive learning platform delivery', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-edtech-engagement', 'prod-edtech-platform', 'Improved Student Engagement', 'Enhanced learning experience through interactive and adaptive content', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-edtech-outcomes', 'prod-edtech-platform', 'Better Learning Outcomes', 'Improved academic performance through personalized learning paths', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- MANDATORY RELEASES: Each product must have Release 1.0 + additional releases
INSERT INTO "Release" (id, "productId", name, level, description, "createdAt", "updatedAt") VALUES
-- E-Commerce Releases (1.0 + additional)
('release-ecom-1-0', 'prod-ecommerce-advanced', '1.0', 1.0, 'Initial release of the Advanced E-Commerce Platform with core features', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-ecom-1-1', 'prod-ecommerce-advanced', '1.1', 1.1, 'Minor update with bug fixes and performance improvements', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-ecom-2-0', 'prod-ecommerce-advanced', '2.0', 2.0, 'Major release with AI-powered features and enhanced analytics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- FinTech Releases (1.0 + additional)
('release-fintech-1-0', 'prod-fintech-suite', '1.0', 1.0, 'Initial release of the FinTech Banking Suite with core banking features', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-fintech-1-1', 'prod-fintech-suite', '1.1', 1.1, 'Security enhancements and additional payment methods', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-fintech-2-0', 'prod-fintech-suite', '2.0', 2.0, 'Major release with blockchain integration and crypto support', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Healthcare Releases (1.0 + additional)
('release-health-1-0', 'prod-healthcare-ecosystem', '1.0', 1.0, 'Initial release of the Healthcare Management Ecosystem with core functionality', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-health-1-1', 'prod-healthcare-ecosystem', '1.1', 1.1, 'Enhanced telemedicine features and HIPAA compliance updates', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-health-2-0', 'prod-healthcare-ecosystem', '2.0', 2.0, 'Major release with AI diagnostics and advanced analytics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Logistics Releases (1.0 + additional)
('release-logistics-1-0', 'prod-logistics-optimizer', '1.0', 1.0, 'Initial release of the Smart Logistics & Supply Chain Optimizer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-logistics-1-1', 'prod-logistics-optimizer', '1.1', 1.1, 'IoT integration and enhanced tracking capabilities', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-logistics-2-0', 'prod-logistics-optimizer', '2.0', 2.0, 'Major release with AI-powered route optimization and predictive analytics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- EdTech Releases (1.0 + additional)
('release-edtech-1-0', 'prod-edtech-platform', '1.0', 1.0, 'Initial release of the Educational Technology Platform with core LMS features', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-edtech-1-1', 'prod-edtech-platform', '1.1', 1.1, 'Enhanced virtual classroom and assessment tools', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('release-edtech-2-0', 'prod-edtech-platform', '2.0', 2.0, 'Major release with AI tutoring and adaptive learning engine', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    'Educational Technology Platform',
    'Comprehensive learning management system with virtual classrooms, AI tutoring, and adaptive learning paths',
    '{"version": "2.3.0", "priority": "medium", "technology_stack": ["React", "GraphQL", "PostgreSQL", "WebRTC"], "industry": "Education", "target_audience": "K-12 to Higher Ed", "features": ["Virtual Classroom", "AI Tutoring", "Adaptive Learning"], "student_capacity": "50K+", "accessibility": "WCAG 2.1 AA"}',
    CURRENT_TIMESTAMP - INTERVAL '75 days',
    CURRENT_TIMESTAMP
);

-- Insert comprehensive tasks for E-Commerce Platform (4 tasks) with ALL required attributes
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", priority, notes, "howToDoc", "howToVideo", "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-ecom-01', 'prod-ecommerce-advanced', 'Advanced User Authentication & SSO', 'Implement multi-factor authentication, social login, SSO integration with enterprise systems, and advanced security features', 960, 25.0, 1, 'ESSENTIAL', 'Critical', 'Includes OAuth 2.0, SAML, biometric authentication support', 'https://docs.ecommerce.platform/auth-implementation-guide', 'https://videos.ecommerce.platform/auth-setup-tutorial', 'auth_events', CURRENT_TIMESTAMP - INTERVAL '80 days', CURRENT_TIMESTAMP),
('task-ecom-02', 'prod-ecommerce-advanced', 'AI-Powered Product Catalog', 'Build intelligent product catalog with AI-driven categorization, dynamic pricing, and recommendation engine', 1440, 30.0, 2, 'SIGNATURE', 'High', 'ML models for product matching and price optimization', 'https://docs.ecommerce.platform/ai-catalog-development', 'https://videos.ecommerce.platform/ai-catalog-masterclass', 'catalog_analytics', CURRENT_TIMESTAMP - INTERVAL '75 days', CURRENT_TIMESTAMP),
('task-ecom-03', 'prod-ecommerce-advanced', 'Multi-Vendor Marketplace Engine', 'Develop vendor management system with automated onboarding, commission tracking, and performance analytics', 1200, 28.0, 3, 'ADVANTAGE', 'High', 'Support for 1000+ vendors with real-time analytics dashboard', 'https://docs.ecommerce.platform/marketplace-implementation', 'https://videos.ecommerce.platform/marketplace-setup-guide', 'vendor_metrics', CURRENT_TIMESTAMP - INTERVAL '70 days', CURRENT_TIMESTAMP),
('task-ecom-04', 'prod-ecommerce-advanced', 'Advanced Shopping Cart & Wishlist', 'Create persistent cart with save-for-later, comparison tools, and abandoned cart recovery', 720, 17.0, 4, 'ESSENTIAL', 'Medium', 'Redis-based session management with email automation', 'https://docs.ecommerce.platform/cart-development-guide', 'https://videos.ecommerce.platform/shopping-cart-implementation', 'cart_events', CURRENT_TIMESTAMP - INTERVAL '65 days', CURRENT_TIMESTAMP);

-- Insert comprehensive tasks for FinTech Banking Suite (4 tasks)
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", priority, notes, "howToDoc", "howToVideo", "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-fintech-01', 'prod-fintech-suite', 'Biometric & Multi-Factor Authentication', 'Advanced security layer with fingerprint, facial recognition, voice authentication, and hardware tokens', 1080, 25.0, 1, 'SIGNATURE', 'Critical', 'Compliance with SOX and banking regulations, hardware security module integration', 'https://docs.fintech.suite/biometric-auth-implementation', 'https://videos.fintech.suite/advanced-security-setup', 'auth_security_events', CURRENT_TIMESTAMP - INTERVAL '110 days', CURRENT_TIMESTAMP),
('task-fintech-02', 'prod-fintech-suite', 'Core Banking System Integration', 'Connect with legacy banking systems, real-time transaction processing, and account management', 1440, 30.0, 2, 'ESSENTIAL', 'Critical', 'APIs for 20+ banking protocols, legacy system compatibility', 'https://docs.fintech.suite/core-banking-integration', 'https://videos.fintech.suite/banking-system-connection', 'core_banking_ops', CURRENT_TIMESTAMP - INTERVAL '105 days', CURRENT_TIMESTAMP),
('task-fintech-03', 'prod-fintech-suite', 'Digital Wallet & Cryptocurrency Support', 'Multi-currency digital wallet with crypto trading, staking, and DeFi integration', 1200, 25.0, 3, 'SIGNATURE', 'High', 'Support for 50+ cryptocurrencies and DeFi protocols', 'https://docs.fintech.suite/crypto-wallet-development', 'https://videos.fintech.suite/digital-wallet-implementation', 'wallet_transactions', CURRENT_TIMESTAMP - INTERVAL '100 days', CURRENT_TIMESTAMP),
('task-fintech-04', 'prod-fintech-suite', 'Advanced Fraud Detection Engine', 'AI/ML-powered fraud detection with real-time transaction monitoring and risk scoring', 960, 20.0, 4, 'ADVANTAGE', 'Critical', 'Machine learning models with 99.9% accuracy, real-time alerts', 'https://docs.fintech.suite/fraud-detection-guide', 'https://videos.fintech.suite/ai-fraud-prevention', 'fraud_analytics', CURRENT_TIMESTAMP - INTERVAL '95 days', CURRENT_TIMESTAMP);

-- Insert comprehensive tasks for Healthcare Ecosystem (4 tasks)
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", priority, notes, "howToDoc", "howToVideo", "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-health-01', 'prod-healthcare-ecosystem', 'HIPAA-Compliant Patient Records System', 'Secure electronic health records with encryption, audit trails, and role-based access control', 1200, 25.0, 1, 'ESSENTIAL', 'Critical', 'End-to-end encryption, audit logging, RBAC implementation', 'https://docs.healthcare.ecosystem/hipaa-ehr-implementation', 'https://videos.healthcare.ecosystem/patient-records-security', 'ehr_access_logs', CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP),
('task-health-02', 'prod-healthcare-ecosystem', 'AI-Powered Diagnostic Assistant', 'Machine learning system for medical imaging analysis and diagnostic support', 1440, 30.0, 2, 'SIGNATURE', 'High', 'Deep learning models for X-ray, MRI, CT scan analysis', 'https://docs.healthcare.ecosystem/ai-diagnostics-development', 'https://videos.healthcare.ecosystem/medical-ai-implementation', 'ai_diagnostic_usage', CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP),
('task-health-03', 'prod-healthcare-ecosystem', 'Telemedicine & Virtual Consultation Platform', 'HD video conferencing with screen sharing, digital prescriptions, and session recording', 960, 25.0, 3, 'ADVANTAGE', 'High', 'HIPAA-compliant video platform, prescription integration', 'https://docs.healthcare.ecosystem/telemedicine-platform-guide', 'https://videos.healthcare.ecosystem/virtual-consultation-setup', 'telehealth_sessions', CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP),
('task-health-04', 'prod-healthcare-ecosystem', 'Advanced Appointment Scheduling System', 'Multi-provider scheduling with automated reminders, waitlist management, and resource optimization', 720, 20.0, 4, 'ESSENTIAL', 'Medium', 'Calendar integration, SMS/email reminders, resource allocation', 'https://docs.healthcare.ecosystem/scheduling-system-guide', 'https://videos.healthcare.ecosystem/appointment-management', 'scheduling_metrics', CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP);

-- Insert comprehensive tasks for Logistics Optimizer (4 tasks)
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", priority, notes, "howToDoc", "howToVideo", "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-logistics-01', 'prod-logistics-optimizer', 'Real-Time Fleet Tracking & Management', 'GPS-based vehicle tracking with route optimization, driver behavior monitoring, and fuel efficiency analytics', 840, 25.0, 1, 'ESSENTIAL', 'High', 'IoT sensors, GPS tracking, driver scorecards, fuel optimization', 'https://docs.logistics.optimizer/fleet-tracking-implementation', 'https://videos.logistics.optimizer/gps-tracking-setup', 'fleet_tracking_data', CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP),
('task-logistics-02', 'prod-logistics-optimizer', 'AI-Powered Route Optimization Engine', 'Machine learning algorithm for dynamic route planning with traffic, weather, and delivery constraints', 1080, 30.0, 2, 'SIGNATURE', 'Critical', 'ML algorithms, real-time traffic data, multi-constraint optimization', 'https://docs.logistics.optimizer/ai-route-optimization', 'https://videos.logistics.optimizer/route-planning-ai', 'route_optimization', CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP),
('task-logistics-03', 'prod-logistics-optimizer', 'Warehouse Management System Integration', 'Complete WMS with inventory tracking, pick/pack optimization, and automated sorting', 960, 25.0, 3, 'ADVANTAGE', 'High', 'RFID/barcode scanning, robotic integration, inventory optimization', 'https://docs.logistics.optimizer/warehouse-management-guide', 'https://videos.logistics.optimizer/wms-integration-tutorial', 'warehouse_operations', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP),
('task-logistics-04', 'prod-logistics-optimizer', 'Predictive Analytics & Demand Forecasting', 'Advanced analytics for demand prediction, capacity planning, and supply chain optimization', 720, 20.0, 4, 'SIGNATURE', 'Medium', 'Time series forecasting, demand modeling, capacity planning', 'https://docs.logistics.optimizer/predictive-analytics-guide', 'https://videos.logistics.optimizer/demand-forecasting-tutorial', 'demand_forecasts', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP);

-- Insert comprehensive tasks for EdTech Platform (4 tasks)
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", priority, notes, "howToDoc", "howToVideo", "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-edtech-01', 'prod-edtech-platform', 'Virtual Classroom & Video Conferencing', 'HD video conferencing with screen sharing, interactive whiteboard, breakout rooms, and session recording', 900, 25.0, 1, 'ESSENTIAL', 'Critical', 'WebRTC implementation, interactive tools, recording capabilities', 'https://docs.edtech.platform/virtual-classroom-implementation', 'https://videos.edtech.platform/video-conferencing-setup', 'classroom_sessions', CURRENT_TIMESTAMP - INTERVAL '70 days', CURRENT_TIMESTAMP),
('task-edtech-02', 'prod-edtech-platform', 'Adaptive Learning Engine with AI Tutoring', 'AI-powered personalized learning paths with intelligent tutoring system and performance analytics', 1200, 30.0, 2, 'SIGNATURE', 'High', 'Machine learning models, personalization algorithms, NLP chatbot', 'https://docs.edtech.platform/ai-learning-engine-guide', 'https://videos.edtech.platform/adaptive-learning-development', 'learning_analytics', CURRENT_TIMESTAMP - INTERVAL '65 days', CURRENT_TIMESTAMP),
('task-edtech-03', 'prod-edtech-platform', 'Content Management & Course Builder', 'Comprehensive CMS for educators with drag-drop course builder, multimedia support, and version control', 840, 25.0, 3, 'ADVANTAGE', 'High', 'WYSIWYG editor, multimedia processing, content versioning', 'https://docs.edtech.platform/content-management-guide', 'https://videos.edtech.platform/course-builder-tutorial', 'content_usage', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP),
('task-edtech-04', 'prod-edtech-platform', 'Assessment & Grading System', 'Advanced assessment tools with automated grading, plagiarism detection, and analytics', 720, 20.0, 4, 'ADVANTAGE', 'High', 'Auto-grading algorithms, plagiarism detection, rubric-based assessment', 'https://docs.edtech.platform/assessment-system-guide', 'https://videos.edtech.platform/automated-grading-setup', 'assessment_metrics', CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP);

-- Create task-outcome relationships (tasks associated with outcomes)
INSERT INTO "TaskOutcome" (id, "taskId", "outcomeId") VALUES
-- E-Commerce task-outcome relationships
('to-ecom-01-01', 'task-ecom-01', 'outcome-ecom-product-name'),
('to-ecom-01-02', 'task-ecom-01', 'outcome-ecom-conversion'),
('to-ecom-02-01', 'task-ecom-02', 'outcome-ecom-product-name'),
('to-ecom-02-02', 'task-ecom-02', 'outcome-ecom-revenue'),
('to-ecom-03-01', 'task-ecom-03', 'outcome-ecom-product-name'),
('to-ecom-03-02', 'task-ecom-03', 'outcome-ecom-revenue'),
('to-ecom-04-01', 'task-ecom-04', 'outcome-ecom-conversion'),

-- FinTech task-outcome relationships
('to-fintech-01-01', 'task-fintech-01', 'outcome-fintech-product-name'),
('to-fintech-01-02', 'task-fintech-01', 'outcome-fintech-security'),
('to-fintech-02-01', 'task-fintech-02', 'outcome-fintech-product-name'),
('to-fintech-02-02', 'task-fintech-02', 'outcome-fintech-compliance'),
('to-fintech-03-01', 'task-fintech-03', 'outcome-fintech-product-name'),
('to-fintech-04-01', 'task-fintech-04', 'outcome-fintech-security'),

-- Healthcare task-outcome relationships
('to-health-01-01', 'task-health-01', 'outcome-health-product-name'),
('to-health-01-02', 'task-health-01', 'outcome-health-efficiency'),
('to-health-02-01', 'task-health-02', 'outcome-health-product-name'),
('to-health-02-02', 'task-health-02', 'outcome-health-outcomes'),
('to-health-03-01', 'task-health-03', 'outcome-health-outcomes'),
('to-health-04-01', 'task-health-04', 'outcome-health-efficiency'),

-- Logistics task-outcome relationships
('to-logistics-01-01', 'task-logistics-01', 'outcome-logistics-product-name'),
('to-logistics-01-02', 'task-logistics-01', 'outcome-logistics-visibility'),
('to-logistics-02-01', 'task-logistics-02', 'outcome-logistics-product-name'),
('to-logistics-02-02', 'task-logistics-02', 'outcome-logistics-efficiency'),
('to-logistics-03-01', 'task-logistics-03', 'outcome-logistics-efficiency'),
('to-logistics-04-01', 'task-logistics-04', 'outcome-logistics-efficiency'),

-- EdTech task-outcome relationships
('to-edtech-01-01', 'task-edtech-01', 'outcome-edtech-product-name'),
('to-edtech-01-02', 'task-edtech-01', 'outcome-edtech-engagement'),
('to-edtech-02-01', 'task-edtech-02', 'outcome-edtech-product-name'),
('to-edtech-02-02', 'task-edtech-02', 'outcome-edtech-outcomes'),
('to-edtech-03-01', 'task-edtech-03', 'outcome-edtech-engagement'),
('to-edtech-04-01', 'task-edtech-04', 'outcome-edtech-outcomes');

-- Create task-release relationships (tasks associated with releases)
INSERT INTO "TaskRelease" (id, "taskId", "releaseId") VALUES
-- E-Commerce task-release relationships
('tr-ecom-01', 'task-ecom-01', 'release-ecom-1-0'),
('tr-ecom-02', 'task-ecom-02', 'release-ecom-2-0'),
('tr-ecom-03', 'task-ecom-03', 'release-ecom-1-1'),
('tr-ecom-04', 'task-ecom-04', 'release-ecom-1-0'),

-- FinTech task-release relationships
('tr-fintech-01', 'task-fintech-01', 'release-fintech-1-0'),
('tr-fintech-02', 'task-fintech-02', 'release-fintech-1-0'),
('tr-fintech-03', 'task-fintech-03', 'release-fintech-2-0'),
('tr-fintech-04', 'task-fintech-04', 'release-fintech-1-1'),

-- Healthcare task-release relationships
('tr-health-01', 'task-health-01', 'release-health-1-0'),
('tr-health-02', 'task-health-02', 'release-health-2-0'),
('tr-health-03', 'task-health-03', 'release-health-1-1'),
('tr-health-04', 'task-health-04', 'release-health-1-0'),

-- Logistics task-release relationships
('tr-logistics-01', 'task-logistics-01', 'release-logistics-1-0'),
('tr-logistics-02', 'task-logistics-02', 'release-logistics-2-0'),
('tr-logistics-03', 'task-logistics-03', 'release-logistics-1-1'),
('tr-logistics-04', 'task-logistics-04', 'release-logistics-1-1'),

-- EdTech task-release relationships
('tr-edtech-01', 'task-edtech-01', 'release-edtech-1-0'),
('tr-edtech-02', 'task-edtech-02', 'release-edtech-2-0'),
('tr-edtech-03', 'task-edtech-03', 'release-edtech-1-1'),
('tr-edtech-04', 'task-edtech-04', 'release-edtech-1-1');

-- Insert sample Customers
INSERT INTO "Customer" (id, name, description, "createdAt", "updatedAt") VALUES
('customer-enterprise-1', 'Global Retail Corp', 'Large multinational retail corporation with 500+ stores worldwide and digital transformation initiative', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('customer-bank-1', 'Regional Banking Group', 'Mid-size regional banking group with comprehensive digital banking modernization program', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('customer-health-1', 'Healthcare Network Inc', 'Integrated healthcare delivery network serving 2M+ patients across multiple states', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Link customers to products
INSERT INTO "CustomerProduct" (id, "customerId", "productId") VALUES
('cp-1', 'customer-enterprise-1', 'prod-ecommerce-advanced'),
('cp-2', 'customer-bank-1', 'prod-fintech-suite'),
('cp-3', 'customer-health-1', 'prod-healthcare-ecosystem');