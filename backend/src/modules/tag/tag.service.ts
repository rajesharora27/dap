
import { prisma } from '../../shared/graphql/context';
import { ProductTag, SolutionTag } from '@prisma/client';

export class TagService {
    // Queries
    static async getProductTag(id: string) {
        return prisma.productTag.findUnique({ where: { id } });
    }

    static async getProductTags(productId: string) {
        return prisma.productTag.findMany({
            where: { productId },
            orderBy: { displayOrder: 'asc' }
        });
    }

    static async getCustomerProductTags(customerProductId: string) {
        return prisma.customerProductTag.findMany({
            where: { customerProductId },
            orderBy: { displayOrder: 'asc' }
        });
    }

    static async getSolutionTags(solutionId: string) {
        return prisma.solutionTag.findMany({
            where: { solutionId },
            orderBy: { displayOrder: 'asc' }
        });
    }

    static async getCustomerSolutionTags(customerSolutionId: string) {
        return prisma.customerSolutionTag.findMany({
            where: { customerSolutionId },
            orderBy: { displayOrder: 'asc' }
        });
    }

    // Mutations - Product Tags
    static async createProductTag(input: any) {
        const { productId, name, description, color, displayOrder } = input;

        // Check for duplicate name
        const existing = await prisma.productTag.findFirst({
            where: { productId, name: { equals: name, mode: 'insensitive' } }
        });
        if (existing) throw new Error(`Tag with name "${name}" already exists`);

        const maxOrder = await prisma.productTag.findFirst({
            where: { productId },
            orderBy: { displayOrder: 'desc' }
        });

        return prisma.productTag.create({
            data: {
                productId,
                name,
                description,
                color,
                displayOrder: displayOrder ?? ((maxOrder?.displayOrder || 0) + 1)
            }
        });
    }

    static async updateProductTag(id: string, input: any) {
        const tag = await prisma.productTag.findUnique({ where: { id } });
        if (!tag) throw new Error('Tag not found');

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
    }

    static async deleteProductTag(id: string) {
        await prisma.productTag.delete({ where: { id } });
        return true;
    }

    // Mutations - Task Tags (Product)
    static async setTaskTags(taskId: string, tagIds: string[]) {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new Error('Task not found');

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

        return prisma.task.findUnique({ where: { id: taskId } });
    }

    static async addTagToTask(taskId: string, tagId: string) {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new Error('Task not found');

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
    }

    static async removeTagFromTask(taskId: string, tagId: string) {
        await prisma.taskTag.deleteMany({
            where: { taskId, tagId }
        });
        return prisma.task.findUnique({ where: { id: taskId } });
    }

    // Mutations - Solution Tags
    static async createSolutionTag(input: any) {
        const { solutionId, name, description, color, displayOrder } = input;

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
                description,
                color,
                displayOrder: displayOrder ?? ((maxOrder?.displayOrder || 0) + 1)
            }
        });
    }

    static async updateSolutionTag(id: string, input: any) {
        const tag = await prisma.solutionTag.findUnique({ where: { id } });
        if (!tag) throw new Error('Tag not found');

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
    }

    static async deleteSolutionTag(id: string) {
        await prisma.solutionTag.delete({ where: { id } });
        return true;
    }

    // Mutations - Solution Task Tags
    static async setSolutionTaskTags(taskId: string, tagIds: string[]) {
        if (tagIds.length > 0) {
            const tags = await prisma.solutionTag.findMany({ where: { id: { in: tagIds } } });
            if (tags.length !== tagIds.length) throw new Error('Some tags not found');

            // Ensure all tags belong to the same solution
            const solutionIds = new Set(tags.map((t: SolutionTag) => t.solutionId));
            if (solutionIds.size > 1) throw new Error('All tags must belong to the same solution');
        }

        await prisma.solutionTaskTag.deleteMany({ where: { taskId } });
        if (tagIds.length > 0) {
            await prisma.solutionTaskTag.createMany({
                data: tagIds.map((tagId: string) => ({ taskId, tagId }))
            });
        }
        return prisma.task.findUnique({ where: { id: taskId } });
    }

    static async addSolutionTagToTask(taskId: string, tagId: string) {
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new Error('Task not found');
        if (!task.solutionId) throw new Error('Task must act under a solution context');

        const tag = await prisma.solutionTag.findUnique({ where: { id: tagId } });
        if (!tag) throw new Error('Tag not found');
        if (tag.solutionId !== task.solutionId) throw new Error('Tag must belong to same solution');

        await prisma.solutionTaskTag.upsert({
            where: { taskId_tagId: { taskId, tagId } },
            create: { taskId, tagId },
            update: {}
        });
        return task;
    }

    static async removeSolutionTagFromTask(taskId: string, tagId: string) {
        await prisma.solutionTaskTag.deleteMany({ where: { taskId, tagId } });
        return prisma.task.findUnique({ where: { id: taskId } });
    }
}
