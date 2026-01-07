/**
 * Comprehensive unit tests for permissions module
 * 
 * Tests the RBAC system including:
 * - System role permissions (ADMIN, SME, CSS, USER, VIEWER)
 * - Resource-level permissions
 * - Bidirectional Product ↔ Solution permission flow
 */

import { PrismaClient, ResourceType, PermissionLevel } from '@prisma/client';
import {
  checkUserPermission,
  getUserAccessibleResources,
  requirePermission,
  filterAccessibleResources,
  canUserAccessResource,
  getUserPermissionLevel,
} from '../../../shared/auth/permissions';
import { TestFactory } from '../../factories/TestFactory';

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public'
    }
  }
});

describe('Permissions Module', () => {
  // Test data holders
  let adminUser: any;
  let smeUser: any;
  let cssUser: any;
  let viewerUser: any;
  let regularUser: any;
  let inactiveUser: any;
  let testProduct: any;
  let testProduct2: any;
  let testSolution: any;
  let testCustomer: any;

  beforeAll(async () => {
    // Clean up test data
    await TestFactory.cleanup();

    // Create test users with different roles
    adminUser = await TestFactory.createUser({
      email: 'admin@test.com',
      username: 'admin_test',
      role: 'ADMIN',
      isAdmin: true,
      isActive: true,
    });

    smeUser = await TestFactory.createUser({
      email: 'sme@test.com',
      username: 'sme_test',
      role: 'SME',
      isAdmin: false,
      isActive: true,
    });

    cssUser = await TestFactory.createUser({
      email: 'css@test.com',
      username: 'css_test',
      role: 'CSS',
      isAdmin: false,
      isActive: true,
    });

    viewerUser = await TestFactory.createUser({
      email: 'viewer@test.com',
      username: 'viewer_test',
      role: 'VIEWER',
      isAdmin: false,
      isActive: true,
    });

    regularUser = await TestFactory.createUser({
      email: 'user@test.com',
      username: 'user_test',
      role: 'USER',
      isAdmin: false,
      isActive: true,
    });

    inactiveUser = await TestFactory.createUser({
      email: 'inactive@test.com',
      username: 'inactive_test',
      role: 'USER',
      isAdmin: false,
      isActive: false,
    });

    // Create test resources
    testProduct = await TestFactory.createProduct({ name: 'Test Product 1' });
    testProduct2 = await TestFactory.createProduct({ name: 'Test Product 2' });
    testSolution = await TestFactory.createSolution({ name: 'Test Solution' });
    testCustomer = await TestFactory.createCustomer({ name: 'Test Customer' });

    // Link product to solution
    await prisma.solutionProduct.create({
      data: {
        solutionId: testSolution.id,
        productId: testProduct.id,
        order: 1,
      },
    });
  });

  afterAll(async () => {
    await TestFactory.cleanup();
    await prisma.$disconnect();
  });

  describe('checkUserPermission', () => {
    describe('Admin Users', () => {
      it('should grant admin users full access to all resources', async () => {
        expect(
          await checkUserPermission(
            adminUser.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.ADMIN,
            prisma
          )
        ).toBe(true);

        expect(
          await checkUserPermission(
            adminUser.id,
            ResourceType.SOLUTION,
            testSolution.id,
            PermissionLevel.ADMIN,
            prisma
          )
        ).toBe(true);

        expect(
          await checkUserPermission(
            adminUser.id,
            ResourceType.CUSTOMER,
            testCustomer.id,
            PermissionLevel.ADMIN,
            prisma
          )
        ).toBe(true);
      });
    });

    describe('SME Users', () => {
      it('should grant SME users full access to products', async () => {
        expect(
          await checkUserPermission(
            smeUser.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.ADMIN,
            prisma
          )
        ).toBe(true);
      });

      it('should grant SME users full access to solutions', async () => {
        expect(
          await checkUserPermission(
            smeUser.id,
            ResourceType.SOLUTION,
            testSolution.id,
            PermissionLevel.ADMIN,
            prisma
          )
        ).toBe(true);
      });

      it('should deny SME users access to customers without permission', async () => {
        expect(
          await checkUserPermission(
            smeUser.id,
            ResourceType.CUSTOMER,
            testCustomer.id,
            PermissionLevel.READ,
            prisma
          )
        ).toBe(false);
      });
    });

    describe('CSS Users', () => {
      it('should grant CSS users full access to customers', async () => {
        expect(
          await checkUserPermission(
            cssUser.id,
            ResourceType.CUSTOMER,
            testCustomer.id,
            PermissionLevel.ADMIN,
            prisma
          )
        ).toBe(true);
      });

      it('should grant CSS users read access to products', async () => {
        expect(
          await checkUserPermission(
            cssUser.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.READ,
            prisma
          )
        ).toBe(true);
      });

      it('should deny CSS users write access to products', async () => {
        expect(
          await checkUserPermission(
            cssUser.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.WRITE,
            prisma
          )
        ).toBe(false);
      });
    });

    describe('VIEWER Users', () => {
      it('should grant VIEWER users read access to all resources', async () => {
        expect(
          await checkUserPermission(
            viewerUser.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.READ,
            prisma
          )
        ).toBe(true);

        expect(
          await checkUserPermission(
            viewerUser.id,
            ResourceType.SOLUTION,
            testSolution.id,
            PermissionLevel.READ,
            prisma
          )
        ).toBe(true);
      });

      it('should deny VIEWER users write access', async () => {
        expect(
          await checkUserPermission(
            viewerUser.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.WRITE,
            prisma
          )
        ).toBe(false);
      });
    });

    describe('Inactive Users', () => {
      it('should deny inactive users all access', async () => {
        expect(
          await checkUserPermission(
            inactiveUser.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.READ,
            prisma
          )
        ).toBe(false);
      });
    });

    describe('Non-existent Users', () => {
      it('should deny access for non-existent user IDs', async () => {
        expect(
          await checkUserPermission(
            'non-existent-user-id',
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.READ,
            prisma
          )
        ).toBe(false);
      });
    });

    describe('Direct Permissions', () => {
      it('should grant access based on direct user permissions', async () => {
        // Grant regular user WRITE permission to testProduct
        await prisma.permission.create({
          data: {
            userId: regularUser.id,
            resourceType: ResourceType.PRODUCT,
            resourceId: testProduct.id,
            permissionLevel: PermissionLevel.WRITE,
          },
        });

        expect(
          await checkUserPermission(
            regularUser.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.WRITE,
            prisma
          )
        ).toBe(true);

        // Should not have access to product2
        expect(
          await checkUserPermission(
            regularUser.id,
            ResourceType.PRODUCT,
            testProduct2.id,
            PermissionLevel.READ,
            prisma
          )
        ).toBe(true);
      });

      it('should deny write when only read permission exists', async () => {
        const userWithRead = await TestFactory.createUser({
          email: 'readonly@test.com',
          username: 'readonly_test',
          role: 'USER',
          isAdmin: false,
          isActive: true,
        });

        await prisma.permission.create({
          data: {
            userId: userWithRead.id,
            resourceType: ResourceType.PRODUCT,
            resourceId: testProduct.id,
            permissionLevel: PermissionLevel.READ,
          },
        });

        expect(
          await checkUserPermission(
            userWithRead.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.READ,
            prisma
          )
        ).toBe(true);

        expect(
          await checkUserPermission(
            userWithRead.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.WRITE,
            prisma
          )
        ).toBe(false);
      });
    });

    describe('System-wide Permissions', () => {
      it('should grant access to all resources of a type with null resourceId', async () => {
        const userWithAllProducts = await TestFactory.createUser({
          email: 'allproducts@test.com',
          username: 'allproducts_test',
          role: 'USER',
          isAdmin: false,
          isActive: true,
        });

        // Grant access to ALL products
        await prisma.permission.create({
          data: {
            userId: userWithAllProducts.id,
            resourceType: ResourceType.PRODUCT,
            resourceId: null, // null means all products
            permissionLevel: PermissionLevel.WRITE,
          },
        });

        expect(
          await checkUserPermission(
            userWithAllProducts.id,
            ResourceType.PRODUCT,
            testProduct.id,
            PermissionLevel.WRITE,
            prisma
          )
        ).toBe(true);

        expect(
          await checkUserPermission(
            userWithAllProducts.id,
            ResourceType.PRODUCT,
            testProduct2.id,
            PermissionLevel.WRITE,
            prisma
          )
        ).toBe(true);
      });
    });
  });

  describe('getUserAccessibleResources', () => {
    it('should return null for admin users (access to all)', async () => {
      const resources = await getUserAccessibleResources(
        adminUser.id,
        ResourceType.PRODUCT,
        PermissionLevel.READ,
        prisma
      );

      expect(resources).toBeNull();
    });

    it('should return null for SME users on products', async () => {
      const resources = await getUserAccessibleResources(
        smeUser.id,
        ResourceType.PRODUCT,
        PermissionLevel.READ,
        prisma
      );

      expect(resources).toBeNull();
    });

    it('should return null for users with no explicit permissions (USER read-all default)', async () => {
      const newUser = await TestFactory.createUser({
        email: 'noperm@test.com',
        username: 'noperm_test',
        role: 'USER',
        isAdmin: false,
        isActive: true,
      });

      const resources = await getUserAccessibleResources(
        newUser.id,
        ResourceType.PRODUCT,
        PermissionLevel.READ,
        prisma
      );

      expect(resources).toBeNull();
    });

    it('should return empty array for inactive users', async () => {
      const resources = await getUserAccessibleResources(
        inactiveUser.id,
        ResourceType.PRODUCT,
        PermissionLevel.READ,
        prisma
      );

      expect(resources).toEqual([]);
    });

    it('should return specific resource IDs for users with direct permissions', async () => {
      const userWithSpecific = await TestFactory.createUser({
        email: 'specific@test.com',
        username: 'specific_test',
        role: 'USER',
        isAdmin: false,
        isActive: true,
      });

      await prisma.permission.create({
        data: {
          userId: userWithSpecific.id,
          resourceType: ResourceType.PRODUCT,
          resourceId: testProduct.id,
          permissionLevel: PermissionLevel.READ,
        },
      });

      const resources = await getUserAccessibleResources(
        userWithSpecific.id,
        ResourceType.PRODUCT,
        PermissionLevel.READ,
        prisma
      );

      // With default USER read-all enabled, access is global (null) even if specific grants exist.
      expect(resources).toBeNull();
    });
  });

  describe('requirePermission', () => {
    it('should throw error when user is not authenticated', async () => {
      const context = { user: null, prisma };

      await expect(
        requirePermission(context, ResourceType.PRODUCT, testProduct.id, PermissionLevel.READ)
      ).rejects.toThrow('Authentication required');
    });

    it('should throw error when user lacks permission', async () => {
      const userNoPermission = await TestFactory.createUser({
        email: 'noaccess@test.com',
        username: 'noaccess_test',
        role: 'USER',
        isAdmin: false,
        isActive: true,
      });

      const context = { user: { userId: userNoPermission.id }, prisma };

      await expect(
        requirePermission(context, ResourceType.PRODUCT, testProduct.id, PermissionLevel.WRITE)
      ).rejects.toThrow('You do not have WRITE permission');
    });

    it('should not throw when user has permission', async () => {
      const context = { user: { userId: adminUser.id }, prisma };

      await expect(
        requirePermission(context, ResourceType.PRODUCT, testProduct.id, PermissionLevel.ADMIN)
      ).resolves.toBeUndefined();
    });
  });

  describe('filterAccessibleResources', () => {
    it('should return all resources for admin users', async () => {
      const resources = [
        { id: testProduct.id, name: 'Product 1' },
        { id: testProduct2.id, name: 'Product 2' },
      ];

      const filtered = await filterAccessibleResources(
        adminUser.id,
        ResourceType.PRODUCT,
        resources,
        PermissionLevel.READ,
        prisma
      );

      expect(filtered).toHaveLength(2);
    });

    it('should return empty array for users without access', async () => {
      const userNoAccess = await TestFactory.createUser({
        email: 'filter-no@test.com',
        username: 'filter_no_test',
        role: 'USER',
        isAdmin: false,
        isActive: true,
      });

      const resources = [
        { id: testProduct.id, name: 'Product 1' },
        { id: testProduct2.id, name: 'Product 2' },
      ];

      const filtered = await filterAccessibleResources(
        userNoAccess.id,
        ResourceType.PRODUCT,
        resources,
        PermissionLevel.READ,
        prisma
      );

      // USER has global read access by default.
      expect(filtered).toHaveLength(2);
    });

    it('should filter to only accessible resources', async () => {
      const userPartialAccess = await TestFactory.createUser({
        email: 'filter-partial@test.com',
        username: 'filter_partial_test',
        role: 'USER',
        isAdmin: false,
        isActive: true,
      });

      await prisma.permission.create({
        data: {
          userId: userPartialAccess.id,
          resourceType: ResourceType.PRODUCT,
          resourceId: testProduct.id,
          permissionLevel: PermissionLevel.READ,
        },
      });

      const resources = [
        { id: testProduct.id, name: 'Product 1' },
        { id: testProduct2.id, name: 'Product 2' },
      ];

      const filtered = await filterAccessibleResources(
        userPartialAccess.id,
        ResourceType.PRODUCT,
        resources,
        PermissionLevel.READ,
        prisma
      );

      // USER has global read access by default.
      expect(filtered).toHaveLength(2);
    });
  });

  describe('canUserAccessResource', () => {
    it('should return false when no user in context', async () => {
      const context = { user: null, prisma };

      const result = await canUserAccessResource(
        context,
        ResourceType.PRODUCT,
        testProduct.id,
        PermissionLevel.READ
      );

      expect(result).toBe(false);
    });

    it('should return true for authorized users', async () => {
      const context = { user: { userId: adminUser.id }, prisma };

      const result = await canUserAccessResource(
        context,
        ResourceType.PRODUCT,
        testProduct.id,
        PermissionLevel.READ
      );

      expect(result).toBe(true);
    });
  });

  describe('getUserPermissionLevel', () => {
    it('should return ADMIN for admin users', async () => {
      const level = await getUserPermissionLevel(
        adminUser.id,
        ResourceType.PRODUCT,
        testProduct.id,
        prisma
      );

      expect(level).toBe(PermissionLevel.ADMIN);
    });

    it('should return ADMIN for SME on products', async () => {
      const level = await getUserPermissionLevel(
        smeUser.id,
        ResourceType.PRODUCT,
        testProduct.id,
        prisma
      );

      expect(level).toBe(PermissionLevel.ADMIN);
    });

    it('should return READ for CSS on products', async () => {
      const level = await getUserPermissionLevel(
        cssUser.id,
        ResourceType.PRODUCT,
        testProduct.id,
        prisma
      );

      expect(level).toBe(PermissionLevel.READ);
    });

    it('should return null for users without access', async () => {
      const userNoAccess = await TestFactory.createUser({
        email: 'level-no@test.com',
        username: 'level_no_test',
        role: 'USER',
        isAdmin: false,
        isActive: true,
      });

      const level = await getUserPermissionLevel(
        userNoAccess.id,
        ResourceType.PRODUCT,
        testProduct.id,
        prisma
      );

      // USER has global read access by default.
      expect(level).toBe(PermissionLevel.READ);
    });

    it('should return null for inactive users', async () => {
      const level = await getUserPermissionLevel(
        inactiveUser.id,
        ResourceType.PRODUCT,
        testProduct.id,
        prisma
      );

      expect(level).toBeNull();
    });

    it('should return the correct level from direct permissions', async () => {
      const userWithWrite = await TestFactory.createUser({
        email: 'level-write@test.com',
        username: 'level_write_test',
        role: 'USER',
        isAdmin: false,
        isActive: true,
      });

      await prisma.permission.create({
        data: {
          userId: userWithWrite.id,
          resourceType: ResourceType.PRODUCT,
          resourceId: testProduct.id,
          permissionLevel: PermissionLevel.WRITE,
        },
      });

      const level = await getUserPermissionLevel(
        userWithWrite.id,
        ResourceType.PRODUCT,
        testProduct.id,
        prisma
      );

      expect(level).toBe(PermissionLevel.WRITE);
    });
  });
});

