#!/usr/bin/env node
/**
 * Reset Test User Passwords
 * Run from backend directory: cd /data/dap/backend && node ../scripts/reset-test-passwords.js
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetPasswords() {
  console.log('🔐 Resetting test user passwords...\n');

  const users = [
    { username: 'admin', password: 'admin' },
    { username: 'smeuser', password: 'smeuser' },
    { username: 'cssuser', password: 'cssuser' }
  ];

  for (const {username, password} of users) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword, mustChangePassword: false }
    });
    
    console.log(`✅ ${username} → password: ${password}`);
  }

  console.log('\n✅ All passwords reset!');
  await prisma.$disconnect();
}

resetPasswords().then(() => process.exit(0)).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

