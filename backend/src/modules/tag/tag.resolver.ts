
import { prisma } from '../../shared/graphql/context';
import { requireUser } from '../../shared/auth/auth-helpers';
import { requirePermission } from '../../shared/auth/permissions';
import { ResourceType, PermissionLevel } from '@prisma/client';
import { TagService } from './tag.service';

/**
 * Tag Module Resolvers
 */
export const TagResolvers = {
    Query: {
        productTag: async (_: any, { id }: any, ctx: any) => {
            requireUser(ctx);
            return TagService.getProductTag(id);
        },
        productTags: async (_: any, { productId }: any, ctx: any) => {
            requireUser(ctx);
            await requirePermission(ctx, ResourceType.PRODUCT, productId, PermissionLevel.READ);
            return TagService.getProductTags(productId);
        },
        customerProductTags: async (_: any, { customerProductId }: any, ctx: any) => {
            requireUser(ctx);
            const cp = await prisma.customerProduct.findUnique({ where: { id: customerProductId } });
            if (!cp) throw new Error('Customer Product not found');

            await requirePermission(ctx, ResourceType.CUSTOMER, cp.customerId, PermissionLevel.READ);
            return TagService.getCustomerProductTags(customerProductId);
        },
        solutionTags: async (_: any, { solutionId }: any, ctx: any) => {
            requireUser(ctx);
            await requirePermission(ctx, ResourceType.SOLUTION, solutionId, PermissionLevel.READ);
            return TagService.getSolutionTags(solutionId);
        },
        customerSolutionTags: async (_: any, { customerSolutionId }: any, ctx: any) => {
            requireUser(ctx);
            const cs = await prisma.customerSolution.findUnique({ where: { id: customerSolutionId } });
            if (!cs) throw new Error('Customer Solution not found');

            await requirePermission(ctx, ResourceType.CUSTOMER, cs.customerId, PermissionLevel.READ);
            return TagService.getCustomerSolutionTags(customerSolutionId);
        }
    },
    Mutation: {
        createProductTag: async (_: any, { input }: any, ctx: any) => {
            requireUser(ctx);
            await requirePermission(ctx, ResourceType.PRODUCT, input.productId, PermissionLevel.WRITE);
            return TagService.createProductTag(input);
        },
        updateProductTag: async (_: any, { id, input }: any, ctx: any) => {
            requireUser(ctx);
            const tag = await TagService.getProductTag(id);
            if (!tag) throw new Error('Tag not found');

            await requirePermission(ctx, ResourceType.PRODUCT, tag.productId, PermissionLevel.WRITE);
            return TagService.updateProductTag(id, input);
        },
        deleteProductTag: async (_: any, { id }: any, ctx: any) => {
            requireUser(ctx);
            const tag = await TagService.getProductTag(id);
            if (!tag) throw new Error('Tag not found');

            await requirePermission(ctx, ResourceType.PRODUCT, tag.productId, PermissionLevel.WRITE);
            return TagService.deleteProductTag(id);
        },
        setTaskTags: async (_: any, { taskId, tagIds }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.productId) {
                await requirePermission(ctx, ResourceType.PRODUCT, task.productId, PermissionLevel.WRITE);
            }
            return TagService.setTaskTags(taskId, tagIds);
        },
        addTagToTask: async (_: any, { taskId, tagId }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.productId) {
                await requirePermission(ctx, ResourceType.PRODUCT, task.productId, PermissionLevel.WRITE);
            }
            return TagService.addTagToTask(taskId, tagId);
        },
        removeTagFromTask: async (_: any, { taskId, tagId }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.productId) {
                await requirePermission(ctx, ResourceType.PRODUCT, task.productId, PermissionLevel.WRITE);
            }
            return TagService.removeTagFromTask(taskId, tagId);
        },
        createSolutionTag: async (_: any, { input }: any, ctx: any) => {
            requireUser(ctx);
            await requirePermission(ctx, ResourceType.SOLUTION, input.solutionId, PermissionLevel.WRITE);
            return TagService.createSolutionTag(input);
        },
        updateSolutionTag: async (_: any, { id, input }: any, ctx: any) => {
            requireUser(ctx);
            const tag = await prisma.solutionTag.findUnique({ where: { id } });
            if (!tag) throw new Error('Tag not found');
            await requirePermission(ctx, ResourceType.SOLUTION, tag.solutionId, PermissionLevel.WRITE);
            return TagService.updateSolutionTag(id, input);
        },
        deleteSolutionTag: async (_: any, { id }: any, ctx: any) => {
            requireUser(ctx);
            const tag = await prisma.solutionTag.findUnique({ where: { id } });
            if (!tag) throw new Error('Tag not found');
            await requirePermission(ctx, ResourceType.SOLUTION, tag.solutionId, PermissionLevel.WRITE);
            return TagService.deleteSolutionTag(id);
        },
        setSolutionTaskTags: async (_: any, { taskId, tagIds }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.solutionId) {
                await requirePermission(ctx, ResourceType.SOLUTION, task.solutionId, PermissionLevel.WRITE);
            }
            return TagService.setSolutionTaskTags(taskId, tagIds);
        },
        addSolutionTagToTask: async (_: any, { taskId, tagId }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.solutionId) {
                await requirePermission(ctx, ResourceType.SOLUTION, task.solutionId, PermissionLevel.WRITE);
            }
            return TagService.addSolutionTagToTask(taskId, tagId);
        },
        removeSolutionTagFromTask: async (_: any, { taskId, tagId }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.solutionId) {
                await requirePermission(ctx, ResourceType.SOLUTION, task.solutionId, PermissionLevel.WRITE);
            }
            return TagService.removeSolutionTagFromTask(taskId, tagId);
        }
    },
    // Field Resolvers
    Product: {
        tags: async (parent: any) => {
            return TagService.getProductTags(parent.id);
        }
    },
    Solution: {
        tags: async (parent: any) => {
            return TagService.getSolutionTags(parent.id);
        }
    },
    CustomerProduct: {
        tags: async (parent: any) => {
            return TagService.getCustomerProductTags(parent.id);
        }
    },
    CustomerSolution: {
        tags: async (parent: any) => {
            return TagService.getCustomerSolutionTags(parent.id);
        }
    },
    Task: {
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
        }
    },
    CustomerTask: {
        tags: async (parent: any) => {
            try {
                const taskTags = await prisma.customerTaskTag.findMany({
                    where: { customerTaskId: parent.id },
                    include: { tag: true },
                    orderBy: { tag: { displayOrder: 'asc' } }
                });
                return taskTags.map((tt: any) => tt.tag) || [];
            } catch (error) {
                console.log('[CustomerTask.tags] Error, returning empty array:', (error as any).message);
                return [];
            }
        }
    },
    CustomerSolutionTask: {
        tags: async (parent: any) => {
            const taskTags = await prisma.customerSolutionTaskTag.findMany({
                where: { customerSolutionTaskId: parent.id },
                include: { tag: true },
                orderBy: { tag: { displayOrder: 'asc' } }
            });
            return taskTags.map((tt: any) => tt.tag);
        }
    }
};
