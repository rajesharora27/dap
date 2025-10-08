#!/usr/bin/env node

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dap'
});

async function checkPostgres() {
  try {
    await client.connect();
    console.log('🔍 Connected to PostgreSQL database\n');
    
    // Query Product table directly
    const result = await client.query(`
      SELECT id, name, "deletedAt", "createdAt"
      FROM "Product"
      WHERE LOWER(name) LIKE '%cisco%'
      ORDER BY "createdAt" DESC
    `);
    
    if (result.rows.length > 0) {
      console.log(`⚠️  Found ${result.rows.length} Cisco product(s) in database:\n`);
      result.rows.forEach(row => {
        console.log(`Product: ${row.name}`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Created: ${row.createdAt}`);
        console.log(`  DeletedAt: ${row.deletedAt || 'NULL (active)'}`);
        console.log('');
      });
      
      if (result.rows.some(r => r.deletedAt !== null)) {
        console.log('❌ PROBLEM: Product has deletedAt set (soft-deleted)');
        console.log('   But our code now tries to do hard delete!');
        console.log('   Need to actually DELETE the row.\n');
        
        // Delete it properly
        for (const row of result.rows) {
          console.log(`Deleting ${row.name} (${row.id})...`);
          await client.query('DELETE FROM "Product" WHERE id = $1', [row.id]);
          console.log('✅ Deleted\n');
        }
      }
    } else {
      console.log('✅ No Cisco products in database');
    }
    
    // Show all products
    const allProducts = await client.query(`
      SELECT id, name, "deletedAt"
      FROM "Product"
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`\nAll products in database (${allProducts.rows.length}):`);
    allProducts.rows.forEach(row => {
      const status = row.deletedAt ? '❌ DELETED' : '✅ ACTIVE';
      console.log(`  ${status} ${row.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkPostgres();
