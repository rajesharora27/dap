
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Find the task
    const taskName = "Validate License and Packages";
    console.log(`Searching for task: "${taskName}"`);

    const tasks = await prisma.customerTask.findMany({
        where: { name: taskName },
        include: {
            taskTags: { // Refers to CustomerTaskTag relation
                include: {
                    tag: true
                }
            }
        }
    });

    console.log(`Found ${tasks.length} tasks with that name.`);

    for (const t of tasks) {
        console.log(`Task ID: ${t.id} (Status: ${t.status})`);
        console.log(`  Tags count: ${t.taskTags ? t.taskTags.length : 0}`);
        if (t.taskTags) {
            for (const ctTag of t.taskTags) {
                if (ctTag.tag) {
                    console.log(`    - Tag ID: ${ctTag.tag.id}, Name: ${ctTag.tag.name}, Color: ${ctTag.tag.color}`);
                } else {
                    console.log(`    - Tag ID: ${ctTag.tagId} (Relation not found)`);
                }
            }
        }
    }

    // Also check Solution Tasks
    const solutionTasks = await prisma.customerSolutionTask.findMany({
        where: { name: taskName },
        include: {
            taskTags: {
                include: {
                    tag: true
                }
            }
        }
    });

    console.log(`\nFound ${solutionTasks.length} solution tasks with that name.`);
    for (const t of solutionTasks) {
        console.log(`Solution Task ID: ${t.id}`);
        console.log(`  Tags count: ${t.taskTags ? t.taskTags.length : 0}`);
        if (t.taskTags) {
            for (const stTag of t.taskTags) {
                if (stTag.tag) {
                    console.log(`    - Tag ID: ${stTag.tag.id}, Name: ${stTag.tag.name}`);
                }
            }
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
