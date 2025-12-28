/**
 * License Module Resolvers
 */

import { prisma } from '../../shared/graphql/context';
import { ensureRole } from '../../shared/auth/auth-helpers';
import { logAudit } from '../../shared/utils/audit';
import { LicenseService } from './license.service';



/**
 * License Field Resolvers
 */
export const LicenseFieldResolvers = {
    product: (parent: any) => {
        return parent.productId ? prisma.product.findUnique({ where: { id: parent.productId } }) : null;
    }
};

/**
 * License Query Resolvers
 */
export const LicenseQueryResolvers = {
    licenses: async (_: any, { productId, solutionId }: any) => {

        const where: any = { deletedAt: null };
        if (productId) where.productId = productId;
        if (solutionId) where.solutionId = solutionId;
        return prisma.license.findMany({ where });
    }
};

/**
 * License Mutation Resolvers
 */
export const LicenseMutationResolvers = {
    createLicense: async (_: any, { input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);

        return LicenseService.createLicense(ctx.user?.id, input);
    },

    updateLicense: async (_: any, { id, input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);

        return LicenseService.updateLicense(ctx.user?.id, id, input);
    },

    deleteLicense: async (_: any, { id }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);

        return LicenseService.deleteLicense(ctx.user?.id, id);
    }
};
