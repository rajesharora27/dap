const { PrismaClient } = require('@prisma/client');

async function checkProduct() {
  const prisma = new PrismaClient();
  
  try {
    const product = await prisma.product.findUnique({
      where: { id: 'p-1' },
      include: {
        licenses: true
      }
    });
    
    console.log('Product p-1:', JSON.stringify(product, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProduct();