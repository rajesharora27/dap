#!/usr/bin/env node

// Comprehensive test to reproduce and verify the task creation fix

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

// Simulate the exact task creation logic from TestPanelNew
async function simulateTaskCreationLogic() {
    console.log('🧪 Simulating TestPanelNew Task Creation Logic...\n');

    try {
        // Step 1: Load products (exact same as TestPanelNew)
        console.log('🔄 Loading latest product data...');
        const result = await client.query({
            query: PRODUCTS,
            fetchPolicy: 'network-only'
        });

        const latestProducts = result.data.products.edges.map(edge => edge.node);
        console.log(`✅ Loaded ${latestProducts.length} products`);

        // Step 2: Find target product (use test product if available, otherwise first available)
        let targetProduct = null;

        // Look for test products first
        targetProduct = latestProducts.find(p => p.name.includes('Test Product') || p.customAttrs?.testCreated);

        if (targetProduct) {
            console.log(`🎯 Using TEST PRODUCT: ${targetProduct.name} (ID: ${targetProduct.id})`);
        } else if (latestProducts.length > 0) {
            targetProduct = latestProducts[0];
            console.log(`🎯 Fallback: Using first available product: ${targetProduct.name}`);
        }

        if (!targetProduct) {
            throw new Error('No product available for task creation');
        }

        console.log(`📋 Creating task for product: ${targetProduct.name}`);

        // Step 3: Determine valid license level - THIS IS WHERE THE ERROR OCCURRED
        console.log('\n🔐 Determining valid license level...');
        let validLicenseLevel = 'Essential'; // Default

        if (targetProduct.licenses && targetProduct.licenses.length > 0) {
            console.log(`   Product has ${targetProduct.licenses.length} licenses`);

            // LOG THE EXACT LICENSES ARRAY TO DEBUG
            console.log('   Licenses array details:');
            targetProduct.licenses.forEach((license, index) => {
                console.log(`     [${index}] ${license.name} (Level: ${license.level}, Active: ${license.isActive})`);
            });

            // Test the OLD approach that was causing errors
            console.log('\n   🧪 Testing OLD approach (direct sort)...');
            try {
                const directSortResult = targetProduct.licenses.sort((a, b) => a.level - b.level);
                console.log(`   ✅ Direct sort succeeded - got ${directSortResult.length} licenses`);

                // Test accessing the first element
                const firstLicense = directSortResult[0];
                console.log(`   ✅ First license access succeeded: ${firstLicense.name}`);

            } catch (error) {
                console.log(`   ❌ Direct sort failed: ${error.message}`);
            }

            // Test the NEW approach (create copy then sort)  
            console.log('\n   🧪 Testing NEW approach (copy then sort)...');
            try {
                const sortedLicenses = [...targetProduct.licenses].sort((a, b) => a.level - b.level);
                const lowestLicense = sortedLicenses[0];

                // Map license levels to GraphQL enum values
                const levelToEnum = {
                    1: 'Essential',
                    2: 'Advantage',
                    3: 'Signature'
                };

                validLicenseLevel = levelToEnum[lowestLicense.level] || 'Essential';
                console.log(`   ✅ Copy+sort succeeded: Selected license level: ${validLicenseLevel} (level ${lowestLicense.level})`);

            } catch (error) {
                console.log(`   ❌ Copy+sort failed: ${error.message}`);
                throw error;
            }
        } else {
            console.log('   No licenses found, using default: Essential');
        }

        // Step 4: Create the task data
        const testTaskData = {
            productId: targetProduct.id,
            name: `Debug Task Creation ${Date.now()}`,
            description: 'Task created to test the array mutation fix',
            estMinutes: 120,
            weight: 5,
            licenseLevel: validLicenseLevel,
            priority: 'Medium',
            notes: 'Testing read-only array fix'
        };

        console.log(`\n📋 Task data prepared:`);
        console.log(`   Product: ${targetProduct.name}`);
        console.log(`   License Level: ${testTaskData.licenseLevel}`);
        console.log(`   Weight: ${testTaskData.weight}%`);

        // Step 5: Create the task
        console.log('\n💾 Calling CREATE_TASK mutation...');
        const taskResult = await client.mutate({
            mutation: CREATE_TASK,
            variables: { input: testTaskData }
        });

        const createdTask = taskResult.data.createTask;
        console.log(`✅ Task created successfully: ${createdTask.name} (ID: ${createdTask.id})`);
        console.log(`   License Level: ${createdTask.licenseLevel}`);

        return {
            success: true,
            productId: targetProduct.id,
            taskId: createdTask.id,
            licenseLevel: createdTask.licenseLevel
        };

    } catch (error) {
        console.error(`❌ Task creation simulation FAILED: ${error.message}`);
        console.error('Full error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function main() {
    console.log('🚀 TestPanelNew Task Creation Error Reproduction & Fix Test\n');
    console.log('This test simulates the exact conditions that caused the');
    console.log('"Cannot assign to read only property \'0\' of object \'[object Array]\'" error.\n');

    const result = await simulateTaskCreationLogic();

    console.log('\n=== Final Results ===');
    if (result.success) {
        console.log('✅ SUCCESS: Task creation is now working correctly!');
        console.log(`   - Created task ID: ${result.taskId}`);
        console.log(`   - License level: ${result.licenseLevel}`);
        console.log('   - The read-only array issue has been resolved');
        console.log('   - TestPanelNew task creation should work in the GUI');
    } else {
        console.log('❌ FAILURE: Task creation is still failing');
        console.log(`   - Error: ${result.error}`);
        console.log('   - The issue may not be fully resolved');
    }

    console.log('\n💡 If successful, this confirms the fix:');
    console.log('   [...targetProduct.licenses].sort() instead of targetProduct.licenses.sort()');
}

// Run the comprehensive test
main();
