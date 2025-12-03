import { TestFactory } from '../factories/TestFactory';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Solution Service', () => {
    beforeEach(async () => {
        await TestFactory.cleanup();
    });

    afterAll(async () => {
        await TestFactory.cleanup();
        await prisma.$disconnect();
    });

    describe('Create Solution', () => {
        it('should create a solution successfully', async () => {
            const solution = await TestFactory.createSolution({
                name: 'Enterprise Bundle',
                description: 'Complete enterprise solution'
            });

            expect(solution).toBeDefined();
            expect(solution.name).toBe('Enterprise Bundle');
            expect(solution.description).toBe('Complete enterprise solution');
        });

        it('should create solution with products', async () => {
            const solution = await TestFactory.createSolution();
            const product1 = await TestFactory.createProduct();
            const product2 = await TestFactory.createProduct();

            await prisma.productInSolution.create({
                data: {
                    solutionId: solution.id,
                    productId: product1.id
                }
            });

            await prisma.productInSolution.create({
                data: {
                    solutionId: solution.id,
                    productId: product2.id
                }
            });

            const solutionWithProducts = await prisma.solution.findUnique({
                where: { id: solution.id },
                include: { products: true }
            });

            expect(solutionWithProducts?.products).toHaveLength(2);
        });
    });

    describe('Solution Products Management', () => {
        it('should add product to solution', async () => {
            const solution = await TestFactory.createSolution();
            const product = await TestFactory.createProduct();

            const productInSolution = await prisma.productInSolution.create({
                data: {
                    solutionId: solution.id,
                    productId: product.id
                }
            });

            expect(productInSolution).toBeDefined();
            expect(productInSolution.solutionId).toBe(solution.id);
            expect(productInSolution.productId).toBe(product.id);
        });

        it('should remove product from solution', async () => {
            const solution = await TestFactory.createSolution();
            const product = await TestFactory.createProduct();

            const relation = await prisma.productInSolution.create({
                data: {
                    solutionId: solution.id,
                    productId: product.id
                }
            });

            await prisma.productInSolution.delete({
                where: { id: relation.id }
            });

            const products = await prisma.productInSolution.findMany({
                where: { solutionId: solution.id }
            });

            expect(products).toHaveLength(0);
        });

        it('should prevent duplicate products in solution', async () => {
            const solution = await TestFactory.createSolution();
            const product = await TestFactory.createProduct();

            await prisma.productInSolution.create({
                data: {
                    solutionId: solution.id,
                    productId: product.id
                }
            });

            // Attempting to add same product again should fail
            await expect(
                prisma.productInSolution.create({
                    data: {
                        solutionId: solution.id,
                        productId: product.id
                    }
                })
            ).rejects.toThrow();
        });
    });

    describe('Solution with Licenses and Outcomes', () => {
        it('should create solution with licenses', async () => {
            const solution = await TestFactory.createSolution();

            await prisma.license.create({
                data: {
                    solutionId: solution.id,
                    level: 'PREMIUM',
                    description: 'Premium license'
                }
            });

            await prisma.license.create({
                data: {
                    solutionId: solution.id,
                    level: 'ESSENTIAL',
                    description: 'Essential license'
                }
            });

            const licenses = await prisma.license.findMany({
                where: { solutionId: solution.id }
            });

            expect(licenses).toHaveLength(2);
        });

        it('should create solution with outcomes', async () => {
            const solution = await TestFactory.createSolution();

            await prisma.outcome.create({
                data: {
                    solutionId: solution.id,
                    description: 'Improved efficiency',
                    category: 'TIME'
                }
            });

            const outcomes = await prisma.outcome.findMany({
                where: { solutionId: solution.id }
            });

            expect(outcomes).toHaveLength(1);
            expect(outcomes[0].category).toBe('TIME');
        });
    });

    describe('Solution Tasks', () => {
        it('should create tasks for solution', async () => {
            const solution = await TestFactory.createSolution();

            const task1 = await prisma.task.create({
                data: {
                    solutionId: solution.id,
                    name: 'Setup Task',
                    description: 'Initial setup',
                    weight: 50,
                    sequenceNumber: 1,
                    licenseLevel: 'ESSENTIAL',
                    estMinutes: 30
                }
            });

            const task2 = await prisma.task.create({
                data: {
                    solutionId: solution.id,
                    name: 'Configuration Task',
                    description: 'Configure system',
                    weight: 50,
                    sequenceNumber: 2,
                    licenseLevel: 'ESSENTIAL',
                    estMinutes: 60
                }
            });

            const tasks = await prisma.task.findMany({
                where: { solutionId: solution.id },
                orderBy: { sequenceNumber: 'asc' }
            });

            expect(tasks).toHaveLength(2);
            expect(tasks[0].name).toBe('Setup Task');
            expect(tasks[1].name).toBe('Configuration Task');
        });

        it('should maintain task sequence', async () => {
            const solution = await TestFactory.createSolution();

            await prisma.task.create({
                data: {
                    solutionId: solution.id,
                    name: 'Task 1',
                    weight: 33.33,
                    sequenceNumber: 1,
                    licenseLevel: 'ESSENTIAL',
                    estMinutes: 30
                }
            });

            await prisma.task.create({
                data: {
                    solutionId: solution.id,
                    name: 'Task 2',
                    weight: 33.33,
                    sequenceNumber: 2,
                    licenseLevel: 'ESSENTIAL',
                    estMinutes: 30
                }
            });

            await prisma.task.create({
                data: {
                    solutionId: solution.id,
                    name: 'Task 3',
                    weight: 33.34,
                    sequenceNumber: 3,
                    licenseLevel: 'ESSENTIAL',
                    estMinutes: 30
                }
            });

            const tasks = await prisma.task.findMany({
                where: { solutionId: solution.id },
                orderBy: { sequenceNumber: 'asc' }
            });

            expect(tasks).toHaveLength(3);
            expect(tasks[0].sequenceNumber).toBe(1);
            expect(tasks[1].sequenceNumber).toBe(2);
            expect(tasks[2].sequenceNumber).toBe(3);
        });
    });

    describe('Solution Update and Delete', () => {
        it('should update solution details', async () => {
            const solution = await TestFactory.createSolution({ name: 'Old Name' });

            const updated = await prisma.solution.update({
                where: { id: solution.id },
                data: {
                    name: 'New Name',
                    description: 'Updated description'
                }
            });

            expect(updated.name).toBe('New Name');
            expect(updated.description).toBe('Updated description');
        });

        it('should delete solution', async () => {
            const solution = await TestFactory.createSolution();

            await prisma.solution.delete({
                where: { id: solution.id }
            });

            const found = await prisma.solution.findUnique({
                where: { id: solution.id }
            });

            expect(found).toBeNull();
        });

        it('should cascade delete related data', async () => {
            const solution = await TestFactory.createSolution();
            const product = await TestFactory.createProduct();

            await prisma.productInSolution.create({
                data: {
                    solutionId: solution.id,
                    productId: product.id
                }
            });

            await prisma.task.create({
                data: {
                    solutionId: solution.id,
                    name: 'Test Task',
                    weight: 100,
                    sequenceNumber: 1,
                    licenseLevel: 'ESSENTIAL',
                    estMinutes: 30
                }
            });

            await prisma.solution.delete({
                where: { id: solution.id }
            });

            const products = await prisma.productInSolution.findMany({
                where: { solutionId: solution.id }
            });

            const tasks = await prisma.task.findMany({
                where: { solutionId: solution.id }
            });

            expect(products).toHaveLength(0);
            expect(tasks).toHaveLength(0);
        });
    });

    describe('Solution Adoption Plans', () => {
        it('should create adoption plan for solution', async () => {
            const customer = await TestFactory.createCustomer();
            const solution = await TestFactory.createSolution();

            const adoptionPlan = await prisma.solutionAdoptionPlan.create({
                data: {
                    customerId: customer.id,
                    solutionId: solution.id,
                    status: 'IN_PROGRESS'
                }
            });

            expect(adoptionPlan).toBeDefined();
            expect(adoptionPlan.customerId).toBe(customer.id);
            expect(adoptionPlan.solutionId).toBe(solution.id);
        });

        it('should track solution adoption status', async () => {
            const customer = await TestFactory.createCustomer();
            const solution = await TestFactory.createSolution();

            const adoptionPlan = await prisma.solutionAdoptionPlan.create({
                data: {
                    customerId: customer.id,
                    solutionId: solution.id,
                    status: 'NOT_STARTED'
                }
            });

            const updated = await prisma.solutionAdoptionPlan.update({
                where: { id: adoptionPlan.id },
                data: { status: 'DONE' }
            });

            expect(updated.status).toBe('DONE');
        });
    });

    describe('Complex Solution Scenarios', () => {
        it('should handle solution with multiple products and tasks', async () => {
            const solution = await TestFactory.createSolution();
            const product1 = await TestFactory.createProduct();
            const product2 = await TestFactory.createProduct();

            await prisma.productInSolution.create({
                data: { solutionId: solution.id, productId: product1.id }
            });

            await prisma.productInSolution.create({
                data: { solutionId: solution.id, productId: product2.id }
            });

            await prisma.task.create({
                data: {
                    solutionId: solution.id,
                    name: 'Solution Task 1',
                    weight: 50,
                    sequenceNumber: 1,
                    licenseLevel: 'ESSENTIAL',
                    estMinutes: 30
                }
            });

            await prisma.task.create({
                data: {
                    solutionId: solution.id,
                    name: 'Solution Task 2',
                    weight: 50,
                    sequenceNumber: 2,
                    licenseLevel: 'PREMIUM',
                    estMinutes: 60
                }
            });

            const fullSolution = await prisma.solution.findUnique({
                where: { id: solution.id },
                include: {
                    products: { include: { product: true } },
                    tasks: true,
                    licenses: true,
                    outcomes: true
                }
            });

            expect(fullSolution?.products).toHaveLength(2);
            expect(fullSolution?.tasks).toHaveLength(2);
        });
    });
});
