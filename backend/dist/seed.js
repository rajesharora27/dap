"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("./context");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const seedDefaultUsers = (() => {
        const envVal = (process.env.SEED_DEFAULT_USERS || '').toLowerCase();
        if (envVal === 'true' || envVal === '1')
            return true;
        if (envVal === 'false' || envVal === '0')
            return false;
        return nodeEnv !== 'production';
    })();
    if (seedDefaultUsers) {
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
        const userEmail = process.env.DEFAULT_USER_EMAIL || 'user@example.com';
        const userPassword = process.env.DEFAULT_USER_PASSWORD || 'user';
        const defaultUsers = [
            { email: adminEmail, username: 'admin', password: adminPassword, role: 'ADMIN', name: 'Admin' },
            { email: userEmail, username: 'user', password: userPassword, role: 'USER', name: 'User' }
        ];
        for (const u of defaultUsers) {
            const existing = await context_1.prisma.user.findFirst({ where: { OR: [{ email: u.email }, { username: u.username }] } });
            if (!existing) {
                const hashed = await bcryptjs_1.default.hash(u.password, 10);
                await context_1.prisma.user.create({ data: { email: u.email, username: u.username, password: hashed, role: u.role, name: u.name } });
                console.log(`[seed] Created default ${u.role} user: ${u.email}`);
                if (['admin', 'user', 'password'].includes(u.password) && nodeEnv === 'production') {
                    console.warn('[seed] Weak default password used in production – change immediately.');
                }
            }
        }
    }
    else {
        console.log('[seed] Skipping default users');
    }
    const seedSampleData = (() => {
        const envVal = (process.env.SEED_SAMPLE_DATA || '').toLowerCase();
        if (envVal === 'true' || envVal === '1')
            return true;
        if (envVal === 'false' || envVal === '0')
            return false;
        return nodeEnv !== 'production';
    })();
    if (seedSampleData) {
        // Create multiple sample products with comprehensive attributes
        const productData = [
            {
                id: 'sample-product-1',
                name: 'E-Commerce Platform',
                description: 'A modern e-commerce platform with advanced features',
                customAttrs: {
                    priority: 'high',
                    category: 'web-application',
                    technology: 'React/Node.js',
                    businessValue: 'revenue-generating',
                    complexity: 'high',
                    timeline: '6-months'
                }
            },
            {
                id: 'sample-product-2',
                name: 'Mobile Banking App',
                description: 'Secure mobile banking application with biometric authentication',
                customAttrs: {
                    priority: 'critical',
                    category: 'mobile-application',
                    technology: 'React Native',
                    businessValue: 'customer-retention',
                    compliance: 'PCI-DSS',
                    complexity: 'very-high'
                }
            },
            {
                id: 'sample-product-3',
                name: 'Analytics Dashboard',
                description: 'Real-time business analytics and reporting dashboard',
                customAttrs: {
                    priority: 'medium',
                    category: 'data-visualization',
                    technology: 'Vue.js/Python',
                    businessValue: 'operational-efficiency',
                    complexity: 'medium'
                }
            }
        ];
        const products = [];
        for (const productInfo of productData) {
            const product = await context_1.prisma.product.upsert({
                where: { id: productInfo.id },
                update: {},
                create: productInfo
            });
            products.push(product);
            console.log(`[seed] Created/updated product: ${product.name}`);
        }
        // Create sample outcomes for each product
        const outcomesByProduct = {
            'sample-product-1': [
                { name: 'User Authentication', description: 'Secure user login and registration system with OAuth integration' },
                { name: 'Payment Processing', description: 'Integrated payment gateway with multiple payment methods' },
                { name: 'Inventory Management', description: 'Real-time inventory tracking and management system' },
                { name: 'Order Fulfillment', description: 'Automated order processing and shipping management' }
            ],
            'sample-product-2': [
                { name: 'Biometric Security', description: 'Fingerprint and face recognition authentication' },
                { name: 'Transaction History', description: 'Comprehensive transaction tracking and categorization' },
                { name: 'Account Management', description: 'Multi-account support with balance tracking' },
                { name: 'Push Notifications', description: 'Real-time transaction and security alerts' }
            ],
            'sample-product-3': [
                { name: 'Data Visualization', description: 'Interactive charts and graphs for business metrics' },
                { name: 'Report Generation', description: 'Automated report creation and scheduling' },
                { name: 'Performance Metrics', description: 'KPI tracking and performance monitoring' },
                { name: 'Data Export', description: 'Export capabilities for various data formats' }
            ]
        };
        const allOutcomes = [];
        for (const product of products) {
            const outcomeList = outcomesByProduct[product.id] || [];
            for (const outcomeInfo of outcomeList) {
                const existing = await context_1.prisma.outcome.findFirst({
                    where: { name: outcomeInfo.name, productId: product.id }
                });
                if (!existing) {
                    const outcome = await context_1.prisma.outcome.create({
                        data: {
                            name: outcomeInfo.name,
                            description: outcomeInfo.description,
                            productId: product.id
                        }
                    });
                    allOutcomes.push(outcome);
                    console.log(`[seed] Created outcome: ${outcome.name} for ${product.name}`);
                }
                else {
                    allOutcomes.push(existing);
                }
            }
        }
        // Create comprehensive licenses for each product
        const licensesByProduct = {
            'sample-product-1': [
                { name: 'Basic Commerce', level: 1, description: 'Essential e-commerce features including product catalog and basic checkout' },
                { name: 'Professional Commerce', level: 2, description: 'Advanced features including analytics, marketing tools, and multi-currency support' },
                { name: 'Enterprise Commerce', level: 3, description: 'Full enterprise features including API access, custom integrations, and dedicated support' }
            ],
            'sample-product-2': [
                { name: 'Standard Banking', level: 1, description: 'Basic banking operations including balance inquiry and transaction history' },
                { name: 'Premium Banking', level: 2, description: 'Enhanced features including bill pay, money transfers, and investment tracking' },
                { name: 'Private Banking', level: 3, description: 'Exclusive features including wealth management, premium support, and advanced security' }
            ],
            'sample-product-3': [
                { name: 'Basic Analytics', level: 1, description: 'Standard reporting and basic dashboard views' },
                { name: 'Advanced Analytics', level: 2, description: 'Custom dashboards, advanced filtering, and scheduled reports' },
                { name: 'Enterprise Analytics', level: 3, description: 'AI-powered insights, predictive analytics, and unlimited data sources' }
            ]
        };
        const allLicenses = [];
        for (const product of products) {
            const licenseList = licensesByProduct[product.id] || [];
            for (const licenseInfo of licenseList) {
                const existing = await context_1.prisma.license.findFirst({
                    where: { name: licenseInfo.name, productId: product.id }
                });
                if (!existing) {
                    const license = await context_1.prisma.license.create({
                        data: {
                            name: licenseInfo.name,
                            level: licenseInfo.level,
                            description: licenseInfo.description,
                            productId: product.id,
                            isActive: true
                        }
                    });
                    allLicenses.push(license);
                    console.log(`[seed] Created license: ${license.name} for ${product.name}`);
                }
                else {
                    allLicenses.push(existing);
                }
            }
        }
        // Create comprehensive releases for each product
        const releasesByProduct = {
            'sample-product-1': [
                { name: 'MVP Release', level: 1.0, description: 'Minimum viable product with core e-commerce functionality' },
                { name: 'Feature Release', level: 1.5, description: 'Enhanced features including advanced search and recommendations' },
                { name: 'Performance Release', level: 2.0, description: 'Optimized performance and scalability improvements' },
                { name: 'Mobile Release', level: 2.5, description: 'Mobile-first responsive design and PWA support' },
                { name: 'Enterprise Release', level: 3.0, description: 'Full enterprise features and integrations' }
            ],
            'sample-product-2': [
                { name: 'Beta Launch', level: 1.0, description: 'Initial beta version with core banking features' },
                { name: 'Security Update', level: 1.2, description: 'Enhanced security features and biometric authentication' },
                { name: 'Feature Expansion', level: 2.0, description: 'Additional banking services and investment tracking' },
                { name: 'AI Integration', level: 2.5, description: 'AI-powered financial insights and recommendations' },
                { name: 'Global Launch', level: 3.0, description: 'Multi-currency support and international compliance' }
            ],
            'sample-product-3': [
                { name: 'Core Dashboard', level: 1.0, description: 'Basic dashboard with essential metrics and charts' },
                { name: 'Advanced Visualizations', level: 1.5, description: 'Enhanced chart types and interactive visualizations' },
                { name: 'Real-time Analytics', level: 2.0, description: 'Real-time data processing and live dashboard updates' },
                { name: 'AI Insights', level: 2.5, description: 'Machine learning-powered insights and anomaly detection' },
                { name: 'Enterprise Suite', level: 3.0, description: 'Full enterprise analytics with custom integrations' }
            ]
        };
        const allReleases = [];
        for (const product of products) {
            const releaseList = releasesByProduct[product.id] || [];
            for (const releaseInfo of releaseList) {
                const existing = await context_1.prisma.release.findFirst({
                    where: { productId: product.id, level: releaseInfo.level }
                });
                if (!existing) {
                    const release = await context_1.prisma.release.create({
                        data: {
                            name: releaseInfo.name,
                            level: releaseInfo.level,
                            description: releaseInfo.description,
                            productId: product.id,
                            isActive: true
                        }
                    });
                    allReleases.push(release);
                    console.log(`[seed] Created release: ${release.name} (${release.level}) for ${product.name}`);
                }
                else {
                    allReleases.push(existing);
                }
            }
        }
        // Create comprehensive tasks for each product with HowToDoc and HowToVideo
        const tasksByProduct = {
            'sample-product-1': [
                {
                    name: 'Setup Authentication System',
                    description: 'Implement secure user authentication with JWT tokens and OAuth integration',
                    estMinutes: 240,
                    weight: 20,
                    priority: 'High',
                    notes: 'Include multi-factor authentication and social login options',
                    howToDoc: 'https://docs.example.com/authentication-setup',
                    howToVideo: 'https://youtube.com/watch?v=auth-tutorial',
                    licenseLevel: 'ESSENTIAL'
                },
                {
                    name: 'Build Product Catalog',
                    description: 'Create dynamic product catalog with search, filtering, and categorization',
                    estMinutes: 180,
                    weight: 15,
                    priority: 'High',
                    notes: 'Implement elasticsearch for advanced search capabilities',
                    howToDoc: 'https://docs.example.com/product-catalog',
                    howToVideo: 'https://youtube.com/watch?v=catalog-guide',
                    licenseLevel: 'ESSENTIAL'
                },
                {
                    name: 'Implement Payment Gateway',
                    description: 'Integrate multiple payment processors including Stripe, PayPal, and Apple Pay',
                    estMinutes: 300,
                    weight: 25,
                    priority: 'Critical',
                    notes: 'Ensure PCI compliance and handle international currencies',
                    howToDoc: 'https://docs.example.com/payment-integration',
                    howToVideo: 'https://youtube.com/watch?v=payment-setup',
                    licenseLevel: 'ADVANTAGE'
                },
                {
                    name: 'Setup Order Management',
                    description: 'Build comprehensive order processing and tracking system',
                    estMinutes: 200,
                    weight: 18,
                    priority: 'Medium',
                    notes: 'Include inventory updates, shipping integration, and email notifications',
                    howToDoc: 'https://docs.example.com/order-management',
                    howToVideo: 'https://youtube.com/watch?v=order-system',
                    licenseLevel: 'ADVANTAGE'
                },
                {
                    name: 'Analytics Dashboard',
                    description: 'Create admin dashboard with sales analytics and performance metrics',
                    estMinutes: 160,
                    weight: 12,
                    priority: 'Low',
                    notes: 'Real-time charts using Chart.js and data visualization',
                    howToDoc: 'https://docs.example.com/analytics-dashboard',
                    howToVideo: 'https://youtube.com/watch?v=dashboard-tutorial',
                    licenseLevel: 'SIGNATURE'
                },
                {
                    name: 'Mobile Optimization',
                    description: 'Optimize for mobile devices and implement Progressive Web App features',
                    estMinutes: 140,
                    weight: 10,
                    priority: 'Medium',
                    notes: 'PWA features including offline mode and push notifications',
                    howToDoc: 'https://docs.example.com/mobile-optimization',
                    howToVideo: 'https://youtube.com/watch?v=pwa-guide',
                    licenseLevel: 'SIGNATURE'
                }
            ],
            'sample-product-2': [
                {
                    name: 'Biometric Authentication',
                    description: 'Implement fingerprint and facial recognition for secure app access',
                    estMinutes: 320,
                    weight: 25,
                    priority: 'Critical',
                    notes: 'Support for TouchID, FaceID, and Android biometrics',
                    howToDoc: 'https://docs.example.com/biometric-auth',
                    howToVideo: 'https://youtube.com/watch?v=biometric-setup',
                    licenseLevel: 'ESSENTIAL'
                },
                {
                    name: 'Account Balance Display',
                    description: 'Real-time account balance with transaction categorization',
                    estMinutes: 180,
                    weight: 15,
                    priority: 'High',
                    notes: 'Multi-account support with real-time updates via WebSocket',
                    howToDoc: 'https://docs.example.com/balance-display',
                    howToVideo: 'https://youtube.com/watch?v=balance-tutorial',
                    licenseLevel: 'ESSENTIAL'
                },
                {
                    name: 'Money Transfer System',
                    description: 'P2P transfers, bill payments, and international wire transfers',
                    estMinutes: 280,
                    weight: 22,
                    priority: 'High',
                    notes: 'Compliance with banking regulations and fraud detection',
                    howToDoc: 'https://docs.example.com/money-transfers',
                    howToVideo: 'https://youtube.com/watch?v=transfer-guide',
                    licenseLevel: 'ADVANTAGE'
                },
                {
                    name: 'Investment Portfolio',
                    description: 'Stock trading, portfolio tracking, and investment recommendations',
                    estMinutes: 240,
                    weight: 18,
                    priority: 'Medium',
                    notes: 'Integration with stock market APIs and real-time pricing',
                    howToDoc: 'https://docs.example.com/investment-portfolio',
                    howToVideo: 'https://youtube.com/watch?v=portfolio-setup',
                    licenseLevel: 'ADVANTAGE'
                },
                {
                    name: 'AI Financial Advisor',
                    description: 'Machine learning-powered financial insights and spending analysis',
                    estMinutes: 200,
                    weight: 12,
                    priority: 'Low',
                    notes: 'Personalized recommendations based on spending patterns',
                    howToDoc: 'https://docs.example.com/ai-advisor',
                    howToVideo: 'https://youtube.com/watch?v=ai-finance',
                    licenseLevel: 'SIGNATURE'
                },
                {
                    name: 'Security Monitoring',
                    description: 'Advanced fraud detection and security monitoring system',
                    estMinutes: 160,
                    weight: 8,
                    priority: 'Medium',
                    notes: 'Real-time fraud detection with machine learning algorithms',
                    howToDoc: 'https://docs.example.com/security-monitoring',
                    howToVideo: 'https://youtube.com/watch?v=fraud-detection',
                    licenseLevel: 'SIGNATURE'
                }
            ],
            'sample-product-3': [
                {
                    name: 'Data Visualization Engine',
                    description: 'Interactive charts, graphs, and data visualization components',
                    estMinutes: 200,
                    weight: 20,
                    priority: 'High',
                    notes: 'Support for D3.js, Chart.js, and custom visualization libraries',
                    howToDoc: 'https://docs.example.com/data-visualization',
                    howToVideo: 'https://youtube.com/watch?v=chart-tutorial',
                    licenseLevel: 'ESSENTIAL'
                },
                {
                    name: 'Real-time Data Pipeline',
                    description: 'Stream processing for real-time analytics and dashboard updates',
                    estMinutes: 240,
                    weight: 22,
                    priority: 'High',
                    notes: 'Apache Kafka integration for high-throughput data streaming',
                    howToDoc: 'https://docs.example.com/realtime-pipeline',
                    howToVideo: 'https://youtube.com/watch?v=kafka-setup',
                    licenseLevel: 'ESSENTIAL'
                },
                {
                    name: 'Custom Report Builder',
                    description: 'Drag-and-drop report builder with scheduling and automation',
                    estMinutes: 180,
                    weight: 18,
                    priority: 'Medium',
                    notes: 'Export to PDF, Excel, and other formats with email scheduling',
                    howToDoc: 'https://docs.example.com/report-builder',
                    howToVideo: 'https://youtube.com/watch?v=report-tutorial',
                    licenseLevel: 'ADVANTAGE'
                },
                {
                    name: 'Machine Learning Insights',
                    description: 'AI-powered predictive analytics and anomaly detection',
                    estMinutes: 320,
                    weight: 25,
                    priority: 'Medium',
                    notes: 'TensorFlow integration for predictive modeling and forecasting',
                    howToDoc: 'https://docs.example.com/ml-insights',
                    howToVideo: 'https://youtube.com/watch?v=ml-analytics',
                    licenseLevel: 'ADVANTAGE'
                },
                {
                    name: 'API Integration Hub',
                    description: 'Connectors for popular business tools and data sources',
                    estMinutes: 160,
                    weight: 10,
                    priority: 'Low',
                    notes: 'Pre-built connectors for Salesforce, HubSpot, Google Analytics, etc.',
                    howToDoc: 'https://docs.example.com/api-integrations',
                    howToVideo: 'https://youtube.com/watch?v=api-connectors',
                    licenseLevel: 'SIGNATURE'
                },
                {
                    name: 'Performance Optimization',
                    description: 'Database query optimization and caching strategies',
                    estMinutes: 120,
                    weight: 5,
                    priority: 'Low',
                    notes: 'Redis caching, query optimization, and performance monitoring',
                    howToDoc: 'https://docs.example.com/performance-optimization',
                    howToVideo: 'https://youtube.com/watch?v=performance-guide',
                    licenseLevel: 'SIGNATURE'
                }
            ]
        };
        // Create tasks for each product
        for (const product of products) {
            const taskList = tasksByProduct[product.id] || [];
            const productReleases = allReleases.filter(r => r.productId === product.id);
            const productOutcomes = allOutcomes.filter(o => o.productId === product.id);
            for (let i = 0; i < taskList.length; i++) {
                const taskInfo = taskList[i];
                const sequenceNumber = i + 1;
                const existing = await context_1.prisma.task.findFirst({
                    where: { name: taskInfo.name, productId: product.id }
                });
                if (!existing) {
                    const task = await context_1.prisma.task.create({
                        data: {
                            name: taskInfo.name,
                            description: taskInfo.description,
                            productId: product.id,
                            estMinutes: taskInfo.estMinutes,
                            weight: taskInfo.weight,
                            sequenceNumber: sequenceNumber,
                            priority: taskInfo.priority,
                            notes: taskInfo.notes,
                            howToDoc: taskInfo.howToDoc,
                            howToVideo: taskInfo.howToVideo,
                            licenseLevel: taskInfo.licenseLevel
                        }
                    });
                    // Assign tasks to releases based on complexity and sequence
                    const taskReleaseAssignments = [];
                    if (sequenceNumber <= 2) {
                        // First 2 tasks -> First release
                        if (productReleases[0])
                            taskReleaseAssignments.push(productReleases[0]);
                    }
                    if (sequenceNumber <= 4) {
                        // First 4 tasks -> Second release
                        if (productReleases[1])
                            taskReleaseAssignments.push(productReleases[1]);
                    }
                    if (sequenceNumber <= 5) {
                        // First 5 tasks -> Third release
                        if (productReleases[2])
                            taskReleaseAssignments.push(productReleases[2]);
                    }
                    // All tasks -> Latest releases
                    if (productReleases[3])
                        taskReleaseAssignments.push(productReleases[3]);
                    if (productReleases[4])
                        taskReleaseAssignments.push(productReleases[4]);
                    // Create task-release associations
                    for (const release of taskReleaseAssignments) {
                        await context_1.prisma.taskRelease.create({
                            data: {
                                taskId: task.id,
                                releaseId: release.id
                            }
                        });
                    }
                    // Assign tasks to outcomes (round-robin assignment)
                    if (productOutcomes.length > 0) {
                        const outcomeIndex = (sequenceNumber - 1) % productOutcomes.length;
                        const assignedOutcome = productOutcomes[outcomeIndex];
                        await context_1.prisma.taskOutcome.create({
                            data: {
                                taskId: task.id,
                                outcomeId: assignedOutcome.id
                            }
                        });
                    }
                    console.log(`[seed] Created task: ${task.name} for ${product.name} with ${taskReleaseAssignments.length} releases`);
                }
            }
        }
        // Create comprehensive telemetry sample data
        console.log('[seed] Creating telemetry sample data...');
        const allTasks = await context_1.prisma.task.findMany({
            where: { deletedAt: null },
            take: 10 // Limit to first 10 tasks for sample data
        });
        for (const task of allTasks) {
            try {
                // Create different types of telemetry attributes for each task
                const telemetryAttributes = [
                    {
                        name: 'Deployment Status',
                        description: 'Boolean flag indicating if the task deployment is complete',
                        dataType: 'BOOLEAN',
                        successCriteria: JSON.stringify({
                            type: 'boolean_flag',
                            expectedValue: true,
                            description: 'Task is considered complete when deployment status is true'
                        }),
                        isRequired: true,
                        order: 1
                    },
                    {
                        name: 'Performance Score',
                        description: 'Numeric performance score (0-100) for the task',
                        dataType: 'NUMBER',
                        successCriteria: JSON.stringify({
                            type: 'number_threshold',
                            operator: 'greater_than_or_equal',
                            threshold: 85,
                            description: 'Task is successful when performance score >= 85'
                        }),
                        isRequired: true,
                        order: 2
                    },
                    {
                        name: 'Code Quality',
                        description: 'String indicator of code quality status',
                        dataType: 'STRING',
                        successCriteria: JSON.stringify({
                            type: 'string_match',
                            mode: 'exact',
                            pattern: 'PASSED',
                            caseSensitive: false,
                            description: 'Task passes when code quality status is PASSED'
                        }),
                        isRequired: false,
                        order: 3
                    },
                    {
                        name: 'Last Updated',
                        description: 'Timestamp of last update to track freshness',
                        dataType: 'TIMESTAMP',
                        successCriteria: JSON.stringify({
                            type: 'timestamp_comparison',
                            mode: 'within_days',
                            referenceTime: 'now',
                            withinDays: 7,
                            description: 'Task data is fresh when updated within 7 days'
                        }),
                        isRequired: false,
                        order: 4
                    },
                    {
                        name: 'Composite Health Check',
                        description: 'Complex criteria combining multiple conditions',
                        dataType: 'BOOLEAN',
                        successCriteria: JSON.stringify({
                            type: 'composite_and',
                            description: 'All health conditions must pass',
                            criteria: [
                                {
                                    type: 'boolean_flag',
                                    expectedValue: true
                                },
                                {
                                    type: 'composite_or',
                                    criteria: [
                                        {
                                            type: 'string_match',
                                            mode: 'contains',
                                            pattern: 'healthy',
                                            caseSensitive: false
                                        },
                                        {
                                            type: 'string_match',
                                            mode: 'exact',
                                            pattern: 'operational',
                                            caseSensitive: false
                                        }
                                    ]
                                }
                            ]
                        }),
                        isRequired: false,
                        order: 5
                    }
                ];
                // Create telemetry attributes for this task
                for (const attrData of telemetryAttributes) {
                    // Check if attribute already exists
                    const existingAttribute = await context_1.prisma.telemetryAttribute.findFirst({
                        where: {
                            taskId: task.id,
                            name: attrData.name
                        }
                    });
                    if (existingAttribute) {
                        console.log(`[seed] Telemetry attribute "${attrData.name}" already exists for task "${task.name}"`);
                        continue;
                    }
                    const attribute = await context_1.prisma.telemetryAttribute.create({
                        data: {
                            taskId: task.id,
                            ...attrData
                        }
                    });
                    // Create sample values for each attribute
                    const sampleValues = [];
                    const taskIndex = allTasks.indexOf(task);
                    const batchId = `batch_${task.id.slice(-8)}_${attrData.name.replace(/\s+/g, '_').toLowerCase()}`;
                    switch (attrData.dataType) {
                        case 'BOOLEAN':
                            if (attrData.name === 'Composite Health Check') {
                                sampleValues.push({ value: taskIndex % 2 === 0 ? 'true' : 'false', notes: 'All health checks passing' }, { value: 'false', notes: 'Some health checks failing' }, { value: 'true', notes: 'Systems operational' });
                            }
                            else {
                                sampleValues.push({ value: 'false', notes: 'Initial deployment in progress' }, { value: taskIndex % 3 === 0 ? 'false' : 'true', notes: 'Deployment status update' }, { value: 'true', notes: 'Deployment completed successfully' });
                            }
                            break;
                        case 'NUMBER':
                            const baseScore = 70 + (taskIndex * 5) % 30; // Deterministic scores between 70-99
                            sampleValues.push({ value: String(baseScore), notes: 'Initial performance benchmark' }, { value: String(baseScore + 10), notes: 'After optimization' }, { value: String(Math.min(baseScore + 20, 99)), notes: 'Latest performance score' });
                            break;
                        case 'STRING':
                            if (attrData.name === 'Composite Health Check') {
                                const healthStatuses = ['healthy', 'operational', 'healthy and operational'];
                                sampleValues.push({ value: healthStatuses[taskIndex % 3], notes: 'System status check' }, { value: 'operational', notes: 'Service status confirmed' }, { value: 'healthy and operational', notes: 'Full system check' });
                            }
                            else {
                                const qualityStatuses = ['PENDING', 'FAILED', 'PASSED'];
                                const finalStatus = taskIndex % 3 === 0 ? 'FAILED' : 'PASSED';
                                sampleValues.push({ value: 'PENDING', notes: 'Code review in progress' }, { value: qualityStatuses[taskIndex % 3], notes: 'Issues found during review' }, { value: finalStatus, notes: 'All quality checks completed' });
                            }
                            break;
                        case 'TIMESTAMP':
                            const now = new Date();
                            const daysAgo1 = new Date(now.getTime() - (3 + taskIndex) * 24 * 60 * 60 * 1000);
                            const daysAgo2 = new Date(now.getTime() - (1 + taskIndex * 0.5) * 24 * 60 * 60 * 1000);
                            sampleValues.push({ value: daysAgo1.toISOString(), notes: 'Initial timestamp' }, { value: daysAgo2.toISOString(), notes: 'Recent update' }, { value: now.toISOString(), notes: 'Latest timestamp' });
                            break;
                    }
                    // Create the values with deterministic timestamps
                    for (let i = 0; i < sampleValues.length; i++) {
                        const valueData = sampleValues[i];
                        const daysBack = (sampleValues.length - i) * 2; // 6, 4, 2 days back
                        const createdAt = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
                        await context_1.prisma.telemetryValue.create({
                            data: {
                                attributeId: attribute.id,
                                value: valueData.value,
                                notes: valueData.notes,
                                batchId: i < 2 ? batchId : null, // First 2 values in batch, last one individual
                                createdAt
                            }
                        });
                    }
                    console.log(`[seed] Created telemetry attribute "${attrData.name}" for task "${task.name}" with ${sampleValues.length} values`);
                }
            }
            catch (error) {
                console.error(`[seed] Error creating telemetry data for task ${task.name}:`, error);
            }
        }
        console.log('[seed] Completed telemetry sample data creation');
    }
    else {
        console.log('[seed] Skipping sample data');
    }
}
main().then(() => { console.log('[seed] Completed'); process.exit(0); }).catch(e => { console.error('[seed] Failed', e); process.exit(1); });
