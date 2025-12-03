import { prisma } from './context';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedSolutions } from './seed-solutions';

async function main() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const seedDefaultUsers = (() => {
    const envVal = (process.env.SEED_DEFAULT_USERS || '').toLowerCase();
    if (envVal === 'true' || envVal === '1') return true;
    if (envVal === 'false' || envVal === '0') return false;
    return nodeEnv !== 'production';
  })();
  if (seedDefaultUsers) {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!existingAdmin) {
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@dynamicadoptionplans.com';
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'DAP123';
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      // Create default admin user
      const adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          email: adminEmail,
          password: passwordHash,
          fullName: 'System Administrator',
          isAdmin: true,
          isActive: true,
          mustChangePassword: false, // Admin doesn't need to change default password on first login
          role: 'ADMIN',
          name: 'Admin' // Keep for backward compatibility if needed, though fullName is preferred
        }
      });

      console.log(`[seed] Created default admin user: ${adminUser.username} (${adminUser.email})`);

      // Create audit log for admin creation
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'create_user',
          resourceType: 'user',
          resourceId: adminUser.id,
          details: { message: 'System initialization: Created default admin user' }
        }
      });

      if (adminPassword === 'DAP123' && nodeEnv === 'production') {
        console.warn('[seed] Weak default password used in production – change immediately.');
      }
    } else {
      console.log('[seed] Admin user already exists');
    }

    // Create default regular user if configured
    const userEmail = process.env.DEFAULT_USER_EMAIL || 'user@example.com';
    const userPassword = process.env.DEFAULT_USER_PASSWORD || 'user';

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email: userEmail }, { username: 'user' }] } });
    if (!existingUser) {
      const hashed = await bcrypt.hash(userPassword, 10);
      await prisma.user.create({
        data: {
          email: userEmail,
          username: 'user',
          password: hashed,
          role: 'USER',
          name: 'User',
          fullName: 'Standard User',
          isActive: true,
          isAdmin: false
        }
      });
      console.log(`[seed] Created default user: ${userEmail}`);
    }
  } else {
    console.log('[seed] Skipping default users');
  }

  const seedSampleData = (() => {
    const envVal = (process.env.SEED_SAMPLE_DATA || '').toLowerCase();
    if (envVal === 'true' || envVal === '1') return true;
    if (envVal === 'false' || envVal === '0') return false;
    return nodeEnv !== 'production';
  })();
  if (seedSampleData) {
    // Create Cisco sample products with comprehensive attributes
    // Note: The SQL file create-complete-sample-data.sql handles the bulk of sample data creation
    // This TypeScript seed is kept minimal and aligned with the SQL data
    const productData = [
      {
        id: 'prod-cisco-duo',
        name: 'Cisco Duo',
        description: 'Multi-factor authentication and zero-trust access platform with adaptive security policies',
        customAttrs: {
          vendor: 'Cisco',
          category: 'Identity & Access',
          deployment: 'Cloud-Native',
          authentication_methods: ['Push', 'SMS', 'TOTP', 'WebAuthn', 'Biometric'],
          integrations: '1000+',
          compliance: ['SOC 2', 'FedRAMP', 'HIPAA'],
          management: 'Admin Panel'
        }
      },
      {
        id: 'prod-cisco-sdwan',
        name: 'Cisco SD-WAN',
        description: 'Software-defined wide area network solution with cloud-first architecture and security integration',
        customAttrs: {
          vendor: 'Cisco',
          category: 'Networking',
          architecture: 'Cloud-First',
          encryption: 'AES-256',
          orchestration: 'vManage',
          analytics: 'Real-time',
          scalability: '10K+ sites',
          management: 'Centralized'
        }
      },
      {
        id: 'prod-cisco-firewall',
        name: 'Cisco Secure Firewall',
        description: 'Next-generation firewall with advanced threat protection, deep packet inspection, and application control',
        customAttrs: {
          vendor: 'Cisco',
          category: 'Security',
          model: 'Firepower',
          throughput: '10Gbps+',
          features: ['IPS', 'Malware Defense', 'URL Filtering', 'Application Control'],
          management: 'FMC/FDM',
          certifications: ['Common Criteria', 'FIPS 140-2']
        }
      },
      {
        id: 'prod-cisco-ise',
        name: 'Cisco ISE',
        description: 'Identity Services Engine for network access control, policy enforcement, and guest management',
        customAttrs: {
          vendor: 'Cisco',
          category: 'Network Security',
          features: ['802.1X', 'MAB', 'Guest Access', 'BYOD', 'TrustSec'],
          integration: ['Active Directory', 'LDAP', 'MFA'],
          deployment: 'On-Premise/Cloud',
          scalability: '100K+ endpoints'
        }
      },
      {
        id: 'prod-cisco-secure-access-sample',
        name: 'Cisco Secure Access Sample',
        description: 'Secure access service edge (SASE) platform combining SD-WAN, security, and zero trust network access',
        customAttrs: {
          vendor: 'Cisco',
          category: 'SASE',
          features: ['ZTNA', 'SWG', 'CASB', 'FWaaS', 'DLP'],
          deployment: 'Cloud-Native',
          coverage: 'Global PoPs',
          performance: 'Low Latency',
          management: 'Unified Dashboard'
        }
      }
    ];

    const products = [];
    for (const productInfo of productData) {
      const product = await prisma.product.upsert({
        where: { id: productInfo.id },
        update: {},
        create: productInfo
      });
      products.push(product);
      console.log(`[seed] Created/updated product: ${product.name}`);
    }

    // Create sample outcomes for each Cisco product
    const outcomesByProduct = {
      'prod-cisco-duo': [
        { name: 'Enhanced Identity Security', description: 'Strong authentication and protection against credential theft' },
        { name: 'User Productivity', description: 'Seamless authentication experience across all applications' },
        { name: 'Compliance & Audit', description: 'Meet identity compliance requirements with detailed audit logs' },
        { name: 'Zero Trust Access', description: 'Implement zero trust security with continuous verification' }
      ],
      'prod-cisco-sdwan': [
        { name: 'Network Agility', description: 'Flexible and dynamic WAN connectivity' },
        { name: 'Application Performance', description: 'Optimized application delivery across the WAN' },
        { name: 'Integrated Security', description: 'Built-in security for all WAN connections' },
        { name: 'Cost Optimization', description: 'Reduced networking costs with efficient bandwidth usage' }
      ],
      'prod-cisco-firewall': [
        { name: 'Threat Protection', description: 'Advanced protection against sophisticated threats' },
        { name: 'Network Visibility', description: 'Complete visibility into network traffic and threats' },
        { name: 'Security Compliance', description: 'Meet regulatory and security compliance requirements' },
        { name: 'Application Control', description: 'Granular control over application usage' }
      ],
      'prod-cisco-ise': [
        { name: 'Network Access Control', description: 'Secure network access with policy enforcement' },
        { name: 'Endpoint Visibility', description: 'Complete visibility into all network endpoints' },
        { name: 'Network Segmentation', description: 'Micro-segmentation with TrustSec technology' },
        { name: 'Guest Management', description: 'Secure and convenient guest network access' }
      ],
      'prod-cisco-secure-access-sample': [
        { name: 'Zero Trust Network Access', description: 'Secure access to applications from anywhere' },
        { name: 'Cloud Security', description: 'Comprehensive cloud and SaaS application security' },
        { name: 'Global Performance', description: 'Low-latency access through global PoPs' },
        { name: 'Unified Visibility', description: 'Single pane of glass for all security policies' }
      ]
    };

    const allOutcomes = [];
    for (const product of products) {
      const outcomeList = outcomesByProduct[product.id as keyof typeof outcomesByProduct] || [];
      for (const outcomeInfo of outcomeList) {
        const existing = await prisma.outcome.findFirst({
          where: { name: outcomeInfo.name, productId: product.id }
        });
        if (!existing) {
          const outcome = await prisma.outcome.create({
            data: {
              name: outcomeInfo.name,
              description: outcomeInfo.description,
              productId: product.id
            }
          });
          allOutcomes.push(outcome);
          console.log(`[seed] Created outcome: ${outcome.name} for ${product.name}`);
        } else {
          allOutcomes.push(existing);
        }
      }
    }

    // Create comprehensive licenses for each Cisco product
    const licensesByProduct = {
      'prod-cisco-duo': [
        { name: 'Duo MFA Essential', level: 1, description: 'Basic MFA with push and SMS authentication' },
        { name: 'Duo MFA Advantage', level: 2, description: 'Advanced MFA with device trust and adaptive policies' },
        { name: 'Duo Beyond', level: 3, description: 'Complete zero-trust access with SSO and device posture' }
      ],
      'prod-cisco-sdwan': [
        { name: 'SD-WAN Essentials', level: 1, description: 'Basic SD-WAN with secure connectivity' },
        { name: 'SD-WAN Advantage', level: 2, description: 'Advanced routing with security and analytics' },
        { name: 'SD-WAN Premier', level: 3, description: 'Full platform with AI operations and advanced security' }
      ],
      'prod-cisco-firewall': [
        { name: 'Firewall Essentials', level: 1, description: 'Core firewall with standard threat protection' },
        { name: 'Firewall Advantage', level: 2, description: 'Advanced features with IPS and malware defense' },
        { name: 'Firewall Premier', level: 3, description: 'Complete security suite with AI analytics' }
      ],
      'prod-cisco-ise': [
        { name: 'ISE Base', level: 1, description: 'Basic network access control and 802.1X' },
        { name: 'ISE Plus', level: 2, description: 'Advanced features with guest access and BYOD' },
        { name: 'ISE Apex', level: 3, description: 'Complete platform with TrustSec and advanced segmentation' }
      ],
      'prod-cisco-secure-access-sample': [
        { name: 'Secure Access Essentials', level: 1, description: 'Basic ZTNA and secure web gateway' },
        { name: 'Secure Access Advantage', level: 2, description: 'Advanced SASE with CASB and DLP' },
        { name: 'Secure Access Premier', level: 3, description: 'Complete SASE platform with AI threat protection' }
      ]
    };

    const allLicenses = [];
    for (const product of products) {
      const licenseList = licensesByProduct[product.id as keyof typeof licensesByProduct] || [];
      for (const licenseInfo of licenseList) {
        const existing = await prisma.license.findFirst({
          where: { name: licenseInfo.name, productId: product.id }
        });
        if (!existing) {
          const license = await prisma.license.create({
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
        } else {
          allLicenses.push(existing);
        }
      }
    }

    // Create comprehensive releases for each Cisco product
    const releasesByProduct = {
      'prod-cisco-duo': [
        { name: 'Duo v1.0', level: 1.0, description: 'Core MFA capabilities with push and SMS' },
        { name: 'Duo v2.0', level: 2.0, description: 'Enhanced with device trust and adaptive authentication' },
        { name: 'Duo v3.0', level: 3.0, description: 'Zero trust access with SSO and advanced policies' }
      ],
      'prod-cisco-sdwan': [
        { name: 'SD-WAN 17.x', level: 17.0, description: 'Foundation release with core SD-WAN features' },
        { name: 'SD-WAN 20.x', level: 20.0, description: 'Cloud integration and enhanced security' },
        { name: 'SD-WAN 22.x', level: 22.0, description: 'AI-powered operations and advanced analytics' }
      ],
      'prod-cisco-firewall': [
        { name: 'Firepower 7.0', level: 7.0, description: 'Core NGFW capabilities' },
        { name: 'Firepower 7.2', level: 7.2, description: 'Enhanced threat intelligence and IPS' },
        { name: 'Firepower 7.4', level: 7.4, description: 'AI-powered threat detection and automation' }
      ],
      'prod-cisco-ise': [
        { name: 'ISE 3.0', level: 3.0, description: 'Core NAC and policy enforcement' },
        { name: 'ISE 3.1', level: 3.1, description: 'Enhanced guest access and BYOD' },
        { name: 'ISE 3.2', level: 3.2, description: 'Advanced TrustSec and segmentation' }
      ],
      'prod-cisco-secure-access-sample': [
        { name: 'Secure Access 1.0', level: 1.0, description: 'Initial SASE platform release' },
        { name: 'Secure Access 2.0', level: 2.0, description: 'Enhanced ZTNA and cloud security' }
      ]
    };

    const allReleases = [];
    for (const product of products) {
      const releaseList = releasesByProduct[product.id as keyof typeof releasesByProduct] || [];
      for (const releaseInfo of releaseList) {
        const existing = await prisma.release.findFirst({
          where: { productId: product.id, level: releaseInfo.level }
        });
        if (!existing) {
          const release = await prisma.release.create({
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
        } else {
          allReleases.push(existing);
        }
      }
    }

    // Create comprehensive tasks for each product with HowToDoc and HowToVideo
    const tasksByProduct = {
      'retail-app-001': [
        {
          name: 'Build Cloud POS System',
          description: 'Develop cloud-based point-of-sale with offline mode, receipt printing, and payment terminal integration',
          estMinutes: 480,
          weight: 9.50,
          priority: 'Critical',
          notes: 'Support multiple payment methods including cash, card, mobile wallets with EMV certification',
          howToDoc: ['https://docs.retail.com/pos-setup', 'https://docs.retail.com/payment-terminals'],
          howToVideo: ['https://youtube.com/watch?v=cloud-pos-tutorial', 'https://youtube.com/watch?v=offline-mode'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Implement Inventory Management',
          description: 'Real-time inventory tracking with barcode scanning, automated reordering, and multi-location support',
          estMinutes: 420,
          weight: 9.00,
          priority: 'High',
          notes: 'Include low-stock alerts, supplier management, and warehouse integration',
          howToDoc: ['https://docs.retail.com/inventory-system'],
          howToVideo: ['https://youtube.com/watch?v=inventory-guide'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Customer Loyalty Program',
          description: 'Build loyalty system with points, rewards, tiers, and personalized promotions',
          estMinutes: 360,
          weight: 8.25,
          priority: 'High',
          notes: 'SMS/email marketing integration, birthday rewards, and referral program',
          howToDoc: ['https://docs.retail.com/loyalty-program', 'https://docs.retail.com/rewards-engine'],
          howToVideo: ['https://youtube.com/watch?v=loyalty-setup'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Sales Analytics Dashboard',
          description: 'Comprehensive reporting with sales trends, product performance, and employee metrics',
          estMinutes: 320,
          weight: 7.50,
          priority: 'Medium',
          notes: 'Real-time dashboards, custom reports, forecasting, and export capabilities',
          howToDoc: ['https://docs.retail.com/analytics'],
          howToVideo: ['https://youtube.com/watch?v=retail-analytics'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Multi-Store Management',
          description: 'Centralized management for multiple locations with consolidated inventory and reporting',
          estMinutes: 380,
          weight: 8.50,
          priority: 'Medium',
          notes: 'Store transfers, location-based pricing, role-based access per store',
          howToDoc: ['https://docs.retail.com/multi-store'],
          howToVideo: ['https://youtube.com/watch?v=multi-location'],
          licenseLevel: 'SIGNATURE' as const
        },
        {
          name: 'E-Commerce Integration',
          description: 'Integrate with online store platforms for unified inventory and order management',
          estMinutes: 280,
          weight: 6.75,
          priority: 'Low',
          notes: 'Shopify, WooCommerce, Magento integration with real-time sync',
          howToDoc: ['https://docs.retail.com/ecommerce-integration'],
          howToVideo: ['https://youtube.com/watch?v=omnichannel-retail'],
          licenseLevel: 'SIGNATURE' as const
        },
        {
          name: 'Employee Management System',
          description: 'Staff scheduling, time tracking, performance monitoring, and commission calculation',
          estMinutes: 340,
          weight: 7.25,
          priority: 'Medium',
          notes: 'Shift management, attendance tracking, sales performance metrics, payroll integration',
          howToDoc: ['https://docs.retail.com/employee-mgmt'],
          howToVideo: ['https://youtube.com/watch?v=staff-scheduling'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Supplier & Vendor Portal',
          description: 'Supplier management with purchase orders, receiving, invoicing, and vendor performance tracking',
          estMinutes: 300,
          weight: 6.50,
          priority: 'Medium',
          notes: 'Automated PO creation, EDI integration, vendor scorecards, payment terms management',
          howToDoc: ['https://docs.retail.com/supplier-portal'],
          howToVideo: ['https://youtube.com/watch?v=vendor-management'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Customer Relationship Management',
          description: 'CRM system with customer profiles, purchase history, preferences, and communication tools',
          estMinutes: 360,
          weight: 7.75,
          priority: 'High',
          notes: 'Customer segmentation, targeted marketing campaigns, feedback management, support ticketing',
          howToDoc: ['https://docs.retail.com/crm-system'],
          howToVideo: ['https://youtube.com/watch?v=retail-crm'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Mobile App for Store Associates',
          description: 'Mobile application for inventory checks, customer lookup, and mobile checkout',
          estMinutes: 480,
          weight: 9.25,
          priority: 'High',
          notes: 'iOS and Android apps, barcode scanning, clienteling features, endless aisle functionality',
          howToDoc: ['https://docs.retail.com/mobile-app'],
          howToVideo: ['https://youtube.com/watch?v=mobile-pos'],
          licenseLevel: 'SIGNATURE' as const
        },
        {
          name: 'Returns & Exchange Management',
          description: 'Comprehensive returns processing with refund management, exchange workflows, and fraud detection',
          estMinutes: 240,
          weight: 5.25,
          priority: 'Medium',
          notes: 'Return authorization, restocking fees, store credit, cross-channel returns',
          howToDoc: ['https://docs.retail.com/returns-mgmt'],
          howToVideo: ['https://youtube.com/watch?v=returns-process'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Gift Card & Store Credit System',
          description: 'Digital and physical gift cards with balance tracking, activation, and redemption',
          estMinutes: 280,
          weight: 6.00,
          priority: 'Medium',
          notes: 'Gift card sales, reloading, partial redemptions, expiration tracking',
          howToDoc: ['https://docs.retail.com/gift-cards'],
          howToVideo: ['https://youtube.com/watch?v=gift-card-system'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Price Management & Promotions',
          description: 'Dynamic pricing engine with promotional campaigns, discounts, and markdown management',
          estMinutes: 320,
          weight: 7.00,
          priority: 'High',
          notes: 'Tiered pricing, bundle deals, BOGO offers, scheduled promotions, clearance automation',
          howToDoc: ['https://docs.retail.com/pricing-engine'],
          howToVideo: ['https://youtube.com/watch?v=promotion-mgmt'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Security & Loss Prevention',
          description: 'Fraud detection, theft prevention, transaction monitoring, and audit trail management',
          estMinutes: 260,
          weight: 5.50,
          priority: 'Critical',
          notes: 'Anomaly detection, void/discount monitoring, employee activity tracking, PCI compliance',
          howToDoc: ['https://docs.retail.com/security-loss-prevention'],
          howToVideo: ['https://youtube.com/watch?v=retail-security'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Tax Management & Compliance',
          description: 'Automated tax calculation, reporting, and compliance for multi-jurisdictional operations',
          estMinutes: 220,
          weight: 4.75,
          priority: 'Critical',
          notes: 'Multi-tax authority support, sales tax reporting, VAT/GST compliance, tax exemptions',
          howToDoc: ['https://docs.retail.com/tax-compliance'],
          howToVideo: ['https://youtube.com/watch?v=retail-tax'],
          licenseLevel: 'ESSENTIAL' as const
        }
      ],
      'financial-app-001': [
        {
          name: 'Build Trading Execution Engine',
          description: 'High-frequency trading system with smart order routing, execution algorithms, and real-time market data',
          estMinutes: 720,
          weight: 10.50,
          priority: 'Critical',
          notes: 'FIX protocol integration, latency optimization, order types (market, limit, stop, trailing)',
          howToDoc: ['https://docs.fintech.com/trading-engine', 'https://docs.fintech.com/fix-protocol'],
          howToVideo: ['https://youtube.com/watch?v=trading-systems', 'https://youtube.com/watch?v=order-routing'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Portfolio Management System',
          description: 'Real-time portfolio tracking with asset allocation, rebalancing, and performance analytics',
          estMinutes: 540,
          weight: 9.25,
          priority: 'High',
          notes: 'Multi-asset class support (stocks, bonds, ETFs, options, crypto), tax-loss harvesting',
          howToDoc: ['https://docs.fintech.com/portfolio-mgmt'],
          howToVideo: ['https://youtube.com/watch?v=portfolio-tracking'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Risk Assessment Engine',
          description: 'Advanced risk modeling with VaR, stress testing, scenario analysis, and Monte Carlo simulations',
          estMinutes: 600,
          weight: 8.75,
          priority: 'High',
          notes: 'Market risk, credit risk, operational risk assessment with regulatory reporting',
          howToDoc: ['https://docs.fintech.com/risk-assessment', 'https://docs.fintech.com/var-calculation'],
          howToVideo: ['https://youtube.com/watch?v=risk-modeling'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Compliance & Regulatory Reporting',
          description: 'Automated regulatory compliance reporting for SOX, PCI-DSS, GDPR with audit trails',
          estMinutes: 480,
          weight: 8.00,
          priority: 'Critical',
          notes: 'KYC/AML verification, transaction monitoring, suspicious activity reporting (SAR)',
          howToDoc: ['https://docs.fintech.com/compliance', 'https://docs.fintech.com/kyc-aml'],
          howToVideo: ['https://youtube.com/watch?v=financial-compliance'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Market Data Integration',
          description: 'Real-time and historical market data feeds from major exchanges and data providers',
          estMinutes: 540,
          weight: 7.50,
          priority: 'Critical',
          notes: 'Multi-exchange connectivity, data normalization, WebSocket streaming, FIX/FAST protocols',
          howToDoc: ['https://docs.fintech.com/market-data'],
          howToVideo: ['https://youtube.com/watch?v=market-data-feeds'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Order Management System (OMS)',
          description: 'Centralized order management with trade lifecycle tracking and position management',
          estMinutes: 600,
          weight: 8.25,
          priority: 'High',
          notes: 'Multi-asset OMS, allocation algorithms, execution management, post-trade processing',
          howToDoc: ['https://docs.fintech.com/oms'],
          howToVideo: ['https://youtube.com/watch?v=order-management'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Client Onboarding & KYC',
          description: 'Digital client onboarding with identity verification, KYC/AML checks, and account opening',
          estMinutes: 420,
          weight: 7.00,
          priority: 'High',
          notes: 'Document verification, biometric authentication, sanctions screening, risk scoring',
          howToDoc: ['https://docs.fintech.com/client-onboarding'],
          howToVideo: ['https://youtube.com/watch?v=digital-kyc'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Performance Attribution & Analytics',
          description: 'Portfolio performance analysis with attribution, benchmarking, and factor analysis',
          estMinutes: 480,
          weight: 7.25,
          priority: 'Medium',
          notes: 'Brinson attribution, risk-adjusted returns, factor exposure, custom benchmarks',
          howToDoc: ['https://docs.fintech.com/performance-analytics'],
          howToVideo: ['https://youtube.com/watch?v=performance-attribution'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'AI Trading Algorithms',
          description: 'Machine learning-powered trading strategies with backtesting and performance optimization',
          estMinutes: 660,
          weight: 9.00,
          priority: 'Medium',
          notes: 'Sentiment analysis, pattern recognition, predictive modeling, algorithmic execution',
          howToDoc: ['https://docs.fintech.com/ai-trading'],
          howToVideo: ['https://youtube.com/watch?v=algo-trading'],
          licenseLevel: 'SIGNATURE' as const
        },
        {
          name: 'Client Portal & Reporting',
          description: 'Secure client portal with real-time access, document management, and custom reporting',
          estMinutes: 420,
          weight: 6.50,
          priority: 'Medium',
          notes: 'White-label capabilities, mobile app, secure messaging, e-signature integration',
          howToDoc: ['https://docs.fintech.com/client-portal'],
          howToVideo: ['https://youtube.com/watch?v=client-access'],
          licenseLevel: 'SIGNATURE' as const
        },
        {
          name: 'Trade Settlement & Custody',
          description: 'Automated trade settlement, reconciliation, and custody management',
          estMinutes: 540,
          weight: 7.75,
          priority: 'High',
          notes: 'DVP settlement, corporate actions, cash management, custodian integration',
          howToDoc: ['https://docs.fintech.com/settlement'],
          howToVideo: ['https://youtube.com/watch?v=trade-settlement'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Margin & Collateral Management',
          description: 'Real-time margin calculation, collateral optimization, and margin call automation',
          estMinutes: 480,
          weight: 6.75,
          priority: 'High',
          notes: 'Initial/maintenance margin, haircut calculations, margin lending, SPAN integration',
          howToDoc: ['https://docs.fintech.com/margin-mgmt'],
          howToVideo: ['https://youtube.com/watch?v=margin-system'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Financial Reporting & Tax',
          description: 'Automated financial statements, tax reporting, and cost basis tracking',
          estMinutes: 380,
          weight: 5.50,
          priority: 'Critical',
          notes: '1099 generation, realized/unrealized gains, wash sales, FIFO/LIFO accounting',
          howToDoc: ['https://docs.fintech.com/tax-reporting'],
          howToVideo: ['https://youtube.com/watch?v=financial-tax'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Fraud Detection & Security',
          description: 'Real-time fraud detection with behavioral analytics and anomaly detection',
          estMinutes: 440,
          weight: 6.00,
          priority: 'Critical',
          notes: 'Transaction monitoring, velocity checks, device fingerprinting, multi-factor authentication',
          howToDoc: ['https://docs.fintech.com/fraud-detection'],
          howToVideo: ['https://youtube.com/watch?v=financial-security'],
          licenseLevel: 'ESSENTIAL' as const
        }
      ],
      'it-app-001': [
        {
          name: 'Infrastructure Monitoring System',
          description: 'Real-time monitoring of servers, networks, applications with SNMP, WMI, and agent-based collection',
          estMinutes: 540,
          weight: 21.25,
          priority: 'Critical',
          notes: 'Multi-protocol support, threshold-based alerting, auto-discovery, health dashboards',
          howToDoc: ['https://docs.itops.com/monitoring-setup', 'https://docs.itops.com/snmp-config'],
          howToVideo: ['https://youtube.com/watch?v=infra-monitoring', 'https://youtube.com/watch?v=alerting-setup'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'ITSM Incident Management',
          description: 'ITIL-compliant incident, problem, and change management with SLA tracking and escalation',
          estMinutes: 480,
          weight: 19.50,
          priority: 'High',
          notes: 'ServiceNow/Jira integration, automated ticket routing, knowledge base, approval workflows',
          howToDoc: ['https://docs.itops.com/itsm-setup', 'https://docs.itops.com/sla-management'],
          howToVideo: ['https://youtube.com/watch?v=itsm-platform'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Automation & Orchestration',
          description: 'Workflow automation engine with runbook execution, remediation scripts, and CI/CD integration',
          estMinutes: 600,
          weight: 18.75,
          priority: 'High',
          notes: 'Ansible/Terraform integration, scheduled jobs, event-driven automation, webhook triggers',
          howToDoc: ['https://docs.itops.com/automation', 'https://docs.itops.com/runbooks'],
          howToVideo: ['https://youtube.com/watch?v=it-automation'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Asset & Configuration Management',
          description: 'IT asset tracking with CMDB, software license management, and compliance auditing',
          estMinutes: 420,
          weight: 16.00,
          priority: 'Medium',
          notes: 'Auto-discovery, asset lifecycle tracking, vendor management, cost allocation',
          howToDoc: ['https://docs.itops.com/asset-mgmt', 'https://docs.itops.com/cmdb'],
          howToVideo: ['https://youtube.com/watch?v=asset-tracking'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'AIOps Anomaly Detection',
          description: 'AI-powered anomaly detection, root cause analysis, and predictive failure prevention',
          estMinutes: 660,
          weight: 15.50,
          priority: 'Medium',
          notes: 'Machine learning models for pattern recognition, correlation engine, noise reduction',
          howToDoc: ['https://docs.itops.com/aiops'],
          howToVideo: ['https://youtube.com/watch?v=aiops-platform'],
          licenseLevel: 'SIGNATURE' as const
        },
        {
          name: 'Service Catalog & Portal',
          description: 'Self-service portal for IT requests with catalog management, approvals, and fulfillment automation',
          estMinutes: 380,
          weight: 9.00,
          priority: 'Low',
          notes: 'Request templates, multi-level approvals, provisioning workflows, user portal',
          howToDoc: ['https://docs.itops.com/service-catalog'],
          howToVideo: ['https://youtube.com/watch?v=self-service-it'],
          licenseLevel: 'SIGNATURE' as const
        }
      ],
      'ai-app-001': [
        {
          name: 'ML Model Training Pipeline',
          description: 'Distributed training infrastructure with GPU clusters, hyperparameter tuning, and experiment tracking',
          estMinutes: 840,
          weight: 23.75,
          priority: 'Critical',
          notes: 'TensorFlow/PyTorch support, distributed training, model versioning, experiment management',
          howToDoc: ['https://docs.ai-platform.com/model-training', 'https://docs.ai-platform.com/gpu-setup'],
          howToVideo: ['https://youtube.com/watch?v=ml-training', 'https://youtube.com/watch?v=distributed-training'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'NLP Processing Engine',
          description: 'Natural language processing with sentiment analysis, entity extraction, text classification, and translation',
          estMinutes: 720,
          weight: 20.50,
          priority: 'High',
          notes: 'BERT/GPT integration, multilingual support, named entity recognition, topic modeling',
          howToDoc: ['https://docs.ai-platform.com/nlp-engine', 'https://docs.ai-platform.com/transformers'],
          howToVideo: ['https://youtube.com/watch?v=nlp-tutorial'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Computer Vision System',
          description: 'Image recognition, object detection, facial recognition, and video analytics capabilities',
          estMinutes: 780,
          weight: 19.25,
          priority: 'High',
          notes: 'YOLO/ResNet models, real-time inference, custom model training, edge deployment',
          howToDoc: ['https://docs.ai-platform.com/computer-vision', 'https://docs.ai-platform.com/object-detection'],
          howToVideo: ['https://youtube.com/watch?v=cv-systems'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Recommendation Engine',
          description: 'Personalized recommendation system using collaborative filtering, content-based, and hybrid approaches',
          estMinutes: 540,
          weight: 14.50,
          priority: 'Medium',
          notes: 'Real-time recommendations, A/B testing, cold-start handling, explainability features',
          howToDoc: ['https://docs.ai-platform.com/recommendations'],
          howToVideo: ['https://youtube.com/watch?v=recommendation-systems'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'MLOps Platform',
          description: 'End-to-end MLOps with model registry, deployment pipelines, monitoring, and governance',
          estMinutes: 660,
          weight: 13.00,
          priority: 'High',
          notes: 'CI/CD for ML, feature store, model serving, drift detection, A/B testing framework',
          howToDoc: ['https://docs.ai-platform.com/mlops', 'https://docs.ai-platform.com/model-serving'],
          howToVideo: ['https://youtube.com/watch?v=mlops-pipeline'],
          licenseLevel: 'SIGNATURE' as const
        },
        {
          name: 'AutoML Platform',
          description: 'Automated machine learning with neural architecture search, automated feature engineering, and model selection',
          estMinutes: 900,
          weight: 9.00,
          priority: 'Low',
          notes: 'No-code ML, auto feature engineering, ensemble methods, explainable AI',
          howToDoc: ['https://docs.ai-platform.com/automl'],
          howToVideo: ['https://youtube.com/watch?v=automl-tutorial'],
          licenseLevel: 'SIGNATURE' as const
        }
      ],
      'networking-app-001': [
        {
          name: 'Network Discovery & Topology',
          description: 'Automated network discovery with SNMP, CDP, LLDP, device fingerprinting, and dynamic topology mapping',
          estMinutes: 600,
          weight: 22.00,
          priority: 'Critical',
          notes: 'Multi-vendor support (Cisco, Juniper, Arista), layer 2/3 discovery, dependency mapping',
          howToDoc: ['https://docs.netops.com/discovery', 'https://docs.netops.com/topology-mapping'],
          howToVideo: ['https://youtube.com/watch?v=network-discovery', 'https://youtube.com/watch?v=topology-viz'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Performance Monitoring',
          description: 'Real-time monitoring of bandwidth utilization, latency, packet loss, jitter with NetFlow/sFlow analysis',
          estMinutes: 540,
          weight: 19.75,
          priority: 'High',
          notes: 'Interface monitoring, QoS analysis, baseline anomaly detection, capacity planning',
          howToDoc: ['https://docs.netops.com/performance-monitoring', 'https://docs.netops.com/netflow'],
          howToVideo: ['https://youtube.com/watch?v=network-perf-monitoring'],
          licenseLevel: 'ESSENTIAL' as const
        },
        {
          name: 'Security & Firewall Management',
          description: 'Unified firewall management, IDS/IPS integration, threat intelligence, and security policy enforcement',
          estMinutes: 720,
          weight: 20.50,
          priority: 'Critical',
          notes: 'Multi-firewall orchestration, rule optimization, compliance auditing, threat feeds integration',
          howToDoc: ['https://docs.netops.com/security-mgmt', 'https://docs.netops.com/firewall-orchestration'],
          howToVideo: ['https://youtube.com/watch?v=network-security'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'Configuration Management',
          description: 'Automated config backup, change tracking, compliance auditing, and rollback capabilities',
          estMinutes: 480,
          weight: 15.25,
          priority: 'High',
          notes: 'Version control, config templates, scheduled backups, drift detection, bulk changes',
          howToDoc: ['https://docs.netops.com/config-mgmt', 'https://docs.netops.com/change-tracking'],
          howToVideo: ['https://youtube.com/watch?v=config-automation'],
          licenseLevel: 'ADVANTAGE' as const
        },
        {
          name: 'SD-WAN Orchestration',
          description: 'Software-defined WAN management with policy-based routing, path optimization, and application steering',
          estMinutes: 780,
          weight: 16.50,
          priority: 'Medium',
          notes: 'Multi-link aggregation, dynamic path selection, application-aware routing, zero-touch provisioning',
          howToDoc: ['https://docs.netops.com/sd-wan', 'https://docs.netops.com/path-optimization'],
          howToVideo: ['https://youtube.com/watch?v=sdwan-setup'],
          licenseLevel: 'SIGNATURE' as const
        },
        {
          name: 'Zero Trust Architecture',
          description: 'Implement zero-trust network security with micro-segmentation, identity-based access, and continuous verification',
          estMinutes: 840,
          weight: 6.00,
          priority: 'Medium',
          notes: 'Micro-segmentation policies, least-privilege access, device trust scoring, continuous authentication',
          howToDoc: ['https://docs.netops.com/zero-trust'],
          howToVideo: ['https://youtube.com/watch?v=zero-trust-network'],
          licenseLevel: 'SIGNATURE' as const
        }
      ]
    };

    // Create tasks for each product
    for (const product of products) {
      const taskList = tasksByProduct[product.id as keyof typeof tasksByProduct] || [];
      const productReleases = allReleases.filter(r => r.productId === product.id);
      const productOutcomes = allOutcomes.filter(o => o.productId === product.id);

      for (let i = 0; i < taskList.length; i++) {
        const taskInfo = taskList[i];
        const sequenceNumber = i + 1;

        const existing = await prisma.task.findFirst({
          where: { name: taskInfo.name, productId: product.id }
        });

        if (!existing) {
          const task = await prisma.task.create({
            data: {
              name: taskInfo.name,
              description: taskInfo.description,
              product: { connect: { id: product.id } },
              estMinutes: taskInfo.estMinutes,
              weight: new Prisma.Decimal(taskInfo.weight),
              sequenceNumber: sequenceNumber,
              notes: taskInfo.notes,
              howToDoc: taskInfo.howToDoc || [],
              howToVideo: taskInfo.howToVideo || [],
              licenseLevel: taskInfo.licenseLevel
            }
          });

          // Assign tasks to releases based on complexity and sequence
          const taskReleaseAssignments = [];

          if (sequenceNumber <= 2) {
            // First 2 tasks -> First release
            if (productReleases[0]) taskReleaseAssignments.push(productReleases[0]);
          }
          if (sequenceNumber <= 4) {
            // First 4 tasks -> Second release
            if (productReleases[1]) taskReleaseAssignments.push(productReleases[1]);
          }
          if (sequenceNumber <= 5) {
            // First 5 tasks -> Third release
            if (productReleases[2]) taskReleaseAssignments.push(productReleases[2]);
          }
          // All tasks -> Latest releases
          if (productReleases[3]) taskReleaseAssignments.push(productReleases[3]);
          if (productReleases[4]) taskReleaseAssignments.push(productReleases[4]);

          // Create task-release associations
          for (const release of taskReleaseAssignments) {
            await prisma.taskRelease.create({
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

            await prisma.taskOutcome.create({
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

    // Create comprehensive telemetry sample data for ALL sample product tasks
    console.log('[seed] Creating telemetry sample data...');

    // Get all tasks for Cisco sample products only (not user-created tasks)
    const sampleProductIds = [
      'prod-cisco-duo',
      'prod-cisco-sdwan',
      'prod-cisco-firewall',
      'prod-cisco-ise',
      'prod-cisco-secure-access-sample'
    ];

    const allTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        productId: { in: sampleProductIds }
      },
      orderBy: [
        { productId: 'asc' },
        { sequenceNumber: 'asc' }
      ]
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
          const existingAttribute = await prisma.telemetryAttribute.findFirst({
            where: {
              taskId: task.id,
              name: attrData.name
            }
          });

          if (existingAttribute) {
            console.log(`[seed] Telemetry attribute "${attrData.name}" already exists for task "${task.name}"`);
            continue;
          }

          const attribute = await prisma.telemetryAttribute.create({
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
                sampleValues.push(
                  { value: taskIndex % 2 === 0 ? 'true' : 'false', notes: 'All health checks passing' },
                  { value: 'false', notes: 'Some health checks failing' },
                  { value: 'true', notes: 'Systems operational' }
                );
              } else {
                sampleValues.push(
                  { value: 'false', notes: 'Initial deployment in progress' },
                  { value: taskIndex % 3 === 0 ? 'false' : 'true', notes: 'Deployment status update' },
                  { value: 'true', notes: 'Deployment completed successfully' }
                );
              }
              break;

            case 'NUMBER':
              const baseScore = 70 + (taskIndex * 5) % 30; // Deterministic scores between 70-99
              sampleValues.push(
                { value: String(baseScore), notes: 'Initial performance benchmark' },
                { value: String(baseScore + 10), notes: 'After optimization' },
                { value: String(Math.min(baseScore + 20, 99)), notes: 'Latest performance score' }
              );
              break;

            case 'STRING':
              if (attrData.name === 'Composite Health Check') {
                const healthStatuses = ['healthy', 'operational', 'healthy and operational'];
                sampleValues.push(
                  { value: healthStatuses[taskIndex % 3], notes: 'System status check' },
                  { value: 'operational', notes: 'Service status confirmed' },
                  { value: 'healthy and operational', notes: 'Full system check' }
                );
              } else {
                const qualityStatuses = ['PENDING', 'FAILED', 'PASSED'];
                const finalStatus = taskIndex % 3 === 0 ? 'FAILED' : 'PASSED';
                sampleValues.push(
                  { value: 'PENDING', notes: 'Code review in progress' },
                  { value: qualityStatuses[taskIndex % 3], notes: 'Issues found during review' },
                  { value: finalStatus, notes: 'All quality checks completed' }
                );
              }
              break;

            case 'TIMESTAMP':
              const now = new Date();
              const daysAgo1 = new Date(now.getTime() - (3 + taskIndex) * 24 * 60 * 60 * 1000);
              const daysAgo2 = new Date(now.getTime() - (1 + taskIndex * 0.5) * 24 * 60 * 60 * 1000);
              sampleValues.push(
                { value: daysAgo1.toISOString(), notes: 'Initial timestamp' },
                { value: daysAgo2.toISOString(), notes: 'Recent update' },
                { value: now.toISOString(), notes: 'Latest timestamp' }
              );
              break;
          }

          // Create the values with deterministic timestamps
          for (let i = 0; i < sampleValues.length; i++) {
            const valueData = sampleValues[i];
            const daysBack = (sampleValues.length - i) * 2; // 6, 4, 2 days back
            const createdAt = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

            await prisma.telemetryValue.create({
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
      } catch (error) {
        console.error(`[seed] Error creating telemetry data for task ${task.name}:`, error);
      }
    }

    console.log(`[seed] Completed telemetry sample data creation for ${allTasks.length} tasks`);
    console.log('[seed] Each task has 5 telemetry attributes:');
    console.log('[seed]   1. Deployment Status (BOOLEAN) - with 3 historical values');
    console.log('[seed]   2. Performance Score (NUMBER) - with 3 historical values');
    console.log('[seed]   3. Code Quality (STRING) - with 3 historical values');
    console.log('[seed]   4. Last Updated (TIMESTAMP) - with 3 historical values');
    console.log('[seed]   5. Composite Health Check (BOOLEAN) - with 3 historical values');

    // Seed solution data
    console.log('[seed] Seeding solution adoption data...');
    await seedSolutions();
  } else {
    console.log('[seed] Skipping sample data');
  }
}

main().then(() => { console.log('[seed] Completed'); process.exit(0); }).catch(e => { console.error('[seed] Failed', e); process.exit(1); });
