
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTags() {
    try {
        console.log('--- Checking Product Tags ---');
        const product = await prisma.product.findFirst({
            where: { name: 'Cisco Secure Access' },
            include: { tags: true }
        });

        if (product) {
            console.log(`Product: ${product.name} (ID: ${product.id})`);
            console.log(`Tags count: ${product.tags.length}`);
            product.tags.forEach(t => console.log(` - ${t.name} (ID: ${t.id})`));
        } else {
            console.log('Product "Cisco Secure Access" not found.');
            // List all products just in case
            const allProducts = await prisma.product.findMany({ select: { name: true } });
            console.log('Available products:', allProducts.map(p => p.name).join(', '));
        }

        console.log('\n--- Checking Solution Tags ---');
        const solution = await prisma.solution.findFirst({
            where: { name: 'SASE' },
            include: { tags: true }
        });

        if (solution) {
            console.log(`Solution: ${solution.name} (ID: ${solution.id})`);
            console.log(`Tags count: ${solution.tags.length}`);
            solution.tags.forEach(t => console.log(` - ${t.name} (ID: ${t.id})`));
        } else {
            console.log('Solution "SASE" not found.');
            // List all solutions
            const allSolutions = await prisma.solution.findMany({ select: { name: true } });
            console.log('Available solutions:', allSolutions.map(s => s.name).join(', '));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTags();
