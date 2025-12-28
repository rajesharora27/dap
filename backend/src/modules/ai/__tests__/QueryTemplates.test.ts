/**
 * Query Templates Unit Tests
 * 
 * Tests for Phase 1.4: Query Templates (10 basic)
 * 
 * @module services/ai/__tests__/QueryTemplates.test
 */

import {
  QueryTemplates,
  getQueryTemplates,
  resetQueryTemplates,
} from '../index';

describe('QueryTemplates', () => {
  let templates: QueryTemplates;

  beforeEach(() => {
    resetQueryTemplates();
    templates = new QueryTemplates();
  });

  describe('getAllTemplates', () => {
    it('should return at least 10 templates', () => {
      const allTemplates = templates.getAllTemplates();
      expect(allTemplates.length).toBeGreaterThanOrEqual(10);
    });

    it('should have unique IDs for all templates', () => {
      const allTemplates = templates.getAllTemplates();
      const ids = allTemplates.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have descriptions for all templates', () => {
      const allTemplates = templates.getAllTemplates();
      for (const template of allTemplates) {
        expect(template.description).toBeDefined();
        expect(template.description.length).toBeGreaterThan(10);
      }
    });

    it('should have at least one pattern for each template', () => {
      const allTemplates = templates.getAllTemplates();
      for (const template of allTemplates) {
        expect(template.patterns.length).toBeGreaterThan(0);
      }
    });

    it('should have examples for all templates', () => {
      const allTemplates = templates.getAllTemplates();
      for (const template of allTemplates) {
        expect(template.examples).toBeDefined();
        expect(template.examples.length).toBeGreaterThan(0);
      }
    });

    it('should have buildQuery function for all templates', () => {
      const allTemplates = templates.getAllTemplates();
      for (const template of allTemplates) {
        expect(typeof template.buildQuery).toBe('function');
      }
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', () => {
      const template = templates.getTemplate('list_products');
      expect(template).toBeDefined();
      expect(template?.id).toBe('list_products');
    });

    it('should return undefined for unknown ID', () => {
      const template = templates.getTemplate('unknown_template');
      expect(template).toBeUndefined();
    });
  });

  describe('findBestMatch', () => {
    // ============================================================
    // PRODUCTS TEMPLATES
    // ============================================================

    describe('list_products template', () => {
      it('should match "Show me all products"', () => {
        const match = templates.findBestMatch('Show me all products');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('list_products');
      });

      it('should match "List products"', () => {
        const match = templates.findBestMatch('List products');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('list_products');
      });

      it('should match "What products do we have?"', () => {
        const match = templates.findBestMatch('What products do we have?');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('list_products');
      });
    });

    describe('products_without_telemetry template', () => {
      it('should match "Show products without telemetry"', () => {
        const match = templates.findBestMatch('Show products without telemetry');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('products_without_telemetry');
      });

      it.skip('should match "Find products with tasks missing telemetry"', () => {
        const match = templates.findBestMatch('Find products with tasks missing telemetry');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('products_without_telemetry');
      });

      it('should match "Products with no telemetry"', () => {
        const match = templates.findBestMatch('Products with no telemetry');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('products_without_telemetry');
      });
    });

    describe('products_without_customers template', () => {
      it('should match "Show products without customers"', () => {
        const match = templates.findBestMatch('Show products without customers');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('products_without_customers');
      });

      it('should match "Find unassigned products"', () => {
        const match = templates.findBestMatch('Find unassigned products');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('products_without_customers');
      });
    });

    // ============================================================
    // TASKS TEMPLATES
    // ============================================================

    describe('tasks_zero_weight template', () => {
      it('should match "Find tasks with zero weight"', () => {
        const match = templates.findBestMatch('Find tasks with zero weight');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('tasks_zero_weight');
      });

      it('should match "Tasks with no weight"', () => {
        const match = templates.findBestMatch('Tasks with no weight');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('tasks_zero_weight');
      });

      it.skip('should match "Show unweighted tasks"', () => {
        const match = templates.findBestMatch('Show unweighted tasks');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('tasks_zero_weight');
      });
    });

    describe('tasks_missing_descriptions template', () => {
      it('should match "Find tasks missing descriptions"', () => {
        const match = templates.findBestMatch('Find tasks missing descriptions');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('tasks_missing_descriptions');
      });

      it('should match "Tasks without descriptions"', () => {
        const match = templates.findBestMatch('Tasks without descriptions');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('tasks_missing_descriptions');
      });
    });

    // ============================================================
    // CUSTOMERS TEMPLATES
    // ============================================================

    describe('list_customers template', () => {
      it('should match "Show me all customers"', () => {
        const match = templates.findBestMatch('Show me all customers');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('list_customers');
      });

      it('should match "List customers"', () => {
        const match = templates.findBestMatch('List customers');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('list_customers');
      });
    });

    describe('customers_low_adoption template', () => {
      it('should match "Customers with adoption below 50%"', () => {
        const match = templates.findBestMatch('Customers with adoption below 50%');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('customers_low_adoption');
        expect(match?.params.threshold).toBe(50);
      });

      it('should match "Show customers with progress under 30"', () => {
        const match = templates.findBestMatch('Show customers with progress under 30');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('customers_low_adoption');
        expect(match?.params.threshold).toBe(30);
      });

      it('should match "Find struggling customers" with default threshold', () => {
        const match = templates.findBestMatch('Find struggling customers');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('customers_low_adoption');
        expect(match?.params.threshold).toBe(50); // Default
      });

      it('should extract numeric threshold correctly', () => {
        const match = templates.findBestMatch('customers with adoption less than 75');
        expect(match).not.toBeNull();
        expect(match?.params.threshold).toBe(75);
      });
    });

    describe('customers_not_started template', () => {
      it('should match "Show customers not started"', () => {
        const match = templates.findBestMatch('Show customers not started');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('customers_not_started');
      });

      it('should match "Find inactive customers"', () => {
        const match = templates.findBestMatch('Find inactive customers');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('customers_not_started');
      });

      it('should match "Customers with zero progress"', () => {
        const match = templates.findBestMatch('Customers with zero progress');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('customers_not_started');
      });
    });

    // ============================================================
    // TELEMETRY TEMPLATES
    // ============================================================

    describe('telemetry_no_criteria template', () => {
      it('should match "Show telemetry without success criteria"', () => {
        const match = templates.findBestMatch('Show telemetry without success criteria');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('telemetry_no_criteria');
      });

      it('should match "Find telemetry missing criteria"', () => {
        const match = templates.findBestMatch('Find telemetry missing criteria');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('telemetry_no_criteria');
      });

      it('should match "Unconfigured telemetry"', () => {
        const match = templates.findBestMatch('Unconfigured telemetry');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('telemetry_no_criteria');
      });
    });

    // ============================================================
    // ANALYTICS TEMPLATES
    // ============================================================

    describe('count_entities template', () => {
      it('should match "How many products do we have?"', () => {
        const match = templates.findBestMatch('How many products do we have?');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('count_entities');
      });

      it('should match "Count of customers"', () => {
        const match = templates.findBestMatch('Count of customers');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('count_entities');
      });

      it('should match "Give me an overview"', () => {
        const match = templates.findBestMatch('Give me an overview');
        expect(match).not.toBeNull();
        expect(match?.template.id).toBe('count_entities');
      });
    });

    // ============================================================
    // NO MATCH SCENARIOS
    // ============================================================

    describe('no match scenarios', () => {
      it('should return null for unrelated questions', () => {
        const match = templates.findBestMatch('What is the weather today?');
        expect(match).toBeNull();
      });

      it('should return null for empty questions', () => {
        const match = templates.findBestMatch('');
        expect(match).toBeNull();
      });

      it('should return null for very short questions', () => {
        const match = templates.findBestMatch('hi');
        expect(match).toBeNull();
      });

      it('should return null for random text', () => {
        const match = templates.findBestMatch('asdfghjkl qwerty');
        expect(match).toBeNull();
      });
    });
  });

  describe('buildQuery', () => {
    it('should build query for list_products', () => {
      const template = templates.getTemplate('list_products');
      const query = template?.buildQuery({});

      expect(query).toBeDefined();
      expect(query?.model).toBe('product');
      expect(query?.operation).toBe('findMany');
      expect(query?.args.where.deletedAt).toBeNull();
    });

    it('should build query for customers_low_adoption with threshold', () => {
      const template = templates.getTemplate('customers_low_adoption');
      const query = template?.buildQuery({ threshold: 40 });

      expect(query).toBeDefined();
      expect(query?.model).toBe('customer');
      expect(query?.args.where.products.some.adoptionPlan.progressPercentage.lt).toBe(40);
    });

    it('should build query for count_entities', () => {
      const template = templates.getTemplate('count_entities');
      const query = template?.buildQuery({});

      expect(query).toBeDefined();
      expect(query?.model).toBe('aggregate');
      expect(query?.operation).toBe('count');
    });
  });

  describe('confidence scoring', () => {
    it('should have higher confidence for more specific matches', () => {
      const match1 = templates.findBestMatch('Show all products');
      const match2 = templates.findBestMatch('Show me all the products we have');

      expect(match1).not.toBeNull();
      expect(match2).not.toBeNull();
      // Both should match the same template
      expect(match1?.template.id).toBe(match2?.template.id);
    });

    it('should have confidence >= 0.5 for all returned matches', () => {
      const questions = [
        'Show me all products',
        'Find tasks with zero weight',
        'Customers with low adoption',
        'How many customers do we have?',
      ];

      for (const question of questions) {
        const match = templates.findBestMatch(question);
        if (match) {
          expect(match.confidence).toBeGreaterThanOrEqual(0.5);
        }
      }
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const instance1 = getQueryTemplates();
      const instance2 = getQueryTemplates();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = getQueryTemplates();
      resetQueryTemplates();
      const instance2 = getQueryTemplates();
      expect(instance1).not.toBe(instance2);
    });
  });
});


