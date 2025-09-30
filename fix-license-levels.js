const { PrismaClient } = require('@prisma/client');

async function fixLicenseLevels() {
  const prisma = new PrismaClient();
  
  try {
    // Check current licenses with null levels
    const licensesWithNullLevel = await prisma.license.findMany({
      where: {
        level: null
      },
      include: {
        product: true
      }
    });
    
    console.log('Licenses with null levels:', licensesWithNullLevel.length);
    licensesWithNullLevel.forEach(license => {
      console.log(`- License ${license.id} (${license.name}) for product ${license.product?.name || 'unknown'} has null level`);
    });
    
    // Update all null levels to 1 (Essential)
    const updateResult = await prisma.license.updateMany({
      where: {
        level: null
      },
      data: {
        level: 1
      }
    });
    
    console.log(`Updated ${updateResult.count} licenses to level 1 (Essential)`);
    
    // Verify the fix
    const remainingNullLevels = await prisma.license.count({
      where: {
        level: null
      }
    });
    
    console.log(`Remaining licenses with null levels: ${remainingNullLevels}`);
    
  } catch (error) {
    console.error('Error fixing license levels:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLicenseLevels();