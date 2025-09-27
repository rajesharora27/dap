// Frontend TestPanelNew Task Creation Issue Reproduction
// This script reproduces the exact conditions causing TestPanelNew task creation failures

const { ApolloClient, InMemoryCache, createHttpLink, gql } = require('@apollo/client');

// Apollo Client setup matching frontend configuration
const httpLink = createHttpLink({
    uri: 'http://localhost:4000/graphql',
    headers: {
        'authorization': 'admin'
    }
});

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'network-only',
        },
        query: {
            fetchPolicy: 'network-only',
        },
    },
});

// GraphQL queries matching TestPanelNew
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
            description
          }
          outcomes {
            id
            name
            description
          }
          tasks(first: 50) {
            edges {
              node {
                id
                name
                description
                estMinutes
                weight
                licenseLevel
                priority
                notes
                sequenceNumber
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
      sequenceNumber
    }
  }
`;

// Simulate exact TestPanelNew task creation logic
async function simulateTestPanelNewTaskCreation() {
    console.log('🧪 === TESTPANELNEW TASK CREATION SIMULATION ===');
    console.log('Reproducing exact conditions from TestPanelNew component\n');

    try {
        // Step 1: Load products (exact same as TestPanelNew)
        console.log('🔄 Loading latest product data...');
        const result = await client.query({
            query: PRODUCTS,
            fetchPolicy: 'network-only'
        });

        const latestProducts = result.data.products.edges.map(edge => edge.node);
        console.log(`✅ Loaded ${latestProducts.length} products`);

        // Step 2: Find target product (use first available like TestPanelNew fallback)
        let targetProduct = null;
        if (latestProducts.length > 0) {
            targetProduct = latestProducts[0]; // Use first available product
            console.log(`🎯 Using product: ${targetProduct.name} (${targetProduct.id})`);
        } else {
            throw new Error('No products available for task creation');
        }

        // Step 3: Determine license level (exact TestPanelNew logic)
        let validLicenseLevel = 'Essential'; // Default
        if (targetProduct.licenses && targetProduct.licenses.length > 0) {
            console.log(`🔐 Available licenses for product: ${targetProduct.licenses.length}`);
            targetProduct.licenses.forEach((license, index) => {
                console.log(`     [${index}] ${license.name} (Level: ${license.level}, Active: ${license.isActive})`);
            });

            try {
                // Test the FIXED approach (create copy then sort)  
                console.log('   🧪 Using FIXED approach (copy then sort)...');
                const sortedLicenses = [...targetProduct.licenses].sort((a, b) => a.level - b.level);
                const lowestLicense = sortedLicenses[0];

                // Map license levels to GraphQL enum values (exact TestPanelNew mapping)
                const levelToEnum = {
                    1: 'Essential',
                    2: 'Advantage',
                    3: 'Signature'
                };

                validLicenseLevel = levelToEnum[lowestLicense.level] || 'Essential';
                console.log(`   ✅ Selected license level: ${validLicenseLevel} (level ${lowestLicense.level})`);
            } catch (error) {
                console.log(`   ❌ License level determination failed: ${error.message}`);
                console.log('   📋 Using default: Essential');
            }
        } else {
            console.log('   No licenses found, using default: Essential');
        }

        // Step 4: Calculate weight allocation (exact TestPanelNew logic)
        console.log('⚖️ Validating task weight allocation...');
        const currentTasks = targetProduct.tasks?.edges || [];
        const usedWeight = currentTasks.reduce((sum, edge) => sum + (edge.node.weight || 0), 0);
        const remainingWeight = 100 - usedWeight;

        console.log(`   Current weight usage: ${usedWeight}%`);
        console.log(`   Remaining weight: ${remainingWeight}%`);

        let taskWeight = 5; // TestPanelNew default

        if (taskWeight > remainingWeight) {
            // Use TestPanelNew's weight adjustment logic
            taskWeight = Math.max(1, Math.min(remainingWeight - 0.1, 3)); // Leave 0.1% buffer

            // If remaining weight is very small (less than 1%), use the exact remaining weight
            if (remainingWeight < 1 && remainingWeight > 0) {
                taskWeight = Math.floor(remainingWeight * 10) / 10; // Round down to 1 decimal
            }

            // If no weight is available, should fail
            if (remainingWeight <= 0) {
                throw new Error(`No weight capacity available for new tasks. Product weight is fully allocated (${usedWeight}%).`);
            }
        }

        console.log(`   📊 Task weight will be: ${taskWeight}%`);

        // Step 5: Create task data (exact TestPanelNew format)
        const testTaskData = {
            productId: targetProduct.id,
            name: `Test Task ${Date.now()}`,
            description: 'This is a test task created by the GUI Test Studio for validation purposes.',
            estMinutes: 120,
            weight: taskWeight,
            licenseLevel: validLicenseLevel,
            priority: 'Medium',
            notes: 'Created by GUI Test Studio automated test'
        };

        console.log('\n📋 Task data prepared:');
        console.log('   Product:', targetProduct.name);
        console.log('   Name:', testTaskData.name);
        console.log('   Est Minutes:', testTaskData.estMinutes);
        console.log('   Weight:', testTaskData.weight + '%');
        console.log('   License Level:', testTaskData.licenseLevel);
        console.log('   Priority:', testTaskData.priority);

        // Step 6: Create the task (exact TestPanelNew mutation call)
        console.log('\n💾 Step 1: Calling CREATE_TASK mutation...');
        const createResult = await client.mutate({
            mutation: CREATE_TASK,
            variables: { input: testTaskData }
        });

        const createdTask = createResult.data.createTask;
        console.log(`✅ Step 2: Task created successfully: ${createdTask.name} (ID: ${createdTask.id})`);

        // Step 7: Simulate TestPanelNew's verification process
        console.log('⏳ Step 3: Waiting for database consistency...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('🧹 Step 4: Clearing Apollo cache...');
        await client.clearStore();

        console.log('🔄 Step 5: Refreshing products list with fresh data...');
        const refreshResult = await client.query({
            query: PRODUCTS,
            fetchPolicy: 'network-only'
        });

        // Step 8: Verification (exact TestPanelNew logic)
        console.log('🔍 Step 6: Verifying task creation and visibility...');
        const refreshedProducts = refreshResult.data.products.edges.map(edge => edge.node);
        let taskFound = false;
        let foundInProduct = null;

        for (const product of refreshedProducts) {
            const task = product.tasks?.edges.find(edge => edge.node.id === createdTask.id);
            if (task) {
                taskFound = true;
                foundInProduct = product.name;
                console.log(`✅ Task verified: Found "${task.node.name}" in product "${product.name}"`);
                console.log(`   Task details: Weight=${task.node.weight}%, Minutes=${task.node.estMinutes}, License=${task.node.licenseLevel}`);
                break;
            }
        }

        if (!taskFound) {
            throw new Error(`Task creation verification failed: Task "${createdTask.name}" (${createdTask.id}) not found in any product. Backend creation may have failed or there's a data consistency issue.`);
        }

        console.log('\n🎉 === SUCCESS ===');
        console.log('✅ Task creation test PASSED with verification!');
        console.log(`📋 Created: ${createdTask.name}`);
        console.log(`🏷️  Task ID: ${createdTask.id}`);
        console.log(`📍 Found in: ${foundInProduct}`);
        console.log(`⚖️  Weight: ${createdTask.weight}%`);
        console.log(`🕐 Duration: ${createdTask.estMinutes} minutes`);
        console.log(`🔐 License: ${createdTask.licenseLevel}`);

        return {
            success: true,
            taskId: createdTask.id,
            taskName: createdTask.name,
            productName: foundInProduct
        };

    } catch (error) {
        console.error('\n❌ === FAILURE ===');
        console.error('Task creation test FAILED:', error.message);
        console.error('\n🔧 Debugging Information:');
        console.error('Error type:', error.constructor.name);

        if (error.graphQLErrors) {
            console.error('GraphQL Errors:', error.graphQLErrors);
        }

        if (error.networkError) {
            console.error('Network Error:', error.networkError);
        }

        // Analyze common failure patterns
        if (error.message.includes('estMinutes') || error.message.includes('weight')) {
            console.error('\n💡 ANALYSIS: Required field missing');
            console.error('   - estMinutes and weight are required fields');
            console.error('   - TestPanelNew should always provide these fields');
            console.error('   - Check that TaskInput interface matches backend schema');
        }

        if (error.message.includes('Sequence number already exists')) {
            console.error('\n💡 ANALYSIS: Sequence number conflict');
            console.error('   - Backend enforces unique sequence numbers per product');
            console.error('   - TestPanelNew should either omit sequenceNumber or use unique values');
            console.error('   - Consider auto-incrementing sequence numbers');
        }

        if (error.message.includes('Cannot assign to read only property')) {
            console.error('\n💡 ANALYSIS: GraphQL data mutation attempt');
            console.error('   - GraphQL query results are read-only');
            console.error('   - Use spread operator [...array] before sorting');
            console.error('   - This should be fixed in current TestPanelNew version');
        }

        return {
            success: false,
            error: error.message,
            type: error.constructor.name
        };
    }
}

// Additional diagnostic tests
async function runDiagnosticTests() {
    console.log('\n🔬 === DIAGNOSTIC TESTS ===');

    // Test 1: Schema introspection for TaskInput
    console.log('\n📋 Test 1: TaskInput Schema Validation');
    try {
        const schemaQuery = gql`
      query IntrospectTaskInput {
        __type(name: "TaskInput") {
          fields {
            name
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    `;

        const result = await client.query({ query: schemaQuery });
        const fields = result.data.__type.fields;

        console.log('   TaskInput required fields:');
        fields.forEach(field => {
            const isRequired = field.type.kind === 'NON_NULL';
            const typeName = field.type.ofType ? field.type.ofType.name : field.type.name;
            console.log(`   - ${field.name}: ${typeName}${isRequired ? ' (REQUIRED)' : ' (optional)'}`);
        });
    } catch (error) {
        console.error('   ❌ Schema introspection failed:', error.message);
    }

    // Test 2: Minimal valid task creation
    console.log('\n📋 Test 2: Minimal Valid Task');
    try {
        const products = await client.query({ query: PRODUCTS });
        const firstProduct = products.data.products.edges[0]?.node;

        if (firstProduct) {
            const minimalTask = {
                productId: firstProduct.id,
                name: `Diagnostic Task ${Date.now()}`,
                estMinutes: 60, // Required
                weight: 1, // Required
                licenseLevel: 'Essential',
                priority: 'Low'
            };

            const result = await client.mutate({
                mutation: CREATE_TASK,
                variables: { input: minimalTask }
            });

            console.log(`   ✅ Minimal task created: ${result.data.createTask.name}`);
        }
    } catch (error) {
        console.error('   ❌ Minimal task creation failed:', error.message);
    }

    // Test 3: Current product state
    console.log('\n📋 Test 3: Current Products State');
    try {
        const result = await client.query({ query: PRODUCTS });
        const products = result.data.products.edges.map(edge => edge.node);

        console.log(`   Found ${products.length} products:`);
        products.forEach((product, index) => {
            const taskCount = product.tasks?.edges?.length || 0;
            const totalWeight = product.tasks?.edges?.reduce((sum, edge) => sum + (edge.node.weight || 0), 0) || 0;
            console.log(`   ${index + 1}. ${product.name}`);
            console.log(`      - ID: ${product.id}`);
            console.log(`      - Tasks: ${taskCount}`);
            console.log(`      - Weight Used: ${totalWeight}%`);
            console.log(`      - Weight Available: ${100 - totalWeight}%`);
            console.log(`      - Licenses: ${product.licenses?.length || 0}`);
        });
    } catch (error) {
        console.error('   ❌ Products state check failed:', error.message);
    }
}

// Main execution
async function main() {
    console.log('🚀 TestPanelNew Task Creation Issue Analysis');
    console.log('===========================================\n');

    // Run the main simulation
    const result = await simulateTestPanelNewTaskCreation();

    // Run diagnostic tests
    await runDiagnosticTests();

    // Final analysis
    console.log('\n📊 === FINAL ANALYSIS ===');
    if (result.success) {
        console.log('🎉 TestPanelNew task creation logic is working correctly!');
        console.log('   The issue may be in the frontend implementation or state management.');
        console.log('\n💡 Next steps:');
        console.log('   1. Check TypeScript compilation errors in TestPanelNew.tsx');
        console.log('   2. Verify Apollo Client configuration in frontend');
        console.log('   3. Check browser console for runtime errors');
        console.log('   4. Verify state management and cache clearing');
    } else {
        console.log('❌ TestPanelNew task creation logic has issues!');
        console.log(`   Error: ${result.error}`);
        console.log('\n🔧 Recommended fixes:');
        console.log('   1. Ensure estMinutes and weight are always provided');
        console.log('   2. Handle sequenceNumber conflicts (omit or use unique values)');
        console.log('   3. Fix GraphQL data mutation issues with read-only arrays');
        console.log('   4. Add proper error handling for validation failures');
    }

    return result;
}

// Execute the analysis
main();
