/**
 * Unit tests for SolutionService
 */

import { PrismaClient } from '@prisma/client';
import { SolutionService } from '../../../modules/solution/solution.service';
import { TestFactory } from '../../factories/TestFactory';

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public'
    }
  }
});

describe('SolutionService', () => {
  let testUser: any;

  beforeAll(async () => {
    await TestFactory.cleanup();
    testUser = await TestFactory.createUser({
      email: 'solutionservice@test.com',
      username: 'solutionservice_test',
      role: 'ADMIN',
      isAdmin: true,
      isActive: true,
    });
  });

  afterAll(async () => {
    await TestFactory.cleanup();
    await prisma.$disconnect();
  });

  describe('createSolution', () => {
    it('should create a solution with name and description', async () => {
      const solution = await SolutionService.createSolution(testUser.id, {
        name: 'Test Solution',
        description: 'A test solution description',
      });

      expect(solution).toBeDefined();
      expect(solution.name).toBe('Test Solution');
      expect(solution.description).toBe('A test solution description');
      expect(solution.id).toBeDefined();
    });

    it('should create a solution with custom attributes', async () => {
      const solution = await SolutionService.createSolution(testUser.id, {
        name: 'Solution with Attrs',
        customAttrs: {
          category: 'Security',
          priority: 'High',
        },
      });

      expect(solution.customAttrs).toEqual({
        category: 'Security',
        priority: 'High',
      });
    });

    it('should create a solution with resources', async () => {
      const solution = await SolutionService.createSolution(testUser.id, {
        name: 'Solution with Resources',
        resources: [
          { label: 'Overview', url: 'https://example.com/overview' },
          { label: 'Implementation', url: 'https://example.com/impl' },
        ],
      });

      expect(solution.resources).toEqual([
        { label: 'Overview', url: 'https://example.com/overview' },
        { label: 'Implementation', url: 'https://example.com/impl' },
      ]);
    });
  });

  describe('updateSolution', () => {
    it('should update solution name', async () => {
      const solution = await TestFactory.createSolution({ name: 'Original Solution' });

      const updated = await SolutionService.updateSolution(testUser.id, solution.id, {
        name: 'Updated Solution',
      });

      expect(updated.name).toBe('Updated Solution');
    });

    it('should update solution description', async () => {
      const solution = await TestFactory.createSolution({
        name: 'Desc Solution',
        description: 'Original',
      });

      const updated = await SolutionService.updateSolution(testUser.id, solution.id, {
        description: 'New description',
      });

      expect(updated.description).toBe('New description');
    });

    it('should update custom attributes', async () => {
      const solution = await TestFactory.createSolution({
        name: 'Attr Solution',
        customAttrs: { key1: 'value1' },
      });

      const updated = await SolutionService.updateSolution(testUser.id, solution.id, {
        customAttrs: { key1: 'updated', key2: 'new' },
      });

      expect(updated.customAttrs).toEqual({ key1: 'updated', key2: 'new' });
    });
  });

  describe('deleteSolution', () => {
    it('should delete a solution and return true', async () => {
      const solution = await TestFactory.createSolution({ name: 'To Delete Solution' });

      const result = await SolutionService.deleteSolution(testUser.id, solution.id);

      expect(result).toBe(true);

      const deleted = await prisma.solution.findUnique({
        where: { id: solution.id },
      });

      expect(deleted).toBeNull();
    });

    it('should cascade delete solution-product relationships', async () => {
      const solution = await TestFactory.createSolution({ name: 'With Products' });
      const product = await TestFactory.createProduct({ name: 'Linked Product' });

      await prisma.solutionProduct.create({
        data: {
          solutionId: solution.id,
          productId: product.id,
          order: 1,
        },
      });

      await SolutionService.deleteSolution(testUser.id, solution.id);

      const links = await prisma.solutionProduct.findMany({
        where: { solutionId: solution.id },
      });

      expect(links).toHaveLength(0);
    });
  });

  describe('addProductToSolution', () => {
    it('should add a product to a solution', async () => {
      const solution = await TestFactory.createSolution({ name: 'Add Product Solution' });
      const product = await TestFactory.createProduct({ name: 'Product to Add' });

      const result = await SolutionService.addProductToSolution(
        testUser.id,
        solution.id,
        product.id
      );

      expect(result).toBe(true);

      const link = await prisma.solutionProduct.findUnique({
        where: {
          productId_solutionId: {
            productId: product.id,
            solutionId: solution.id,
          },
        },
      });

      expect(link).toBeDefined();
    });

    it('should auto-calculate order when not specified', async () => {
      const solution = await TestFactory.createSolution({ name: 'Order Solution' });
      const product1 = await TestFactory.createProduct({ name: 'Product 1' });
      const product2 = await TestFactory.createProduct({ name: 'Product 2' });

      await SolutionService.addProductToSolution(testUser.id, solution.id, product1.id);
      await SolutionService.addProductToSolution(testUser.id, solution.id, product2.id);

      const links = await prisma.solutionProduct.findMany({
        where: { solutionId: solution.id },
        orderBy: { order: 'asc' },
      });

      expect(links[0].productId).toBe(product1.id);
      expect(links[0].order).toBe(1);
      expect(links[1].productId).toBe(product2.id);
      expect(links[1].order).toBe(2);
    });

    it('should use specified order when provided', async () => {
      const solution = await TestFactory.createSolution({ name: 'Custom Order Solution' });
      const product = await TestFactory.createProduct({ name: 'Ordered Product' });

      await SolutionService.addProductToSolution(testUser.id, solution.id, product.id, 5);

      const link = await prisma.solutionProduct.findUnique({
        where: {
          productId_solutionId: {
            productId: product.id,
            solutionId: solution.id,
          },
        },
      });

      expect(link?.order).toBe(5);
    });

    it('should update order if product already in solution (upsert)', async () => {
      const solution = await TestFactory.createSolution({ name: 'Upsert Solution' });
      const product = await TestFactory.createProduct({ name: 'Upsert Product' });

      await SolutionService.addProductToSolution(testUser.id, solution.id, product.id, 1);
      await SolutionService.addProductToSolution(testUser.id, solution.id, product.id, 10);

      const links = await prisma.solutionProduct.findMany({
        where: { solutionId: solution.id, productId: product.id },
      });

      expect(links).toHaveLength(1);
      expect(links[0].order).toBe(10);
    });
  });

  describe('removeProductFromSolution', () => {
    it('should remove a product from a solution', async () => {
      const solution = await TestFactory.createSolution({ name: 'Remove Product Solution' });
      const product = await TestFactory.createProduct({ name: 'Product to Remove' });

      await prisma.solutionProduct.create({
        data: {
          solutionId: solution.id,
          productId: product.id,
          order: 1,
        },
      });

      const result = await SolutionService.removeProductFromSolution(
        testUser.id,
        solution.id,
        product.id
      );

      expect(result).toBe(true);

      const link = await prisma.solutionProduct.findUnique({
        where: {
          productId_solutionId: {
            productId: product.id,
            solutionId: solution.id,
          },
        },
      });

      expect(link).toBeNull();
    });
  });

  describe('reorderProductsInSolution', () => {
    it('should reorder products in a solution', async () => {
      const solution = await TestFactory.createSolution({ name: 'Reorder Solution' });
      const product1 = await TestFactory.createProduct({ name: 'Reorder P1' });
      const product2 = await TestFactory.createProduct({ name: 'Reorder P2' });
      const product3 = await TestFactory.createProduct({ name: 'Reorder P3' });

      // Add products in initial order
      await prisma.solutionProduct.createMany({
        data: [
          { solutionId: solution.id, productId: product1.id, order: 1 },
          { solutionId: solution.id, productId: product2.id, order: 2 },
          { solutionId: solution.id, productId: product3.id, order: 3 },
        ],
      });

      // Reorder: P3 first, P1 second, P2 third
      await SolutionService.reorderProductsInSolution(testUser.id, solution.id, [
        { productId: product3.id, order: 1 },
        { productId: product1.id, order: 2 },
        { productId: product2.id, order: 3 },
      ]);

      const links = await prisma.solutionProduct.findMany({
        where: { solutionId: solution.id },
        orderBy: { order: 'asc' },
      });

      expect(links[0].productId).toBe(product3.id);
      expect(links[1].productId).toBe(product1.id);
      expect(links[2].productId).toBe(product2.id);
    });
  });

  describe('calculateSolutionTasksProgress', () => {
    it('should calculate progress for tasks', () => {
      const tasks = [
        { status: 'COMPLETED', weight: 10 },
        { status: 'COMPLETED', weight: 20 },
        { status: 'PENDING', weight: 30 },
        { status: 'IN_PROGRESS', weight: 40 },
      ];

      const progress = SolutionService.calculateSolutionTasksProgress(tasks);

      expect(progress.totalTasks).toBe(4);
      expect(progress.completedTasks).toBe(2);
      expect(progress.totalWeight).toBe(100);
      expect(progress.completedWeight).toBe(30);
      expect(progress.progressPercentage).toBe(30);
    });

    it('should exclude NOT_APPLICABLE tasks', () => {
      const tasks = [
        { status: 'COMPLETED', weight: 10 },
        { status: 'NOT_APPLICABLE', weight: 50 },
        { status: 'PENDING', weight: 40 },
      ];

      const progress = SolutionService.calculateSolutionTasksProgress(tasks);

      expect(progress.totalTasks).toBe(2);
      expect(progress.totalWeight).toBe(50);
    });

    it('should handle DONE status as completed', () => {
      const tasks = [
        { status: 'DONE', weight: 25 },
        { status: 'PENDING', weight: 75 },
      ];

      const progress = SolutionService.calculateSolutionTasksProgress(tasks);

      expect(progress.completedTasks).toBe(1);
      expect(progress.completedWeight).toBe(25);
      expect(progress.progressPercentage).toBe(25);
    });

    it('should return 0% for empty task list', () => {
      const progress = SolutionService.calculateSolutionTasksProgress([]);

      expect(progress.totalTasks).toBe(0);
      expect(progress.progressPercentage).toBe(0);
    });

    it('should handle Prisma Decimal types', () => {
      const tasks = [
        { status: 'COMPLETED', weight: { toNumber: () => 33.33 } },
        { status: 'PENDING', weight: { toNumber: () => 66.67 } },
      ];

      const progress = SolutionService.calculateSolutionTasksProgress(tasks);

      expect(progress.totalWeight).toBe(100);
      expect(progress.completedWeight).toBeCloseTo(33.33);
    });
  });
});

