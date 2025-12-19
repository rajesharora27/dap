import { prisma } from '../../context';
import { requireUser } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { PermissionLevel, ResourceType, ProductTag, SolutionTag } from '@prisma/client';

export const TagResolvers = {
    Query: {
        productTag: async (_: any, { id }: any, ctx: any) => {
            requireUser(ctx);
            return prisma.productTag.findUnique({ where: { id } });
        },
        productTags: async (_: any, { productId }: any, ctx: any) => {
            requireUser(ctx);
            await requirePermission(ctx, ResourceType.PRODUCT, productId, PermissionLevel.READ);
            return prisma.productTag.findMany({
                where: { productId },
                orderBy: { displayOrder: 'asc' }
            });
        },
        customerProductTags: async (_: any, { customerProductId }: any, ctx: any) => {
            requireUser(ctx);
            const cp = await prisma.customerProduct.findUnique({ where: { id: customerProductId } });
            if (!cp) throw new Error('Customer Product not found');

            await requirePermission(ctx, ResourceType.CUSTOMER, cp.customerId, PermissionLevel.READ);

            return prisma.customerProductTag.findMany({
                where: { customerProductId },
                orderBy: { displayOrder: 'asc' }
            });
        },
        solutionTags: async (_: any, { solutionId }: any, ctx: any) => {
            requireUser(ctx);
            await requirePermission(ctx, ResourceType.SOLUTION, solutionId, PermissionLevel.READ);
            return prisma.solutionTag.findMany({
                where: { solutionId },
                orderBy: { displayOrder: 'asc' }
            });
        },
        customerSolutionTags: async (_: any, { customerSolutionId }: any, ctx: any) => {
            requireUser(ctx);
            const cs = await prisma.customerSolution.findUnique({ where: { id: customerSolutionId } });
            if (!cs) throw new Error('Customer Solution not found');

            await requirePermission(ctx, ResourceType.CUSTOMER, cs.customerId, PermissionLevel.READ);

            return prisma.customerSolutionTag.findMany({
                where: { customerSolutionId },
                orderBy: { displayOrder: 'asc' }
            });
        }
    },
    Mutation: {
        createProductTag: async (_: any, { input }: any, ctx: any) => {
            console.log('[createProductTag] Called with input:', JSON.stringify(input));
            requireUser(ctx);
            const { productId, name, color, displayOrder } = input;
            // Check permissions
            await requirePermission(ctx, ResourceType.PRODUCT, productId, PermissionLevel.WRITE);

            // Check for duplicate name
            const existing = await prisma.productTag.findFirst({
                where: { productId, name: { equals: name, mode: 'insensitive' } }
            });
            if (existing) throw new Error(`Tag with name "${name}" already exists`);

            const maxOrder = await prisma.productTag.findFirst({
                where: { productId },
                orderBy: { displayOrder: 'desc' }
            });

            const newTag = await prisma.productTag.create({
                data: {
                    productId,
                    name,
                    color,
                    displayOrder: displayOrder ?? ((maxOrder?.displayOrder || 0) + 1)
                }
            });
            console.log('[createProductTag] Created tag:', JSON.stringify(newTag));
            return newTag;
        },
        updateProductTag: async (_: any, { id, input }: any, ctx: any) => {
            requireUser(ctx);
            const tag = await prisma.productTag.findUnique({ where: { id } });
            if (!tag) throw new Error('Tag not found');

            await requirePermission(ctx, ResourceType.PRODUCT, tag.productId, PermissionLevel.WRITE);

            if (input.name) {
                const existing = await prisma.productTag.findFirst({
                    where: {
                        productId: tag.productId,
                        name: { equals: input.name, mode: 'insensitive' },
                        id: { not: id }
                    }
                });
                if (existing) throw new Error(`Tag with name "${input.name}" already exists`);
            }

            return prisma.productTag.update({
                where: { id },
                data: input
            });
        },
        deleteProductTag: async (_: any, { id }: any, ctx: any) => {
            requireUser(ctx);
            const tag = await prisma.productTag.findUnique({ where: { id } });
            if (!tag) throw new Error('Tag not found');

            await requirePermission(ctx, ResourceType.PRODUCT, tag.productId, PermissionLevel.WRITE);

            await prisma.productTag.delete({ where: { id } });
            return true;
        },
        setTaskTags: async (_: any, { taskId, tagIds }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');

            if (task.productId) {
                await requirePermission(ctx, ResourceType.PRODUCT, task.productId, PermissionLevel.WRITE);
            }

            // Verify all tags belong to the same product
            if (tagIds.length > 0) {
                const tags = await prisma.productTag.findMany({
                    where: { id: { in: tagIds } }
                });
                if (tags.length !== tagIds.length) throw new Error('Some tags not found');
                const invalidTags = tags.filter((t: ProductTag) => t.productId !== task.productId);
                if (invalidTags.length > 0) throw new Error('Tags must belong to the same product as the task');
            }

            // Transaction to replace all tags
            await prisma.taskTag.deleteMany({ where: { taskId } });

            if (tagIds.length > 0) {
                await prisma.taskTag.createMany({
                    data: tagIds.map((tagId: string) => ({ taskId, tagId }))
                });
            }

            const updatedTask = await prisma.task.findUnique({ where: { id: taskId } });
            return updatedTask;
        },
        addTagToTask: async (_: any, { taskId, tagId }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.productId) {
                await requirePermission(ctx, ResourceType.PRODUCT, task.productId, PermissionLevel.WRITE);
            }

            const tag = await prisma.productTag.findUnique({ where: { id: tagId } });
            if (!tag) throw new Error('Tag not found');
            if (tag.productId !== task.productId) throw new Error('Tag must belong to same product');

            const existing = await prisma.taskTag.findUnique({
                where: { taskId_tagId: { taskId, tagId } }
            });

            if (!existing) {
                await prisma.taskTag.create({ data: { taskId, tagId } });
            }

            return task;
        },
        removeTagFromTask: async (_: any, { taskId, tagId }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.productId) {
                await requirePermission(ctx, ResourceType.PRODUCT, task.productId, PermissionLevel.WRITE);
            }

            await prisma.taskTag.deleteMany({
                where: { taskId, tagId }
            });

            return task;
        },
        createSolutionTag: async (_: any, { input }: any, ctx: any) => {
            requireUser(ctx);
            const { solutionId, name, color, displayOrder } = input;
            await requirePermission(ctx, ResourceType.SOLUTION, solutionId, PermissionLevel.WRITE);

            const existing = await prisma.solutionTag.findFirst({
                where: { solutionId, name: { equals: name, mode: 'insensitive' } }
            });
            if (existing) throw new Error(`Tag with name "${name}" already exists`);

            const maxOrder = await prisma.solutionTag.findFirst({
                where: { solutionId },
                orderBy: { displayOrder: 'desc' }
            });

            return prisma.solutionTag.create({
                data: {
                    solutionId,
                    name,
                    color,
                    displayOrder: displayOrder ?? ((maxOrder?.displayOrder || 0) + 1)
                }
            });
        },
        updateSolutionTag: async (_: any, { id, input }: any, ctx: any) => {
            requireUser(ctx);
            const tag = await prisma.solutionTag.findUnique({ where: { id } });
            if (!tag) throw new Error('Tag not found');
            await requirePermission(ctx, ResourceType.SOLUTION, tag.solutionId, PermissionLevel.WRITE);

            if (input.name) {
                const existing = await prisma.solutionTag.findFirst({
                    where: {
                        solutionId: tag.solutionId,
                        name: { equals: input.name, mode: 'insensitive' },
                        id: { not: id }
                    }
                });
                if (existing) throw new Error(`Tag with name "${input.name}" already exists`);
            }

            return prisma.solutionTag.update({ where: { id }, data: input });
        },
        deleteSolutionTag: async (_: any, { id }: any, ctx: any) => {
            requireUser(ctx);
            const tag = await prisma.solutionTag.findUnique({ where: { id } });
            if (!tag) throw new Error('Tag not found');
            await requirePermission(ctx, ResourceType.SOLUTION, tag.solutionId, PermissionLevel.WRITE);
            await prisma.solutionTag.delete({ where: { id } });
            return true;
        },
        setSolutionTaskTags: async (_: any, { taskId, tagIds }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.solutionId) {
                await requirePermission(ctx, ResourceType.SOLUTION, task.solutionId, PermissionLevel.WRITE);
            }

            if (tagIds.length > 0) {
                const tags = await prisma.solutionTag.findMany({ where: { id: { in: tagIds } } });
                if (tags.length !== tagIds.length) throw new Error('Some tags not found');
                const invalidTags = tags.filter((t: SolutionTag) => t.solutionId !== task.solutionId);
                if (invalidTags.length > 0) throw new Error('Tags must belong to the same solution as the task');
            }

            await prisma.solutionTaskTag.deleteMany({ where: { taskId } });
            if (tagIds.length > 0) {
                await prisma.solutionTaskTag.createMany({
                    data: tagIds.map((tagId: string) => ({ taskId, tagId }))
                });
            }
            return prisma.task.findUnique({ where: { id: taskId } });
        },
        addSolutionTagToTask: async (_: any, { taskId, tagId }: any, ctx: any) => {
            requireUser(ctx);
            const task = await prisma.task.findUnique({ where: { id: taskId } });
            if (!task) throw new Error('Task not found');
            if (task.solutionId) {
                await requirePermission(ctx, ResourceType.SOLUTION, task.solutionId, PermissionLevel.WRITE);
            }

            const tag = await prisma.solutionTag.findUnique({ where: { id: tagId } });
            if (!tag) throw new Error('Tag not found');
            if (tag.solutionId !== task.solutionId) throw new Error('Tag must belong to same solution');

            await prisma.solutionTaskTag.upsert({
                where: { taskId_tagId: { taskId, tagId } },
                create: { taskId, tagId },
                update: {}
            });
            return task;
        },
        removeSolutionTagFromTask: async (_: any, { taskId, tagId }: any, ctx: any) => {
            requireUser(ctx);
            await prisma.solutionTaskTag.deleteMany({ where: { taskId, tagId } });
            return prisma.task.findUnique({ where: { id: taskId } });
        }
    },
    Solution: {
        tags: async (parent: any) => {
            return prisma.solutionTag.findMany({
                where: { solutionId: parent.id },
                orderBy: { displayOrder: 'asc' }
            });
        }
    },
    CustomerSolution: {
        tags: async (parent: any) => {
            return prisma.customerSolutionTag.findMany({
                where: { customerSolutionId: parent.id },
                orderBy: { displayOrder: 'asc' }
            });
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
    },
    Product: {
        tags: async (parent: any) => {
            return prisma.productTag.findMany({
                where: { productId: parent.id },
                orderBy: { displayOrder: 'asc' }
            });
        }
    },
    Task: {
        tags: async (parent: any) => {
            // Task -> TaskTag -> ProductTag
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
    CustomerProduct: {
        tags: async (parent: any) => {
            return prisma.customerProductTag.findMany({
                where: { customerProductId: parent.id },
                orderBy: { displayOrder: 'asc' }
            });
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
    }
};
