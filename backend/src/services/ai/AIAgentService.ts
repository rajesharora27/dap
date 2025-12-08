/**
 * AI Agent Service
 * 
 * Main service for processing natural language queries about DAP data.
 * 
 * @module services/ai/AIAgentService
 * @version 1.4.0
 * @created 2025-12-05
 * @updated 2025-12-06 - Phase 2.5: Integrated ResponseFormatter for human-readable outputs
 */

import {
  AIAgentConfig,
  AIQueryRequest,
  AIQueryResponse,
  AIQueryMetadata,
  QueryIntent,
  TemplateMatch,
} from './types';
import { QueryTemplates, getQueryTemplates } from './QueryTemplates';
import { SchemaContextManager, getSchemaContextManager } from './SchemaContextManager';
import { QueryExecutor, getQueryExecutor, QueryExecutionResult, QueryConfig } from './QueryExecutor';
import { RBACFilter, getRBACFilter, RBACUserContext, RBACFilterResult } from './RBACFilter';
import { ResponseFormatter, getResponseFormatter } from './ResponseFormatter';
import { ILLMProvider, getDefaultProvider } from './providers';

/**
 * Default configuration for the AI Agent
 */
const DEFAULT_CONFIG: AIAgentConfig = {
  provider: 'mock',
  model: 'gpt-4o',
  maxTokens: 2000,
  temperature: 0.1,
  timeout: 30000,
  maxRows: 1000,
};

/**
 * AI Agent Service
 * 
 * Processes natural language questions about DAP data and returns
 * human-readable responses with relevant data.
 * 
 * @example
 * ```typescript
 * const service = new AIAgentService();
 * const response = await service.processQuestion({
 *   question: 'Show me all products with tasks without telemetry',
 *   userId: 'user-123',
 *   userRole: 'ADMIN'
 * });
 * console.log(response.answer);
 * ```
 */
export class AIAgentService {
  private config: AIAgentConfig;
  private initialized: boolean = false;
  private queryTemplates: QueryTemplates;
  private schemaContextManager: SchemaContextManager;
  private queryExecutor: QueryExecutor;
  private rbacFilter: RBACFilter;
  private responseFormatter: ResponseFormatter;
  private llmProvider: ILLMProvider | null = null;

  /**
   * Create a new AI Agent Service
   * @param config - Optional configuration overrides
   */
  constructor(config: Partial<AIAgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queryTemplates = getQueryTemplates();
    this.schemaContextManager = getSchemaContextManager();
    this.queryExecutor = getQueryExecutor(undefined, {
      maxRows: this.config.maxRows,
      timeoutMs: this.config.timeout,
    });
    this.rbacFilter = getRBACFilter();
    this.responseFormatter = getResponseFormatter();

    // Initialize LLM provider
    try {
      this.llmProvider = getDefaultProvider();
      console.log(`[AI Agent] Initialized with LLM provider: ${this.llmProvider?.name || 'none'}`);
    } catch (error) {
      console.warn('[AI Agent] Failed to initialize LLM provider:', error);
      this.llmProvider = null;
    }

    // Pre-cache schema context
    this.schemaContextManager.getFullContext();
    this.initialized = true;
  }

  /**
   * Initialize the service
   * Deprecated: Initialization now happens in constructor
   */
  async initialize(): Promise<void> {
    // No-op, already initialized in constructor
    return Promise.resolve();
  }

  /**
   * Check if the service is ready to process queries
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Process a natural language question
   * 
   * This is the main entry point for the AI Agent. It:
   * 1. Tries to match the question to a pre-defined template (fast path)
   * 2. If no match, prepares for LLM query generation (Phase 2)
   * 3. Applies RBAC filters based on user role
   * 4. Executes the query
   * 5. Formats the response
   * 
   * @param request - The query request
   * @returns The query response with answer and data
   */
  async processQuestion(request: AIQueryRequest): Promise<AIQueryResponse> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateRequest(request);

      // Try to match to a template (Tier 1: Fast, safe queries)
      const templateMatch = this.findMatchingTemplate(request.question);

      if (templateMatch) {
        // Template matched - use pre-defined query
        return this.handleTemplateMatch(templateMatch, request, startTime);
      }

      // No template match - use LLM query generation (Phase 2)
      if (this.llmProvider) {
        return this.handleLLMQuery(request, startTime);
      }

      // Fallback to suggestions if no LLM
      return this.handleNoMatch(request, startTime);

    } catch (error: any) {
      return {
        answer: 'I encountered an error processing your question.',
        error: error.message || 'Unknown error',
        metadata: {
          executionTime: Date.now() - startTime,
          rowCount: 0,
          truncated: false,
          cached: false,
        },
      };
    }
  }

  /**
   * Handle a successful template match
   * @param match - The matched template
   * @param request - The original request
   * @param startTime - When processing started
   */
  private async handleTemplateMatch(
    match: TemplateMatch,
    request: AIQueryRequest,
    startTime: number
  ): Promise<AIQueryResponse> {
    const template = match.template;
    const executionTimeMs = () => Date.now() - startTime;

    // Build the Prisma query from the template
    let queryConfig = template.buildQuery(match.params);

    // Apply RBAC filters (read-only access control)
    const userContext: RBACUserContext = {
      userId: request.userId,
      role: request.userRole,
      isAdmin: request.userRole === 'ADMIN',
    };

    const rbacResult = await this.rbacFilter.applyFilter(queryConfig, userContext);

    if (!rbacResult.allowed) {
      // Use ResponseFormatter for access denied message
      return this.responseFormatter.formatAccessDenied(
        template,
        request.userRole,
        this.rbacFilter.getRoleRestrictions(request.userRole),
        executionTimeMs()
      );
    }

    // Use the RBAC-filtered query config
    queryConfig = rbacResult.filteredConfig!;

    // Execute the query using QueryExecutor (read-only)
    const executionResult = await this.queryExecutor.execute(queryConfig);

    // Use ResponseFormatter for response formatting
    if (!executionResult.success) {
      return this.responseFormatter.formatError(
        template,
        executionResult.error || 'Unknown error',
        executionTimeMs()
      );
    }

    return this.responseFormatter.formatSuccess(
      match,
      executionResult,
      executionTimeMs(),
      queryConfig
    );
  }

  /**
   * Format response after query execution
   * @param match - The matched template
   * @param result - The query execution result
   */
  private formatExecutionResponse(match: TemplateMatch, result: QueryExecutionResult): string {
    const template = match.template;
    const confidence = Math.round(match.confidence * 100);

    if (!result.success) {
      return `❌ **Query Failed**\n\n` +
        `**Template:** ${template.description}\n` +
        `**Error:** ${result.error}\n\n` +
        `Please try a different question or contact support if the issue persists.`;
    }

    let response = `✅ **${template.description}**\n\n`;
    response += `**Query executed in ${result.executionTimeMs}ms** (${confidence}% match)\n\n`;

    // Format based on data type
    if (typeof result.data === 'object' && !Array.isArray(result.data) && result.data !== null) {
      // Object result (e.g., aggregate counts)
      response += `**Results:**\n`;
      for (const [key, value] of Object.entries(result.data)) {
        response += `- ${this.formatEntityName(key)}: ${value}\n`;
      }
    } else if (Array.isArray(result.data)) {
      // Array result
      if (result.data.length === 0) {
        response += `📭 **No results found.**\n`;
        response += `\nNo ${template.category} match your criteria.`;
      } else {
        response += `📊 **Found ${result.rowCount} ${template.category}**`;
        if (result.truncated) {
          response += ` (showing first ${result.data.length})`;
        }
        response += `\n\n`;

        // Show a preview of the data
        const preview = result.data.slice(0, 5);
        for (const item of preview) {
          response += this.formatDataItem(item, template.category);
        }
        if (result.data.length > 5) {
          response += `\n_...and ${result.data.length - 5} more_`;
        }
      }
    } else if (typeof result.data === 'number') {
      // Count result
      response += `**Count:** ${result.data}`;
    } else if (result.data === null) {
      response += `📭 **No results found.**`;
    } else {
      // Single object result
      response += `**Result:**\n`;
      response += this.formatDataItem(result.data, template.category);
    }

    if (result.truncated) {
      response += `\n\n⚠️ _Results truncated. Showing first ${result.data.length} of ${result.rowCount} total._`;
    }

    return response;
  }

  /**
   * Format a single data item for display
   */
  private formatDataItem(item: any, category: string): string {
    if (!item || typeof item !== 'object') {
      return `- ${JSON.stringify(item)}\n`;
    }

    // Format based on common fields
    const name = item.name || item.id || 'Unknown';
    const description = item.description ? ` - ${item.description.substring(0, 50)}...` : '';

    let result = `• **${name}**${description}\n`;

    // Add context-specific info
    if (item._count) {
      const countInfo = Object.entries(item._count)
        .filter(([_, v]) => typeof v === 'number')
        .map(([k, v]) => `${v} ${k}`)
        .join(', ');
      if (countInfo) {
        result += `  _${countInfo}_\n`;
      }
    }

    // Show nested relationships (tasks, products, etc.)
    if (item.tasks && Array.isArray(item.tasks) && item.tasks.length > 0) {
      const taskNames = item.tasks.slice(0, 3).map((t: any) => t.name || t.id).join(', ');
      result += `  Tasks: ${taskNames}${item.tasks.length > 3 ? '...' : ''}\n`;
    }

    if (item.products && Array.isArray(item.products) && item.products.length > 0) {
      const productNames = item.products.slice(0, 3).map((p: any) =>
        p.product?.name || p.name || p.id
      ).join(', ');
      result += `  Products: ${productNames}${item.products.length > 3 ? '...' : ''}\n`;
    }

    if (item.adoptionPlan) {
      const progress = item.adoptionPlan.progressPercentage;
      if (typeof progress === 'number') {
        result += `  Progress: ${progress}%\n`;
      }
    }

    return result;
  }

  /**
   * Format entity names for display (camelCase to Title Case)
   */
  private formatEntityName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Handle when no template matches the question
   * @param request - The original request
   * @param startTime - When processing started
   */
  private handleNoMatch(
    request: AIQueryRequest,
    startTime: number
  ): AIQueryResponse {
    // Get all templates to suggest alternatives
    const allTemplates = this.queryTemplates.getAllTemplates();

    // Generate smart suggestions
    const suggestions = this.generateSmartSuggestions(request.question, allTemplates);

    // Use ResponseFormatter for no-match response
    return this.responseFormatter.formatNoMatch(
      request.question,
      suggestions,
      Date.now() - startTime
    );
  }

  /**
   * Format response for a template match
   */
  private formatTemplateMatchResponse(match: TemplateMatch): string {
    const template = match.template;
    const confidence = Math.round(match.confidence * 100);

    let response = `✅ **Matched Template:** ${template.description}\n\n`;
    response += `**Template ID:** \`${template.id}\`\n`;
    response += `**Confidence:** ${confidence}%\n`;
    response += `**Category:** ${template.category}\n`;

    if (Object.keys(match.params).length > 0) {
      response += `**Parameters:** ${JSON.stringify(match.params)}\n`;
    }

    response += `\n📊 *Query execution coming in Phase 2.3*\n`;
    response += `\nThe query has been prepared and is ready to execute against the database.`;

    return response;
  }

  /**
   * Format response when no template matches
   */
  private formatNoMatchResponse(question: string): string {
    let response = `🔍 I couldn't find an exact match for your question:\n`;
    response += `> "${question}"\n\n`;
    response += `**Current Capabilities:**\n`;
    response += `I can answer questions about:\n`;
    response += `• Products and their telemetry\n`;
    response += `• Customers and adoption progress\n`;
    response += `• Tasks and their attributes\n`;
    response += `• Counts and summaries\n\n`;
    response += `Try one of the suggestions below, or rephrase your question.\n`;
    response += `\n💡 *Advanced query generation (LLM) coming in Phase 2*`;

    return response;
  }

  /**
   * Get related suggestions based on category
   */
  private getRelatedSuggestions(category: string): string[] {
    const templates = this.queryTemplates.getAllTemplates();
    const related = templates
      .filter(t => t.category === category && t.examples.length > 0)
      .slice(0, 3)
      .map(t => t.examples[0]);

    // Add one from a different category for variety
    const other = templates
      .find(t => t.category !== category && t.examples.length > 0);
    if (other) {
      related.push(other.examples[0]);
    }

    return related.slice(0, 4);
  }

  /**
   * Generate smart suggestions based on the question
   */
  private generateSmartSuggestions(
    question: string,
    templates: any[]
  ): string[] {
    const lowerQuestion = question.toLowerCase();
    const suggestions: string[] = [];

    // Prioritize templates that share words with the question
    for (const template of templates) {
      for (const example of template.examples) {
        const words = example.toLowerCase().split(/\s+/);
        const questionWords = lowerQuestion.split(/\s+/);
        const overlap = words.filter((w: string) => questionWords.includes(w));

        if (overlap.length > 0 && suggestions.length < 4) {
          suggestions.push(example);
          break;
        }
      }
    }

    // Fill remaining with popular templates
    if (suggestions.length < 4) {
      const popular = [
        'Show me all products',
        'List customers with low adoption',
        'Find tasks without telemetry',
        'How many customers do we have?',
      ];
      for (const p of popular) {
        if (!suggestions.includes(p) && suggestions.length < 4) {
          suggestions.push(p);
        }
      }
    }

    return suggestions;
  }

  /**
   * Validate the query request
   * @throws Error if request is invalid
   */
  private validateRequest(request: AIQueryRequest): void {
    if (!request.question || typeof request.question !== 'string') {
      throw new Error('Question is required and must be a string');
    }

    if (request.question.trim().length === 0) {
      throw new Error('Question cannot be empty');
    }

    if (request.question.length > 1000) {
      throw new Error('Question is too long (max 1000 characters)');
    }

    if (!request.userId) {
      throw new Error('User ID is required');
    }

    if (!request.userRole) {
      throw new Error('User role is required');
    }

    const validRoles = ['ADMIN', 'SME', 'CSS', 'USER', 'VIEWER'];
    if (!validRoles.includes(request.userRole)) {
      throw new Error(`Invalid user role: ${request.userRole}`);
    }
  }

  /**
   * Find a matching template for the question
   * @param question - The natural language question
   * @returns The best matching template, or null
   */
  protected findMatchingTemplate(question: string): TemplateMatch | null {
    return this.queryTemplates.findBestMatch(question);
  }

  /**
   * Get the query templates instance (for testing)
   */
  getQueryTemplates(): QueryTemplates {
    return this.queryTemplates;
  }

  /**
   * Get the schema context manager instance (for testing)
   */
  getSchemaContextManager(): SchemaContextManager {
    return this.schemaContextManager;
  }

  /**
   * Handle a query using the LLM when no template matches
   */
  private async handleLLMQuery(
    request: AIQueryRequest,
    startTime: number
  ): Promise<AIQueryResponse> {
    const executionTimeMs = () => Date.now() - startTime;

    console.log(`[AI Agent] Starting LLM query processing for: "${request.question}"`);

    try {
      // 1. Interpret user intent and generate query config
      const queryConfig = await this.generateQueryConfig(request.question);

      console.log(`[AI Agent] LLM generated query config:`, JSON.stringify(queryConfig));

      // 2. Apply RBAC filters
      const userContext: RBACUserContext = {
        userId: request.userId,
        role: request.userRole,
        isAdmin: request.userRole === 'ADMIN',
      };

      const rbacResult = await this.rbacFilter.applyFilter(queryConfig, userContext);

      if (!rbacResult.allowed) {
        return this.responseFormatter.formatAccessDenied(
          { id: 'llm-query', description: 'Custom Query', category: 'general' } as any, // Mock template
          request.userRole,
          this.rbacFilter.getRoleRestrictions(request.userRole),
          executionTimeMs()
        );
      }

      // 3. Execute the query
      const executionResult = await this.queryExecutor.execute(rbacResult.filteredConfig!);

      // 4. Format the response
      if (!executionResult.success) {
        return {
          answer: `I encountered an error executing the generated query.\n\nError: ${executionResult.error}`,
          error: executionResult.error,
          metadata: {
            executionTime: executionTimeMs(),
            rowCount: 0,
            truncated: false,
            cached: false,
            templateUsed: 'llm-dynamic'
          }
        };
      }

      // Use LLM to generate a natural language summary of the results
      // For now, we'll use the formatter's generic logic which is quite good
      const formattedResponse = this.responseFormatter.formatSuccess(
        {
          template: {
            id: 'llm-dynamic',
            description: 'Custom Analysis',
            category: this.inferCategory(queryConfig.model)
          } as any,
          params: {},
          confidence: 0.9
        },
        executionResult,
        executionTimeMs(),
        queryConfig
      );

      return formattedResponse;

    } catch (error: any) {
      console.error('[AI Agent] LLM processing error:', error);

      // Return the specific error to the user for debugging
      return {
        answer: `I tried to generate a custom query for you, but encountered an error.\n\n**Error Details:**\n\`${error.message || error}\`\n\n**Provider:** ${this.llmProvider?.name || 'None'}`,
        error: error.message || String(error),
        metadata: {
          executionTime: executionTimeMs(),
          rowCount: 0,
          truncated: false,
          cached: false
        }
      };
    }
  }

  /**
   * Generate QueryConfig from natural language using LLM
   */
  private async generateQueryConfig(question: string): Promise<QueryConfig> {
    if (!this.llmProvider) {
      throw new Error('LLM provider not initialized');
    }

    const schemaContext = this.schemaContextManager.getContextPrompt();

    const systemPrompt = `You are a data analyst helper for the DAP (Database Application Platform) system.
Your goal is to convert natural language questions into a JSON query configuration for the Prisma ORM.

${schemaContext}

## Response Format
You must return a valid JSON object matching this TypeScript interface:

interface QueryConfig {
    model: string; // The Prisma model name (e.g., 'Product', 'Customer', 'Task')
    operation: 'findMany' | 'findUnique' | 'count' | 'aggregate';
    args: any; // The arguments for the Prisma operation (where, include, orderBy, take, skip)
}

## Constraints
1. READ-ONLY operations only. No create, update, delete.
2. Use 'findMany' for lists, 'count' for simple counts.
3. Always include 'where: { deletedAt: null }' for models that support soft delete (Product, Solution, Customer, Task).
4. Do not limit 'take' unless the user asks for top N. The system applies a safe default limit.
5. For complex text searches, use 'contains' with 'mode: "insensitive"'.
6. If the user asks for everything (e.g., "all products"), return a findMany with empty where (except deletedAt check).
7. For counting, ALWAYS use "operation": "count". Do NOT use "operation": "aggregate" with "count" inside args (Prisma uses _count).
8. For other aggregations (sum, avg), use "operation": "aggregate" and args like { "_sum": { "amount": true } }.

## Examples

User: "Show me all products"
Response:
{
  "model": "Product",
  "operation": "findMany",
  "args": {
    "where": { "deletedAt": null },
    "include": { "tasks": true }
  }
}

User: "Find customers with 'Acme' in the name"
Response:
{
  "model": "Customer",
  "operation": "findMany",
  "args": {
    "where": { 
      "name": { "contains": "Acme", "mode": "insensitive" },
      "deletedAt": null
    },
    "include": { "adoptionPlan": true }
  }
}

User: "How many tasks are there?"
Response:
{
  "model": "Task",
  "operation": "count",
  "args": {
    "where": { "deletedAt": null }
  }
}
`;

    // Call LLM with structured output request
    const response = await this.llmProvider.generateStructured<QueryConfig>(
      question,
      {
        model: "string",
        operation: "string",
        args: "object"
      } as any, // Schema hint
      {
        systemPrompt,
        temperature: 0.1 // Low temperature for deterministic code generation
      }
    );

    return response;
  }

  /**
   * Infer category from model name for formatting
   */
  private inferCategory(model: string): string {
    const m = model.toLowerCase();
    if (m.includes('product')) return 'products';
    if (m.includes('customer')) return 'customers';
    if (m.includes('solution')) return 'solutions';
    if (m.includes('task')) return 'tasks';
    if (m.includes('telemetry')) return 'telemetry';
    return 'general';
  }

  // ============================================================
  // Legacy methods kept for interface compatibility or future use
  // ============================================================

  /**
   * Interpret a question to extract intent
   */
  protected async interpretQuestion(question: string): Promise<QueryIntent> {
    // Implemented inline in handleLLMQuery for now
    throw new Error('Use handleLLMQuery instead');
  }

  /**
   * Generate a query using the LLM
   */
  protected async generateQuery(intent: QueryIntent): Promise<any> {
    // Implemented inline in handleLLMQuery for now
    throw new Error('Use handleLLMQuery instead');
  }

  /**
   * Apply RBAC filters to a query (read-only access control)
   */
  protected async applyRBACFilters(
    query: QueryConfig,
    userId: string,
    userRole: string
  ): Promise<RBACFilterResult> {
    const userContext: RBACUserContext = {
      userId,
      role: userRole,
      isAdmin: userRole === 'ADMIN',
    };
    return this.rbacFilter.applyFilter(query, userContext);
  }

  /**
   * Execute a query safely
   */
  protected async executeQuery(query: any): Promise<any[]> {
    // Implemented in handleLLMQuery via QueryExecutor
    throw new Error('Use QueryExecutor.execute instead');
  }

  /**
   * Format query results into a response
   */
  protected async formatResponse(
    data: any[],
    intent: QueryIntent
  ): Promise<AIQueryResponse> {
    // Implemented in handleLLMQuery via ResponseFormatter
    throw new Error('Use ResponseFormatter instead');
  }

  /**
   * Generate follow-up suggestions
   */
  protected async generateSuggestions(
    question: string,
    data: any[]
  ): Promise<string[]> {
    return this.responseFormatter.generateSuggestions(
      { category: 'general' } as any,
      { rowCount: data.length, data } as any
    );
  }
}

// Export singleton instance
let instance: AIAgentService | null = null;

/**
 * Get the singleton AI Agent Service instance
 * @param config - Optional configuration (only used on first call)
 * @returns The AI Agent Service instance
 */
export function getAIAgentService(config?: Partial<AIAgentConfig>): AIAgentService {
  if (!instance) {
    instance = new AIAgentService(config);
  }
  return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetAIAgentService(): void {
  instance = null;
}

