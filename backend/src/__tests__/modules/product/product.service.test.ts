/**
 * Unit tests for ProductService
 */

import { PrismaClient } from '@prisma/client';
import { ProductService } from '../../../modules/product/product.service';
import { TestFactory } from '../../factories/TestFactory';

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public'
    }
  }
});

describe('ProductService', () => {
  let testUser: any;

  beforeAll(async () => {
    await TestFactory.cleanup();
    testUser = await TestFactory.createUser({
      email: 'productservice@test.com',
      username: 'productservice_test',
      role: 'ADMIN',
      isAdmin: true,
      isActive: true,
    });
  });

  afterAll(async () => {
    await TestFactory.cleanup();
    await prisma.$disconnect();
  });

  describe('createProduct', () => {
    it('should create a product with name and description', async () => {
      const product = await ProductService.createProduct(testUser.id, {
        name: 'Test Product',
        description: 'A test product description',
      });

      expect(product).toBeDefined();
      expect(product.name).toBe('Test Product');
      expect(product.description).toBe('A test product description');
      expect(product.id).toBeDefined();
    });

    it('should create a product with custom attributes', async () => {
      const product = await ProductService.createProduct(testUser.id, {
        name: 'Product with Attrs',
        customAttrs: {
          category: 'Security',
          tier: 'Enterprise',
        },
      });

      expect(product.customAttrs).toEqual({
        category: 'Security',
        tier: 'Enterprise',
      });
    });

    it('should create a product with resources', async () => {
      const product = await ProductService.createProduct(testUser.id, {
        name: 'Product with Resources',
        resources: {
          documentation: 'https://docs.example.com',
          support: 'https://support.example.com',
        },
      });

      expect(product.resources).toEqual({
        documentation: 'https://docs.example.com',
        support: 'https://support.example.com',
      });
    });

    it('should associate licenses when licenseIds provided', async () => {
      // First create a product and license
      const existingProduct = await TestFactory.createProduct({ name: 'License Source' });
      const license = await TestFactory.createLicense(existingProduct.id, {
        name: 'Test License',
        level: 1,
      });

      const newProduct = await ProductService.createProduct(testUser.id, {
        name: 'Product with License',
        licenseIds: [license.id],
      });

      // Check license was reassigned
      const updatedLicense = await prisma.license.findUnique({
        where: { id: license.id },
      });

      expect(updatedLicense?.productId).toBe(newProduct.id);
    });
  });

  describe('updateProduct', () => {
    it('should update product name', async () => {
      const product = await TestFactory.createProduct({ name: 'Original Name' });

      const updated = await ProductService.updateProduct(testUser.id, product.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should update product description', async () => {
      const product = await TestFactory.createProduct({
        name: 'Desc Test',
        description: 'Original description',
      });

      const updated = await ProductService.updateProduct(testUser.id, product.id, {
        description: 'New description',
      });

      expect(updated.description).toBe('New description');
    });

    it('should update custom attributes', async () => {
      const product = await TestFactory.createProduct({
        name: 'Attr Test',
        customAttrs: { key1: 'value1' },
      });

      const updated = await ProductService.updateProduct(testUser.id, product.id, {
        customAttrs: { key1: 'updated', key2: 'new' },
      });

      expect(updated.customAttrs).toEqual({ key1: 'updated', key2: 'new' });
    });

    it('should preserve unchanged fields', async () => {
      const product = await TestFactory.createProduct({
        name: 'Preserve Test',
        description: 'Original description',
      });

      const updated = await ProductService.updateProduct(testUser.id, product.id, {
        name: 'New Name',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('Original description');
    });

    it('should reassign licenses when licenseIds updated', async () => {
      const product1 = await TestFactory.createProduct({ name: 'License Product 1' });
      const product2 = await TestFactory.createProduct({ name: 'License Product 2' });
      
      const license1 = await TestFactory.createLicense(product1.id, { name: 'License 1' });
      const license2 = await TestFactory.createLicense(product1.id, { name: 'License 2' });

      // Move license2 to product2
      await ProductService.updateProduct(testUser.id, product2.id, {
        name: 'License Product 2',
        licenseIds: [license2.id],
      });

      const updatedLicense2 = await prisma.license.findUnique({
        where: { id: license2.id },
      });

      expect(updatedLicense2?.productId).toBe(product2.id);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product and return true', async () => {
      const product = await TestFactory.createProduct({ name: 'To Delete' });

      const result = await ProductService.deleteProduct(testUser.id, product.id);

      expect(result).toBe(true);

      const deleted = await prisma.product.findUnique({
        where: { id: product.id },
      });

      expect(deleted).toBeNull();
    });

    it('should cascade delete related tasks', async () => {
      const product = await TestFactory.createProduct({ name: 'With Tasks' });
      await TestFactory.createTask(product.id, { name: 'Task 1' });
      await TestFactory.createTask(product.id, { name: 'Task 2' });

      await ProductService.deleteProduct(testUser.id, product.id);

      const tasks = await prisma.task.findMany({
        where: { productId: product.id },
      });

      expect(tasks).toHaveLength(0);
    });

    it('should cascade delete related outcomes', async () => {
      const product = await TestFactory.createProduct({ name: 'With Outcomes' });
      await TestFactory.createOutcome(product.id, { name: 'Outcome 1' });

      await ProductService.deleteProduct(testUser.id, product.id);

      const outcomes = await prisma.outcome.findMany({
        where: { productId: product.id },
      });

      expect(outcomes).toHaveLength(0);
    });

    it('should cascade delete related licenses', async () => {
      const product = await TestFactory.createProduct({ name: 'With Licenses' });
      await TestFactory.createLicense(product.id, { name: 'License 1' });

      await ProductService.deleteProduct(testUser.id, product.id);

      const licenses = await prisma.license.findMany({
        where: { productId: product.id },
      });

      expect(licenses).toHaveLength(0);
    });

    it('should remove product from solutions', async () => {
      const product = await TestFactory.createProduct({ name: 'In Solution' });
      const solution = await TestFactory.createSolution({ name: 'Parent Solution' });

      await prisma.solutionProduct.create({
        data: {
          solutionId: solution.id,
          productId: product.id,
          order: 1,
        },
      });

      await ProductService.deleteProduct(testUser.id, product.id);

      const solutionProducts = await prisma.solutionProduct.findMany({
        where: { productId: product.id },
      });

      expect(solutionProducts).toHaveLength(0);
    });
  });
});

