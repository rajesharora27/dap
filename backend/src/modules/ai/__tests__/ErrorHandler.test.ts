/**
 * ErrorHandler Tests
 * 
 * Tests for the AI Agent error handling and fallbacks (Phase 4.3)
 */

import {
  ErrorHandler,
  getErrorHandler,
  resetErrorHandler,
  AIErrorType,
  ErrorSeverity,
  AIError,
} from '../ErrorHandler';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    resetErrorHandler();
    handler = new ErrorHandler({
      enableFallbacks: true,
      maxRetries: 2,
      logErrors: false, // Suppress console output during tests
    });
  });

  afterEach(() => {
    resetErrorHandler();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultHandler = new ErrorHandler();
      expect(defaultHandler).toBeInstanceOf(ErrorHandler);
    });

    it('should accept custom config', () => {
      const customHandler = new ErrorHandler({
        enableFallbacks: false,
        maxRetries: 5,
      });
      expect(customHandler).toBeInstanceOf(ErrorHandler);
    });
  });

  describe('classifyError()', () => {
    describe('from string errors', () => {
      it('should classify validation errors', () => {
        const error = handler.classifyError('Validation error: invalid input');
        expect(error.type).toBe(AIErrorType.VALIDATION);
      });

      it('should classify authentication errors', () => {
        const error = handler.classifyError('Invalid token');
        expect(error.type).toBe(AIErrorType.AUTHENTICATION);
      });

      it('should classify authorization errors', () => {
        const error = handler.classifyError('Permission denied');
        expect(error.type).toBe(AIErrorType.AUTHORIZATION);
      });

      it('should classify rate limit errors', () => {
        const error = handler.classifyError('Rate limit exceeded');
        expect(error.type).toBe(AIErrorType.RATE_LIMIT);
      });

      it('should classify timeout errors', () => {
        const error = handler.classifyError('Request timed out');
        expect(error.type).toBe(AIErrorType.TIMEOUT);
      });

      it('should classify LLM errors', () => {
        const error = handler.classifyError('OpenAI API error');
        expect(error.type).toBe(AIErrorType.LLM_ERROR);
      });

      it('should classify database errors', () => {
        const error = handler.classifyError('Prisma query failed');
        expect(error.type).toBe(AIErrorType.DATABASE_ERROR);
      });

      it('should classify network errors', () => {
        const error = handler.classifyError('ECONNREFUSED');
        expect(error.type).toBe(AIErrorType.NETWORK_ERROR);
      });

      it('should classify unknown errors', () => {
        const error = handler.classifyError('Something weird happened');
        expect(error.type).toBe(AIErrorType.UNKNOWN);
      });
    });

    describe('from Error objects', () => {
      it('should preserve error message', () => {
        const error = handler.classifyError(new Error('Test error message'));
        expect(error.message).toBe('Test error message');
      });

      it('should include original error', () => {
        const original = new Error('Original');
        const error = handler.classifyError(original);
        expect(error.originalError).toBe(original);
      });

      it('should infer type from error name', () => {
        const validationError = new Error('Bad input');
        validationError.name = 'ValidationError';
        const error = handler.classifyError(validationError);
        expect(error.type).toBe(AIErrorType.VALIDATION);
      });
    });

    describe('error properties', () => {
      it('should set user-friendly message', () => {
        const error = handler.classifyError('Database connection failed');
        expect(error.userMessage).toBeTruthy();
        expect(error.userMessage).not.toContain('Database connection failed');
      });

      it('should set error code', () => {
        const error = handler.classifyError('Rate limit exceeded');
        expect(error.code).toBe('AI_ERR_004');
      });

      it('should set timestamp', () => {
        const before = new Date().toISOString();
        const error = handler.classifyError('Test');
        const after = new Date().toISOString();
        
        expect(error.timestamp >= before).toBe(true);
        expect(error.timestamp <= after).toBe(true);
      });

      it('should include context', () => {
        const error = handler.classifyError('Test', { userId: 'user-1' });
        expect(error.context).toEqual({ userId: 'user-1' });
      });
    });

    describe('severity levels', () => {
      it('should set LOW severity for validation errors', () => {
        const error = handler.classifyError('Validation error occurred');
        expect(error.severity).toBe(ErrorSeverity.LOW);
      });

      it('should set MEDIUM severity for rate limit errors', () => {
        const error = handler.classifyError('Rate limit');
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      });

      it('should set HIGH severity for timeout errors', () => {
        const error = handler.classifyError('Request timeout');
        expect(error.severity).toBe(ErrorSeverity.HIGH);
      });

      it('should set CRITICAL severity for auth errors', () => {
        const error = handler.classifyError('Permission denied');
        expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      });
    });

    describe('retryable flag', () => {
      it('should mark rate limit as retryable', () => {
        const error = handler.classifyError('Rate limit exceeded');
        expect(error.retryable).toBe(true);
      });

      it('should mark timeout as retryable', () => {
        const error = handler.classifyError('Request timeout');
        expect(error.retryable).toBe(true);
      });

      it('should mark network errors as retryable', () => {
        const error = handler.classifyError('ECONNREFUSED');
        expect(error.retryable).toBe(true);
      });

      it('should mark validation as not retryable', () => {
        const error = handler.classifyError('Validation failed');
        expect(error.retryable).toBe(false);
      });

      it('should mark auth errors as not retryable', () => {
        const error = handler.classifyError('Permission denied');
        expect(error.retryable).toBe(false);
      });
    });
  });

  describe('tryFallback()', () => {
    const request = {
      question: 'Show me all products',
      userId: 'user-1',
      userRole: 'ADMIN',
    };

    it('should provide fallback for LLM errors', async () => {
      const error = handler.classifyError('OpenAI API error');
      const fallback = await handler.tryFallback(error, request);
      
      expect(fallback.success).toBe(true);
      expect(fallback.fallbackUsed).toBe('templates');
      expect(fallback.response?.answer).toContain('Template Matching');
    });

    it('should provide fallback for timeout errors', async () => {
      const error = handler.classifyError('Request timeout');
      const fallback = await handler.tryFallback(error, request);
      
      expect(fallback.success).toBe(true);
      expect(fallback.fallbackUsed).toBe('simplified');
      expect(fallback.response?.answer).toContain('Timeout');
    });

    it('should provide fallback for rate limit errors', async () => {
      const error = handler.classifyError('Rate limit');
      const fallback = await handler.tryFallback(error, request);
      
      expect(fallback.success).toBe(true);
      expect(fallback.fallbackUsed).toBe('rate_limited');
    });

    it('should provide fallback for database errors', async () => {
      const error = handler.classifyError('Database error');
      const fallback = await handler.tryFallback(error, request);
      
      expect(fallback.success).toBe(true);
      expect(fallback.fallbackUsed).toBe('database_error');
    });

    it('should return failure when fallbacks disabled', async () => {
      const noFallbackHandler = new ErrorHandler({ enableFallbacks: false });
      const error = noFallbackHandler.classifyError('LLM error');
      const fallback = await noFallbackHandler.tryFallback(error, request);
      
      expect(fallback.success).toBe(false);
    });

    it('should use custom fallback function', async () => {
      const error = handler.classifyError('Unknown error');
      const customResponse = {
        answer: 'Custom fallback response',
        metadata: {
          executionTime: 0,
          rowCount: 0,
          truncated: false,
          cached: false,
        },
      };
      
      const fallback = await handler.tryFallback(error, request, async () => customResponse);
      
      expect(fallback.success).toBe(true);
      expect(fallback.fallbackUsed).toBe('custom');
      expect(fallback.response?.answer).toBe('Custom fallback response');
    });

    it('should include suggestions in fallback responses', async () => {
      const error = handler.classifyError('LLM API error');
      const fallback = await handler.tryFallback(error, request);
      
      expect(fallback.response?.suggestions).toBeDefined();
      expect(fallback.response?.suggestions?.length).toBeGreaterThan(0);
    });
  });

  describe('formatErrorResponse()', () => {
    it('should create formatted error response', () => {
      const error = handler.classifyError('Test error');
      const response = handler.formatErrorResponse(error);
      
      expect(response.answer).toContain('Error');
      expect(response.error).toBe('Test error');
    });

    it('should include suggestions', () => {
      const error = handler.classifyError('Database connection failed');
      const response = handler.formatErrorResponse(error);
      
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions?.length).toBeGreaterThan(0);
    });

    it('should include metadata', () => {
      const error = handler.classifyError('Test');
      const response = handler.formatErrorResponse(error);
      
      expect(response.metadata).toBeDefined();
      expect(response.metadata?.cached).toBe(false);
    });

    it('should include stack trace in development', () => {
      const devHandler = new ErrorHandler({ includeStackTrace: true });
      const error = devHandler.classifyError(new Error('Test'));
      const response = devHandler.formatErrorResponse(error);
      
      expect(response.answer).toContain('Debug Info');
    });
  });

  describe('getStats()', () => {
    it('should track error counts by type', async () => {
      const request = { question: 'test', userId: 'u', userRole: 'ADMIN' };
      
      await handler.tryFallback(handler.classifyError('LLM error'), request);
      await handler.tryFallback(handler.classifyError('LLM API failed'), request);
      await handler.tryFallback(handler.classifyError('Database error'), request);
      
      const stats = handler.getStats();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.byType[AIErrorType.LLM_ERROR]).toBe(2);
      expect(stats.byType[AIErrorType.DATABASE_ERROR]).toBe(1);
    });

    it('should track recent errors', async () => {
      const request = { question: 'test', userId: 'u', userRole: 'ADMIN' };
      
      await handler.tryFallback(handler.classifyError('Error 1'), request);
      await handler.tryFallback(handler.classifyError('Error 2'), request);
      
      const stats = handler.getStats();
      
      expect(stats.recentErrors.length).toBe(2);
    });

    it('should identify most common error type', async () => {
      const request = { question: 'test', userId: 'u', userRole: 'ADMIN' };
      
      await handler.tryFallback(handler.classifyError('LLM error'), request);
      await handler.tryFallback(handler.classifyError('LLM API error'), request);
      await handler.tryFallback(handler.classifyError('OpenAI error'), request);
      await handler.tryFallback(handler.classifyError('timeout'), request);
      
      const stats = handler.getStats();
      
      expect(stats.mostCommonType).toBe(AIErrorType.LLM_ERROR);
    });
  });

  describe('clearStats()', () => {
    it('should reset error statistics', async () => {
      const request = { question: 'test', userId: 'u', userRole: 'ADMIN' };
      await handler.tryFallback(handler.classifyError('Error'), request);
      
      handler.clearStats();
      
      const stats = handler.getStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.recentErrors.length).toBe(0);
    });
  });

  describe('withRetry()', () => {
    it('should succeed on first try', async () => {
      let attempts = 0;
      const result = await handler.withRetry(async () => {
        attempts++;
        return 'success';
      });
      
      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on retryable errors', async () => {
      let attempts = 0;
      
      try {
        await handler.withRetry(async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Network connection failed');
          }
          return 'success';
        });
      } catch {
        // Expected to fail after max retries
      }
      
      expect(attempts).toBe(3); // Initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      let attempts = 0;
      
      try {
        await handler.withRetry(async () => {
          attempts++;
          throw new Error('Permission denied');
        });
      } catch {
        // Expected to fail immediately
      }
      
      expect(attempts).toBe(1);
    });

    it('should include attempt in context', async () => {
      let capturedError: AIError | null = null;
      
      try {
        await handler.withRetry(async () => {
          throw new Error('Network error');
        }, { operation: 'test' });
      } catch (error) {
        capturedError = error as AIError;
      }
      
      expect(capturedError?.context?.operation).toBe('test');
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance from getErrorHandler', () => {
      const instance1 = getErrorHandler();
      const instance2 = getErrorHandler();
      expect(instance1).toBe(instance2);
    });

    it('should reset with resetErrorHandler', () => {
      const instance1 = getErrorHandler();
      resetErrorHandler();
      const instance2 = getErrorHandler();
      expect(instance1).not.toBe(instance2);
    });
  });
});

