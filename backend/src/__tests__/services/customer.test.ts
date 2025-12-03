import { TestFactory } from '../factories/TestFactory';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Customer Service', () => {
    beforeEach(async () => {
        await TestFactory.cleanup();
    });

    afterAll(async () => {
        await TestFactory.cleanup();
        await prisma.$disconnect();
    });

    describe('Create Customer', () => {
        it('should create a customer successfully', async () => {
            const customer = await TestFactory.createCustomer({
                name: 'Acme Corp',
                industry: 'Technology'
            });

            expect(customer).toBeDefined();
            expect(customer.name).toBe('Acme Corp');
            expect(customer.industry).toBe('Technology');
        });

        it('should create customer with default values', async () => {
            const customer = await TestFactory.createCustomer();

            expect(customer).toBeDefined();
            expect(customer.name).toBeTruthy();
            expect(customer.createdAt).toBeDefined();
        });

        it('should fail to create customer without name', async () => {
            await expect(
                prisma.customer.create({
                    data: {
                        name: '',
                        industry: 'Tech'
                    }
                })
            ).rejects.toThrow();
        });
    });

    describe('Customer Adoption Plans', () => {
        it('should create adoption plan for product', async () => {
            const customer = await TestFactory.createCustomer();
            const product = await TestFactory.createProduct();

            const adoptionPlan = await prisma.adoptionPlan.create({
                data: {
                    customerId: customer.id,
                    productId: product.id,
                    status: 'IN_PROGRESS'
                }
            });

            expect(adoptionPlan).toBeDefined();
            expect(adoptionPlan.customerId).toBe(customer.id);
            expect(adoptionPlan.productId).toBe(product.id);
        });

        it('should create adoption plan for solution', async () => {
            const customer = await TestFactory.createCustomer();
            const solution = await TestFactory.createSolution();

            const adoptionPlan = await prisma.solutionAdoptionPlan.create({
                data: {
                    customerId: customer.id,
                    solutionId: solution.id,
                    status: 'NOT_STARTED'
                }
            });

            expect(adoptionPlan).toBeDefined();
            expect(adoptionPlan.customerId).toBe(customer.id);
            expect(adoptionPlan.solutionId).toBe(solution.id);
        });

        it('should track adoption progress', async () => {
            const customer = await TestFactory.createCustomer();
            const product = await TestFactory.createProduct();
            const task = await TestFactory.createTask(product.id);

            const adoptionPlan = await prisma.adoptionPlan.create({
                data: {
                    customerId: customer.id,
                    productId: product.id,
                    status: 'IN_PROGRESS'
                }
            });

            // Mark task as complete for customer
            await prisma.adoptionTask.create({
                data: {
                    adoptionPlanId: adoptionPlan.id,
                    taskId: task.id,
                    status: 'DONE'
                }
            });

            const tasks = await prisma.adoptionTask.findMany({
                where: { adoptionPlanId: adoptionPlan.id }
            });

            expect(tasks).toHaveLength(1);
            expect(tasks[0].status).toBe('DONE');
        });
    });

    describe('Customer CRUD Operations', () => {
        it('should retrieve customer by id', async () => {
            const created = await TestFactory.createCustomer({ name: 'Test Customer' });

            const found = await prisma.customer.findUnique({
                where: { id: created.id }
            });

            expect(found).toBeDefined();
            expect(found?.name).toBe('Test Customer');
        });

        it('should update customer details', async () => {
            const customer = await TestFactory.createCustomer({ name: 'Old Name' });

            const updated = await prisma.customer.update({
                where: { id: customer.id },
                data: { name: 'New Name', industry: 'Finance' }
            });

            expect(updated.name).toBe('New Name');
            expect(updated.industry).toBe('Finance');
        });

        it('should delete customer', async () => {
            const customer = await TestFactory.createCustomer();

            await prisma.customer.delete({
                where: { id: customer.id }
            });

            const found = await prisma.customer.findUnique({
                where: { id: customer.id }
            });

            expect(found).toBeNull();
        });

        it('should list all customers', async () => {
            await TestFactory.createCustomer({ name: 'Customer 1' });
            await TestFactory.createCustomer({ name: 'Customer 2' });
            await TestFactory.createCustomer({ name: 'Customer 3' });

            const customers = await prisma.customer.findMany();

            expect(customers.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Customer Relationships', () => {
        it('should cascade delete adoption plans', async () => {
            const customer = await TestFactory.createCustomer();
            const product = await TestFactory.createProduct();

            await prisma.adoptionPlan.create({
                data: {
                    customerId: customer.id,
                    productId: product.id,
                    status: 'IN_PROGRESS'
                }
            });

            await prisma.customer.delete({
                where: { id: customer.id }
            });

            const plans = await prisma.adoptionPlan.findMany({
                where: { customerId: customer.id }
            });

            expect(plans).toHaveLength(0);
        });

        it('should handle multiple adoption plans', async () => {
            const customer = await TestFactory.createCustomer();
            const product1 = await TestFactory.createProduct();
            const product2 = await TestFactory.createProduct();

            await prisma.adoptionPlan.create({
                data: {
                    customerId: customer.id,
                    productId: product1.id,
                    status: 'IN_PROGRESS'
                }
            });

            await prisma.adoptionPlan.create({
                data: {
                    customerId: customer.id,
                    productId: product2.id,
                    status: 'DONE'
                }
            });

            const plans = await prisma.adoptionPlan.findMany({
                where: { customerId: customer.id }
            });

            expect(plans).toHaveLength(2);
        });
    });

    describe('Search and Filter', () => {
        it('should search customers by name', async () => {
            await TestFactory.createCustomer({ name: 'Acme Corporation' });
            await TestFactory.createCustomer({ name: 'Beta Industries' });

            const results = await prisma.customer.findMany({
                where: {
                    name: {
                        contains: 'Acme',
                        mode: 'insensitive'
                    }
                }
            });

            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toContain('Acme');
        });

        it('should filter by industry', async () => {
            await TestFactory.createCustomer({ industry: 'Technology' });
            await TestFactory.createCustomer({ industry: 'Healthcare' });

            const results = await prisma.customer.findMany({
                where: { industry: 'Technology' }
            });

            expect(results.length).toBeGreaterThan(0);
            expect(results.every(c => c.industry === 'Technology')).toBe(true);
        });
    });
});
