import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeLicenseLevelFromSolutions() {
  console.log('Starting cleanup: Removing licenseLevel from solution customAttrs...');
  
  const solutions = await prisma.solution.findMany({
    select: {
      id: true,
      name: true,
      customAttrs: true
    }
  });

  let updatedCount = 0;
  
  for (const solution of solutions) {
    if (solution.customAttrs && typeof solution.customAttrs === 'object') {
      const attrs = solution.customAttrs as any;
      const hasLicenseLevel = Object.keys(attrs).some(key => key.toLowerCase() === 'licenselevel');
      
      if (hasLicenseLevel) {
        const cleanedAttrs = Object.fromEntries(
          Object.entries(attrs).filter(([key]) => key.toLowerCase() !== 'licenselevel')
        );
        
        await prisma.solution.update({
          where: { id: solution.id },
          data: { customAttrs: cleanedAttrs as any }
        });
        
        console.log(`Removed licenseLevel from solution: ${solution.name} (${solution.id})`);
        updatedCount++;
      }
    }
  }
  
  console.log(`\nCleanup complete! Updated ${updatedCount} solution(s).`);
}

removeLicenseLevelFromSolutions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
