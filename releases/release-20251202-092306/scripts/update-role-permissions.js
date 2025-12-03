#!/usr/bin/env node
/**
 * Update Role Permissions in Database
 * 
 * This script updates the RolePermission table to set correct permissions
 * for SME and CSS roles.
 */

// Try multiple paths for Prisma client (dev vs prod)
let PrismaClient;
try {
  PrismaClient = require('../backend/node_modules/@prisma/client').PrismaClient;
} catch {
  try {
    PrismaClient = require('../app/backend/node_modules/@prisma/client').PrismaClient;
  } catch {
    PrismaClient = require('@prisma/client').PrismaClient;
  }
}

const prisma = new PrismaClient();

async function updateRolePermissions() {
  try {
    console.log('🔑 Updating Role Permissions...\n');

    // Find SME role
    const smeRole = await prisma.role.findUnique({
      where: { name: 'SME' }
    });

    if (smeRole) {
      console.log(`📋 Found SME role: ${smeRole.id}`);
      
      // Delete existing permissions
      const deletedSME = await prisma.rolePermission.deleteMany({
        where: { roleId: smeRole.id }
      });
      console.log(`   Deleted ${deletedSME.count} old SME permissions`);

      // Create new permissions
      await prisma.rolePermission.createMany({
        data: [
          {
            roleId: smeRole.id,
            resourceType: 'PRODUCT',
            resourceId: 'ALL',
            permissionLevel: 'ADMIN'
          },
          {
            roleId: smeRole.id,
            resourceType: 'SOLUTION',
            resourceId: 'ALL',
            permissionLevel: 'ADMIN'
          }
        ]
      });
      console.log(`   ✅ SME role permissions updated:`);
      console.log(`      - PRODUCT (ALL): ADMIN`);
      console.log(`      - SOLUTION (ALL): ADMIN\n`);
    } else {
      console.log('⚠️  SME role not found\n');
    }

    // Find CSS role
    const cssRole = await prisma.role.findUnique({
      where: { name: 'CSS' }
    });

    if (cssRole) {
      console.log(`📋 Found CSS role: ${cssRole.id}`);
      
      // Delete existing permissions
      const deletedCSS = await prisma.rolePermission.deleteMany({
        where: { roleId: cssRole.id }
      });
      console.log(`   Deleted ${deletedCSS.count} old CSS permissions`);

      // Create new permissions
      await prisma.rolePermission.createMany({
        data: [
          {
            roleId: cssRole.id,
            resourceType: 'CUSTOMER',
            resourceId: 'ALL',
            permissionLevel: 'ADMIN'
          },
          {
            roleId: cssRole.id,
            resourceType: 'PRODUCT',
            resourceId: 'ALL',
            permissionLevel: 'READ'
          },
          {
            roleId: cssRole.id,
            resourceType: 'SOLUTION',
            resourceId: 'ALL',
            permissionLevel: 'READ'
          }
        ]
      });
      console.log(`   ✅ CSS role permissions updated:`);
      console.log(`      - CUSTOMER (ALL): ADMIN`);
      console.log(`      - PRODUCT (ALL): READ`);
      console.log(`      - SOLUTION (ALL): READ\n`);
    } else {
      console.log('⚠️  CSS role not found\n');
    }

    // Verify permissions
    console.log('📊 Verifying permissions...\n');
    
    if (smeRole) {
      const smePerms = await prisma.rolePermission.findMany({
        where: { roleId: smeRole.id }
      });
      console.log(`SME Role (${smePerms.length} permissions):`);
      smePerms.forEach(p => {
        console.log(`  - ${p.resourceType} (${p.resourceId}): ${p.permissionLevel}`);
      });
      console.log('');
    }

    if (cssRole) {
      const cssPerms = await prisma.rolePermission.findMany({
        where: { roleId: cssRole.id }
      });
      console.log(`CSS Role (${cssPerms.length} permissions):`);
      cssPerms.forEach(p => {
        console.log(`  - ${p.resourceType} (${p.resourceId}): ${p.permissionLevel}`);
      });
      console.log('');
    }

    console.log('✅ Role permissions updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating role permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateRolePermissions()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

