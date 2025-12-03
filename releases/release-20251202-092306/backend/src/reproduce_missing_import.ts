
import { PrismaClient, LicenseLevel } from '@prisma/client';
import { CustomerTelemetryImportService } from './services/telemetry/CustomerTelemetryImportService';
import { evaluateTaskStatusFromTelemetry } from './services/telemetry/evaluationEngine';
import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

async function reproduce() {
    console.log('--- Reproduction: Missing Telemetry in Import ---');

    // 1. Setup: Create a customer, product, and task
    const customer = await prisma.customer.create({
        data: { name: 'Repro Customer ' + Date.now() }
    });

    const product = await prisma.product.create({
        data: { name: 'Repro Product ' + Date.now() }
    });

    const customerProduct = await prisma.customerProduct.create({
        data: {
            customerId: customer.id,
            productId: product.id,
            name: 'Repro Customer Product',
            licenseLevel: LicenseLevel.ADVANTAGE
        }
    });

    // Create adoption plan
    const adoptionPlan = await prisma.adoptionPlan.create({
        data: {
            customerProductId: customerProduct.id,
            productId: product.id,
            productName: product.name,
            licenseLevel: LicenseLevel.ADVANTAGE,
            totalTasks: 1,
            completedTasks: 0
        }
    });

    // Create a task with telemetry attribute
    const task = await prisma.customerTask.create({
        data: {
            name: 'Task 49 Repro',
            adoptionPlanId: adoptionPlan.id,
            status: 'NOT_STARTED',
            sequenceNumber: 49,
            originalTaskId: 'orig-task-49',
            estMinutes: 60,
            weight: 10,
            licenseLevel: LicenseLevel.ADVANTAGE,
            telemetryAttributes: {
                create: {
                    name: 'telemetry_attr',
                    dataType: 'BOOLEAN',
                    successCriteria: JSON.stringify({
                        type: 'boolean_flag',
                        operator: 'equals',
                        expectedValue: true
                    }),
                    isActive: true,
                    isRequired: true
                }
            }
        },
        include: { telemetryAttributes: true }
    });

    console.log(`Created Task: ${task.name} (ID: ${task.id})`);

    // 2. Create Excel file for Batch A (Success)
    const workbookA = new ExcelJS.Workbook();
    const sheetA = workbookA.addWorksheet('Telemetry_Data');
    sheetA.addRow(['Task Name', 'Attribute Name', 'Data Type', 'Current Value', 'Date']);
    sheetA.addRow([task.name, 'telemetry_attr', 'BOOLEAN', 'true', new Date().toISOString()]);

    const bufferA = await workbookA.xlsx.writeBuffer();

    // 3. Import Batch A
    console.log('Importing Batch A (Should set to DONE)...');
    await CustomerTelemetryImportService.importTelemetryValues(adoptionPlan.id, bufferA as any);

    // Verify status
    const taskAfterA = await prisma.customerTask.findUnique({ where: { id: task.id } });
    console.log(`Status after Batch A: ${taskAfterA?.status}`);

    if (taskAfterA?.status !== 'DONE') {
        console.error('FAILED: Task should be DONE after Batch A');
        return;
    }

    // 4. Create Excel file for Batch B (Missing Data)
    // This file is empty or contains data for OTHER tasks, but NOT for Task 49
    const workbookB = new ExcelJS.Workbook();
    const sheetB = workbookB.addWorksheet('Telemetry_Data');
    sheetB.addRow(['Task Name', 'Attribute Name', 'Data Type', 'Current Value', 'Date']);
    // No rows for Task 49

    const bufferB = await workbookB.xlsx.writeBuffer();

    // 5. Import Batch B
    console.log('Importing Batch B (Should set to NO_LONGER_USING)...');
    await CustomerTelemetryImportService.importTelemetryValues(adoptionPlan.id, bufferB as any);

    // 6. Verify status
    const taskAfterB = await prisma.customerTask.findUnique({
        where: { id: task.id },
        include: { telemetryAttributes: { include: { values: true } } }
    });
    console.log(`Status after Batch B: ${taskAfterB?.status}`);

    if (taskAfterB?.status === 'NO_LONGER_USING') {
        console.log('SUCCESS: Task transitioned to NO_LONGER_USING');
    } else {
        console.log('FAILURE: Task did NOT transition to NO_LONGER_USING');
        console.log('Reason: Import service likely did not re-evaluate the task because it was not in the file.');
    }

    // Cleanup
    if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
        await prisma.customerTelemetryValue.deleteMany({ where: { customerAttributeId: task.telemetryAttributes[0].id } });
    }
    await prisma.customerTelemetryAttribute.deleteMany({ where: { customerTaskId: task.id } });
    await prisma.customerTask.delete({ where: { id: task.id } });
    await prisma.adoptionPlan.delete({ where: { id: adoptionPlan.id } });
    await prisma.customerProduct.delete({ where: { id: customerProduct.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
}

reproduce().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
