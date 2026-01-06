import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import jwt from 'jsonwebtoken';
import { envConfig } from '../../config/env';
import { createLoaders, Loaders } from '../database/dataloaders';

// Fallback logic removed
export const fallbackActive = false;

// Minimal stub to satisfy resolver calls without crashing when DB is unavailable
// Prisma Stub removed


// Use real Prisma only if not in fallback mode
// Configure connection pool size for production multi-user environment
// 
// Connection Math:
// - PostgreSQL max_connections: 100 (default)
// - Reserved for admin/maintenance: 10
// - Available for app: 90
// - PM2 instances: 2 (from ecosystem.config.js)
// - connection_limit per instance: 15 (2 × 15 = 30 total, leaves 60 headroom)
//
// For development (NODE_ENV !== 'production'), use lower limits to handle hot-reloading
const getDatabaseUrl = (): string => {
  const baseUrl = process.env.DATABASE_URL || '';
  const params: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Production: 15 connections per instance (supports ~30 concurrent users per instance)
  // Development: 3 connections (handles hot-reloading without exhaustion)
  if (!baseUrl.includes('connection_limit=')) {
    const limit = isProduction ? 15 : 3;
    params.push(`connection_limit=${limit}`);
  }

  // Pool timeout: how long to wait for idle connection to be released
  // Production: 10 seconds (balance between performance and resource usage)
  // Development: 5 seconds (faster recycling for hot-reload scenarios)
  if (!baseUrl.includes('pool_timeout=')) {
    const timeout = isProduction ? 10 : 5;
    params.push(`pool_timeout=${timeout}`);
  }

  // Connect timeout: fail fast if database is unavailable
  if (!baseUrl.includes('connect_timeout=')) {
    params.push('connect_timeout=5');
  }

  if (params.length === 0) return baseUrl;

  const separator = baseUrl.includes('?') ? '&' : '?';
  const finalUrl = `${baseUrl}${separator}${params.join('&')}`;

  return finalUrl;
};

// Create a single Prisma client instance for the entire application
// This singleton pattern prevents connection leaks from multiple client instantiations
let prismaInstance: PrismaClient | null = null;
let isShuttingDown = false;
let connectionCount = 0;

const getPrismaClient = (): PrismaClient => {
  const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

  if (!prismaInstance && !isShuttingDown) {
    connectionCount++;
    const dbUrl = getDatabaseUrl();
    const isProduction = process.env.NODE_ENV === 'production';
    const connLimit = isProduction ? 15 : 3;
    const poolTimeout = isProduction ? 10 : 5;

    // Avoid noisy logs and dangling async work in Jest (it can log after tests complete).
    if (!isTest) {
      console.log(`[Prisma] Creating client #${connectionCount} (${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode)`);
      console.log(`[Prisma] Settings: connection_limit=${connLimit}, pool_timeout=${poolTimeout}, connect_timeout=5`);
    }

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl
        }
      },
      // Disable query logging in production to reduce overhead
      log: isProduction ? ['error'] : ['error', 'warn']
    });

    // Prisma will lazy-connect on first query; in Jest we avoid firing background promises/logging.
    if (!isTest) {
      prismaInstance.$connect()
        .then(() => console.log('[Prisma] Successfully connected to database'))
        .catch((err) => console.error('[Prisma] Failed to connect:', err.message));
    }
  }
  return prismaInstance!;
};

// Disconnect function that can be called externally
export const disconnectPrisma = async (): Promise<void> => {
  if (prismaInstance && !isShuttingDown) {
    isShuttingDown = true;
    console.log('[Prisma] Disconnecting...');
    try {
      await prismaInstance.$disconnect();
      console.log('[Prisma] Disconnected successfully');
    } catch (error) {
      console.error('[Prisma] Disconnect error:', error);
    }
    prismaInstance = null;
    isShuttingDown = false;
  }
};

export const prisma: any = getPrismaClient();

// Graceful shutdown handler to properly close database connections
// This handles SIGTERM (PM2 graceful stop), SIGINT (Ctrl+C), and process exit
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[Prisma] ${signal} received, closing database connections...`);

  if (prismaInstance) {
    try {
      await prismaInstance.$disconnect();
      console.log('[Prisma] Database connections closed successfully');
    } catch (error) {
      console.error('[Prisma] Error closing database connections:', error);
    }
    prismaInstance = null;
  }

  // In production, force exit after timeout if something hangs
  // In development, let ts-node-dev handle the restart naturally
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      console.log('[Prisma] Forcing exit after timeout');
      process.exit(0);
    }, 3000);
  }
};

// PM2 sends SIGINT for graceful stop
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Docker/Kubernetes send SIGTERM
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// Handle uncaught errors
// In development, ts-node-dev closes the IPC channel on restart, which triggers ERR_IPC_CHANNEL_CLOSED
// We should NOT shutdown for these expected errors during hot reload
process.on('uncaughtException', async (error: any) => {
  // Ignore expected errors from ts-node-dev restarts
  if (error?.code === 'ERR_IPC_CHANNEL_CLOSED') {
    return; // Normal during ts-node-dev restart
  }
  console.error('[Prisma] Uncaught exception:', error);
  // Only force shutdown in production
  if (process.env.NODE_ENV === 'production') {
    await gracefulShutdown('uncaughtException');
  }
});
// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason) => {
  console.error('[Prisma] Unhandled rejection:', reason);
});
// Handle process exit
process.on('exit', () => {
  if (prismaInstance) {
    console.log('[Prisma] Process exit - connection may not be properly closed');
  }
});
export const logger = pino({
  level: envConfig.logging.level,
  transport: envConfig.logging.pretty ? { target: 'pino-pretty' } : undefined,
  redact: envConfig.logging.redact
});

// Fallback users removed


export interface Context {
  prisma: any;
  user?: any | null;
  sessionId?: string;
  headers?: any;
  loaders: Loaders;  // DataLoader instances for batching queries
}

export async function createContext({ req }: any): Promise<Context> {
  let user = null;

  // Check for JWT token in Authorization header
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, envConfig.auth.jwtSecret) as any;

      let isValidSession = true;

      // Verify session exists in DB

      if (decoded.sessionId) {
        const session = await prisma.session.findUnique({
          where: { id: decoded.sessionId }
        });

        if (!session || session.expiresAt < new Date()) {
          console.warn(`Invalid or expired session: ${decoded.sessionId}`);
          isValidSession = false;
        }
      } else {
        // Token missing sessionId - treat as invalid to enforce session tracking
        // This ensures that old stateless tokens are invalidated when we switch to stateful
        console.warn('Token missing sessionId - rejecting');
        isValidSession = false;
      }
      if (isValidSession) {
        user = {
          userId: decoded.userId || decoded.uid, // Support both new and old format
          username: decoded.username,
          email: decoded.email,
          isAdmin: decoded.isAdmin || decoded.role === 'ADMIN',
          mustChangePassword: decoded.mustChangePassword,
          permissions: decoded.permissions,
          role: decoded.role,
          roles: decoded.roles || [decoded.role],
          sessionId: decoded.sessionId
        };
      }
    } catch (error) {
      // Token is invalid, user remains null
      console.error('Invalid token:', error);
    }
  }

  // Development authentication bypass
  if (!user && envConfig.auth.bypassEnabled) {
    user = { ...envConfig.auth.defaultDevUser };
    console.log('🔓 DEV MODE: Using default dev user');
  }



  return {
    prisma,
    user,
    headers: req?.headers,
    loaders: createLoaders(prisma)  // Create fresh loaders for each request
  };
}
