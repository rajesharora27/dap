/**
 * Personal Sandbox Service Tests
 * Tests for Personal Product and Personal Assignment services
 */

import { PrismaClient } from '@prisma/client';
import * as PersonalProductService from '../../../modules/personal-product/personal-product.service';
import * as PersonalAssignmentService from '../../../modules/personal-assignment/personal-assignment.service';

const prisma = new PrismaClient();

describe('Personal Sandbox', () => {
    let testUserId: string;

    beforeAll(async () => {
        // Create a test user for all tests
        const testUser = await prisma.user.create({
            data: {
                email: `sandbox-test-${Date.now()}@test.com`,
                username: `sandbox_test_${Date.now()}`,
                name: 'Sandbox Test User',
                password: 'TestPassword123!',
            },
        });
        testUserId = testUser.id;
    });

    afterAll(async () => {
        // Clean up test user and all related data (cascades)
        await prisma.user.deleteMany({
            where: { email: { contains: 'sandbox-test-' } },
        });
        await prisma.$disconnect();
    });

    describe('PersonalProductService', () => {
        let productId: string;
        let taskId: string;
        let outcomeId: string;
        let releaseId: string;

        describe('Product CRUD', () => {
            it('should create a personal product', async () => {
                const product = await PersonalProductService.createPersonalProduct(testUserId, {
                    name: 'Test Product',
                    description: 'A test product for sandbox',
                });

                expect(product).toBeDefined();
                expect(product.id).toBeDefined();
                expect(product.name).toBe('Test Product');
                expect(product.userId).toBe(testUserId);
                productId = product.id;
            });

            it('should fetch user personal products', async () => {
                const products = await PersonalProductService.getMyPersonalProducts(testUserId);

                expect(products).toBeDefined();
                expect(products.length).toBeGreaterThan(0);
                expect(products[0].name).toBe('Test Product');
            });

            it('should fetch a single personal product', async () => {
                const product = await PersonalProductService.getPersonalProduct(productId, testUserId);

                expect(product).toBeDefined();
                expect(product?.name).toBe('Test Product');
            });

            it('should update a personal product', async () => {
                const updated = await PersonalProductService.updatePersonalProduct(productId, testUserId, {
                    name: 'Updated Test Product',
                    description: 'Updated description',
                });

                expect(updated.name).toBe('Updated Test Product');
                expect(updated.description).toBe('Updated description');
            });

            it('should not allow more than 10 products', async () => {
                // Create 9 more products to reach the limit
                for (let i = 0; i < 9; i++) {
                    await PersonalProductService.createPersonalProduct(testUserId, {
                        name: `Limit Test Product ${i}`,
                    });
                }

                // 11th product should fail
                await expect(
                    PersonalProductService.createPersonalProduct(testUserId, { name: 'Overflow Product' })
                ).rejects.toThrow('Personal product limit (10) reached');
            });
        });

        describe('Task CRUD', () => {
            it('should create a personal task', async () => {
                const task = await PersonalProductService.createPersonalTask(testUserId, {
                    personalProductId: productId,
                    name: 'Test Task',
                    description: 'A test task',
                    estMinutes: 60,
                    weight: 2.0,
                });

                expect(task).toBeDefined();
                expect(task.id).toBeDefined();
                expect(task.name).toBe('Test Task');
                expect(task.estMinutes).toBe(60);
                taskId = task.id;
            });

            it('should update a personal task', async () => {
                const updated = await PersonalProductService.updatePersonalTask(taskId, testUserId, {
                    name: 'Updated Task',
                    estMinutes: 45,
                });

                expect(updated.name).toBe('Updated Task');
                expect(updated.estMinutes).toBe(45);
            });
        });

        describe('Outcome/Release CRUD', () => {
            it('should create a personal outcome', async () => {
                const outcome = await PersonalProductService.createPersonalOutcome(testUserId, {
                    personalProductId: productId,
                    name: 'Test Outcome',
                    description: 'An outcome for testing',
                });

                expect(outcome).toBeDefined();
                expect(outcome.name).toBe('Test Outcome');
                outcomeId = outcome.id;
            });

            it('should create a personal release', async () => {
                const release = await PersonalProductService.createPersonalRelease(testUserId, {
                    personalProductId: productId,
                    name: 'v1.0',
                    version: '1.0.0',
                });

                expect(release).toBeDefined();
                expect(release.name).toBe('v1.0');
                releaseId = release.id;
            });
        });

        describe('Product Import', () => {
            it('should import a product from export data', async () => {
                // Delete some products to make room
                await prisma.personalProduct.deleteMany({
                    where: {
                        userId: testUserId,
                        name: { contains: 'Limit Test' },
                    },
                });

                const exportData = {
                    name: 'Imported Product',
                    description: 'An imported product',
                    tasks: [
                        { name: 'Imported Task 1', estMinutes: 30 },
                        { name: 'Imported Task 2', estMinutes: 45 },
                    ],
                    outcomes: [{ name: 'Imported Outcome' }],
                    releases: [{ name: 'v2.0' }],
                };

                const imported = await PersonalProductService.importPersonalProduct(testUserId, exportData);

                expect(imported).toBeDefined();
                expect(imported?.name).toBe('Imported Product (imported)');
                expect(imported?.tasks.length).toBe(2);
                expect(imported?.outcomes.length).toBe(1);
                expect(imported?.releases.length).toBe(1);
            });
        });

        describe('Product Export', () => {
            it('should export a personal product to Excel format', async () => {
                const { ExcelExportService } = await import('../../../modules/import/excel-export.service');
                const result = await ExcelExportService.exportPersonalProduct(productId, testUserId);

                expect(result).toBeDefined();
                expect(result.filename).toContain('Test_Product');
                expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                expect(result.stats.tasksExported).toBeGreaterThan(0);
                expect(result.content).toBeDefined(); // base64 string
            });
        });

        describe('Product Import (Excel)', () => {
            it('should dry run and commit a personal product import', async () => {
                const { ExcelExportService } = await import('../../../modules/import/excel-export.service');
                const { ExcelImportService } = await import('../../../modules/import/excel-import.service');

                // 1. Export valid product to get Excel content
                const exportResult = await ExcelExportService.exportPersonalProduct(productId, testUserId);
                const base64Content = exportResult.content;

                // 2. Perform Dry Run with userId
                const dryRunResult = await ExcelImportService.dryRun(prisma, base64Content, {
                    entityType: 'personal_product',
                    userId: testUserId,
                });

                if (!dryRunResult.isValid) {
                    console.log('Dry Run Errors:', JSON.stringify(dryRunResult.errors, null, 2));
                }
                expect(dryRunResult.isValid).toBe(true);
                expect(dryRunResult.sessionId).toBeDefined();
                expect(dryRunResult.summary.totalRecords).toBeGreaterThan(0);

                // 3. Commit Import with userId
                const commitResult = await ExcelImportService.commitImport(prisma, {
                    sessionId: dryRunResult.sessionId,
                    userId: testUserId,
                });

                expect(commitResult.success).toBe(true);
                expect(commitResult.entityName).toBe('Updated Test Product');
            });
        });
    });

    describe('PersonalAssignmentService', () => {
        let assignmentId: string;
        let assignmentTaskId: string;

        describe('Assignment CRUD', () => {
            it('should create a personal assignment', async () => {
                // Get the first product for the user
                const products = await PersonalProductService.getMyPersonalProducts(testUserId);
                const productId = products[0].id;

                const assignment = await PersonalAssignmentService.createPersonalAssignment(testUserId, {
                    personalProductId: productId,
                    name: 'My Learning Plan',
                });

                expect(assignment).toBeDefined();
                expect(assignment.id).toBeDefined();
                expect(assignment.name).toBe('My Learning Plan');
                expect(assignment.tasks.length).toBeGreaterThan(0);
                assignmentId = assignment.id;
                assignmentTaskId = assignment.tasks[0].id;
            });

            it('should fetch user personal assignments', async () => {
                const assignments = await PersonalAssignmentService.getMyPersonalAssignments(testUserId);

                expect(assignments).toBeDefined();
                expect(assignments.length).toBeGreaterThan(0);
            });

            it('should update assignment task status', async () => {
                const updated = await PersonalAssignmentService.updatePersonalAssignmentTaskStatus(
                    assignmentTaskId,
                    testUserId,
                    { status: 'IN_PROGRESS', statusNotes: 'Working on it' }
                );

                expect(updated).toBeDefined();
                expect(updated.status).toBe('IN_PROGRESS');
                expect(updated.statusNotes).toBe('Working on it');
            });
        });

        describe('Progress Calculation', () => {
            it('should calculate progress correctly', () => {
                const tasks = [
                    { status: 'NOT_STARTED' },
                    { status: 'IN_PROGRESS' },
                    { status: 'COMPLETED' },
                    { status: 'DONE' },
                ];

                const progress = PersonalAssignmentService.calculateProgress(tasks);

                expect(progress).toBe(50); // 2 of 4 completed
            });

            it('should return 0 for empty task list', () => {
                const progress = PersonalAssignmentService.calculateProgress([]);
                expect(progress).toBe(0);
            });
        });

        describe('Assignment Sync', () => {
            it('should sync assignment with product changes', async () => {
                const synced = await PersonalAssignmentService.syncPersonalAssignment(assignmentId, testUserId);

                expect(synced).toBeDefined();
                expect(synced?.tasks).toBeDefined();
            });
        });
    });
});
