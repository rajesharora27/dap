import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('Checking task data...');
  
  const tasks = await prisma.task.findMany({
    include: {
      outcomes: {
        include: {
          outcome: true
        }
      }
    }
  });

  console.log(`Found ${tasks.length} tasks`);
  
  tasks.forEach(task => {
    console.log(`\nTask: ${task.name}`);
    console.log(`  howToDoc: ${task.howToDoc}`);
    console.log(`  howToVideo: ${task.howToVideo}`);
    console.log(`  licenseLevel: ${task.licenseLevel}`);
    console.log(`  outcomes: ${task.outcomes.map(to => to.outcome.name).join(', ')}`);
  });

  await prisma.$disconnect();
}

checkData().catch(console.error);