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
        id: 'sample-product-2',
        name: 'Mobile Banking App',
        description: 'Secure mobile banking application with biometric authentication',
        customAttrs: {
          priority: 'Critical',
          category: 'Mobile Application',
          technology: 'React Native, Node.js, PostgreSQL',
          businessValue: 'Critical - Customer Engagement',
          compliance: 'PCI-DSS, SOX, GDPR',
          complexity: 'High'
        }
      },
      {
        id: 'sample-product-3',
        name: 'Analytics Dashboard',
        description: 'Real-time business analytics and reporting dashboard',
        customAttrs: {
          priority: 'Medium',
          category: 'Data Analytics',
          technology: 'React, D3.js, TensorFlow, Node.js',
          businessValue: 'Medium - Business Intelligence',
          compliance: 'SOC2, GDPR',
          complexity: 'Medium'
        }
      },
      {
        id: 'sample-product-4',
        name: 'Healthcare Management System',
        description: 'Comprehensive patient and medical records management platform',
        customAttrs: {
          priority: 'Critical',
          category: 'Healthcare Application',
          technology: 'React, Node.js, MongoDB, FHIR',
          businessValue: 'Critical - Patient Care',
          compliance: 'HIPAA, SOC2, GDPR',
          complexity: 'High'
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
      'sample-product-2': [
        { name: 'Biometric Security', description: 'Fingerprint and facial recognition login' },
        { name: 'Account Management', description: 'View account balances and transaction history' },
        { name: 'Money Transfer', description: 'Send and receive money transfers' },
      ],
      'sample-product-3': [
        { name: 'Data Visualization', description: 'Interactive charts and graphs' },
        { name: 'Report Generation', description: 'Automated report creation and scheduling' },
        { name: 'Real-time Analytics', description: 'Live data processing and insights' },
      ],
      'sample-product-4': [
        { name: 'Patient Records', description: 'Secure electronic health records management' },
        { name: 'Appointment Scheduling', description: 'Medical appointment booking and management' },
        { name: 'Clinical Decision Support', description: 'AI-powered clinical recommendations and alerts' },
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
      'sample-product-2': [
        { name: 'Standard Banking', level: 1, description: 'Basic banking operations and transfers' },
        { name: 'Premium Banking', level: 2, description: 'Investment tools and advanced security' },
        { name: 'Private Banking', level: 3, description: 'Wealth management and personalized services' }
      ],
      'sample-product-3': [
        { name: 'Basic Analytics', level: 1, description: 'Standard reports and basic visualizations' },
        { name: 'Advanced Analytics', level: 2, description: 'Custom dashboards and advanced filtering' },
        { name: 'Enterprise Analytics', level: 3, description: 'AI-powered insights and unlimited data sources' }
      ],
      'sample-product-4': [
        { name: 'Clinic License', level: 1, description: 'Basic patient management for small clinics' },
        { name: 'Hospital License', level: 2, description: 'Full hospital management with departments' },
        { name: 'Health System License', level: 3, description: 'Multi-facility healthcare network management' }
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
          howToDoc: 'https://docs.example.com/authentication-setup',
          howToVideo: 'https://youtube.com/watch?v=auth-tutorial'
        },
        {
          name: 'Build Product Catalog',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: 'https://docs.example.com/product-catalog',
          howToVideo: 'https://youtube.com/watch?v=catalog-guide'
        },
        {
          name: 'Implement Payment Gateway',
          licenseLevel: 'ADVANTAGE' as const,
          howToDoc: 'https://docs.example.com/payment-integration',
          howToVideo: 'https://youtube.com/watch?v=payment-setup'
        }
      ],
      'sample-product-2': [
        {
          name: 'Biometric Authentication',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: 'https://docs.example.com/biometric-auth',
          howToVideo: 'https://youtube.com/watch?v=biometric-setup'
        },
        {
          name: 'Account Balance Display',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: 'https://docs.example.com/balance-display',
          howToVideo: 'https://youtube.com/watch?v=balance-tutorial'
        },
        {
          name: 'Money Transfer System',
          licenseLevel: 'ADVANTAGE' as const,
          howToDoc: 'https://docs.example.com/money-transfers',
          howToVideo: 'https://youtube.com/watch?v=transfer-guide'
        }
      ],
      'sample-product-3': [
        {
          name: 'Data Visualization Engine',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: 'https://docs.example.com/data-visualization',
          howToVideo: 'https://youtube.com/watch?v=chart-tutorial'
        },
        {
          name: 'Real-time Data Pipeline',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: 'https://docs.example.com/realtime-pipeline',
          howToVideo: 'https://youtube.com/watch?v=kafka-setup'
        },
        {
          name: 'Machine Learning Insights',
          licenseLevel: 'SIGNATURE' as const,
          howToDoc: 'https://docs.example.com/ml-insights',
          howToVideo: 'https://youtube.com/watch?v=ml-analytics'
        }
      ],
      'sample-product-4': [
        {
          name: 'Patient Registration System',
          licenseLevel: 'ESSENTIAL' as const,
          howToDoc: 'https://docs.example.com/patient-registration',
          howToVideo: 'https://youtube.com/watch?v=patient-system'
        },
        {
          name: 'Electronic Health Records',
          licenseLevel: 'ADVANTAGE' as const,
          howToDoc: 'https://docs.example.com/ehr-implementation',
          howToVideo: 'https://youtube.com/watch?v=ehr-tutorial'
        },
        {
          name: 'Clinical Decision Support',
          licenseLevel: 'SIGNATURE' as const,
          howToDoc: 'https://docs.example.com/clinical-ai',
          howToVideo: 'https://youtube.com/watch?v=clinical-ai-guide'
        },
        {
          name: 'Medical Imaging Integration',
          licenseLevel: 'SIGNATURE' as const,
          howToDoc: 'https://docs.example.com/dicom-integration',
          howToVideo: 'https://youtube.com/watch?v=medical-imaging'
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
              howToDoc: taskInfo.howToDoc ? [taskInfo.howToDoc] : [],
              howToVideo: taskInfo.howToVideo ? [taskInfo.howToVideo] : [],
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