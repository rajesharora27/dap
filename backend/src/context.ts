import { PrismaClient } from '@prisma/client';
import pino from 'pino';
import jwt from 'jsonwebtoken';

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
export const prisma: any = fallbackActive ? prismaStub : new PrismaClient();
export const logger = pino({ transport: { target: 'pino-pretty' } });

const fallbackUsers = [
  { id: 'u-admin', username: 'admin', email: 'admin@example.com', password: 'admin', role: 'ADMIN' },
  { id: 'u-user', username: 'user', email: 'user@example.com', password: 'user', role: 'USER' }
];

export interface Context {
  prisma: any;
  user?: any | null;
  sessionId?: string;
  headers?: any;
}

export async function createContext({ req }: any): Promise<Context> {
  let user = null;

  // Check for JWT token in Authorization header
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
      user = {
        userId: decoded.userId || decoded.uid, // Support both new and old format
        username: decoded.username,
        email: decoded.email,
        isAdmin: decoded.isAdmin || decoded.role === 'ADMIN',
        mustChangePassword: decoded.mustChangePassword,
        permissions: decoded.permissions,
        role: decoded.role
      };
    } catch (error) {
      // Token is invalid, user remains null
      console.error('Invalid token:', error);
    }
  }

  // Fallback authentication for development/testing
  if (!user && fallbackActive) {
    user = { id: 'admin', username: 'admin', role: 'ADMIN', isAdmin: true };
  }

  return {
    prisma,
    user,
    headers: req?.headers
  };
}
