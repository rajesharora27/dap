
import { PrismaClient, LicenseLevel, TelemetryDataType } from '@prisma/client';
import { ExcelExportServiceV2 } from '../../services/excel-v2/export/ExportService';
import { ImportService } from '../../services/excel-v2/ImportService';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import ExcelJS from 'exceljs';

/**
 * Excel Export V2 E2E Test
 * 
 * Verifies that the ExcelExportServiceV2 correctly:
 * 1. Fetches product/solution data
 * 2. Generates an Excel file (buffer)
 * 3. Includes all related entities (Tasks, Outcomes, Releases, Licenses, Tags, Telemetry)
 * 4. Returns correct metadata and stats
 */

const DEFAULT_TEST_DB = 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public';
const dbUrl = process.env.DATABASE_URL || DEFAULT_TEST_DB;

if (!dbUrl.includes('dap_test')) {
    throw new Error(`❌ Refusing to run tests on non-test database: ${dbUrl}`);
}

const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
});

describe('Excel Export V2', () => {
    let service: ExcelExportServiceV2;
    let productId: string;
    let solutionId: string;

    beforeAll(async () => {
        service = new ExcelExportServiceV2();

        // 1. Setup Product with rich data
        const product = await prisma.product.create({
            data: {
                name: `Export V2 Test Product ${Date.now()}`,
                description: 'Rich product for export verification',
                customAttrs: { vendor: 'Acme', version: '2.0', certified: true }
            }
        });
        productId = product.id;

        // Add V2 Custom Attribute (Table-based)
        await prisma.customAttribute.create({
            data: {
                productId,
                attributeName: 'V2 Attribute',
                attributeValue: 'V2 Value',
                dataType: 'TEXT',
                displayOrder: 1
            }
        });

        // Add Outcome
        await prisma.outcome.create({
            data: { name: 'V2 Outcome', description: 'Outcome Desc', productId }
        });

        // Add Release
        const release = await prisma.release.create({
            data: { name: 'V2 Release', level: 2.0, productId }
        });

        // Add License
        await prisma.license.create({
            data: { name: 'V2 License', level: 2, productId }
        });

        // Add Tag
        const tag = await prisma.productTag.create({
            data: { productId, name: 'V2 Tag', color: '#0000FF' }
        });

        // Add Task with Telemetry and links
        const task = await prisma.task.create({
            data: {
                name: 'V2 Task',
                description: 'Task Desc',
                estMinutes: 45,
                weight: 15,
                sequenceNumber: 1,
                licenseLevel: LicenseLevel.ADVANTAGE,
                productId,
                howToDoc: ['http://doc.com'],
                howToVideo: ['http://video.com']
            }
        });

        // Add Telemetry Attribute
        await prisma.telemetryAttribute.create({
            data: {
                taskId: task.id,
                name: 'V2 Telemetry',
                dataType: TelemetryDataType.NUMBER,
                isRequired: true,
                successCriteria: { operator: 'gt', value: 50 },
                isActive: true
            }
        });

        // Link Tag to Task
        await prisma.taskTag.create({
            data: { taskId: task.id, tagId: tag.id }
        });

        // Link Release to Task
        await prisma.taskRelease.create({
            data: { taskId: task.id, releaseId: release.id }
        });

        // 2. Setup Solution linked to Product
        const solution = await prisma.solution.create({
            data: {
                name: `Export V2 Test Solution ${Date.now()}`,
                description: 'Solution with linked product'
            }
        });
        solutionId = solution.id;

        // Link Product to Solution
        await prisma.solutionProduct.create({
            data: { solutionId, productId }
        });

        // Add Solution-specific Task
        await prisma.task.create({
            data: {
                name: 'Solution Task',
                solutionId, // Linked to solution
                estMinutes: 60,
                weight: 20,
                sequenceNumber: 1
            }
        });
    });

    afterAll(async () => {
        // Cleanup
        if (productId) {
            // Delete related task data first
            const tasks = await prisma.task.findMany({ where: { productId } });
            for (const t of tasks) {
                await prisma.telemetryAttribute.deleteMany({ where: { taskId: t.id } });
                await prisma.taskTag.deleteMany({ where: { taskId: t.id } });
                await prisma.taskRelease.deleteMany({ where: { taskId: t.id } });
            }
            await prisma.task.deleteMany({ where: { productId } });

            await prisma.productTag.deleteMany({ where: { productId } });
            await prisma.customAttribute.deleteMany({ where: { productId } });
            await prisma.outcome.deleteMany({ where: { productId } });
            await prisma.release.deleteMany({ where: { productId } });
            await prisma.license.deleteMany({ where: { productId } });
            await prisma.solutionProduct.deleteMany({ where: { productId } }); // Remove link
            await prisma.product.delete({ where: { id: productId } });
        }

        if (solutionId) {
            await prisma.task.deleteMany({ where: { solutionId } });
            await prisma.solution.delete({ where: { id: solutionId } });
        }

        await prisma.$disconnect();
    });

    it('should export a product correctly with all stats', async () => {
        const result = await service.exportProduct(productId);

        expect(result).toBeDefined();
        expect(result.filename).toContain('Test Product');
        expect(result.filename).toContain('_v2_');
        expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.size).toBeGreaterThan(0);

        // Check stats
        expect(result.stats).toEqual({
            tasksExported: 1,
            customAttributesExported: 4, // 1 from table + 3 from legacy JSON (vendor, version, certified)
            // Check mapping logic: customAttributes.map -> flattened db table rows?
            // Wait, Product schema `customAttrs` is JSON.
            // ExportService query: `customAttributes: { orderBy: { displayOrder: 'asc' } }`
            // Product model: `customAttributes CustomAttribute[]`? No?
            // Prisma schema: `model CustomAttribute`.
            // Product model: `customAttrs Json?`.
            // Does Product have relation `customAttributes`?
            // Schema lines 597: `model CustomAttribute { ... productId ... product Product ... }`.
            // So `Product` SHOULD have `customAttributes` relation.
            // BUT I inserted into `customAttrs` JSON field in existing test, NOT `CustomAttribute` table.
            // Ah! `ExportService` queries `customAttributes` relation.
            // My setup in `beforeAll` created data in `customAttrs` JSON field: `customAttrs: { vendor: ... }`.
            // It did NOT create `CustomAttribute` rows.
            // So `customAttributesExported` will be 0 unless I create rows.
            licensesExported: 1,
            outcomesExported: 1,
            releasesExported: 1,
            telemetryAttributesExported: 1
        });

        // ROUND TRIP VERIFICATION
        // Validate that the exported file can be imported back without errors
        const importResult = await ImportService.dryRun(prisma, result.buffer, { entityType: 'product' });

        if (!importResult.isValid) {
            console.error('Round-trip validation errors:', JSON.stringify(importResult.errors, null, 2));
        }

        expect(importResult.isValid).toBe(true);
        expect(importResult.errors).toHaveLength(0);

        // Should detect it as an update
        expect(importResult.entitySummary.action).toBe('update');
        expect(importResult.entitySummary.existingId).toBe(productId);

        // Verify key records
        expect(importResult.records.tasks).toHaveLength(1);
        expect(importResult.records.tasks[0].action).not.toBe('create'); // Update or skip

        expect(importResult.records.telemetryAttributes).toHaveLength(1);
        expect(importResult.records.telemetryAttributes[0].action).not.toBe('create'); // Should be update/skip
        expect(importResult.records.customAttributes).toHaveLength(4);
        expect(importResult.records.tags).toHaveLength(1);
        expect(importResult.records.licenses).toHaveLength(1);
        expect(importResult.records.outcomes).toHaveLength(1);
        expect(importResult.records.releases).toHaveLength(1);
    });

    it('should export a solution correctly with linked products', async () => {
        const result = await service.exportSolution(solutionId);

        expect(result).toBeDefined();
        expect(result.filename).toContain('Test Solution');
        expect(result.stats.tasksExported).toBe(1); // One solution task
        // We verify that buffer is generated. Deep inspection of buffer requires exceljs, but size > 0 gives confidence.
        expect(result.size).toBeGreaterThan(0);
    });

    // Helper to modify Excel buffer in-memory
    async function modifyExcelBuffer(buffer: Buffer, modifications: (workbook: ExcelJS.Workbook) => void): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        modifications(workbook);
        return Buffer.from(await workbook.xlsx.writeBuffer()) as any;
    }

    it('should detect updates when file content is modified', async () => {
        // 1. Export
        const result = await service.exportProduct(productId);

        // 2. Modify: Change Task Name
        const modifiedBuffer = await modifyExcelBuffer(result.buffer, (workbook) => {
            const sheet = workbook.getWorksheet('Tasks');
            if (sheet) {
                // Row 2 is first data row (Header is 1)
                const cell = sheet.getCell('B2'); // Column B is Name
                cell.value = 'Modified Task Name';
            }
        });

        // 3. Import Dry Run
        const importResult = await ImportService.dryRun(prisma, modifiedBuffer, { entityType: 'product' });

        expect(importResult.isValid).toBe(true);
        expect(importResult.entitySummary.action).toBe('update');

        // Should detect task update
        const taskRecord = importResult.records.tasks.find(r => r.rowNumber === 2);
        expect(taskRecord).toBeDefined();
        expect(taskRecord?.action).toBe('update');
        expect(taskRecord?.data.name).toBe('Modified Task Name');
        expect(taskRecord?.changes).toHaveLength(1);
    });

    it('should detect creation when product name is changed', async () => {
        // 1. Export
        const result = await service.exportProduct(productId);

        // 2. Modify: Change Product Name to creating new one
        const modifiedBuffer = await modifyExcelBuffer(result.buffer, (workbook) => {
            const sheet = workbook.getWorksheet('Product Info');
            if (sheet) {
                // Row 2, Column B is Name
                const cell = sheet.getCell('B2');
                cell.value = `New Product ${Date.now()}`;

                // Clear ID to force creation logic (though Name change alone might trigger rename vs create decision?)
                // Logic: If ID exists in DB -> Update.
                // If ID does NOT exist -> Create.
                // If ID is present in file, it tries to find it. 
                // Using existing ID with Different Name -> Rename (Update).
                // To Create New, we must Remove ID from file.
                // Or provided ID must not exist.

                const idCell = sheet.getCell('A2'); // Column A is ID
                idCell.value = '99999999-9999-9999-9999-999999999999'; // Non-existent UUID? 
                // Or just clear it? Ids are hidden now but still in column A.
                // Wait, if I clear it, parser might treat as null.
                // IdSchema is nullable.
                // If ID is null, Import logic matches by Name.
                // New Name -> No Match -> Create.
                idCell.value = null;
            }
        });

        // 3. Import Dry Run
        const importResult = await ImportService.dryRun(prisma, modifiedBuffer, { entityType: 'product' });

        // If ID is cleared, and Name is new -> Should be Create.
        expect(importResult.isValid).toBe(true);
        expect(importResult.entitySummary.action).toBe('create');
        expect(importResult.entitySummary.existingId).toBeUndefined();
    });
});
