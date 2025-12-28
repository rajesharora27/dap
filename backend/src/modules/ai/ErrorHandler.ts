/**
 * AI Agent Error Handler
 * 
 * Provides comprehensive error handling with graceful degradation
 * and fallback strategies for the AI Agent.
 * 
 * @module services/ai/ErrorHandler
 * @version 1.0.0
 * @created 2025-12-08
 */

import { AIQueryResponse, AIQueryMetadata } from './types';

/**
 * Error types for categorization
 */
export enum AIErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  LLM_ERROR = 'LLM_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',       // Recoverable, no action needed
  MEDIUM = 'MEDIUM', // Recoverable with fallback
  HIGH = 'HIGH',     // May affect service quality
  CRITICAL = 'CRITICAL', // Service impacted
}

/**
 * Structured AI error
 */
export interface AIError {
  type: AIErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code: string;
  retryable: boolean;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

/**
 * Fallback strategy result
 */
export interface FallbackResult {
  success: boolean;
  response?: AIQueryResponse;
  fallbackUsed: string;
  error?: string;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Enable fallback strategies */
  enableFallbacks: boolean;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Base delay for exponential backoff (ms) */
  baseRetryDelay: number;
  /** Include stack traces in error responses */
  includeStackTrace: boolean;
  /** Log errors to console */
  logErrors: boolean;
}

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableFallbacks: true,
  maxRetries: 2,
  baseRetryDelay: 1000,
  includeStackTrace: process.env.NODE_ENV === 'development',
  logErrors: true,
};

/**
 * User-friendly error messages
 */
const USER_MESSAGES: Record<AIErrorType, string> = {
  [AIErrorType.VALIDATION]: 'I couldn\'t understand your question. Please try rephrasing it.',
  [AIErrorType.AUTHENTICATION]: 'There was an authentication issue. Please try logging in again.',
  [AIErrorType.AUTHORIZATION]: 'You don\'t have permission to access this information.',
  [AIErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [AIErrorType.TIMEOUT]: 'The query took too long. Try a simpler question or smaller data range.',
  [AIErrorType.LLM_ERROR]: 'The AI service is temporarily unavailable. Using basic query matching instead.',
  [AIErrorType.DATABASE_ERROR]: 'There was an issue accessing the data. Please try again.',
  [AIErrorType.INTERNAL_ERROR]: 'Something went wrong. Our team has been notified.',
  [AIErrorType.NETWORK_ERROR]: 'Network connectivity issue. Please check your connection.',
  [AIErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

/**
 * AI Agent Error Handler
 * 
 * Features:
 * - Error categorization and severity levels
 * - User-friendly error messages
 * - Graceful degradation with fallback strategies
 * - Retry logic with exponential backoff
 * - Error statistics tracking
 * 
 * @example
 * ```typescript
 * const handler = new ErrorHandler();
 * 
 * try {
 *   // AI processing...
 * } catch (error) {
 *   const aiError = handler.classifyError(error);
 *   const fallback = await handler.tryFallback(aiError, request);
 *   if (fallback.success) {
 *     return fallback.response;
 *   }
 *   return handler.formatErrorResponse(aiError);
 * }
 * ```
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorCounts: Map<AIErrorType, number> = new Map();
  private lastErrors: AIError[] = [];

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Classify an error into a structured AIError
   */
  classifyError(error: unknown, context?: Record<string, any>): AIError {
    const timestamp = new Date().toISOString();

    // Handle string errors
    if (typeof error === 'string') {
      return this.createError(
        this.inferTypeFromMessage(error),
        error,
        context,
        timestamp
      );
    }

    // Handle Error objects
    if (error instanceof Error) {
      const type = this.inferTypeFromError(error);
      return {
        type,
        severity: this.getSeverity(type),
        message: error.message,
        userMessage: USER_MESSAGES[type],
        code: this.getErrorCode(type),
        retryable: this.isRetryable(type),
        originalError: error,
        context,
        timestamp,
      };
    }

    // Unknown error type
    return this.createError(AIErrorType.UNKNOWN, 'Unknown error occurred', context, timestamp);
  }

  /**
   * Create a structured error
   */
  private createError(
    type: AIErrorType,
    message: string,
    context?: Record<string, any>,
    timestamp?: string
  ): AIError {
    return {
      type,
      severity: this.getSeverity(type),
      message,
      userMessage: USER_MESSAGES[type],
      code: this.getErrorCode(type),
      retryable: this.isRetryable(type),
      context,
      timestamp: timestamp || new Date().toISOString(),
    };
  }

  /**
   * Infer error type from error message
   */
  private inferTypeFromMessage(message: string): AIErrorType {
    const lower = message.toLowerCase();

    // Check authentication first (token, auth, credential) - before validation
    if (lower.includes('token') || lower.includes('auth') || lower.includes('credential')) {
      return AIErrorType.AUTHENTICATION;
    }
    if (lower.includes('permission') || lower.includes('forbidden') || lower.includes('denied')) {
      return AIErrorType.AUTHORIZATION;
    }
    if (lower.includes('rate') || lower.includes('limit') || lower.includes('too many')) {
      return AIErrorType.RATE_LIMIT;
    }
    if (lower.includes('timeout') || lower.includes('timed out')) {
      return AIErrorType.TIMEOUT;
    }
    if (lower.includes('llm') || lower.includes('openai') || lower.includes('gpt') || lower.includes('api')) {
      return AIErrorType.LLM_ERROR;
    }
    if (lower.includes('database') || lower.includes('prisma') || lower.includes('query failed')) {
      return AIErrorType.DATABASE_ERROR;
    }
    if (lower.includes('network') || lower.includes('connect') || lower.includes('econnrefused')) {
      return AIErrorType.NETWORK_ERROR;
    }
    // Check validation last since "invalid" is common in many error messages
    if (lower.includes('validation') || lower.includes('invalid input')) {
      return AIErrorType.VALIDATION;
    }

    return AIErrorType.UNKNOWN;
  }

  /**
   * Infer error type from Error object
   */
  private inferTypeFromError(error: Error): AIErrorType {
    // Check error name
    const name = error.name.toLowerCase();
    if (name.includes('validation')) return AIErrorType.VALIDATION;
    if (name.includes('auth')) return AIErrorType.AUTHENTICATION;
    if (name.includes('timeout')) return AIErrorType.TIMEOUT;

    // Check message
    return this.inferTypeFromMessage(error.message);
  }

  /**
   * Get severity for error type
   */
  private getSeverity(type: AIErrorType): ErrorSeverity {
    switch (type) {
      case AIErrorType.VALIDATION:
        return ErrorSeverity.LOW;
      case AIErrorType.RATE_LIMIT:
      case AIErrorType.LLM_ERROR:
        return ErrorSeverity.MEDIUM;
      case AIErrorType.TIMEOUT:
      case AIErrorType.DATABASE_ERROR:
      case AIErrorType.NETWORK_ERROR:
        return ErrorSeverity.HIGH;
      case AIErrorType.AUTHENTICATION:
      case AIErrorType.AUTHORIZATION:
      case AIErrorType.INTERNAL_ERROR:
      case AIErrorType.UNKNOWN:
        return ErrorSeverity.CRITICAL;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Get error code
   */
  private getErrorCode(type: AIErrorType): string {
    const codes: Record<AIErrorType, string> = {
      [AIErrorType.VALIDATION]: 'AI_ERR_001',
      [AIErrorType.AUTHENTICATION]: 'AI_ERR_002',
      [AIErrorType.AUTHORIZATION]: 'AI_ERR_003',
      [AIErrorType.RATE_LIMIT]: 'AI_ERR_004',
      [AIErrorType.TIMEOUT]: 'AI_ERR_005',
      [AIErrorType.LLM_ERROR]: 'AI_ERR_006',
      [AIErrorType.DATABASE_ERROR]: 'AI_ERR_007',
      [AIErrorType.INTERNAL_ERROR]: 'AI_ERR_008',
      [AIErrorType.NETWORK_ERROR]: 'AI_ERR_009',
      [AIErrorType.UNKNOWN]: 'AI_ERR_999',
    };
    return codes[type];
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(type: AIErrorType): boolean {
    return [
      AIErrorType.RATE_LIMIT,
      AIErrorType.TIMEOUT,
      AIErrorType.NETWORK_ERROR,
      AIErrorType.LLM_ERROR,
    ].includes(type);
  }

  /**
   * Try fallback strategies
   */
  async tryFallback(
    error: AIError,
    request: { question: string; userId: string; userRole: string },
    fallbackFn?: () => Promise<AIQueryResponse>
  ): Promise<FallbackResult> {
    if (!this.config.enableFallbacks) {
      return { success: false, fallbackUsed: 'none', error: 'Fallbacks disabled' };
    }

    // Track error
    this.trackError(error);

    // Try different fallbacks based on error type
    switch (error.type) {
      case AIErrorType.LLM_ERROR:
        // Fallback to template-only mode
        return this.fallbackToTemplates(request);

      case AIErrorType.TIMEOUT:
        // Return a simplified response
        return this.fallbackToSimplified(request);

      case AIErrorType.RATE_LIMIT:
        // Return cached if available, or suggest retry
        return this.fallbackToRateLimited(request);

      case AIErrorType.DATABASE_ERROR:
        // Return error with suggestions
        return this.fallbackToDatabaseError(request);

      default:
        // Use custom fallback function if provided
        if (fallbackFn) {
          try {
            const response = await fallbackFn();
            return { success: true, response, fallbackUsed: 'custom' };
          } catch {
            return { success: false, fallbackUsed: 'custom', error: 'Custom fallback failed' };
          }
        }
        return { success: false, fallbackUsed: 'none', error: 'No fallback available' };
    }
  }

  /**
   * Fallback to template-only mode (when LLM fails)
   */
  private async fallbackToTemplates(
    request: { question: string; userId: string; userRole: string }
  ): Promise<FallbackResult> {
    const response: AIQueryResponse = {
      answer: `🔄 **Using Template Matching**\n\nThe AI language model is currently unavailable, so I'm using basic pattern matching instead.\n\nI can help with common questions like:\n• "Show me all products"\n• "List customers with low adoption"\n• "Count all tasks"\n\nPlease try one of these formats, or try again later for advanced queries.`,
      suggestions: [
        'Show me all products',
        'List customers with adoption below 50%',
        'How many customers do we have?',
        'Find tasks without descriptions',
      ],
      metadata: {
        executionTime: 0,
        rowCount: 0,
        truncated: false,
        cached: false,
        templateUsed: 'fallback_templates',
      },
    };

    return { success: true, response, fallbackUsed: 'templates' };
  }

  /**
   * Fallback for timeout errors
   */
  private async fallbackToSimplified(
    request: { question: string; userId: string; userRole: string }
  ): Promise<FallbackResult> {
    const response: AIQueryResponse = {
      answer: `⏱️ **Query Timeout**\n\nYour query took too long to process. This usually happens with complex queries or large data sets.\n\n**Suggestions:**\n• Try a more specific question\n• Add filters to reduce data (e.g., "products in the last month")\n• Ask for counts instead of full lists\n• Break your question into smaller parts`,
      suggestions: [
        'How many products do we have?',
        'Show top 10 customers by adoption',
        'List products with no telemetry',
      ],
      metadata: {
        executionTime: 0,
        rowCount: 0,
        truncated: false,
        cached: false,
        templateUsed: 'fallback_timeout',
      },
    };

    return { success: true, response, fallbackUsed: 'simplified' };
  }

  /**
   * Fallback for rate limit errors
   */
  private async fallbackToRateLimited(
    request: { question: string; userId: string; userRole: string }
  ): Promise<FallbackResult> {
    const response: AIQueryResponse = {
      answer: `⏳ **Rate Limit Reached**\n\nYou've made many requests in a short time. Please wait a few seconds and try again.\n\nIn the meantime, you can browse the app directly or try one of the quick links in the suggestions.`,
      suggestions: [
        'View Products page',
        'View Customers page',
        'View Analytics dashboard',
      ],
      metadata: {
        executionTime: 0,
        rowCount: 0,
        truncated: false,
        cached: false,
        templateUsed: 'fallback_rate_limit',
      },
    };

    return { success: true, response, fallbackUsed: 'rate_limited' };
  }

  /**
   * Fallback for database errors
   */
  private async fallbackToDatabaseError(
    request: { question: string; userId: string; userRole: string }
  ): Promise<FallbackResult> {
    const response: AIQueryResponse = {
      answer: `🔧 **Database Issue**\n\nThere was a problem accessing the database. This is usually temporary.\n\n**What you can do:**\n• Wait a moment and try again\n• Check if the data exists in the UI\n• Contact support if the issue persists`,
      suggestions: [
        'Try again in a few seconds',
        'Check the Products page',
        'View the status dashboard',
      ],
      metadata: {
        executionTime: 0,
        rowCount: 0,
        truncated: false,
        cached: false,
        templateUsed: 'fallback_database',
      },
    };

    return { success: true, response, fallbackUsed: 'database_error' };
  }

  /**
   * Format an error into an AIQueryResponse
   */
  formatErrorResponse(
    error: AIError,
    additionalContext?: Record<string, any>
  ): AIQueryResponse {
    const response: AIQueryResponse = {
      answer: `❌ **Error**\n\n${error.userMessage}`,
      error: error.message,
      suggestions: this.getErrorSuggestions(error.type),
      metadata: {
        executionTime: 0,
        rowCount: 0,
        truncated: false,
        cached: false,
      },
    };

    // Include debug info in development
    if (this.config.includeStackTrace && error.originalError) {
      response.answer += `\n\n<details><summary>Debug Info</summary>\n\n\`\`\`\nCode: ${error.code}\nType: ${error.type}\n${error.originalError.stack || ''}\n\`\`\`\n</details>`;
    }

    return response;
  }

  /**
   * Get suggestions for an error type
   */
  private getErrorSuggestions(type: AIErrorType): string[] {
    const suggestions: Record<AIErrorType, string[]> = {
      [AIErrorType.VALIDATION]: [
        'Show me all products',
        'List customers',
        'How many tasks are there?',
      ],
      [AIErrorType.AUTHENTICATION]: [
        'Please log in again',
        'Check your session',
      ],
      [AIErrorType.AUTHORIZATION]: [
        'Contact your administrator',
        'View your accessible data',
      ],
      [AIErrorType.RATE_LIMIT]: [
        'Wait a moment and try again',
        'View data in the app directly',
      ],
      [AIErrorType.TIMEOUT]: [
        'Try a simpler question',
        'Ask for fewer results',
        'Add filters to your query',
      ],
      [AIErrorType.LLM_ERROR]: [
        'Try a template question',
        'Show me all products',
        'Count customers',
      ],
      [AIErrorType.DATABASE_ERROR]: [
        'Try again in a moment',
        'Check the app status',
      ],
      [AIErrorType.INTERNAL_ERROR]: [
        'Try again later',
        'Contact support',
      ],
      [AIErrorType.NETWORK_ERROR]: [
        'Check your connection',
        'Try again',
      ],
      [AIErrorType.UNKNOWN]: [
        'Try a different question',
        'Show me all products',
      ],
    };

    return suggestions[type] || suggestions[AIErrorType.UNKNOWN];
  }

  /**
   * Track an error for statistics
   */
  private trackError(error: AIError): void {
    const count = this.errorCounts.get(error.type) || 0;
    this.errorCounts.set(error.type, count + 1);

    this.lastErrors.push(error);
    if (this.lastErrors.length > 100) {
      this.lastErrors.shift();
    }

    if (this.config.logErrors) {
      console.error(`[AI Error] ${error.code}: ${error.message}`, error.context);
    }
  }

  /**
   * Get error statistics
   */
  getStats(): {
    totalErrors: number;
    byType: Record<string, number>;
    recentErrors: AIError[];
    mostCommonType: AIErrorType | null;
  } {
    let totalErrors = 0;
    let mostCommonType: AIErrorType | null = null;
    let maxCount = 0;

    const byType: Record<string, number> = {};

    for (const [type, count] of this.errorCounts.entries()) {
      totalErrors += count;
      byType[type] = count;
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type;
      }
    }

    return {
      totalErrors,
      byType,
      recentErrors: this.lastErrors.slice(-10),
      mostCommonType,
    };
  }

  /**
   * Clear error statistics
   */
  clearStats(): void {
    this.errorCounts.clear();
    this.lastErrors = [];
  }

  /**
   * Execute with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: AIError | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.classifyError(error, { ...context, attempt });

        if (!lastError.retryable || attempt === this.config.maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = this.config.baseRetryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Retry failed');
  }
}

// Singleton instance
let instance: ErrorHandler | null = null;

/**
 * Get the singleton ErrorHandler instance
 */
export function getErrorHandler(config?: Partial<ErrorHandlerConfig>): ErrorHandler {
  if (!instance) {
    instance = new ErrorHandler(config);
  }
  return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetErrorHandler(): void {
  instance = null;
}

