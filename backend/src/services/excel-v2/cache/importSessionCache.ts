/**
 * Excel Import/Export V2 - Import Session Cache
 * 
 * In-memory cache for storing validated import data between dry run and execution.
 * This avoids re-parsing the Excel file when the user confirms the import.
 */

import crypto from 'crypto';
import {
    EntityType,
    ParsedWorkbook,
    DryRunResult,
    CachedImportSession,
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // Run cleanup every minute
const MAX_SESSIONS = 100; // Maximum concurrent sessions

// ============================================================================
// Import Session Cache
// ============================================================================

class ImportSessionCacheImpl {
    private cache: Map<string, CachedImportSession> = new Map();
    private cleanupTimer: NodeJS.Timeout | null = null;
    private ttlMs: number;

    constructor(ttlMs: number = DEFAULT_TTL_MS) {
        this.ttlMs = ttlMs;
        this.startCleanupTimer();
    }

    /**
     * Store validated data after dry run and return a session ID
     */
    store(
        entityType: EntityType,
        parsedData: ParsedWorkbook,
        dryRunResult: DryRunResult
    ): string {
        // Enforce max sessions limit
        if (this.cache.size >= MAX_SESSIONS) {
            this.evictOldest();
        }

        const sessionId = this.generateSessionId();
        const now = new Date();

        const session: CachedImportSession = {
            id: sessionId,
            entityType,
            parsedData,
            dryRunResult,
            createdAt: now,
            expiresAt: new Date(now.getTime() + this.ttlMs),
        };

        this.cache.set(sessionId, session);

        console.log(`[ImportSessionCache] Stored session ${sessionId}, expires at ${session.expiresAt.toISOString()}`);

        return sessionId;
    }

    /**
     * Retrieve a cached session by ID
     * Returns null if session doesn't exist or has expired
     */
    get(sessionId: string): CachedImportSession | null {
        const session = this.cache.get(sessionId);

        if (!session) {
            console.log(`[ImportSessionCache] Session ${sessionId} not found`);
            return null;
        }

        // Check expiration
        if (session.expiresAt < new Date()) {
            console.log(`[ImportSessionCache] Session ${sessionId} has expired`);
            this.cache.delete(sessionId);
            return null;
        }

        console.log(`[ImportSessionCache] Retrieved session ${sessionId}`);
        return session;
    }

    /**
     * Remove a session (after successful import or manual cleanup)
     */
    remove(sessionId: string): boolean {
        const deleted = this.cache.delete(sessionId);
        if (deleted) {
            console.log(`[ImportSessionCache] Removed session ${sessionId}`);
        }
        return deleted;
    }

    /**
     * Extend the expiration time for a session (e.g., user is still reviewing)
     */
    extend(sessionId: string, additionalMs?: number): boolean {
        const session = this.cache.get(sessionId);
        if (!session) {
            return false;
        }

        const extension = additionalMs ?? this.ttlMs;
        session.expiresAt = new Date(Date.now() + extension);
        console.log(`[ImportSessionCache] Extended session ${sessionId} to ${session.expiresAt.toISOString()}`);
        return true;
    }

    /**
     * Get the number of active sessions
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Clean up expired sessions
     */
    cleanup(): number {
        const now = new Date();
        let cleaned = 0;

        for (const [id, session] of this.cache) {
            if (session.expiresAt < now) {
                this.cache.delete(id);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            console.log(`[ImportSessionCache] Cleaned up ${cleaned} expired sessions`);
        }

        return cleaned;
    }

    /**
     * Clear all sessions (for testing or shutdown)
     */
    clear(): void {
        this.cache.clear();
        console.log(`[ImportSessionCache] Cleared all sessions`);
    }

    /**
     * Stop the cleanup timer (for graceful shutdown)
     */
    shutdown(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
            console.log(`[ImportSessionCache] Shutdown complete`);
        }
    }

    /**
     * Get session stats for monitoring
     */
    getStats(): {
        activeCount: number;
        oldestSession: Date | null;
        newestSession: Date | null;
    } {
        let oldest: Date | null = null;
        let newest: Date | null = null;

        for (const session of this.cache.values()) {
            if (!oldest || session.createdAt < oldest) {
                oldest = session.createdAt;
            }
            if (!newest || session.createdAt > newest) {
                newest = session.createdAt;
            }
        }

        return {
            activeCount: this.cache.size,
            oldestSession: oldest,
            newestSession: newest,
        };
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private generateSessionId(): string {
        return crypto.randomUUID();
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, CLEANUP_INTERVAL_MS);

        // Don't let the cleanup timer prevent process exit
        this.cleanupTimer.unref();
    }

    private evictOldest(): void {
        let oldestId: string | null = null;
        let oldestTime: Date | null = null;

        for (const [id, session] of this.cache) {
            if (!oldestTime || session.createdAt < oldestTime) {
                oldestId = id;
                oldestTime = session.createdAt;
            }
        }

        if (oldestId) {
            this.cache.delete(oldestId);
            console.log(`[ImportSessionCache] Evicted oldest session ${oldestId}`);
        }
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global import session cache instance
 */
export const importSessionCache = new ImportSessionCacheImpl();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Store a new import session
 */
export function storeImportSession(
    entityType: EntityType,
    parsedData: ParsedWorkbook,
    dryRunResult: DryRunResult
): string {
    return importSessionCache.store(entityType, parsedData, dryRunResult);
}

/**
 * Get an import session by ID
 */
export function getImportSession(sessionId: string): CachedImportSession | null {
    return importSessionCache.get(sessionId);
}

/**
 * Remove an import session
 */
export function removeImportSession(sessionId: string): boolean {
    return importSessionCache.remove(sessionId);
}

/**
 * Extend an import session
 */
export function extendImportSession(sessionId: string): boolean {
    return importSessionCache.extend(sessionId);
}

// ============================================================================
// Export Types
// ============================================================================

export type { CachedImportSession };
