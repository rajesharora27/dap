import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';
import { createChangeSet, recordChange } from '../../shared/utils/changes';
import { CreateCustomerSchema, UpdateCustomerSchema } from './customer.validation';
import { z } from 'zod';

type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

export class CustomerService {
    static async createCustomer(userId: string, input: CreateCustomerInput) {
        const customer = await prisma.customer.create({
            data: {
                name: input.name,
                description: input.description
            }
        });

        await logAudit('CREATE_CUSTOMER', 'Customer', customer.id, { input }, userId);
        return customer;
    }

    static async updateCustomer(userId: string, id: string, input: UpdateCustomerInput) {
        const before = await prisma.customer.findUnique({ where: { id } });

        const updated = await prisma.customer.update({
            where: { id },
            data: { ...input }
        });

        if (before) {
            const cs = await createChangeSet(userId);
            await recordChange(cs.id, 'Customer', id, before, updated);
        }

        await logAudit('UPDATE_CUSTOMER', 'Customer', id, { before, after: updated }, userId);
        return updated;
    }

    static async deleteCustomer(userId: string, id: string) {
        await prisma.customer.delete({ where: { id } });
        await logAudit('DELETE_CUSTOMER', 'Customer', id, {}, userId);
        return true;
    }

    static async addProductToCustomer(userId: string, customerId: string, productId: string) {
        await prisma.customerProduct.upsert({
            where: { customerId_productId: { customerId, productId } },
            update: {},
            create: { customerId, productId }
        });
        await logAudit('ADD_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, userId);
        return true;
    }

    static async removeProductFromCustomer(userId: string, customerId: string, productId: string) {
        await prisma.customerProduct.deleteMany({ where: { customerId, productId } });
        await logAudit('REMOVE_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, userId);
        return true;
    }

    static async addSolutionToCustomer(userId: string, customerId: string, solutionId: string) {
        await prisma.customerSolution.upsert({
            where: { customerId_solutionId: { customerId, solutionId } },
            update: {},
            create: { customerId, solutionId }
        });
        await logAudit('ADD_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, userId);
        return true;
    }

    static async removeSolutionFromCustomer(userId: string, customerId: string, solutionId: string) {
        await prisma.customerSolution.deleteMany({ where: { customerId, solutionId } });
        await logAudit('REMOVE_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, userId);
        return true;
    }
}
