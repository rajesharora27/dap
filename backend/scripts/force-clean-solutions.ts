import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceCleanSolutions() {
  console.log('=== FORCE CLEANING ALL SOLUTIONS ===\n');
  
  const solutions = await prisma.solution.findMany({
    select: {
      id: true,
      name: true,
      customAttrs: true
    }
  });

  console.log(`Found ${solutions.length} solutions\n`);

  for (const solution of solutions) {
    const attrs = solution.customAttrs as any;
    
    if (!attrs || typeof attrs !== 'object') {
      console.log(`${solution.name}: No customAttrs or invalid type, skipping`);
      continue;
    }

    console.log(`\n${solution.name} BEFORE:`, JSON.stringify(attrs));
    
    // Remove licenseLevel (case-insensitive)
    const cleanedAttrs: any = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (key.toLowerCase() !== 'licenselevel') {
        cleanedAttrs[key] = value;
      } else {
        console.log(`  → Removing key: "${key}"`);
      }
    }
    
    console.log(`${solution.name} AFTER:`, JSON.stringify(cleanedAttrs));
    
    // Update in database
    await prisma.solution.update({
      where: { id: solution.id },
      data: { 
        customAttrs: cleanedAttrs
      }
    });
    
    console.log(`  ✅ Updated in database`);
  }

  console.log('\n=== VERIFICATION ===\n');
  
  const verifiedSolutions = await prisma.solution.findMany({
    select: {
      id: true,
      name: true,
      customAttrs: true
    }
  });

  for (const sol of verifiedSolutions) {
    const attrs = sol.customAttrs as any;
    const keys = attrs && typeof attrs === 'object' ? Object.keys(attrs) : [];
    const hasLicenseLevel = keys.some(k => k.toLowerCase() === 'licenselevel');
    
    console.log(`${sol.name}:`);
    console.log(`  Keys: ${keys.join(', ')}`);
    console.log(`  Has licenseLevel: ${hasLicenseLevel ? '❌ YES (ERROR!)' : '✅ NO'}`);
    console.log(`  Raw: ${JSON.stringify(attrs)}\n`);
  }
}

forceCleanSolutions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

