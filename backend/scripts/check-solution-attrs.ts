import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSolutionAttrs() {
  const solutions = await prisma.solution.findMany({
    where: {
      name: { contains: 'SASE' }
    },
    select: {
      id: true,
      name: true,
      customAttrs: true
    }
  });

  console.log('Solutions found:', solutions.length);
  solutions.forEach(sol => {
    console.log(`\nSolution: ${sol.name} (${sol.id})`);
    console.log('customAttrs:', JSON.stringify(sol.customAttrs, null, 2));
  });
}

checkSolutionAttrs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
