
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for "Cisco Secure Access"...');

    const product = await prisma.product.findFirst({
        where: { name: { contains: 'Cisco Secure Access', mode: 'insensitive' } }
    });

    if (product) {
        console.log('✅ Found PRODUCT:', product.name, product.id);
        const tasks = await prisma.task.findMany({
            where: { productId: product.id, name: { contains: 'SD-WAN', mode: 'insensitive' } },
            include: { telemetryAttributes: true }
        });
        console.log(`   Found ${tasks.length} tasks matching "SD-WAN":`);
        tasks.forEach(t => {
            console.log(`   - Task: ${t.name} (ID: ${t.id}), Attrs: ${t.telemetryAttributes.length}`);
            t.telemetryAttributes.forEach(a => console.log(`     - Attr: ${a.name} (ID: ${a.id})`));
        });
    } else {
        console.log('❌ Product not found.');
    }

    const solution = await prisma.solution.findFirst({
        where: { name: { contains: 'Cisco Secure Access', mode: 'insensitive' } }
    });

    if (solution) {
        console.log('✅ Found SOLUTION:', solution.name, solution.id);
        const tasks = await prisma.task.findMany({
            where: { solutionId: solution.id, name: { contains: 'SD-WAN', mode: 'insensitive' } },
            include: { telemetryAttributes: true }
        });
        console.log(`   Found ${tasks.length} tasks matching "SD-WAN":`);
        tasks.forEach(t => {
            console.log(`   - Task: ${t.name} (ID: ${t.id}), Attrs: ${t.telemetryAttributes.length}`);
            t.telemetryAttributes.forEach(a => console.log(`     - Attr: ${a.name} (ID: ${a.id})`));
        });
    } else {
        console.log('❌ Solution not found.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
