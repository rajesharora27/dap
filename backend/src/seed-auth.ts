import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'DAP123';

async function seedAuth() {
  console.log('🌱 Seeding authentication data...');

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Hash the default password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Create default admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@dynamicadoptionplans.com',
        password: passwordHash,
        fullName: 'System Administrator',
        isAdmin: true,
        isActive: true,
        mustChangePassword: false, // Admin doesn't need to change default password on first login
        role: 'ADMIN'
      }
    });

    console.log(`✅ Created admin user: ${adminUser.username} (${adminUser.email})`);
    console.log(`   Default password: ${DEFAULT_PASSWORD}`);
    console.log(`   User ID: ${adminUser.id}`);

    // Create audit log for admin creation
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'create_user',
        resourceType: 'user',
        resourceId: adminUser.id,
        details: { message: 'System initialization: Created default admin user' }
      }
    });

    console.log('✅ Authentication seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding authentication data:', error);
    throw error;
  }
}

seedAuth()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

