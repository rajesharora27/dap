const { PrismaClient } = require('@prisma/client');

// Create prisma client using the backend's generated client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap'
    }
  }
});

async function checkDatabase() {
  console.log('🔍 Checking database for Cisco products...\n');
  
  try {
    // Query all products including soft-deleted ones
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        deletedAt: true
      }
    });
    
    console.log(`Found ${allProducts.length} products in database:\n`);
    allProducts.forEach(p => {
      const status = p.deletedAt ? '❌ SOFT-DELETED' : '✅ ACTIVE';
      console.log(`${status} ${p.name} (${p.id})`);
      if (p.deletedAt) {
        console.log(`   Deleted at: ${p.deletedAt}`);
      }
    });
    
    // Check specifically for Cisco
    const cisco = allProducts.filter(p => p.name.toLowerCase().includes('cisco'));
    
    if (cisco.length > 0) {
      console.log('\n⚠️  WARNING: Cisco product(s) still exist in database:');
      cisco.forEach(p => {
        console.log(`   - ${p.name} (${p.id})`);
        if (p.deletedAt) {
          console.log(`     Status: SOFT-DELETED (deletedAt: ${p.deletedAt})`);
          console.log(`     This is blocking new imports!`);
        }
      });
    } else {
      console.log('\n✅ No Cisco products in database - ready for import');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
