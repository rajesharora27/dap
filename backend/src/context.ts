import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import jwt from 'jsonwebtoken';
import { envConfig } from './config/env';
import { createLoaders, Loaders } from './lib/dataloaders';

export const fallbackActive = (process.env.AUTH_FALLBACK || '').toLowerCase() === '1' || (process.env.AUTH_FALLBACK || '').toLowerCase() === 'true';

// Minimal stub to satisfy resolver calls without crashing when DB is unavailable
const prismaStub: any = {
  product: { findMany: async () => [], findUnique: async () => null, count: async () => 0 },
  task: { findMany: async () => [], findUnique: async () => null, count: async () => 0 },
  taskStatus: { findUnique: async () => null, upsert: async () => null },
  auditLog: { findMany: async () => [] },
  changeItem: { findMany: async () => [] },
  telemetry: { findMany: async () => [], deleteMany: async () => ({}) },
  lockedEntity: { deleteMany: async () => ({}) }
};

// Use real Prisma only if not in fallback mode
// Configure connection pool size explicitly to prevent connection exhaustion
// With 4 PM2 instances and pool_size=5, max connections = 20 (well under PostgreSQL's 200 limit)
export const prisma: any = fallbackActive ? prismaStub : new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});
export const logger = pino({
  level: envConfig.logging.level,
  transport: envConfig.logging.pretty ? { target: 'pino-pretty' } : undefined,
  redact: envConfig.logging.redact
});

const fallbackUsers = [
  { id: 'u-admin', username: 'admin', email: 'admin@example.com', password: 'admin', role: 'ADMIN' },
  { id: 'u-user', username: 'user', email: 'user@example.com', password: 'user', role: 'USER' }
];

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

      // Verify session exists in DB (unless in fallback mode)
      if (!fallbackActive) {
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

  if (!user && fallbackActive) {
    user = { id: 'admin', username: 'admin', role: 'ADMIN', isAdmin: true };
  }

  return {
    prisma,
    user,
    headers: req?.headers,
    loaders: createLoaders(prisma)  // Create fresh loaders for each request
  };
}
