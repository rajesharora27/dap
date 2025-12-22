import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';
import { createChangeSet, recordChange } from '../../shared/utils/changes';
import { CreateCustomerSchema, UpdateCustomerSchema } from '../../validation/schemas';
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
}
