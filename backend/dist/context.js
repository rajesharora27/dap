"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.prisma = exports.fallbackActive = void 0;
exports.createContext = createContext;
const client_1 = require("@prisma/client");
const pino_1 = __importDefault(require("pino"));
exports.fallbackActive = (process.env.AUTH_FALLBACK || '').toLowerCase() === '1' || (process.env.AUTH_FALLBACK || '').toLowerCase() === 'true';
// Minimal stub to satisfy resolver calls without crashing when DB is unavailable
const prismaStub = {
    product: { findMany: async () => [], findUnique: async () => null, count: async () => 0 },
    task: { findMany: async () => [], findUnique: async () => null, count: async () => 0 },
    taskStatus: { findUnique: async () => null, upsert: async () => null },
    auditLog: { findMany: async () => [] },
    changeItem: { findMany: async () => [] },
    telemetry: { findMany: async () => [], deleteMany: async () => ({}) },
    lockedEntity: { deleteMany: async () => ({}) }
};
// Use real Prisma only if not in fallback mode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.prisma = exports.fallbackActive ? prismaStub : new client_1.PrismaClient();
exports.logger = (0, pino_1.default)({ transport: { target: 'pino-pretty' } });
const fallbackUsers = [
    { id: 'u-admin', username: 'admin', email: 'admin@example.com', password: 'admin', role: 'ADMIN' },
    { id: 'u-user', username: 'user', email: 'user@example.com', password: 'user', role: 'USER' }
];
async function createContext({ req }) {
    // No authentication required - always return a default admin user
    const user = { id: 'admin', username: 'admin', role: 'ADMIN' };
    return {
        prisma: exports.prisma,
        user,
        headers: req?.headers
    };
}
