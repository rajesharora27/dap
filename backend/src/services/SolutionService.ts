import { prisma } from '../context';
import { logAudit } from '../lib/audit';
import { createChangeSet, recordChange } from '../lib/changes';
import { CreateSolutionSchema, UpdateSolutionSchema } from '../validation/schemas';
import { z } from 'zod';

type CreateSolutionInput = z.infer<typeof CreateSolutionSchema>;
type UpdateSolutionInput = z.infer<typeof UpdateSolutionSchema>;

export class SolutionService {
    static async createSolution(userId: string, input: CreateSolutionInput) {
        // Defensive: Filter licenseLevel from customAttrs
        let safeCustomAttrs = input.customAttrs;
        if (safeCustomAttrs && typeof safeCustomAttrs === 'object') {
            safeCustomAttrs = Object.fromEntries(
                Object.entries(safeCustomAttrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
            );
        }

        const solution = await prisma.solution.create({
            data: {
                name: input.name,
                description: input.description,
                customAttrs: safeCustomAttrs ?? undefined
            }
        });

        await logAudit('CREATE_SOLUTION', 'Solution', solution.id, { input }, userId);
        return solution;
    }

    static async updateSolution(userId: string, id: string, input: UpdateSolutionInput) {
        const before = await prisma.solution.findUnique({ where: { id } });

        // Defensive: Filter licenseLevel from customAttrs
        const safeInput = { ...input };
        if (safeInput.customAttrs && typeof safeInput.customAttrs === 'object') {
            safeInput.customAttrs = Object.fromEntries(
                Object.entries(safeInput.customAttrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
            );
        }

        // Handle Prisma null vs undefined for JSON
        if (safeInput.customAttrs === null) (safeInput as any).customAttrs = undefined;

        const updated = await prisma.solution.update({
            where: { id },
            data: safeInput as any
        });

        if (before) {
            const cs = await createChangeSet(userId);
            await recordChange(cs.id, 'Solution', id, before, updated);
        }

        await logAudit('UPDATE_SOLUTION', 'Solution', id, { before, after: updated }, userId);
        return updated;
    }

    static async deleteSolution(userId: string, id: string) {
        console.log(`Deleting solution: ${id}`);
        await prisma.solution.delete({ where: { id } });
        console.log(`Solution deleted successfully: ${id}`);

        await logAudit('DELETE_SOLUTION', 'Solution', id, {}, userId);
        return true;
    }
}
