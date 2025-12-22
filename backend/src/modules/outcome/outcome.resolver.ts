/**
 * Outcome Module Resolvers
 */

import { prisma, fallbackActive } from '../../shared/graphql/context';
import { ensureRole } from '../../shared/auth/auth-helpers';
import { OutcomeService } from './outcome.service';

// Fallback imports
let fbCreateOutcome: any, fbUpdateOutcome: any, fbDeleteOutcome: any;
let fbListOutcomes: any, fbListOutcomesForProduct: any;

if (fallbackActive) {
    const fallbackStore = require('../../shared/utils/fallbackStore');
    fbCreateOutcome = fallbackStore.createOutcome;
    fbUpdateOutcome = fallbackStore.updateOutcome;
    fbDeleteOutcome = fallbackStore.softDeleteOutcome;
    fbListOutcomes = fallbackStore.listOutcomes;
    fbListOutcomesForProduct = fallbackStore.listOutcomesForProduct;
}

/**
 * Outcome Field Resolvers
 */
export const OutcomeFieldResolvers = {
    product: (parent: any) => {
        if (!parent.productId) return null;
        if (fallbackActive) {
            const { products } = require('../../shared/utils/fallbackStore');
            return products.find((p: any) => p.id === parent.productId);
        }
        return prisma.product.findUnique({ where: { id: parent.productId } });
    },

    solution: (parent: any) => {
        if (!parent.solutionId) return null;
        if (fallbackActive) {
            const { solutions } = require('../../shared/utils/fallbackStore');
            return solutions.find((s: any) => s.id === parent.solutionId);
        }
        return prisma.solution.findUnique({ where: { id: parent.solutionId } });
    }
};

/**
 * Outcome Query Resolvers
 */
export const OutcomeQueryResolvers = {
    outcomes: async (_: any, { productId, solutionId }: any) => {
        if (fallbackActive) return productId ? fbListOutcomesForProduct(productId) : fbListOutcomes();
        const where: any = {};
        if (productId) where.productId = productId;
        if (solutionId) where.solutionId = solutionId;
        return prisma.outcome.findMany({ where });
    }
};

/**
 * Outcome Mutation Resolvers
 */
export const OutcomeMutationResolvers = {
    createOutcome: async (_: any, { input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        if (fallbackActive) {
            const o = fbCreateOutcome(input);
            return o;
        }
        return OutcomeService.createOutcome(ctx.user?.id, input);
    },

    updateOutcome: async (_: any, { id, input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        if (fallbackActive) {
            const updated = fbUpdateOutcome(id, input);
            return updated;
        }
        return OutcomeService.updateOutcome(ctx.user?.id, id, input);
    },

    deleteOutcome: async (_: any, { id }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        if (fallbackActive) {
            fbDeleteOutcome(id);
            return true;
        }
        return OutcomeService.deleteOutcome(ctx.user?.id, id);
    }
};
