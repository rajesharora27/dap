-- Enhanced Sample Data Script for DAP Application
-- 5 Products with comprehensive attributes
-- Each product has 5-10 tasks with full attribute coverage

-- Clean existing data first
DELETE FROM "TaskOutcome";
DELETE FROM "Task";
DELETE FROM "Outcome";
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

-- Insert 5 comprehensive products
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

-- Insert comprehensive tasks for E-Commerce Platform (8 tasks)
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "sequenceNumber", "licenseLevel", priority, notes, "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-ecom-01', 'prod-ecommerce-advanced', 'Advanced User Authentication & SSO', 'Implement multi-factor authentication, social login, SSO integration with enterprise systems, and advanced security features', 960, 25.0, 1, 'ESSENTIAL', 'Critical', 'Includes OAuth 2.0, SAML, biometric authentication support', 'auth_events', CURRENT_TIMESTAMP - INTERVAL '80 days', CURRENT_TIMESTAMP),
('task-ecom-02', 'prod-ecommerce-advanced', 'AI-Powered Product Catalog', 'Build intelligent product catalog with AI-driven categorization, dynamic pricing, and recommendation engine', 1440, 30.0, 2, 'SIGNATURE', 'High', 'ML models for product matching and price optimization', 'catalog_analytics', CURRENT_TIMESTAMP - INTERVAL '75 days', CURRENT_TIMESTAMP),
('task-ecom-03', 'prod-ecommerce-advanced', 'Multi-Vendor Marketplace Engine', 'Develop vendor management system with automated onboarding, commission tracking, and performance analytics', 1200, 28.0, 3, 'ADVANTAGE', 'High', 'Support for 1000+ vendors with real-time analytics dashboard', 'vendor_metrics', CURRENT_TIMESTAMP - INTERVAL '70 days', CURRENT_TIMESTAMP),
('task-ecom-04', 'prod-ecommerce-advanced', 'Advanced Shopping Cart & Wishlist', 'Create persistent cart with save-for-later, comparison tools, and abandoned cart recovery', 720, 20.0, 4, 'ESSENTIAL', 'Medium', 'Redis-based session management with email automation', 'cart_events', CURRENT_TIMESTAMP - INTERVAL '65 days', CURRENT_TIMESTAMP),
('task-ecom-05', 'prod-ecommerce-advanced', 'Omnichannel Payment Gateway', 'Integrate 15+ payment methods including crypto, BNPL, and international gateways', 900, 22.0, 5, 'ADVANTAGE', 'Critical', 'PCI-DSS compliant with fraud detection algorithms', 'payment_transactions', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP),
('task-ecom-06', 'prod-ecommerce-advanced', 'Intelligent Inventory Management', 'Real-time inventory tracking with predictive restocking and multi-warehouse management', 840, 24.0, 6, 'SIGNATURE', 'High', 'IoT integration for automatic stock level monitoring', 'inventory_levels', CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP),
('task-ecom-07', 'prod-ecommerce-advanced', 'Customer Service Chatbot & Live Chat', 'AI-powered customer support with natural language processing and escalation to human agents', 600, 18.0, 7, 'ADVANTAGE', 'Medium', 'Integration with major CRM systems and knowledge bases', 'support_interactions', CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP),
('task-ecom-08', 'prod-ecommerce-advanced', 'Advanced Analytics & Reporting Dashboard', 'Comprehensive business intelligence with real-time sales, customer behavior, and performance metrics', 780, 26.0, 8, 'SIGNATURE', 'High', 'Custom report builder with data export capabilities', 'analytics_usage', CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP);

-- Insert comprehensive tasks for FinTech Banking Suite (10 tasks)
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "notes", "sequenceNumber", "licenseLevel", priority, "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-fintech-01', 'prod-fintech-suite', 'Biometric & Multi-Factor Authentication', 'Advanced security layer with fingerprint, facial recognition, voice authentication, and hardware tokens', 1080, 30.0, 'Compliance with SOX and banking regulations, hardware security module integration', 1, 'SIGNATURE', 'Critical', 'auth_security_events', CURRENT_TIMESTAMP - INTERVAL '110 days', CURRENT_TIMESTAMP),
('task-fintech-02', 'prod-fintech-suite', 'Core Banking System Integration', 'Connect with legacy banking systems, real-time transaction processing, and account management', 1440, 35.0, 'APIs for 20+ banking protocols, legacy system compatibility', 2, 'ESSENTIAL', 'Critical', 'core_banking_ops', CURRENT_TIMESTAMP - INTERVAL '105 days', CURRENT_TIMESTAMP),
('task-fintech-03', 'prod-fintech-suite', 'Digital Wallet & Cryptocurrency Support', 'Multi-currency digital wallet with crypto trading, staking, and DeFi integration', 1200, 32.0, 'Support for 50+ cryptocurrencies and DeFi protocols', 3, 'SIGNATURE', 'High', 'wallet_transactions', CURRENT_TIMESTAMP - INTERVAL '100 days', CURRENT_TIMESTAMP),
('task-fintech-04', 'prod-fintech-suite', 'Advanced Fraud Detection Engine', 'AI/ML-powered fraud detection with real-time transaction monitoring and risk scoring', 960, 28.0, 'Machine learning models with 99.9% accuracy, real-time alerts', 4, 'ADVANTAGE', 'Critical', 'fraud_analytics', CURRENT_TIMESTAMP - INTERVAL '95 days', CURRENT_TIMESTAMP),
('task-fintech-05', 'prod-fintech-suite', 'P2P Money Transfer & International Remittance', 'Instant peer-to-peer transfers with international remittance and currency conversion', 840, 25.0, 'Integration with SWIFT network and local payment rails', 5, 'ADVANTAGE', 'High', 'transfer_metrics', CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP),
('task-fintech-06', 'prod-fintech-suite', 'Investment & Trading Platform', 'Full-featured trading platform with portfolio management, algorithmic trading, and market analysis', 1320, 30.0, 'Real-time market data, advanced charting, risk management tools', 6, 'SIGNATURE', 'High', 'trading_activities', CURRENT_TIMESTAMP - INTERVAL '85 days', CURRENT_TIMESTAMP),
('task-fintech-07', 'prod-fintech-suite', 'Loan Origination & Credit Scoring', 'Automated loan processing with AI-driven credit scoring and risk assessment', 900, 26.0, 'Integration with credit bureaus, automated underwriting', 7, 'ADVANTAGE', 'Medium', 'lending_operations', CURRENT_TIMESTAMP - INTERVAL '80 days', CURRENT_TIMESTAMP),
('task-fintech-08', 'prod-fintech-suite', 'Regulatory Reporting & Compliance', 'Automated regulatory reporting with AML, KYC, and transaction monitoring', 720, 22.0, 'Real-time compliance monitoring and automated report generation', 8, 'ESSENTIAL', 'Critical', 'compliance_reports', CURRENT_TIMESTAMP - INTERVAL '75 days', CURRENT_TIMESTAMP),
('task-fintech-09', 'prod-fintech-suite', 'Open Banking API & Third-Party Integrations', 'PSD2-compliant open banking APIs with third-party app marketplace', 600, 20.0, 'OAuth 2.0 secured APIs, developer portal, rate limiting', 9, 'ADVANTAGE', 'Medium', 'api_usage_stats', CURRENT_TIMESTAMP - INTERVAL '70 days', CURRENT_TIMESTAMP),
('task-fintech-10', 'prod-fintech-suite', 'Advanced Business Intelligence Dashboard', 'Executive dashboard with real-time KPIs, predictive analytics, and regulatory reporting', 780, 24.0, 'Custom visualization engine, drill-down capabilities', 10, 'SIGNATURE', 'High', 'dashboard_interactions', CURRENT_TIMESTAMP - INTERVAL '65 days', CURRENT_TIMESTAMP);

-- Insert comprehensive tasks for Healthcare Ecosystem (9 tasks)
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "notes", "sequenceNumber", "licenseLevel", priority, "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-health-01', 'prod-healthcare-ecosystem', 'HIPAA-Compliant Patient Records System', 'Secure electronic health records with encryption, audit trails, and role-based access control', 1200, 30.0, 'End-to-end encryption, audit logging, RBAC implementation', 1, 'ESSENTIAL', 'Critical', 'ehr_access_logs', CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP),
('task-health-02', 'prod-healthcare-ecosystem', 'AI-Powered Diagnostic Assistant', 'Machine learning system for medical imaging analysis and diagnostic support', 1440, 35.0, 'Deep learning models for X-ray, MRI, CT scan analysis', 2, 'SIGNATURE', 'High', 'ai_diagnostic_usage', CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP),
('task-health-03', 'prod-healthcare-ecosystem', 'Telemedicine & Virtual Consultation Platform', 'HD video conferencing with screen sharing, digital prescriptions, and session recording', 960, 28.0, 'HIPAA-compliant video platform, prescription integration', 3, 'ADVANTAGE', 'High', 'telehealth_sessions', CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP),
('task-health-04', 'prod-healthcare-ecosystem', 'Advanced Appointment Scheduling System', 'Multi-provider scheduling with automated reminders, waitlist management, and resource optimization', 720, 25.0, 'Calendar integration, SMS/email reminders, resource allocation', 4, 'ESSENTIAL', 'Medium', 'scheduling_metrics', CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP),
('task-health-05', 'prod-healthcare-ecosystem', 'Clinical Decision Support System', 'Evidence-based clinical guidelines with drug interaction alerts and treatment recommendations', 840, 27.0, 'Integration with medical databases, real-time alerts', 5, 'SIGNATURE', 'Critical', 'clinical_decisions', CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP),
('task-health-06', 'prod-healthcare-ecosystem', 'Medical Billing & Insurance Claims Processing', 'Automated billing with insurance verification, claims processing, and revenue cycle management', 900, 26.0, 'Integration with major insurance providers, automated workflows', 6, 'ADVANTAGE', 'High', 'billing_operations', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP),
('task-health-07', 'prod-healthcare-ecosystem', 'Patient Portal & Mobile Health App', 'Patient-facing portal with appointment booking, lab results, medication tracking, and health monitoring', 780, 24.0, 'iOS/Android apps, wearable device integration, health tracking', 7, 'ADVANTAGE', 'Medium', 'patient_engagement', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP),
('task-health-08', 'prod-healthcare-ecosystem', 'Laboratory Information Management System', 'Complete lab workflow management with sample tracking, result reporting, and quality control', 660, 22.0, 'Barcode scanning, automated result processing, QC protocols', 8, 'ESSENTIAL', 'Medium', 'lab_operations', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP),
('task-health-09', 'prod-healthcare-ecosystem', 'Healthcare Analytics & Population Health', 'Advanced analytics for population health management, outcome tracking, and predictive modeling', 1020, 29.0, 'Population health dashboards, predictive risk modeling', 9, 'SIGNATURE', 'High', 'health_analytics', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP);

-- Insert comprehensive tasks for Logistics Optimizer (7 tasks)
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "notes", "sequenceNumber", "licenseLevel", priority, "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-logistics-01', 'prod-logistics-optimizer', 'Real-Time Fleet Tracking & Management', 'GPS-based vehicle tracking with route optimization, driver behavior monitoring, and fuel efficiency analytics', 840, 28.0, 'IoT sensors, GPS tracking, driver scorecards, fuel optimization', 1, 'ESSENTIAL', 'High', 'fleet_tracking_data', CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP),
('task-logistics-02', 'prod-logistics-optimizer', 'AI-Powered Route Optimization Engine', 'Machine learning algorithm for dynamic route planning with traffic, weather, and delivery constraints', 1080, 32.0, 'ML algorithms, real-time traffic data, multi-constraint optimization', 2, 'SIGNATURE', 'Critical', 'route_optimization', CURRENT_TIMESTAMP - INTERVAL '35 days', CURRENT_TIMESTAMP),
('task-logistics-03', 'prod-logistics-optimizer', 'Warehouse Management System Integration', 'Complete WMS with inventory tracking, pick/pack optimization, and automated sorting', 960, 30.0, 'RFID/barcode scanning, robotic integration, inventory optimization', 3, 'ADVANTAGE', 'High', 'warehouse_operations', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP),
('task-logistics-04', 'prod-logistics-optimizer', 'Predictive Analytics & Demand Forecasting', 'Advanced analytics for demand prediction, capacity planning, and supply chain optimization', 720, 26.0, 'Time series forecasting, demand modeling, capacity planning', 4, 'SIGNATURE', 'Medium', 'demand_forecasts', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP),
('task-logistics-05', 'prod-logistics-optimizer', 'Customer Portal & Shipment Tracking', 'Self-service customer portal with real-time tracking, delivery notifications, and service management', 600, 22.0, 'Real-time tracking, SMS/email notifications, customer feedback', 5, 'ADVANTAGE', 'Medium', 'customer_interactions', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP),
('task-logistics-06', 'prod-logistics-optimizer', 'IoT Sensor Integration & Monitoring', 'Integration with IoT sensors for temperature, humidity, shock monitoring, and cargo security', 780, 24.0, 'Temperature sensors, GPS trackers, security cameras, alert systems', 6, 'ADVANTAGE', 'High', 'sensor_telemetry', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP),
('task-logistics-07', 'prod-logistics-optimizer', 'Supply Chain Analytics Dashboard', 'Executive dashboard with KPIs, performance metrics, cost analysis, and operational insights', 540, 20.0, 'Interactive dashboards, cost analytics, performance tracking', 7, 'ESSENTIAL', 'Medium', 'analytics_dashboard', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP);

-- Insert comprehensive tasks for EdTech Platform (6 tasks)
INSERT INTO "Task" (id, "productId", name, description, "estMinutes", weight, "notes", "sequenceNumber", "licenseLevel", priority, "rawTelemetryMapping", "createdAt", "updatedAt") VALUES
('task-edtech-01', 'prod-edtech-platform', 'Virtual Classroom & Video Conferencing', 'HD video conferencing with screen sharing, interactive whiteboard, breakout rooms, and session recording', 900, 28.0, 'WebRTC implementation, interactive tools, recording capabilities', 1, 'ESSENTIAL', 'Critical', 'classroom_sessions', CURRENT_TIMESTAMP - INTERVAL '70 days', CURRENT_TIMESTAMP),
('task-edtech-02', 'prod-edtech-platform', 'Adaptive Learning Engine with AI Tutoring', 'AI-powered personalized learning paths with intelligent tutoring system and performance analytics', 1200, 35.0, 'Machine learning models, personalization algorithms, NLP chatbot', 2, 'SIGNATURE', 'High', 'learning_analytics', CURRENT_TIMESTAMP - INTERVAL '65 days', CURRENT_TIMESTAMP),
('task-edtech-03', 'prod-edtech-platform', 'Content Management & Course Builder', 'Comprehensive CMS for educators with drag-drop course builder, multimedia support, and version control', 840, 30.0, 'WYSIWYG editor, multimedia processing, content versioning', 3, 'ADVANTAGE', 'High', 'content_usage', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP),
('task-edtech-04', 'prod-edtech-platform', 'Assessment & Grading System', 'Advanced assessment tools with automated grading, plagiarism detection, and analytics', 720, 25.0, 'Auto-grading algorithms, plagiarism detection, rubric-based assessment', 4, 'ADVANTAGE', 'High', 'assessment_metrics', CURRENT_TIMESTAMP - INTERVAL '55 days', CURRENT_TIMESTAMP),
('task-edtech-05', 'prod-edtech-platform', 'Student Information System Integration', 'Complete SIS with enrollment management, grade tracking, attendance monitoring, and parent portal', 960, 32.0, 'Student records, attendance tracking, parent communication portal', 5, 'ESSENTIAL', 'Medium', 'sis_operations', CURRENT_TIMESTAMP - INTERVAL '50 days', CURRENT_TIMESTAMP),
('task-edtech-06', 'prod-edtech-platform', 'Mobile Learning App & Offline Access', 'Native mobile apps with offline content access, push notifications, and progress synchronization', 780, 26.0, 'iOS/Android apps, offline caching, sync capabilities', 6, 'SIGNATURE', 'Medium', 'mobile_usage', CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP);

-- Insert some sample Licenses for products
INSERT INTO "License" (id, name, description, level, "isActive", "productId", "createdAt", "updatedAt") VALUES
('lic-ecom-essential', 'E-Commerce Essential', 'Basic e-commerce features with standard support', 1, true, 'prod-ecommerce-advanced', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-ecom-advantage', 'E-Commerce Advantage', 'Advanced features with premium support and analytics', 2, true, 'prod-ecommerce-advanced', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-ecom-signature', 'E-Commerce Signature', 'Enterprise features with AI capabilities and dedicated support', 3, true, 'prod-ecommerce-advanced', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-fintech-essential', 'FinTech Essential', 'Core banking features with standard compliance', 1, true, 'prod-fintech-suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-fintech-advantage', 'FinTech Advantage', 'Advanced trading and analytics with enhanced security', 2, true, 'prod-fintech-suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lic-fintech-signature', 'FinTech Signature', 'Full blockchain and crypto features with premium compliance', 3, true, 'prod-fintech-suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample Outcomes for products
INSERT INTO "Outcome" (id, "productId", name, description, "createdAt", "updatedAt") VALUES
('outcome-ecom-revenue', 'prod-ecommerce-advanced', 'Increased Online Revenue', 'Measurable increase in online sales revenue through platform optimization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-ecom-conversion', 'prod-ecommerce-advanced', 'Improved Conversion Rate', 'Enhanced user experience leading to higher conversion rates', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-fintech-security', 'prod-fintech-suite', 'Enhanced Security Posture', 'Improved fraud detection and security measures reducing financial risks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-fintech-compliance', 'prod-fintech-suite', 'Regulatory Compliance', 'Full compliance with banking regulations and industry standards', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-health-efficiency', 'prod-healthcare-ecosystem', 'Operational Efficiency', 'Streamlined healthcare operations reducing administrative overhead', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('outcome-health-outcomes', 'prod-healthcare-ecosystem', 'Improved Patient Outcomes', 'Better patient care through AI-assisted diagnostics and care coordination', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample Customers
INSERT INTO "Customer" (id, name, description, "createdAt", "updatedAt") VALUES
('customer-enterprise-1', 'Global Retail Corp', 'Large multinational retail corporation with 500+ stores worldwide', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('customer-bank-1', 'Regional Banking Group', 'Mid-size regional banking group with digital transformation initiative', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('customer-health-1', 'Healthcare Network Inc', 'Integrated healthcare delivery network serving 2M+ patients', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Link customers to products
INSERT INTO "CustomerProduct" (id, "customerId", "productId") VALUES
('cp-1', 'customer-enterprise-1', 'prod-ecommerce-advanced'),
('cp-2', 'customer-bank-1', 'prod-fintech-suite'),
('cp-3', 'customer-health-1', 'prod-healthcare-ecosystem');