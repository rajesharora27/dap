/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Script to update existing CustomerProduct records that have NULL names
 * Gives them a default name based on their product name
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingNames() {
  console.log('Updating existing CustomerProduct assignments without names...\n');

  try {
    // Find all CustomerProducts with null names
    const productsWithoutNames = await prisma.customerProduct.findMany({
      where: {
        name: null
      },
      include: {
        product: true,
        customer: true
      }
    });

    console.log(`Found ${productsWithoutNames.length} assignments without names\n`);

    // Update each one with a default name
    for (const cp of productsWithoutNames) {
      const defaultName = `${cp.product.name} - Default`;
      
      await prisma.customerProduct.update({
        where: { id: cp.id },
        data: { name: defaultName }
      });

      console.log(`✓ Updated: ${cp.customer.name} -> ${cp.product.name}`);
      console.log(`  New name: "${defaultName}"\n`);
    }

    console.log('Done! All assignments now have names.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingNames();
