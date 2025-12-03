import { evaluateTelemetryAttribute, evaluateMultipleAttributes } from '../../services/telemetry/evaluationEngine';
import { TestFactory } from '../factories/TestFactory';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Telemetry Evaluation Engine', () => {
    beforeEach(async () => {
        await TestFactory.cleanup();
    });

    afterAll(async () => {
        await TestFactory.cleanup();
        await prisma.$disconnect();
    });

    describe('NUMBER type evaluation', () => {
        it('should evaluate GREATER_THAN correctly', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'GREATER_THAN',
                    targetValue: '100'
                }),
                values: [{ value: '150' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
            expect(result.operator).toBe('GREATER_THAN');
        });

        it('should evaluate LESS_THAN correctly', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'LESS_THAN',
                    targetValue: '100'
                }),
                values: [{ value: '50' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate EQUALS correctly', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'EQUALS',
                    targetValue: '100'
                }),
                values: [{ value: '100' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate GREATER_THAN_EQUALS correctly', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'GREATER_THAN_EQUALS',
                    targetValue: '100'
                }),
                values: [{ value: '100' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate LESS_THAN_EQUALS correctly', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'LESS_THAN_EQUALS',
                    targetValue: '100'
                }),
                values: [{ value: '100' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should fail when value does not meet criteria', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'GREATER_THAN',
                    targetValue: '100'
                }),
                values: [{ value: '50' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(false);
            expect(result.details).toContain('50 is not > 100');
        });
    });

    describe('BOOLEAN type evaluation', () => {
        it('should evaluate EQUALS for true', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'BOOLEAN',
                successCriteria: JSON.stringify({
                    operator: 'EQUALS',
                    expectedValue: true
                }),
                values: [{ value: 'true' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate EQUALS for false', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'BOOLEAN',
                successCriteria: JSON.stringify({
                    operator: 'EQUALS',
                    expectedValue: false
                }),
                values: [{ value: 'false' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should handle string representations of boolean', () => {
            const cases = [
                { value: 'yes', expected: true },
                { value: 'no', expected: false },
                { value: '1', expected: true },
                { value: '0', expected: false },
                { value: 'TRUE', expected: true },
                { value: 'FALSE', expected: false }
            ];

            cases.forEach(({ value, expected }) => {
                const attribute = {
                    id: 'attr-1',
                    dataType: 'BOOLEAN',
                    successCriteria: JSON.stringify({
                        operator: 'EQUALS',
                        expectedValue: expected
                    }),
                    values: [{ value }]
                };

                const result = evaluateTelemetryAttribute(attribute);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('TEXT type evaluation', () => {
        it('should evaluate EQUALS correctly', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'TEXT',
                successCriteria: JSON.stringify({
                    operator: 'EQUALS',
                    targetValue: 'success'
                }),
                values: [{ value: 'success' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate CONTAINS correctly', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'TEXT',
                successCriteria: JSON.stringify({
                    operator: 'CONTAINS',
                    targetValue: 'success'
                }),
                values: [{ value: 'deployment was successful' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should be case-insensitive for text comparisons', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'TEXT',
                successCriteria: JSON.stringify({
                    operator: 'EQUALS',
                    targetValue: 'SUCCESS'
                }),
                values: [{ value: 'success' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });
    });

    describe('PERCENTAGE type evaluation', () => {
        it('should evaluate percentage values', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'PERCENTAGE',
                successCriteria: JSON.stringify({
                    operator: 'GREATER_THAN_EQUALS',
                    targetValue: '80'
                }),
                values: [{ value: '85' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should handle percentage with % symbol', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'PERCENTAGE',
                successCriteria: JSON.stringify({
                    operator: 'GREATER_THAN',
                    targetValue: '50'
                }),
                values: [{ value: '75%' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });
    });

    describe('DATE type evaluation', () => {
        it('should evaluate date comparisons', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'DATE',
                successCriteria: JSON.stringify({
                    operator: 'BEFORE',
                    targetValue: '2025-12-31'
                }),
                values: [{ value: '2025-01-15' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate AFTER correctly', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'DATE',
                successCriteria: JSON.stringify({
                    operator: 'AFTER',
                    targetValue: '2024-01-01'
                }),
                values: [{ value: '2025-01-15' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });
    });

    describe('Edge cases and error handling', () => {
        it('should return false when no values exist', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'GREATER_THAN',
                    targetValue: '100'
                }),
                values: []
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(false);
            expect(result.error).toContain('No telemetry value');
        });

        it('should return true when no success criteria defined', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'TEXT',
                successCriteria: null,
                values: [{ value: 'any value' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
            expect(result.details).toContain('No success criteria');
        });

        it('should handle invalid JSON in success criteria', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: 'invalid json',
                values: [{ value: '100' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle invalid number values', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'GREATER_THAN',
                    targetValue: '100'
                }),
                values: [{ value: 'not a number' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid');
        });
    });

    describe('evaluateMultipleAttributes', () => {
        it('should evaluate multiple attributes', async () => {
            const attributes = [
                {
                    id: 'attr-1',
                    dataType: 'NUMBER',
                    successCriteria: JSON.stringify({
                        operator: 'GREATER_THAN',
                        targetValue: '100'
                    }),
                    values: [{ value: '150' }]
                },
                {
                    id: 'attr-2',
                    dataType: 'BOOLEAN',
                    successCriteria: JSON.stringify({
                        operator: 'EQUALS',
                        expectedValue: true
                    }),
                    values: [{ value: 'true' }]
                },
                {
                    id: 'attr-3',
                    dataType: 'TEXT',
                    successCriteria: JSON.stringify({
                        operator: 'EQUALS',
                        targetValue: 'success'
                    }),
                    values: [{ value: 'success' }]
                }
            ];

            const results = await evaluateMultipleAttributes(attributes as any);

            expect(results).toHaveLength(3);
            expect(results.every(r => r.success)).toBe(true);
        });

        it('should identify failed attributes', async () => {
            const attributes = [
                {
                    id: 'attr-1',
                    dataType: 'NUMBER',
                    successCriteria: JSON.stringify({
                        operator: 'GREATER_THAN',
                        targetValue: '100'
                    }),
                    values: [{ value: '150' }] // PASS
                },
                {
                    id: 'attr-2',
                    dataType: 'NUMBER',
                    successCriteria: JSON.stringify({
                        operator: 'GREATER_THAN',
                        targetValue: '1000'
                    }),
                    values: [{ value: '50' }] // FAIL
                }
            ];

            const results = await evaluateMultipleAttributes(attributes as any);

            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(false);
        });

        it('should handle empty array', async () => {
            const results = await evaluateMultipleAttributes([]);
            expect(results).toEqual([]);
        });
    });

    describe('Complex operator scenarios', () => {
        it('should handle NOT_EQUALS operator', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'TEXT',
                successCriteria: JSON.stringify({
                    operator: 'NOT_EQUALS',
                    targetValue: 'error'
                }),
                values: [{ value: 'success' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should handle BETWEEN operator for numbers', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'BETWEEN',
                    minValue: '50',
                    maxValue: '150'
                }),
                values: [{ value: '100' }]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should use latest value when multiple exist', () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    operator: 'GREATER_THAN',
                    targetValue: '100'
                }),
                values: [
                    { value: '50', createdAt: new Date('2025-01-01') },
                    { value: '150', createdAt: new Date('2025-01-02') }
                ]
            };

            const result = evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
            expect(result.actualValue).toBe('150');
        });
    });
});
