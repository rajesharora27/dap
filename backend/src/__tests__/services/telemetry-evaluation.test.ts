import { evaluateTelemetryAttribute, evaluateMultipleAttributes } from '../../services/telemetry/evaluationEngine';
import { SuccessCriteriaType, NumberOperator, StringMatchMode, TimestampMode } from '../../services/telemetry/types';

// This test file uses mock attribute objects, no database access needed
describe('Telemetry Evaluation Engine', () => {

    describe('NUMBER type evaluation', () => {
        it('should evaluate GREATER_THAN correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.NUMBER_THRESHOLD,
                    operator: NumberOperator.GREATER_THAN,
                    threshold: 100
                }),
                values: [{ value: '150' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate LESS_THAN correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.NUMBER_THRESHOLD,
                    operator: NumberOperator.LESS_THAN,
                    threshold: 100
                }),
                values: [{ value: '50' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate EQUALS correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.NUMBER_THRESHOLD,
                    operator: NumberOperator.EQUALS,
                    threshold: 100
                }),
                values: [{ value: '100' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate GREATER_THAN_OR_EQUAL correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.NUMBER_THRESHOLD,
                    operator: NumberOperator.GREATER_THAN_OR_EQUAL,
                    threshold: 100
                }),
                values: [{ value: '100' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate LESS_THAN_OR_EQUAL correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.NUMBER_THRESHOLD,
                    operator: NumberOperator.LESS_THAN_OR_EQUAL,
                    threshold: 100
                }),
                values: [{ value: '100' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should fail when value does not meet criteria', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.NUMBER_THRESHOLD,
                    operator: NumberOperator.GREATER_THAN,
                    threshold: 100
                }),
                values: [{ value: '50' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(false);
        });
    });

    describe('BOOLEAN type evaluation', () => {
        it('should evaluate EQUALS for true', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'BOOLEAN',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.BOOLEAN_FLAG,
                    expectedValue: true
                }),
                values: [{ value: 'true' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate EQUALS for false', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'BOOLEAN',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.BOOLEAN_FLAG,
                    expectedValue: false
                }),
                values: [{ value: 'false' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should handle string representations of boolean', async () => {
            const cases = [
                { value: 'yes', expected: true },
                { value: 'no', expected: false },
                { value: '1', expected: true },
                { value: '0', expected: false },
                { value: 'TRUE', expected: true },
                { value: 'FALSE', expected: false }
            ];

            for (const { value, expected } of cases) {
                const attribute = {
                    id: 'attr-1',
                    dataType: 'BOOLEAN',
                    successCriteria: JSON.stringify({
                        type: SuccessCriteriaType.BOOLEAN_FLAG,
                        expectedValue: expected
                    }),
                    values: [{ value }]
                };

                const result = await evaluateTelemetryAttribute(attribute);
                expect(result.success).toBe(true);
            }
        });
    });

    describe('STRING type evaluation', () => {
        it('should evaluate EXACT match correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'STRING',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.STRING_MATCH,
                    mode: StringMatchMode.EXACT,
                    pattern: 'success',
                    caseSensitive: false
                }),
                values: [{ value: 'success' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate CONTAINS correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'STRING',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.STRING_MATCH,
                    mode: StringMatchMode.CONTAINS,
                    pattern: 'success',
                    caseSensitive: false
                }),
                values: [{ value: 'deployment was successful' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should be case-insensitive for string comparisons by default', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'STRING',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.STRING_MATCH,
                    mode: StringMatchMode.EXACT,
                    pattern: 'SUCCESS',
                    caseSensitive: false
                }),
                values: [{ value: 'success' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate STRING_NOT_NULL correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'STRING',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.STRING_NOT_NULL
                }),
                values: [{ value: 'some value' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });
    });

    describe('TIMESTAMP type evaluation', () => {
        it('should evaluate BEFORE date comparisons', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'TIMESTAMP',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.TIMESTAMP_COMPARISON,
                    mode: TimestampMode.BEFORE,
                    referenceTime: '2025-12-31'
                }),
                values: [{ value: '2025-01-15' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate AFTER correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'TIMESTAMP',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.TIMESTAMP_COMPARISON,
                    mode: TimestampMode.AFTER,
                    referenceTime: '2024-01-01'
                }),
                values: [{ value: '2025-01-15' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should evaluate TIMESTAMP_NOT_NULL correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'TIMESTAMP',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.TIMESTAMP_NOT_NULL
                }),
                values: [{ value: '2025-01-15T10:30:00Z' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });
    });

    describe('Edge cases and error handling', () => {
        it('should return false when no values exist', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.NUMBER_THRESHOLD,
                    operator: NumberOperator.GREATER_THAN,
                    threshold: 100
                }),
                values: []
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(false);
        });

        it('should return true when no success criteria defined', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'STRING',
                successCriteria: null,
                values: [{ value: 'any value' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should handle invalid JSON in success criteria', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: 'invalid json',
                values: [{ value: '100' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle invalid number values', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.NUMBER_THRESHOLD,
                    operator: NumberOperator.GREATER_THAN,
                    threshold: 100
                }),
                values: [{ value: 'not a number' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('evaluateMultipleAttributes', () => {
        it('should evaluate multiple attributes', async () => {
            const attributes = [
                {
                    id: 'attr-1',
                    dataType: 'NUMBER',
                    successCriteria: JSON.stringify({
                        type: SuccessCriteriaType.NUMBER_THRESHOLD,
                        operator: NumberOperator.GREATER_THAN,
                        threshold: 100
                    }),
                    values: [{ value: '150' }]
                },
                {
                    id: 'attr-2',
                    dataType: 'BOOLEAN',
                    successCriteria: JSON.stringify({
                        type: SuccessCriteriaType.BOOLEAN_FLAG,
                        expectedValue: true
                    }),
                    values: [{ value: 'true' }]
                },
                {
                    id: 'attr-3',
                    dataType: 'STRING',
                    successCriteria: JSON.stringify({
                        type: SuccessCriteriaType.STRING_MATCH,
                        mode: StringMatchMode.EXACT,
                        pattern: 'success',
                        caseSensitive: false
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
                        type: SuccessCriteriaType.NUMBER_THRESHOLD,
                        operator: NumberOperator.GREATER_THAN,
                        threshold: 100
                    }),
                    values: [{ value: '150' }] // PASS
                },
                {
                    id: 'attr-2',
                    dataType: 'NUMBER',
                    successCriteria: JSON.stringify({
                        type: SuccessCriteriaType.NUMBER_THRESHOLD,
                        operator: NumberOperator.GREATER_THAN,
                        threshold: 1000
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

    describe('Composite criteria (AND/OR)', () => {
        it('should evaluate composite AND criteria', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.COMPOSITE_AND,
                    criteria: [
                        {
                            type: SuccessCriteriaType.NUMBER_THRESHOLD,
                            operator: NumberOperator.GREATER_THAN,
                            threshold: 50
                        },
                        {
                            type: SuccessCriteriaType.NUMBER_THRESHOLD,
                            operator: NumberOperator.LESS_THAN,
                            threshold: 150
                        }
                    ]
                }),
                values: [{ value: '100' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });

        it('should fail composite AND when one criterion fails', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.COMPOSITE_AND,
                    criteria: [
                        {
                            type: SuccessCriteriaType.NUMBER_THRESHOLD,
                            operator: NumberOperator.GREATER_THAN,
                            threshold: 50
                        },
                        {
                            type: SuccessCriteriaType.NUMBER_THRESHOLD,
                            operator: NumberOperator.LESS_THAN,
                            threshold: 80
                        }
                    ]
                }),
                values: [{ value: '100' }] // 100 > 50 (pass) but 100 < 80 (fail)
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(false);
        });

        it('should evaluate composite OR criteria (pass if any matches)', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'NUMBER',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.COMPOSITE_OR,
                    criteria: [
                        {
                            type: SuccessCriteriaType.NUMBER_THRESHOLD,
                            operator: NumberOperator.EQUALS,
                            threshold: 50
                        },
                        {
                            type: SuccessCriteriaType.NUMBER_THRESHOLD,
                            operator: NumberOperator.EQUALS,
                            threshold: 100
                        }
                    ]
                }),
                values: [{ value: '100' }] // 100 != 50 (fail) but 100 == 100 (pass)
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });
    });

    describe('Regex pattern matching', () => {
        it('should evaluate REGEX pattern correctly', async () => {
            const attribute = {
                id: 'attr-1',
                dataType: 'STRING',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.STRING_MATCH,
                    mode: StringMatchMode.REGEX,
                    pattern: '^deploy.*success$',
                    caseSensitive: false
                }),
                values: [{ value: 'deployment was a success' }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });
    });

    describe('Within days timestamp evaluation', () => {
        it('should evaluate WITHIN_DAYS correctly', async () => {
            const now = new Date();
            const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

            const attribute = {
                id: 'attr-1',
                dataType: 'TIMESTAMP',
                successCriteria: JSON.stringify({
                    type: SuccessCriteriaType.TIMESTAMP_COMPARISON,
                    mode: TimestampMode.WITHIN_DAYS,
                    referenceTime: 'now',
                    withinDays: 7
                }),
                values: [{ value: threeDaysAgo.toISOString() }]
            };

            const result = await evaluateTelemetryAttribute(attribute);

            expect(result.success).toBe(true);
        });
    });
});
