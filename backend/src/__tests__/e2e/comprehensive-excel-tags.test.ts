
import { PrismaClient, LicenseLevel } from '@prisma/client';
import { ExcelExportService } from '../../services/excel/ExcelExportService';
import { ExcelImportService, ImportMode } from '../../services/excel/ExcelImportService';

// ============================================================================
// SETUP & HELPERS
// ============================================================================

// Force a safe, isolated test database for e2e runs
const DEFAULT_TEST_DB = 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public';
const dbUrl = process.env.DATABASE_URL || DEFAULT_TEST_DB;

if (!dbUrl.includes('dap_test')) {
    throw new Error(
        `❌ Refusing to run e2e tests on non-test database. DATABASE_URL="${dbUrl}". ` +
        `Set ALLOW_NON_TEST_DB=true to override (not recommended).`
    );
}

const prisma = new PrismaClient({
    datasources: {
        db: { url: dbUrl }
    }
});

const exportService = new ExcelExportService();
const importService = new ExcelImportService();

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration?: number;
}
const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try {
        await testFn();
        results.push({ name, passed: true, duration: Date.now() - start });
        console.log(`✅ PASS: ${name} (${Date.now() - start}ms)`);
    } catch (error: any) {
        results.push({ name, passed: false, error: error.message, duration: Date.now() - start });
        console.log(`❌ FAIL: ${name} - ${error.message}`);
    }
}

function expect(actual: any) {
    return {
        toBeDefined: () => { if (actual === undefined || actual === null) throw new Error(`Expected defined, got ${actual}`); },
        toBe: (expected: any) => { if (actual !== expected) throw new Error(`Expected '${expected}', got '${actual}'`); },
        toContain: (expected: any) => { if (typeof actual === 'string' && !actual.includes(expected)) throw new Error(`Expected '${actual}' to contain '${expected}'`); },
        not: {
            toContain: (expected: any) => { if (typeof actual === 'string' && actual.includes(expected)) throw new Error(`Expected '${actual}' NOT to contain '${expected}'`); }
        },
        toEqual: (expected: any) => {
            const actualStr = JSON.stringify(actual);
            const expectedStr = JSON.stringify(expected);
            if (actualStr !== expectedStr) throw new Error(`Expected ${expectedStr}, got ${actualStr}`);
        }
    };
}

// ============================================================================
// TEST LOGIC
// ============================================================================

async function runTagsExportTest() {
    const timestamp = Date.now();
    const originalProductName = `Excel Tag Test Source ${timestamp}`;
    const importedProductName = `Excel Tag Test Target ${timestamp}`;
    let productId: string;

    await runTest('1. Create Product with Tags', async () => {
        // Create Product
        const product = await prisma.product.create({
            data: {
                name: originalProductName,
                description: 'Source product for excel tag test'
            }
        });
        productId = product.id;

        // Create Tags
        const tag1 = await prisma.productTag.create({
            data: { productId, name: 'Critical', color: 'error', displayOrder: 1 }
        });
        const tag2 = await prisma.productTag.create({
            data: { productId, name: 'Easy', color: 'success', displayOrder: 2 }
        });

        // Create Task with Tags
        const task = await prisma.task.create({
            data: {
                name: 'Tagged Task 1',
                estMinutes: 30,
                weight: 10,
                sequenceNumber: 1,
                licenseLevel: LicenseLevel.ESSENTIAL,
                productId,
                taskTags: {
                    create: [
                        { tagId: tag1.id },
                        { tagId: tag2.id }
                    ]
                }
            }
        });

        expect(task.id).toBeDefined();
    });

    await runTest('2. Export and Structure Verification', async () => {
        // Export
        const exportResult = await exportService.exportProduct(originalProductName);
        expect(exportResult.buffer).toBeDefined();

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(exportResult.buffer);

        // --- Verify Structure & User Experience Features ---
        const tasksSheet = workbook.getWorksheet('Tasks');
        if (!tasksSheet) throw new Error('Tasks sheet not found');

        // Verify Headers (Indices are 1-based in ExcelJS)
        // J=10, K=11, L=12
        const outcomesHeader = tasksSheet.getCell('J1').value;
        const releasesHeader = tasksSheet.getCell('K1').value;
        const tagsHeader = tasksSheet.getCell('L1').value;

        expect(outcomesHeader).toBe('Outcomes');
        expect(releasesHeader).toBe('Releases');
        expect(tagsHeader).toBe('Tags');

        // Verify Notes (Tooltips) on HEADERS
        const tagsNote = tasksSheet.getCell('L1').note;
        if (typeof tagsNote === 'string') {
            expect(tagsNote).toContain('tag names');
            expect(tagsNote).not.toContain('release names');
        } else if (tagsNote && typeof tagsNote === 'object') {
            // Sometimes note is an object with texts
            const texts = (tagsNote as any).texts?.map((t: any) => t.text).join('') || '';
            expect(texts).toContain('tag names');
        } else {
            // Note might be missing if implementation failed
            throw new Error('Tags header note is missing');
        }

        // Verify Data Validation on DATA ROW (Row 2)
        const tagsValidation = tasksSheet.getCell('L2').dataValidation;
        expect(tagsValidation).toBeDefined();
        if (tagsValidation?.type !== 'custom') throw new Error(`Expected custom validation, got ${tagsValidation?.type}`);

        const formula = JSON.stringify(tagsValidation.formulae);
        expect(formula).toContain("'Tags'!$A:$A");

        // --- Verify Instructions Tab ---
        const instructionsSheet = workbook.getWorksheet('Instructions');
        if (!instructionsSheet) throw new Error('Instructions sheet not found');

        let foundTagsInTasks = false;
        let foundTagsTabSection = false;

        instructionsSheet.eachRow((row: any) => {
            const val = row.getCell(1).value?.toString() || '';
            if (val.includes('Tags: Comma-separated tag names from Tab 7')) {
                foundTagsInTasks = true;
            }
            if (val.includes('Tab 7: Tags')) {
                foundTagsTabSection = true;
            }
        });

        if (!foundTagsInTasks) throw new Error('Instructions do not mention Tags in Tasks section');
        if (!foundTagsTabSection) throw new Error('Instructions do not have a Tags Tab section');

        // --- Prepare for Import Test ---
        // Change product name in Excel
        const infoSheet = workbook.getWorksheet('Product Info');
        let nameCellFound = false;
        infoSheet.eachRow((row: any) => {
            if (row.getCell(1).value === 'Product Name') {
                row.getCell(2).value = importedProductName;
                nameCellFound = true;
            }
        });
        if (!nameCellFound) throw new Error('Could not find Product Name cell');

        const newBuffer = await workbook.xlsx.writeBuffer();

        // Import
        const importResult = await importService.importProduct(Buffer.from(newBuffer), ImportMode.CREATE_NEW);

        expect(importResult.success).toBe(true);
        expect(importResult.stats.tagsImported).toBe(2);
    });

    await runTest('3. Verify Imported Tags', async () => {
        const importedProduct = await prisma.product.findUnique({
            where: { name: importedProductName },
            include: {
                tags: { orderBy: { name: 'asc' } },
                tasks: {
                    include: {
                        taskTags: {
                            include: { tag: true }
                        }
                    }
                }
            }
        });

        expect(importedProduct).toBeDefined();
        if (!importedProduct) return;

        expect(importedProduct.tags.length).toBe(2);
        expect(importedProduct.tags[0].name).toBe('Critical');
        expect(importedProduct.tags[1].name).toBe('Easy');

        expect(importedProduct.tasks.length).toBe(1);
        const task = importedProduct.tasks[0];
        expect(task.name).toBe('Tagged Task 1');
        expect(task.taskTags.length).toBe(2);

        const tagNames = task.taskTags.map(tt => tt.tag.name).sort();
        expect(tagNames).toEqual(['Critical', 'Easy']);
    });

    // Cleanup
    await runTest('Cleanup', async () => {
        const clean = async (name: string) => {
            const product = await prisma.product.findUnique({ where: { name } });
            if (product) {
                await prisma.taskTag.deleteMany({ where: { task: { productId: product.id } } });
                await prisma.task.deleteMany({ where: { productId: product.id } });
                await prisma.productTag.deleteMany({ where: { productId: product.id } });
                await prisma.product.delete({ where: { id: product.id } });
            }
        };
        await clean(originalProductName);
        await clean(importedProductName);
    });
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  DAP Excel Tags Verification Suite');
    console.log('═══════════════════════════════════════════════════════════════');

    try {
        await runTagsExportTest();
    } catch (error) {
        console.error('Suite error:', error);
    } finally {
        await prisma.$disconnect();
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;
    console.log(`  Tests: ${total} | Passed: ${passed} | Failed: ${failed}`);

    if (failed > 0) process.exit(1);
}

// Jest-compatible wrapper
if (typeof test !== 'undefined') {
    test('Excel Tags Verify', runAllTests, 60000);
}

