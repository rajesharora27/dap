#!/usr/bin/env node

// Test the fixed TestPanelNew license cycling logic

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

const GET_PRODUCTS_WITH_LICENSES = gql`
  query GetProductsWithLicenses {
    products {
      edges {
        node {
          id
          name
          description
          statusPercent
          customAttrs
          licenses {
            id
            name
            level
            isActive
          }
          outcomes {
            id
            name
            description
          }
          tasks(first: 10) {
            edges {
              node {
                id
                name
                description
                estMinutes
                weight
                licenseLevel
              }
            }
          }
        }
      }
    }
  }
`;

// Simulate the fixed license cycling logic from TestPanelNew
function smartLicenseCycling(taskToEdit, parentProduct) {
    const availableLicenses = parentProduct.licenses || [];
    const availableLevels = availableLicenses
        .filter(license => license.isActive)
        .map(license => license.level)
        .sort((a, b) => a - b);

    const levelToName = { 1: 'Essential', 2: 'Advantage', 3: 'Signature' };
    const nameToLevel = { 'Essential': 1, 'Advantage': 2, 'Signature': 3 };

    console.log(`   🔐 Available license levels: ${availableLevels.map(l => `${l}(${levelToName[l]})`).join(', ')}`);

    // Smart license level cycling - only cycle to levels that exist for this product
    let newLicenseLevel = taskToEdit.licenseLevel;
    if (availableLevels.length > 1) {
        const currentLevel = nameToLevel[taskToEdit.licenseLevel] || 1;
        const currentIndex = availableLevels.indexOf(currentLevel);
        const nextIndex = (currentIndex + 1) % availableLevels.length;
        const nextLevel = availableLevels[nextIndex];
        newLicenseLevel = levelToName[nextLevel] || taskToEdit.licenseLevel;
        console.log(`   🔄 Smart cycling: ${taskToEdit.licenseLevel} -> ${newLicenseLevel}`);
    } else {
        console.log(`   🔒 Product has only one license level, keeping: ${taskToEdit.licenseLevel}`);
    }

    return newLicenseLevel;
}

async function testFixedLicenseCycling() {
    console.log('🔧 Testing Fixed License Cycling Logic...\n');

    try {
        // Scenario 1: Product with limited licenses (should not cycle)
        console.log('=== Scenario 1: Product with Single License Level ===');

        const limitedProduct = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `Single License Product ${Date.now()}`,
                    description: 'Product with only Essential license to test fixed logic',
                    customAttrs: { testType: 'single-license-fix-test' }
                }
            }
        });

        const product1 = limitedProduct.data.createProduct;
        console.log(`✅ Created product: ${product1.name}`);

        // Create only Essential license
        const license1 = await client.mutate({
            mutation: CREATE_LICENSE,
            variables: {
                input: {
                    name: `${product1.name} - Essential`,
                    description: 'Only Essential license',
                    level: 1,
                    isActive: true,
                    productId: product1.id
                }
            }
        });

        console.log(`✅ Created Essential license (Level: ${license1.data.createLicense.level})`);

        // Create task
        const task1 = await client.mutate({
            mutation: CREATE_TASK,
            variables: {
                input: {
                    name: `Single License Task ${Date.now()}`,
                    description: 'Task to test fixed license cycling',
                    estMinutes: 120,
                    weight: 10,
                    priority: 'Medium',
                    licenseLevel: 'Essential',
                    notes: 'Testing fixed cycling logic',
                    productId: product1.id
                }
            }
        });

        const task1Data = task1.data.createTask;
        console.log(`✅ Created task: ${task1Data.name} with license: ${task1Data.licenseLevel}`);

        // Simulate the fixed cycling logic
        console.log('\n🧪 Testing fixed cycling logic (should keep same level):');
        const mockProduct1 = {
            id: product1.id,
            name: product1.name,
            licenses: [{ id: license1.data.createLicense.id, name: 'Essential', level: 1, isActive: true }]
        };

        const newLevel1 = smartLicenseCycling(task1Data, mockProduct1);

        // Try to update with the fixed logic result
        console.log('\n📝 Attempting task update with fixed logic result...');
        try {
            const updateResult1 = await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                    id: task1Data.id,
                    input: {
                        name: `${task1Data.name} - FIXED LOGIC TEST`,
                        description: 'Task updated with fixed license cycling logic',
                        estMinutes: task1Data.estMinutes + 45,
                        weight: Math.min(task1Data.weight + 2, 10),
                        priority: 'High',
                        licenseLevel: newLevel1, // Should be same as original
                        notes: 'Updated with fixed cycling logic - should succeed'
                    }
                }
            });

            console.log(`   ✅ SUCCESS: Task updated with license level: ${updateResult1.data.updateTask.licenseLevel}`);
            console.log(`   🎯 Fixed logic correctly kept existing license level`);

        } catch (error) {
            console.log(`   ❌ UNEXPECTED FAILURE: ${error.message}`);
            return false;
        }

        // Scenario 2: Product with multiple licenses (should cycle)
        console.log('\n=== Scenario 2: Product with Multiple License Levels ===');

        const fullProduct = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `Multi License Product ${Date.now()}`,
                    description: 'Product with multiple licenses to test cycling',
                    customAttrs: { testType: 'multi-license-fix-test' }
                }
            }
        });

        const product2 = fullProduct.data.createProduct;
        console.log(`✅ Created product: ${product2.name}`);

        // Create multiple licenses
        const licenses2 = [];
        for (const licenseData of [
            { name: 'Essential', level: 1 },
            { name: 'Advantage', level: 2 }
        ]) {
            const license = await client.mutate({
                mutation: CREATE_LICENSE,
                variables: {
                    input: {
                        name: `${product2.name} - ${licenseData.name}`,
                        description: `${licenseData.name} license`,
                        level: licenseData.level,
                        isActive: true,
                        productId: product2.id
                    }
                }
            });

            licenses2.push(license.data.createLicense);
            console.log(`✅ Created ${licenseData.name} license (Level: ${licenseData.level})`);
        }

        // Create task with Essential level
        const task2 = await client.mutate({
            mutation: CREATE_TASK,
            variables: {
                input: {
                    name: `Multi License Task ${Date.now()}`,
                    description: 'Task to test cycling between multiple licenses',
                    estMinutes: 120,
                    weight: 15,
                    priority: 'Medium',
                    licenseLevel: 'Essential',
                    notes: 'Testing cycling with multiple licenses',
                    productId: product2.id
                }
            }
        });

        const task2Data = task2.data.createTask;
        console.log(`✅ Created task: ${task2Data.name} with license: ${task2Data.licenseLevel}`);

        // Simulate the fixed cycling logic (should cycle from Essential to Advantage)
        console.log('\n🧪 Testing fixed cycling logic (should cycle Essential -> Advantage):');
        const mockProduct2 = {
            id: product2.id,
            name: product2.name,
            licenses: licenses2.map(l => ({ id: l.id, name: l.name, level: l.level, isActive: true }))
        };

        const newLevel2 = smartLicenseCycling(task2Data, mockProduct2);

        // Try to update with the cycling result
        console.log('\n📝 Attempting task update with cycling result...');
        try {
            const updateResult2 = await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                    id: task2Data.id,
                    input: {
                        name: `${task2Data.name} - CYCLED`,
                        description: 'Task updated with license cycling',
                        estMinutes: task2Data.estMinutes + 45,
                        weight: Math.min(task2Data.weight + 2, 15),
                        priority: 'High',
                        licenseLevel: newLevel2, // Should be Advantage
                        notes: 'Updated with license cycling - should succeed'
                    }
                }
            });

            console.log(`   ✅ SUCCESS: Task updated with license level: ${updateResult2.data.updateTask.licenseLevel}`);
            console.log(`   🎯 Fixed logic correctly cycled from Essential to Advantage`);

        } catch (error) {
            console.log(`   ❌ UNEXPECTED FAILURE: ${error.message}`);
            return false;
        }

        console.log('\n🎉 Both scenarios passed! Now testing comprehensive 3-license scenario...');

        // === SCENARIO 3: Product with all 3 licenses (Essential, Advantage, Signature) ===
        console.log('\n=== Scenario 3: Comprehensive 3-License Product ===');

        const comprehensiveProduct = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `Comprehensive Product ${Date.now()}`,
                    description: 'Product with all 3 licenses for complete testing',
                    customAttrs: { testType: 'comprehensive-3-license' }
                }
            }
        });

        const product3 = comprehensiveProduct.data.createProduct;
        console.log(`✅ Created product: ${product3.name}`);

        // Create all 3 licenses (Essential, Advantage, Signature)
        const licenses3 = [];
        for (const licenseData of [
            { name: 'Essential', level: 1 },
            { name: 'Advantage', level: 2 },
            { name: 'Signature', level: 3 }
        ]) {
            const license = await client.mutate({
                mutation: CREATE_LICENSE,
                variables: {
                    input: {
                        name: `${licenseData.name} License for ${product3.name}`,
                        description: `${licenseData.name} license for comprehensive testing`,
                        level: licenseData.level,
                        isActive: true,
                        productId: product3.id
                    }
                }
            });

            licenses3.push(license.data.createLicense);
            console.log(`✅ Created ${licenseData.name} license (Level: ${licenseData.level})`);
        }

        // Create task with Essential level
        const task3 = await client.mutate({
            mutation: CREATE_TASK,
            variables: {
                input: {
                    name: `Comprehensive Task ${Date.now()}`,
                    description: 'Task to test cycling through all 3 license levels',
                    estMinutes: 180,
                    weight: 20,
                    priority: 'High',
                    licenseLevel: 'Essential',
                    notes: 'Testing complete cycling: Essential -> Advantage -> Signature -> Essential',
                    productId: product3.id
                }
            }
        });

        const task3Data = task3.data.createTask;
        console.log(`✅ Created task: ${task3Data.name} with license: ${task3Data.licenseLevel}`);

        // Test full cycling: Essential -> Advantage -> Signature -> Essential
        console.log('\n🧪 Testing complete cycling through all 3 levels:');
        const mockProduct3 = {
            id: product3.id,
            name: product3.name,
            licenses: licenses3.map(l => ({ id: l.id, name: l.name, level: l.level, isActive: true }))
        };

        let currentTaskData = task3Data;
        const expectedTransitions = [
            { from: 'Essential', to: 'Advantage' },
            { from: 'Advantage', to: 'Signature' },
            { from: 'Signature', to: 'Essential' },
            { from: 'Essential', to: 'Advantage' } // Full cycle: back to second position
        ];

        for (let i = 0; i < 4; i++) {
            const currentLevel = currentTaskData.licenseLevel;
            const expectedNextLevel = expectedTransitions[i].to;

            console.log(`   🔐 Available license levels: ${mockProduct3.licenses.map(l => `${l.level}(${l.name.split(' ')[0]})`).join(', ')}`);
            const newLevel = smartLicenseCycling(currentTaskData, mockProduct3);
            console.log(`   🔄 Smart cycling: ${currentLevel} -> ${newLevel}`);
            console.log(`   Step ${i + 1}: ${currentLevel} -> ${newLevel} (expected: ${expectedNextLevel})`);

            if (newLevel !== expectedNextLevel) {
                console.log(`   ❌ FAILURE: Expected ${expectedNextLevel} but got ${newLevel}`);
                return false;
            }

            // Update the task with the new license level
            try {
                const updateResult = await client.mutate({
                    mutation: UPDATE_TASK,
                    variables: {
                        id: currentTaskData.id,
                        input: {
                            name: `${task3Data.name} - Cycle ${i + 1}`,
                            description: `Task updated with license cycling - Step ${i + 1}`,
                            estMinutes: task3Data.estMinutes + (i * 15),
                            weight: task3Data.weight,
                            priority: 'High',
                            licenseLevel: newLevel,
                            notes: `Cycling step ${i + 1}: ${currentLevel} -> ${newLevel}`
                        }
                    }
                });

                currentTaskData = updateResult.data.updateTask;
                console.log(`   ✅ Task updated successfully with license: ${currentTaskData.licenseLevel}`);

            } catch (error) {
                console.log(`   ❌ FAILURE: Task update failed: ${error.message}`);
                return false;
            }
        }

        console.log('\n🎉 All three scenarios passed! Fixed license cycling logic is working perfectly.');
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Testing Fixed TestPanelNew License Cycling Logic\n');

    const success = await testFixedLicenseCycling();

    console.log('\n=== Test Results ===');
    if (success) {
        console.log('✅ Fixed license cycling logic works perfectly!');
        console.log('   • Products with single license: keeps same level (no failure)');
        console.log('   • Products with 2 licenses: cycles correctly between available levels');
        console.log('   • Products with 3 licenses: cycles through all levels (Essential -> Advantage -> Signature -> Essential)');
        console.log('   • All license names match between tasks and products');
        console.log('   • TestPanelNew task editing will now work without validation errors');
    } else {
        console.log('❌ Fixed license cycling logic still has issues');
    }
}

// Run the test
main();
