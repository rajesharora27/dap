/**
 * AI Agent Service Unit Tests
 * 
 * Tests for Phase 1.1: Backend Service Skeleton
 * Tests for Phase 1.5: Template Matching Integration
 * 
 * @module services/ai/__tests__/AIAgentService.test
 */

import {
  AIAgentService,
  getAIAgentService,
  resetAIAgentService,
  AIQueryRequest,
  resetQueryTemplates,
  resetSchemaContextManager,
} from '../index';

describe('AIAgentService', () => {
  let service: AIAgentService;

  beforeEach(() => {
    resetAIAgentService();
    resetQueryTemplates();
    resetSchemaContextManager();
    service = new AIAgentService();
  });

  describe('constructor', () => {
    it('should create an instance with default config', () => {
      expect(service).toBeInstanceOf(AIAgentService);
    });

    it('should accept custom config', () => {
      const customService = new AIAgentService({
        provider: 'openai',
        maxRows: 50,
      });
      expect(customService).toBeInstanceOf(AIAgentService);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      expect(service.isReady()).toBe(true);
    });

    it('should not be ready before initialization', () => {
      expect(service.isReady()).toBe(false);
    });
  });

  describe('processQuestion', () => {
    const validRequest: AIQueryRequest = {
      question: 'Show me all products',
      userId: 'user-123',
      userRole: 'ADMIN',
    };

    it('should return a response for valid request', async () => {
      const response = await service.processQuestion(validRequest);
      
      expect(response).toBeDefined();
      expect(response.answer).toBeDefined();
      expect(typeof response.answer).toBe('string');
      expect(response.answer.length).toBeGreaterThan(0);
    });

    it('should include metadata in response', async () => {
      const response = await service.processQuestion(validRequest);
      
      expect(response.metadata).toBeDefined();
      expect(response.metadata?.executionTime).toBeGreaterThanOrEqual(0);
      expect(response.metadata?.rowCount).toBe(0);
      expect(response.metadata?.truncated).toBe(false);
      expect(response.metadata?.cached).toBe(false);
    });

    it('should include suggestions in response', async () => {
      const response = await service.processQuestion(validRequest);
      
      expect(response.suggestions).toBeDefined();
      expect(Array.isArray(response.suggestions)).toBe(true);
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });

    it('should not have error for valid request', async () => {
      const response = await service.processQuestion(validRequest);
      
      expect(response.error).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should reject empty question', async () => {
      const response = await service.processQuestion({
        question: '',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.error).toBeDefined();
      expect(response.error).toContain('required');
    });

    it('should reject whitespace-only question', async () => {
      const response = await service.processQuestion({
        question: '   ',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.error).toBeDefined();
      expect(response.error).toContain('empty');
    });

    it('should reject very long question', async () => {
      const response = await service.processQuestion({
        question: 'a'.repeat(1001),
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.error).toBeDefined();
      expect(response.error).toContain('too long');
    });

    it('should reject missing userId', async () => {
      const response = await service.processQuestion({
        question: 'Show me products',
        userId: '',
        userRole: 'ADMIN',
      });
      
      expect(response.error).toBeDefined();
      expect(response.error).toContain('User ID');
    });

    it('should reject missing userRole', async () => {
      const response = await service.processQuestion({
        question: 'Show me products',
        userId: 'user-123',
        userRole: '',
      });
      
      expect(response.error).toBeDefined();
      expect(response.error).toContain('role');
    });

    it('should reject invalid userRole', async () => {
      const response = await service.processQuestion({
        question: 'Show me products',
        userId: 'user-123',
        userRole: 'INVALID_ROLE',
      });
      
      expect(response.error).toBeDefined();
      expect(response.error).toContain('Invalid');
    });

    it('should accept all valid roles', async () => {
      const validRoles = ['ADMIN', 'SME', 'CSS', 'CS', 'USER'];
      
      for (const role of validRoles) {
        const response = await service.processQuestion({
          question: 'Show me products',
          userId: 'user-123',
          userRole: role,
        });
        
        expect(response.error).toBeUndefined();
      }
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = getAIAgentService();
      const instance2 = getAIAgentService();
      
      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = getAIAgentService();
      resetAIAgentService();
      const instance2 = getAIAgentService();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  // ============================================================
  // Phase 1.5: Template Matching Integration Tests
  // ============================================================

  describe('template matching', () => {
    it('should match "Show me all products" to list_products template', async () => {
      const response = await service.processQuestion({
        question: 'Show me all products',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.metadata?.templateUsed).toBe('list_products');
      expect(response.answer).toContain('Matched Template');
    });

    it('should match "customers with adoption below 50%" to customers_low_adoption', async () => {
      const response = await service.processQuestion({
        question: 'Show customers with adoption below 50%',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.metadata?.templateUsed).toBe('customers_low_adoption');
      expect(response.answer).toContain('Matched Template');
    });

    it('should match "Find tasks without descriptions" to tasks_missing_descriptions', async () => {
      const response = await service.processQuestion({
        question: 'Find tasks without descriptions',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.metadata?.templateUsed).toBe('tasks_missing_descriptions');
    });

    it('should include query configuration for matched templates', async () => {
      const response = await service.processQuestion({
        question: 'Show me all products',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.query).toBeDefined();
      expect(response.query).toContain('product');
      expect(response.query).toContain('findMany');
    });

    it('should include confidence in answer for matched templates', async () => {
      const response = await service.processQuestion({
        question: 'Show me all products',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.answer).toContain('Confidence');
      expect(response.answer).toMatch(/\d+%/); // Contains percentage
    });

    it('should include category in answer for matched templates', async () => {
      const response = await service.processQuestion({
        question: 'Show me all customers',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.answer).toContain('Category');
      expect(response.answer).toContain('customers');
    });

    it('should provide related suggestions for matched templates', async () => {
      const response = await service.processQuestion({
        question: 'Show me all products',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('no template match', () => {
    it('should handle unmatched questions gracefully', async () => {
      const response = await service.processQuestion({
        question: 'What is the meaning of life?',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.error).toBeUndefined();
      expect(response.answer).toContain('couldn\'t find');
      expect(response.metadata?.templateUsed).toBeUndefined();
    });

    it('should provide suggestions for unmatched questions', async () => {
      const response = await service.processQuestion({
        question: 'Tell me about something random',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });

    it('should mention current capabilities in no-match response', async () => {
      const response = await service.processQuestion({
        question: 'What is the weather today?',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.answer).toContain('Products');
      expect(response.answer).toContain('Customers');
      expect(response.answer).toContain('Tasks');
    });
  });

  describe('parameter extraction', () => {
    it('should extract threshold parameter from adoption question', async () => {
      const response = await service.processQuestion({
        question: 'Show customers with adoption below 30%',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.query).toBeDefined();
      expect(response.query).toContain('30');
    });

    it('should use default threshold when not specified', async () => {
      const response = await service.processQuestion({
        question: 'Find struggling customers',
        userId: 'user-123',
        userRole: 'ADMIN',
      });
      
      expect(response.metadata?.templateUsed).toBe('customers_low_adoption');
      // Default threshold should be applied
      expect(response.query).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should have QueryTemplates instance', () => {
      expect(service.getQueryTemplates()).toBeDefined();
      expect(service.getQueryTemplates().getAllTemplates().length).toBeGreaterThanOrEqual(10);
    });

    it('should have SchemaContextManager instance', () => {
      expect(service.getSchemaContextManager()).toBeDefined();
      expect(service.getSchemaContextManager().getFullContext()).toBeDefined();
    });
  });
});

