/**
 * AI Agent Service
 * 
 * Main service for processing natural language queries about DAP data.
 * 
 * @module services/ai/AIAgentService
 * @version 1.1.0
 * @created 2025-12-05
 * @updated 2025-12-05 - Phase 1.5: Integrated QueryTemplates
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

/**
 * Default configuration for the AI Agent
 */
const DEFAULT_CONFIG: AIAgentConfig = {
  provider: 'mock',
  model: 'gpt-4o',
  maxTokens: 2000,
  temperature: 0.1,
  timeout: 30000,
  maxRows: 100,
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

  /**
   * Create a new AI Agent Service
   * @param config - Optional configuration overrides
   */
  constructor(config: Partial<AIAgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queryTemplates = getQueryTemplates();
    this.schemaContextManager = getSchemaContextManager();
  }

  /**
   * Initialize the service
   * Call this before using the service to ensure all dependencies are ready.
   */
  async initialize(): Promise<void> {
    // Pre-cache schema context (lazy loading, but we can trigger it early)
    this.schemaContextManager.getFullContext();
    // TODO: Initialize LLM provider (Phase 2.1)
    this.initialized = true;
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

      // No template match - prepare for LLM query generation (Phase 2)
      // For now, return a helpful response with suggestions
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
    
    // Build the Prisma query from the template
    const queryConfig = template.buildQuery(match.params);
    
    // For now, return information about the match
    // Query execution will be implemented in Phase 2.3
    const response: AIQueryResponse = {
      answer: this.formatTemplateMatchResponse(match),
      query: JSON.stringify(queryConfig, null, 2),
      suggestions: this.getRelatedSuggestions(template.category),
      metadata: {
        executionTime: Date.now() - startTime,
        rowCount: 0, // Will be populated after query execution
        truncated: false,
        cached: false,
        templateUsed: template.id,
      },
    };

    return response;
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
    
    // Group suggestions by category
    const suggestions = this.generateSmartSuggestions(request.question, allTemplates);

    return {
      answer: this.formatNoMatchResponse(request.question),
      suggestions,
      metadata: {
        executionTime: Date.now() - startTime,
        rowCount: 0,
        truncated: false,
        cached: false,
      },
    };
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

    const validRoles = ['ADMIN', 'SME', 'CSS', 'CS', 'USER'];
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

  // ============================================================
  // Methods to be implemented in subsequent phases
  // ============================================================

  /**
   * Interpret a question to extract intent
   * @param question - The natural language question
   * @returns The extracted intent
   * 
   * @todo Implement in Phase 2.2 (LLM-based interpretation)
   */
  protected async interpretQuestion(question: string): Promise<QueryIntent> {
    // TODO: Use LLM to extract intent for questions that don't match templates
    throw new Error('Not implemented - Phase 2.2');
  }

  /**
   * Generate a query using the LLM
   * @param intent - The query intent
   * @returns The generated Prisma query
   * 
   * @todo Implement in Phase 2.2
   */
  protected async generateQuery(intent: QueryIntent): Promise<any> {
    // TODO: Implement LLM query generation
    throw new Error('Not implemented - Phase 2.2');
  }

  /**
   * Apply RBAC filters to a query
   * @param query - The original query
   * @param userId - The user's ID
   * @param userRole - The user's role
   * @returns The filtered query
   * 
   * @todo Implement in Phase 2.4
   */
  protected async applyRBACFilters(
    query: any,
    userId: string,
    userRole: string
  ): Promise<any> {
    // TODO: Implement RBAC filtering
    throw new Error('Not implemented - Phase 2.4');
  }

  /**
   * Execute a query safely
   * @param query - The Prisma query to execute
   * @returns The query results
   * 
   * @todo Implement in Phase 2.3
   */
  protected async executeQuery(query: any): Promise<any[]> {
    // TODO: Implement query execution
    throw new Error('Not implemented - Phase 2.3');
  }

  /**
   * Format query results into a response
   * @param data - The query results
   * @param intent - The original intent
   * @returns The formatted response
   * 
   * @todo Implement in Phase 2.5
   */
  protected async formatResponse(
    data: any[],
    intent: QueryIntent
  ): Promise<AIQueryResponse> {
    // TODO: Implement response formatting
    throw new Error('Not implemented - Phase 2.5');
  }

  /**
   * Generate follow-up suggestions
   * @param question - The original question
   * @param data - The query results
   * @returns Suggested follow-up questions
   * 
   * @todo Implement in Phase 2.5
   */
  protected async generateSuggestions(
    question: string,
    data: any[]
  ): Promise<string[]> {
    // TODO: Implement suggestion generation
    throw new Error('Not implemented - Phase 2.5');
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

