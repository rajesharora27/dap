// In-memory fallback store enabling CRUD when AUTH_FALLBACK is enabled.
// This avoids calling Prisma methods that are unavailable in fallback mode.

export interface FProduct { id: string; name: string; description?: string | null; customAttrs?: any; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }
export interface FTask { id: string; productId?: string; solutionId?: string; name: string; description?: string | null; estMinutes: number; weight: number; sequenceNumber: number; licenseLevel: 'ESSENTIAL' | 'ADVANTAGE' | 'PREMIER'; priority?: string | null; notes?: string | null; dependencies?: string[]; customAttrs?: any; telemetry?: any; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }
export interface FSolution { id: string; name: string; description?: string | null; customAttrs?: any; productIds: string[]; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }
export interface FCustomer { id: string; name: string; description?: string | null; productIds: string[]; solutionIds: string[]; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }
export interface FLicense { id: string; name: string; description?: string | null; productId?: string | null; solutionId?: string | null; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }
export interface FOutcome { id: string; name: string; description?: string | null; productId: string; createdAt: Date; updatedAt: Date; deletedAt?: Date | null }
export interface FTaskStatus { id: number; code: string; label: string }

let seq = 1000;
const nextId = (p: string) => `${p}-${++seq}`;

export const products: FProduct[] = [
  { id: "p-1", name: "E-Commerce Platform", description: "Comprehensive online shopping solution with advanced features", createdAt: new Date(), updatedAt: new Date() },
  { id: "p-2", name: "Mobile Banking Application", description: "Secure mobile banking with biometric authentication", createdAt: new Date(), updatedAt: new Date() },
  { id: "p-3", name: "Customer Relationship Management", description: "Advanced CRM with AI-powered insights and automation", createdAt: new Date(), updatedAt: new Date() },
  { id: "p-4", name: "Business Intelligence Dashboard", description: "Real-time analytics and reporting platform", createdAt: new Date(), updatedAt: new Date() }
];
export const tasks: FTask[] = [
  // E-Commerce Platform (p-1) - Total weight: 85% (leaving room for new tasks)
  {
    id: "t-1", productId: "p-1", name: "User Authentication System",
    description: "Implement secure OAuth2/JWT authentication with 2FA support and social login integration",
    estMinutes: 720, weight: 15, sequenceNumber: 1, licenseLevel: 'ESSENTIAL', priority: 'High',
    notes: "Focus on security best practices. Consider GDPR compliance for EU users.",
    dependencies: [],
    customAttrs: { complexity: "Medium", team: "Backend" },
    telemetry: { avgLoginTime: "1.2s", successRate: "98.5%" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-2", productId: "p-1", name: "Product Catalog Management",
    description: "Build comprehensive product catalog with advanced search, filtering, and category management",
    estMinutes: 960, weight: 20, sequenceNumber: 2, licenseLevel: 'ADVANTAGE', priority: 'High',
    notes: "Include elasticsearch integration for fast search. Support for bulk product imports via CSV.",
    dependencies: ["t-1"],
    customAttrs: { complexity: "High", team: "Full-Stack" },
    telemetry: { searchResponseTime: "200ms", catalogSize: "50,000 products" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-3", productId: "p-1", name: "Shopping Cart & Checkout",
    description: "Implement persistent shopping cart with guest checkout and saved cart functionality",
    estMinutes: 480, weight: 12, sequenceNumber: 3, licenseLevel: 'ESSENTIAL', priority: 'High',
    notes: "Ensure cart persistence across sessions. Minimize checkout steps for better conversion.",
    dependencies: ["t-2"],
    customAttrs: { complexity: "Medium", team: "Frontend" },
    telemetry: { conversionRate: "12.3%", averageCartValue: "$67.50" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-4", productId: "p-1", name: "Payment Gateway Integration",
    description: "Integrate multiple payment providers (Stripe, PayPal, Apple Pay, Google Pay)",
    estMinutes: 600, weight: 18, sequenceNumber: 4, licenseLevel: 'PREMIER', priority: 'Critical',
    notes: "PCI DSS compliance required. Test with sandbox environments first.",
    dependencies: ["t-3"],
    customAttrs: { complexity: "High", team: "Backend" },
    telemetry: { paymentSuccessRate: "99.2%", averageProcessingTime: "2.1s" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-5", productId: "p-1", name: "Order Management System",
    description: "Complete order lifecycle management with tracking, returns, and customer support",
    estMinutes: 840, weight: 12, sequenceNumber: 5, licenseLevel: 'ADVANTAGE', priority: 'High',
    notes: "Include inventory management. Support for partial shipments and returns.",
    dependencies: ["t-4"],
    customAttrs: { complexity: "High", team: "Full-Stack" },
    telemetry: { orderFulfillmentTime: "2.3 days", returnRate: "8.7%" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-6", productId: "p-1", name: "Admin Dashboard",
    description: "Comprehensive admin panel for managing products, orders, customers, and analytics",
    estMinutes: 720, weight: 8, sequenceNumber: 6, licenseLevel: 'ESSENTIAL', priority: 'Medium',
    notes: "Real-time analytics with exportable reports. Role-based access control.",
    dependencies: ["t-5"],
    customAttrs: { complexity: "Medium", team: "Full-Stack" },
    telemetry: { dashboardLoadTime: "1.8s", activeAdminUsers: "23" },
    createdAt: new Date(), updatedAt: new Date()
  },

  // Mobile Banking Application (p-2) - Total weight: 100%
  {
    id: "t-7", productId: "p-2", name: "Biometric Authentication",
    description: "Implement fingerprint, face ID, voice recognition with fallback to PIN/password",
    estMinutes: 1440, weight: 25, sequenceNumber: 1, licenseLevel: 'PREMIER', priority: 'Critical',
    notes: "Support for multiple biometric modalities. Secure enclave storage for biometric templates.",
    dependencies: [],
    customAttrs: { complexity: "Very High", team: "Mobile Security" },
    telemetry: { biometricSuccessRate: "96.7%", avgAuthTime: "0.8s" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-8", productId: "p-2", name: "Account Dashboard",
    description: "Main account overview with balance, recent transactions, spending insights",
    estMinutes: 720, weight: 15, sequenceNumber: 2, licenseLevel: 'ESSENTIAL', priority: 'High',
    notes: "Real-time balance updates. Spending categorization with AI insights.",
    dependencies: ["t-7"],
    customAttrs: { complexity: "Medium", team: "Frontend" },
    telemetry: { dailyActiveUsers: "125,000", avgSessionLength: "3.2 minutes" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-9", productId: "p-2", name: "Money Transfer System",
    description: "Secure peer-to-peer transfers, bank transfers, and international remittance",
    estMinutes: 960, weight: 22, sequenceNumber: 3, licenseLevel: 'PREMIER', priority: 'Critical',
    notes: "Comply with AML/KYC regulations. Support for instant transfers and scheduled payments.",
    dependencies: ["t-7"],
    customAttrs: { complexity: "Very High", team: "Backend" },
    telemetry: { transferSuccessRate: "99.8%", avgTransferTime: "12s" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-10", productId: "p-2", name: "Investment Portfolio",
    description: "Stock trading, portfolio tracking, market news, and investment recommendations",
    estMinutes: 1200, weight: 20, sequenceNumber: 4, licenseLevel: 'ADVANTAGE', priority: 'Medium',
    notes: "Real-time market data integration. Robo-advisor for automated investing.",
    dependencies: ["t-8"],
    customAttrs: { complexity: "High", team: "Fintech" },
    telemetry: { portfolioValue: "$2.1B", activeTraders: "45,000" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-11", productId: "p-2", name: "Customer Support Chat",
    description: "In-app chat support with AI chatbot and human agent escalation",
    estMinutes: 600, weight: 10, sequenceNumber: 5, licenseLevel: 'ESSENTIAL', priority: 'Medium',
    notes: "24/7 AI support with sentiment analysis. Secure chat for sensitive banking queries.",
    dependencies: ["t-8"],
    customAttrs: { complexity: "Medium", team: "Support Tech" },
    telemetry: { chatResolutionRate: "87%", avgResponseTime: "45s" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-12", productId: "p-2", name: "Fraud Detection Engine",
    description: "AI-powered fraud detection with real-time transaction monitoring",
    estMinutes: 840, weight: 8, sequenceNumber: 6, licenseLevel: 'PREMIER', priority: 'Critical',
    notes: "Machine learning models for anomaly detection. Real-time alerts and account protection.",
    dependencies: ["t-9"],
    customAttrs: { complexity: "Very High", team: "AI Security" },
    telemetry: { fraudDetectionRate: "99.2%", falsePositiveRate: "0.8%" },
    createdAt: new Date(), updatedAt: new Date()
  },

  // Customer Relationship Management (p-3) - Total weight: 100%
  {
    id: "t-13", productId: "p-3", name: "Contact Management System",
    description: "Comprehensive contact database with advanced search, tagging, and relationship mapping",
    estMinutes: 720, weight: 18, sequenceNumber: 1, licenseLevel: 'ESSENTIAL', priority: 'High',
    notes: "Support for contact deduplication. Integration with email and social media platforms.",
    dependencies: [],
    customAttrs: { complexity: "Medium", team: "Backend" },
    telemetry: { contactsManaged: "1.2M", searchAccuracy: "94%" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-14", productId: "p-3", name: "Lead Scoring & Tracking",
    description: "AI-powered lead scoring with behavioral tracking and automated nurturing campaigns",
    estMinutes: 960, weight: 20, sequenceNumber: 2, licenseLevel: 'ADVANTAGE', priority: 'High',
    notes: "Machine learning model for lead qualification. A/B testing for email campaigns.",
    dependencies: ["t-13"],
    customAttrs: { complexity: "High", team: "AI Marketing" },
    telemetry: { leadConversionRate: "23.5%", avgScoreAccuracy: "89%" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-15", productId: "p-3", name: "Sales Pipeline Management",
    description: "Visual sales pipeline with drag-drop functionality and automated stage progression",
    estMinutes: 600, weight: 16, sequenceNumber: 3, licenseLevel: 'ESSENTIAL', priority: 'Medium',
    notes: "Customizable pipeline stages. Automated follow-up reminders and task creation.",
    dependencies: ["t-14"],
    customAttrs: { complexity: "Medium", team: "Frontend" },
    telemetry: { pipelineVelocity: "28 days", winRate: "34%" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-16", productId: "p-3", name: "Email Marketing Automation",
    description: "Automated email campaigns with personalization and performance analytics",
    estMinutes: 840, weight: 15, sequenceNumber: 4, licenseLevel: 'ADVANTAGE', priority: 'Medium',
    notes: "GDPR compliant email handling. Advanced segmentation and dynamic content.",
    dependencies: ["t-14"],
    customAttrs: { complexity: "High", team: "Marketing Tech" },
    telemetry: { emailOpenRate: "28.5%", clickThroughRate: "3.2%" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-17", productId: "p-3", name: "Customer Service Integration",
    description: "Integrated ticketing system with case management and SLA tracking",
    estMinutes: 720, weight: 12, sequenceNumber: 5, licenseLevel: 'ESSENTIAL', priority: 'Medium',
    notes: "Integration with phone, email, and chat channels. Automated ticket routing.",
    dependencies: ["t-13"],
    customAttrs: { complexity: "Medium", team: "Support Tech" },
    telemetry: { avgResolutionTime: "4.2 hours", customerSatisfaction: "4.3/5" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-18", productId: "p-3", name: "Analytics & Reporting",
    description: "Comprehensive reporting suite with customizable dashboards and KPI tracking",
    estMinutes: 960, weight: 19, sequenceNumber: 6, licenseLevel: 'ADVANTAGE', priority: 'High',
    notes: "Real-time dashboard updates. Export capabilities for Excel, PDF, and CSV.",
    dependencies: ["t-15", "t-16"],
    customAttrs: { complexity: "High", team: "Analytics" },
    telemetry: { reportsGenerated: "15,000/month", avgDashboardLoadTime: "1.8s" },
    createdAt: new Date(), updatedAt: new Date()
  },

  // Business Intelligence Dashboard (p-4) - Total weight: 100%
  {
    id: "t-19", productId: "p-4", name: "Data Connector Framework",
    description: "Extensible framework for connecting to databases, APIs, files, and cloud services",
    estMinutes: 1200, weight: 25, sequenceNumber: 1, licenseLevel: 'PREMIER', priority: 'Critical',
    notes: "Support for 100+ data sources. Real-time and batch data ingestion capabilities.",
    dependencies: [],
    customAttrs: { complexity: "Very High", team: "Data Engineering" },
    telemetry: { connectedSources: "47", dataVolume: "2.3TB/day" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-20", productId: "p-4", name: "Data Processing Engine",
    description: "High-performance data transformation and aggregation engine with scheduling",
    estMinutes: 1440, weight: 22, sequenceNumber: 2, licenseLevel: 'PREMIER', priority: 'Critical',
    notes: "Support for complex ETL workflows. Distributed processing for large datasets.",
    dependencies: ["t-19"],
    customAttrs: { complexity: "Very High", team: "Data Engineering" },
    telemetry: { processingSpeed: "10GB/min", jobSuccessRate: "99.7%" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-21", productId: "p-4", name: "Visualization Engine",
    description: "Interactive charting engine with 20+ chart types and custom widget support",
    estMinutes: 840, weight: 18, sequenceNumber: 3, licenseLevel: 'ADVANTAGE', priority: 'High',
    notes: "WebGL rendering for large datasets. Export capabilities for presentations.",
    dependencies: ["t-20"],
    customAttrs: { complexity: "High", team: "Frontend" },
    telemetry: { chartsRendered: "500,000/day", avgRenderTime: "300ms" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-22", productId: "p-4", name: "Dashboard Builder",
    description: "Drag-and-drop dashboard creation with responsive layouts and sharing capabilities",
    estMinutes: 960, weight: 20, sequenceNumber: 4, licenseLevel: 'ADVANTAGE', priority: 'High',
    notes: "Template library for quick dashboard creation. Real-time collaboration features.",
    dependencies: ["t-21"],
    customAttrs: { complexity: "High", team: "Frontend" },
    telemetry: { activeDashboards: "12,500", avgDashboardViews: "2,300/day" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-23", productId: "p-4", name: "Alert & Notification System",
    description: "Automated alerts based on data thresholds with multi-channel notifications",
    estMinutes: 600, weight: 10, sequenceNumber: 5, licenseLevel: 'ESSENTIAL', priority: 'Medium',
    notes: "Support for email, SMS, Slack, and webhook notifications. Escalation policies.",
    dependencies: ["t-22"],
    customAttrs: { complexity: "Medium", team: "Backend" },
    telemetry: { alertsSent: "8,500/month", avgResponseTime: "2.3 minutes" },
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: "t-24", productId: "p-4", name: "User Access Control",
    description: "Role-based access control with fine-grained permissions and audit logging",
    estMinutes: 480, weight: 5, sequenceNumber: 6, licenseLevel: 'ADVANTAGE', priority: 'High',
    notes: "Integration with LDAP/Active Directory. Detailed audit trails for compliance.",
    dependencies: ["t-22"],
    customAttrs: { complexity: "Medium", team: "Security" },
    telemetry: { activeUsers: "3,200", loginSuccessRate: "98.9%" },
    createdAt: new Date(), updatedAt: new Date()
  }
];
export const solutions: FSolution[] = [
  { id: "s-1", name: "Digital Transformation Suite", description: "Complete digital transformation package for enterprises", productIds: ["p-1", "p-3", "p-4"], createdAt: new Date(), updatedAt: new Date() },
  { id: "s-2", name: "Financial Services Complete", description: "Comprehensive financial technology solution", productIds: ["p-2", "p-4"], createdAt: new Date(), updatedAt: new Date() },
  { id: "s-3", name: "SMB Growth Package", description: "Small-medium business growth acceleration solution", productIds: ["p-1", "p-3"], createdAt: new Date(), updatedAt: new Date() }
];
export const customers: FCustomer[] = [
  { id: "c-1", name: "GlobalMart Corporation", description: "International retail chain with 500+ stores worldwide", productIds: ["p-1"], solutionIds: ["s-1"], createdAt: new Date(), updatedAt: new Date() },
  { id: "c-2", name: "Metropolitan Bank Group", description: "Regional bank serving 2M+ customers across 5 states", productIds: ["p-2"], solutionIds: ["s-2"], createdAt: new Date(), updatedAt: new Date() },
  { id: "c-3", name: "InnovateTech Solutions", description: "Fast-growing fintech startup specializing in payment solutions", productIds: ["p-2", "p-4"], solutionIds: [], createdAt: new Date(), updatedAt: new Date() },
  { id: "c-4", name: "PrecisionManufacturing Inc", description: "B2B manufacturing company with complex supply chain needs", productIds: ["p-3", "p-4"], solutionIds: ["s-3"], createdAt: new Date(), updatedAt: new Date() },
  { id: "c-5", name: "HealthFirst Medical Network", description: "Healthcare provider network with 50+ clinics and hospitals", productIds: ["p-3"], solutionIds: [], createdAt: new Date(), updatedAt: new Date() }
];
export const licenses: FLicense[] = [
  // E-Commerce Platform Licenses
  { id: "l-1", name: "E-Commerce Essential", description: "Basic online store features with up to 100 products and standard payment processing", productId: "p-1", createdAt: new Date(), updatedAt: new Date() },
  { id: "l-2", name: "E-Commerce Advantage", description: "Advanced store features with unlimited products, advanced analytics, and multi-currency support", productId: "p-1", createdAt: new Date(), updatedAt: new Date() },
  { id: "l-3", name: "E-Commerce Premier", description: "Enterprise features with custom integrations, white-label options, and dedicated support", productId: "p-1", createdAt: new Date(), updatedAt: new Date() },

  // Mobile Banking Licenses
  { id: "l-4", name: "Banking Essential", description: "Core banking features with basic account management and transfer capabilities", productId: "p-2", createdAt: new Date(), updatedAt: new Date() },
  { id: "l-5", name: "Banking Advantage", description: "Enhanced banking with investment portfolio, advanced security, and premium support", productId: "p-2", createdAt: new Date(), updatedAt: new Date() },
  { id: "l-6", name: "Banking Premier", description: "Full-service banking with wealth management, corporate features, and API access", productId: "p-2", createdAt: new Date(), updatedAt: new Date() },

  // CRM Licenses
  { id: "l-7", name: "CRM Essential", description: "Basic contact management and lead tracking for small teams (up to 5 users)", productId: "p-3", createdAt: new Date(), updatedAt: new Date() },
  { id: "l-8", name: "CRM Advantage", description: "Advanced CRM with automation, email marketing, and analytics for growing businesses", productId: "p-3", createdAt: new Date(), updatedAt: new Date() },
  { id: "l-9", name: "CRM Premier", description: "Enterprise CRM with AI insights, custom workflows, and unlimited integrations", productId: "p-3", createdAt: new Date(), updatedAt: new Date() },

  // Business Intelligence Licenses
  { id: "l-10", name: "BI Essential", description: "Basic reporting and dashboard creation with standard data connectors", productId: "p-4", createdAt: new Date(), updatedAt: new Date() },
  { id: "l-11", name: "BI Advantage", description: "Advanced analytics with real-time processing and enhanced visualization options", productId: "p-4", createdAt: new Date(), updatedAt: new Date() },
  { id: "l-12", name: "BI Premier", description: "Enterprise BI with AI-powered insights, custom connectors, and enterprise security", productId: "p-4", createdAt: new Date(), updatedAt: new Date() }
];
export const taskStatuses: FTaskStatus[] = [
  { id: 1, code: 'NEW', label: 'New' },
  { id: 2, code: 'TODO', label: 'To Do' },
  { id: 3, code: 'IN_PROGRESS', label: 'In Progress' },
  { id: 4, code: 'REVIEW', label: 'Under Review' },
  { id: 5, code: 'DONE', label: 'Completed' },
  { id: 6, code: 'BLOCKED', label: 'Blocked' }
];

export const outcomes: FOutcome[] = [
  // E-Commerce Platform (p-1) outcomes
  { id: "o-1", name: "User Authentication", description: "Secure user authentication and authorization system", productId: "p-1", createdAt: new Date(), updatedAt: new Date() },
  { id: "o-2", name: "Data Analytics", description: "Advanced analytics and reporting capabilities", productId: "p-1", createdAt: new Date(), updatedAt: new Date() },
  { id: "o-3", name: "Performance Optimization", description: "Optimized system performance and scalability", productId: "p-1", createdAt: new Date(), updatedAt: new Date() },

  // Mobile Banking Application (p-2) outcomes  
  { id: "o-4", name: "User Authentication", description: "Biometric and multi-factor authentication", productId: "p-2", createdAt: new Date(), updatedAt: new Date() },
  { id: "o-5", name: "Data Analytics", description: "Financial transaction analytics and insights", productId: "p-2", createdAt: new Date(), updatedAt: new Date() },
  { id: "o-6", name: "Performance Optimization", description: "Mobile app performance and offline capabilities", productId: "p-2", createdAt: new Date(), updatedAt: new Date() },

  // Customer Relationship Management (p-3) outcomes
  { id: "o-7", name: "User Authentication", description: "Role-based access control and SSO integration", productId: "p-3", createdAt: new Date(), updatedAt: new Date() },
  { id: "o-8", name: "Data Analytics", description: "Customer behavior analytics and AI insights", productId: "p-3", createdAt: new Date(), updatedAt: new Date() },
  { id: "o-9", name: "Performance Optimization", description: "CRM system performance and workflow automation", productId: "p-3", createdAt: new Date(), updatedAt: new Date() },

  // Business Intelligence Dashboard (p-4) outcomes
  { id: "o-10", name: "User Authentication", description: "Dashboard access control and user management", productId: "p-4", createdAt: new Date(), updatedAt: new Date() },
  { id: "o-11", name: "Data Analytics", description: "Real-time business intelligence and KPI tracking", productId: "p-4", createdAt: new Date(), updatedAt: new Date() },
  { id: "o-12", name: "Performance Optimization", description: "Dashboard performance and data processing efficiency", productId: "p-4", createdAt: new Date(), updatedAt: new Date() }
];

// Task-Outcome relationships (simple many-to-many mapping)
interface FTaskOutcome { taskId: string; outcomeId: string; }
export const taskOutcomes: FTaskOutcome[] = [
  // Some sample relationships - tasks can contribute to multiple outcomes
  { taskId: "t-1", outcomeId: "o-1" },  // User Auth System -> User Authentication
  { taskId: "t-2", outcomeId: "o-2" },  // Product Catalog -> Data Analytics
  { taskId: "t-3", outcomeId: "o-3" },  // Shopping Cart -> Performance Optimization
  { taskId: "t-7", outcomeId: "o-4" },  // Mobile Auth -> User Authentication (p-2)
  { taskId: "t-13", outcomeId: "o-7" }, // CRM Auth -> User Authentication (p-3)
];

export function getOutcomesForTask(taskId: string): FOutcome[] {
  const outcomeIds = taskOutcomes.filter(to => to.taskId === taskId).map(to => to.outcomeId);
  return outcomes.filter(o => outcomeIds.includes(o.id) && !o.deletedAt);
}

export function addTaskOutcome(taskId: string, outcomeId: string) {
  if (!taskOutcomes.find(to => to.taskId === taskId && to.outcomeId === outcomeId)) {
    taskOutcomes.push({ taskId, outcomeId });
  }
  return true;
}

export function removeTaskOutcome(taskId: string, outcomeId: string) {
  const idx = taskOutcomes.findIndex(to => to.taskId === taskId && to.outcomeId === outcomeId);
  if (idx >= 0) taskOutcomes.splice(idx, 1);
  return true;
}

// CRUD helpers
export function createProduct(data: { name: string; description?: string | null; customAttrs?: any }) {
  const p: FProduct = { id: nextId('p'), name: data.name, description: data.description, customAttrs: data.customAttrs, createdAt: new Date(), updatedAt: new Date() };
  products.push(p); return p;
}
export function updateProduct(id: string, data: Partial<Omit<FProduct, 'id' | 'createdAt'>>) {
  const p = products.find(p => p.id === id && !p.deletedAt); if (!p) throw new Error('NOT_FOUND');
  Object.assign(p, data, { updatedAt: new Date() }); return p;
}
export function softDeleteProduct(id: string) { const p = products.find(p => p.id === id && !p.deletedAt); if (p) p.deletedAt = new Date(); return true; }

export function listProducts() { return products.filter(p => !p.deletedAt); }

export function createTask(data: { productId?: string; solutionId?: string; name: string; description?: string | null; estMinutes: number; weight: number; sequenceNumber: number; licenseLevel: 'ESSENTIAL' | 'ADVANTAGE' | 'PREMIER'; priority?: string | null; notes?: string | null; dependencies?: string[]; customAttrs?: any; telemetry?: any }) {
  // Validate sequence number uniqueness
  const parentId = data.productId || data.solutionId;
  const existingTask = tasks.find(t =>
    t.sequenceNumber === data.sequenceNumber &&
    ((data.productId && t.productId === data.productId) || (data.solutionId && t.solutionId === data.solutionId))
  );

  if (existingTask) {
    throw new Error('Sequence number already exists for this product/solution');
  }

  // Validate weightage
  const existingTasks = tasks.filter(t =>
    (data.productId && t.productId === data.productId) || (data.solutionId && t.solutionId === data.solutionId)
  );
  const currentWeightSum = existingTasks.reduce((sum: number, task: FTask) => sum + task.weight, 0);

  if (currentWeightSum + data.weight > 100) {
    throw new Error('Total weight of tasks cannot exceed 100% for this product/solution');
  }

  const t: FTask = { id: nextId('t'), ...data, createdAt: new Date(), updatedAt: new Date() };
  tasks.push(t);
  return t;
}
export function updateTask(id: string, data: Partial<Omit<FTask, 'id' | 'productId' | 'createdAt'>>) { const t = tasks.find(t => t.id === id); if (!t) throw new Error('NOT_FOUND'); Object.assign(t, data, { updatedAt: new Date() }); return t; }
export function softDeleteTask(id: string) { const t = tasks.find(t => t.id === id && !t.deletedAt); if (t) t.deletedAt = new Date(); return true; }
// Removed markTaskDone function as completion tracking has been removed
export function listTasksForProduct(productId: string) { return tasks.filter(t => t.productId === productId && !t.deletedAt); }

export function createSolution(data: { name: string; description?: string | null; customAttrs?: any }) { const s: FSolution = { id: nextId('s'), productIds: [], createdAt: new Date(), updatedAt: new Date(), ...data }; solutions.push(s); return s; }
export function updateSolution(id: string, data: Partial<Omit<FSolution, 'id' | 'createdAt' | 'productIds'>>) { const s = solutions.find(s => s.id === id && !s.deletedAt); if (!s) throw new Error('NOT_FOUND'); Object.assign(s, data, { updatedAt: new Date() }); return s; }
export function softDeleteSolution(id: string) { const s = solutions.find(s => s.id === id && !s.deletedAt); if (s) s.deletedAt = new Date(); return true; }
export function listSolutions() { return solutions.filter(s => !s.deletedAt); }

export function createCustomer(data: { name: string; description?: string | null }) { const c: FCustomer = { id: nextId('c'), productIds: [], solutionIds: [], createdAt: new Date(), updatedAt: new Date(), ...data }; customers.push(c); return c; }
export function updateCustomer(id: string, data: Partial<Omit<FCustomer, 'id' | 'createdAt'>>) { const c = customers.find(c => c.id === id && !c.deletedAt); if (!c) throw new Error('NOT_FOUND'); Object.assign(c, data, { updatedAt: new Date() }); return c; }
export function softDeleteCustomer(id: string) { const c = customers.find(c => c.id === id && !c.deletedAt); if (c) c.deletedAt = new Date(); return true; }
export function listCustomers() { return customers.filter(c => !c.deletedAt); }

// Licenses
export function createLicense(data: { name: string; description?: string | null; productId?: string | null; solutionId?: string | null }) { const l: FLicense = { id: nextId('l'), createdAt: new Date(), updatedAt: new Date(), ...data }; licenses.push(l); return l; }
export function updateLicense(id: string, data: Partial<Omit<FLicense, 'id' | 'createdAt'>>) { const l = licenses.find(l => l.id === id && !l.deletedAt); if (!l) throw new Error('NOT_FOUND'); Object.assign(l, data, { updatedAt: new Date() }); return l; }
export function softDeleteLicense(id: string) { const l = licenses.find(l => l.id === id && !l.deletedAt); if (l) l.deletedAt = new Date(); return true; }
export function listLicenses() { return licenses.filter(l => !l.deletedAt); }

// Task Statuses
let statusSeq = 1;
export function createTaskStatus(data: { code: string; label: string }) { const id = ++statusSeq; const s: FTaskStatus = { id, ...data }; taskStatuses.push(s); return s; }
export function updateTaskStatus(id: number, data: Partial<Omit<FTaskStatus, 'id'>>) { const s = taskStatuses.find(s => s.id === id); if (!s) throw new Error('NOT_FOUND'); Object.assign(s, data); return s; }
export function deleteTaskStatus(id: number) { const idx = taskStatuses.findIndex(s => s.id === id); if (idx >= 0) taskStatuses.splice(idx, 1); return true; }

// Outcomes
export function createOutcome(data: { name: string; description?: string | null; productId: string }) { const o: FOutcome = { id: nextId('o'), createdAt: new Date(), updatedAt: new Date(), ...data }; outcomes.push(o); return o; }
export function updateOutcome(id: string, data: Partial<Omit<FOutcome, 'id' | 'createdAt'>>) { const o = outcomes.find(o => o.id === id && !o.deletedAt); if (!o) throw new Error('NOT_FOUND'); Object.assign(o, data, { updatedAt: new Date() }); return o; }
export function softDeleteOutcome(id: string) { const o = outcomes.find(o => o.id === id && !o.deletedAt); if (o) o.deletedAt = new Date(); return true; }
export function listOutcomes() { return outcomes.filter(o => !o.deletedAt); }
export function listOutcomesForProduct(productId: string) { return outcomes.filter(o => o.productId === productId && !o.deletedAt); }

// Associations
export function addProductToSolution(solutionId: string, productId: string) { const s = solutions.find(s => s.id === solutionId); if (!s) throw new Error('NOT_FOUND'); if (!s.productIds.includes(productId)) s.productIds.push(productId); return true; }
export function removeProductFromSolution(solutionId: string, productId: string) { const s = solutions.find(s => s.id === solutionId); if (!s) return true; s.productIds = s.productIds.filter(id => id !== productId); return true; }
export function addProductToCustomer(customerId: string, productId: string) { const c = customers.find(c => c.id === customerId); if (!c) throw new Error('NOT_FOUND'); if (!c.productIds.includes(productId)) c.productIds.push(productId); return true; }
export function removeProductFromCustomer(customerId: string, productId: string) { const c = customers.find(c => c.id === customerId); if (!c) return true; c.productIds = c.productIds.filter(id => id !== productId); return true; }
export function addSolutionToCustomer(customerId: string, solutionId: string) { const c = customers.find(c => c.id === customerId); if (!c) throw new Error('NOT_FOUND'); if (!c.solutionIds.includes(solutionId)) c.solutionIds.push(solutionId); return true; }
export function removeSolutionFromCustomer(customerId: string, solutionId: string) { const c = customers.find(c => c.id === customerId); if (!c) return true; c.solutionIds = c.solutionIds.filter(id => id !== solutionId); return true; }

// Reorder tasks within a product based on provided ID list
export function reorderTasks(productId: string, order: string[]) {
  const current = tasks.filter(t => t.productId === productId);
  if (current.length !== order.length) return false; // simple sanity guard

  // Create a map of task ID to new sequence number (1-based)
  const sequenceMap = new Map(order.map((id, i) => [id, i + 1]));

  // Update sequence numbers for all tasks in the product
  current.forEach(task => {
    const newSequence = sequenceMap.get(task.id);
    if (newSequence !== undefined) {
      task.sequenceNumber = newSequence;
      task.updatedAt = new Date();
    }
  });

  // Sort tasks by their new sequence numbers
  current.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  return true;
}

// Connection builders (simple, no pagination yet)
function buildConnection<T extends { id: string }>(items: T[]) {
  return {
    edges: items.map(i => ({ cursor: Buffer.from(JSON.stringify({ id: i.id }), 'utf8').toString('base64'), node: i })),
    pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: items[0] ? Buffer.from(JSON.stringify({ id: items[0].id }), 'utf8').toString('base64') : null, endCursor: items[items.length - 1] ? Buffer.from(JSON.stringify({ id: items[items.length - 1].id }), 'utf8').toString('base64') : null },
    totalCount: items.length
  };
}
export const fallbackConnections = {
  products: () => buildConnection(listProducts()),
  solutions: () => buildConnection(listSolutions()),
  tasksForProduct: (productId: string) => buildConnection(listTasksForProduct(productId)),
};
