import { prisma } from '../context';
import { logAudit } from '../lib/audit';
import { createChangeSet, recordChange } from '../lib/changes';
import { CreateSolutionSchema, UpdateSolutionSchema } from '../validation/schemas';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

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

        // Perform a safe cascading delete of all dependent records to avoid FK errors.
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1) Solution adoption plans and their children
            const solutionPlans = await tx.solutionAdoptionPlan.findMany({
                where: { solutionId: id },
                select: { id: true }
            });
            const solutionPlanIds = solutionPlans.map((p: { id: string }) => p.id);

            if (solutionPlanIds.length) {
                await tx.solutionAdoptionProduct.deleteMany({
                    where: { solutionAdoptionPlanId: { in: solutionPlanIds } }
                });
                // CustomerSolutionTask, outcomes/releases, telemetry etc. are cascaded via onDelete, so removing the plan is enough.
                await tx.solutionAdoptionPlan.deleteMany({
                    where: { id: { in: solutionPlanIds } }
                });
            }

            // 2) Customer solution assignments (cascades adoption plans/tasks via onDelete)
            await tx.customerSolution.deleteMany({ where: { solutionId: id } });

            // 3) Solution ↔ Product links and ordering
            await tx.solutionProduct.deleteMany({ where: { solutionId: id } });
            await tx.solutionTaskOrder.deleteMany({ where: { solutionId: id } });

            // 4) Solution tasks and their telemetry/relations
            const solutionTasks = await tx.task.findMany({
                where: { solutionId: id },
                select: { id: true }
            });
            const taskIds = solutionTasks.map((t: { id: string }) => t.id);
            if (taskIds.length) {
                // Telemetry records are not cascaded; remove explicitly
                await tx.telemetry.deleteMany({ where: { taskId: { in: taskIds } } });
                await tx.task.deleteMany({ where: { id: { in: taskIds } } });
            }

            // 5) Solution-scoped releases, outcomes, licenses
            await tx.release.deleteMany({ where: { solutionId: id } });
            await tx.outcome.deleteMany({ where: { solutionId: id } });
            await tx.license.deleteMany({ where: { solutionId: id } });

            // 6) Finally delete the solution
            await tx.solution.delete({ where: { id } });
        });

        console.log(`Solution deleted successfully: ${id}`);
        await logAudit('DELETE_SOLUTION', 'Solution', id, {}, userId);
        return true;
    }
}
