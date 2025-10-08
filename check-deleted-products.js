#!/usr/bin/env node

/**
 * Check if Cisco Secure Access product is soft-deleted
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDeletedProducts() {
  console.log('🔍 Checking for soft-deleted products...\n');
  
  // Get all products (including deleted)
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      deletedAt: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Found ${allProducts.length} total products:\n`);
  
  allProducts.forEach(p => {
    const status = p.deletedAt ? '❌ DELETED' : '✅ ACTIVE';
    const deletedInfo = p.deletedAt ? ` (deleted: ${p.deletedAt.toISOString()})` : '';
    console.log(`${status} ${p.name}${deletedInfo}`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Created: ${p.createdAt.toISOString()}\n`);
  });
  
  // Check specifically for Cisco Secure Access
  const ciscoProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes('cisco')
  );
  
  if (ciscoProducts.length > 0) {
    console.log('\n🎯 Found Cisco products:');
    ciscoProducts.forEach(p => {
      if (p.deletedAt) {
        console.log(`\n⚠️  "${p.name}" exists but is SOFT-DELETED!`);
        console.log(`   This explains the unique constraint error.`);
        console.log(`   Solution: Either restore this product or hard-delete it.`);
      } else {
        console.log(`\n✅ "${p.name}" is ACTIVE`);
      }
    });
  } else {
    console.log('\n❌ No Cisco products found (not even deleted ones)');
    console.log('   The unique constraint error suggests a different issue.');
  }
  
  await prisma.$disconnect();
}

checkDeletedProducts().catch(console.error);
