
import { PrismaClient } from '@prisma/client';
import { resolvers } from './schema/resolvers';

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
    console.log('🚀 Starting UpdateTask Empty Array Reproduction Script...');

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

    // 3. Update Task with telemetryAttributes: [] (empty array)
    console.log('🔄 Updating Task (telemetryAttributes: [])...');

    const updateInputEmpty = {
        name: 'Test Task Updated',
        telemetryAttributes: [] // Explicit empty array
    };

    const Mutation = resolvers.Mutation;
    // @ts-ignore
    await Mutation.updateTask({}, { id: task.id, input: updateInputEmpty }, context);

    const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
        include: { telemetryAttributes: true }
    });

    console.log(`✅ After UpdateTask, attributes count: ${updatedTask?.telemetryAttributes.length}`);
    if (updatedTask?.telemetryAttributes.length === 0) {
        console.log('✅ SUCCESS: Empty array correctly deleted attributes.');
    } else {
        console.error('❌ FAILURE: Empty array did NOT delete attributes.');
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
