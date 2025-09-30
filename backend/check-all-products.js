const { PrismaClient } = require('@prisma/client');

async function checkAllProducts() {
  const prisma = new PrismaClient();
  
  try {
    const products = await prisma.product.findMany({
      include: {
        licenses: true
      }
    });
    
    console.log('Database products:', products.length);
    products.forEach(product => {
      console.log(`- Product ${product.id} (${product.name}) has ${product.licenses.length} licenses`);
      product.licenses.forEach(license => {
        console.log(`  - License ${license.id} (${license.name}) level: ${license.level}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllProducts();