"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChangeSet = createChangeSet;
exports.recordChange = recordChange;
exports.commitChangeSet = commitChangeSet;
exports.undoChangeSet = undoChangeSet;
exports.listChangeSets = listChangeSets;
exports.getChangeSet = getChangeSet;
exports.getChangeItems = getChangeItems;
exports.revertChangeSet = revertChangeSet;
const context_1 = require("../context");
const pubsub_1 = require("./pubsub");
async function createChangeSet(userId) {
    // Skip changeset creation for fallback admin user, if userId is not provided, or if app has no authentication
    if (!userId || userId === 'admin-fallback') {
        return { id: 'skip-changeset-' + Date.now() };
    }
    // Check if the user exists in the database before creating changeset
    try {
        const userExists = await context_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
        });
        if (!userExists) {
            // User doesn't exist, return fake changeset
            return { id: 'skip-changeset-' + Date.now() };
        }
        return context_1.prisma.changeSet.create({ data: { userId } });
    }
    catch (error) {
        // If there's any error (like User table doesn't exist), skip changeset
        return { id: 'skip-changeset-' + Date.now() };
    }
}
async function recordChange(changeSetId, entityType, entityId, before, after) {
    // Skip recording changes for fallback changesets
    if (changeSetId.startsWith('skip-changeset-')) {
        return;
    }
    await context_1.prisma.changeItem.create({ data: { changeSetId, entityType, entityId, before, after } });
}
async function commitChangeSet(id) {
    await context_1.prisma.changeSet.update({ where: { id }, data: { committedAt: new Date() } });
}
async function undoChangeSet(id) {
    await context_1.prisma.changeItem.deleteMany({ where: { changeSetId: id } });
    await context_1.prisma.changeSet.delete({ where: { id } });
}
async function listChangeSets(limit = 50) {
    return context_1.prisma.changeSet.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(limit, 200) });
}
async function getChangeSet(id) {
    return context_1.prisma.changeSet.findUnique({ where: { id }, include: { items: true } });
}
async function getChangeItems(changeSetId) {
    return context_1.prisma.changeItem.findMany({ where: { changeSetId } });
}
async function revertChangeSet(id) {
    const items = await context_1.prisma.changeItem.findMany({ where: { changeSetId: id } });
    for (const item of items) {
        if (item.entityType === 'Product' && item.before) {
            const before = item.before;
            try {
                await context_1.prisma.product.update({ where: { id: item.entityId }, data: { name: before.name, description: before.description, customAttrs: before.customAttrs } });
            }
            catch {
                // ignore missing
            }
            try {
                const product = await context_1.prisma.product.findUnique({ where: { id: item.entityId } });
                if (product)
                    pubsub_1.pubsub.publish(pubsub_1.PUBSUB_EVENTS.PRODUCT_UPDATED, { productUpdated: product });
            }
            catch { }
        }
        if (item.entityType === 'Task' && item.before) {
            const before = item.before;
            try {
                await context_1.prisma.task.update({ where: { id: item.entityId }, data: { name: before.name, description: before.description, estMinutes: before.estMinutes, notes: before.notes, weight: before.weight } });
            }
            catch {
                // ignore missing
            }
            try {
                const task = await context_1.prisma.task.findUnique({ where: { id: item.entityId } });
                if (task)
                    pubsub_1.pubsub.publish(pubsub_1.PUBSUB_EVENTS.TASK_UPDATED, { taskUpdated: task });
            }
            catch { }
        }
    }
    return true;
}
