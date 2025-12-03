import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

/**
 * DataLoader utilities to prevent N+1 query problems
 * 
 * DataLoader batches and caches database queries within a single request,
 * dramatically improving performance when loading related entities.
 * 
 * Example N+1 problem:
 * Without DataLoader:
 *   - Load 100 products
 *   - For each product, load its tasks (100 queries!)
 *   - Total: 101 queries
 * 
 * With DataLoader:
 *   - Load 100 products
 *   - Batch load all tasks for all products (1 query!)
 *   - Total: 2 queries ✅
 */

/**
 * Create a product loader
 */
export function createProductLoader(prisma: PrismaClient) {
    return new DataLoader<string, any>(async (productIds) => {
        const products = await prisma.product.findMany({
            where: { id: { in: [...productIds] } },
            include: {
                licenses: true,
                outcomes: true,
                releases: true,
            }
        });

        // DataLoader expects results in same order as IDs
        const productMap = new Map(products.map(p => [p.id, p]));
        return productIds.map(id => productMap.get(id) || null);
    });
}

/**
 * Create a task loader
 */
export function createTaskLoader(prisma: PrismaClient) {
    return new DataLoader<string, any>(async (taskIds) => {
        const tasks = await prisma.task.findMany({
            where: { id: { in: [...taskIds] } },
            include: {
                outcomes: { include: { outcome: true } },
                releases: { include: { release: true } },
                telemetryAttributes: true,
            }
        });

        const taskMap = new Map(tasks.map(t => [t.id, t]));
        return taskIds.map(id => taskMap.get(id) || null);
    });
}

/**
 * Create a user loader
 */
export function createUserLoader(prisma: PrismaClient) {
    return new DataLoader<string, any>(async (userIds) => {
        const users = await prisma.user.findMany({
            where: { id: { in: [...userIds] } },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                fullName: true,
                role: true,
                isAdmin: true,
                isActive: true,
            }
        });

        const userMap = new Map(users.map(u => [u.id, u]));
        return userIds.map(id => userMap.get(id) || null);
    });
}

/**
 * Create a customer loader
 */
export function createCustomerLoader(prisma: PrismaClient) {
    return new DataLoader<string, any>(async (customerIds) => {
        const customers = await prisma.customer.findMany({
            where: { id: { in: [...customerIds] } }
        });

        const customerMap = new Map(customers.map(c => [c.id, c]));
        return customerIds.map(id => customerMap.get(id) || null);
    });
}

/**
 * Create a solution loader
 */
export function createSolutionLoader(prisma: PrismaClient) {
    return new DataLoader<string, any>(async (solutionIds) => {
        const solutions = await prisma.solution.findMany({
            where: { id: { in: [...solutionIds] } },
            include: {
                products: {
                    include: { product: true }
                },
                licenses: true,
                outcomes: true,
                releases: true,
            }
        });

        const solutionMap = new Map(solutions.map(s => [s.id, s]));
        return solutionIds.map(id => solutionMap.get(id) || null);
    });
}

/**
 * Batch load tasks by product ID
 */
export function createTasksByProductLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (productIds) => {
        const tasks = await prisma.task.findMany({
            where: { productId: { in: [...productIds] } },
            include: {
                outcomes: { include: { outcome: true } },
                releases: { include: { release: true } },
                telemetryAttributes: true,
            },
            orderBy: { sequenceNumber: 'asc' }
        });

        // Group tasks by product ID
        const tasksByProduct = new Map<string, any[]>();
        for (const task of tasks) {
            if (task.productId) {
                if (!tasksByProduct.has(task.productId)) {
                    tasksByProduct.set(task.productId, []);
                }
                tasksByProduct.get(task.productId)!.push(task);
            }
        }

        return productIds.map(id => tasksByProduct.get(id) || []);
    });
}

/**
 * Batch load tasks by solution ID
 */
export function createTasksBySolutionLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (solutionIds) => {
        const tasks = await prisma.task.findMany({
            where: { solutionId: { in: [...solutionIds] } },
            include: {
                outcomes: { include: { outcome: true } },
                releases: { include: { release: true } },
                telemetryAttributes: true,
            },
            orderBy: { sequenceNumber: 'asc' }
        });

        const tasksBySolution = new Map<string, any[]>();
        for (const task of tasks) {
            if (task.solutionId) {
                if (!tasksBySolution.has(task.solutionId)) {
                    tasksBySolution.set(task.solutionId, []);
                }
                tasksBySolution.get(task.solutionId)!.push(task);
            }
        }

        return solutionIds.map(id => tasksBySolution.get(id) || []);
    });
}

/**
 * Create all loaders for a request
 * This should be called once per GraphQL request
 */
export function createLoaders(prisma: PrismaClient) {
    return {
        product: createProductLoader(prisma),
        task: createTaskLoader(prisma),
        user: createUserLoader(prisma),
        customer: createCustomerLoader(prisma),
        solution: createSolutionLoader(prisma),
        tasksByProduct: createTasksByProductLoader(prisma),
        tasksBySolution: createTasksBySolutionLoader(prisma),
    };
}

export type Loaders = ReturnType<typeof createLoaders>;
