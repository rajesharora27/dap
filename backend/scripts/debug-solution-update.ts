import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSolutionUpdate() {
  console.log('=== DEBUGGING SOLUTION UPDATE ===\n');
  
  // Get a solution
  const solution = await prisma.solution.findFirst({
    where: { name: { contains: 'SASE' } }
  });
  
  if (!solution) {
    console.log('No solution found');
    return;
  }
  
  console.log('1. Current solution in DB:');
  console.log('   ID:', solution.id);
  console.log('   Name:', solution.name);
  console.log('   customAttrs:', JSON.stringify(solution.customAttrs));
  console.log('   customAttrs keys:', solution.customAttrs ? Object.keys(solution.customAttrs as any) : 'null');
  
  // Simulate what frontend sends
  const testInput = {
    name: solution.name,
    description: solution.description,
    customAttrs: { BE: 'SBG', owner: 'rajarora', test: 'test' }
  };
  
  console.log('\n2. Simulating update with input:');
  console.log('   customAttrs:', JSON.stringify(testInput.customAttrs));
  
  // Update it
  const updated = await prisma.solution.update({
    where: { id: solution.id },
    data: testInput
  });
  
  console.log('\n3. After Prisma update:');
  console.log('   customAttrs:', JSON.stringify(updated.customAttrs));
  console.log('   customAttrs keys:', updated.customAttrs ? Object.keys(updated.customAttrs as any) : 'null');
  
  // Check if licenseLevel appeared
  const attrs = updated.customAttrs as any;
  if (attrs && typeof attrs === 'object' && 'licenseLevel' in attrs) {
    console.log('\n❌ ERROR: licenseLevel appeared in customAttrs!');
    console.log('   This means Prisma or DB is adding it');
  } else {
    console.log('\n✅ OK: No licenseLevel in customAttrs');
  }
}

debugSolutionUpdate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
