import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllSolutions() {
  const solutions = await prisma.solution.findMany({
    select: {
      id: true,
      name: true,
      customAttrs: true
    }
  });

  console.log('All solutions:');
  solutions.forEach(sol => {
    const attrs = sol.customAttrs as any;
    const hasLicenseLevel = attrs && typeof attrs === 'object' && Object.keys(attrs).some(key => key.toLowerCase() === 'licenselevel');
    console.log(`\n${sol.name} (${sol.id}):`);
    console.log('  customAttrs:', JSON.stringify(attrs, null, 2));
    console.log('  Has licenseLevel:', hasLicenseLevel);
  });
}

checkAllSolutions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
