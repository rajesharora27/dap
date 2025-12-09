/**
 * AuditLogger Tests
 * 
 * Tests for the AI Agent audit logging (Phase 4.2)
 */

import {
  AuditLogger,
  getAuditLogger,
  resetAuditLogger,
  generateRequestId,
  AuditLogEntry,
} from '../AuditLogger';

describe('AuditLogger', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    resetAuditLogger();
    logger = new AuditLogger({
      enabled: true,
      logToConsole: false, // Suppress console output during tests
      logToFile: false,    // Don't write to files during tests
    });
  });

  afterEach(() => {
    resetAuditLogger();
  });

  // Helper to create audit log entry
  const createEntry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
    requestId: generateRequestId(),
    timestamp: new Date().toISOString(),
    userId: 'user-123',
    userRole: 'ADMIN',
    question: 'Show me all products',
    templateUsed: 'list_products',
    llmUsed: false,
    llmProvider: null,
    cached: false,
    executionTimeMs: 150,
    rowCount: 25,
    hasError: false,
    errorMessage: null,
    accessDenied: false,
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
    conversationId: null,
    ...overrides,
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultLogger = new AuditLogger();
      expect(defaultLogger).toBeInstanceOf(AuditLogger);
    });

    it('should accept custom config', () => {
      const customLogger = new AuditLogger({
        enabled: false,
        logLevel: 'error',
      });
      expect(customLogger.getConfig().enabled).toBe(false);
      expect(customLogger.getConfig().logLevel).toBe('error');
    });
  });

  describe('logQuery()', () => {
    it('should log a successful query', () => {
      const entry = createEntry();
      logger.logQuery(entry);
      
      const recent = logger.getRecentEntries(1);
      expect(recent.length).toBe(1);
      expect(recent[0].question).toBe('Show me all products');
    });

    it('should log queries with errors', () => {
      const entry = createEntry({
        hasError: true,
        errorMessage: 'Query failed',
      });
      logger.logQuery(entry);
      
      const stats = logger.getStats();
      expect(stats.errors).toBe(1);
    });

    it('should log cached responses', () => {
      const entry = createEntry({ cached: true });
      logger.logQuery(entry);
      
      const stats = logger.getStats();
      expect(stats.cachedResponses).toBe(1);
    });

    it('should track LLM usage', () => {
      const entry = createEntry({
        llmUsed: true,
        llmProvider: 'openai',
      });
      logger.logQuery(entry);
      
      const stats = logger.getStats();
      expect(stats.llmUsage).toBe(1);
    });

    it('should not log when disabled', () => {
      const disabledLogger = new AuditLogger({
        enabled: false,
        logToConsole: false,
        logToFile: false,
      });
      disabledLogger.logQuery(createEntry());
      
      expect(disabledLogger.getRecentEntries().length).toBe(0);
    });
  });

  describe('logError()', () => {
    it('should log an error with Error object', () => {
      logger.logError(
        'req-123',
        'user-1',
        'ADMIN',
        'bad query',
        new Error('Database error')
      );
      
      const recent = logger.getRecentEntries(1);
      expect(recent[0].hasError).toBe(true);
      expect(recent[0].errorMessage).toBe('Database error');
    });

    it('should log an error with string', () => {
      logger.logError(
        'req-123',
        'user-1',
        'ADMIN',
        'bad query',
        'Something went wrong'
      );
      
      const recent = logger.getRecentEntries(1);
      expect(recent[0].errorMessage).toBe('Something went wrong');
    });

    it('should include context in error log', () => {
      logger.logError(
        'req-123',
        'user-1',
        'ADMIN',
        'bad query',
        new Error('Failed'),
        { templateUsed: 'list_products', executionTimeMs: 200 }
      );
      
      const recent = logger.getRecentEntries(1);
      expect(recent[0].templateUsed).toBe('list_products');
      expect(recent[0].executionTimeMs).toBe(200);
    });
  });

  describe('logAccessDenied()', () => {
    it('should log access denied events', () => {
      logger.logAccessDenied(
        'req-123',
        'user-1',
        'CSS',
        'show all products',
        'User does not have permission'
      );
      
      const recent = logger.getRecentEntries(1);
      expect(recent[0].accessDenied).toBe(true);
      expect(recent[0].userRole).toBe('CSS');
    });
  });

  describe('debug/info/warn/error methods', () => {
    it('should log debug messages', () => {
      const debugLogger = new AuditLogger({
        logLevel: 'debug',
        logToConsole: false,
        logToFile: false,
      });
      
      // Should not throw
      expect(() => debugLogger.debug('Test debug')).not.toThrow();
    });

    it('should log info messages', () => {
      expect(() => logger.info('Test info')).not.toThrow();
    });

    it('should log warn messages', () => {
      expect(() => logger.warn('Test warning')).not.toThrow();
    });

    it('should log error messages', () => {
      expect(() => logger.error('Test error')).not.toThrow();
    });

    it('should respect log level', () => {
      const errorOnlyLogger = new AuditLogger({
        logLevel: 'error',
        logToConsole: false,
        logToFile: false,
      });
      
      // These should be no-ops at error level
      expect(() => errorOnlyLogger.debug('ignored')).not.toThrow();
      expect(() => errorOnlyLogger.info('ignored')).not.toThrow();
      expect(() => errorOnlyLogger.warn('ignored')).not.toThrow();
    });
  });

  describe('getRecentEntries()', () => {
    it('should return recent entries in order', () => {
      for (let i = 0; i < 5; i++) {
        logger.logQuery(createEntry({ question: `Question ${i}` }));
      }
      
      const recent = logger.getRecentEntries(3);
      expect(recent.length).toBe(3);
    });

    it('should limit to available entries', () => {
      logger.logQuery(createEntry());
      logger.logQuery(createEntry());
      
      const recent = logger.getRecentEntries(100);
      expect(recent.length).toBe(2);
    });
  });

  describe('getStats()', () => {
    it('should calculate statistics correctly', () => {
      // Log various types of entries
      logger.logQuery(createEntry({ executionTimeMs: 100 }));
      logger.logQuery(createEntry({ executionTimeMs: 200, cached: true }));
      logger.logQuery(createEntry({ executionTimeMs: 300, hasError: true, errorMessage: 'err' }));
      logger.logQuery(createEntry({ executionTimeMs: 400, llmUsed: true, llmProvider: 'openai' }));
      
      const stats = logger.getStats();
      
      expect(stats.totalLogged).toBe(4);
      expect(stats.errors).toBe(1);
      expect(stats.cachedResponses).toBe(1);
      expect(stats.llmUsage).toBe(1);
      expect(stats.avgExecutionTime).toBe(250); // (100+200+300+400)/4
    });

    it('should handle empty buffer', () => {
      const stats = logger.getStats();
      expect(stats.totalLogged).toBe(0);
      expect(stats.avgExecutionTime).toBe(0);
    });
  });

  describe('setConfig()', () => {
    it('should update configuration', () => {
      logger.setConfig({ logLevel: 'warn' });
      expect(logger.getConfig().logLevel).toBe('warn');
    });

    it('should preserve unset values', () => {
      const originalEnabled = logger.getConfig().enabled;
      logger.setConfig({ logLevel: 'debug' });
      expect(logger.getConfig().enabled).toBe(originalEnabled);
    });
  });

  describe('generateRequestId()', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRequestId());
      }
      expect(ids.size).toBe(100);
    });

    it('should include "ai" prefix', () => {
      const id = generateRequestId();
      expect(id.startsWith('ai-')).toBe(true);
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance from getAuditLogger', () => {
      const instance1 = getAuditLogger();
      const instance2 = getAuditLogger();
      expect(instance1).toBe(instance2);
    });

    it('should reset with resetAuditLogger', () => {
      const instance1 = getAuditLogger();
      resetAuditLogger();
      const instance2 = getAuditLogger();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('destroy()', () => {
    it('should clean up resources', () => {
      expect(() => logger.destroy()).not.toThrow();
    });
  });
});





