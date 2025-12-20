import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- DB CHECK START ---');
        const users = await prisma.user.findMany({ take: 5 });
        console.log('Users found:', users.length);
        const admin = users.find(u => u.role === 'ADMIN');
        users.forEach(u => console.log(`- ${u.username} (${u.role}) id: ${u.id}`));

        let sessions = await prisma.session.findMany({
            take: 5,
            include: { user: true }
        });

        if (sessions.length === 0 && admin) {
            console.log('No sessions found, creating one for admin...');
            const session = await prisma.session.create({
                data: {
                    userId: admin.id,
                    expiresAt: new Date(Date.now() + 3600000)
                },
                include: { user: true }
            });
            sessions = [session];
        }

        console.log('Sessions found:', sessions.length);
        sessions.forEach(s => console.log(`- ${s.id} (user: ${s.user.username}, userId: ${s.userId})`));

        const customers = await prisma.customer.findMany({ take: 5 });
        console.log('Customers found:', customers.length);

        console.log('--- DB CHECK END ---');
    } catch (err: any) {
        console.error('❌ DB CHECK ERROR:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
