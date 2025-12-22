/**
 * Outcome Module Service
 */

import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';

export interface OutcomeInput {
    name: string;
    description?: string;
    productId?: string;
    solutionId?: string;
}

export class OutcomeService {
    static async createOutcome(userId: string, input: OutcomeInput) {
        const outcome = await prisma.outcome.create({
            data: {
                name: input.name,
                description: input.description,
                productId: input.productId || null,
                solutionId: input.solutionId || null
            }
        });

        await logAudit('CREATE_OUTCOME', 'Outcome', outcome.id, { input }, userId);
        return outcome;
    }

    static async updateOutcome(userId: string, id: string, input: Partial<OutcomeInput>) {
        const before = await prisma.outcome.findUnique({ where: { id } });

        const outcome = await prisma.outcome.update({
            where: { id },
            data: {
                name: input.name,
                description: input.description,
                productId: input.productId,
                solutionId: input.solutionId
            }
        });

        await logAudit('UPDATE_OUTCOME', 'Outcome', id, { before, after: outcome }, userId);
        return outcome;
    }

    static async deleteOutcome(userId: string, id: string) {
        console.log(`Deleting outcome: ${id}`);

        try {
            await prisma.outcome.delete({ where: { id } });
            console.log(`Outcome deleted successfully: ${id}`);
        } catch (error: any) {
            console.error(`Failed to delete outcome ${id}:`, error.message);
            throw new Error(`Failed to delete outcome: ${error.message}`);
        }

        await logAudit('DELETE_OUTCOME', 'Outcome', id, {}, userId);
        return true;
    }
}
