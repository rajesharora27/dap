/**
 * ResponseFormatter Unit Tests
 * 
 * Tests for the response formatting functionality in the AI Agent.
 * 
 * @module services/ai/__tests__/ResponseFormatter.test
 */

import {
    ResponseFormatter,
    getResponseFormatter,
    resetResponseFormatter,
    FormatOptions
} from '../ResponseFormatter';
import { QueryTemplate, TemplateMatch } from '../types';
import { QueryExecutionResult } from '../QueryExecutor';

describe('ResponseFormatter', () => {
    let formatter: ResponseFormatter;

    // Sample template for testing
    const sampleTemplate: QueryTemplate = {
        id: 'list_products',
        description: 'List all products in the system',
        patterns: [/show.*products/i],
        category: 'products',
        buildQuery: () => ({ model: 'product', operation: 'findMany', args: {} }),
        parameters: [],
        examples: ['Show me all products'],
    };

    const sampleMatch: TemplateMatch = {
        template: sampleTemplate,
        params: {},
        confidence: 0.95,
    };

    beforeEach(() => {
        resetResponseFormatter();
        formatter = new ResponseFormatter();
    });

    describe('constructor', () => {
        it('should create instance with default options', () => {
            expect(formatter).toBeInstanceOf(ResponseFormatter);
        });

        it('should accept custom options', () => {
            const customFormatter = new ResponseFormatter({
                maxPreviewItems: 10,
                style: 'table',
            });
            expect(customFormatter).toBeInstanceOf(ResponseFormatter);
        });
    });

    describe('formatSuccess', () => {
        it('should format array results correctly', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: [
                    { id: '1', name: 'Product A', description: 'First product' },
                    { id: '2', name: 'Product B', description: 'Second product' },
                ],
                rowCount: 2,
                truncated: false,
                executionTimeMs: 50,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 50);

            expect(response.answer).toContain('List all products');
            expect(response.answer).toContain('Found 2 products');
            expect(response.answer).toContain('Product A');
            expect(response.answer).toContain('Product B');
            expect(response.data).toEqual([
                { id: '1', name: 'Product A', description: 'First product', _type: 'products' },
                { id: '2', name: 'Product B', description: 'Second product', _type: 'products' },
            ]);
            expect(response.metadata?.rowCount).toBe(2);
            expect(response.metadata?.templateUsed).toBe('list_products');
        });

        it('should format empty results correctly', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: [],
                rowCount: 0,
                truncated: false,
                executionTimeMs: 25,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 25);

            expect(response.answer).toContain('No products found');
            expect(response.metadata?.rowCount).toBe(0);
        });

        it('should format single object result correctly', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: { name: 'Product A', description: 'A great product' },
                rowCount: 1,
                truncated: false,
                executionTimeMs: 30,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 30);

            expect(response.answer).toContain('Product A');
            expect(response.answer).toContain('Result');
        });

        it('should format count/number result correctly', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: 42,
                rowCount: 1,
                truncated: false,
                executionTimeMs: 15,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 15);

            expect(response.answer).toContain('Count');
            expect(response.answer).toContain('42');
        });

        it('should format aggregate object result correctly', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: { products: 10, solutions: 5, customers: 20 },
                rowCount: 3,
                truncated: false,
                executionTimeMs: 40,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 40);

            expect(response.answer).toContain('Products');
            expect(response.answer).toContain('10');
            expect(response.answer).toContain('Solutions');
            expect(response.answer).toContain('5');
            expect(response.answer).toContain('Customers');
            expect(response.answer).toContain('20');
        });

        it('should show truncation warning when results are truncated', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: Array(10).fill({ id: '1', name: 'Product' }),
                rowCount: 100,
                truncated: true,
                executionTimeMs: 100,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 100);

            expect(response.answer).toContain('truncated');
            expect(response.answer).toContain('100');
        });

        it('should include confidence percentage', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: [{ name: 'Test' }],
                rowCount: 1,
                truncated: false,
                executionTimeMs: 20,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 20);

            expect(response.answer).toContain('95%');
        });

        it('should generate suggestions', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: [{ name: 'Test' }],
                rowCount: 1,
                truncated: false,
                executionTimeMs: 20,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 20);

            expect(response.suggestions).toBeDefined();
            expect(response.suggestions!.length).toBeGreaterThan(0);
        });
    });

    describe('formatError', () => {
        it('should format error response correctly', () => {
            const response = formatter.formatError(
                sampleTemplate,
                'Database connection failed',
                50
            );

            expect(response.answer).toContain('Query Failed');
            expect(response.answer).toContain('Database connection failed');
            expect(response.error).toBe('Database connection failed');
            expect(response.suggestions).toBeDefined();
        });
    });

    describe('formatAccessDenied', () => {
        it('should format access denied response for CSS user', () => {
            const response = formatter.formatAccessDenied(
                sampleTemplate,
                'CSS',
                'Access to customers only',
                30
            );

            expect(response.answer).toContain('Access Denied');
            expect(response.answer).toContain('CSS');
            expect(response.suggestions).toBeDefined();
            expect(response.suggestions!.some(s => s.toLowerCase().includes('customer'))).toBe(true);
        });

        it('should format access denied response for SME user', () => {
            const response = formatter.formatAccessDenied(
                sampleTemplate,
                'SME',
                'Access to products and solutions',
                30
            );

            expect(response.answer).toContain('Access Denied');
            expect(response.answer).toContain('SME');
            expect(response.suggestions!.some(s => s.toLowerCase().includes('product'))).toBe(true);
        });
    });

    describe('formatNoMatch', () => {
        it('should format no match response correctly', () => {
            const response = formatter.formatNoMatch(
                'What is the meaning of life?',
                ['Show me all products', 'List customers'],
                20
            );

            expect(response.answer).toContain("couldn't find");
            expect(response.answer).toContain('What is the meaning of life?');
            expect(response.answer).toContain('Products');
            expect(response.answer).toContain('Customers');
            expect(response.suggestions).toEqual(['Show me all products', 'List customers']);
        });
    });

    describe('formatDataItem', () => {
        it('should format item with name and description', () => {
            const item = { name: 'Test Product', description: 'A test product description' };
            const result = formatter.formatDataItem(item, 'products');

            expect(result).toContain('Test Product');
            expect(result).toContain('A test product');
        });

        it('should format item with _count', () => {
            const item = {
                name: 'Product',
                _count: { tasks: 5, telemetryAttributes: 3 },
            };
            const result = formatter.formatDataItem(item, 'products');

            expect(result).toContain('5 tasks');
            expect(result).toContain('3 telemetryAttributes');
        });

        it('should format item with nested tasks', () => {
            const item = {
                name: 'Product',
                tasks: [{ name: 'Task 1' }, { name: 'Task 2' }],
            };
            const result = formatter.formatDataItem(item, 'products');

            expect(result).toContain('Tasks:');
            expect(result).toContain('Task 1');
            expect(result).toContain('Task 2');
        });

        it('should format item with adoption progress', () => {
            const item = {
                name: 'Customer',
                adoptionPlan: { progressPercentage: 75 },
            };
            const result = formatter.formatDataItem(item, 'customers');

            expect(result).toContain('Progress');
            expect(result).toContain('75%');
            expect(result).toContain('█'); // Progress bar
        });

        it('should handle primitive values', () => {
            const result = formatter.formatDataItem('simple string', 'products');
            expect(result).toContain('simple string');
        });

        it('should handle null/undefined', () => {
            const result = formatter.formatDataItem(null, 'products');
            expect(result).toContain('null');
        });
    });

    describe('formatEntityName', () => {
        it('should convert camelCase to Title Case', () => {
            expect(formatter.formatEntityName('productName')).toBe('Product Name');
            expect(formatter.formatEntityName('telemetryAttributes')).toBe('Telemetry Attributes');
        });

        it('should handle snake_case', () => {
            expect(formatter.formatEntityName('product_name')).toBe('Product name');
        });

        it('should handle single words', () => {
            expect(formatter.formatEntityName('products')).toBe('Products');
        });
    });

    describe('formatSummary', () => {
        it('should format statistics summary', () => {
            const stats = {
                products: 10,
                solutions: 5,
                customers: 100,
            };

            const result = formatter.formatSummary(stats);

            expect(result).toContain('Data Summary');
            expect(result).toContain('Products');
            expect(result).toContain('10');
            expect(result).toContain('Solutions');
            expect(result).toContain('5');
            expect(result).toContain('Customers');
            expect(result).toContain('100');
        });

        it('should format large numbers with locale', () => {
            const stats = { customers: 1000000 };
            const result = formatter.formatSummary(stats);

            expect(result).toContain('1,000,000');
        });
    });

    describe('generateSuggestions', () => {
        it('should generate category-related suggestions', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: [{ name: 'Test' }],
                rowCount: 1,
                truncated: false,
                executionTimeMs: 20,
            };

            const suggestions = formatter.generateSuggestions(sampleTemplate, result);

            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.length).toBeLessThanOrEqual(4);
        });

        it('should suggest showing all items when empty results', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: [],
                rowCount: 0,
                truncated: false,
                executionTimeMs: 20,
            };

            const suggestions = formatter.generateSuggestions(sampleTemplate, result);

            expect(suggestions.some(s => s.includes('all'))).toBe(true);
        });
    });

    describe('Singleton', () => {
        beforeEach(() => {
            resetResponseFormatter();
        });

        it('should return same instance on subsequent calls', () => {
            const instance1 = getResponseFormatter();
            const instance2 = getResponseFormatter();
            expect(instance1).toBe(instance2);
        });

        it('should create new instance after reset', () => {
            const instance1 = getResponseFormatter();
            resetResponseFormatter();
            const instance2 = getResponseFormatter();
            expect(instance1).not.toBe(instance2);
        });
    });

    describe('Table formatting', () => {
        it('should format data as table when style is table', () => {
            const tableFormatter = new ResponseFormatter({ style: 'table' });
            const result: QueryExecutionResult = {
                success: true,
                data: [
                    { name: 'Product A', description: 'First' },
                    { name: 'Product B', description: 'Second' },
                ],
                rowCount: 2,
                truncated: false,
                executionTimeMs: 30,
            };

            const response = tableFormatter.formatSuccess(sampleMatch, result, 30);

            // Table should have headers
            expect(response.answer).toContain('|');
            expect(response.answer).toContain('---');
        });
    });

    describe('Different categories', () => {
        it('should use correct emoji for products', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: [{ name: 'Test' }],
                rowCount: 1,
                truncated: false,
                executionTimeMs: 20,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 20);
            expect(response.answer).toContain('📦');
        });

        it('should use correct emoji for customers', () => {
            const customerTemplate: QueryTemplate = {
                ...sampleTemplate,
                id: 'list_customers',
                category: 'customers',
            };
            const customerMatch: TemplateMatch = {
                template: customerTemplate,
                params: {},
                confidence: 0.9,
            };
            const result: QueryExecutionResult = {
                success: true,
                data: [{ name: 'Customer A' }],
                rowCount: 1,
                truncated: false,
                executionTimeMs: 20,
            };

            const response = formatter.formatSuccess(customerMatch, result, 20);
            expect(response.answer).toContain('👥');
        });

        it('should use correct emoji for solutions', () => {
            const solutionTemplate: QueryTemplate = {
                ...sampleTemplate,
                id: 'list_solutions',
                category: 'solutions',
            };
            const solutionMatch: TemplateMatch = {
                template: solutionTemplate,
                params: {},
                confidence: 0.9,
            };
            const result: QueryExecutionResult = {
                success: true,
                data: [{ name: 'Solution A' }],
                rowCount: 1,
                truncated: false,
                executionTimeMs: 20,
            };

            const response = formatter.formatSuccess(solutionMatch, result, 20);
            expect(response.answer).toContain('🧩');
        });
    });

    describe('Link Generation and Type Injection', () => {
        it('should inject _type into sanitized data for products', () => {
            const result: QueryExecutionResult = {
                success: true,
                data: [{ id: 'p1', name: 'Product A' }],
                rowCount: 1,
                truncated: false,
                executionTimeMs: 20,
            };

            const response = formatter.formatSuccess(sampleMatch, result, 20);
            expect(response.data![0]._type).toBe('products');
        });

        it('should inject _type into sanitized data for customers', () => {
            const customerTemplate: QueryTemplate = {
                ...sampleTemplate,
                id: 'list_customers',
                category: 'customers',
            };
            const customerMatch: TemplateMatch = {
                template: customerTemplate,
                params: {},
                confidence: 0.9,
            };
            const result: QueryExecutionResult = {
                success: true,
                data: [{ id: 'c1', name: 'Customer A' }],
                rowCount: 1,
                truncated: false,
                executionTimeMs: 20,
            };

            const response = formatter.formatSuccess(customerMatch, result, 20);
            expect(response.data![0]._type).toBe('customers');
        });

        it('should use separate spans for navigation in tables', () => {
            const tableFormatter = new ResponseFormatter({ style: 'table' });
            const result: QueryExecutionResult = {
                success: true,
                data: [{ id: 'p1', name: 'Product A' }],
                rowCount: 1,
                truncated: false,
                executionTimeMs: 20,
            };

            const response = tableFormatter.formatSuccess(sampleMatch, result, 20);
            // It should have data-navigate="products:p1"
            expect(response.answer).toContain('data-navigate="products:p1"');
        });
    });
});
