
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTags() {
    console.log('Checking Tag Data...');

    const products = await prisma.product.findMany({
        include: {
            tags: true,
            tasks: {
                include: {
                    taskTags: {
                        include: {
                            tag: true
                        }
                    }
                }
            }
        }
    });

    console.log(`Found ${products.length} products.`);

    products.forEach(p => {
        console.log(`\nProduct: ${p.name}`);
        console.log(`- Product Level Tags: ${p.tags.length}`);
        p.tags.forEach(t => console.log(`  - ${t.name}`));

        const tasksWithTags = p.tasks.filter(t => t.taskTags.length > 0);
        console.log(`- Total Tasks: ${p.tasks.length}`);
        console.log(`- Tasks with Tags: ${tasksWithTags.length}`);

        tasksWithTags.slice(0, 5).forEach(t => {
            const tagNames = t.taskTags.map(tt => tt.tag.name).join(', ');
            console.log(`  - Task "${t.name}" has tags: [${tagNames}]`);
        });
    });

    await prisma.$disconnect();
}

checkTags().catch(e => {
    console.error(e);
    process.exit(1);
});
