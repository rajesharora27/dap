/**
 * Customer Module Resolvers
 */

import { prisma, fallbackActive } from '../../shared/graphql/context';
import { requireUser } from '../../shared/auth/auth-helpers';
import { requirePermission, getUserAccessibleResources } from '../../shared/auth/permissions';
import { ResourceType, PermissionLevel } from '@prisma/client';
import { CreateCustomerSchema, UpdateCustomerSchema } from '../../validation/schemas';
import { CustomerService } from './customer.service';

// Fallback imports
let fbCreateCustomer: any, fbUpdateCustomer: any, fbDeleteCustomer: any, fbListCustomers: any;

if (fallbackActive) {
    const fallbackStore = require('../../shared/utils/fallbackStore');
    fbCreateCustomer = fallbackStore.createCustomer;
    fbUpdateCustomer = fallbackStore.updateCustomer;
    fbDeleteCustomer = fallbackStore.softDeleteCustomer;
    fbListCustomers = fallbackStore.listCustomers;
}

/**
 * Customer Field Resolvers
 */
export const CustomerFieldResolvers = {
    products: (parent: any) => {
        if (fallbackActive) {
            const { products } = require('../../shared/utils/fallbackStore');
            return products.filter((p: any) => parent.productIds?.includes(p.id));
        }
        return prisma.customerProduct.findMany({
            where: { customerId: parent.id },
            include: { product: true, customer: true }
        });
    },

    solutions: (parent: any) => {
        if (fallbackActive) {
            const { solutions } = require('../../shared/utils/fallbackStore');
            return solutions.filter((s: any) => parent.solutionIds?.includes(s.id));
        }
        return prisma.customerSolution.findMany({
            where: { customerId: parent.id },
            include: { solution: true, customer: true, adoptionPlan: true }
        });
    }
};

/**
 * Customer Query Resolvers
 */
export const CustomerQueryResolvers = {
    customer: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);
        if (fallbackActive) {
            const customers = fbListCustomers();
            return customers.find((c: any) => c.id === id);
        }
        await requirePermission(ctx, ResourceType.CUSTOMER, id, PermissionLevel.READ);
        return prisma.customer.findUnique({ where: { id } });
    },

    customers: async (_: any, __: any, ctx: any) => {
        requireUser(ctx);
        if (fallbackActive) return fbListCustomers();

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
        if (fallbackActive) {
            const customer = fbCreateCustomer(input);
            return customer;
        }
        const validatedInput = CreateCustomerSchema.parse(input);
        await requirePermission(ctx, ResourceType.CUSTOMER, null, PermissionLevel.ADMIN);
        return CustomerService.createCustomer(ctx.user.id, validatedInput);
    },

    updateCustomer: async (_: any, { id, input }: any, ctx: any) => {
        requireUser(ctx);
        if (fallbackActive) {
            const updated = fbUpdateCustomer(id, input);
            return updated;
        }
        const validatedInput = UpdateCustomerSchema.parse(input);
        await requirePermission(ctx, ResourceType.CUSTOMER, id, PermissionLevel.WRITE);
        return CustomerService.updateCustomer(ctx.user.id, id, validatedInput);
    },

    deleteCustomer: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);
        if (fallbackActive) {
            fbDeleteCustomer(id);
            return true;
        }
        await requirePermission(ctx, ResourceType.CUSTOMER, id, PermissionLevel.ADMIN);
        return CustomerService.deleteCustomer(ctx.user.id, id);
    }
};
