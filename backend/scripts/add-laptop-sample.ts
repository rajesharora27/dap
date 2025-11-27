import { PrismaClient, TelemetryDataType, LicenseLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function addLaptopSample() {
  console.log('🚀 Adding Smart Laptop Pro sample product...\n');

  try {
    // Check if product exists
    const existing = await prisma.product.findFirst({
      where: { name: 'Smart Laptop Pro' }
    });

    if (existing) {
      console.log('⚠️  Product exists. Deleting...');
      await prisma.product.delete({ where: { id: existing.id } });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: 'Smart Laptop Pro',
        description: 'Modern high-performance laptop for professionals. Features cutting-edge technology, enterprise security, and seamless collaboration tools.',
        customAttrs: {
          category: 'Computing Device',
          manufacturer: 'TechCorp',
          weight: '1.4 kg',
          screenSize: '14 inches',
          processor: 'Intel Core i7',
          memory: '16GB RAM',
          storage: '512GB SSD',
          batteryLife: 'Up to 12 hours'
        }
      }
    });
    console.log(`✅ Created: ${product.name}`);

    // Create releases
    const r1 = await prisma.release.create({
      data: { name: 'Version 1.0 (2023)', level: 1.0, productId: product.id }
    });
    const r2 = await prisma.release.create({
      data: { name: 'Version 2.0 (2024)', level: 2.0, productId: product.id }
    });
    const r3 = await prisma.release.create({
      data: { name: 'Version 3.0 (2025)', level: 3.0, productId: product.id }
    });
    console.log(`✅ Created 3 releases`);

    // Create outcomes
    const o1 = await prisma.outcome.create({
      data: { name: 'Productivity', description: 'Maximize productivity', productId: product.id }
    });
    const o2 = await prisma.outcome.create({
      data: { name: 'Security', description: 'Enterprise security', productId: product.id }
    });
    const o3 = await prisma.outcome.create({
      data: { name: 'User Experience', description: 'Great UX', productId: product.id }
    });
    console.log(`✅ Created 3 outcomes`);

    // Task 1: Setup
    const task1 = await prisma.task.create({
      data: {
        name: 'Complete Initial Setup',
        description: 'Unbox and complete setup wizard',
        productId: product.id,
        estMinutes: 30,
        sequenceNumber: 1,
        licenseLevel: LicenseLevel.ESSENTIAL,
        howToDoc: ['https://docs.example.com/setup'],
        howToVideo: ['https://videos.example.com/setup']
      }
    });
    await prisma.taskOutcome.create({ data: { taskId: task1.id, outcomeId: o3.id } });
    await prisma.taskRelease.createMany({ data: [
      { taskId: task1.id, releaseId: r1.id },
      { taskId: task1.id, releaseId: r2.id },
      { taskId: task1.id, releaseId: r3.id }
    ]});
    await prisma.telemetryAttribute.createMany({ data: [
      {
        taskId: task1.id,
        name: 'Setup Completed',
        description: 'Setup wizard completed',
        dataType: TelemetryDataType.BOOLEAN,
        successCriteria: { type: 'boolean_flag', expectedValue: true }
      },
      {
        taskId: task1.id,
        name: 'Setup Time (minutes)',
        description: 'Time to complete setup',
        dataType: TelemetryDataType.NUMBER,
        successCriteria: { type: 'threshold', operator: 'lessThan', threshold: 30 }
      }
    ]});

    // Task 2: Software Installation
    const task2 = await prisma.task.create({
      data: {
        name: 'Install Essential Software',
        description: 'Install productivity and security software',
        productId: product.id,
        estMinutes: 60,
        sequenceNumber: 2,
        licenseLevel: LicenseLevel.ADVANTAGE,
        howToDoc: ['https://docs.example.com/software'],
        howToVideo: []
      }
    });
    await prisma.taskOutcome.createMany({ data: [
      { taskId: task2.id, outcomeId: o1.id },
      { taskId: task2.id, outcomeId: o2.id }
    ]});
    await prisma.taskRelease.createMany({ data: [
      { taskId: task2.id, releaseId: r1.id },
      { taskId: task2.id, releaseId: r2.id },
      { taskId: task2.id, releaseId: r3.id }
    ]});
    await prisma.telemetryAttribute.createMany({ data: [
      {
        taskId: task2.id,
        name: 'All Software Installed',
        description: 'All packages installed',
        dataType: TelemetryDataType.BOOLEAN,
        successCriteria: { type: 'boolean_flag', expectedValue: true }
      },
      {
        taskId: task2.id,
        name: 'Apps Installed Count',
        description: 'Number of apps',
        dataType: TelemetryDataType.NUMBER,
        successCriteria: { type: 'threshold', operator: 'greaterThanOrEqual', threshold: 10 }
      },
      {
        taskId: task2.id,
        name: 'Antivirus Status',
        description: 'Antivirus state',
        dataType: TelemetryDataType.STRING,
        successCriteria: { type: 'exact_match', expectedValue: 'Active' }
      }
    ]});

    // Task 3: Security
    const task3 = await prisma.task.create({
      data: {
        name: 'Configure Security',
        description: 'Enable firewall, encryption, biometric auth',
        productId: product.id,
        estMinutes: 45,
        sequenceNumber: 3,
        licenseLevel: LicenseLevel.SIGNATURE,
        howToDoc: ['https://docs.example.com/security'],
        howToVideo: ['https://videos.example.com/security']
      }
    });
    await prisma.taskOutcome.create({ data: { taskId: task3.id, outcomeId: o2.id } });
    await prisma.taskRelease.createMany({ data: [
      { taskId: task3.id, releaseId: r2.id },
      { taskId: task3.id, releaseId: r3.id }
    ]});
    await prisma.telemetryAttribute.createMany({ data: [
      {
        taskId: task3.id,
        name: 'Firewall Enabled',
        description: 'Firewall active',
        dataType: TelemetryDataType.BOOLEAN,
        successCriteria: { type: 'boolean_flag', expectedValue: true }
      },
      {
        taskId: task3.id,
        name: 'Encryption Enabled',
        description: 'Disk encryption on',
        dataType: TelemetryDataType.BOOLEAN,
        successCriteria: { type: 'boolean_flag', expectedValue: true }
      },
      {
        taskId: task3.id,
        name: 'Security Score',
        description: 'Overall score 0-100',
        dataType: TelemetryDataType.NUMBER,
        successCriteria: { type: 'threshold', operator: 'greaterThanOrEqual', threshold: 85 }
      }
    ]});

    // Task 4: Productivity Tools
    const task4 = await prisma.task.create({
      data: {
        name: 'Setup Productivity Tools',
        description: 'Configure email, calendar, collaboration',
        productId: product.id,
        estMinutes: 30,
        sequenceNumber: 4,
        licenseLevel: LicenseLevel.ADVANTAGE,
        howToDoc: [],
        howToVideo: []
      }
    });
    await prisma.taskOutcome.createMany({ data: [
      { taskId: task4.id, outcomeId: o1.id },
      { taskId: task4.id, outcomeId: o3.id }
    ]});
    await prisma.taskRelease.createMany({ data: [
      { taskId: task4.id, releaseId: r1.id },
      { taskId: task4.id, releaseId: r2.id },
      { taskId: task4.id, releaseId: r3.id }
    ]});
    await prisma.telemetryAttribute.createMany({ data: [
      {
        taskId: task4.id,
        name: 'Email Configured',
        description: 'Email syncing',
        dataType: TelemetryDataType.BOOLEAN,
        successCriteria: { type: 'boolean_flag', expectedValue: true }
      },
      {
        taskId: task4.id,
        name: 'Calendar Synced',
        description: 'Calendar active',
        dataType: TelemetryDataType.BOOLEAN,
        successCriteria: { type: 'boolean_flag', expectedValue: true }
      },
      {
        taskId: task4.id,
        name: 'Sync Status',
        description: 'Sync state',
        dataType: TelemetryDataType.STRING,
        successCriteria: { type: 'exact_match', expectedValue: 'Fully Synced' }
      }
    ]});

    // Task 5: Performance
    const task5 = await prisma.task.create({
      data: {
        name: 'Optimize Performance',
        description: 'Configure power, startup optimization',
        productId: product.id,
        estMinutes: 20,
        sequenceNumber: 5,
        licenseLevel: LicenseLevel.ADVANTAGE,
        howToDoc: [],
        howToVideo: []
      }
    });
    await prisma.taskOutcome.create({ data: { taskId: task5.id, outcomeId: o1.id } });
    await prisma.taskRelease.createMany({ data: [
      { taskId: task5.id, releaseId: r2.id },
      { taskId: task5.id, releaseId: r3.id }
    ]});
    await prisma.telemetryAttribute.createMany({ data: [
      {
        taskId: task5.id,
        name: 'Fast Startup Enabled',
        description: 'Fast boot mode',
        dataType: TelemetryDataType.BOOLEAN,
        successCriteria: { type: 'boolean_flag', expectedValue: true }
      },
      {
        taskId: task5.id,
        name: 'Boot Time (seconds)',
        description: 'Boot duration',
        dataType: TelemetryDataType.NUMBER,
        successCriteria: { type: 'threshold', operator: 'lessThan', threshold: 30 }
      },
      {
        taskId: task5.id,
        name: 'Performance Mode',
        description: 'Power mode',
        dataType: TelemetryDataType.STRING,
        successCriteria: { type: 'exact_match', expectedValue: 'High Performance' }
      }
    ]});

    console.log(`✅ Created 5 tasks with telemetry\n`);
    console.log('═══════════════════════════════════════');
    console.log('✅ SAMPLE PRODUCT COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`\n📦 Product: Smart Laptop Pro`);
    console.log(`   • 3 Releases (v1.0, v2.0, v3.0)`);
    console.log(`   • 3 Outcomes (Productivity, Security, UX)`);
    console.log(`   • 5 Tasks with telemetry`);
    console.log(`   • ~15 Telemetry attributes (all 3 types)`);
    console.log('\n💡 Perfect for demos and training!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addLaptopSample()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));


