// Test setup file - runs before all tests
import { PrismaClient } from '@prisma/client';

// Mock Prisma for tests
export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap_test'
        }
    }
});

// Clean up after all tests
afterAll(async () => {
    await prisma.$disconnect();
});

// Set longer timeout for integration tests
jest.setTimeout(10000);
