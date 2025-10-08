import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Starting clean sample data generation...');

  try {
    // Always ensure at least one test product exists
    const testProduct = await prisma.product.upsert({
      where: { id: 'test-product-1' },
      create: {
        id: 'test-product-1',
        name: 'Test E-Commerce Platform',
        description: 'A comprehensive e-commerce platform for testing',
        customAttrs: {
          priority: 'High',
          category: 'Web Application',
          technology: 'React, Node.js, PostgreSQL',
          businessValue: 'High - Revenue Generation',
          compliance: 'PCI-DSS, GDPR',
          complexity: 'Medium'
        }
      },
      update: {
        name: 'Test E-Commerce Platform',
        description: 'A comprehensive e-commerce platform for testing',
        customAttrs: {
          priority: 'High',
          category: 'Web Application',
          technology: 'React, Node.js, PostgreSQL',
          businessValue: 'High - Revenue Generation',
          compliance: 'PCI-DSS, GDPR',
          complexity: 'Medium'
        }
      }
    });
    console.log(`[seed] Created/updated test product: ${testProduct.name}`);

    // Create comprehensive products with rich attributes
    const products = [
      {
        id: 'retail-app-001',
        name: 'Retail Management App',
        description: 'Comprehensive retail management system with POS, inventory, and customer analytics',
        customAttrs: {
          priority: 'High',
          category: 'Retail Application',
          technology: 'React, Node.js, PostgreSQL',
          businessValue: 'High - Revenue Optimization',
          compliance: 'PCI-DSS',
          complexity: 'High',
          targetMarket: 'Small-to-medium retail',
          deployment: 'Cloud-hybrid'
        }
      },
      {
        id: 'financial-app-001',
        name: 'Financial Services App',
        description: 'Enterprise financial management platform with trading, portfolio management, and compliance',
        customAttrs: {
          priority: 'Critical',
          category: 'Fintech Application',
          technology: 'React, Java, Kafka',
          businessValue: 'Critical - Regulatory Compliance',
          compliance: 'SOX, PCI-DSS, GDPR',
          complexity: 'Very High',
          security: 'Enterprise-grade',
          deployment: 'Private cloud'
        }
      },
      {
        id: 'it-app-001',
        name: 'IT Operations App',
        description: 'Unified IT operations and monitoring platform with incident management and automation',
        customAttrs: {
          priority: 'High',
          category: 'Enterprise IT',
          technology: 'Angular, Python, Kubernetes',
          businessValue: 'High - Operational Excellence',
          complexity: 'High',
          integration: 'ServiceNow, Splunk, Jira',
          deployment: 'On-premise/cloud hybrid'
        }
      },
      {
        id: 'ai-app-001',
        name: 'AI-Powered Analytics App',
        description: 'Machine learning platform with predictive analytics, NLP, and computer vision capabilities',
        customAttrs: {
          priority: 'Strategic',
          category: 'AI/ML Platform',
          technology: 'Python, TensorFlow, PyTorch, FastAPI',
          businessValue: 'Strategic - Competitive Advantage',
          complexity: 'Very High',
          aiCapabilities: 'NLP, Computer Vision, Predictive Analytics',
          deployment: 'Cloud-native',
          infrastructure: 'GPU-accelerated'
        }
      },
      {
        id: 'networking-app-001',
        name: 'Network Management App',
        description: 'Enterprise network monitoring and management system with SD-WAN and security integration',
        customAttrs: {
          priority: 'Critical',
          category: 'Network Infrastructure',
          technology: 'React, Go, gRPC, TimescaleDB',
          businessValue: 'Critical - Infrastructure Reliability',
          complexity: 'Very High',
          protocols: 'SNMP, NetFlow, BGP, OSPF',
          security: 'Zero-trust architecture',
          deployment: 'Distributed hybrid'
        }
      }
    ];

    const allProducts = [testProduct];
    
    for (const productData of products) {
      const existing = await prisma.product.findUnique({ where: { id: productData.id } });
      if (!existing) {
        const product = await prisma.product.create({ data: productData });
        allProducts.push(product);
        console.log(`[seed] Created product: ${product.name}`);
      } else {
        allProducts.push(existing);
      }
    }

    // Create outcomes for each product
    const outcomesByProduct = {
      'test-product-1': [
        { name: 'User Authentication', description: 'Secure user login and registration system' },
        { name: 'Payment Processing', description: 'Handle secure payment transactions' },
        { name: 'Product Catalog', description: 'Display and manage product inventory' },
      ],
      'retail-app-001': [
        { name: 'POS System', description: 'Cloud-based point-of-sale with offline mode' },
        { name: 'Inventory Management', description: 'Real-time inventory tracking and reordering' },
        { name: 'Customer Loyalty', description: 'Rewards and personalized promotions' },
      ],
      'financial-app-001': [
        { name: 'Portfolio Management', description: 'Real-time portfolio tracking and analytics' },
        { name: 'Trading Execution', description: 'High-frequency trading with smart routing' },
        { name: 'Compliance Reporting', description: 'Automated regulatory compliance' },
      ],
      'it-app-001': [
        { name: 'Infrastructure Monitoring', description: 'Real-time IT infrastructure monitoring' },
        { name: 'Incident Management', description: 'ITIL-compliant incident tracking' },
        { name: 'Automation Engine', description: 'Workflow automation and remediation' },
      ],
      'ai-app-001': [
        { name: 'Predictive Analytics', description: 'ML forecasting and anomaly detection' },
        { name: 'Natural Language Processing', description: 'NLP for text analysis' },
        { name: 'Computer Vision', description: 'Image recognition and object detection' },
      ],
      'networking-app-001': [
        { name: 'Network Discovery', description: 'Automated topology discovery' },
        { name: 'Performance Monitoring', description: 'Bandwidth and latency monitoring' },
        { name: 'Security Management', description: 'Firewall and threat intelligence' },
      ]
    };

    const allOutcomes = [];
    for (const product of allProducts) {
      const outcomeList = outcomesByProduct[product.id as keyof typeof outcomesByProduct] || [];
      for (const outcomeInfo of outcomeList) {
        const existing = await prisma.outcome.findFirst({ 
          where: { productId: product.id, name: outcomeInfo.name } 
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

    // Create licenses for each product
    const licensesByProduct = {
      'test-product-1': [
        { name: 'Basic Commerce', level: 1, description: 'Essential e-commerce features' },
        { name: 'Professional Commerce', level: 2, description: 'Advanced marketing and analytics tools' },
        { name: 'Enterprise Commerce', level: 3, description: 'Full-featured enterprise solution' }
      ],
      'retail-app-001': [
        { name: 'Retail Starter', level: 1, description: 'Single-location POS with basic inventory' },
        { name: 'Retail Professional', level: 2, description: 'Multi-location with loyalty programs' },
        { name: 'Retail Enterprise', level: 3, description: 'Unlimited locations with API access' }
      ],
      'financial-app-001': [
        { name: 'Financial Basic', level: 1, description: 'Core portfolio management for up to 100 clients' },
        { name: 'Financial Professional', level: 2, description: 'Advanced trading for up to 1000 clients' },
        { name: 'Financial Enterprise', level: 3, description: 'Unlimited with algorithmic trading' }
      ],
      'it-app-001': [
        { name: 'IT Essential', level: 1, description: 'Monitor up to 50 devices' },
        { name: 'IT Advanced', level: 2, description: 'Monitor up to 500 devices with automation' },
        { name: 'IT Enterprise', level: 3, description: 'Unlimited devices with AIOps' }
      ],
      'ai-app-001': [
        { name: 'AI Starter', level: 1, description: 'Pre-built models with 10k API calls/month' },
        { name: 'AI Professional', level: 2, description: 'Custom training with 100k API calls/month' },
        { name: 'AI Enterprise', level: 3, description: 'Unlimited models and API calls' }
      ],
      'networking-app-001': [
        { name: 'Network Monitor', level: 1, description: 'Monitor up to 25 devices' },
        { name: 'Network Professional', level: 2, description: 'Monitor up to 250 devices with SD-WAN' },
        { name: 'Network Enterprise', level: 3, description: 'Unlimited devices with automation' }
      ]
    };

    const allLicenses = [];
    for (const product of allProducts) {
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

    // Create tasks with ONLY the fields we display: outcomes, license, and howto
    const tasksByProduct = {
      'test-product-1': [
        {
          name: 'Setup Authentication System',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.example.com/authentication-setup'],
          howToVideo: ['https://youtube.com/watch?v=auth-tutorial']
        },
        {
          name: 'Build Product Catalog',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.example.com/product-catalog'],
          howToVideo: ['https://youtube.com/watch?v=catalog-guide']
        },
        {
          name: 'Implement Payment Gateway',
          licenseLevel: 'ADVANTAGE' as const,
          howToDoc: ['https://docs.example.com/payment-integration'],
          howToVideo: ['https://youtube.com/watch?v=payment-setup']
        }
      ],
      'retail-app-001': [
        {
          name: 'Build Cloud POS System',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.retail.com/pos-setup', 'https://docs.retail.com/payment-terminals'],
          howToVideo: ['https://youtube.com/watch?v=cloud-pos-tutorial']
        },
        {
          name: 'Implement Inventory Management',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.retail.com/inventory-system'],
          howToVideo: ['https://youtube.com/watch?v=inventory-guide']
        },
        {
          name: 'Customer Loyalty Program',
          licenseLevel: 'ADVANTAGE' as const,
          howToDoc: ['https://docs.retail.com/loyalty-program'],
          howToVideo: ['https://youtube.com/watch?v=loyalty-setup']
        }
      ],
      'financial-app-001': [
        {
          name: 'Build Trading Execution Engine',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.fintech.com/trading-engine', 'https://docs.fintech.com/fix-protocol'],
          howToVideo: ['https://youtube.com/watch?v=trading-systems']
        },
        {
          name: 'Portfolio Management System',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.fintech.com/portfolio-mgmt'],
          howToVideo: ['https://youtube.com/watch?v=portfolio-tracking']
        },
        {
          name: 'Risk Assessment Engine',
          licenseLevel: 'ADVANTAGE' as const,
          howToDoc: ['https://docs.fintech.com/risk-assessment'],
          howToVideo: ['https://youtube.com/watch?v=risk-modeling']
        }
      ],
      'it-app-001': [
        {
          name: 'Infrastructure Monitoring System',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.itops.com/monitoring-setup'],
          howToVideo: ['https://youtube.com/watch?v=infra-monitoring']
        },
        {
          name: 'ITSM Incident Management',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.itops.com/itsm-setup'],
          howToVideo: ['https://youtube.com/watch?v=itsm-platform']
        },
        {
          name: 'Automation & Orchestration',
          licenseLevel: 'ADVANTAGE' as const,
          howToDoc: ['https://docs.itops.com/automation'],
          howToVideo: ['https://youtube.com/watch?v=it-automation']
        }
      ],
      'ai-app-001': [
        {
          name: 'ML Model Training Pipeline',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.ai-platform.com/model-training'],
          howToVideo: ['https://youtube.com/watch?v=ml-training']
        },
        {
          name: 'NLP Processing Engine',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.ai-platform.com/nlp-engine'],
          howToVideo: ['https://youtube.com/watch?v=nlp-tutorial']
        },
        {
          name: 'Computer Vision System',
          licenseLevel: 'ADVANTAGE' as const,
          howToDoc: ['https://docs.ai-platform.com/computer-vision'],
          howToVideo: ['https://youtube.com/watch?v=cv-systems']
        }
      ],
      'networking-app-001': [
        {
          name: 'Network Discovery & Topology',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.netops.com/discovery'],
          howToVideo: ['https://youtube.com/watch?v=network-discovery']
        },
        {
          name: 'Performance Monitoring',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: ['https://docs.netops.com/performance-monitoring'],
          howToVideo: ['https://youtube.com/watch?v=network-perf-monitoring']
        },
        {
          name: 'Security & Firewall Management',
          licenseLevel: 'ADVANTAGE' as const,
          howToDoc: ['https://docs.netops.com/security-mgmt'],
          howToVideo: ['https://youtube.com/watch?v=network-security']
        }
      ]
    };

    // Create tasks for each product
    for (const product of allProducts) {
      const taskList = tasksByProduct[product.id as keyof typeof tasksByProduct] || [];
      const productOutcomes = allOutcomes.filter(o => o.productId === product.id);
      
      for (let i = 0; i < taskList.length; i++) {
        const taskInfo = taskList[i];
        
        const existing = await prisma.task.findFirst({ 
          where: { name: taskInfo.name, productId: product.id } 
        });
        
        if (!existing) {
          const task = await prisma.task.create({
            data: {
              name: taskInfo.name,
              productId: product.id,
              estMinutes: 120, // Minimal required field
              weight: 33, // Minimal required field
              licenseLevel: taskInfo.licenseLevel,
              howToDoc: taskInfo.howToDoc || [],
              howToVideo: taskInfo.howToVideo || [],
              sequenceNumber: i + 1
            }
          });

          // Assign task to outcome (round-robin)
          if (productOutcomes.length > 0) {
            const outcomeIndex = i % productOutcomes.length;
            const assignedOutcome = productOutcomes[outcomeIndex];
            
            await prisma.taskOutcome.create({
              data: {
                taskId: task.id,
                outcomeId: assignedOutcome.id
              }
            });
          }

          console.log(`[seed] Created task: ${task.name} for ${product.name}`);
        }
      }
    }

    console.log('[seed] Clean sample data generation completed successfully');

  } catch (error) {
    console.error('[seed] Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });