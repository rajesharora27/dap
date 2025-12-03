
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const solutionId = 'sol-sase'; // ID from user logs

    console.log(`Checking solution: ${solutionId}`);

    const solution = await prisma.solution.findUnique({
        where: { id: solutionId },
        include: {
            products: {
                include: {
                    product: true
                }
            }
        }
    });

    if (!solution) {
        console.log('❌ Solution not found!');
        return;
    }

    console.log(`✅ Solution found: ${solution.name}`);
    console.log(`Products count: ${solution.products.length}`);

    solution.products.forEach(sp => {
        console.log(` - Product: ${sp.product.name} (ID: ${sp.productId})`);
    });

    if (solution.products.length === 0) {
        console.log('⚠️ WARNING: Solution has NO products linked!');
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
