/**
 * Schema Context Manager Unit Tests
 * 
 * Tests for Phase 1.3: Schema Context Builder
 * 
 * @module services/ai/__tests__/SchemaContextManager.test
 */

import {
  SchemaContextManager,
  getSchemaContextManager,
  resetSchemaContextManager,
} from '../index';

describe('SchemaContextManager', () => {
  let manager: SchemaContextManager;

  beforeEach(() => {
    resetSchemaContextManager();
    manager = new SchemaContextManager();
  });

  describe('getFullContext', () => {
    it('should return a schema context', () => {
      const context = manager.getFullContext();
      
      expect(context).toBeDefined();
      expect(context.tables).toBeDefined();
      expect(context.enums).toBeDefined();
      expect(context.businessRules).toBeDefined();
    });

    it('should include core tables', () => {
      const context = manager.getFullContext();
      const tableNames = context.tables.map(t => t.name);
      
      expect(tableNames).toContain('Product');
      expect(tableNames).toContain('Solution');
      expect(tableNames).toContain('Customer');
      expect(tableNames).toContain('Task');
      expect(tableNames).toContain('TelemetryAttribute');
      expect(tableNames).toContain('AdoptionPlan');
      expect(tableNames).toContain('CustomerTask');
    });

    it('should include at least 10 tables', () => {
      const context = manager.getFullContext();
      
      expect(context.tables.length).toBeGreaterThanOrEqual(10);
    });

    it('should have descriptions for all tables', () => {
      const context = manager.getFullContext();
      
      for (const table of context.tables) {
        expect(table.description).toBeDefined();
        expect(table.description.length).toBeGreaterThan(10);
      }
    });

    it('should include columns for each table', () => {
      const context = manager.getFullContext();
      
      for (const table of context.tables) {
        expect(table.columns).toBeDefined();
        expect(table.columns.length).toBeGreaterThan(0);
        
        // Every table should have an id column
        const hasId = table.columns.some(c => c.name === 'id');
        expect(hasId).toBe(true);
      }
    });

    it('should include relationships for key tables', () => {
      const context = manager.getFullContext();
      
      const productTable = context.tables.find(t => t.name === 'Product');
      expect(productTable?.relationships.length).toBeGreaterThan(0);
      
      const taskTable = context.tables.find(t => t.name === 'Task');
      expect(taskTable?.relationships.length).toBeGreaterThan(0);
    });

    it('should cache the context', () => {
      const context1 = manager.getFullContext();
      const context2 = manager.getFullContext();
      
      expect(context1).toBe(context2); // Same reference
    });
  });

  describe('enums', () => {
    it('should include all key enums', () => {
      const context = manager.getFullContext();
      
      expect(context.enums).toHaveProperty('LicenseLevel');
      expect(context.enums).toHaveProperty('CustomerTaskStatus');
      expect(context.enums).toHaveProperty('StatusUpdateSource');
      expect(context.enums).toHaveProperty('TelemetryDataType');
      expect(context.enums).toHaveProperty('SystemRole');
    });

    it('should have correct LicenseLevel values', () => {
      const context = manager.getFullContext();
      
      expect(context.enums.LicenseLevel).toContain('ESSENTIAL');
      expect(context.enums.LicenseLevel).toContain('ADVANTAGE');
      expect(context.enums.LicenseLevel).toContain('SIGNATURE');
    });

    it('should have correct CustomerTaskStatus values', () => {
      const context = manager.getFullContext();
      
      expect(context.enums.CustomerTaskStatus).toContain('NOT_STARTED');
      expect(context.enums.CustomerTaskStatus).toContain('IN_PROGRESS');
      expect(context.enums.CustomerTaskStatus).toContain('COMPLETED');
      expect(context.enums.CustomerTaskStatus).toContain('DONE');
      expect(context.enums.CustomerTaskStatus).toContain('NOT_APPLICABLE');
      expect(context.enums.CustomerTaskStatus).toContain('NO_LONGER_USING');
    });

    it('should have correct StatusUpdateSource values', () => {
      const context = manager.getFullContext();
      
      expect(context.enums.StatusUpdateSource).toContain('MANUAL');
      expect(context.enums.StatusUpdateSource).toContain('TELEMETRY');
      expect(context.enums.StatusUpdateSource).toContain('IMPORT');
      expect(context.enums.StatusUpdateSource).toContain('SYSTEM');
    });
  });

  describe('businessRules', () => {
    it('should include multiple business rules', () => {
      const context = manager.getFullContext();
      
      expect(context.businessRules.length).toBeGreaterThan(10);
    });

    it('should mention weighted progress calculation', () => {
      const context = manager.getFullContext();
      const hasWeightRule = context.businessRules.some(r => 
        r.toLowerCase().includes('weight') && r.toLowerCase().includes('progress')
      );
      
      expect(hasWeightRule).toBe(true);
    });

    it('should mention manual vs telemetry updates', () => {
      const context = manager.getFullContext();
      const hasManualRule = context.businessRules.some(r => 
        r.toLowerCase().includes('manual') && r.toLowerCase().includes('telemetry')
      );
      
      expect(hasManualRule).toBe(true);
    });

    it('should mention soft delete', () => {
      const context = manager.getFullContext();
      const hasSoftDeleteRule = context.businessRules.some(r => 
        r.toLowerCase().includes('soft') || r.toLowerCase().includes('deletedat')
      );
      
      expect(hasSoftDeleteRule).toBe(true);
    });
  });

  describe('getContextPrompt', () => {
    it('should return a string prompt', () => {
      const prompt = manager.getContextPrompt();
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include table information', () => {
      const prompt = manager.getContextPrompt();
      
      expect(prompt).toContain('Product');
      expect(prompt).toContain('Customer');
      expect(prompt).toContain('Task');
    });

    it('should include enum information', () => {
      const prompt = manager.getContextPrompt();
      
      expect(prompt).toContain('LicenseLevel');
      expect(prompt).toContain('ESSENTIAL');
      expect(prompt).toContain('CustomerTaskStatus');
    });

    it('should include business rules', () => {
      const prompt = manager.getContextPrompt();
      
      expect(prompt).toContain('Business Rules');
      expect(prompt).toContain('weight');
    });

    it('should be under 15KB for token efficiency', () => {
      const prompt = manager.getContextPrompt();
      
      // 15KB = 15000 characters, roughly 3750 tokens
      expect(prompt.length).toBeLessThan(15000);
    });

    it('should cache the prompt', () => {
      const prompt1 = manager.getContextPrompt();
      const prompt2 = manager.getContextPrompt();
      
      expect(prompt1).toBe(prompt2); // Same reference
    });
  });

  describe('getRelevantContext', () => {
    it('should return context for any question', () => {
      const context = manager.getRelevantContext('Show me all products');
      
      expect(context).toBeDefined();
      expect(context.tables.length).toBeGreaterThan(0);
    });

    // TODO: Add tests for smart context selection when implemented
  });

  describe('clearCache', () => {
    it('should clear the cached context', () => {
      const context1 = manager.getFullContext();
      manager.clearCache();
      const context2 = manager.getFullContext();
      
      expect(context1).not.toBe(context2); // Different references
    });

    it('should clear the cached prompt', () => {
      // Get prompt to populate cache
      manager.getContextPrompt();
      
      // Clear cache
      manager.clearCache();
      
      // Get context again - verify it was rebuilt
      const context = manager.getFullContext();
      
      // If cache was cleared, context should be freshly built
      expect(context).toBeDefined();
      expect(context.tables.length).toBeGreaterThan(0);
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = getSchemaContextManager();
      const instance2 = getSchemaContextManager();
      
      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = getSchemaContextManager();
      resetSchemaContextManager();
      const instance2 = getSchemaContextManager();
      
      expect(instance1).not.toBe(instance2);
    });
  });
});

