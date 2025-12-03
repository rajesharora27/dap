
import { PrismaClient } from '@prisma/client';
import { CustomerTelemetryImportService } from './services/telemetry/CustomerTelemetryImportService';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

async function verifySolutionImportStatus() {
    console.log('Starting SOLUTION import status verification...');

    try {
        // 1. Setup: Find a SOLUTION task and set it to DONE via TELEMETRY
        // We specifically want one with boolean criteria if possible, or just any active one
        const task = await prisma.customerSolutionTask.findFirst({
            where: {
                telemetryAttributes: { some: { isActive: true } }
            },
            include: { telemetryAttributes: true }
        });

        if (!task) {
            console.error('No suitable solution task found for verification');
            return;
        }

        console.log(`Using SOLUTION task: ${task.name} (${task.id})`);

        // Force status to DONE via TELEMETRY
        await prisma.customerSolutionTask.update({
            where: { id: task.id },
            data: {
                status: 'DONE',
                statusUpdateSource: 'TELEMETRY',
                statusUpdatedAt: new Date()
            }
        });
        console.log('Set task status to DONE (via TELEMETRY)');

        // 2. Create Excel file with failing value
        const attribute = task.telemetryAttributes[0];
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Telemetry_Data');

        sheet.addRow(['Task Name', 'Attribute Name', 'Data Type', 'Current Value', 'Date']);

        // Determine failing value
        let failingValue = 'false';
        if (attribute.dataType === 'NUMBER') {
            failingValue = '-1';
        }
        // If it's a boolean flag, 'false' should fail if expected is true

        sheet.addRow([task.name, attribute.name, attribute.dataType, failingValue, new Date()]);

        const buffer = await workbook.xlsx.writeBuffer();

        // 3. Import Telemetry
        console.log('Importing failing telemetry for SOLUTION...');
        const result = await CustomerTelemetryImportService.importSolutionTelemetryValues(task.solutionAdoptionPlanId, buffer as any);
        console.log('Import Result:', JSON.stringify(result, null, 2));

        // 4. Verify New Status
        const updatedTask = await prisma.customerSolutionTask.findUnique({
            where: { id: task.id }
        });

        console.log(`Updated Task Status: ${updatedTask?.status}`);
        console.log(`Update Source: ${updatedTask?.statusUpdateSource}`);

        if (updatedTask?.status === 'NO_LONGER_USING') {
            console.log('SUCCESS: Task transitioned to NO_LONGER_USING automatically');
        } else {
            console.log('FAILURE: Task did not transition to NO_LONGER_USING');

            // Debug: why?
            console.log('Debug Info:');
            console.log('Was previously DONE by telemetry?',
                (task.status === 'DONE' && task.statusUpdateSource === 'TELEMETRY'));
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifySolutionImportStatus();
