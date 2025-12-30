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
 * Batch load tags by product ID
 */
export function createTagsByProductLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (productIds) => {
        const productTags = await prisma.productTag.findMany({
            where: { productId: { in: [...productIds] } },
            orderBy: { displayOrder: 'asc' },
        });

        const tagsByProduct = new Map<string, any[]>();
        for (const pt of productTags) {
            if (!tagsByProduct.has(pt.productId)) {
                tagsByProduct.set(pt.productId, []);
            }
            // ProductTag now contains tag properties directly
            tagsByProduct.get(pt.productId)!.push(pt);
        }

        return productIds.map(id => tagsByProduct.get(id) || []);
    });
}

/**
 * Batch load tags by solution ID
 */
export function createTagsBySolutionLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (solutionIds) => {
        const solutionTags = await prisma.solutionTag.findMany({
            where: { solutionId: { in: [...solutionIds] } },
            orderBy: { displayOrder: 'asc' },
        });

        const tagsBySolution = new Map<string, any[]>();
        for (const st of solutionTags) {
            if (!tagsBySolution.has(st.solutionId)) {
                tagsBySolution.set(st.solutionId, []);
            }
            // SolutionTag now contains tag properties directly
            tagsBySolution.get(st.solutionId)!.push(st);
        }

        return solutionIds.map(id => tagsBySolution.get(id) || []);
    });
}

/**
 * Batch load outcomes by product ID
 */
export function createOutcomesByProductLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (productIds) => {
        const outcomes = await prisma.outcome.findMany({
            where: { productId: { in: [...productIds] } },
            orderBy: { displayOrder: 'asc' },
        });

        const outcomesByProduct = new Map<string, any[]>();
        for (const outcome of outcomes) {
            if (outcome.productId) {
                if (!outcomesByProduct.has(outcome.productId)) {
                    outcomesByProduct.set(outcome.productId, []);
                }
                outcomesByProduct.get(outcome.productId)!.push(outcome);
            }
        }

        return productIds.map(id => outcomesByProduct.get(id) || []);
    });
}

/**
 * Batch load outcomes by solution ID
 */
export function createOutcomesBySolutionLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (solutionIds) => {
        const outcomes = await prisma.outcome.findMany({
            where: { solutionId: { in: [...solutionIds] } },
            orderBy: { displayOrder: 'asc' },
        });

        const outcomesBySolution = new Map<string, any[]>();
        for (const outcome of outcomes) {
            if (outcome.solutionId) {
                if (!outcomesBySolution.has(outcome.solutionId)) {
                    outcomesBySolution.set(outcome.solutionId, []);
                }
                outcomesBySolution.get(outcome.solutionId)!.push(outcome);
            }
        }

        return solutionIds.map(id => outcomesBySolution.get(id) || []);
    });
}

/**
 * Batch load licenses by product ID
 */
export function createLicensesByProductLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (productIds) => {
        const licenses = await prisma.license.findMany({
            where: { productId: { in: [...productIds] } },
            orderBy: { level: 'asc' },
        });

        const licensesByProduct = new Map<string, any[]>();
        for (const license of licenses) {
            if (license.productId) {
                if (!licensesByProduct.has(license.productId)) {
                    licensesByProduct.set(license.productId, []);
                }
                licensesByProduct.get(license.productId)!.push(license);
            }
        }

        return productIds.map(id => licensesByProduct.get(id) || []);
    });
}

/**
 * Batch load products by solution ID (through SolutionProduct junction)
 */
export function createProductsBySolutionLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (solutionIds) => {
        const solutionProducts = await prisma.solutionProduct.findMany({
            where: { solutionId: { in: [...solutionIds] } },
            include: { product: true },
            orderBy: { order: 'asc' },
        });

        const productsBySolution = new Map<string, any[]>();
        for (const sp of solutionProducts) {
            if (!productsBySolution.has(sp.solutionId)) {
                productsBySolution.set(sp.solutionId, []);
            }
            productsBySolution.get(sp.solutionId)!.push(sp.product);
        }

        return solutionIds.map(id => productsBySolution.get(id) || []);
    });
}

/**
 * Batch load products by customer ID (through CustomerProduct junction)
 */
export function createProductsByCustomerLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (customerIds) => {
        const customerProducts = await prisma.customerProduct.findMany({
            where: { customerId: { in: [...customerIds] } },
            include: { product: true },
        });

        const productsByCustomer = new Map<string, any[]>();
        for (const cp of customerProducts) {
            if (!productsByCustomer.has(cp.customerId)) {
                productsByCustomer.set(cp.customerId, []);
            }
            productsByCustomer.get(cp.customerId)!.push(cp.product);
        }

        return customerIds.map(id => productsByCustomer.get(id) || []);
    });
}

/**
 * Batch load solutions by customer ID (through CustomerSolution junction)
 */
export function createSolutionsByCustomerLoader(prisma: PrismaClient) {
    return new DataLoader<string, any[]>(async (customerIds) => {
        const customerSolutions = await prisma.customerSolution.findMany({
            where: { customerId: { in: [...customerIds] } },
            include: { solution: true },
        });

        const solutionsByCustomer = new Map<string, any[]>();
        for (const cs of customerSolutions) {
            if (!solutionsByCustomer.has(cs.customerId)) {
                solutionsByCustomer.set(cs.customerId, []);
            }
            solutionsByCustomer.get(cs.customerId)!.push(cs.solution);
        }

        return customerIds.map(id => solutionsByCustomer.get(id) || []);
    });
}

/**
 * Create all loaders for a request
 * This should be called once per GraphQL request
 */
export function createLoaders(prisma: PrismaClient) {
    return {
        // Entity loaders
        product: createProductLoader(prisma),
        task: createTaskLoader(prisma),
        user: createUserLoader(prisma),
        customer: createCustomerLoader(prisma),
        solution: createSolutionLoader(prisma),

        // Relationship loaders - Tasks
        tasksByProduct: createTasksByProductLoader(prisma),
        tasksBySolution: createTasksBySolutionLoader(prisma),

        // Relationship loaders - Tags
        tagsByProduct: createTagsByProductLoader(prisma),
        tagsBySolution: createTagsBySolutionLoader(prisma),

        // Relationship loaders - Outcomes
        outcomesByProduct: createOutcomesByProductLoader(prisma),
        outcomesBySolution: createOutcomesBySolutionLoader(prisma),

        // Relationship loaders - Licenses
        licensesByProduct: createLicensesByProductLoader(prisma),

        // Relationship loaders - Cross-entity
        productsBySolution: createProductsBySolutionLoader(prisma),
        productsByCustomer: createProductsByCustomerLoader(prisma),
        solutionsByCustomer: createSolutionsByCustomerLoader(prisma),
    };
}

export type Loaders = ReturnType<typeof createLoaders>;
