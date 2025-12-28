/**
 * Query Executor Tests
 * 
 * Unit tests for the QueryExecutor class.
 * 
 * @module services/ai/__tests__/QueryExecutor.test
 * @version 1.0.0
 * @created 2025-12-06
 */

import {
    QueryExecutor,
    QueryConfig,
    QueryExecutionResult,
    getQueryExecutor,
    resetQueryExecutor,
} from '../QueryExecutor';

// Mock Prisma client for testing
const createMockPrisma = () => ({
    product: {
        findMany: jest.fn().mockResolvedValue([
            { id: '1', name: 'Product A' },
            { id: '2', name: 'Product B' },
        ]),
        findUnique: jest.fn().mockResolvedValue({ id: '1', name: 'Product A' }),
        count: jest.fn().mockResolvedValue(10),
    },
    customer: {
        findMany: jest.fn().mockResolvedValue([
            { id: '1', name: 'Customer A' },
        ]),
        count: jest.fn().mockResolvedValue(5),
    },
    task: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(20),
    },
    solution: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(3),
    },
    telemetryAttribute: {
        findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
        count: jest.fn().mockResolvedValue(8),
    },
});

describe('QueryExecutor', () => {
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = createMockPrisma();
        resetQueryExecutor();
    });

    describe('constructor', () => {
        it('should create instance with default options', () => {
            const executor = new QueryExecutor(mockPrisma);
            const options = executor.getOptions();

            expect(options.maxRows).toBe(100);
            expect(options.timeoutMs).toBe(30000);
            expect(options.allowMutations).toBe(false);
        });

        it('should accept custom options', () => {
            const executor = new QueryExecutor(mockPrisma, {
                maxRows: 50,
                timeoutMs: 5000,
            });
            const options = executor.getOptions();

            expect(options.maxRows).toBe(50);
            expect(options.timeoutMs).toBe(5000);
        });
    });

    describe('execute - findMany', () => {
        it('should execute findMany query successfully', async () => {
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'product',
                operation: 'findMany',
                args: { where: { deletedAt: null } },
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.rowCount).toBe(2);
            expect(result.truncated).toBe(false);
            expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
        });

        it('should truncate results when exceeding maxRows', async () => {
            // Create mock that returns many rows
            const manyProducts = Array.from({ length: 150 }, (_, i) => ({
                id: `${i}`,
                name: `Product ${i}`,
            }));
            mockPrisma.product.findMany.mockResolvedValue(manyProducts);

            const executor = new QueryExecutor(mockPrisma, { maxRows: 100 });

            const config: QueryConfig = {
                model: 'product',
                operation: 'findMany',
                args: {},
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(100);
            expect(result.rowCount).toBe(150);
            expect(result.truncated).toBe(true);
        });

        it('should apply take limit to prevent fetching too many rows', async () => {
            const executor = new QueryExecutor(mockPrisma, { maxRows: 50 });

            const config: QueryConfig = {
                model: 'product',
                operation: 'findMany',
                args: {},
            };

            await executor.execute(config);

            // Should have added take: 51 (maxRows + 1 for truncation detection)
            expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 51 })
            );
        });
    });

    describe('execute - findUnique', () => {
        it('should execute findUnique query successfully', async () => {
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'product',
                operation: 'findUnique',
                args: { where: { id: '1' } },
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({ id: '1', name: 'Product A' });
            expect(result.rowCount).toBe(1);
        });

        it('should handle null result from findUnique', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(null);
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'product',
                operation: 'findUnique',
                args: { where: { id: 'nonexistent' } },
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
            expect(result.rowCount).toBe(0);
        });
    });

    describe('execute - count', () => {
        it('should execute count query successfully', async () => {
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'product',
                operation: 'count',
                args: { where: { deletedAt: null } },
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(true);
            expect(result.data).toBe(10);
            expect(result.rowCount).toBe(1);
        });
    });

    describe('execute - aggregate count', () => {
        it('should execute aggregate count across multiple models', async () => {
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'aggregate',
                operation: 'count',
                args: { models: ['product', 'solution', 'customer', 'task'] },
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                product: 10,
                solution: 3,
                customer: 5,
                task: 20,
            });
            expect(result.rowCount).toBe(4);
        });

        it('should handle missing models array in aggregate', async () => {
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'aggregate',
                operation: 'count',
                args: {},
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Models array is required');
        });

        it('should handle model count errors gracefully', async () => {
            mockPrisma.solution.count.mockRejectedValue(new Error('DB error'));
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'aggregate',
                operation: 'count',
                args: { models: ['product', 'solution'] },
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(true);
            expect(result.data.product).toBe(10);
            expect(result.data.solution).toBe(-1); // Error indicator
        });
    });

    describe('validation', () => {
        it('should reject invalid model names', async () => {
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'invalidModel',
                operation: 'findMany',
                args: {},
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid model');
        });

        it('should reject mutation operations by default', async () => {
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'product',
                operation: 'createMany' as any, // Force invalid operation
                args: {},
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not allowed');
        });

        it('should accept valid model names in different cases', async () => {
            const executor = new QueryExecutor(mockPrisma);

            // Test various model name formats
            const models = ['product', 'Product', 'customer', 'task', 'telemetryAttribute'];

            for (const model of models) {
                const config: QueryConfig = {
                    model,
                    operation: 'findMany',
                    args: {},
                };

                const result = await executor.execute(config);
                // Should either succeed or fail due to missing mock, not validation
                if (!result.success) {
                    expect(result.error).not.toContain('Invalid model');
                }
            }
        });
    });

    describe('timeout handling', () => {
        it('should timeout long-running queries', async () => {
            // Mock a slow query
            mockPrisma.product.findMany.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve([]), 5000))
            );

            const executor = new QueryExecutor(mockPrisma, { timeoutMs: 100 });

            const config: QueryConfig = {
                model: 'product',
                operation: 'findMany',
                args: {},
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(false);
            // Error message may be "timeout" or "took too long"
            expect(result.error?.toLowerCase()).toMatch(/timeout|too long/);
        });
    });

    describe('error handling', () => {
        it('should sanitize database errors', async () => {
            mockPrisma.product.findMany.mockRejectedValue(new Error('PRISMA_INTERNAL_ERROR: sensitive data'));
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'product',
                operation: 'findMany',
                args: {},
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(false);
            // Should sanitize error - not expose internal details
            expect(result.error).not.toContain('PRISMA_INTERNAL');
            expect(result.error).not.toContain('sensitive');
        });

        it('should sanitize connection errors', async () => {
            mockPrisma.product.findMany.mockRejectedValue(new Error('Cannot connect to database at localhost:5432'));
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'product',
                operation: 'findMany',
                args: {},
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(false);
            // Should not expose localhost:5432 details
            expect(result.error).not.toContain('localhost:5432');
        });

        it('should keep validation error messages', async () => {
            const executor = new QueryExecutor(mockPrisma);

            const config: QueryConfig = {
                model: 'product',
                operation: 'deleteMany' as any,
                args: {},
            };

            const result = await executor.execute(config);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not allowed');
        });
    });

    describe('executeFromBuilder', () => {
        it('should execute query from a builder function', async () => {
            const executor = new QueryExecutor(mockPrisma);

            const builder = (params: Record<string, any>) => ({
                model: 'product',
                operation: 'findMany' as const,
                args: { where: { deletedAt: null }, take: params.limit },
            });

            const result = await executor.executeFromBuilder(builder, { limit: 10 });

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });
    });

    describe('options', () => {
        it('should allow updating options', () => {
            const executor = new QueryExecutor(mockPrisma);

            executor.setOptions({ maxRows: 25 });
            const options = executor.getOptions();

            expect(options.maxRows).toBe(25);
            expect(options.timeoutMs).toBe(30000); // Unchanged
        });
    });

    describe('singleton', () => {
        beforeEach(() => {
            resetQueryExecutor();
        });

        it('should return same instance', () => {
            const instance1 = getQueryExecutor(mockPrisma);
            const instance2 = getQueryExecutor();

            expect(instance1).toBe(instance2);
        });

        it('should reset singleton correctly', () => {
            const instance1 = getQueryExecutor(mockPrisma);
            resetQueryExecutor();
            const instance2 = getQueryExecutor(mockPrisma);

            expect(instance1).not.toBe(instance2);
        });
    });
});
