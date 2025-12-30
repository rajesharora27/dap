/**
 * GraphQL Query Complexity Plugin
 * 
 * Limits query complexity to prevent resource exhaustion attacks
 * and ensure predictable query performance.
 * 
 * @module shared/graphql/queryComplexity
 */

import { 
    getComplexity, 
    simpleEstimator, 
    fieldExtensionsEstimator 
} from 'graphql-query-complexity';
import { GraphQLSchema, separateOperations } from 'graphql';
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';

/**
 * Configuration for query complexity limits
 */
interface ComplexityConfig {
    /** Maximum allowed complexity per query */
    maxComplexity: number;
    /** Warn threshold (log warning but allow) */
    warnThreshold: number;
    /** Whether to throw errors or just log */
    enforceLimit: boolean;
}

/**
 * Default complexity configuration
 */
const defaultConfig: ComplexityConfig = {
    maxComplexity: 1000,
    warnThreshold: 500,
    enforceLimit: process.env.NODE_ENV === 'production',
};

/**
 * Field complexity costs for different types of operations
 * Higher costs for operations that load more data
 */
const fieldCosts = {
    // List queries that can return many items
    products: 10,
    solutions: 10,
    customers: 10,
    tasks: 10,
    users: 10,
    tags: 5,
    outcomes: 5,
    licenses: 5,
    releases: 5,
    
    // Single item queries
    product: 5,
    solution: 5,
    customer: 5,
    task: 3,
    user: 3,
    
    // Nested fields
    productTasks: 20, // Can be expensive
    solutionProducts: 15,
    customerProducts: 15,
    customerSolutions: 15,
    
    // Default field cost
    default: 1,
};

/**
 * Get the complexity cost for a field
 */
function getFieldCost(fieldName: string): number {
    return (fieldCosts as Record<string, number>)[fieldName] || fieldCosts.default;
}

/**
 * Creates an Apollo Server plugin that validates query complexity
 * before execution.
 * 
 * @param schema - The GraphQL schema
 * @param config - Optional configuration overrides
 * @returns Apollo Server plugin
 * 
 * @example
 * ```typescript
 * const server = new ApolloServer({
 *   schema,
 *   plugins: [
 *     queryComplexityPlugin(schema, { maxComplexity: 500 }),
 *   ],
 * });
 * ```
 */
export function queryComplexityPlugin(
    schema: GraphQLSchema,
    config: Partial<ComplexityConfig> = {}
): ApolloServerPlugin {
    const { maxComplexity, warnThreshold, enforceLimit } = {
        ...defaultConfig,
        ...config,
    };

    return {
        async requestDidStart(): Promise<GraphQLRequestListener<any>> {
            return {
                async didResolveOperation({ request, document }) {
                    if (!document) return;

                    const query = request.operationName
                        ? separateOperations(document)[request.operationName]
                        : document;

                    if (!query) return;

                    try {
                        const complexity = getComplexity({
                            schema,
                            query,
                            variables: request.variables || {},
                            estimators: [
                                // Use field extensions if defined in schema
                                fieldExtensionsEstimator(),
                                // Fallback to simple estimator with custom costs
                                simpleEstimator({
                                    defaultComplexity: 1,
                                }),
                            ],
                        });

                        // Log complexity for monitoring
                        const operationName = request.operationName || 'anonymous';
                        
                        if (complexity > warnThreshold) {
                            console.warn(
                                `[QueryComplexity] High complexity query: ${operationName} ` +
                                `(complexity: ${complexity}, threshold: ${warnThreshold})`
                            );
                        }

                        // Reject overly complex queries in production
                        if (complexity > maxComplexity && enforceLimit) {
                            throw new Error(
                                `Query complexity ${complexity} exceeds maximum allowed complexity of ${maxComplexity}. ` +
                                `Please simplify your query or use pagination.`
                            );
                        }

                        // Add complexity to request context for logging
                        if (complexity > 100) {
                            console.info(
                                `[QueryComplexity] ${operationName}: ${complexity}/${maxComplexity}`
                            );
                        }
                    } catch (error) {
                        // If complexity calculation fails, log but don't block
                        if ((error as Error).message.includes('exceeds maximum')) {
                            throw error;
                        }
                        console.error('[QueryComplexity] Error calculating complexity:', error);
                    }
                },
            };
        },
    };
}

/**
 * Depth limiting plugin for GraphQL queries
 * Prevents deeply nested queries that could cause performance issues.
 */
export function queryDepthPlugin(maxDepth: number = 10): ApolloServerPlugin {
    return {
        async requestDidStart(): Promise<GraphQLRequestListener<any>> {
            return {
                async didResolveOperation({ request, document }) {
                    if (!document) return;

                    const depth = calculateQueryDepth(document);
                    
                    if (depth > maxDepth) {
                        throw new Error(
                            `Query depth ${depth} exceeds maximum allowed depth of ${maxDepth}. ` +
                            `Please reduce nesting in your query.`
                        );
                    }
                },
            };
        },
    };
}

/**
 * Calculate the maximum depth of a GraphQL query
 */
function calculateQueryDepth(document: any, maxDepth: number = 0): number {
    let depth = 0;

    function traverse(node: any, currentDepth: number) {
        if (currentDepth > depth) {
            depth = currentDepth;
        }

        if (node.selectionSet) {
            for (const selection of node.selectionSet.selections) {
                if (selection.kind === 'Field') {
                    traverse(selection, currentDepth + 1);
                } else if (selection.kind === 'InlineFragment' || selection.kind === 'FragmentSpread') {
                    traverse(selection, currentDepth);
                }
            }
        }
    }

    if (document.definitions) {
        for (const definition of document.definitions) {
            if (definition.kind === 'OperationDefinition') {
                traverse(definition, 0);
            }
        }
    }

    return depth;
}

/**
 * Export configuration for use in other modules
 */
export { ComplexityConfig, fieldCosts };

