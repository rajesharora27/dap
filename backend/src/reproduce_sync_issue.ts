
import { prisma } from './shared/graphql/context';
import { CustomerAdoptionMutationResolvers } from './schema/resolvers/customerAdoption';

async function reproduce() {
    console.log('🚀 Starting reproduction script...');

    // 1. Create a Product with a Task and Telemetry
    const product = await prisma.product.create({
        data: {
            name: 'Test Product ' + Date.now(),
            description: 'Test Description',
        },
    });

    const task = await prisma.task.create({
        data: {
            productId: product.id,
            name: 'Test Task',
            description: 'Test Task Description',
            licenseLevel: 'ESSENTIAL',
            sequenceNumber: 1,
            estMinutes: 30,
        },
    });

    const telemetry = await prisma.telemetryAttribute.create({
        data: {
            taskId: task.id,
            name: 'Test Telemetry',
            dataType: 'STRING',
            isRequired: true,
            isActive: true,
            order: 1,
            successCriteria: {},
        },
    });

    console.log(`✅ Created Product: ${product.id}, Task: ${task.id}, Telemetry: ${telemetry.id}`);

    // 2. Create a Customer and Assign Product
    const customer = await prisma.customer.create({
        data: {
            name: 'Test Customer ' + Date.now(),
        },
    });

    // Mock context
    const ctx = { user: { id: 'admin', role: 'ADMIN' } };

    const customerProduct = await CustomerAdoptionMutationResolvers.assignProductToCustomer(
        {},
        {
            input: {
                customerId: customer.id,
                productId: product.id,
                name: product.name,
                licenseLevel: 'ESSENTIAL',
            },
        },
        ctx
    );

    // Create Adoption Plan
    const adoptionPlan = await CustomerAdoptionMutationResolvers.createAdoptionPlan(
        {},
        { customerProductId: customerProduct.id },
        ctx
    );

    console.log(`✅ Created Adoption Plan: ${adoptionPlan.id}`);

    // Verify Telemetry exists in Adoption Plan
    const customerTaskBefore = await prisma.customerTask.findFirst({
        where: { adoptionPlanId: adoptionPlan.id },
        include: { telemetryAttributes: true },
    });

    if (customerTaskBefore?.telemetryAttributes.length !== 1) {
        console.error('❌ Telemetry not found in adoption plan initially!');
        return;
    }
    console.log('✅ Telemetry found in adoption plan initially.');

    // 3. Remove Telemetry from Product Task
    // Note: In the real app, this might be a soft delete or hard delete. 
    // The resolver checks for `productTask.telemetryAttributes` which implies it fetches current attributes.
    // So deleting the attribute should work.
    await prisma.telemetryAttribute.delete({
        where: { id: telemetry.id },
    });
    console.log('✅ Deleted Telemetry from Product Task.');

    // 4. Sync Adoption Plan
    console.log('🔄 Syncing Adoption Plan...');
    await CustomerAdoptionMutationResolvers.syncAdoptionPlan(
        {},
        { adoptionPlanId: adoptionPlan.id },
        ctx
    );

    // 5. Verify Telemetry is removed from Adoption Plan
    const customerTaskAfter = await prisma.customerTask.findFirst({
        where: { adoptionPlanId: adoptionPlan.id },
        include: { telemetryAttributes: true },
    });

    if (customerTaskAfter?.telemetryAttributes.length === 0) {
        console.log('✅ SUCCESS: Telemetry removed from adoption plan after sync.');
        // =================================================================
        // STEP 6: Verify Product Name Sync
        // =================================================================
        console.log('STEP 6: Verifying Product Name Sync...');

        // 1. Change Product Name
        const newProductName = `Updated Product Name ${Date.now()}`;
        await prisma.product.update({
            where: { id: product.id },
            data: { name: newProductName }
        });
        console.log(`Updated Product Name to: ${newProductName}`);

        // 2. Sync Adoption Plan
        console.log('Syncing Adoption Plan again...');
        await CustomerAdoptionMutationResolvers.syncAdoptionPlan({}, { adoptionPlanId: adoptionPlan.id }, ctx);

        // 3. Check AdoptionPlan.productName
        const updatedPlan = await prisma.adoptionPlan.findUnique({
            where: { id: adoptionPlan.id }
        });

        if (updatedPlan?.productName === newProductName) {
            console.log('✅ SUCCESS: AdoptionPlan.productName updated after sync.');
        } else {
            console.error(`❌ FAILURE: AdoptionPlan.productName did not update. Expected "${newProductName}", got "${updatedPlan?.productName}"`);
            // Exit the script if this check fails
            process.exit(1);
        }

        console.log('✅ All checks passed!');
    } else {
        console.error('❌ FAILURE: Telemetry still exists in adoption plan after sync!');
        console.log('Remaining attributes:', customerTaskAfter?.telemetryAttributes);
    }

    // Cleanup
    await prisma.customerTelemetryAttribute.deleteMany({ where: { customerTaskId: customerTaskAfter?.id } });
    await prisma.customerTask.deleteMany({ where: { adoptionPlanId: adoptionPlan.id } });
    await prisma.adoptionPlan.delete({ where: { id: adoptionPlan.id } });
    await prisma.customerProduct.delete({ where: { id: customerProduct.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    await prisma.task.delete({ where: { id: task.id } });
    await prisma.product.delete({ where: { id: product.id } });
}

reproduce()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
