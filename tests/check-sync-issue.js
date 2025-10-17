const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSyncIssue() {
  try {
    // Find ACME customer
    const customer = await prisma.customer.findFirst({
      where: { name: { contains: 'ACME', mode: 'insensitive' } },
      include: {
        products: {
          include: {
            product: {
              include: {
                tasks: {
                  where: { deletedAt: null },
                  include: {
                    outcomes: { include: { outcome: true } },
                    releases: { include: { release: true } },
                  },
                  orderBy: { sequenceNumber: 'asc' },
                },
              },
            },
            selectedOutcomes: true,
            selectedReleases: true,
          },
          where: {
            product: {
              name: { contains: 'Network', mode: 'insensitive' },
            },
          },
        },
      },
    });

    if (!customer) {
      console.log('❌ ACME customer not found');
      return;
    }

    console.log(`\n✅ Found customer: ${customer.name}`);

    const networkProduct = customer.products[0];
    if (!networkProduct) {
      console.log('❌ Network Management product not assigned to ACME');
      return;
    }

    console.log(`\n📦 Product: ${networkProduct.product.name}`);
    console.log(`   License Level: ${networkProduct.licenseLevel}`);
    console.log(`   Selected Outcomes: ${networkProduct.selectedOutcomes.length > 0 ? networkProduct.selectedOutcomes.map(o => o.name).join(', ') : 'NONE'}`);
    console.log(`   Selected Releases: ${networkProduct.selectedReleases.length > 0 ? networkProduct.selectedReleases.map(r => r.name).join(', ') : 'NONE'}`);

    const selectedOutcomeIds = networkProduct.selectedOutcomes.map(o => o.id);
    const selectedReleaseIds = networkProduct.selectedReleases.map(r => r.id);

    console.log(`\n📋 Product Tasks (${networkProduct.product.tasks.length} total):`);
    
    for (const task of networkProduct.product.tasks) {
      const taskOutcomeIds = task.outcomes?.map(o => o.outcomeId) || [];
      const taskReleaseIds = task.releases?.map(r => r.releaseId) || [];
      
      // Check eligibility
      let eligible = true;
      let reason = '';

      // Check license
      const licenseLevels = ['ESSENTIAL', 'ADVANTAGE', 'SIGNATURE'];
      const customerLevel = licenseLevels.indexOf(networkProduct.licenseLevel.toUpperCase());
      const taskLevel = licenseLevels.indexOf(task.licenseLevel.toUpperCase());
      
      if (taskLevel > customerLevel) {
        eligible = false;
        reason = `License mismatch (needs ${task.licenseLevel}, customer has ${networkProduct.licenseLevel})`;
      }

      // Check outcomes
      if (eligible && selectedOutcomeIds.length > 0) {
        const hasMatchingOutcome = taskOutcomeIds.some(oid => selectedOutcomeIds.includes(oid));
        if (!hasMatchingOutcome) {
          eligible = false;
          reason = `Outcome mismatch (task outcomes: ${task.outcomes.map(o => o.outcome.name).join(', ')}, customer selected: ${networkProduct.selectedOutcomes.map(o => o.name).join(', ')})`;
        }
      }

      // Check releases
      if (eligible && selectedReleaseIds.length > 0) {
        const hasMatchingRelease = taskReleaseIds.some(rid => selectedReleaseIds.includes(rid));
        if (!hasMatchingRelease) {
          eligible = false;
          reason = `Release mismatch (task releases: ${task.releases.map(r => r.release.name).join(', ')}, customer selected: ${networkProduct.selectedReleases.map(r => r.name).join(', ')})`;
        }
      }

      const outcomeNames = task.outcomes.map(o => o.outcome.name).join(', ') || 'NONE';
      const releaseNames = task.releases.map(r => r.release.name).join(', ') || 'NONE';

      console.log(`\n   ${eligible ? '✅' : '❌'} ${task.name}`);
      console.log(`      License: ${task.licenseLevel}`);
      console.log(`      Outcomes: ${outcomeNames}`);
      console.log(`      Releases: ${releaseNames}`);
      if (!eligible) {
        console.log(`      ⚠️  Reason: ${reason}`);
      }
    }

    // Check adoption plan
    const adoptionPlan = await prisma.adoptionPlan.findFirst({
      where: { customerProductId: networkProduct.id },
      include: {
        tasks: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    if (adoptionPlan) {
      console.log(`\n\n📊 Current Adoption Plan (${adoptionPlan.tasks.length} tasks):`);
      console.log(`   Last Synced: ${adoptionPlan.lastSyncedAt || 'NEVER'}`);
      
      for (const task of adoptionPlan.tasks) {
        console.log(`   - ${task.name}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSyncIssue();
