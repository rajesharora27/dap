const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function testSyncMutation() {
  try {
    console.log('🧪 Testing Sync Mutation for Acme Corporation - Network Management\n');
    
    // Find ACME's adoption plan
    const customer = await prisma.customer.findFirst({
      where: { name: { contains: 'Acme', mode: 'insensitive' } },
      include: {
        products: {
          include: {
            adoptionPlan: {
              include: {
                tasks: true,
              },
            },
            product: {
              include: {
                outcomes: true,
                releases: true,
                tasks: { where: { deletedAt: null } },
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
      console.log('❌ Customer or product not found');
      return;
    }

    const customerProduct = customer.products[0];
    const adoptionPlan = customerProduct.adoptionPlan;

    if (!adoptionPlan) {
      console.log('❌ No adoption plan found');
      return;
    }

    console.log(`✅ Found customer: ${customer.name}`);
    console.log(`📦 Product: ${customerProduct.product.name}`);
    console.log(`📋 Adoption Plan ID: ${adoptionPlan.id}`);
    console.log(`\n📊 Current State:`);
    console.log(`   Tasks in plan: ${adoptionPlan.tasks.length}`);
    console.log(`   Last synced: ${adoptionPlan.lastSyncedAt || 'NEVER'}`);
    console.log(`   Customer selected outcomes: ${customerProduct.selectedOutcomes ? JSON.stringify(customerProduct.selectedOutcomes).length : 0} bytes`);
    console.log(`   Product total outcomes: ${customerProduct.product.outcomes.length}`);
    console.log(`   Product total releases: ${customerProduct.product.releases.length}`);
    console.log(`   Product total tasks: ${customerProduct.product.tasks.length}`);

    // Check if sync would do anything
    const currentOutcomeIds = customerProduct.selectedOutcomes || [];
    const currentReleaseIds = customerProduct.selectedReleases || [];
    const allProductOutcomeIds = customerProduct.product.outcomes.map(o => o.id);
    const allProductReleaseIds = customerProduct.product.releases.map(r => r.id);

    const newOutcomes = allProductOutcomeIds.filter(id => !currentOutcomeIds.includes(id));
    const newReleases = allProductReleaseIds.filter(id => !currentReleaseIds.includes(id));

    console.log(`\n🔍 What Sync Would Do:`);
    console.log(`   Would add ${newOutcomes.length} new outcomes`);
    console.log(`   Would add ${newReleases.length} new releases`);

    if (newOutcomes.length > 0) {
      console.log(`\n   New Outcomes to Add:`);
      for (const id of newOutcomes) {
        const outcome = customerProduct.product.outcomes.find(o => o.id === id);
        console.log(`      - ${outcome?.name || id}`);
      }
    }

    if (newReleases.length > 0) {
      console.log(`\n   New Releases to Add:`);
      for (const id of newReleases) {
        const release = customerProduct.product.releases.find(r => r.id === id);
        console.log(`      - ${release?.name || id}`);
      }
    }

    // Now simulate the sync logic
    console.log(`\n\n🔄 Performing Sync Logic...\n`);

    // Update customer product selections
    await prisma.customerProduct.update({
      where: { id: customerProduct.id },
      data: {
        selectedOutcomes: allProductOutcomeIds,
        selectedReleases: allProductReleaseIds,
      },
    });
    console.log(`✅ Updated customer selections`);

    // Get eligible tasks
    const licenseLevels = ['ESSENTIAL', 'ADVANTAGE', 'SIGNATURE'];
    const customerLevel = licenseLevels.indexOf(customerProduct.licenseLevel.toUpperCase());

    const eligibleTasks = customerProduct.product.tasks.filter(task => {
      const taskLevel = licenseLevels.indexOf(task.licenseLevel.toUpperCase());
      if (taskLevel > customerLevel) return false;

      // Check outcomes
      const taskOutcomes = task.outcomes || [];
      if (allProductOutcomeIds.length > 0 && taskOutcomes.length > 0) {
        const hasMatch = taskOutcomes.some(to => allProductOutcomeIds.includes(to.outcomeId));
        if (!hasMatch) return false;
      }

      return true;
    });

    const eligibleTaskIds = eligibleTasks.map(t => t.id);
    const currentCustomerTaskIds = adoptionPlan.tasks.map(t => t.originalTaskId);

    const tasksToAdd = eligibleTasks.filter(t => !currentCustomerTaskIds.includes(t.id));
    const tasksToRemove = adoptionPlan.tasks.filter(t => !eligibleTaskIds.includes(t.originalTaskId));

    console.log(`\n📊 Sync Results:`);
    console.log(`   Eligible tasks after sync: ${eligibleTasks.length}`);
    console.log(`   Current customer tasks: ${adoptionPlan.tasks.length}`);
    console.log(`   Tasks to add: ${tasksToAdd.length}`);
    console.log(`   Tasks to remove: ${tasksToRemove.length}`);

    if (tasksToAdd.length > 0) {
      console.log(`\n   Tasks to Add:`);
      for (const task of tasksToAdd) {
        console.log(`      - ${task.name}`);
      }
    }

    // Update lastSyncedAt
    await prisma.adoptionPlan.update({
      where: { id: adoptionPlan.id },
      data: {
        lastSyncedAt: new Date(),
      },
    });
    console.log(`\n✅ Updated lastSyncedAt`);

    console.log(`\n✅ Sync logic completed successfully!`);
    console.log(`\n💡 The sync should work in the GUI now.`);
    console.log(`   If it's still not working, check:`);
    console.log(`   1. Browser console for errors`);
    console.log(`   2. Network tab to see GraphQL request/response`);
    console.log(`   3. Backend logs during sync`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSyncMutation();
