/**
 * Query Executor
 * 
 * Safely executes Prisma queries from templates or LLM-generated queries.
 * Includes timeout handling, row limits, and read-only enforcement.
 * 
 * @module services/ai/QueryExecutor
 * @version 1.0.0
 * @created 2025-12-06
 */

import { PrismaClient } from '@prisma/client';
import { prisma as sharedPrisma } from '../../shared/graphql/context';

// Always use the shared Prisma instance to prevent connection pool exhaustion
const defaultPrisma = sharedPrisma;

/**
 * Query configuration from templates
 */
export interface QueryConfig {
    /** The Prisma model to query */
    model: string;
    /** The operation (findMany, findUnique, count, etc.) */
    operation: 'findMany' | 'findUnique' | 'count' | 'aggregate';
    /** Arguments to pass to the Prisma operation */
    args: any;
}

/**
 * Result of query execution
 */
export interface QueryExecutionResult {
    /** Query was successful */
    success: boolean;
    /** The query results (array for findMany, single object for findUnique, number for count) */
    data: any;
    /** Number of rows returned */
    rowCount: number;
    /** Whether results were truncated due to row limit */
    truncated: boolean;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error message if the query failed */
    error?: string;
}

/**
 * Executor options
 */
export interface QueryExecutorOptions {
    /** Maximum rows to return (default: 100) */
    maxRows?: number;
    /** Timeout in milliseconds (default: 30000) */
    timeoutMs?: number;
    /** Allow mutations (default: false - read-only) */
    allowMutations?: boolean;
}

const DEFAULT_OPTIONS: Required<QueryExecutorOptions> = {
    maxRows: 100,
    timeoutMs: 30000,
    allowMutations: false,
};

/**
 * Allowed read-only operations
 */
const ALLOWED_OPERATIONS = ['findMany', 'findUnique', 'findFirst', 'count', 'aggregate', 'groupBy'];

/**
 * Valid Prisma model names (for safety)
 */
const VALID_MODELS = [
    'product', 'solution', 'customer', 'task', 'user',
    'telemetryAttribute', 'license', 'outcome', 'release',
    'customerProduct', 'customerSolution', 'adoptionPlan',
    'customerTask', 'customerTelemetryAttribute', 'customAttribute',
    'customerSolutionTask', 'customerSolutionTelemetryAttribute',
    'auditLog', 'session', 'taskStatus', 'permission', 'resourceAssignment',
];

/**
 * Query Executor
 * 
 * Executes Prisma queries safely with timeout, row limits, and read-only enforcement.
 * 
 * @example
 * ```typescript
 * const executor = new QueryExecutor();
 * const result = await executor.executeFromTemplate('list_products', {});
 * console.log(result.data); // Array of products
 * ```
 */
export class QueryExecutor {
    private prisma: any;
    private options: Required<QueryExecutorOptions>;

    /**
     * Create a new Query Executor
     * @param prisma - The Prisma client to use (defaults to shared instance)
     * @param options - Executor options
     */
    constructor(prisma?: any, options: QueryExecutorOptions = {}) {
        this.prisma = prisma || defaultPrisma;
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Execute a query from a QueryConfig
     * @param config - The query configuration
     * @returns The execution result
     */
    async execute(config: QueryConfig): Promise<QueryExecutionResult> {
        const startTime = Date.now();

        try {
            // Validate the query config
            this.validateConfig(config);

            // Handle special "aggregate" model for multi-table counts
            if (config.model === 'aggregate' && config.operation === 'count') {
                return this.executeAggregateCount(config, startTime);
            }

            // Execute the query with timeout
            const data = await this.executeWithTimeout(config);

            // Apply row limits if it's an array
            let truncated = false;
            let resultData = data;
            let rowCount = 0;

            if (Array.isArray(data)) {
                rowCount = data.length;
                if (data.length > this.options.maxRows) {
                    resultData = data.slice(0, this.options.maxRows);
                    truncated = true;
                }
            } else if (typeof data === 'number') {
                // Count result
                rowCount = 1;
                resultData = data;
            } else if (data !== null) {
                // Single object result
                rowCount = 1;
                resultData = data;
            }

            return {
                success: true,
                data: resultData,
                rowCount,
                truncated,
                executionTimeMs: Date.now() - startTime,
            };

        } catch (error: any) {
            return {
                success: false,
                data: null,
                rowCount: 0,
                truncated: false,
                executionTimeMs: Date.now() - startTime,
                error: this.sanitizeError(error),
            };
        }
    }

    /**
     * Execute a query using a template ID and parameters
     * @param templateId - The template ID (from QueryTemplates)
     * @param buildQueryFn - Function that builds the query config
     * @param params - Parameters to pass to the build function
     * @returns The execution result
     */
    async executeFromBuilder(
        buildQueryFn: (params: Record<string, any>) => QueryConfig,
        params: Record<string, any> = {}
    ): Promise<QueryExecutionResult> {
        const config = buildQueryFn(params);
        return this.execute(config);
    }

    /**
     * Validate the query configuration
     * @param config - The query config to validate
     * @throws Error if config is invalid
     */
    private validateConfig(config: QueryConfig): void {
        // Special case for aggregate counts
        if (config.model === 'aggregate') {
            if (config.operation !== 'count') {
                throw new Error(`Invalid operation for aggregate: ${config.operation}`);
            }
            return;
        }

        // Validate model name (case-insensitive)
        const modelLower = config.model.toLowerCase();
        const validModelsLower = VALID_MODELS.map(m => m.toLowerCase());
        if (!validModelsLower.includes(modelLower)) {
            throw new Error(`Invalid model: ${config.model}`);
        }

        // Validate operation
        if (!ALLOWED_OPERATIONS.includes(config.operation)) {
            throw new Error(`Operation not allowed: ${config.operation}`);
        }

        // Check for mutations if not allowed
        if (!this.options.allowMutations) {
            const mutationKeywords = ['create', 'update', 'delete', 'upsert'];
            const operationLower = config.operation.toLowerCase();
            if (mutationKeywords.some(k => operationLower.includes(k))) {
                throw new Error('Mutations are not allowed');
            }
        }
    }

    /**
     * Execute a query with timeout
     * @param config - The query configuration
     * @returns The query result
     */
    private async executeWithTimeout(config: QueryConfig): Promise<any> {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Query timeout after ${this.options.timeoutMs}ms`));
            }, this.options.timeoutMs);
        });

        const queryPromise = this.executeQuery(config);

        return Promise.race([queryPromise, timeoutPromise]);
    }

    /**
     * Execute the actual Prisma query
     * @param config - The query configuration
     * @returns The query result
     */
    private async executeQuery(config: QueryConfig): Promise<any> {
        // Get the model from Prisma client
        const modelName = this.toPrismaModelName(config.model);
        const model = this.prisma[modelName];

        if (!model) {
            throw new Error(`Model not found: ${config.model} (tried: ${modelName})`);
        }

        const operation = model[config.operation];
        if (!operation) {
            throw new Error(`Operation not found: ${config.operation} on ${modelName}`);
        }

        // Apply row limit to findMany queries
        let args = { ...config.args };
        if (config.operation === 'findMany') {
            // Add take limit if not already specified, add 1 to detect truncation
            if (!args.take || args.take > this.options.maxRows) {
                args.take = this.options.maxRows + 1;
            }
        }

        // Execute the query
        return operation.call(model, args);
    }

    /**
     * Execute aggregate count across multiple models
     * @param config - The query configuration with models array
     * @param startTime - When execution started
     * @returns Count results for all models
     */
    private async executeAggregateCount(
        config: QueryConfig,
        startTime: number
    ): Promise<QueryExecutionResult> {
        const { models } = config.args || {};

        if (!models || !Array.isArray(models)) {
            return {
                success: false,
                data: null,
                rowCount: 0,
                truncated: false,
                executionTimeMs: Date.now() - startTime,
                error: 'Models array is required for aggregate count',
            };
        }

        try {
            const counts: Record<string, number> = {};

            // Execute count queries in parallel
            const countPromises = models.map(async (modelName: string) => {
                const prismaModelName = this.toPrismaModelName(modelName);
                const model = this.prisma[prismaModelName];

                if (!model || !model.count) {
                    counts[modelName] = -1; // Indicate error
                    return;
                }

                try {
                    // Most models should filter out deleted items
                    const hasDeletedAt = ['product', 'solution', 'customer', 'task'].includes(modelName.toLowerCase());
                    const countArgs = hasDeletedAt ? { where: { deletedAt: null } } : {};
                    counts[modelName] = await model.count(countArgs);
                } catch (e) {
                    counts[modelName] = -1;
                }
            });

            await Promise.all(countPromises);

            return {
                success: true,
                data: counts,
                rowCount: Object.keys(counts).length,
                truncated: false,
                executionTimeMs: Date.now() - startTime,
            };

        } catch (error: any) {
            return {
                success: false,
                data: null,
                rowCount: 0,
                truncated: false,
                executionTimeMs: Date.now() - startTime,
                error: this.sanitizeError(error),
            };
        }
    }

    /**
     * Convert model name to Prisma client model name
     * Prisma uses camelCase for model names
     * @param modelName - The model name from config
     * @returns The Prisma client model name
     */
    private toPrismaModelName(modelName: string): string {
        // Handle already correct names
        if (this.prisma[modelName]) {
            return modelName;
        }

        // Convert first character to lowercase for Prisma client
        const camelCase = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        if (this.prisma[camelCase]) {
            return camelCase;
        }

        // Try lowercase
        const lowerCase = modelName.toLowerCase();
        if (this.prisma[lowerCase]) {
            return lowerCase;
        }

        // Return original and let it fail with a clear error
        return modelName;
    }

    /**
     * Sanitize error messages to avoid leaking sensitive information
     * @param error - The error object
     * @returns A safe error message
     */
    private sanitizeError(error: any): string {
        const message = error.message || 'Unknown error';

        // Remove any potential header/stack trace from Prisma
        const cleanMessage = message.split('\n')[0];

        // Specific user-friendly mappings
        if (cleanMessage.includes('Invalid') && cleanMessage.includes('invocation')) {
            return 'I couldn\'t structure the query correctly. Please try rephrasing your question.';
        }

        if (cleanMessage.includes('Unknown argument')) {
            return 'I tried to access a field that doesn\'t exist. Please try asking about specific fields.';
        }

        if (cleanMessage.includes('unique constraint')) {
            return 'This item already exists.';
        }

        if (cleanMessage.includes('Record to update not found') || cleanMessage.includes('Record to delete not found')) {
            return 'The item you are referring to could not be found.';
        }

        // Generic sanitization for internal technical codes
        if (message.includes('PRISMA_') || message.includes('P20')) { // Prisma error codes start with P20..
            return 'A database error occurred.';
        }

        if (message.includes('connect')) {
            return 'Database connection error. Please check your connection.';
        }

        // Keep timeout and explicit validation errors as-is but cleaner
        if (message.includes('timeout')) {
            return 'The query took too long to complete.';
        }

        if (message.includes('not allowed')) {
            return message; // RBAC messages are usually already friendly
        }

        // Generic fallback for other errors
        if (message.length > 200) {
            return 'Query execution failed.';
        }

        return cleanMessage;
    }

    /**
     * Get the current options
     */
    getOptions(): Required<QueryExecutorOptions> {
        return { ...this.options };
    }

    /**
     * Update options
     */
    setOptions(options: QueryExecutorOptions): void {
        this.options = { ...this.options, ...options };
    }
}

// Export singleton instance
let instance: QueryExecutor | null = null;

/**
 * Get the singleton Query Executor instance
 * @param prisma - Optional Prisma client (only used on first call)
 * @param options - Optional options (only used on first call)
 */
export function getQueryExecutor(
    prisma?: any,
    options?: QueryExecutorOptions
): QueryExecutor {
    if (!instance) {
        instance = new QueryExecutor(prisma, options);
    }
    return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetQueryExecutor(): void {
    instance = null;
}
