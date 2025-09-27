import { prisma } from '../context';
import { pubsub, PUBSUB_EVENTS } from './pubsub';

export async function createChangeSet(userId?: string) {
  // Skip changeset creation for fallback admin user, if userId is not provided, or if app has no authentication
  if (!userId || userId === 'admin-fallback') {
    return { id: 'skip-changeset-' + Date.now() };
  }

  // Check if the user exists in the database before creating changeset
  try {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      // User doesn't exist, return fake changeset
      return { id: 'skip-changeset-' + Date.now() };
    }

    return prisma.changeSet.create({ data: { userId } });
  } catch (error) {
    // If there's any error (like User table doesn't exist), skip changeset
    return { id: 'skip-changeset-' + Date.now() };
  }
}

export async function recordChange(changeSetId: string, entityType: string, entityId: string, before: any, after: any) {
  // Skip recording changes for fallback changesets
  if (changeSetId.startsWith('skip-changeset-')) {
    return;
  }
  await prisma.changeItem.create({ data: { changeSetId, entityType, entityId, before, after } });
}

export async function commitChangeSet(id: string) {
  await prisma.changeSet.update({ where: { id }, data: { committedAt: new Date() } });
}

export async function undoChangeSet(id: string) {
  await prisma.changeItem.deleteMany({ where: { changeSetId: id } });
  await prisma.changeSet.delete({ where: { id } });
}

export async function listChangeSets(limit = 50) {
  return prisma.changeSet.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(limit, 200) });
}

export async function getChangeSet(id: string) {
  return prisma.changeSet.findUnique({ where: { id }, include: { items: true } as any });
}

export async function getChangeItems(changeSetId: string) {
  return prisma.changeItem.findMany({ where: { changeSetId } });
}

export async function revertChangeSet(id: string) {
  const items = await prisma.changeItem.findMany({ where: { changeSetId: id } });
  for (const item of items) {
    if (item.entityType === 'Product' && item.before) {
      const before: any = item.before as any;
      try {
        await prisma.product.update({ where: { id: item.entityId }, data: { name: before.name, description: before.description, customAttrs: before.customAttrs } });
      } catch {
        // ignore missing
      }
      try { const product = await prisma.product.findUnique({ where: { id: item.entityId } }); if (product) pubsub.publish(PUBSUB_EVENTS.PRODUCT_UPDATED, { productUpdated: product }); } catch { }
    }
    if (item.entityType === 'Task' && item.before) {
      const before: any = item.before as any;
      try {
        await prisma.task.update({ where: { id: item.entityId }, data: { name: before.name, description: before.description, estMinutes: before.estMinutes, notes: before.notes, weight: before.weight } });
      } catch {
        // ignore missing
      }
      try { const task = await prisma.task.findUnique({ where: { id: item.entityId } }); if (task) pubsub.publish(PUBSUB_EVENTS.TASK_UPDATED, { taskUpdated: task }); } catch { }
    }
  }
  return true;
}
