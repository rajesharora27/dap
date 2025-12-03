import { TestFactory } from '../factories/TestFactory';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Product Service', () => {
    beforeEach(async () => {
        await TestFactory.cleanup();
    });

    afterAll(async () => {
        await TestFactory.cleanup();
        await prisma.$disconnect();
    });

    describe('Create Product', () => {
        it('should create a product successfully', async () => {
            const product = await TestFactory.createProduct({
                name: 'Test Product',
                description: 'Test Description'
            });

            expect(product).toBeDefined();
            expect(product.name).toBe('Test Product');
            expect(product.description).toBe('Test Description');
        });

        it('should fail to create product with duplicate name', async () => {
            await TestFactory.createProduct({ name: 'Duplicate Product' });

            await expect(
                TestFactory.createProduct({ name: 'Duplicate Product' })
            ).rejects.toThrow();
        });

        it('should create product with custom attributes', async () => {
            const customAttrs = { key1: 'value1', key2: 'value2' };
            const product = await TestFactory.createProduct({ customAttrs });

            expect(product.customAttrs).toEqual(customAttrs);
        });
    });

    describe('Product with Tasks', () => {
        it('should create tasks for a product', async () => {
            const product = await TestFactory.createProduct();
            const task1 = await TestFactory.createTask(product.id, { name: 'Task 1' });
            const task2 = await TestFactory.createTask(product.id, { name: 'Task 2' });

            const productWithTasks = await prisma.product.findUnique({
                where: { id: product.id },
                include: { tasks: true }
            });

            expect(productWithTasks?.tasks).toHaveLength(2);
            expect(productWithTasks?.tasks.map(t => t.name)).toContain('Task 1');
            expect(productWithTasks?.tasks.map(t => t.name)).toContain('Task 2');
        });

        it('should calculate correct task weights', async () => {
            const product = await TestFactory.createProduct();
            await TestFactory.createTask(product.id, { weight: 25.5 });
            await TestFactory.createTask(product.id, { weight: 30.25 });
            await TestFactory.createTask(product.id, { weight: 44.25 });

            const tasks = await prisma.task.findMany({
                where: { productId: product.id }
            });

            const totalWeight = tasks.reduce((sum, task) =>
                sum + Number(task.weight), 0
            );

            expect(totalWeight).toBe(100);
        });
    });

    describe('Product Deletion', () => {
        it('should soft delete product', async () => {
            const product = await TestFactory.createProduct();

            const deleted = await prisma.product.update({
                where: { id: product.id },
                data: { deletedAt: new Date() }
            });

            expect(deleted.deletedAt).toBeDefined();
        });

        it('should cascade delete related entities', async () => {
            const product = await TestFactory.createProduct();
            await TestFactory.createTask(product.id);
            await TestFactory.createLicense(product.id);
            await TestFactory.createOutcome(product.id);

            await prisma.product.delete({
                where: { id: product.id }
            });

            const tasks = await prisma.task.findMany({
                where: { productId: product.id }
            });
            const licenses = await prisma.license.findMany({
                where: { productId: product.id }
            });
            const outcomes = await prisma.outcome.findMany({
                where: { productId: product.id }
            });

            expect(tasks).toHaveLength(0);
            expect(licenses).toHaveLength(0);
            expect(outcomes).toHaveLength(0);
        });
    });
});
