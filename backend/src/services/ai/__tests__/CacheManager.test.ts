/**
 * CacheManager Tests
 * 
 * Tests for the AI Agent caching layer (Phase 4.1)
 */

import {
  CacheManager,
  getCacheManager,
  resetCacheManager,
  CacheStats,
} from '../CacheManager';
import { AIQueryResponse } from '../types';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    resetCacheManager();
    cache = new CacheManager({ ttlMs: 5000, maxEntries: 100 });
  });

  afterEach(() => {
    resetCacheManager();
  });

  // Helper to create mock responses
  const createMockResponse = (answer: string): AIQueryResponse => ({
    answer,
    metadata: {
      executionTime: 100,
      rowCount: 10,
      truncated: false,
      cached: false,
    },
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultCache = new CacheManager();
      expect(defaultCache).toBeInstanceOf(CacheManager);
      expect(defaultCache.isEnabled()).toBe(true);
    });

    it('should accept custom config', () => {
      const customCache = new CacheManager({
        ttlMs: 10000,
        maxEntries: 50,
        enabled: false,
      });
      expect(customCache.isEnabled()).toBe(false);
    });
  });

  describe('get/set operations', () => {
    it('should store and retrieve a response', () => {
      const response = createMockResponse('Test answer');
      cache.set('show products', 'user-1', 'ADMIN', response);
      
      const cached = cache.get('show products', 'user-1', 'ADMIN');
      expect(cached).not.toBeNull();
      expect(cached?.answer).toBe('Test answer');
    });

    it('should mark retrieved responses as cached', () => {
      const response = createMockResponse('Test answer');
      cache.set('show products', 'user-1', 'ADMIN', response);
      
      const cached = cache.get('show products', 'user-1', 'ADMIN');
      expect(cached?.metadata?.cached).toBe(true);
    });

    it('should return null for non-existent entries', () => {
      const cached = cache.get('unknown question', 'user-1', 'ADMIN');
      expect(cached).toBeNull();
    });

    it('should normalize questions (lowercase, trim)', () => {
      const response = createMockResponse('Test answer');
      cache.set('  SHOW PRODUCTS  ', 'user-1', 'ADMIN', response);
      
      const cached = cache.get('show products', 'user-1', 'ADMIN');
      expect(cached).not.toBeNull();
    });

    it('should separate cache by user role', () => {
      const adminResponse = createMockResponse('Admin answer');
      const smeResponse = createMockResponse('SME answer');
      
      cache.set('show products', 'user-1', 'ADMIN', adminResponse);
      cache.set('show products', 'user-2', 'SME', smeResponse);
      
      expect(cache.get('show products', 'any-user', 'ADMIN')?.answer).toBe('Admin answer');
      expect(cache.get('show products', 'any-user', 'SME')?.answer).toBe('SME answer');
    });

    it('should not cache error responses by default', () => {
      const errorResponse: AIQueryResponse = {
        answer: 'Error occurred',
        error: 'Something went wrong',
        metadata: {
          executionTime: 50,
          rowCount: 0,
          truncated: false,
          cached: false,
        },
      };
      
      cache.set('bad query', 'user-1', 'ADMIN', errorResponse);
      expect(cache.get('bad query', 'user-1', 'ADMIN')).toBeNull();
    });

    it('should cache error responses when configured', () => {
      const errorCache = new CacheManager({ cacheErrors: true });
      const errorResponse: AIQueryResponse = {
        answer: 'Error occurred',
        error: 'Something went wrong',
        metadata: {
          executionTime: 50,
          rowCount: 0,
          truncated: false,
          cached: false,
        },
      };
      
      errorCache.set('bad query', 'user-1', 'ADMIN', errorResponse);
      expect(errorCache.get('bad query', 'user-1', 'ADMIN')).not.toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const shortTTLCache = new CacheManager({ ttlMs: 50 });
      const response = createMockResponse('Short-lived');
      
      shortTTLCache.set('question', 'user-1', 'ADMIN', response);
      expect(shortTTLCache.get('question', 'user-1', 'ADMIN')).not.toBeNull();
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(shortTTLCache.get('question', 'user-1', 'ADMIN')).toBeNull();
    });
  });

  describe('has()', () => {
    it('should return true for cached entries', () => {
      cache.set('question', 'user-1', 'ADMIN', createMockResponse('Answer'));
      expect(cache.has('question', 'ADMIN')).toBe(true);
    });

    it('should return false for non-cached entries', () => {
      expect(cache.has('unknown', 'ADMIN')).toBe(false);
    });
  });

  describe('invalidate()', () => {
    it('should invalidate specific entry', () => {
      cache.set('question', 'user-1', 'ADMIN', createMockResponse('Answer'));
      expect(cache.has('question', 'ADMIN')).toBe(true);
      
      cache.invalidate('question', 'ADMIN');
      expect(cache.has('question', 'ADMIN')).toBe(false);
    });

    it('should return true when entry was removed', () => {
      cache.set('question', 'user-1', 'ADMIN', createMockResponse('Answer'));
      expect(cache.invalidate('question', 'ADMIN')).toBe(true);
    });

    it('should return false when entry did not exist', () => {
      expect(cache.invalidate('nonexistent', 'ADMIN')).toBe(false);
    });
  });

  describe('invalidateByRole()', () => {
    it('should invalidate all entries for a role', () => {
      cache.set('q1', 'user-1', 'ADMIN', createMockResponse('A1'));
      cache.set('q2', 'user-2', 'ADMIN', createMockResponse('A2'));
      cache.set('q3', 'user-3', 'SME', createMockResponse('A3'));
      
      const count = cache.invalidateByRole('ADMIN');
      
      expect(count).toBe(2);
      expect(cache.has('q1', 'ADMIN')).toBe(false);
      expect(cache.has('q2', 'ADMIN')).toBe(false);
      expect(cache.has('q3', 'SME')).toBe(true);
    });
  });

  describe('invalidateByPattern()', () => {
    it('should invalidate entries matching pattern', () => {
      cache.set('show products', 'user-1', 'ADMIN', createMockResponse('P'));
      cache.set('show customers', 'user-1', 'ADMIN', createMockResponse('C'));
      cache.set('count tasks', 'user-1', 'ADMIN', createMockResponse('T'));
      
      const count = cache.invalidateByPattern(/show/);
      
      expect(count).toBe(2);
      expect(cache.has('show products', 'ADMIN')).toBe(false);
      expect(cache.has('show customers', 'ADMIN')).toBe(false);
      expect(cache.has('count tasks', 'ADMIN')).toBe(true);
    });
  });

  describe('clear()', () => {
    it('should remove all entries', () => {
      cache.set('q1', 'user-1', 'ADMIN', createMockResponse('A1'));
      cache.set('q2', 'user-2', 'SME', createMockResponse('A2'));
      
      cache.clear();
      
      expect(cache.getStats().entries).toBe(0);
    });

    it('should reset hit/miss counters', () => {
      cache.set('q1', 'user-1', 'ADMIN', createMockResponse('A1'));
      cache.get('q1', 'user-1', 'ADMIN'); // hit
      cache.get('q2', 'user-1', 'ADMIN'); // miss
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('should track hits and misses', () => {
      cache.set('q1', 'user-1', 'ADMIN', createMockResponse('A1'));
      cache.get('q1', 'user-1', 'ADMIN'); // hit
      cache.get('q1', 'user-1', 'ADMIN'); // hit
      cache.get('q2', 'user-1', 'ADMIN'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(2 / 3);
    });

    it('should track entry count', () => {
      cache.set('q1', 'user-1', 'ADMIN', createMockResponse('A1'));
      cache.set('q2', 'user-1', 'ADMIN', createMockResponse('A2'));
      
      expect(cache.getStats().entries).toBe(2);
    });

    it('should estimate size', () => {
      cache.set('q1', 'user-1', 'ADMIN', createMockResponse('A1'));
      
      const stats = cache.getStats();
      expect(stats.totalSizeBytes).toBeGreaterThan(0);
    });
  });

  describe('max entries eviction', () => {
    it('should evict old entries when max reached', () => {
      const smallCache = new CacheManager({ maxEntries: 10 });
      
      // Fill cache
      for (let i = 0; i < 15; i++) {
        smallCache.set(`question-${i}`, 'user-1', 'ADMIN', createMockResponse(`A${i}`));
      }
      
      // Should have evicted some
      expect(smallCache.getStats().entries).toBeLessThanOrEqual(10);
    });
  });

  describe('disabled cache', () => {
    it('should not store when disabled', () => {
      const disabledCache = new CacheManager({ enabled: false });
      disabledCache.set('q1', 'user-1', 'ADMIN', createMockResponse('A1'));
      
      expect(disabledCache.get('q1', 'user-1', 'ADMIN')).toBeNull();
    });

    it('should be toggleable', () => {
      cache.setEnabled(false);
      cache.set('q1', 'user-1', 'ADMIN', createMockResponse('A1'));
      expect(cache.get('q1', 'user-1', 'ADMIN')).toBeNull();
      
      cache.setEnabled(true);
      cache.set('q2', 'user-1', 'ADMIN', createMockResponse('A2'));
      expect(cache.get('q2', 'user-1', 'ADMIN')).not.toBeNull();
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance from getCacheManager', () => {
      const instance1 = getCacheManager();
      const instance2 = getCacheManager();
      expect(instance1).toBe(instance2);
    });

    it('should reset with resetCacheManager', () => {
      const instance1 = getCacheManager();
      resetCacheManager();
      const instance2 = getCacheManager();
      expect(instance1).not.toBe(instance2);
    });
  });
});




