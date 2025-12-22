/**
 * License Module Resolvers
 */

import { prisma, fallbackActive } from '../../shared/graphql/context';
import { ensureRole } from '../../shared/auth/auth-helpers';
import { logAudit } from '../../shared/utils/audit';
import { LicenseService } from './license.service';

// Fallback store imports
let fbCreateLicense: any, fbUpdateLicense: any, fbDeleteLicense: any, listLicenses: any;

if (fallbackActive) {
    const fallbackStore = require('../../shared/utils/fallbackStore');
    fbCreateLicense = fallbackStore.createLicense;
    fbUpdateLicense = fallbackStore.updateLicense;
    fbDeleteLicense = fallbackStore.softDeleteLicense;
    listLicenses = fallbackStore.listLicenses;
}

/**
 * License Field Resolvers
 */
export const LicenseFieldResolvers = {
    product: (parent: any) => {
        if (fallbackActive) {
            const { products } = require('../../shared/utils/fallbackStore');
            return products.find((p: any) => p.id === parent.productId);
        }
        return parent.productId ? prisma.product.findUnique({ where: { id: parent.productId } }) : null;
    }
};

/**
 * License Query Resolvers
 */
export const LicenseQueryResolvers = {
    licenses: async (_: any, { productId, solutionId }: any) => {
        if (fallbackActive) return listLicenses();
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

        if (fallbackActive) {
            const l = fbCreateLicense(input);
            await logAudit('CREATE_LICENSE', 'License', l.id, { input }, ctx.user?.id);
            return l;
        }

        return LicenseService.createLicense(ctx.user?.id, input);
    },

    updateLicense: async (_: any, { id, input }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);

        if (fallbackActive) {
            const before = fbUpdateLicense(id, {});
            const l = fbUpdateLicense(id, input);
            await logAudit('UPDATE_LICENSE', 'License', id, { before, after: l }, ctx.user?.id);
            return l;
        }

        return LicenseService.updateLicense(ctx.user?.id, id, input);
    },

    deleteLicense: async (_: any, { id }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);

        if (fallbackActive) {
            fbDeleteLicense(id);
            await logAudit('DELETE_LICENSE', 'License', id, {}, ctx.user?.id);
            return true;
        }

        return LicenseService.deleteLicense(ctx.user?.id, id);
    }
};
