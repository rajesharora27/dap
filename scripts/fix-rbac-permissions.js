#!/usr/bin/env node
/**
 * Fix RBAC Permissions Script
 * 
 * Sets up proper role-based permissions:
 * - ADMIN: Full access to everything (via isAdmin flag)
 * - SME: Full CRUD on Products and Solutions
 * - CSS: Full CRUD on Customers, READ-only on Products and Solutions
 */

const path = require('path');
const { PrismaClient, ResourceType, PermissionLevel } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function fixRBACPermissions() {
  console.log('🔧 Starting RBAC Permissions Fix...\n');

  try {
    // 1. Get or create roles
    console.log('📋 Step 1: Ensuring roles exist...');
    
    const smeRole = await prisma.role.upsert({
      where: { name: 'SME' },
      update: { description: 'Subject Matter Expert - Full access to Products and Solutions' },
      create: {
        name: 'SME',
        description: 'Subject Matter Expert - Full access to Products and Solutions'
      }
    });
    console.log('✅ SME role:', smeRole.id);

    const cssRole = await prisma.role.upsert({
      where: { name: 'CSS' },
      update: { description: 'Customer Success Specialist - Full access to Customers, read access to Products/Solutions' },
      create: {
        name: 'CSS',
        description: 'Customer Success Specialist - Full access to Customers, read access to Products/Solutions'
      }
    });
    console.log('✅ CSS role:', cssRole.id);

    // 2. Clear existing role permissions
    console.log('\n🗑️  Step 2: Clearing old role permissions...');
    await prisma.rolePermission.deleteMany({
      where: {
        OR: [
          { roleId: smeRole.id },
          { roleId: cssRole.id }
        ]
      }
    });
    console.log('✅ Old permissions cleared');

    // 3. Create SME permissions (PRODUCT + SOLUTION: ADMIN)
    console.log('\n📝 Step 3: Creating SME permissions...');
    
    const smeProductPerm = await prisma.rolePermission.create({
      data: {
        roleId: smeRole.id,
        resourceType: ResourceType.PRODUCT,
        resourceId: null, // null = all products
        permissionLevel: PermissionLevel.ADMIN
      }
    });
    console.log('✅ SME → PRODUCT (ALL): ADMIN');

    const smeSolutionPerm = await prisma.rolePermission.create({
      data: {
        roleId: smeRole.id,
        resourceType: ResourceType.SOLUTION,
        resourceId: null, // null = all solutions
        permissionLevel: PermissionLevel.ADMIN
      }
    });
    console.log('✅ SME → SOLUTION (ALL): ADMIN');

    // 4. Create CSS permissions (CUSTOMER: ADMIN, PRODUCT: READ, SOLUTION: READ)
    console.log('\n📝 Step 4: Creating CSS permissions...');
    
    const cssCustomerPerm = await prisma.rolePermission.create({
      data: {
        roleId: cssRole.id,
        resourceType: ResourceType.CUSTOMER,
        resourceId: null, // null = all customers
        permissionLevel: PermissionLevel.ADMIN
      }
    });
    console.log('✅ CSS → CUSTOMER (ALL): ADMIN');

    const cssProductPerm = await prisma.rolePermission.create({
      data: {
        roleId: cssRole.id,
        resourceType: ResourceType.PRODUCT,
        resourceId: null, // null = all products
        permissionLevel: PermissionLevel.READ
      }
    });
    console.log('✅ CSS → PRODUCT (ALL): READ');

    const cssSolutionPerm = await prisma.rolePermission.create({
      data: {
        roleId: cssRole.id,
        resourceType: ResourceType.SOLUTION,
        resourceId: null, // null = all solutions
        permissionLevel: PermissionLevel.READ
      }
    });
    console.log('✅ CSS → SOLUTION (ALL): READ');

    // 5. Verify permissions
    console.log('\n🔍 Step 5: Verifying permissions...');
    
    const smePerms = await prisma.rolePermission.findMany({
      where: { roleId: smeRole.id }
    });
    console.log(`\n📋 SME Role (${smeRole.id}):`);
    smePerms.forEach(p => {
      console.log(`   - ${p.resourceType} ${p.resourceId ? '(ID: ' + p.resourceId + ')' : '(ALL)'}: ${p.permissionLevel}`);
    });

    const cssPerms = await prisma.rolePermission.findMany({
      where: { roleId: cssRole.id }
    });
    console.log(`\n📋 CSS Role (${cssRole.id}):`);
    cssPerms.forEach(p => {
      console.log(`   - ${p.resourceType} ${p.resourceId ? '(ID: ' + p.resourceId + ')' : '(ALL)'}: ${p.permissionLevel}`);
    });

    // 6. Verify user-role assignments
    console.log('\n👥 Step 6: Verifying user-role assignments...');
    
    const userRoles = await prisma.userRole.findMany({
      include: {
        user: { select: { username: true } },
        role: { select: { name: true } }
      }
    });

    console.log('\nUser → Role Assignments:');
    userRoles.forEach(ur => {
      console.log(`   - ${ur.user.username} → ${ur.role.name}`);
    });

    console.log('\n✅ RBAC Permissions Fixed Successfully!\n');
    console.log('📊 Summary:');
    console.log('   - ADMIN users: Full access (via isAdmin flag)');
    console.log('   - SME users: ADMIN access to PRODUCT and SOLUTION');
    console.log('   - CSS users: ADMIN access to CUSTOMER, READ access to PRODUCT and SOLUTION');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRBACPermissions()
  .then(() => {
    console.log('\n🎉 Done! Restart the backend to apply changes.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

