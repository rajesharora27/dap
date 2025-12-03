import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDev() {
  console.log('🌱 Seeding development database...');
  const start = Date.now();

  try {
    await prisma.$transaction(async (tx) => {
      const adminPassword = '$2a$10$7uW1Nqbn0N6NtqZVNudZLebpXCMV2.fAnCmvY/fx/n6PvJEa3TBcW'; // "admin"

      await tx.user.upsert({
        where: { username: 'admin' },
        update: {
          password: adminPassword,
          isAdmin: true,
          role: 'ADMIN'
        },
        create: {
          username: 'admin',
          email: 'admin@dev.local',
          name: 'Dev Admin',
          password: adminPassword,
          role: 'ADMIN',
          isAdmin: true,
          mustChangePassword: false
        }
      });

      const products = await Promise.all([
        tx.product.upsert({
          where: { name: 'Dev Product 1' },
          update: {},
          create: {
            name: 'Dev Product 1',
            description: 'Sample product for dev',
            tasks: {
              create: [
                {
                  name: 'Initial Setup',
                  description: 'Complete initial configuration',
                  estMinutes: 60,
                  weight: 50,
                  sequenceNumber: 1,
                  licenseLevel: 'ESSENTIAL',
                  howToDoc: [],
                  howToVideo: []
                },
                {
                  name: 'Enable Telemetry',
                  description: 'Connect telemetry sources',
                  estMinutes: 45,
                  weight: 50,
                  sequenceNumber: 2,
                  licenseLevel: 'ESSENTIAL',
                  howToDoc: [],
                  howToVideo: []
                }
              ]
            }
          }
        }),
        tx.product.upsert({
          where: { name: 'Dev Product 2' },
          update: {},
          create: {
            name: 'Dev Product 2',
            description: 'Secondary sample',
            tasks: {
              create: [
                {
                  name: 'Configure Policies',
                  description: 'Set up baseline policies',
                  estMinutes: 40,
                  weight: 100,
                  sequenceNumber: 1,
                  licenseLevel: 'ADVANTAGE',
                  howToDoc: [],
                  howToVideo: []
                }
              ]
            }
          }
        })
      ]);

      await tx.customer.upsert({
        where: { name: 'Dev Customer' },
        update: {},
        create: {
          name: 'Dev Customer',
          description: 'Sample customer for development'
        }
      });

      console.log(`✅ Dev seed completed in ${Date.now() - start}ms (Products: ${products.length})`);
    });
  } catch (error) {
    console.error('❌ Dev seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedDev();
}

