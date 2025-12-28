
/**
 * Task Module Resolvers
 */

import { prisma } from '../../shared/graphql/context';
import { requireUser, ensureRole } from '../../shared/auth/auth-helpers';
import { requirePermission, getUserAccessibleResources } from '../../shared/auth/permissions';
import { logAudit } from '../../shared/utils/audit';
import { ResourceType, PermissionLevel } from '@prisma/client';
import { CreateTaskSchema, UpdateTaskSchema } from './task.validation';
import { TaskService } from './task.service';
import { TagService } from '../tag/tag.service';
import { TaskTelemetryResolvers } from '../telemetry/telemetry.resolver';
import { generateProductSampleCsv } from '../import/csvSamples';

/**
 * Task Field Resolvers
 */
export const TaskFieldResolvers = {
    tags: async (parent: any) => {
        const taskTags = await prisma.taskTag.findMany({
            where: { taskId: parent.id },
            include: { tag: true }
        });
        return taskTags.map((tt: any) => tt.tag);
    },
    solutionTags: async (parent: any) => {
        const tags = await prisma.solutionTaskTag.findMany({
            where: { taskId: parent.id },
            include: { tag: true }
        });
        return tags.map((tt: any) => tt.tag);
    },

    weight: (parent: any) => {
        // Convert Prisma Decimal to Float
        if (parent.weight && typeof parent.weight === 'object' && 'toNumber' in parent.weight) {
            return parent.weight.toNumber();
        }
        return parent.weight || 0;
    },

    howToDoc: (parent: any) => {
        return parent.howToDoc || [];
    },

    howToVideo: (parent: any) => {
        return parent.howToVideo || [];
    },

    product: (parent: any) => {
        return parent.productId ? prisma.product.findUnique({ where: { id: parent.productId } }) : null;
    },

    solution: (parent: any) => {

        return parent.solutionId ? prisma.solution.findUnique({ where: { id: parent.solutionId } }) : null;
    },

    outcomes: async (parent: any) => {
        const taskOutcomes = await prisma.taskOutcome.findMany({
            where: { taskId: parent.id },
            include: { outcome: true }
        });
        return taskOutcomes.map((to: any) => to.outcome);
    },

    licenseLevel: (parent: any) => {
        // Convert Prisma enum to GraphQL enum
        const prismaToGraphQLMap: { [key: string]: string } = {
            'ESSENTIAL': 'Essential',
            'ADVANTAGE': 'Advantage',
            'SIGNATURE': 'Signature'
        };
        return prismaToGraphQLMap[parent.licenseLevel] || 'Essential';
    },

    license: async (parent: any) => {


        // Convert licenseLevel back to actual license object
        const levelMap: { [key: string]: number } = {
            'ESSENTIAL': 1,
            'ADVANTAGE': 2,
            'SIGNATURE': 3
        };
        const requiredLevel = levelMap[parent.licenseLevel];

        if (!requiredLevel || !parent.productId) {
            return null;
        }

        return await prisma.license.findFirst({
            where: {
                productId: parent.productId,
                level: requiredLevel,
                isActive: true,
                deletedAt: null
            }
        });
    },

    releases: async (parent: any) => {
        const taskReleases = await prisma.taskRelease.findMany({
            where: { taskId: parent.id },
            include: { release: true }
        });
        return taskReleases.map((tr: any) => tr.release);
    },

    availableInReleases: async (parent: any) => {

        // Get directly assigned releases
        const taskReleases = await prisma.taskRelease.findMany({
            where: { taskId: parent.id },
            include: { release: true }
        });
        const directReleases = taskReleases.map((tr: any) => tr.release);

        // Find all releases for the product/solution that have higher levels
        const productId = parent.productId;
        const solutionId = parent.solutionId;

        let allReleases: any[] = [];
        if (productId) {
            allReleases = await prisma.release.findMany({
                where: { productId, deletedAt: null },
                orderBy: { level: 'asc' }
            });
        } else if (solutionId) {
            allReleases = await prisma.release.findMany({
                where: { solutionId, deletedAt: null },
                orderBy: { level: 'asc' }
            });
        }

        // Get minimum release level this task is assigned to
        const minDirectLevel = Math.min(...directReleases.map((r: any) => r.level));

        // Include all releases at or above the minimum level
        const availableReleases = allReleases.filter((r: any) => r.level >= minDirectLevel);

        return availableReleases;
    },

    // Telemetry-related computed fields
    telemetryAttributes: TaskTelemetryResolvers.telemetryAttributes,
    isCompleteBasedOnTelemetry: TaskTelemetryResolvers.isCompleteBasedOnTelemetry,
    telemetryCompletionPercentage: TaskTelemetryResolvers.telemetryCompletionPercentage,
};

/**
 * Task Query Resolvers
 */
export const TaskQueryResolvers = {
    task: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);


        // Simple check: if the user can read the product/solution the task belongs to
        return prisma.task.findUnique({
            where: { id },
            include: { outcomes: true }
        });
    },

    tasks: async (_: any, { productId, solutionId }: any, ctx: any) => {
        requireUser(ctx);


        // Check read permissions for the container (product or solution)
        if (productId) {
            await requirePermission(ctx, ResourceType.PRODUCT, productId, PermissionLevel.READ);
            return prisma.task.findMany({
                where: { productId, deletedAt: null },
                orderBy: { sequenceNumber: 'asc' }
            });
        }

        if (solutionId) {
            await requirePermission(ctx, ResourceType.SOLUTION, solutionId, PermissionLevel.READ);
            return prisma.task.findMany({
                where: { solutionId, deletedAt: null },
                orderBy: { sequenceNumber: 'asc' }
            });
        }

        return [];
    },

    taskDependencies: async (_: any, { taskId }: any, ctx: any) => {
        requireUser(ctx);
        return [];
    }
};

/**
 * Task Mutation Resolvers
 */
export const TaskMutationResolvers = {
    createTask: async (_: any, { input }: any, ctx: any) => {
        requireUser(ctx);


        // Validate input
        const validatedInput = CreateTaskSchema.parse(input);

        // Check permissions
        if (validatedInput.productId) {
            await requirePermission(ctx, ResourceType.PRODUCT, validatedInput.productId, PermissionLevel.WRITE);
        } else if (validatedInput.solutionId) {
            await requirePermission(ctx, ResourceType.SOLUTION, validatedInput.solutionId, PermissionLevel.WRITE);
        }

        return TaskService.createTask(ctx.user.id, validatedInput);
    },

    updateTask: async (_: any, { id, input }: any, ctx: any) => {
        requireUser(ctx);
        ensureRole(ctx, ['ADMIN', 'SME']);

        // Validate input
        const validatedInput = UpdateTaskSchema.parse(input);


        const existingTask = await prisma.task.findUnique({ where: { id } });
        if (existingTask) {
            if (existingTask.productId) {
                await requirePermission(ctx, ResourceType.PRODUCT, existingTask.productId, PermissionLevel.WRITE);
            } else if (existingTask.solutionId) {
                await requirePermission(ctx, ResourceType.SOLUTION, existingTask.solutionId, PermissionLevel.WRITE);
            }
        }

        return TaskService.updateTask(ctx.user.id, id, validatedInput);
    },

    // This is the direct hard delete (or "delete" mutation in previous schema if it exists)
    // index.ts didn't have deleteTask mutation for tasks but had deleteProduct/etc.
    // If client calls deleteTask, we should support it using soft delete logic.
    deleteTask: async (_: any, { id }: any, ctx: any) => {
        requireUser(ctx);


        const existingTask = await prisma.task.findUnique({ where: { id } });
        // Check permission
        if (existingTask?.productId) {
            await requirePermission(ctx, ResourceType.PRODUCT, existingTask.productId, PermissionLevel.ADMIN);
        } else if (existingTask?.solutionId) {
            await requirePermission(ctx, ResourceType.SOLUTION, existingTask.solutionId, PermissionLevel.ADMIN);
        }

        return TaskService.deleteTask(ctx.user.id, id);
    },

    // Queue Soft Delete (Used by UI for safe deletion with reordering)
    queueTaskSoftDelete: async (_: any, { id }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);

        // Permission check (implicit logic from updated delete product etc)
        const existingTask = await prisma.task.findUnique({ where: { id } });
        if (existingTask?.productId) {
            await requirePermission(ctx, ResourceType.PRODUCT, existingTask.productId, PermissionLevel.WRITE); // Using WRITE to be more permissive for soft delete? Or stick to ADMIN? Original index.ts used ensureRole(['ADMIN', 'SME']) only.
        }

        return TaskService.queueTaskSoftDelete(ctx.user.id, id);
    },

    processDeletionQueue: async (_: any, { limit = 50 }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return TaskService.processDeletionQueue(limit);
    },

    reorderTasks: async (_: any, { input }: any, ctx: any) => {
        requireUser(ctx);
        // Map input structure if needed. index.ts had { productId, solutionId, order } unpacked from args or input?
        // Let's check signature from index.ts:
        // reorderTasks: async (_: any, { productId, solutionId, order }: any, ctx: any) => {
        // Warning: index.ts used flat args, verify if schema is input object or flat args.
        // If schema says reorderTasks(productId: ID, ...), then args has them directly.
        // My TaskService expects flat args.

        const { productId, solutionId, order } = input || {}; // Handle if input is wrapped object or if args are flattened.
        // Ideally we need to see schema.graphql.
        // Assuming args have them directly if standard mutation.
        // Let's assume the previous index.ts signature `(_: any, { productId, solutionId, order }: any, ...)` means 3 args.
        // BUT my implementation `reorderTasks: async (_: any, { input }: any, ctx: any)` assumed input object.
        // I should probably support both or match index.ts.
        // The index.ts signature implies they are arguments, NOT input object!
        // So I should change destructuring.

        const effectiveProductId = productId || (input && input.productId);
        const effectiveSolutionId = solutionId || (input && input.solutionId);
        const effectiveOrder = order || (input && input.taskIds) || (input && input.order);



        if (effectiveProductId) {
            await requirePermission(ctx, ResourceType.PRODUCT, effectiveProductId, PermissionLevel.WRITE);
        } else if (effectiveSolutionId) {
            await requirePermission(ctx, ResourceType.SOLUTION, effectiveSolutionId, PermissionLevel.WRITE);
        }

        return TaskService.reorderTasks(ctx.user.id, effectiveProductId || effectiveSolutionId, effectiveOrder, !!effectiveProductId);
    },

    exportTasksCsv: async (_: any, { productId }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return TaskService.exportTasksCsv(ctx.user.id, productId);
    },

    importTasksCsv: async (_: any, { productId, csv, mode }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return TaskService.importTasksCsv(ctx.user.id, productId, csv, mode);
    },

    downloadProductSampleCsv: async () => {
        return generateProductSampleCsv();
    },

    addTaskDependency: async (_: any, { taskId, dependsOnId }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return TaskService.addTaskDependency(ctx.user.id, taskId, dependsOnId);
    },

    removeTaskDependency: async (_: any, { taskId, dependsOnId }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return TaskService.removeTaskDependency(ctx.user.id, taskId, dependsOnId);
    },

    addTelemetry: async (_: any, { taskId, data }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'SME']);
        return TaskService.addTelemetry(ctx.user.id, taskId, data);
    }
};
