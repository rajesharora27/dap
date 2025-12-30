/**
 * Unit tests for CustomerService
 */

import { PrismaClient } from '@prisma/client';
import { CustomerService } from '../../../modules/customer/customer.service';
import { TestFactory } from '../../factories/TestFactory';

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public'
    }
  }
});

describe('CustomerService', () => {
  let testUser: any;

  beforeAll(async () => {
    await TestFactory.cleanup();
    testUser = await TestFactory.createUser({
      email: 'customerservice@test.com',
      username: 'customerservice_test',
      role: 'ADMIN',
      isAdmin: true,
      isActive: true,
    });
  });

  afterAll(async () => {
    await TestFactory.cleanup();
    await prisma.$disconnect();
  });

  describe('createCustomer', () => {
    it('should create a customer with name', async () => {
      const customer = await CustomerService.createCustomer(testUser.id, {
        name: 'Test Customer',
      });

      expect(customer).toBeDefined();
      expect(customer.name).toBe('Test Customer');
      expect(customer.id).toBeDefined();
    });

    it('should create a customer with name and description', async () => {
      const customer = await CustomerService.createCustomer(testUser.id, {
        name: 'Customer with Desc',
        description: 'A detailed description',
      });

      expect(customer.name).toBe('Customer with Desc');
      expect(customer.description).toBe('A detailed description');
    });
  });

  describe('updateCustomer', () => {
    it('should update customer name', async () => {
      const customer = await TestFactory.createCustomer({ name: 'Original Customer' });

      const updated = await CustomerService.updateCustomer(testUser.id, customer.id, {
        name: 'Updated Customer',
      });

      expect(updated.name).toBe('Updated Customer');
    });

    it('should update customer description', async () => {
      const customer = await TestFactory.createCustomer({
        name: 'Desc Customer',
        description: 'Original description',
      });

      const updated = await CustomerService.updateCustomer(testUser.id, customer.id, {
        description: 'New description',
      });

      expect(updated.description).toBe('New description');
    });

    it('should preserve unchanged fields', async () => {
      const customer = await TestFactory.createCustomer({
        name: 'Preserve Customer',
        description: 'Keep this',
      });

      const updated = await CustomerService.updateCustomer(testUser.id, customer.id, {
        name: 'New Name',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('Keep this');
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer and return true', async () => {
      const customer = await TestFactory.createCustomer({ name: 'To Delete Customer' });

      const result = await CustomerService.deleteCustomer(testUser.id, customer.id);

      expect(result).toBe(true);

      const deleted = await prisma.customer.findUnique({
        where: { id: customer.id },
      });

      expect(deleted).toBeNull();
    });
  });

  describe('addProductToCustomer', () => {
    it('should add a product to a customer', async () => {
      const customer = await TestFactory.createCustomer({ name: 'Product Customer' });
      const product = await TestFactory.createProduct({ name: 'Customer Product' });

      const result = await CustomerService.addProductToCustomer(
        testUser.id,
        customer.id,
        product.id
      );

      expect(result).toBe(true);

      const link = await prisma.customerProduct.findUnique({
        where: {
          customerId_productId: {
            customerId: customer.id,
            productId: product.id,
          },
        },
      });

      expect(link).toBeDefined();
    });

    it('should handle idempotent adds (upsert)', async () => {
      const customer = await TestFactory.createCustomer({ name: 'Idempotent Customer' });
      const product = await TestFactory.createProduct({ name: 'Idempotent Product' });

      // Add twice
      await CustomerService.addProductToCustomer(testUser.id, customer.id, product.id);
      await CustomerService.addProductToCustomer(testUser.id, customer.id, product.id);

      const links = await prisma.customerProduct.findMany({
        where: { customerId: customer.id, productId: product.id },
      });

      expect(links).toHaveLength(1);
    });
  });

  describe('removeProductFromCustomer', () => {
    it('should remove a product from a customer', async () => {
      const customer = await TestFactory.createCustomer({ name: 'Remove Product Customer' });
      const product = await TestFactory.createProduct({ name: 'Remove Product' });

      await prisma.customerProduct.create({
        data: {
          customerId: customer.id,
          productId: product.id,
        },
      });

      const result = await CustomerService.removeProductFromCustomer(
        testUser.id,
        customer.id,
        product.id
      );

      expect(result).toBe(true);

      const link = await prisma.customerProduct.findUnique({
        where: {
          customerId_productId: {
            customerId: customer.id,
            productId: product.id,
          },
        },
      });

      expect(link).toBeNull();
    });
  });

  describe('addSolutionToCustomer', () => {
    it('should add a solution to a customer', async () => {
      const customer = await TestFactory.createCustomer({ name: 'Solution Customer' });
      const solution = await TestFactory.createSolution({ name: 'Customer Solution' });

      const result = await CustomerService.addSolutionToCustomer(
        testUser.id,
        customer.id,
        solution.id
      );

      expect(result).toBe(true);

      const link = await prisma.customerSolution.findUnique({
        where: {
          customerId_solutionId: {
            customerId: customer.id,
            solutionId: solution.id,
          },
        },
      });

      expect(link).toBeDefined();
    });

    it('should handle idempotent adds (upsert)', async () => {
      const customer = await TestFactory.createCustomer({ name: 'Idempotent Sol Customer' });
      const solution = await TestFactory.createSolution({ name: 'Idempotent Solution' });

      // Add twice
      await CustomerService.addSolutionToCustomer(testUser.id, customer.id, solution.id);
      await CustomerService.addSolutionToCustomer(testUser.id, customer.id, solution.id);

      const links = await prisma.customerSolution.findMany({
        where: { customerId: customer.id, solutionId: solution.id },
      });

      expect(links).toHaveLength(1);
    });
  });

  describe('removeSolutionFromCustomer', () => {
    it('should remove a solution from a customer', async () => {
      const customer = await TestFactory.createCustomer({ name: 'Remove Sol Customer' });
      const solution = await TestFactory.createSolution({ name: 'Remove Solution' });

      await prisma.customerSolution.create({
        data: {
          customerId: customer.id,
          solutionId: solution.id,
        },
      });

      const result = await CustomerService.removeSolutionFromCustomer(
        testUser.id,
        customer.id,
        solution.id
      );

      expect(result).toBe(true);

      const link = await prisma.customerSolution.findUnique({
        where: {
          customerId_solutionId: {
            customerId: customer.id,
            solutionId: solution.id,
          },
        },
      });

      expect(link).toBeNull();
    });
  });
});

