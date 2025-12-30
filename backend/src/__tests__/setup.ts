// Test setup file - runs before all tests
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Force tests to use the isolated test database by default
const DEFAULT_TEST_DB = 'postgresql://rajarora@localhost:5432/dap_test?schema=public';
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

// Mock Prisma for tests - use lazy connection
export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || DEFAULT_TEST_DB
        }
    },
    log: [], // Disable logging in tests
});

/**
 * Ensure default admin credentials exist in the test database.
 * This protects against accidental credential loss during test runs.
 */
async function ensureAdminUser() {
    try {
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
    } catch (error) {
        // If database isn't available, skip admin user creation
        // This allows unit tests that don't need DB to still run
        console.warn('[Tests] Could not ensure admin user (database may not be available)');
    }
}

beforeAll(async () => {
    await ensureAdminUser();
}, 30000); // 30 second timeout for setup

// Clean up after all tests
afterAll(async () => {
    try {
        await prisma.$disconnect();
    } catch (error) {
        // Ignore disconnect errors
    }
}, 10000); // 10 second timeout for teardown

// Set longer timeout for integration tests
jest.setTimeout(30000);
