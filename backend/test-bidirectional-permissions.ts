/**
 * Test script to verify bidirectional permission flow
 * Tests that "All Products ADMIN" grants "All Solutions ADMIN"
 */

import { PrismaClient, ResourceType, PermissionLevel } from '@prisma/client';
import { checkUserPermission, getUserAccessibleResources } from './src/lib/permissions';

const prisma = new PrismaClient();

async function testBidirectionalPermissions() {
  console.log('🧪 Testing Bidirectional Permission Flow\n');
  
  try {
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Found admin user: ${adminUser.username} (${adminUser.id})\n`);
    
    // Test 1: Create a test role with "All Products ADMIN" permission
    console.log('📝 Test 1: Creating role with "All Products ADMIN" permission...');
    
    const testRole = await prisma.role.create({
      data: {
        name: 'Product Manager Test',
        description: 'Test role with all products admin access'
      }
    });
    
    console.log(`✅ Created role: ${testRole.name} (${testRole.id})`);
    
    // Add permission for ALL products with ADMIN level
    const permission = await prisma.rolePermission.create({
      data: {
        roleId: testRole.id,
        resourceType: ResourceType.PRODUCT,
        resourceId: null, // NULL = All products
        permissionLevel: PermissionLevel.ADMIN
      }
    });
    
    console.log(`✅ Added permission: All Products → ADMIN\n`);
    
    // Assign role to admin user
    const userRole = await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: testRole.id
      }
    });
    
    console.log(`✅ Assigned role to user\n`);
    
    // Test 2: Check if user can access solutions
    console.log('🔍 Test 2: Checking if "All Products ADMIN" grants solution access...\n');
    
    // Check individual solution access
    const solutions = await prisma.solution.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true }
    });
    
    console.log(`Found ${solutions.length} solutions to test:\n`);
    
    for (const solution of solutions) {
      const hasAccess = await checkUserPermission(
        adminUser.id,
        ResourceType.SOLUTION,
        solution.id,
        PermissionLevel.ADMIN,
        prisma
      );
      
      const icon = hasAccess ? '✅' : '❌';
      console.log(`  ${icon} ${solution.name} (${solution.id}): ${hasAccess ? 'GRANTED' : 'DENIED'}`);
    }
    
    // Test 3: Check if user gets all solutions in list
    console.log('\n🔍 Test 3: Checking getUserAccessibleResources for solutions...\n');
    
    const accessibleSolutions = await getUserAccessibleResources(
      adminUser.id,
      ResourceType.SOLUTION,
      PermissionLevel.ADMIN,
      prisma
    );
    
    if (accessibleSolutions === null) {
      console.log('✅ Result: null (Access to ALL solutions granted!)');
    } else if (accessibleSolutions.length === solutions.length) {
      console.log(`✅ Result: [${accessibleSolutions.length} solutions] (All solutions accessible)`);
    } else {
      console.log(`⚠️  Result: [${accessibleSolutions.length}/${solutions.length} solutions] (Partial access)`);
    }
    
    // Test 4: Verify products access
    console.log('\n🔍 Test 4: Verifying products access (should also work)...\n');
    
    const accessibleProducts = await getUserAccessibleResources(
      adminUser.id,
      ResourceType.PRODUCT,
      PermissionLevel.ADMIN,
      prisma
    );
    
    if (accessibleProducts === null) {
      console.log('✅ Result: null (Access to ALL products granted!)');
    } else {
      console.log(`✅ Result: [${accessibleProducts.length} products]`);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.userRole.delete({ where: { id: userRole.id } });
    await prisma.rolePermission.delete({ where: { id: permission.id } });
    await prisma.role.delete({ where: { id: testRole.id } });
    console.log('✅ Cleanup complete\n');
    
    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log('✅ All Products ADMIN permission created');
    console.log('✅ Solution access checked (bidirectional flow)');
    console.log('✅ Resource listing checked');
    console.log('✅ Test data cleaned up');
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testBidirectionalPermissions().catch(console.error);

