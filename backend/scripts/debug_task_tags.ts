
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find the task
    const taskName = "Validate License and Packages";
    console.log(`Searching for task: "${taskName}"`);

    const tasks = await prisma.customerTask.findMany({
        where: { name: taskName },
        include: {
            tags: { // Refers to CustomerTaskTag relation
                include: {
                    tag: true
                }
            }
        }
    });

    console.log(`Found ${tasks.length} tasks with that name.`);

    for (const t of tasks) {
        console.log(`Task ID: ${t.id} (Status: ${t.status})`);
        console.log(`  Tags count: ${t.tags.length}`);
        for (const ctTag of t.tags) {
            console.log(`    - Tag ID: ${ctTag.tag.id}, Name: ${ctTag.tag.name}, Color: ${ctTag.tag.color}`);
        }
    }

    // Also check Solution Tasks
    const solutionTasks = await prisma.customerSolutionTask.findMany({
        where: { name: taskName },
        include: {
            tags: {
                include: {
                    tag: true
                }
            }
        }
    });

    console.log(`\nFound ${solutionTasks.length} solution tasks with that name.`);
    for (const t of solutionTasks) {
        console.log(`Solution Task ID: ${t.id}`);
        console.log(`  Tags count: ${t.tags.length}`);
        for (const stTag of t.tags) {
            console.log(`    - Tag ID: ${stTag.tag.id}, Name: ${stTag.tag.name}`);
        }
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
