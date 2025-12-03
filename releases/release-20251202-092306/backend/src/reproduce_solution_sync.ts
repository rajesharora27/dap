
import { prisma } from './context';
import { SolutionAdoptionMutationResolvers } from './schema/resolvers/solutionAdoption';

async function reproduce() {
    console.log('🚀 Starting Solution Sync reproduction script...');

    // 1. Create a Solution with a Task and Telemetry
    const solution = await prisma.solution.create({
        data: {
            name: 'Test Solution ' + Date.now(),
            description: 'Test Solution Description',
        },
    });

    const task = await prisma.task.create({
        data: {
            solutionId: solution.id,
            name: 'Test Solution Task',
            description: 'Test Solution Task Description',
            licenseLevel: 'ESSENTIAL',
            sequenceNumber: 1,
            estMinutes: 30,
        },
    });

    const telemetry = await prisma.telemetryAttribute.create({
        data: {
            taskId: task.id,
            name: 'Test Solution Telemetry',
            dataType: 'STRING',
            isRequired: true,
            isActive: true,
            order: 1,
            successCriteria: {},
        },
    });

    console.log(`✅ Created Solution: ${solution.id}, Task: ${task.id}, Telemetry: ${telemetry.id}`);

    // 2. Create a Customer and Assign Solution
    const customer = await prisma.customer.create({
        data: {
            name: 'Test Customer ' + Date.now(),
        },
    });

    // Mock context
    const ctx = { user: { id: 'admin', role: 'ADMIN' } };

    const customerSolution = await SolutionAdoptionMutationResolvers.assignSolutionToCustomer(
        {},
        {
            input: {
                customerId: customer.id,
                solutionId: solution.id,
                name: solution.name,
                licenseLevel: 'ESSENTIAL',
            },
        },
        ctx
    );

    // Create Adoption Plan
    const adoptionPlan = await SolutionAdoptionMutationResolvers.createSolutionAdoptionPlan(
        {},
        { customerSolutionId: customerSolution.id },
        ctx
    );

    console.log(`✅ Created Solution Adoption Plan: ${adoptionPlan.id}`);

    // Verify Telemetry exists in Adoption Plan
    const customerTaskBefore = await prisma.customerSolutionTask.findFirst({
        where: { solutionAdoptionPlanId: adoptionPlan.id },
        include: { telemetryAttributes: true },
    });

    if (customerTaskBefore?.telemetryAttributes.length !== 1) {
        console.error('❌ Telemetry not found in solution adoption plan initially!');
        return;
    }
    console.log('✅ Telemetry found in solution adoption plan initially.');

    // 3. Remove Telemetry from Solution Task
    await prisma.telemetryAttribute.delete({
        where: { id: telemetry.id },
    });
    console.log('✅ Deleted Telemetry from Solution Task.');

    // 4. Sync Solution Adoption Plan
    console.log('🔄 Syncing Solution Adoption Plan...');
    await SolutionAdoptionMutationResolvers.syncSolutionAdoptionPlan(
        {},
        { solutionAdoptionPlanId: adoptionPlan.id },
        ctx
    );

    // 5. Verify Telemetry is removed from Adoption Plan
    const customerTaskAfter = await prisma.customerSolutionTask.findFirst({
        where: { solutionAdoptionPlanId: adoptionPlan.id },
        include: { telemetryAttributes: true },
    });

    if (customerTaskAfter?.telemetryAttributes.length === 0) {
        console.log('✅ SUCCESS: Telemetry removed from solution adoption plan after sync.');

        // =================================================================
        // STEP 6: Verify Solution Name Sync
        // =================================================================
        console.log('STEP 6: Verifying Solution Name Sync...');

        // 1. Change Solution Name
        const newSolutionName = `Updated Solution Name ${Date.now()}`;
        await prisma.solution.update({
            where: { id: solution.id },
            data: { name: newSolutionName }
        });
        console.log(`Updated Solution Name to: ${newSolutionName}`);

        // 2. Sync Solution Adoption Plan
        console.log('Syncing Solution Adoption Plan again...');
        await SolutionAdoptionMutationResolvers.syncSolutionAdoptionPlan({}, { solutionAdoptionPlanId: adoptionPlan.id }, ctx);

        // 3. Check SolutionAdoptionPlan.solutionName
        const updatedPlan = await prisma.solutionAdoptionPlan.findUnique({
            where: { id: adoptionPlan.id }
        });

        if (updatedPlan?.solutionName === newSolutionName) {
            console.log('✅ SUCCESS: SolutionAdoptionPlan.solutionName updated after sync.');
        } else {
            console.error(`❌ FAILURE: SolutionAdoptionPlan.solutionName did not update. Expected "${newSolutionName}", got "${updatedPlan?.solutionName}"`);
            // Exit the script if this critical check fails
            process.exit(1);
        }

        console.log('✅ All checks passed!');

    } else {
        console.error('❌ FAILURE: Telemetry still exists in solution adoption plan after sync!');
        console.log('Remaining attributes:', customerTaskAfter?.telemetryAttributes);
        // Exit the script if this critical check fails
        process.exit(1);
    }

    // Cleanup
    await prisma.customerTelemetryAttribute.deleteMany({ where: { customerSolutionTaskId: customerTaskAfter?.id } });
    await prisma.customerSolutionTask.deleteMany({ where: { solutionAdoptionPlanId: adoptionPlan.id } });
    await prisma.solutionAdoptionPlan.delete({ where: { id: adoptionPlan.id } });
    await prisma.customerSolution.delete({ where: { id: customerSolution.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    await prisma.task.delete({ where: { id: task.id } });
    await prisma.solution.delete({ where: { id: solution.id } });
}

reproduce()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
