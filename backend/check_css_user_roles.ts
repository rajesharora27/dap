
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRoles() {
    const user = await prisma.user.findUnique({
        where: { username: 'cssuser' },
        include: {
            userRoles: {
                include: {
                    role: true
                }
            }
        }
    });
    console.log('User Roles:', JSON.stringify(user?.userRoles, null, 2));
}

checkUserRoles()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
