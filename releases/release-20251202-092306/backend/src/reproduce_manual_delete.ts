
import { PrismaClient } from '@prisma/client';
import { resolvers } from './schema/resolvers';
import { TelemetryMutationResolvers } from './schema/resolvers/telemetry';

const prisma = new PrismaClient();

// Mock context
const context = {
    user: {
        id: 'test-user-id',
        role: 'ADMIN',
        email: 'test@example.com',
    },
    prisma,
};

async function main() {
    console.log('🚀 Starting Manual Delete Reproduction Script...');

    // 1. Create a Product
    const product = await prisma.product.create({
        data: {
            name: `Test Product ${Date.now()}`,
            description: 'Test Description',
        },
    });

    // 2. Create a Task with 1 Telemetry Attribute
    const task = await prisma.task.create({
        data: {
            productId: product.id,
            name: 'Test Task',
            estMinutes: 30,
            sequenceNumber: 1,
            telemetryAttributes: {
                create: [
                    {
                        name: 'Attr1',
                        dataType: 'STRING',
                        isRequired: false,
                        order: 0,
                        successCriteria: {},
                    }
                ]
            }
        },
        include: {
            telemetryAttributes: true
        }
    });
    console.log(`✅ Created Task: ${task.id} with ${task.telemetryAttributes.length} attributes`);
    const attrId = task.telemetryAttributes[0].id;

    // 3. Update Task (simulate App.tsx UPDATE_TASK which omits telemetryAttributes)
    console.log('🔄 Updating Task (telemetryAttributes undefined)...');

    const updateInputUndefined = {
        name: 'Test Task Updated',
        // telemetryAttributes is missing
    };

    const Mutation = resolvers.Mutation;
    // @ts-ignore
    await Mutation.updateTask({}, { id: task.id, input: updateInputUndefined }, context);

    let updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
        include: { telemetryAttributes: true }
    });

    console.log(`✅ After UpdateTask, attributes count: ${updatedTask?.telemetryAttributes.length}`);
    if (updatedTask?.telemetryAttributes.length !== 1) {
        console.error('❌ FAILURE: UpdateTask unexpectedly modified attributes.');
        process.exit(1);
    }

    // 4. Manually Delete Attribute (simulate App.tsx manual deletion)
    console.log(`🔄 Manually deleting attribute ${attrId}...`);

    // @ts-ignore
    await TelemetryMutationResolvers.deleteTelemetryAttribute({}, { id: attrId }, context);

    updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
        include: { telemetryAttributes: true }
    });

    console.log(`✅ After Manual Delete, attributes count: ${updatedTask?.telemetryAttributes.length}`);
    if (updatedTask?.telemetryAttributes.length === 0) {
        console.log('✅ SUCCESS: Manual delete worked.');
    } else {
        console.error('❌ FAILURE: Manual delete failed.');
        process.exit(1);
    }

    // Cleanup
    await prisma.product.delete({ where: { id: product.id } });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
