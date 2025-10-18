const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function testSyncWithNewOutcome() {
  try {
    console.log('🧪 Testing Sync with New Product Changes\n');
    
    // Find ACME customer with Network Management
    const customer = await prisma.customer.findFirst({
      where: { name: { contains: 'ACME', mode: 'insensitive' } },
      include: {
        products: {
          include: {
            product: {
              include: {
                outcomes: true,
                releases: true,
                tasks: {
                  where: { deletedAt: null },
                  include: {
                    outcomes: { include: { outcome: true } },
                  },
                },
              },
            },
          },
          where: {
            product: {
              name: { contains: 'Network', mode: 'insensitive' },
            },
          },
        },
      },
    });

    if (!customer || !customer.products[0]) {
      console.log('❌ ACME customer or Network Management product not found');
      return;
    }

    const customerProduct = customer.products[0];
    console.log(`✅ Customer: ${customer.name}`);
    console.log(`📦 Product: ${customerProduct.product.name}\n`);

    // Show current state
    console.log('📊 BEFORE SYNC:');
    console.log(`   Customer Selected Outcomes: ${customerProduct.selectedOutcomes ? JSON.parse(JSON.stringify(customerProduct.selectedOutcomes)).length : 0}`);
    console.log(`   Customer Selected Releases: ${customerProduct.selectedReleases ? JSON.parse(JSON.stringify(customerProduct.selectedReleases)).length : 0}`);
    
    console.log(`\n   Product Total Outcomes: ${customerProduct.product.outcomes.length}`);
    for (const outcome of customerProduct.product.outcomes) {
      console.log(`      - ${outcome.name}`);
    }
    
    console.log(`\n   Product Total Releases: ${customerProduct.product.releases.length}`);
    for (const release of customerProduct.product.releases) {
      console.log(`      - ${release.name}`);
    }

    console.log(`\n   Product Total Tasks: ${customerProduct.product.tasks.length}`);

    // Get adoption plan
    const adoptionPlanBefore = await prisma.adoptionPlan.findFirst({
      where: { customerProductId: customerProduct.id },
      include: {
        tasks: true,
      },
    });

    if (!adoptionPlanBefore) {
      console.log('\n❌ No adoption plan found');
      return;
    }

    console.log(`\n   Adoption Plan Tasks: ${adoptionPlanBefore.tasks.length}`);
    console.log(`   Last Synced: ${adoptionPlanBefore.lastSyncedAt || 'NEVER'}`);

    // Simulate sync by calling the sync logic
    console.log('\n\n🔄 SIMULATING SYNC...');
    
    // Get updated data
    const updatedCustomerProduct = await prisma.customerProduct.findUnique({
      where: { id: customerProduct.id },
      include: {
        product: {
          include: {
            outcomes: true,
            releases: true,
            tasks: {
              where: { deletedAt: null },
              include: {
                outcomes: true,
                releases: true,
              },
            },
          },
        },
      },
    });

    if (!updatedCustomerProduct) {
      console.log('❌ Customer product not found');
      return;
    }

    // Calculate what would happen
    const allProductOutcomeIds = updatedCustomerProduct.product.outcomes.map(o => o.id);
    const allProductReleaseIds = updatedCustomerProduct.product.releases.map(r => r.id);
    
    const originalOutcomeIds = updatedCustomerProduct.selectedOutcomes || [];
    const originalReleaseIds = updatedCustomerProduct.selectedReleases || [];
    
    const newOutcomes = allProductOutcomeIds.filter(id => !originalOutcomeIds.includes(id));
    const newReleases = allProductReleaseIds.filter(id => !originalReleaseIds.includes(id));

    console.log(`\n   Would add ${newOutcomes.length} new outcomes`);
    console.log(`   Would add ${newReleases.length} new releases`);

    // Count eligible tasks after sync
    const licenseLevels = ['ESSENTIAL', 'ADVANTAGE', 'SIGNATURE'];
    const customerLevel = licenseLevels.indexOf(updatedCustomerProduct.licenseLevel.toUpperCase());
    
    let eligibleCount = 0;
    for (const task of updatedCustomerProduct.product.tasks) {
      const taskLevel = licenseLevels.indexOf(task.licenseLevel.toUpperCase());
      if (taskLevel > customerLevel) continue;

      // With ALL outcomes selected, check if task has any outcome
      const taskOutcomeIds = task.outcomes.map(o => o.outcomeId);
      if (allProductOutcomeIds.length > 0 && taskOutcomeIds.length > 0) {
        const hasMatch = taskOutcomeIds.some(id => allProductOutcomeIds.includes(id));
        if (hasMatch) eligibleCount++;
      } else if (taskOutcomeIds.length === 0) {
        eligibleCount++; // Task with no outcomes is always eligible
      }
    }

    console.log(`\n   After sync, ${eligibleCount} tasks would be eligible`);
    console.log(`   Current adoption plan has ${adoptionPlanBefore.tasks.length} tasks`);
    console.log(`   Would add ${Math.max(0, eligibleCount - adoptionPlanBefore.tasks.length)} new tasks`);

    console.log('\n✅ Sync simulation complete!');
    console.log('\n💡 To actually perform the sync:');
    console.log('   1. Go to ACME customer adoption plan in the UI');
    console.log('   2. Click the "Sync" button');
    console.log('   3. All product outcomes and releases will be automatically included');
    console.log('   4. New tasks matching the customer\'s license will appear');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSyncWithNewOutcome();
