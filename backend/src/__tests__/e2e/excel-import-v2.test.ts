
import { PrismaClient, LicenseLevel, TelemetryDataType } from '@prisma/client';
import { ExcelExportServiceV2 } from '../../services/excel-v2/export/ExportService';
import { ImportService } from '../../services/excel-v2/ImportService';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import ExcelJS from 'exceljs';

/**
 * Excel Import V2 Comprehensive E2E Test
 * 
 * Verifies the full two-phase import workflow:
 * 1. Dry run validation (detecting creates, updates, deletes)
 * 2. Commit execution (atomic transaction)
 * 3. Tag pruning (deleting tags missing from file)
 * 4. Statistics accuracy
 */

const DEFAULT_TEST_DB = 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public';
const dbUrl = process.env.DATABASE_URL || DEFAULT_TEST_DB;

if (!dbUrl.includes('dap_test')) {
    throw new Error(`❌ Refusing to run tests on non-test database: ${dbUrl}`);
}

const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
});

describe('Excel Import V2 Comprehensive', () => {
    let exportService: ExcelExportServiceV2;
    let productId: string;

    beforeAll(async () => {
        exportService = new ExcelExportServiceV2();

        // Setup base product with data to modify/delete
        const product = await prisma.product.create({
            data: {
                name: `Import V2 Test Product ${Date.now()}`,
                description: 'Initial state',
            }
        });
        productId = product.id;

        // Add 2 tasks
        await prisma.task.create({
            data: { name: 'Task 1', estMinutes: 10, weight: 5, sequenceNumber: 1, productId }
        });
        await prisma.task.create({
            data: { name: 'Task 2', estMinutes: 20, weight: 10, sequenceNumber: 2, productId }
        });

        // Add 2 tags
        await prisma.productTag.create({
            data: { productId, name: 'Tag 1', color: 'red' }
        });
        await prisma.productTag.create({
            data: { productId, name: 'Tag 2', color: 'blue' }
        });

        // Add 1 outcome
        await prisma.outcome.create({
            data: { productId, name: 'Outcome 1' }
        });
    });

    afterAll(async () => {
        // Cleanup all related data
        if (productId) {
            await prisma.taskTag.deleteMany({ where: { task: { productId } } });
            await prisma.task.deleteMany({ where: { productId } });
            await prisma.productTag.deleteMany({ where: { productId } });
            await prisma.outcome.deleteMany({ where: { productId } });
            await prisma.product.delete({ where: { id: productId } });
        }
        await prisma.$disconnect();
    });

    // Helper to modify Excel buffer in-memory
    async function modifyExcelBuffer(buffer: Buffer, modifications: (workbook: ExcelJS.Workbook) => void): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        modifications(workbook);
        return Buffer.from(await workbook.xlsx.writeBuffer()) as any;
    }

    it('should correctly handle a combination of creates, updates, and deletes', async () => {
        // 1. Export current state
        const exportResult = await exportService.exportProduct(productId);

        // 2. Modify workbook to represent common user flow:
        // - Update Task 1 name
        // - Delete Task 2 (by removing its row)
        // - Create New Task 3
        // - Update Tag 1 color
        // - Delete Tag 2 (by removing its row)
        // - Outcome 1 remains unchanged (should be skip)
        const modifiedBuffer = await modifyExcelBuffer(exportResult.buffer, (workbook) => {
            // Modify Tasks
            const taskSheet = workbook.getWorksheet('Tasks');
            if (taskSheet) {
                // Header is row 1. Data starts at row 2.
                // Row 2: Task 1
                taskSheet.getCell('B2').value = 'Task 1 Updated';

                // Row 3: Task 2. Clear values instead of actual row deletion 
                // (simulating user clearing or removing row content while keeping structure)
                // Parser skips empty rows, but validator tracks missing IDs for existing records.
                taskSheet.spliceRows(3, 1);

                // Add Task 3
                taskSheet.addRow([
                    null, // ID (new)
                    'Task 3 New',
                    'New task description',
                    15, // weight
                    3, // sequence
                    10, // est minutes
                    'Essential' // license
                ]);
            }

            // Modify Tags
            const tagSheet = workbook.getWorksheet('Tags');
            if (tagSheet) {
                // Row 2: Tag 1
                tagSheet.getCell('C2').value = '#00FF00'; // Column C is Color

                // Delete Tag 2 (Row 3)
                tagSheet.spliceRows(3, 1);
            }
        });

        // 3. Dry Run validation
        const dryRun = await ImportService.dryRun(prisma, modifiedBuffer as any, { entityType: 'product' });

        expect(dryRun.isValid).toBe(true);
        expect(dryRun.summary.toCreate).toBe(1); // Task 3
        expect(dryRun.summary.toUpdate).toBe(2); // Task 1, Tag 1
        expect(dryRun.summary.toDelete).toBe(2); // Task 2, Tag 2
        expect(dryRun.summary.toSkip).toBe(1);   // Outcome 1 (Product Info itself is NOT in records summary)

        // Verify task actions
        const tasks = dryRun.records.tasks;
        expect(tasks.find(r => r.data.name === 'Task 1 Updated')?.action).toBe('update');
        expect(tasks.find(r => r.data.name === 'Task 3 New')?.action).toBe('create');
        expect(dryRun.records.tasks.find(r => r.action === 'delete')).toBeDefined();

        // 4. Commit results
        const commit = await ImportService.commitImport(prisma, { sessionId: dryRun.sessionId });

        expect(commit.success).toBe(true);
        expect(commit.stats).toBeDefined();

        // Check final stats from executor
        expect(commit.stats?.tasksCreated).toBe(1);
        expect(commit.stats?.tasksUpdated).toBe(1);
        expect(commit.stats?.tasksDeleted).toBe(1);
        expect(commit.stats?.tagsUpdated).toBe(1);
        expect(commit.stats?.tagsDeleted).toBe(1);

        // 5. Final database verification
        const dbTasks = await prisma.task.findMany({ where: { productId }, orderBy: { sequenceNumber: 'asc' } });
        expect(dbTasks).toHaveLength(2); // Task 1 Updated, Task 3 New. Task 2 Deleted.
        expect(dbTasks[0].name).toBe('Task 1 Updated');
        expect(dbTasks[1].name).toBe('Task 3 New');

        const dbTags = await prisma.productTag.findMany({ where: { productId } });
        expect(dbTags).toHaveLength(1); // Tag 1 Updated. Tag 2 Deleted.
        expect(dbTags[0].color).toBe('#00FF00');
        expect(dbTags[0].name).toBe('Tag 1');
    });
});
