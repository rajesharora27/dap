/**
 * Query Templates
 * 
 * Pre-defined query templates for common natural language questions.
 * These templates provide safe, tested queries that don't require LLM generation.
 * 
 * @module services/ai/QueryTemplates
 * @version 1.0.0
 * @created 2025-12-05
 */

import { QueryTemplate, TemplateMatch, ParameterDefinition } from './types';

/**
 * Query Templates Manager
 * 
 * Manages pre-defined query templates and matches user questions to them.
 */
export class QueryTemplates {
  private templates: QueryTemplate[];

  constructor() {
    this.templates = this.buildTemplates();
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): QueryTemplate[] {
    return this.templates;
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): QueryTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * Find the best matching template for a question
   * @param question - The natural language question
   * @returns The best match with extracted parameters, or null if no match
   */
  findBestMatch(question: string): TemplateMatch | null {
    const normalizedQuestion = question.toLowerCase().trim();
    
    let bestMatch: TemplateMatch | null = null;
    let bestConfidence = 0;

    for (const template of this.templates) {
      for (const pattern of template.patterns) {
        const match = normalizedQuestion.match(pattern);
        if (match) {
          // Calculate confidence based on pattern specificity
          const confidence = this.calculateConfidence(pattern, normalizedQuestion);
          
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = {
              template,
              params: this.extractParameters(template, normalizedQuestion, match),
              confidence,
            };
          }
        }
      }
    }

    // Only return matches with confidence above threshold
    if (bestMatch && bestMatch.confidence >= 0.5) {
      return bestMatch;
    }

    return null;
  }

  /**
   * Calculate confidence score for a pattern match
   */
  private calculateConfidence(pattern: RegExp, question: string): number {
    const match = question.match(pattern);
    if (!match) return 0;

    // Base confidence from match length vs question length
    const matchLength = match[0].length;
    const questionLength = question.length;
    const coverage = matchLength / questionLength;

    // Bonus for specific keywords
    let bonus = 0;
    if (question.includes('show') || question.includes('list') || question.includes('find')) {
      bonus += 0.1;
    }
    if (question.includes('all')) {
      bonus += 0.05;
    }

    return Math.min(coverage + bonus, 1.0);
  }

  /**
   * Extract parameters from a matched question
   */
  private extractParameters(
    template: QueryTemplate,
    question: string,
    match: RegExpMatchArray
  ): Record<string, any> {
    const params: Record<string, any> = {};

    for (const paramDef of template.parameters) {
      if (paramDef.extractPattern) {
        const paramMatch = question.match(paramDef.extractPattern);
        if (paramMatch && paramMatch[1]) {
          params[paramDef.name] = this.parseParameterValue(paramMatch[1], paramDef.type);
        } else if (paramDef.defaultValue !== undefined) {
          params[paramDef.name] = paramDef.defaultValue;
        }
      } else if (paramDef.defaultValue !== undefined) {
        params[paramDef.name] = paramDef.defaultValue;
      }
    }

    return params;
  }

  /**
   * Parse a parameter value to the correct type
   */
  private parseParameterValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }

  /**
   * Build all query templates
   */
  private buildTemplates(): QueryTemplate[] {
    return [
      // ============================================================
      // PRODUCTS CATEGORY
      // ============================================================
      
      // Template 1: List all products
      {
        id: 'list_products',
        description: 'List all products in the system',
        patterns: [
          /(?:show|list|get|display)\s+(?:me\s+)?(?:all\s+)?(?:the\s+)?products?(?:\s+we\s+have)?/i,
          /what\s+products?\s+(?:do\s+we\s+have|are\s+there|exist)/i,
          /products?\s+list/i,
        ],
        category: 'products',
        buildQuery: () => ({
          model: 'product',
          operation: 'findMany',
          args: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
              _count: {
                select: {
                  tasks: true,
                  customers: true,
                },
              },
            },
            orderBy: { name: 'asc' },
          },
        }),
        parameters: [],
        examples: [
          'Show me all products',
          'List products',
          'What products do we have?',
        ],
      },

      // Template 2: Products without telemetry
      {
        id: 'products_without_telemetry',
        description: 'Find products that have tasks without telemetry attributes configured',
        patterns: [
          /products?\s+(?:without|missing|with\s+no)\s+telemetry/i,
          /products?\s+(?:that\s+)?(?:have|with)\s+tasks?\s+(?:without|missing|with\s+no)\s+telemetry/i,
          /(?:find|show|list)\s+products?\s+(?:without|missing|with\s+no)\s+telemetry/i,
          /products?\s+(?:that\s+)?have\s+no\s+telemetry/i,
        ],
        category: 'products',
        buildQuery: () => ({
          model: 'product',
          operation: 'findMany',
          args: {
            where: {
              deletedAt: null,
              tasks: {
                some: {
                  deletedAt: null,
                  telemetryAttributes: { none: {} },
                },
              },
            },
            select: {
              id: true,
              name: true,
              description: true,
              tasks: {
                where: {
                  deletedAt: null,
                  telemetryAttributes: { none: {} },
                },
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        }),
        parameters: [],
        examples: [
          'Show products without telemetry',
          'Find products with tasks missing telemetry',
          'Products with no telemetry configured',
        ],
      },

      // Template 3: Products without customers
      {
        id: 'products_without_customers',
        description: 'Find products that have no customers assigned',
        patterns: [
          /products?\s+(?:with(?:out)?|with\s+no|missing)\s+customers?/i,
          /products?\s+(?:not\s+)?assigned\s+to\s+(?:any\s+)?customers?/i,
          /(?:find|show|list)\s+products?\s+(?:with(?:out)?|with\s+no)\s+customers?/i,
          /unassigned\s+products?/i,
        ],
        category: 'products',
        buildQuery: () => ({
          model: 'product',
          operation: 'findMany',
          args: {
            where: {
              deletedAt: null,
              customers: { none: {} },
            },
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
            },
          },
        }),
        parameters: [],
        examples: [
          'Show products without customers',
          'Find unassigned products',
          'Products with no customers',
        ],
      },

      // ============================================================
      // TASKS CATEGORY
      // ============================================================

      // Template 4: Tasks with zero weight
      {
        id: 'tasks_zero_weight',
        description: 'Find tasks that have zero or no weight assigned',
        patterns: [
          /tasks?\s+with\s+(?:zero|0|no)\s+weight/i,
          /tasks?\s+(?:missing|without)\s+weight/i,
          /(?:find|show|list)\s+tasks?\s+(?:with\s+)?(?:zero|0|no)\s+weight/i,
          /unweighted\s+tasks?/i,
        ],
        category: 'tasks',
        buildQuery: () => ({
          model: 'task',
          operation: 'findMany',
          args: {
            where: {
              deletedAt: null,
              weight: 0,
            },
            select: {
              id: true,
              name: true,
              weight: true,
              product: { select: { id: true, name: true } },
              solution: { select: { id: true, name: true } },
            },
          },
        }),
        parameters: [],
        examples: [
          'Find tasks with zero weight',
          'Show tasks without weight',
          'Tasks with no weight assigned',
        ],
      },

      // Template 5: Tasks missing descriptions
      {
        id: 'tasks_missing_descriptions',
        description: 'Find tasks that have no description',
        patterns: [
          /tasks?\s+(?:with(?:out)?|missing|with\s+no|without\s+a?)\s+descriptions?/i,
          /tasks?\s+(?:that\s+)?(?:have|has)\s+no\s+descriptions?/i,
          /(?:find|show|list)\s+tasks?\s+(?:with(?:out)?|missing)\s+descriptions?/i,
          /incomplete\s+tasks?/i,
        ],
        category: 'tasks',
        buildQuery: () => ({
          model: 'task',
          operation: 'findMany',
          args: {
            where: {
              deletedAt: null,
              OR: [
                { description: null },
                { description: '' },
              ],
            },
            select: {
              id: true,
              name: true,
              description: true,
              product: { select: { id: true, name: true } },
              solution: { select: { id: true, name: true } },
            },
          },
        }),
        parameters: [],
        examples: [
          'Find tasks missing descriptions',
          'Show tasks without descriptions',
          'Tasks with no description',
        ],
      },

      // ============================================================
      // CUSTOMERS CATEGORY
      // ============================================================

      // Template 6: List all customers
      {
        id: 'list_customers',
        description: 'List all customers in the system',
        patterns: [
          /(?:show|list|get|display)\s+(?:me\s+)?(?:all\s+)?customers?/i,
          /what\s+customers?\s+(?:do\s+we\s+have|are\s+there|exist)/i,
          /customers?\s+list/i,
        ],
        category: 'customers',
        buildQuery: () => ({
          model: 'customer',
          operation: 'findMany',
          args: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
              _count: {
                select: {
                  products: true,
                  solutions: true,
                },
              },
            },
            orderBy: { name: 'asc' },
          },
        }),
        parameters: [],
        examples: [
          'Show me all customers',
          'List customers',
          'What customers do we have?',
        ],
      },

      // Template 7: Customers with low adoption
      {
        id: 'customers_low_adoption',
        description: 'Find customers with adoption progress below a threshold',
        patterns: [
          /customers?\s+(?:with\s+)?(?:adoption|progress)\s+(?:below|under|less\s+than)\s+(\d+)/i,
          /customers?\s+(?:with\s+)?low\s+adoption/i,
          /(?:find|show|list)\s+customers?\s+(?:with\s+)?(?:adoption|progress)\s+(?:below|under|<)\s*(\d+)/i,
          /struggling\s+customers?/i,
        ],
        category: 'customers',
        buildQuery: (params: Record<string, any>) => ({
          model: 'customer',
          operation: 'findMany',
          args: {
            where: {
              deletedAt: null,
              products: {
                some: {
                  adoptionPlan: {
                    progressPercentage: { lt: params.threshold || 50 },
                  },
                },
              },
            },
            select: {
              id: true,
              name: true,
              products: {
                select: {
                  id: true,
                  name: true,
                  product: { select: { name: true } },
                  adoptionPlan: {
                    select: {
                      progressPercentage: true,
                      completedTasks: true,
                      totalTasks: true,
                    },
                  },
                },
              },
            },
          },
        }),
        parameters: [
          {
            name: 'threshold',
            type: 'number',
            extractPattern: /(?:below|under|less\s+than|<)\s*(\d+)/i,
            defaultValue: 50,
            required: false,
          },
        ],
        examples: [
          'Show customers with adoption below 50%',
          'Customers with progress under 30%',
          'Find struggling customers',
        ],
      },

      // Template 8: Customers not started
      {
        id: 'customers_not_started',
        description: 'Find customers who haven\'t started their adoption',
        patterns: [
          /customers?\s+(?:that\s+)?(?:have\s+)?(?:not\s+)?started/i,
          /customers?\s+(?:with\s+)?(?:zero|0|no)\s+(?:adoption\s+)?progress/i,
          /(?:find|show|list)\s+customers?\s+(?:not\s+)?started/i,
          /inactive\s+customers?/i,
        ],
        category: 'customers',
        buildQuery: () => ({
          model: 'customer',
          operation: 'findMany',
          args: {
            where: {
              deletedAt: null,
              products: {
                some: {
                  adoptionPlan: {
                    progressPercentage: 0,
                  },
                },
              },
            },
            select: {
              id: true,
              name: true,
              createdAt: true,
              products: {
                select: {
                  name: true,
                  product: { select: { name: true } },
                  adoptionPlan: {
                    select: {
                      totalTasks: true,
                      createdAt: true,
                    },
                  },
                },
              },
            },
          },
        }),
        parameters: [],
        examples: [
          'Show customers not started',
          'Find inactive customers',
          'Customers with zero progress',
        ],
      },

      // ============================================================
      // TELEMETRY CATEGORY
      // ============================================================

      // Template 9: Telemetry without success criteria
      {
        id: 'telemetry_no_criteria',
        description: 'Find telemetry attributes that have no success criteria defined',
        patterns: [
          /telemetry\s+(?:attributes?\s+)?(?:with(?:out)?|missing|with\s+no)\s+(?:success\s+)?criteria/i,
          /(?:find|show|list)\s+telemetry\s+(?:with(?:out)?|missing)\s+criteria/i,
          /unconfigured\s+telemetry/i,
        ],
        category: 'telemetry',
        buildQuery: () => ({
          model: 'telemetryAttribute',
          operation: 'findMany',
          args: {
            where: {
              OR: [
                { successCriteria: { equals: null } },
                { successCriteria: { equals: {} } },
              ],
            },
            select: {
              id: true,
              name: true,
              dataType: true,
              task: {
                select: {
                  id: true,
                  name: true,
                  product: { select: { name: true } },
                  solution: { select: { name: true } },
                },
              },
            },
          },
        }),
        parameters: [],
        examples: [
          'Show telemetry without success criteria',
          'Find telemetry missing criteria',
          'Unconfigured telemetry attributes',
        ],
      },

      // ============================================================
      // ANALYTICS CATEGORY
      // ============================================================

      // Template 10: Count of entities
      {
        id: 'count_entities',
        description: 'Get counts of products, solutions, customers, and tasks',
        patterns: [
          /(?:how\s+many|count\s+of|count|number\s+of)\s*(?:products?|solutions?|customers?|tasks?)?/i,
          /(?:total|overall)\s+(?:products?|solutions?|customers?|tasks?)/i,
          /(?:show|give)\s+(?:me\s+)?(?:the\s+|an\s+)?(?:counts?|overview|summary)/i,
          /summary\s+(?:of\s+)?(?:data|entities|counts)/i,
          /^overview$/i,
          /give\s+(?:me\s+)?(?:an?\s+)?overview/i,
        ],
        category: 'analytics',
        buildQuery: () => ({
          model: 'aggregate',
          operation: 'count',
          args: {
            models: ['product', 'solution', 'customer', 'task'],
          },
        }),
        parameters: [],
        examples: [
          'How many products do we have?',
          'Count of customers',
          'Show me the totals',
          'Give me an overview',
        ],
      },
    ];
  }
}

// Export singleton instance
let instance: QueryTemplates | null = null;

/**
 * Get the singleton Query Templates instance
 */
export function getQueryTemplates(): QueryTemplates {
  if (!instance) {
    instance = new QueryTemplates();
  }
  return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetQueryTemplates(): void {
  instance = null;
}

