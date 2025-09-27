"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acquireLock = acquireLock;
exports.releaseLock = releaseLock;
const context_1 = require("../context");
const LOCK_TTL_MS = 15 * 60 * 1000;
async function acquireLock(sessionId, entityType, entityId) {
    const existing = await context_1.prisma.lockedEntity.findFirst({ where: { entityType, entityId } });
    const now = new Date();
    if (existing) {
        if (existing.expiresAt < now) {
            await context_1.prisma.lockedEntity.delete({ where: { id: existing.id } });
        }
        else {
            throw new Error('LOCKED');
        }
    }
    return context_1.prisma.lockedEntity.create({ data: { entityType, entityId, sessionId, expiresAt: new Date(now.getTime() + LOCK_TTL_MS) } });
}
async function releaseLock(sessionId, entityType, entityId) {
    await context_1.prisma.lockedEntity.deleteMany({ where: { entityType, entityId, sessionId } });
}
