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
  // No authentication required - always return a default admin user
  const user = { id: 'admin', username: 'admin', role: 'ADMIN' };

  return {
    prisma,
    user,
    headers: req?.headers
  };
}
