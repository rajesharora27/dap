/**
 * Test Script: Permission Flow Verification
 * 
 * This script tests the three core permission flow rules:
 * 1. ALL PRODUCTS → ALL SOLUTIONS
 * 2. SPECIFIC SOLUTION → ALL PRODUCTS in that solution
 * 3. ALL PRODUCTS in a solution → THAT SOLUTION
 */

import { PrismaClient, ResourceType, PermissionLevel } from '@prisma/client';
import { checkUserPermission, getUserAccessibleResources } from '../lib/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🧪 PERMISSION FLOW VERIFICATION TEST\n');
  console.log('='.repeat(60));

  try {
    // Setup: Create test data
    console.log('\n📦 Setting up test data...\n');

    // Create test products
    const productA = await prisma.product.upsert({
      where: { name: 'Test Product A' },
      update: {},
      create: {
        name: 'Test Product A',
        description: 'Product A for testing'
      }
    });

    const productB = await prisma.product.upsert({
      where: { name: 'Test Product B' },
      update: {},
      create: {
        name: 'Test Product B',
        description: 'Product B for testing'
      }
    });

    const productC = await prisma.product.upsert({
      where: { name: 'Test Product C' },
      update: {},
      create: {
        name: 'Test Product C',
        description: 'Product C for testing'
      }
    });

    console.log(`✅ Created products: A, B, C`);

    // Create test solution with products A, B, C
    // Find existing solution first
    let testSolution = await prisma.solution.findFirst({
      where: { name: 'Test Solution ABC' }
    });

    if (!testSolution) {
      testSolution = await prisma.solution.create({
        data: {
          name: 'Test Solution ABC',
          description: 'Solution containing products A, B, C'
        }
      });
    }

    // Link products to solution
    await prisma.solutionProduct.upsert({
      where: {
        productId_solutionId: {
          productId: productA.id,
          solutionId: testSolution.id
        }
      },
      update: {},
      create: {
        productId: productA.id,
        solutionId: testSolution.id
      }
    });

    await prisma.solutionProduct.upsert({
      where: {
        productId_solutionId: {
          productId: productB.id,
          solutionId: testSolution.id
        }
      },
      update: {},
      create: {
        productId: productB.id,
        solutionId: testSolution.id
      }
    });

    await prisma.solutionProduct.upsert({
      where: {
        productId_solutionId: {
          productId: productC.id,
          solutionId: testSolution.id
        }
      },
      update: {},
      create: {
        productId: productC.id,
        solutionId: testSolution.id
      }
    });

    console.log(`✅ Created solution: "Test Solution ABC" with products A, B, C\n`);

    // Create test users
    const testUser1 = await prisma.user.upsert({
      where: { username: 'test_user_1' },
      update: {},
      create: {
        username: 'test_user_1',
        email: 'test1@example.com',
        password: 'dummy', // Not used in this test
        isAdmin: false,
        isActive: true
      }
    });

    const testUser2 = await prisma.user.upsert({
      where: { username: 'test_user_2' },
      update: {},
      create: {
        username: 'test_user_2',
        email: 'test2@example.com',
        password: 'dummy',
        isAdmin: false,
        isActive: true
      }
    });

    const testUser3 = await prisma.user.upsert({
      where: { username: 'test_user_3' },
      update: {},
      create: {
        username: 'test_user_3',
        email: 'test3@example.com',
        password: 'dummy',
        isAdmin: false,
        isActive: true
      }
    });

    console.log(`✅ Created test users: test_user_1, test_user_2, test_user_3\n`);

    // Clean up existing test permissions
    await prisma.permission.deleteMany({
      where: {
        userId: {
          in: [testUser1.id, testUser2.id, testUser3.id]
        }
      }
    });

    console.log('='.repeat(60));

    // TEST 1: ALL PRODUCTS → ALL SOLUTIONS
    console.log('\n🧪 TEST 1: ALL PRODUCTS → ALL SOLUTIONS\n');
    console.log('Rule: If user has access to ALL PRODUCTS, they should have');
    console.log('      access to ALL SOLUTIONS at the same permission level.\n');

    // Give test_user_1 permission for ALL PRODUCTS (resourceId: null)
    await prisma.permission.create({
      data: {
        userId: testUser1.id,
        resourceType: ResourceType.PRODUCT,
        resourceId: null, // ALL products
        permissionLevel: PermissionLevel.ADMIN
      }
    });

    console.log('Setup: test_user_1 has ADMIN on ALL PRODUCTS\n');

    // Check if user can access the test solution
    const canAccessSolution1 = await checkUserPermission(
      testUser1.id,
      ResourceType.SOLUTION,
      testSolution.id,
      PermissionLevel.ADMIN,
      prisma
    );

    console.log(`Result: Can access "Test Solution ABC"? ${canAccessSolution1 ? '✅ YES' : '❌ NO'}`);

    // Get all accessible solutions
    const accessibleSolutions1 = await getUserAccessibleResources(
      testUser1.id,
      ResourceType.SOLUTION,
      PermissionLevel.READ,
      prisma
    );

    console.log(`Result: Accessible solutions: ${accessibleSolutions1 === null ? '✅ ALL (unlimited)' : `${accessibleSolutions1.length} solutions`}`);

    if (!canAccessSolution1) {
      console.log('❌ TEST 1 FAILED: User with ALL PRODUCTS permission should have access to ALL SOLUTIONS');
    } else {
      console.log('✅ TEST 1 PASSED\n');
    }

    console.log('='.repeat(60));

    // TEST 2: SPECIFIC SOLUTION → ALL PRODUCTS in that solution
    console.log('\n🧪 TEST 2: SPECIFIC SOLUTION → ALL PRODUCTS in Solution\n');
    console.log('Rule: If user has access to a SPECIFIC SOLUTION, they should');
    console.log('      have access to ALL PRODUCTS within that solution.\n');

    // Give test_user_2 permission for the specific solution only
    await prisma.permission.create({
      data: {
        userId: testUser2.id,
        resourceType: ResourceType.SOLUTION,
        resourceId: testSolution.id, // Specific solution
        permissionLevel: PermissionLevel.WRITE
      }
    });

    console.log(`Setup: test_user_2 has WRITE on "Test Solution ABC"\n`);

    // Check if user can access products A, B, C
    const canAccessProductA = await checkUserPermission(
      testUser2.id,
      ResourceType.PRODUCT,
      productA.id,
      PermissionLevel.WRITE,
      prisma
    );

    const canAccessProductB = await checkUserPermission(
      testUser2.id,
      ResourceType.PRODUCT,
      productB.id,
      PermissionLevel.WRITE,
      prisma
    );

    const canAccessProductC = await checkUserPermission(
      testUser2.id,
      ResourceType.PRODUCT,
      productC.id,
      PermissionLevel.WRITE,
      prisma
    );

    console.log(`Result: Can access Product A? ${canAccessProductA ? '✅ YES' : '❌ NO'}`);
    console.log(`Result: Can access Product B? ${canAccessProductB ? '✅ YES' : '❌ NO'}`);
    console.log(`Result: Can access Product C? ${canAccessProductC ? '✅ YES' : '❌ NO'}`);

    // Get all accessible products
    const accessibleProducts2 = await getUserAccessibleResources(
      testUser2.id,
      ResourceType.PRODUCT,
      PermissionLevel.READ,
      prisma
    );

    console.log(`Result: Accessible products: ${accessibleProducts2 === null ? 'ALL' : `${accessibleProducts2.length} products`}`);

    if (!canAccessProductA || !canAccessProductB || !canAccessProductC) {
      console.log('❌ TEST 2 FAILED: User with SOLUTION permission should have access to all its PRODUCTS');
    } else {
      console.log('✅ TEST 2 PASSED\n');
    }

    console.log('='.repeat(60));

    // TEST 3: ALL PRODUCTS in a solution → THAT SOLUTION
    console.log('\n🧪 TEST 3: ALL PRODUCTS in Solution → THAT SOLUTION\n');
    console.log('Rule: If user has access to ALL PRODUCTS that make up a solution,');
    console.log('      they should have access to THAT SOLUTION.\n');

    // Give test_user_3 permission for products A, B, C individually (not ALL products)
    await prisma.permission.createMany({
      data: [
        {
          userId: testUser3.id,
          resourceType: ResourceType.PRODUCT,
          resourceId: productA.id,
          permissionLevel: PermissionLevel.READ
        },
        {
          userId: testUser3.id,
          resourceType: ResourceType.PRODUCT,
          resourceId: productB.id,
          permissionLevel: PermissionLevel.READ
        },
        {
          userId: testUser3.id,
          resourceType: ResourceType.PRODUCT,
          resourceId: productC.id,
          permissionLevel: PermissionLevel.READ
        }
      ]
    });

    console.log('Setup: test_user_3 has READ on Product A, Product B, Product C\n');

    // Check if user can access the test solution
    const canAccessSolution3 = await checkUserPermission(
      testUser3.id,
      ResourceType.SOLUTION,
      testSolution.id,
      PermissionLevel.READ,
      prisma
    );

    console.log(`Result: Can access "Test Solution ABC"? ${canAccessSolution3 ? '✅ YES' : '❌ NO'}`);

    // Get all accessible solutions
    const accessibleSolutions3 = await getUserAccessibleResources(
      testUser3.id,
      ResourceType.SOLUTION,
      PermissionLevel.READ,
      prisma
    );

    console.log(`Result: Accessible solutions: ${accessibleSolutions3 === null ? 'ALL' : `${accessibleSolutions3.length} solution(s)`}`);

    if (!canAccessSolution3) {
      console.log('❌ TEST 3 FAILED: User with ALL PRODUCTS in a solution should have access to THAT SOLUTION');
    } else {
      console.log('✅ TEST 3 PASSED\n');
    }

    console.log('='.repeat(60));

    // Summary
    console.log('\n📊 TEST SUMMARY\n');

    const allPassed = canAccessSolution1 && canAccessProductA && canAccessProductB && canAccessProductC && canAccessSolution3;

    if (allPassed) {
      console.log('✅ ALL TESTS PASSED - Permission flow is working correctly!\n');
      console.log('The following rules are properly implemented:');
      console.log('  1. ✅ ALL PRODUCTS → ALL SOLUTIONS');
      console.log('  2. ✅ SPECIFIC SOLUTION → ALL PRODUCTS in solution');
      console.log('  3. ✅ ALL PRODUCTS in solution → THAT SOLUTION\n');
    } else {
      console.log('❌ SOME TESTS FAILED - Please review the implementation\n');
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error running tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

