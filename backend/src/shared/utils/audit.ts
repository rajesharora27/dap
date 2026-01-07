import { prisma } from '../graphql/context';

export async function logAudit(action: string, entity?: string, entityId?: string, details?: any, userId?: string | null) {
  try {
    await prisma.auditLog.create({ data: { action, entity, entityId, details, userId: userId || undefined } });
  } catch (e) {
    // swallow to avoid mutation failures due to audit issues
    console.error('[AUDIT] Failed to create audit log:', e);
  }
}

