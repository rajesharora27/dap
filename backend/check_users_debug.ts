
import { prisma } from './src/context';

async function checkUsers() {
    console.log('Checking users in DB...');
    const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, isAdmin: true } });
    console.log('Users found:', users);
    await prisma.$disconnect();
}

checkUsers().catch(e => console.error(e));
