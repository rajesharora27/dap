import { PrismaClient } from '@prisma/client';
import { seedDev } from '../src/seed-dev';

const prisma = new PrismaClient();

async function resetDevDb() {
  console.log('🗑️  Resetting development database...');
  console.log('ℹ️  NOTE: User table is PRESERVED to protect credentials');
  try {
    // IMPORTANT: Do NOT truncate User, UserRole, Permission, RolePermission tables
    // User credentials must be preserved across resets
    // See: https://github.com/rajesharora27/dap - User data protection policy

    // Only reset business data tables, NOT auth/user tables
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Customer" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Product" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Solution" CASCADE');

    await seedDev();
    console.log('✅ Development database reset complete (Users preserved)');
  } catch (error) {
    console.error('❌ Failed to reset development database:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

resetDevDb();

