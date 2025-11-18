#!/bin/bash
# Fix Admin User After Backup Restore
# This script ensures the admin user always exists with proper permissions
# Usage: ./FIX_ADMIN_AFTER_RESTORE.sh

set -e

echo "======================================"
echo "Fixing Admin User After Backup Restore"
echo "======================================"
echo ""

cd /data/dap/backend

echo "1. Updating database schema..."
npx prisma db push --accept-data-loss --skip-generate

echo ""
echo "2. Regenerating Prisma Client..."
npx prisma generate

echo ""
echo "3. Fixing/Creating admin user..."
node -e "
const { PrismaClient } = require('./node_modules/@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('DAP123', 10);
    
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        email: 'admin@dynamicadoptionplans.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        isAdmin: true,
        isActive: true,
        mustChangePassword: true,
        role: 'ADMIN'
      },
      create: {
        username: 'admin',
        email: 'admin@dynamicadoptionplans.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        isAdmin: true,
        isActive: true,
        mustChangePassword: true,
        role: 'ADMIN'
      }
    });
    
    console.log('✓ Admin user ready');
    console.log('  Username:', admin.username);
    console.log('  Email:', admin.email);
    console.log('  isAdmin:', admin.isAdmin);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

fixAdmin();
"

echo ""
echo "======================================"
echo "✅ Admin user fixed successfully!"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: DAP123"
echo ""
echo "Access your application at:"
echo "  http://myapps.rajarora.csslab/dap/"
echo "======================================"


