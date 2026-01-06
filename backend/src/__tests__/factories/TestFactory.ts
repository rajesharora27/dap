/**
 * Test Data Factory
 * 
 * Provides factory functions for creating test data using Faker.
 * All factories use the test database and include safety checks.
 * 
 * @module tests/factories/TestFactory
 * 
 * @example
 * ```typescript
 * import { TestFactory } from './factories/TestFactory';
 * 
 * // Create test data
 * const user = await TestFactory.createUser({ role: 'ADMIN' });
 * const product = await TestFactory.createProduct({ name: 'Test Product' });
 * const customer = await TestFactory.createCustomer();
 * 
 * // Clean up after tests
 * await TestFactory.cleanup();
 * ```
 */

import { faker } from '@faker-js/faker';
import { PrismaClient, ResourceType, PermissionLevel, SystemRole, LicenseLevel, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

// IMPORTANT: Explicitly configure to use test database to prevent wiping development data
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public'
    }
  }
});

/**
 * User creation options
 */
interface CreateUserOptions {
  email?: string;
  username?: string;
  name?: string;
  password?: string;
  role?: SystemRole;
  isAdmin?: boolean;
  isActive?: boolean;
  mustChangePassword?: boolean;
}

/**
 * Product creation options
 */
interface CreateProductOptions {
  name?: string;
  description?: string;
  customAttrs?: Prisma.InputJsonValue;
  resources?: Prisma.InputJsonValue;
}

/**
 * Solution creation options
 */
interface CreateSolutionOptions {
  name?: string;
  description?: string;
  customAttrs?: Prisma.InputJsonValue;
  resources?: Prisma.InputJsonValue;
}

/**
 * Customer creation options
 */
interface CreateCustomerOptions {
  name?: string;
  description?: string;
}

/**
 * Task creation options
 */
interface CreateTaskOptions {
  name?: string;
  description?: string;
  estMinutes?: number;
  weight?: number;
  sequenceNumber?: number;
  licenseLevel?: LicenseLevel;
  howToDoc?: string[];
  howToVideo?: string[];
}

/**
 * Permission creation options
 */
interface CreatePermissionOptions {
  resourceType?: ResourceType;
  resourceId?: string | null;
  permissionLevel?: PermissionLevel;
}

/**
 * Test Factory Class
 * 
 * Provides static methods for creating test data with sensible defaults.
 * All data is created in the test database.
 */
export class TestFactory {
  /**
   * Create a test user with optional overrides
   * 
   * @param overrides - Optional field overrides
   * @returns Created user record
   */
  static async createUser(overrides: CreateUserOptions = {}) {
    const password = overrides.password || 'Test123!@#';
    const hashedPassword = await bcrypt.hash(password, 10);

    return prisma.user.create({
      data: {
        email: overrides.email || faker.internet.email(),
        username: overrides.username || faker.internet.username(),
        name: overrides.name || faker.person.fullName(),
        password: hashedPassword,
        role: overrides.role || SystemRole.USER,
        isAdmin: overrides.isAdmin || false,
        isActive: overrides.isActive !== undefined ? overrides.isActive : true,
        mustChangePassword: overrides.mustChangePassword || false,
      }
    });
  }

  /**
   * Create an admin user for testing
   * 
   * @param overrides - Optional field overrides
   * @returns Created admin user record
   */
  static async createAdminUser(overrides: CreateUserOptions = {}) {
    return this.createUser({
      role: SystemRole.ADMIN,
      isAdmin: true,
      ...overrides,
    });
  }

  /**
   * Create a test product
   * 
   * @param overrides - Optional field overrides
   * @returns Created product record
   */
  static async createProduct(overrides: CreateProductOptions = {}) {
    return prisma.product.create({
      data: {
        name: overrides.name || faker.commerce.productName(),
        description: overrides.description || faker.commerce.productDescription(),
        customAttrs: overrides.customAttrs || {},
        resources: overrides.resources || [],
      }
    });
  }

  /**
   * Create a test task for a product
   * 
   * @param productId - Product to attach task to
   * @param overrides - Optional field overrides
   * @returns Created task record
   */
  static async createTask(productId: string, overrides: CreateTaskOptions = {}) {
    const sequenceNumber = overrides.sequenceNumber || Math.floor(Math.random() * 1000);

    return prisma.task.create({
      data: {
        product: { connect: { id: productId } },
        name: overrides.name || faker.lorem.words(3),
        description: overrides.description || faker.lorem.sentence(),
        estMinutes: overrides.estMinutes || faker.number.int({ min: 15, max: 480 }),
        weight: overrides.weight || faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
        sequenceNumber,
        licenseLevel: overrides.licenseLevel || LicenseLevel.ESSENTIAL,
        howToDoc: overrides.howToDoc || [],
        howToVideo: overrides.howToVideo || [],
      }
    });
  }

  /**
   * Create a test customer
   * 
   * @param overrides - Optional field overrides
   * @returns Created customer record
   */
  static async createCustomer(overrides: CreateCustomerOptions = {}) {
    return prisma.customer.create({
      data: {
        name: overrides.name || faker.company.name(),
        description: overrides.description || faker.company.catchPhrase(),
      }
    });
  }

  /**
   * Create a test license for a product
   * 
   * @param productId - Product to attach license to
   * @param overrides - Optional field overrides
   * @returns Created license record
   */
  static async createLicense(productId: string, overrides: Record<string, any> = {}) {
    return prisma.license.create({
      data: {
        productId,
        name: (overrides.name as string) || faker.commerce.productName(),
        description: (overrides.description as string) || faker.lorem.sentence(),
        level: (overrides.level as number) || 1,
        isActive: overrides.isActive !== undefined ? (overrides.isActive as boolean) : true,
      }
    });
  }

  /**
   * Create a test outcome for a product
   * 
   * @param productId - Product to attach outcome to
   * @param overrides - Optional field overrides
   * @returns Created outcome record
   */
  static async createOutcome(productId: string, overrides: Record<string, any> = {}) {
    return prisma.outcome.create({
      data: {
        productId,
        name: (overrides.name as string) || faker.lorem.words(2),
        description: (overrides.description as string) || faker.lorem.sentence(),
      }
    });
  }

  /**
   * Create a test solution
   * 
   * @param overrides - Optional field overrides
   * @returns Created solution record
   */
  static async createSolution(overrides: CreateSolutionOptions = {}) {
    return prisma.solution.create({
      data: {
        name: overrides.name || faker.commerce.productName(),
        description: overrides.description || faker.commerce.productDescription(),
        customAttrs: overrides.customAttrs || {},
        resources: overrides.resources || [],
      }
    });
  }

  /**
   * Create a test release for a product
   * 
   * @param productId - Product to attach release to
   * @param overrides - Optional field overrides
   * @returns Created release record
   */
  static async createRelease(productId: string, overrides: Record<string, any> = {}) {
    return prisma.release.create({
      data: {
        productId,
        name: (overrides.name as string) || `v${faker.system.semver()}`,
        description: (overrides.description as string) || faker.lorem.sentence(),
        level: (overrides.level as number) || faker.number.int({ min: 1, max: 5 }),
      }
    });
  }

  /**
   * Create a test product tag
   * 
   * @param productId - Product to attach tag to
   * @param overrides - Optional field overrides
   * @returns Created tag record
   */
  static async createProductTag(productId: string, overrides: Record<string, any> = {}) {
    return prisma.productTag.create({
      data: {
        productId,
        name: (overrides.name as string) || faker.commerce.productMaterial(),
        color: (overrides.color as string) || faker.internet.color(),
        displayOrder: (overrides.displayOrder as number) || faker.number.int({ min: 0, max: 100 }),
      }
    });
  }

  /**
   * Create a test solution tag
   * 
   * @param solutionId - Solution to attach tag to
   * @param overrides - Optional field overrides
   * @returns Created tag record
   */
  static async createSolutionTag(solutionId: string, overrides: Record<string, any> = {}) {
    return prisma.solutionTag.create({
      data: {
        solutionId,
        name: (overrides.name as string) || faker.commerce.productMaterial(),
        color: (overrides.color as string) || faker.internet.color(),
        displayOrder: (overrides.displayOrder as number) || faker.number.int({ min: 0, max: 100 }),
      }
    });
  }

  /**
   * Create a permission for a user
   * 
   * @param userId - User to grant permission to
   * @param overrides - Permission options
   * @returns Created permission record
   */
  static async createPermission(userId: string, overrides: CreatePermissionOptions = {}) {
    return prisma.permission.create({
      data: {
        userId,
        resourceType: overrides.resourceType || ResourceType.PRODUCT,
        resourceId: overrides.resourceId !== undefined ? overrides.resourceId : null,
        permissionLevel: overrides.permissionLevel || PermissionLevel.READ,
      }
    });
  }

  /**
   * Link a product to a solution
   * 
   * @param solutionId - Solution ID
   * @param productId - Product ID
   * @param order - Display order
   * @returns Created link record
   */
  static async linkProductToSolution(solutionId: string, productId: string, order: number = 1) {
    return prisma.solutionProduct.create({
      data: {
        solutionId,
        productId,
        order,
      }
    });
  }

  /**
   * Assign a product to a customer
   * 
   * @param customerId - Customer ID
   * @param productId - Product ID
   * @param name - Assignment name (e.g. "Primary Implementation")
   * @returns Created assignment record
   */
  static async assignProductToCustomer(customerId: string, productId: string, name: string = 'Test Assignment') {
    return prisma.customerProduct.create({
      data: {
        customerId,
        productId,
        name,
      }
    });
  }

  /**
   * Assign a solution to a customer
   * 
   * @param customerId - Customer ID
   * @param solutionId - Solution ID
   * @param name - Assignment name
   * @returns Created assignment record
   */
  static async assignSolutionToCustomer(customerId: string, solutionId: string, name: string = 'Test Solution Assignment') {
    return prisma.customerSolution.create({
      data: {
        customerId,
        solutionId,
        name,
      }
    });
  }

  /**
   * Create a complete test scenario with user, product, solution, and customer
   * 
   * @returns Object containing all created records
   */
  static async createCompleteScenario() {
    const user = await this.createAdminUser();
    const product = await this.createProduct();
    const solution = await this.createSolution();
    const customer = await this.createCustomer();

    // Create related data
    const task = await this.createTask(product.id);
    const outcome = await this.createOutcome(product.id);
    const license = await this.createLicense(product.id);
    const release = await this.createRelease(product.id);
    const tag = await this.createProductTag(product.id);

    // Create relationships
    await this.linkProductToSolution(solution.id, product.id);
    await this.assignProductToCustomer(customer.id, product.id);
    await this.assignSolutionToCustomer(customer.id, solution.id);

    return {
      user,
      product,
      solution,
      customer,
      task,
      outcome,
      license,
      release,
      tag,
    };
  }

  /**
   * Clean up all test data
   * 
   * SAFETY: Only runs in test database to prevent wiping development data
   */
  static async cleanup() {
    // CRITICAL SAFETY CHECK: Prevent wiping development database
    const dbUrl = process.env.DATABASE_URL || '';
    const isDapTest = dbUrl.includes('dap_test');
    const isTest = process.env.NODE_ENV === 'test' || process.env.CI === 'true';

    if (!isDapTest && !isTest) {
      console.error('❌ SAFETY CHECK FAILED: cleanup() can only run in test database!');
      console.error(`   Current DATABASE_URL: ${dbUrl}`);
      console.error(`   NODE_ENV: ${process.env.NODE_ENV}`);
      console.error(`   CI: ${process.env.CI}`);
      throw new Error('Refusing to run cleanup() outside of test environment');
    }

    // Tables to clean in order (respecting foreign key constraints)
    const tablenames = [
      'CustomerSolutionTaskTag',
      'CustomerSolutionTag',
      'CustomerTaskTag',
      'CustomerProductTag',
      'SolutionTaskTag',
      'TaskTag',
      'SolutionTag',
      'ProductTag',
      'CustomerSolutionTask',
      'SolutionAdoptionProduct',
      'SolutionAdoptionPlan',
      'CustomerTask',
      'AdoptionPlan',
      'CustomerProduct',
      'CustomerSolution',
      'Customer',
      'Telemetry',
      'TelemetryValue',
      'TaskOutcome',
      'Outcome',
      'Task',
      'License',
      'Release',
      'SolutionProduct',
      'SolutionTaskOrder',
      'Product',
      'Solution',
      'Permission',
      'Session',
      'UserRole',
      'Role',
      'User'
    ];

    console.log('⚠️  TestFactory.cleanup(): Cleaning all test data');

    for (const tablename of tablenames) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      } catch (error) {
        // Table might not exist or be empty, which is fine
        console.debug(`Note: Could not truncate ${tablename}`);
      }
    }
  }

  /**
   * Disconnect Prisma client
   * Call this after all tests are done
   */
  static async disconnect() {
    await prisma.$disconnect();
  }
}

export { prisma };
