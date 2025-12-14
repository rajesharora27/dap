// Test setup file - runs before all tests
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Force tests to use the isolated test database by default
const DEFAULT_TEST_DB = 'postgresql://postgres:postgres@localhost:5432/dap_test?schema=public';
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = DEFAULT_TEST_DB;
}

// Safety guard: never allow tests to run against a non-test database
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.includes('dap_test')) {
    // Allow override only when explicitly acknowledged via env flag
    if (process.env.ALLOW_NON_TEST_DB !== 'true') {
        throw new Error(
            `Refusing to run tests on non-test database. DATABASE_URL="${dbUrl}". ` +
            `Set ALLOW_NON_TEST_DB=true if you really intend to do this (not recommended).`
        );
    }
}

// Mock Prisma for tests
export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || DEFAULT_TEST_DB
        }
    }
});

/**
 * Ensure default admin credentials exist in the test database.
 * This protects against accidental credential loss during test runs.
 */
async function ensureAdminUser() {
    const adminEmail = 'admin@example.com';
    const adminUsername = 'admin';
    const existing = await prisma.user.findFirst({
        where: { OR: [{ email: adminEmail }, { username: adminUsername }] }
    });

    if (!existing) {
        const passwordHash = await bcrypt.hash('DAP123!!!', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                username: adminUsername,
                name: 'Admin',
                password: passwordHash,
                role: 'ADMIN',
                isAdmin: true,
                isActive: true,
                mustChangePassword: false
            }
        });
        // eslint-disable-next-line no-console
        console.log('[Tests] Created default admin user for test DB');
    }
}

beforeAll(async () => {
    await ensureAdminUser();
});

// Clean up after all tests
afterAll(async () => {
    await prisma.$disconnect();
});

// Set longer timeout for integration tests
jest.setTimeout(10000);
