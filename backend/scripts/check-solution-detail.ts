import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSolutionDetail() {
  const solution = await prisma.solution.findFirst({
    where: { name: { contains: 'SASE' } },
    select: {
      id: true,
      name: true,
      description: true,
      customAttrs: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  console.log('SASE Solution full details:');
  console.log(JSON.stringify(solution, null, 2));
}

checkSolutionDetail()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
