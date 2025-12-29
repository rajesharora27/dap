/**
 * Outcome Module Resolvers
 */

import { prisma } from '../../shared/graphql/context';
import { ensureRole } from '../../shared/auth/auth-helpers';
import { OutcomeService } from './outcome.service';



/**
 * Outcome Field Resolvers
 */
export const OutcomeFieldResolvers = {
    product: (parent: any) => {
        if (!parent.productId) return null;
        return prisma.product.findUnique({ where: { id: parent.productId } });
    },

    solution: (parent: any) => {
        if (!parent.solutionId) return null;
        return prisma.solution.findUnique({ where: { id: parent.solutionId } });
    }
};

/**
 * Outcome Query Resolvers
 */
export const OutcomeQueryResolvers = {
    outcomes: async (_: any, { productId, solutionId }: any) => {

        const where: any = {};
        if (productId) where.productId = productId;
        if (solutionId) where.solutionId = solutionId;
        return prisma.outcome.findMany({
            where,
            orderBy: { displayOrder: 'asc' }
        });
    }
};

/**
 * Outcome Mutation Resolvers
 */
export const OutcomeMutationResolvers = {
    createOutcome: async (_: any, { input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return OutcomeService.createOutcome(ctx.user?.id, input);
    },

    updateOutcome: async (_: any, { id, input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return OutcomeService.updateOutcome(ctx.user?.id, id, input);
    },

    deleteOutcome: async (_: any, { id }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return OutcomeService.deleteOutcome(ctx.user?.id, id);
    },

    reorderOutcomes: async (_: any, { productId, solutionId, outcomeIds }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return OutcomeService.reorderOutcomes(ctx.user?.id, productId, solutionId, outcomeIds);
    }
};
