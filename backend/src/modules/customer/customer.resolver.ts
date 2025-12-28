/**
 * Customer Module Resolvers
 */

import { prisma } from '../../shared/graphql/context';
import { requireUser } from '../../shared/auth/auth-helpers';
import { requirePermission, getUserAccessibleResources } from '../../shared/auth/permissions';
import { logAudit } from '../../shared/utils/audit';
import { ResourceType, PermissionLevel } from '@prisma/client';
import { CreateCustomerSchema, UpdateCustomerSchema } from './customer.validation';
import { CustomerService } from './customer.service';


/**
 * Customer Field Resolvers
 */
export const CustomerFieldResolvers = {
    products: (parent: any) => {
        return prisma.customerProduct.findMany({
            where: { customerId: parent.id },
            include: { product: true, customer: true }
        });
    },

    solutions: (parent: any) => {
        return prisma.customerSolution.findMany({
            where: { customerId: parent.id },
            include: { solution: true, customer: true, adoptionPlan: true }
        });
    },

    overviewMetrics: async (parent: any) => {
        const [products, solutions] = await Promise.all([
            prisma.customerProduct.findMany({
                where: { customerId: parent.id },
                include: { adoptionPlan: true }
            }),
            prisma.customerSolution.findMany({
                where: { customerId: parent.id },
                include: { adoptionPlan: true }
            })
        ]);

        // Calculate average adoption across ALL products
        const totalProgress = products.reduce((acc: number, p: any) => acc + (Number(p.adoptionPlan?.progressPercentage || 0)), 0);
        const avgAdoption = products.length > 0 ? totalProgress / products.length : 0;

        // Total Tasks: sum of all product tasks + all solution-specific tasks
        const totalTasksAcrossPlans =
            products.reduce((acc: number, p: any) => acc + (p.adoptionPlan?.totalTasks || 0), 0) +
            solutions.reduce((acc: number, s: any) => acc + (s.adoptionPlan?.solutionTasksTotal || 0), 0);

        const completedTasksAcrossPlans =
            products.reduce((acc: number, p: any) => acc + (p.adoptionPlan?.completedTasks || 0), 0) +
            solutions.reduce((acc: number, s: any) => acc + (s.adoptionPlan?.solutionTasksComplete || 0), 0);

        // Velocity: Tasks completed in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch count across both CustomerTask and CustomerSolutionTask
        const [productVelocity, solutionVelocity] = await Promise.all([
            prisma.customerTask.count({
                where: {
                    adoptionPlan: {
                        customerProduct: { customerId: parent.id }
                    },
                    OR: [{ status: 'DONE' }, { status: 'COMPLETED' }],
                    statusUpdatedAt: { gte: thirtyDaysAgo }
                }
            }),
            prisma.customerSolutionTask.count({
                where: {
                    solutionAdoptionPlan: {
                        customerSolution: { customerId: parent.id }
                    },
                    OR: [{ status: 'DONE' }, { status: 'COMPLETED' }],
                    statusUpdatedAt: { gte: thirtyDaysAgo }
                }
            })
        ]);

        return {
            adoption: avgAdoption,
            velocity: productVelocity + solutionVelocity,
            totalTasks: totalTasksAcrossPlans,
            completedTasks: completedTasksAcrossPlans,
            productsCount: products.length,
            solutionsCount: solutions.length,
            directProductsCount: products.filter((p: any) => !p.customerSolutionId).length,
            solutionProductsCount: products.filter((p: any) => !!p.customerSolutionId).length
        };
    }
};


/**
 * Customer Query Resolvers
 */
export const CustomerQueryResolvers = {
    customer: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);
        await requirePermission(ctx, ResourceType.CUSTOMER, id, PermissionLevel.READ);
        return prisma.customer.findUnique({ where: { id } });
    },

    customers: async (_: any, __: any, ctx: any) => {
        requireUser(ctx);

        const accessibleIds = await getUserAccessibleResources(
            ctx.user.userId,
            ResourceType.CUSTOMER,
            PermissionLevel.READ,
            prisma
        );

        const where: any = { deletedAt: null };
        if (accessibleIds !== null) {
            if (accessibleIds.length === 0) return [];
            where.id = { in: accessibleIds };
        }

        return prisma.customer.findMany({ where }).catch(() => []);
    }
};

/**
 * Customer Mutation Resolvers
 */
export const CustomerMutationResolvers = {
    createCustomer: async (_: any, { input }: any, ctx: any) => {
        requireUser(ctx);
        const validatedInput = CreateCustomerSchema.parse(input);
        await requirePermission(ctx, ResourceType.CUSTOMER, null, PermissionLevel.ADMIN);
        return CustomerService.createCustomer(ctx.user.id, validatedInput);
    },

    updateCustomer: async (_: any, { id, input }: any, ctx: any) => {
        requireUser(ctx);
        const validatedInput = UpdateCustomerSchema.parse(input);
        await requirePermission(ctx, ResourceType.CUSTOMER, id, PermissionLevel.WRITE);
        return CustomerService.updateCustomer(ctx.user.id, id, validatedInput);
    },

    deleteCustomer: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);
        await requirePermission(ctx, ResourceType.CUSTOMER, id, PermissionLevel.ADMIN);
        return CustomerService.deleteCustomer(ctx.user.id, id);
    },

    addProductToCustomer: async (_: any, { customerId, productId }: any, ctx: any) => {
        requireUser(ctx);
        await requirePermission(ctx, ResourceType.CUSTOMER, customerId, PermissionLevel.WRITE);
        return CustomerService.addProductToCustomer(ctx.user.id, customerId, productId);
    },

    removeProductFromCustomer: async (_: any, { customerId, productId }: any, ctx: any) => {
        requireUser(ctx);
        await requirePermission(ctx, ResourceType.CUSTOMER, customerId, PermissionLevel.WRITE);
        return CustomerService.removeProductFromCustomer(ctx.user.id, customerId, productId);
    },

    addSolutionToCustomer: async (_: any, { customerId, solutionId }: any, ctx: any) => {
        requireUser(ctx);
        await requirePermission(ctx, ResourceType.CUSTOMER, customerId, PermissionLevel.WRITE);
        return CustomerService.addSolutionToCustomer(ctx.user.id, customerId, solutionId);
    },

    removeSolutionFromCustomer: async (_: any, { customerId, solutionId }: any, ctx: any) => {
        requireUser(ctx);
        await requirePermission(ctx, ResourceType.CUSTOMER, customerId, PermissionLevel.WRITE);
        return CustomerService.removeSolutionFromCustomer(ctx.user.id, customerId, solutionId);
    }
};
