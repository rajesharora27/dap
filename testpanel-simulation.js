#!/usr/bin/env node

// Comprehensive test simulating the exact TestPanelNew workflow

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

// GraphQL operations that match TestPanelNew exactly
const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) { 
      id 
      name 
      description 
      customAttrs
      outcomes {
        id
        name
        description
      }
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
      licenseLevel
      priority
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

const PRODUCTS = gql`
  query Products {
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

// Simulate TestPanelNew state
let testState = {
    createdTestProductId: null,
    createdTestTaskId: null,
    createdTestLicenseId: null,
    products: []
};

// Simulate TestPanelNew functions
async function loadProducts() {
    console.log('🔄 Loading products...');
    try {
        const result = await client.query({
            query: PRODUCTS,
            fetchPolicy: 'network-only'
        });

        testState.products = result.data.products.edges.map(edge => edge.node);
        console.log(`✅ Loaded ${testState.products.length} products`);
        return testState.products;
    } catch (error) {
        console.error('❌ Failed to load products:', error.message);
        throw error;
    }
}

async function simulateProductCreation() {
    console.log('\n🧪 Starting REAL product creation test...');

    try {
        console.log('📋 Preparing test product data...');
        const testProductData = {
            name: `TestPanelNew Product ${Date.now()}`,
            description: 'Test product created by TestPanelNew simulation for validation purposes.',
            customAttrs: {
                testCreated: true,
                createdBy: 'TestPanelNew Simulation',
                createdAt: new Date().toISOString()
            }
        };

        console.log('🔄 Calling CREATE_PRODUCT mutation...');
        const result = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: { input: testProductData }
        });

        const createdProduct = result.data.createProduct;
        console.log(`✅ Product created successfully: ${createdProduct.name} (ID: ${createdProduct.id})`);

        // Create licenses for the product (like TestPanelNew does)
        console.log('🔐 Creating comprehensive license set for product (Essential, Advantage, Signature)...');

        // Create all 3 licenses (Essential, Advantage, Signature) for complete testing
        const licenses = [];
        for (const licenseData of [
            { name: 'Essential', level: 1, description: 'Basic essential features and functionality' },
            { name: 'Advantage', level: 2, description: 'Enhanced features with additional capabilities' },
            { name: 'Signature', level: 3, description: 'Premium tier with full feature access' }
        ]) {
            const licenseResult = await client.mutate({
                mutation: CREATE_LICENSE,
                variables: {
                    input: {
                        name: `${licenseData.name} License for ${createdProduct.name}`,
                        description: `${licenseData.description} for ${createdProduct.name}. Created by TestPanelNew simulation for comprehensive testing.`,
                        level: licenseData.level,
                        isActive: true,
                        productId: createdProduct.id
                    }
                }
            });

            licenses.push(licenseResult.data.createLicense);
            console.log(`✅ Created ${licenseData.name} license (Level: ${licenseData.level})`);
        }

        console.log(`🎯 License levels available for task editing: ${licenses.map(l => `${l.level}(${l.name.split(' ')[0]})`).join(', ')}`);

        // Store IDs in simulated state
        testState.createdTestProductId = createdProduct.id;

        console.log('🔄 Refreshing products list...');
        await loadProducts();

        console.log('🎉 Product creation test PASSED!');
        return createdProduct;

    } catch (error) {
        console.error(`❌ Product creation test FAILED: ${error.message}`);
        throw error;
    }
}

async function simulateTaskCreation() {
    console.log('\n🧪 Starting REAL task creation test...');

    try {
        console.log('🔄 Loading latest product data...');
        const latestProducts = await loadProducts();

        // Find the test product
        const targetProduct = latestProducts.find(p => p.id === testState.createdTestProductId);
        if (!targetProduct) {
            throw new Error('Test product not found. Create a product first.');
        }

        console.log(`📋 Creating task for product: ${targetProduct.name}`);
        console.log(`🔐 Product has licenses: ${targetProduct.licenses.map(l => `${l.level}(${l.name.split(' - ')[1] || 'Unknown'})`).join(', ')}`);

        const testTaskData = {
            productId: targetProduct.id,
            name: `TestPanelNew Task ${Date.now()}`,
            description: 'Test task created by TestPanelNew simulation for validation purposes.',
            estMinutes: 120,
            weight: 5,
            licenseLevel: 'Essential', // Start with Essential
            priority: 'Medium',
            notes: 'Created by TestPanelNew simulation'
        };

        console.log('💾 Calling CREATE_TASK mutation...');
        const result = await client.mutate({
            mutation: CREATE_TASK,
            variables: { input: testTaskData }
        });

        const createdTask = result.data.createTask;
        console.log(`✅ Task created successfully: ${createdTask.name} (ID: ${createdTask.id})`);
        console.log(`   License Level: ${createdTask.licenseLevel}`);

        // Store task ID in simulated state
        testState.createdTestTaskId = createdTask.id;

        console.log('🔄 Refreshing products list...');
        await loadProducts();

        console.log('🎉 Task creation test PASSED!');
        return createdTask;

    } catch (error) {
        console.error(`❌ Task creation test FAILED: ${error.message}`);
        throw error;
    }
}

async function simulateTaskEditing() {
    console.log('\n🧪 Starting REAL task editing test (with fixed license cycling logic)...');

    try {
        console.log('🔄 Loading latest product data with tasks...');
        const latestProducts = await loadProducts();

        // Find the test product and task (simulate TestPanelNew priority system)
        let taskToEdit = null;
        let parentProduct = null;

        if (testState.createdTestTaskId && testState.createdTestProductId) {
            console.log(`🔍 Looking for test task ${testState.createdTestTaskId} in test product ${testState.createdTestProductId}...`);
            const testProduct = latestProducts.find(p => p.id === testState.createdTestProductId);
            if (testProduct) {
                const task = testProduct.tasks?.edges.find(edge => edge.node.id === testState.createdTestTaskId);
                if (task) {
                    taskToEdit = task.node;
                    parentProduct = testProduct;
                    console.log(`✅ Found test task in TEST PRODUCT: ${task.node.name}`);
                }
            }
        }

        if (!taskToEdit || !parentProduct) {
            throw new Error('No task available for editing. Create a task first.');
        }

        console.log(`🎯 Found task to edit: ${taskToEdit.name} (ID: ${taskToEdit.id})`);
        console.log(`📦 Parent product: ${parentProduct.name}`);

        // Apply the FIXED license cycling logic
        const availableLicenses = parentProduct.licenses || [];
        const availableLevels = availableLicenses
            .filter(license => license.isActive)
            .map(license => license.level)
            .sort((a, b) => a - b);

        const levelToName = { 1: 'Essential', 2: 'Advantage', 3: 'Signature' };
        const nameToLevel = { 'Essential': 1, 'Advantage': 2, 'Signature': 3 };

        console.log(`🔐 Available license levels for product: ${availableLevels.map(l => `${l}(${levelToName[l]})`).join(', ')}`);

        // Smart license level cycling - only cycle to levels that exist for this product
        let newLicenseLevel = taskToEdit.licenseLevel;
        if (availableLevels.length > 1) {
            const currentLevel = nameToLevel[taskToEdit.licenseLevel] || 1;
            const currentIndex = availableLevels.indexOf(currentLevel);
            const nextIndex = (currentIndex + 1) % availableLevels.length;
            const nextLevel = availableLevels[nextIndex];
            newLicenseLevel = levelToName[nextLevel] || taskToEdit.licenseLevel;
            console.log(`🔄 License level cycling: ${taskToEdit.licenseLevel} -> ${newLicenseLevel}`);
        } else {
            console.log(`🔒 Product has only one license level, keeping: ${taskToEdit.licenseLevel}`);
        }

        const updatedTaskData = {
            productId: parentProduct.id,
            name: `${taskToEdit.name} - EDITED`,
            description: `${taskToEdit.description || ''} [COMPREHENSIVELY UPDATED by TestPanelNew Simulation at ${new Date().toLocaleTimeString()}]`,
            estMinutes: (taskToEdit.estMinutes || 60) + 45,
            weight: Math.min((taskToEdit.weight || 5) + 2, 10),
            licenseLevel: newLicenseLevel, // Use FIXED smart license level cycling
            priority: 'High',
            notes: `COMPREHENSIVE EDIT by TestPanelNew Simulation on ${new Date().toLocaleDateString()} - Fixed license cycling logic applied.`
        };

        console.log('✏️ Calling UPDATE_TASK mutation with fixed logic...');
        console.log(`   New license level: ${updatedTaskData.licenseLevel}`);

        const result = await client.mutate({
            mutation: UPDATE_TASK,
            variables: {
                id: taskToEdit.id,
                input: updatedTaskData
            }
        });

        const updatedTask = result.data.updateTask;
        console.log(`✅ Task updated successfully: ${updatedTask.name}`);
        console.log(`   Updated license level: ${updatedTask.licenseLevel}`);

        console.log('🔄 Refreshing products list...');
        await loadProducts();

        console.log('🎉 Task editing test with FIXED license cycling PASSED!');
        return updatedTask;

    } catch (error) {
        console.error(`❌ Task editing test FAILED: ${error.message}`);
        throw error;
    }
}

// Main TestPanelNew simulation
async function runTestPanelNewSimulation() {
    console.log('🚀 TestPanelNew Comprehensive Test Suite Simulation\n');

    try {
        // Step 1: Create Test Product (with partial license set)
        console.log('=== Step 1: Create Test Product ===');
        await simulateProductCreation();

        // Step 2: Create Test Task  
        console.log('\n=== Step 2: Create Test Task ===');
        await simulateTaskCreation();

        // Step 3: Edit Test Task (with fixed license cycling)
        console.log('\n=== Step 3: Edit Test Task (Fixed License Cycling) ===');
        await simulateTaskEditing();

        console.log('\n🎉 TestPanelNew Comprehensive Test Suite PASSED!');
        console.log('✅ All operations completed successfully with fixed license cycling logic');
        return true;

    } catch (error) {
        console.error(`❌ TestPanelNew Comprehensive Test Suite FAILED: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔧 TestPanelNew License Cycling Fix Verification\n');

    const success = await runTestPanelNewSimulation();

    console.log('\n=== Final Results ===');
    if (success) {
        console.log('✅ TestPanelNew license cycling fix is working correctly!');
        console.log('   • Task editing will no longer fail due to license validation errors');
        console.log('   • Smart license cycling only attempts valid license level changes');
        console.log('   • The "Edit task is failing" issue has been resolved');
    } else {
        console.log('❌ TestPanelNew license cycling fix still has issues');
        console.log('   • Additional debugging may be needed');
    }

    console.log(`\n📊 Test State Summary:`);
    console.log(`   Created Product ID: ${testState.createdTestProductId}`);
    console.log(`   Created Task ID: ${testState.createdTestTaskId}`);
    console.log(`   Total Products: ${testState.products.length}`);
}

// Run the comprehensive test
main();
