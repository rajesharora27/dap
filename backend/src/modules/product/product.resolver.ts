/**
 * Product Module Resolvers
 * 
 * GraphQL resolvers for the Product domain.
 */

import { prisma, fallbackActive } from '../../shared/graphql/context';
import { requireUser, ensureRole } from '../../shared/auth/auth-helpers';
import { requirePermission, getUserAccessibleResources } from '../../shared/auth/permissions';
import { fetchProductsPaginated, fetchTasksPaginated } from '../../shared/utils/pagination';
import { logAudit } from '../../shared/utils/audit';
import { pubsub, PUBSUB_EVENTS } from '../../shared/pubsub/pubsub';
import { ResourceType, PermissionLevel } from '@prisma/client';
import { CreateProductSchema, UpdateProductSchema } from '../../validation/schemas';
import { ProductService } from './product.service';
import { TagResolvers } from '../../schema/resolvers/tags';

// Fallback store imports (only used when fallbackActive)
let fbCreateProduct: any, fbUpdateProduct: any, fbDeleteProduct: any;
let fbListOutcomesForProduct: any, listLicenses: any, fallbackConnections: any;

if (fallbackActive) {
    const fallbackStore = require('../../shared/utils/fallbackStore');
    fbCreateProduct = fallbackStore.createProduct;
    fbUpdateProduct = fallbackStore.updateProduct;
    fbDeleteProduct = fallbackStore.softDeleteProduct;
    fbListOutcomesForProduct = fallbackStore.listOutcomesForProduct;
    listLicenses = fallbackStore.listLicenses;
    fallbackConnections = fallbackStore.fallbackConnections;
}

/**
 * Product Field Resolvers
 */
export const ProductFieldResolvers = {
    tags: TagResolvers.Product.tags,

    tasks: async (parent: any, args: any) => {
        if (fallbackActive) {
            return fallbackConnections.tasksForProduct(parent.id);
        }
        return fetchTasksPaginated(parent.id, args);
    },

    statusPercent: async (parent: any) => {
        try {
            if (fallbackActive) {
                const { tasks: allTasks } = require('../../shared/utils/fallbackStore');
                const tasks = allTasks.filter((t: any) => t.productId === parent.id);
                if (!tasks.length) return 0;
                const totalWeight = tasks.reduce((a: number, t: any) => {
                    const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : (t.weight || 0);
                    return a + weight;
                }, 0) || 1;
                const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => {
                    const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : (t.weight || 0);
                    return a + weight;
                }, 0);
                return Math.round((completed / totalWeight) * 100);
            }
            const tasks = await prisma.task.findMany({ where: { productId: parent.id, deletedAt: null } });
            if (!tasks.length) return 0;
            const totalWeight = tasks.reduce((a: number, t: any) => {
                const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : Number(t.weight || 0);
                const safeWeight = (isNaN(weight) || weight == null) ? 0 : weight;
                return a + safeWeight;
            }, 0) || 1;
            const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => {
                const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : Number(t.weight || 0);
                const safeWeight = (isNaN(weight) || weight == null) ? 0 : weight;
                return a + safeWeight;
            }, 0);
            const result = Math.round((completed / totalWeight) * 100);
            return (isNaN(result) || !isFinite(result)) ? 0 : result;
        } catch (error) {
            console.error('Error calculating statusPercent:', error);
            return 0;
        }
    },

    completionPercentage: async (parent: any) => {
        try {
            if (fallbackActive) {
                const { tasks: allTasks } = require('../../shared/utils/fallbackStore');
                const tasks = allTasks.filter((t: any) => t.productId === parent.id);
                if (!tasks.length) return 0;
                const totalWeight = tasks.reduce((a: number, t: any) => a + t.weight, 0) || 1;
                const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => a + t.weight, 0);
                return Math.round((completed / totalWeight) * 100);
            }
            const tasks = await prisma.task.findMany({ where: { productId: parent.id, deletedAt: null } });
            if (!tasks.length) return 0;
            const totalWeight = tasks.reduce((a: number, t: any) => {
                const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : Number(t.weight || 0);
                const safeWeight = (isNaN(weight) || weight == null) ? 0 : weight;
                return a + safeWeight;
            }, 0) || 1;
            const completed = tasks.filter((t: any) => !!t.completedAt).reduce((a: number, t: any) => {
                const weight = typeof t.weight === 'object' && 'toNumber' in t.weight ? t.weight.toNumber() : Number(t.weight || 0);
                const safeWeight = (isNaN(weight) || weight == null) ? 0 : weight;
                return a + safeWeight;
            }, 0);
            const result = Math.round((completed / totalWeight) * 100);
            return (isNaN(result) || !isFinite(result)) ? 0 : result;
        } catch (error) {
            console.error('Error calculating completionPercentage:', error);
            return 0;
        }
    },

    outcomes: async (parent: any) => {
        if (fallbackActive) {
            return fbListOutcomesForProduct(parent.id);
        }
        return prisma.outcome.findMany({ where: { productId: parent.id } });
    },

    licenses: async (parent: any) => {
        if (fallbackActive) {
            return listLicenses().filter((l: any) => l.productId === parent.id);
        }
        return prisma.license.findMany({ where: { productId: parent.id, deletedAt: null } });
    },

    releases: async (parent: any) => {
        if (fallbackActive) {
            return [];
        }
        return prisma.release.findMany({
            where: { productId: parent.id, deletedAt: null },
            orderBy: { level: 'asc' }
        });
    },

    solutions: async (parent: any) => {
        if (fallbackActive) {
            const { solutions } = require('../../shared/utils/fallbackStore');
            return solutions.filter((s: any) => parent.solutionIds?.includes(s.id));
        }
        const solutionProducts = await prisma.solutionProduct.findMany({
            where: { productId: parent.id },
            include: { solution: true },
            orderBy: { order: 'asc' }
        });
        return solutionProducts.map((sp: any) => sp.solution).filter((s: any) => s && !s.deletedAt);
    }
};

/**
 * Product Query Resolvers
 */
export const ProductQueryResolvers = {
    product: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);

        if (fallbackActive) {
            const { products } = require('../../shared/utils/fallbackStore');
            return products.find((p: any) => p.id === id);
        }

        // Check if user has READ permission for this product
        await requirePermission(ctx, ResourceType.PRODUCT, id, PermissionLevel.READ);

        return prisma.product.findUnique({
            where: { id, deletedAt: null },
            include: {
                licenses: true,
                releases: true,
                outcomes: true
            }
        });
    },

    products: async (_: any, args: any, ctx: any) => {
        requireUser(ctx);

        if (fallbackActive) return fallbackConnections.products();

        // Get accessible product IDs for this user
        const accessibleIds = await getUserAccessibleResources(
            ctx.user.userId,
            ResourceType.PRODUCT,
            PermissionLevel.READ,
            prisma
        );

        // If accessibleIds is null, user has access to all products
        // If it's an empty array, user has no access
        // Otherwise, filter by the accessible IDs
        if (accessibleIds !== null && accessibleIds.length === 0) {
            // User has no access to any products
            return {
                edges: [],
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: null,
                    endCursor: null
                },
                totalCount: 0
            };
        }

        // Add accessible IDs filter to args if not admin (null means admin/all access)
        const filteredArgs = accessibleIds !== null
            ? { ...args, accessibleIds }
            : args;

        return fetchProductsPaginated(filteredArgs);
    }
};

/**
 * Product Mutation Resolvers
 */
export const ProductMutationResolvers = {
    createProduct: async (_: any, { input }: any, ctx: any) => {
        requireUser(ctx);

        // Validate input
        const validatedInput = CreateProductSchema.parse(input);

        if (fallbackActive) {
            const product = fbCreateProduct(input);
            await logAudit('CREATE_PRODUCT', 'Product', product.id, { input }, ctx.user?.id);
            return product;
        }

        // Check if user has WRITE permission for products (system-wide)
        await requirePermission(ctx, ResourceType.PRODUCT, null, PermissionLevel.WRITE);

        // Call Service
        const product = await ProductService.createProduct(ctx.user.id, validatedInput);

        return product;
    },

    updateProduct: async (_: any, { id, input }: any, ctx: any) => {
        requireUser(ctx);

        // Validate input
        const validatedInput = UpdateProductSchema.parse(input);

        if (fallbackActive) {
            const before = fbUpdateProduct(id, {});
            const updated = fbUpdateProduct(id, input);
            await logAudit('UPDATE_PRODUCT', 'Product', id, { before, after: updated });
            pubsub.publish(PUBSUB_EVENTS.PRODUCT_UPDATED, { productUpdated: updated });
            return updated;
        }

        // Check if user has WRITE permission for this specific product
        await requirePermission(ctx, ResourceType.PRODUCT, id, PermissionLevel.WRITE);

        // Call Service
        const updated = await ProductService.updateProduct(ctx.user.id, id, validatedInput);

        pubsub.publish(PUBSUB_EVENTS.PRODUCT_UPDATED, { productUpdated: updated });
        return updated;
    },

    deleteProduct: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);

        if (fallbackActive) {
            fbDeleteProduct(id);
            await logAudit('DELETE_PRODUCT', 'Product', id, {});
            return true;
        }

        // Check if user has ADMIN permission for this specific product (deletion requires highest level)
        await requirePermission(ctx, ResourceType.PRODUCT, id, PermissionLevel.ADMIN);

        return ProductService.deleteProduct(ctx.user.id, id);
    }
};
