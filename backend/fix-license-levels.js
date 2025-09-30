const { PrismaClient } = require('@prisma/client');

async function fixLicenseLevels() {
  const prisma = new PrismaClient();
  
  try {
    // Check all licenses first
    const allLicenses = await prisma.license.findMany({
      include: {
        product: true
      }
    });
    
    console.log('All licenses:', allLicenses.length);
    allLicenses.forEach(license => {
      console.log(`- License ${license.id} (${license.name}) for product ${license.product?.name || 'unknown'} has level: ${license.level}`);
    });
    
    // Find licenses that don't have a valid level (null, undefined, or 0)
    const invalidLicenses = allLicenses.filter(license => !license.level || license.level < 1);
    
    console.log('Licenses with invalid levels:', invalidLicenses.length);
    
    // Update all invalid levels to 1 (Essential)
    for (const license of invalidLicenses) {
      await prisma.license.update({
        where: { id: license.id },
        data: { level: 1 }
      });
      console.log(`Updated license ${license.id} to level 1`);
    }
    
    console.log(`Updated ${invalidLicenses.length} licenses to level 1 (Essential)`);
    
    // Verify the fix by checking all licenses again
    const fixedLicenses = await prisma.license.findMany({
      include: {
        product: true
      }
    });
    
    console.log('After fix:');
    fixedLicenses.forEach(license => {
      console.log(`- License ${license.id} (${license.name}) for product ${license.product?.name || 'unknown'} has level: ${license.level}`);
    });
    
  } catch (error) {
    console.error('Error fixing license levels:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLicenseLevels();