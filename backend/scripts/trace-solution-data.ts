import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function traceSolutionData() {
  console.log('=== TRACING SOLUTION DATA FLOW ===\n');
  
  const solutions = await prisma.solution.findMany({
    select: {
      id: true,
      name: true,
      customAttrs: true
    }
  });

  console.log('1. DATABASE (Prisma):');
  solutions.forEach(sol => {
    console.log(`   ${sol.name}:`);
    console.log(`   customAttrs type: ${typeof sol.customAttrs}`);
    console.log(`   customAttrs value: ${JSON.stringify(sol.customAttrs)}`);
    const attrs = sol.customAttrs as any;
    if (attrs && typeof attrs === 'object') {
      console.log(`   Keys: ${Object.keys(attrs).join(', ')}`);
      console.log(`   Has licenseLevel: ${Object.keys(attrs).includes('licenseLevel')}`);
    }
    console.log('');
  });
}

traceSolutionData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
