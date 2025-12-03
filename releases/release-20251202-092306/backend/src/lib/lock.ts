import { prisma } from '../context';

const LOCK_TTL_MS = 15 * 60 * 1000;

export async function acquireLock(sessionId: string, entityType: string, entityId: string) {
  const existing = await prisma.lockedEntity.findFirst({ where: { entityType, entityId } });
  const now = new Date();
  if (existing) {
    if (existing.expiresAt < now) {
      await prisma.lockedEntity.delete({ where: { id: existing.id } });
    } else {
      throw new Error('LOCKED');
    }
  }
  return prisma.lockedEntity.create({ data: { entityType, entityId, sessionId, expiresAt: new Date(now.getTime() + LOCK_TTL_MS) } });
}

export async function releaseLock(sessionId: string, entityType: string, entityId: string) {
  await prisma.lockedEntity.deleteMany({ where: { entityType, entityId, sessionId } });
}
