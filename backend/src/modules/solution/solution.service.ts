import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';
import { createChangeSet, recordChange } from '../../shared/utils/changes';
import { CreateSolutionSchema, UpdateSolutionSchema } from './solution.validation';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

type CreateSolutionInput = z.infer<typeof CreateSolutionSchema>;
type UpdateSolutionInput = z.infer<typeof UpdateSolutionSchema>;

export class SolutionService {
    static async createSolution(userId: string, input: CreateSolutionInput) {
        // Extract license IDs from input and handle relationship
        const { licenseIds, ...solutionData } = input;

        const solution = await prisma.solution.create({
            data: {
                name: solutionData.name,
                resources: solutionData.resources ?? undefined,
                customAttrs: solutionData.customAttrs ?? undefined
            }
        });

        // Handle license relationship if licenseIds provided
        if (licenseIds && licenseIds.length > 0) {
            await prisma.license.updateMany({
                where: {
                    id: { in: licenseIds },
                    deletedAt: null  // Only update active licenses
                },
                data: { solutionId: solution.id }
            });
        }

        await logAudit('CREATE_SOLUTION', 'Solution', solution.id, { input }, userId);
        return solution;
    }

    static async updateSolution(userId: string, id: string, input: UpdateSolutionInput) {
        const { licenseIds, ...solutionData } = input;

        const before = await prisma.solution.findUnique({ where: { id } });

        // Prepare update data
        const updateData: any = { ...solutionData };

        // Handle Prisma null vs undefined for JSON
        if (solutionData.customAttrs === null) updateData.customAttrs = undefined;

        const updated = await prisma.solution.update({
            where: { id },
            data: updateData
        });

        // Handle license relationship if licenseIds provided
        if (licenseIds !== undefined) {
            // First, clear existing licenses for this solution
            await prisma.license.updateMany({
                where: { solutionId: id },
                data: { solutionId: null }
            });

            // Then, assign new licenses to this solution
            if (licenseIds.length > 0) {
                await prisma.license.updateMany({
                    where: {
                        id: { in: licenseIds },
                        deletedAt: null
                    },
                    data: { solutionId: id }
                });
            }
        }

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

    static async addProductToSolution(userId: string, solutionId: string, productId: string, order?: number) {
        let nextOrder = order;

        if (nextOrder === undefined) {
            // Calculate next order number automatically
            const maxOrderProduct = await prisma.solutionProduct.findFirst({
                where: { solutionId },
                orderBy: { order: 'desc' }
            });
            nextOrder = (maxOrderProduct?.order || 0) + 1;
        }

        await prisma.solutionProduct.upsert({
            where: { productId_solutionId: { productId, solutionId } },
            update: { order: nextOrder },
            create: { productId, solutionId, order: nextOrder }
        });
        await logAudit('ADD_PRODUCT_SOLUTION', 'Solution', solutionId, { productId, order: nextOrder }, userId);
        return true;
    }

    static async removeProductFromSolution(userId: string, solutionId: string, productId: string) {
        await prisma.solutionProduct.deleteMany({ where: { solutionId, productId } });
        await logAudit('REMOVE_PRODUCT_SOLUTION', 'Solution', solutionId, { productId }, userId);
        return true;
    }

    static async reorderProductsInSolution(userId: string, solutionId: string, productOrders: { productId: string; order: number }[]) {
        // Use transaction to ensure all updates succeed or fail together
        await prisma.$transaction(
            productOrders.map(({ productId, order }) =>
                prisma.solutionProduct.update({
                    where: { productId_solutionId: { productId, solutionId } },
                    data: { order }
                })
            )
        );
        await logAudit('REORDER_PRODUCTS_SOLUTION', 'Solution', solutionId, { productOrders }, userId);
        return true;
    }
}
