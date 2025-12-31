/**
 * Health Check Endpoints
 * 
 * Provides comprehensive health and readiness endpoints for container orchestration
 * and load balancer health probes.
 * 
 * @module shared/health/healthCheck
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { cache } from '../cache';

/**
 * Health status enum
 */
export enum HealthStatus {
    HEALTHY = 'healthy',
    DEGRADED = 'degraded',
    UNHEALTHY = 'unhealthy',
}

/**
 * Health check result for a single component
 */
interface ComponentHealth {
    status: HealthStatus;
    latency?: number;
    message?: string;
    lastChecked: string;
}

/**
 * Overall health response
 */
interface HealthResponse {
    status: HealthStatus;
    version: string;
    uptime: number;
    timestamp: string;
    components: {
        database: ComponentHealth;
        cache: ComponentHealth;
        memory: ComponentHealth;
    };
}

/**
 * Readiness check response
 */
interface ReadinessResponse {
    ready: boolean;
    checks: {
        database: boolean;
        migrations: boolean;
    };
}

/**
 * Liveness check response (simple)
 */
interface LivenessResponse {
    alive: boolean;
    timestamp: string;
}

/**
 * Check database connectivity and latency
 */
async function checkDatabase(prisma: PrismaClient): Promise<ComponentHealth> {
    const startTime = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        const latency = Date.now() - startTime;
        
        return {
            status: latency < 100 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
            latency,
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            status: HealthStatus.UNHEALTHY,
            message: error instanceof Error ? error.message : 'Database connection failed',
            lastChecked: new Date().toISOString(),
        };
    }
}

/**
 * Check cache health
 */
function checkCache(): ComponentHealth {
    try {
        const stats = cache.getStats();
        const hitRate = stats.hitRate;
        
        return {
            status: HealthStatus.HEALTHY,
            message: `Cache hit rate: ${(hitRate * 100).toFixed(1)}%, size: ${stats.size}`,
            lastChecked: new Date().toISOString(),
        };
    } catch (error) {
        return {
            status: HealthStatus.DEGRADED,
            message: 'Cache stats unavailable',
            lastChecked: new Date().toISOString(),
        };
    }
}

/**
 * Check memory usage
 */
function checkMemory(): ComponentHealth {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const percentUsed = (usage.heapUsed / usage.heapTotal) * 100;
    
    let status: HealthStatus;
    if (percentUsed < 70) {
        status = HealthStatus.HEALTHY;
    } else if (percentUsed < 90) {
        status = HealthStatus.DEGRADED;
    } else {
        status = HealthStatus.UNHEALTHY;
    }
    
    return {
        status,
        message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentUsed.toFixed(1)}%)`,
        lastChecked: new Date().toISOString(),
    };
}

/**
 * Determine overall health status from components
 */
function aggregateStatus(components: HealthResponse['components']): HealthStatus {
    const statuses = Object.values(components).map(c => c.status);
    
    if (statuses.some(s => s === HealthStatus.UNHEALTHY)) {
        return HealthStatus.UNHEALTHY;
    }
    if (statuses.some(s => s === HealthStatus.DEGRADED)) {
        return HealthStatus.DEGRADED;
    }
    return HealthStatus.HEALTHY;
}

/**
 * Create health check router
 * 
 * Endpoints:
 * - GET /health - Detailed health status
 * - GET /health/live - Liveness probe (is process running?)
 * - GET /health/ready - Readiness probe (is app ready to serve?)
 * 
 * @param prisma - Prisma client instance
 * @returns Express router
 */
export function createHealthRouter(prisma: PrismaClient): Router {
    const router = Router();
    
    // Get package version
    const version = process.env.npm_package_version || '0.0.0';
    
    /**
     * GET /health
     * Comprehensive health check with component details
     */
    router.get('/', async (_req: Request, res: Response) => {
        const [dbHealth] = await Promise.all([
            checkDatabase(prisma),
        ]);
        
        const cacheHealth = checkCache();
        const memoryHealth = checkMemory();
        
        const components = {
            database: dbHealth,
            cache: cacheHealth,
            memory: memoryHealth,
        };
        
        const status = aggregateStatus(components);
        
        const response: HealthResponse = {
            status,
            version,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            components,
        };
        
        const httpStatus = status === HealthStatus.UNHEALTHY ? 503 : 200;
        res.status(httpStatus).json(response);
    });
    
    /**
     * GET /health/live
     * Kubernetes liveness probe - is the process alive?
     * Returns 200 if process is running, regardless of dependencies
     */
    router.get('/live', (_req: Request, res: Response) => {
        const response: LivenessResponse = {
            alive: true,
            timestamp: new Date().toISOString(),
        };
        res.json(response);
    });
    
    /**
     * GET /health/ready
     * Kubernetes readiness probe - is the app ready to handle requests?
     * Returns 200 only if all dependencies are available
     */
    router.get('/ready', async (_req: Request, res: Response) => {
        try {
            // Check database connectivity
            await prisma.$queryRaw`SELECT 1`;
            
            const response: ReadinessResponse = {
                ready: true,
                checks: {
                    database: true,
                    migrations: true, // Assumes migrations are applied if DB is accessible
                },
            };
            res.json(response);
        } catch (error) {
            const response: ReadinessResponse = {
                ready: false,
                checks: {
                    database: false,
                    migrations: false,
                },
            };
            res.status(503).json(response);
        }
    });
    
    /**
     * GET /health/metrics
     * Prometheus-compatible metrics endpoint
     */
    router.get('/metrics', async (_req: Request, res: Response) => {
        const memUsage = process.memoryUsage();
        const cacheStats = cache.getStats();
        
        const metrics = [
            `# HELP process_uptime_seconds Process uptime in seconds`,
            `# TYPE process_uptime_seconds gauge`,
            `process_uptime_seconds ${process.uptime()}`,
            '',
            `# HELP nodejs_heap_size_bytes Node.js heap size`,
            `# TYPE nodejs_heap_size_bytes gauge`,
            `nodejs_heap_size_total_bytes ${memUsage.heapTotal}`,
            `nodejs_heap_size_used_bytes ${memUsage.heapUsed}`,
            '',
            `# HELP cache_hits_total Total cache hits`,
            `# TYPE cache_hits_total counter`,
            `cache_hits_total ${cacheStats.hits}`,
            '',
            `# HELP cache_misses_total Total cache misses`,
            `# TYPE cache_misses_total counter`,
            `cache_misses_total ${cacheStats.misses}`,
            '',
            `# HELP cache_size Current cache size`,
            `# TYPE cache_size gauge`,
            `cache_size ${cacheStats.size}`,
        ].join('\n');
        
        res.type('text/plain').send(metrics);
    });
    
    return router;
}

export { HealthResponse, ReadinessResponse, LivenessResponse };

