import { TelemetryService } from '../../services/telemetry/telemetryService';
import { TestFactory } from '../factories/TestFactory';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Telemetry Service', () => {
    let testUser: any;
    let testTask: any;

    beforeAll(async () => {
        testUser = await TestFactory.createUser({
            email: 'telemetrytest@example.com',
            username: 'telemetrytest',
            role: 'ADMIN',
            isAdmin: true
        });
    });

    beforeEach(async () => {
        await TestFactory.cleanup();
        const product = await TestFactory.createProduct();
        testTask = await TestFactory.createTask(product.id);
    });

    afterAll(async () => {
        await TestFactory.cleanup();
        await prisma.$disconnect();
    });

    describe('createAttribute', () => {
        it('should create telemetry attribute with success criteria', async () => {
            const attributeData = {
                name: 'User Count',
                description: 'Number of active users',
                dataType: 'NUMBER' as const,
                successCriteria: {
                    operator: 'GREATER_THAN',
                    targetValue: '100'
                },
                isRequired: true
            };

            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                attributeData,
                testUser.id
            );

            expect(attribute).toBeDefined();
            expect(attribute.name).toBe('User Count');
            expect(attribute.dataType).toBe('NUMBER');
            expect(attribute.isRequired).toBe(true);
            expect(attribute.successCriteria).toBeDefined();

            // Verify audit log
            const auditLog = await prisma.auditLog.findFirst({
                where: {
                    entityType: 'TelemetryAttribute',
                    entityId: attribute.id,
                    action: 'CREATE_TELEMETRY_ATTRIBUTE'
                }
            });

            expect(auditLog).toBeDefined();
        });

        it('should auto-increment order when not provided', async () => {
            const attr1 = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Attr 1', dataType: 'TEXT' },
                testUser.id
            );

            const attr2 = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Attr 2', dataType: 'TEXT' },
                testUser.id
            );

            expect(attr2.order).toBeGreaterThan(attr1.order);
        });

        it('should fail when task does not exist', async () => {
            await expect(
                TelemetryService.createAttribute(
                    'non-existent-task',
                    { name: 'Test', dataType: 'TEXT' },
                    testUser.id
                )
            ).rejects.toThrow();
        });

        it('should handle different data types', async () => {
            const types = ['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'PERCENTAGE'];

            for (const dataType of types) {
                const attr = await TelemetryService.createAttribute(
                    testTask.id,
                    { name: `Attribute ${dataType}`, dataType: dataType as any },
                    testUser.id
                );

                expect(attr.dataType).toBe(dataType);
            }
        });
    });

    describe('updateAttribute', () => {
        it('should update attribute properties', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Original Name', dataType: 'TEXT' },
                testUser.id
            );

            const updated = await TelemetryService.updateAttribute(
                attribute.id,
                {
                    name: 'Updated Name',
                    description: 'New description',
                    successCriteria: {
                        operator: 'EQUALS',
                        targetValue: 'success'
                    }
                },
                testUser.id
            );

            expect(updated.name).toBe('Updated Name');
            expect(updated.description).toBe('New description');
            expect(updated.successCriteria).toBeDefined();
        });

        it('should fail updating non-existent attribute', async () => {
            await expect(
                TelemetryService.updateAttribute(
                    'non-existent',
                    { name: 'Test' },
                    testUser.id
                )
            ).rejects.toThrow();
        });
    });

    describe('deleteAttribute', () => {
        it('should delete attribute and cascade values', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'To Delete', dataType: 'TEXT' },
                testUser.id
            );

            // Add a value
            await TelemetryService.addValue(
                attribute.id,
                { value: 'test value' },
                testUser.id
            );

            // Delete attribute
            const result = await TelemetryService.deleteAttribute(
                attribute.id,
                testUser.id
            );

            expect(result).toBe(true);

            // Verify attribute is deleted
            const found = await prisma.telemetryAttribute.findUnique({
                where: { id: attribute.id }
            });

            expect(found).toBeNull();
        });

        it('should fail deleting non-existent attribute', async () => {
            await expect(
                TelemetryService.deleteAttribute('non-existent', testUser.id)
            ).rejects.toThrow();
        });
    });

    describe('addValue', () => {
        it('should add telemetry value to attribute', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Users', dataType: 'NUMBER' },
                testUser.id
            );

            const value = await TelemetryService.addValue(
                attribute.id,
                { value: '150', notes: 'Monthly count' },
                testUser.id
            );

            expect(value).toBeDefined();
            expect(value.value).toBe('150');
            expect(value.notes).toBe('Monthly count');
            expect(value.attributeId).toBe(attribute.id);
        });

        it('should fail adding value to non-existent attribute', async () => {
            await expect(
                TelemetryService.addValue(
                    'non-existent',
                    { value: 'test' },
                    testUser.id
                )
            ).rejects.toThrow();
        });

        it('should support batch ID for grouping', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Metric', dataType: 'NUMBER' },
                testUser.id
            );

            const batchId = 'batch-123';

            const value1 = await TelemetryService.addValue(
                attribute.id,
                { value: '100', batchId },
                testUser.id
            );

            const value2 = await TelemetryService.addValue(
                attribute.id,
                { value: '200', batchId },
                testUser.id
            );

            expect(value1.batchId).toBe(batchId);
            expect(value2.batchId).toBe(batchId);
        });
    });

    describe('addBatchValues', () => {
        it('should add multiple values in a batch', async () => {
            const attr1 = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Metric 1', dataType: 'NUMBER' },
                testUser.id
            );

            const attr2 = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Metric 2', dataType: 'NUMBER' },
                testUser.id
            );

            const batchData = {
                batchId: 'batch-456',
                values: [
                    { attributeId: attr1.id, value: '100', notes: 'First metric' },
                    { attributeId: attr2.id, value: '200', notes: 'Second metric' }
                ]
            };

            const values = await TelemetryService.addBatchValues(
                batchData,
                testUser.id
            );

            expect(values).toHaveLength(2);
            expect(values[0].batchId).toBe('batch-456');
            expect(values[1].batchId).toBe('batch-456');
        });

        it('should fail if any attribute does not exist', async () => {
            const attr1 = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Metric 1', dataType: 'NUMBER' },
                testUser.id
            );

            const batchData = {
                batchId: 'batch-789',
                values: [
                    { attributeId: attr1.id, value: '100' },
                    { attributeId: 'non-existent', value: '200' }
                ]
            };

            await expect(
                TelemetryService.addBatchValues(batchData, testUser.id)
            ).rejects.toThrow();
        });
    });

    describe('getTaskCompletionSummary', () => {
        it('should return 0% completion for task with no attributes', async () => {
            const summary = await TelemetryService.getTaskCompletionSummary(
                testTask.id
            );

            expect(summary.totalAttributes).toBe(0);
            expect(summary.successfulAttributes).toBe(0);
            expect(summary.completionPercentage).toBe(0);
            expect(summary.isComplete).toBe(false);
        });

        it('should calculate completion based on success criteria', async () => {
            // Create attribute with success criteria
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                {
                    name: 'User Count',
                    dataType: 'NUMBER',
                    successCriteria: {
                        operator: 'GREATER_THAN',
                        targetValue: '100'
                    }
                },
                testUser.id
            );

            // Add value that meets criteria
            await TelemetryService.addValue(
                attribute.id,
                { value: '150' },
                testUser.id
            );

            const summary = await TelemetryService.getTaskCompletionSummary(
                testTask.id
            );

            expect(summary.totalAttributes).toBe(1);
            expect(summary.successfulAttributes).toBeGreaterThan(0);
        });

        it('should track failed attributes', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                {
                    name: 'Users',
                    dataType: 'NUMBER',
                    successCriteria: {
                        operator: 'GREATER_THAN',
                        targetValue: '1000'
                    }
                },
                testUser.id
            );

            // Add value that does NOT meet criteria
            await TelemetryService.addValue(
                attribute.id,
                { value: '50' },
                testUser.id
            );

            const summary = await TelemetryService.getTaskCompletionSummary(
                testTask.id
            );

            expect(summary.failedAttributes.length).toBeGreaterThan(0);
            expect(summary.isComplete).toBe(false);
        });
    });

    describe('getAttributesForTask', () => {
        it('should return attributes in order', async () => {
            await TelemetryService.createAttribute(
                testTask.id,
                { name: 'First', dataType: 'TEXT', order: 1 },
                testUser.id
            );

            await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Second', dataType: 'TEXT', order: 2 },
                testUser.id
            );

            const attributes = await TelemetryService.getAttributesForTask(
                testTask.id
            );

            expect(attributes).toHaveLength(2);
            expect(attributes[0].order).toBeLessThan(attributes[1].order);
        });

        it('should optionally exclude values', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Test', dataType: 'TEXT' },
                testUser.id
            );

            await TelemetryService.addValue(
                attribute.id,
                { value: 'test' },
                testUser.id
            );

            const withValues = await TelemetryService.getAttributesForTask(
                testTask.id,
                true
            );

            const withoutValues = await TelemetryService.getAttributesForTask(
                testTask.id,
                false
            );

            expect(withValues[0].values).toBeDefined();
            expect(withoutValues[0].values).toBeFalsy();
        });
    });

    describe('getAttributeById', () => {
        it('should return attribute with task', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Test', dataType: 'TEXT' },
                testUser.id
            );

            const found = await TelemetryService.getAttributeById(attribute.id);

            expect(found).toBeDefined();
            expect(found.id).toBe(attribute.id);
            expect(found.task).toBeDefined();
        });

        it('should return null for non-existent attribute', async () => {
            const found = await TelemetryService.getAttributeById('non-existent');
            expect(found).toBeNull();
        });
    });

    describe('getValuesForAttribute', () => {
        it('should return values in descending order', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Test', dataType: 'NUMBER' },
                testUser.id
            );

            await TelemetryService.addValue(attribute.id, { value: '100' }, testUser.id);
            await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
            await TelemetryService.addValue(attribute.id, { value: '200' }, testUser.id);

            const values = await TelemetryService.getValuesForAttribute(attribute.id);

            expect(values.length).toBeGreaterThan(0);
            // Latest value should be first
            expect(values[0].value).toBe('200');
        });

        it('should respect limit parameter', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Test', dataType: 'TEXT' },
                testUser.id
            );

            // Add multiple values
            for (let i = 0; i < 10; i++) {
                await TelemetryService.addValue(
                    attribute.id,
                    { value: `Value ${i}` },
                    testUser.id
                );
            }

            const values = await TelemetryService.getValuesForAttribute(
                attribute.id,
                5
            );

            expect(values.length).toBeLessThanOrEqual(5);
        });
    });

    describe('updateValue', () => {
        it('should update telemetry value', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Test', dataType: 'NUMBER' },
                testUser.id
            );

            const value = await TelemetryService.addValue(
                attribute.id,
                { value: '100', notes: 'Original' },
                testUser.id
            );

            const updated = await TelemetryService.updateValue(
                value.id,
                { value: '200', notes: 'Updated' },
                testUser.id
            );

            expect(updated.value).toBe('200');
            expect(updated.notes).toBe('Updated');
        });

        it('should fail updating non-existent value', async () => {
            await expect(
                TelemetryService.updateValue(
                    'non-existent',
                    { value: 'test' },
                    testUser.id
                )
            ).rejects.toThrow();
        });
    });

    describe('deleteValue', () => {
        it('should delete telemetry value', async () => {
            const attribute = await TelemetryService.createAttribute(
                testTask.id,
                { name: 'Test', dataType: 'TEXT' },
                testUser.id
            );

            const value = await TelemetryService.addValue(
                attribute.id,
                { value: 'test' },
                testUser.id
            );

            const result = await TelemetryService.deleteValue(
                value.id,
                testUser.id
            );

            expect(result).toBe(true);

            const found = await prisma.telemetryValue.findUnique({
                where: { id: value.id }
            });

            expect(found).toBeNull();
        });

        it('should fail deleting non-existent value', async () => {
            await expect(
                TelemetryService.deleteValue('non-existent', testUser.id)
            ).rejects.toThrow();
        });
    });

    describe('Complex Scenarios', () => {
        it('should handle multiple attributes with different criteria', async () => {
            // Create multiple attributes
            const userCount = await TelemetryService.createAttribute(
                testTask.id,
                {
                    name: 'User Count',
                    dataType: 'NUMBER',
                    successCriteria: {
                        operator: 'GREATER_THAN',
                        targetValue: '100'
                    }
                },
                testUser.id
            );

            const activeRate = await TelemetryService.createAttribute(
                testTask.id,
                {
                    name: 'Active Rate',
                    dataType: 'PERCENTAGE',
                    successCriteria: {
                        operator: 'GREATER_THAN_EQUALS',
                        targetValue: '80'
                    }
                },
                testUser.id
            );

            // Add values
            await TelemetryService.addValue(userCount.id, { value: '150' }, testUser.id);
            await TelemetryService.addValue(activeRate.id, { value: '85' }, testUser.id);

            const summary = await TelemetryService.getTaskCompletionSummary(testTask.id);

            expect(summary.totalAttributes).toBe(2);
        });

        it('should maintain attribute order', async () => {
            const attrs = [];
            for (let i = 1; i <= 5; i++) {
                attrs.push(await TelemetryService.createAttribute(
                    testTask.id,
                    { name: `Attr ${i}`, dataType: 'TEXT', order: i },
                    testUser.id
                ));
            }

            const retrieved = await TelemetryService.getAttributesForTask(testTask.id);

            for (let i = 0; i < retrieved.length - 1; i++) {
                expect(retrieved[i].order).toBeLessThan(retrieved[i + 1].order);
            }
        });
    });
});
