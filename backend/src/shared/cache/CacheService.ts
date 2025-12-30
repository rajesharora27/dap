/**
 * Cache Service
 * 
 * Provides an in-memory LRU cache for frequently accessed data.
 * Can be replaced with Redis for multi-server deployments.
 * 
 * @module shared/cache/CacheService
 */

/**
 * Cache entry with value and metadata
 */
interface CacheEntry<T> {
    value: T;
    expiry: number;
    createdAt: number;
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    evictions: number;
}

/**
 * LRU (Least Recently Used) Cache implementation
 * Automatically evicts least recently used items when capacity is reached.
 */
export class CacheService {
    private static instance: CacheService;
    private cache: Map<string, CacheEntry<any>> = new Map();
    private stats: CacheStats = { hits: 0, misses: 0, size: 0, evictions: 0 };
    private readonly maxSize: number;
    private readonly defaultTTL: number;

    /**
     * Create a new cache service
     * @param maxSize - Maximum number of items to cache (default: 1000)
     * @param defaultTTL - Default time-to-live in milliseconds (default: 5 minutes)
     */
    private constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) {
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;

        // Periodic cleanup of expired entries
        setInterval(() => this.cleanup(), 60000); // Every minute
    }

    /**
     * Get singleton instance
     */
    static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    /**
     * Get a value from cache
     * @param key - Cache key
     * @returns Cached value or undefined if not found/expired
     */
    get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return undefined;
        }

        // Check if expired
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            this.stats.misses++;
            return undefined;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        
        this.stats.hits++;
        return entry.value;
    }

    /**
     * Set a value in cache
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time-to-live in milliseconds (optional, uses default if not provided)
     */
    set<T>(key: string, value: T, ttl?: number): void {
        // Evict if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictOldest();
        }

        const entry: CacheEntry<T> = {
            value,
            expiry: Date.now() + (ttl || this.defaultTTL),
            createdAt: Date.now(),
        };

        this.cache.set(key, entry);
        this.stats.size = this.cache.size;
    }

    /**
     * Delete a value from cache
     * @param key - Cache key
     * @returns True if deleted, false if not found
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        this.stats.size = this.cache.size;
        return deleted;
    }

    /**
     * Delete all keys matching a pattern
     * @param pattern - Key prefix pattern
     * @returns Number of keys deleted
     */
    deletePattern(pattern: string): number {
        let deleted = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(pattern)) {
                this.cache.delete(key);
                deleted++;
            }
        }
        this.stats.size = this.cache.size;
        return deleted;
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.clear();
        this.stats.size = 0;
    }

    /**
     * Get or set a value using a factory function
     * If not cached, calls the factory to generate and cache the value.
     * 
     * @param key - Cache key
     * @param factory - Function to generate value if not cached
     * @param ttl - Time-to-live in milliseconds
     * @returns Cached or newly generated value
     * 
     * @example
     * ```typescript
     * const products = await cache.getOrSet(
     *   'products:all',
     *   async () => prisma.product.findMany(),
     *   60000 // 1 minute
     * );
     * ```
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== undefined) {
            return cached;
        }

        const value = await factory();
        this.set(key, value, ttl);
        return value;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats & { hitRate: number } {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? this.stats.hits / total : 0,
        };
    }

    /**
     * Check if a key exists and is not expired
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Evict the oldest (least recently used) entry
     */
    private evictOldest(): void {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        this.stats.size = this.cache.size;
        
        if (cleaned > 0) {
            console.debug(`[Cache] Cleaned ${cleaned} expired entries`);
        }
    }
}

/**
 * Cache key builders for consistent key generation
 */
export const CacheKeys = {
    product: (id: string) => `product:${id}`,
    products: () => 'products:all',
    productWithRelations: (id: string) => `product:${id}:full`,
    
    solution: (id: string) => `solution:${id}`,
    solutions: () => 'solutions:all',
    solutionWithRelations: (id: string) => `solution:${id}:full`,
    
    customer: (id: string) => `customer:${id}`,
    customers: () => 'customers:all',
    
    user: (id: string) => `user:${id}`,
    userByUsername: (username: string) => `user:username:${username}`,
    
    tags: () => 'tags:all',
    
    // Prefixes for pattern deletion
    PRODUCTS_PREFIX: 'product',
    SOLUTIONS_PREFIX: 'solution',
    CUSTOMERS_PREFIX: 'customer',
    USERS_PREFIX: 'user',
};

/**
 * Default cache TTLs in milliseconds
 */
export const CacheTTL = {
    SHORT: 30 * 1000,         // 30 seconds - for frequently changing data
    MEDIUM: 5 * 60 * 1000,    // 5 minutes - default
    LONG: 30 * 60 * 1000,     // 30 minutes - for rarely changing data
    HOUR: 60 * 60 * 1000,     // 1 hour
};

// Export singleton instance
export const cache = CacheService.getInstance();

