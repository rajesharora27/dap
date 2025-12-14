import { faker } from '@faker-js/faker';
import { PrismaClient, SystemRole, LicenseLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

// IMPORTANT: Explicitly configure to use test database to prevent wiping development data
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public'
        }
    }
});

export class TestFactory {
    /**
     * Create a test user
     */
    static async createUser(overrides: any = {}) {
        const password = overrides.password || 'Test123!@#';
        const hashedPassword = await bcrypt.hash(password, 10);

        return prisma.user.create({
            data: {
                email: overrides.email || faker.internet.email(),
                username: overrides.username || faker.internet.userName(),
                name: overrides.name || faker.person.fullName(),
                password: hashedPassword,
                role: overrides.role || 'USER',
                isAdmin: overrides.isAdmin || false,
                isActive: overrides.isActive !== undefined ? overrides.isActive : true,
                mustChangePassword: false,
                ...overrides
            }
        });
    }

    /**
     * Create a test product
     */
    static async createProduct(overrides: any = {}) {
        return prisma.product.create({
            data: {
                name: overrides.name || faker.commerce.productName(),
                description: overrides.description || faker.commerce.productDescription(),
                customAttrs: overrides.customAttrs || {},
                ...overrides
            }
        });
    }

    /**
     * Create a test task
     */
    static async createTask(productId: string, overrides: any = {}) {
        const sequenceNumber = overrides.sequenceNumber || Math.floor(Math.random() * 1000);

        return prisma.task.create({
            data: {
                productId,
                name: overrides.name || faker.lorem.words(3),
                description: overrides.description || faker.lorem.sentence(),
                estMinutes: overrides.estMinutes || faker.number.int({ min: 15, max: 480 }),
                weight: overrides.weight || faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
                sequenceNumber,
                licenseLevel: overrides.licenseLevel || 'ESSENTIAL',
                howToDoc: overrides.howToDoc || [],
                howToVideo: overrides.howToVideo || [],
                ...overrides
            }
        });
    }

    /**
     * Create a test customer
     */
    static async createCustomer(overrides: any = {}) {
        return prisma.customer.create({
            data: {
                name: overrides.name || faker.company.name(),
                description: overrides.description || faker.company.catchPhrase(),
                ...overrides
            }
        });
    }

    /**
     * Create a test license
     */
    static async createLicense(productId: string, overrides: any = {}) {
        return prisma.license.create({
            data: {
                productId,
                name: overrides.name || faker.commerce.productName(),
                description: overrides.description || faker.lorem.sentence(),
                level: overrides.level || 1,
                isActive: overrides.isActive !== undefined ? overrides.isActive : true,
                ...overrides
            }
        });
    }

    /**
     * Create a test outcome
     */
    static async createOutcome(productId: string, overrides: any = {}) {
        return prisma.outcome.create({
            data: {
                productId,
                name: overrides.name || faker.lorem.words(2),
                description: overrides.description || faker.lorem.sentence(),
                ...overrides
            }
        });
    }

    /**
     * Create a test solution
     */
    static async createSolution(overrides: any = {}) {
        return prisma.solution.create({
            data: {
                name: overrides.name || faker.commerce.productName(),
                description: overrides.description || faker.commerce.productDescription(),
                customAttrs: overrides.customAttrs || {},
                ...overrides
            }
        });
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

        // IMPORTANT: Do NOT include User, Session, UserRole, Permission tables
        // User credentials and auth data must be preserved even in tests
        // Tests should create their own test users and not affect existing users
        const tablenames = [
            'CustomerTask',
            'AdoptionPlan',
            'CustomerProduct',
            'Customer',
            'TaskOutcome',
            'Outcome',
            'Task',
            'License',
            'Product',
            'Solution'
            // REMOVED: 'Session', 'UserRole', 'Permission', 'User' - DO NOT DELETE USER DATA
        ];

        console.log('⚠️  TestFactory.cleanup(): Cleaning business data only (Users preserved)');

        for (const tablename of tablenames) {
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
            } catch (error) {
                console.error(`Error truncating ${tablename}:`, error);
            }
        }
    }
}

// Install faker if not present
// npm install --save-dev @faker-js/faker
