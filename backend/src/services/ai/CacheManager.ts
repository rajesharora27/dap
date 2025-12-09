/**
 * AI Agent Cache Manager
 * 
 * Provides in-memory caching for AI query responses to improve performance
 * and reduce LLM API costs.
 * 
 * @module services/ai/CacheManager
 * @version 1.0.0
 * @created 2025-12-08
 */

import { AIQueryResponse } from './types';

/**
 * Cache entry structure
 */
interface CacheEntry {
  response: AIQueryResponse;
  timestamp: number;
  hitCount: number;
  userId: string;
  userRole: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalSizeBytes: number;
  oldestEntryAge: number;
  newestEntryAge: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttlMs: number;
  /** Maximum number of cache entries (default: 1000) */
  maxEntries: number;
  /** Whether to cache error responses (default: false) */
  cacheErrors: boolean;
  /** Whether caching is enabled (default: true) */
  enabled: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxEntries: 1000,
  cacheErrors: false,
  enabled: true,
};

/**
 * AI Query Cache Manager
 * 
 * Implements an LRU-like cache with TTL expiration for AI query responses.
 * 
 * Features:
 * - Question + user role based cache keys
 * - Configurable TTL
 * - Automatic eviction of expired entries
 * - LRU eviction when max entries reached
 * - Cache statistics tracking
 * 
 * @example
 * ```typescript
 * const cache = new CacheManager({ ttlMs: 60000 }); // 1 minute TTL
 * 
 * // Check cache before processing
 * const cached = cache.get('show all products', 'user-1', 'ADMIN');
 * if (cached) return cached;
 * 
 * // Process query...
 * const response = await processQuery();
 * 
 * // Store in cache
 * cache.set('show all products', 'user-1', 'ADMIN', response);
 * ```
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private hits: number = 0;
  private misses: number = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a cache key from question and user context
   * 
   * Keys are normalized to:
   * - Lowercase
   * - Trimmed whitespace
   * - Combined with user role (not user ID for better cache sharing)
   */
  private generateKey(question: string, userRole: string): string {
    const normalizedQuestion = question.toLowerCase().trim().replace(/\s+/g, ' ');
    return `${normalizedQuestion}::${userRole}`;
  }

  /**
   * Get a cached response
   * 
   * @param question - The natural language question
   * @param userId - The user ID (for logging)
   * @param userRole - The user's role (affects cache key)
   * @returns The cached response, or null if not found/expired
   */
  get(question: string, userId: string, userRole: string): AIQueryResponse | null {
    if (!this.config.enabled) {
      return null;
    }

    const key = this.generateKey(question, userRole);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.config.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update hit count
    entry.hitCount++;
    this.hits++;

    // Mark response as cached
    const cachedResponse = { ...entry.response };
    if (cachedResponse.metadata) {
      cachedResponse.metadata = {
        ...cachedResponse.metadata,
        cached: true,
      };
    }

    return cachedResponse;
  }

  /**
   * Store a response in the cache
   * 
   * @param question - The natural language question
   * @param userId - The user ID
   * @param userRole - The user's role
   * @param response - The AI query response
   */
  set(
    question: string,
    userId: string,
    userRole: string,
    response: AIQueryResponse
  ): void {
    if (!this.config.enabled) {
      return;
    }

    // Don't cache errors unless configured
    if (response.error && !this.config.cacheErrors) {
      return;
    }

    // Evict expired entries if approaching max
    if (this.cache.size >= this.config.maxEntries * 0.9) {
      this.evictExpired();
    }

    // Evict oldest entries if still at max
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest(Math.floor(this.config.maxEntries * 0.1));
    }

    const key = this.generateKey(question, userRole);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hitCount: 0,
      userId,
      userRole,
    });
  }

  /**
   * Check if a question is cached (without retrieving)
   */
  has(question: string, userRole: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const key = this.generateKey(question, userRole);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    const age = Date.now() - entry.timestamp;
    return age <= this.config.ttlMs;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(question: string, userRole: string): boolean {
    const key = this.generateKey(question, userRole);
    return this.cache.delete(key);
  }

  /**
   * Invalidate all entries for a specific user role
   */
  invalidateByRole(userRole: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.userRole === userRole) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalidate all entries matching a pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Evict expired entries
   */
  private evictExpired(): number {
    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        this.cache.delete(key);
        evicted++;
      }
    }

    return evicted;
  }

  /**
   * Evict the oldest N entries
   */
  private evictOldest(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let oldestAge = 0;
    let newestAge = Infinity;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age > oldestAge) oldestAge = age;
      if (age < newestAge) newestAge = age;
      totalSize += JSON.stringify(entry.response).length * 2; // Rough estimate
    }

    const totalRequests = this.hits + this.misses;

    return {
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      totalSizeBytes: totalSize,
      oldestEntryAge: this.cache.size > 0 ? oldestAge : 0,
      newestEntryAge: this.cache.size > 0 && newestAge !== Infinity ? newestAge : 0,
    };
  }

  /**
   * Get the current configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Check if caching is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

// Singleton instance
let instance: CacheManager | null = null;

/**
 * Get the singleton CacheManager instance
 */
export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!instance) {
    instance = new CacheManager(config);
  }
  return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetCacheManager(): void {
  instance = null;
}





