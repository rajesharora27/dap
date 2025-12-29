/**
 * Release Module Resolvers
 */

import { prisma } from '../../shared/graphql/context';
import { ensureRole } from '../../shared/auth/auth-helpers';
import { logAudit } from '../../shared/utils/audit';
import { ReleaseService } from './release.service';

/**
 * Release Field Resolvers
 */
export const ReleaseFieldResolvers = {
    product: (parent: any) => {
        return parent.productId ? prisma.product.findUnique({ where: { id: parent.productId } }) : null;
    },

    tasks: async (parent: any) => {
        const taskReleases = await prisma.taskRelease.findMany({
            where: { releaseId: parent.id },
            include: { task: true }
        });
        return taskReleases.map((tr: any) => tr.task);
    },

    inheritedTasks: async (parent: any) => {

        const productId = parent.productId;
        const solutionId = parent.solutionId;

        let lowerReleases: any[] = [];
        if (productId) {
            lowerReleases = await prisma.release.findMany({
                where: { productId, level: { lte: parent.level }, deletedAt: null },
                include: { tasks: { include: { task: true } } }
            });
        } else if (solutionId) {
            lowerReleases = await prisma.release.findMany({
                where: { solutionId, level: { lte: parent.level }, deletedAt: null },
                include: { tasks: { include: { task: true } } }
            });
        }

        const taskSet = new Set();
        const tasks: any[] = [];
        lowerReleases.forEach((release: any) => {
            release.tasks.forEach((tr: any) => {
                if (!taskSet.has(tr.task.id)) {
                    taskSet.add(tr.task.id);
                    tasks.push(tr.task);
                }
            });
        });

        return tasks;
    }
};

/**
 * Release Query Resolvers
 */
export const ReleaseQueryResolvers = {
    releases: async (_: any, { productId }: any) => {

        const where: any = { deletedAt: null };
        if (productId) where.productId = productId;
        return prisma.release.findMany({
            where,
            orderBy: { displayOrder: 'asc' }
        });
    }
};

/**
 * Release Mutation Resolvers
 */
export const ReleaseMutationResolvers = {
    createRelease: async (_: any, { input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return ReleaseService.createRelease(ctx.user?.id, input);
    },

    updateRelease: async (_: any, { id, input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return ReleaseService.updateRelease(ctx.user?.id, id, input);
    },

    deleteRelease: async (_: any, { id }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return ReleaseService.deleteRelease(ctx.user?.id, id);
    },

    reorderReleases: async (_: any, { productId, releaseIds }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return ReleaseService.reorderReleases(ctx.user?.id, productId, releaseIds);
    }
};
