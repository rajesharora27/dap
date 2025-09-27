#!/usr/bin/env node

// Test to reproduce the specific license cycling issue from TestPanelNew

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

const httpLink = createHttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch: fetch,
    headers: {
        'Authorization': 'admin'
    }
});

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache()
});

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      id
      name
      description
      estMinutes
      weight
      priority
      licenseLevel
      notes
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      name
      description
      estMinutes
      weight
      licenseLevel
      priority
      notes
    }
  }
`;

async function reproduceLicenseCyclingIssue() {
    console.log('🔄 Reproducing License Cycling Issue from TestPanelNew...\n');

    try {
        // Step 1: Create a product with only Essential license (level 1)
        console.log('📦 Step 1: Creating product with limited licenses...');

        const productResult = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `Limited License Product ${Date.now()}`,
                    description: 'Product with only Essential license to test cycling failure',
                    customAttrs: {
                        testType: 'license-cycling-test',
                        limitedLicenses: true
                    }
                }
            }
        });

        const product = productResult.data.createProduct;
        console.log(`✅ Created product: ${product.name} (ID: ${product.id})`);

        // Step 2: Create only Essential license (level 1)
        console.log('\n🔐 Step 2: Creating only Essential license...');

        const licenseResult = await client.mutate({
            mutation: CREATE_LICENSE,
            variables: {
                input: {
                    name: `${product.name} - Essential Only`,
                    description: 'Only Essential license available - testing cycling failure',
                    level: 1,
                    isActive: true,
                    productId: product.id
                }
            }
        });

        const license = licenseResult.data.createLicense;
        console.log(`✅ Created license: ${license.name} (Level: ${license.level})`);

        // Step 3: Create task with Essential license
        console.log('\n📋 Step 3: Creating task with Essential license...');

        const taskResult = await client.mutate({
            mutation: CREATE_TASK,
            variables: {
                input: {
                    name: `Test Task ${Date.now()}`,
                    description: 'Task to test license cycling failure',
                    estMinutes: 120,
                    weight: 10,
                    priority: 'Medium',
                    licenseLevel: 'Essential', // Start with Essential
                    notes: 'Created for license cycling test',
                    productId: product.id
                }
            }
        });

        const task = taskResult.data.createTask;
        console.log(`✅ Created task: ${task.name} with license level: ${task.licenseLevel}`);

        // Step 4: Attempt the same license cycling logic as TestPanelNew
        console.log('\n🔄 Step 4: Attempting license level cycling (Essential -> Advantage)...');

        // This is the exact logic from TestPanelNew line ~908
        const currentLicenseLevel = task.licenseLevel;
        const newLicenseLevel = currentLicenseLevel === 'Essential' ? 'Advantage' :
            currentLicenseLevel === 'Advantage' ? 'Signature' : 'Essential';

        console.log(`   Current: ${currentLicenseLevel}`);
        console.log(`   Target:  ${newLicenseLevel}`);
        console.log(`   Product only has: Essential license (level 1)`);
        console.log(`   This should FAIL because Advantage (level 2) doesn't exist`);

        try {
            const updateResult = await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                    id: task.id,
                    input: {
                        name: `${task.name} - CYCLED`,
                        description: 'Task updated with cycled license level',
                        estMinutes: task.estMinutes + 45,
                        weight: Math.min(task.weight + 2, 10),
                        priority: 'High',
                        licenseLevel: newLicenseLevel, // This should fail!
                        notes: 'Updated with license cycling logic from TestPanelNew'
                    }
                }
            });

            console.log(`   ❌ UNEXPECTED SUCCESS: Task updated with invalid license level: ${updateResult.data.updateTask.licenseLevel}`);
            console.log(`   🚨 This indicates the license validation is NOT working properly!`);
            return {
                success: false,
                issue: 'License validation not enforced - task updated with non-existent license level',
                product: product,
                task: updateResult.data.updateTask
            };

        } catch (error) {
            console.log(`   ✅ EXPECTED FAILURE: License cycling properly rejected: ${error.message}`);
            console.log(`   🎯 This confirms the validation is working - TestPanelNew edit will fail as expected`);
            return {
                success: true,
                issue: 'License validation working correctly - TestPanelNew cycling will fail appropriately',
                product: product,
                task: task
            };
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return {
            success: false,
            issue: error.message,
            product: null,
            task: null
        };
    }
}

async function createFixedDataScenario() {
    console.log('\n🔧 Creating scenario with properly aligned license-task data...\n');

    try {
        // Create a product with all license levels
        console.log('📦 Creating product with complete license set...');

        const productResult = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `Complete License Product ${Date.now()}`,
                    description: 'Product with all license levels for proper cycling',
                    customAttrs: {
                        testType: 'complete-license-test',
                        hasAllLicenses: true
                    }
                }
            }
        });

        const product = productResult.data.createProduct;
        console.log(`✅ Created product: ${product.name}`);

        // Create all three license levels
        console.log('\n🔐 Creating complete license set...');

        const licenses = [];
        for (const licenseData of [
            { name: 'Essential', level: 1, description: 'Basic access tier' },
            { name: 'Advantage', level: 2, description: 'Enhanced access tier' },
            { name: 'Signature', level: 3, description: 'Premium access tier' }
        ]) {
            const licenseResult = await client.mutate({
                mutation: CREATE_LICENSE,
                variables: {
                    input: {
                        name: `${product.name} - ${licenseData.name} License`,
                        description: licenseData.description,
                        level: licenseData.level,
                        isActive: true,
                        productId: product.id
                    }
                }
            });

            licenses.push(licenseResult.data.createLicense);
            console.log(`✅ Created ${licenseData.name} license (Level: ${licenseData.level})`);
        }

        // Create task that can be safely cycled
        console.log('\n📋 Creating task for safe license cycling...');

        const taskResult = await client.mutate({
            mutation: CREATE_TASK,
            variables: {
                input: {
                    name: `Cycling Safe Task ${Date.now()}`,
                    description: 'Task that can safely cycle through all license levels',
                    estMinutes: 120,
                    weight: 10,
                    priority: 'Medium',
                    licenseLevel: 'Essential',
                    notes: 'Created for safe license cycling test',
                    productId: product.id
                }
            }
        });

        const task = taskResult.data.createTask;
        console.log(`✅ Created task: ${task.name} with license level: ${task.licenseLevel}`);

        // Test cycling through all levels
        console.log('\n🔄 Testing complete license cycling...');

        const cycleOrder = ['Essential', 'Advantage', 'Signature', 'Essential'];
        let currentTask = task;

        for (let i = 1; i < cycleOrder.length; i++) {
            const targetLevel = cycleOrder[i];
            console.log(`\n   Cycle ${i}: ${currentTask.licenseLevel} -> ${targetLevel}`);

            try {
                const updateResult = await client.mutate({
                    mutation: UPDATE_TASK,
                    variables: {
                        id: currentTask.id,
                        input: {
                            name: `${task.name} - Cycle ${i}`,
                            description: `Task cycled to ${targetLevel} level`,
                            estMinutes: 120,
                            weight: 10,
                            priority: 'Medium',
                            licenseLevel: targetLevel,
                            notes: `Cycled to ${targetLevel} in step ${i}`
                        }
                    }
                });

                currentTask = updateResult.data.updateTask;
                console.log(`   ✅ SUCCESS: Cycled to ${currentTask.licenseLevel}`);

            } catch (error) {
                console.log(`   ❌ FAILED: Could not cycle to ${targetLevel}: ${error.message}`);
                return {
                    success: false,
                    issue: `License cycling failed at step ${i}`,
                    product: product,
                    task: currentTask
                };
            }
        }

        console.log('\n🎉 Complete license cycling test passed!');
        return {
            success: true,
            issue: 'All license cycling completed successfully',
            product: product,
            task: currentTask
        };

    } catch (error) {
        console.error('❌ Fixed data scenario failed:', error.message);
        return {
            success: false,
            issue: error.message,
            product: null,
            task: null
        };
    }
}

async function main() {
    console.log('🔄 TestPanelNew License Cycling Issue Investigation\n');

    // Test 1: Reproduce the failing scenario
    console.log('=== Test 1: Reproducing License Cycling Failure ===');
    const failureTest = await reproduceLicenseCyclingIssue();

    // Test 2: Create proper scenario that should work
    console.log('\n=== Test 2: Creating Working License Cycling Scenario ===');
    const workingTest = await createFixedDataScenario();

    // Summary
    console.log('\n=== Investigation Summary ===');
    console.log(`Failure Reproduction: ${failureTest.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Issue: ${failureTest.issue}`);
    console.log(`Working Scenario: ${workingTest.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Issue: ${workingTest.issue}`);

    // Recommendations
    console.log('\n=== Recommendations ===');
    if (!failureTest.success && failureTest.issue.includes('not working properly')) {
        console.log('🚨 CRITICAL: License validation is not working - tasks can use non-existent license levels');
        console.log('   Solution: Fix backend license validation in task update resolver');
    } else if (failureTest.success) {
        console.log('✅ License validation is working correctly');
        console.log('   The TestPanelNew edit failure is expected when cycling to non-existent license levels');
        console.log('   Solution: Update TestPanelNew to check available license levels before cycling');
    }

    if (workingTest.success) {
        console.log('✅ License cycling works when all license levels are available');
        console.log('   TestPanelNew will work correctly on products with complete license sets');
    }
}

// Run the investigation
main();
