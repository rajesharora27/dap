
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const userCount = await prisma.user.count();
        const productCount = await prisma.product.count();
        const solutionCount = await prisma.solution.count();
        const customerCount = await prisma.customer.count();
        const taskCount = await prisma.task.count();

        console.log('--- DATABASE COUNTS ---');
        console.log(`Users: ${userCount}`);
        console.log(`Products: ${productCount}`);
        console.log(`Solutions: ${solutionCount}`);
        console.log(`Customers: ${customerCount}`);
        console.log(`Tasks: ${taskCount}`);
        console.log('-----------------------');

        if (productCount === 0) {
            console.log('⚠️  NO PRODUCTS FOUND. Database might be empty.');
        } else {
            console.log('✅ Data exists.');
            const products = await prisma.product.findMany({ take: 3, select: { id: true, name: true } });
            console.log('Sample Products:', JSON.stringify(products, null, 2));
        }

        // Check admin user status
        const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
        if (admin) {
            console.log('Admin user:', JSON.stringify({ id: admin.id, username: admin.username, isAdmin: admin.isAdmin, isActive: admin.isActive, role: admin.role }));
        } else {
            console.log('⚠️  Admin user NOT FOUND');
        }

    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
