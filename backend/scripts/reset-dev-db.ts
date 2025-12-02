import { PrismaClient } from '@prisma/client';
import { seedDev } from '../src/seed-dev';

const prisma = new PrismaClient();

async function resetDevDb() {
  console.log('🗑️  Resetting development database...');
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Permission" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "RolePermission" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "UserRole" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Customer" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Product" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Solution" CASCADE');

    await seedDev();
    console.log('✅ Development database reset complete');
  } catch (error) {
    console.error('❌ Failed to reset development database:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

resetDevDb();

