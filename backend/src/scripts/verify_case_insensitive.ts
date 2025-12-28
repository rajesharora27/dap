
import { PrismaClient } from '@prisma/client';
import { evaluateTaskStatusFromTelemetry } from '../modules/telemetry/evaluation-engine';

const prisma = new PrismaClient();

async function verifyCaseInsensitive() {
    console.log('Starting case-insensitive verification...');

    // Mock task with lowercase 'telemetry' source
    const task = {
        status: 'DONE',
        statusUpdateSource: 'telemetry' // Lowercase!
    };

    const attributes = [
        {
            id: 'attr1',
            name: 'boolean_flag',
            isActive: true,
            isRequired: true,
            successCriteria: { type: 'boolean_flag', expectedValue: true },
            values: [
                { value: 'false', createdAt: new Date() } // Failing value
            ]
        }
    ];

    const result = await evaluateTaskStatusFromTelemetry(task, attributes);
    console.log('Result:', result);

    if (result.newStatus === 'NO_LONGER_USING') {
        console.log('SUCCESS: Transitioned to NO_LONGER_USING with lowercase source');
    } else {
        console.log('FAILURE: Did not transition to NO_LONGER_USING');
    }
}

verifyCaseInsensitive()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
