/**
 * Solution Module Resolvers
 */

import { prisma, fallbackActive } from '../../shared/graphql/context';
import { requireUser } from '../../shared/auth/auth-helpers';
import { requirePermission, getUserAccessibleResources } from '../../shared/auth/permissions';
import { fetchTasksPaginated, fetchSolutionsPaginated } from '../../shared/utils/pagination';
import { ResourceType, PermissionLevel } from '@prisma/client';
import { CreateSolutionSchema, UpdateSolutionSchema } from '../../validation/schemas';
import { SolutionService } from './solution.service';
import { TagResolvers } from '../../schema/resolvers/tags';

// Fallback imports
let fbCreateSolution: any, fbUpdateSolution: any, fbDeleteSolution: any, fallbackConnections: any;

if (fallbackActive) {
    const fallbackStore = require('../../shared/utils/fallbackStore');
    fbCreateSolution = fallbackStore.createSolution;
    fbUpdateSolution = fallbackStore.updateSolution;
    fbDeleteSolution = fallbackStore.softDeleteSolution;
    fallbackConnections = fallbackStore.fallbackConnections;
}

/**
 * Solution Field Resolvers
 */
export const SolutionFieldResolvers = {
    tags: TagResolvers.Solution.tags,

    products: async (parent: any, args: any, ctx: any) => {
        if (fallbackActive) {
            const { products } = require('../../shared/utils/fallbackStore');
            const list = products.filter((p: any) => parent.productIds?.includes(p.id));
            return { edges: list.map((p: any) => ({ cursor: Buffer.from(JSON.stringify({ id: p.id }), 'utf8').toString('base64'), node: p })), pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null }, totalCount: list.length };
        }
        const prods = await prisma.solutionProduct.findMany({
            where: { solutionId: parent.id },
            include: { product: true },
            orderBy: { order: 'asc' }
        });
        const list = prods.map((sp: any) => ({ ...sp.product, _solutionProductOrder: sp.order }));
        return { edges: list.map((p: any) => ({ cursor: Buffer.from(JSON.stringify({ id: p.id }), 'utf8').toString('base64'), node: p })), pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: list.length };
    },

    tasks: async (parent: any, args: any) => {
        if (fallbackActive) {
            return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 };
        }
        return fetchTasksPaginated(undefined, { ...args, solutionId: parent.id });
    },

    completionPercentage: async (parent: any) => {
        if (fallbackActive) return 0;
        const tasks = await prisma.task.findMany({ where: { solutionId: parent.id, deletedAt: null } });
        if (!tasks.length) return 0;
        const totalWeight = tasks.reduce((a: number, t: any) => {
            const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : t.weight;
            return a + weight;
        }, 0) || 1;
        const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => {
            const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : t.weight;
            return a + weight;
        }, 0);
        return Math.round((completed / totalWeight) * 100);
    },

    licenses: async (parent: any) => {
        if (fallbackActive) return [];
        return prisma.license.findMany({ where: { solutionId: parent.id, deletedAt: null } });
    },

    releases: async (parent: any) => {
        if (fallbackActive) return [];
        return prisma.release.findMany({
            where: { solutionId: parent.id, deletedAt: null },
            orderBy: { level: 'asc' }
        });
    },

    outcomes: async (parent: any) => {
        if (fallbackActive) return [];
        return prisma.outcome.findMany({ where: { solutionId: parent.id } });
    }
};

/**
 * Solution Query Resolvers
 */
export const SolutionQueryResolvers = {
    solution: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);
        if (fallbackActive) {
            const { solutions } = require('../../shared/utils/fallbackStore');
            return solutions.find((s: any) => s.id === id);
        }
        await requirePermission(ctx, ResourceType.SOLUTION, id, PermissionLevel.READ);
        return prisma.solution.findUnique({
            where: { id },
            include: { licenses: true, releases: true, outcomes: true }
        });
    },

    solutions: async (_: any, args: any, ctx: any) => {
        requireUser(ctx);
        if (fallbackActive) return fallbackConnections.solutions();

        const accessibleIds = await getUserAccessibleResources(
            ctx.user.userId,
            ResourceType.SOLUTION,
            PermissionLevel.READ,
            prisma
        );

        if (accessibleIds !== null && accessibleIds.length === 0) {
            return {
                edges: [],
                pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
                totalCount: 0
            };
        }

        const filteredArgs = accessibleIds !== null ? { ...args, accessibleIds } : args;
        return fetchSolutionsPaginated(filteredArgs);
    }
};

/**
 * Solution Mutation Resolvers
 */
export const SolutionMutationResolvers = {
    createSolution: async (_: any, { input }: any, ctx: any) => {
        requireUser(ctx);
        if (fallbackActive) {
            const solution = fbCreateSolution(input);
            return solution;
        }
        const validatedInput = CreateSolutionSchema.parse(input);
        await requirePermission(ctx, ResourceType.SOLUTION, null, PermissionLevel.ADMIN);
        return SolutionService.createSolution(ctx.user.id, validatedInput);
    },

    updateSolution: async (_: any, { id, input }: any, ctx: any) => {
        requireUser(ctx);
        if (fallbackActive) {
            const updated = fbUpdateSolution(id, input);
            return updated;
        }
        const validatedInput = UpdateSolutionSchema.parse(input);
        await requirePermission(ctx, ResourceType.SOLUTION, id, PermissionLevel.WRITE);
        return SolutionService.updateSolution(ctx.user.id, id, validatedInput);
    },

    deleteSolution: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);
        if (fallbackActive) {
            fbDeleteSolution(id);
            return true;
        }
        await requirePermission(ctx, ResourceType.SOLUTION, id, PermissionLevel.ADMIN);
        return SolutionService.deleteSolution(ctx.user.id, id);
    }
};
