const { ApolloClient, InMemoryCache, gql } = require('@apollo/client');
const { createHttpLink } = require('@apollo/client/link/http');
const fetch = require('cross-fetch');

// Create Apollo Client instance
const client = new ApolloClient({
    link: createHttpLink({
        uri: 'http://localhost:4000/graphql', // Update with your GraphQL endpoint
        fetch
    }),
    cache: new InMemoryCache()
});

// GraphQL Mutations and Queries
const CREATE_PRODUCT = gql`
    mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
            id
            name
            description
            customAttrs
            statusPercent
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
            sequenceNumber
        }
    }
`;

const DELETE_TASK = gql`
    mutation DeleteTask($id: ID!) {
        queueTaskSoftDelete(id: $id)
    }
`;

const DELETE_PRODUCT = gql`
    mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
    }
`;

// Test Data Generation
const generateTestProduct = (index = 0) => ({
    name: `Test Product ${index + 1}`,
    description: `Automated test product ${index + 1}`,
    customAttrs: {
        testId: new Date().toISOString(),
        purpose: 'automated_testing',
        testIndex: index,
        testMode: 'automated',
        testCategory: ['basic', 'extended', 'performance'][index % 3],
        testPriority: ['high', 'medium', 'low'][index % 3],
        testComplexity: Math.floor(index / 3) + 1
    }
});

const generateTestTask = (index = 0) => ({
    name: `Test Task ${index + 1}`,
    description: `Automated test task ${index + 1} - ${['Setup', 'Configuration', 'Validation', 'Integration', 'Performance'][index % 5]}`,
    estMinutes: 30 + (index * 15),
    weight: 10 + (index * 5),
    priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][index % 4],
    notes: `Generated test task ${index + 1} - Automated test sequence ${Math.floor(index / 4) + 1}`,
    customAttrs: JSON.stringify({
        testId: new Date().toISOString(),
        testIndex: index,
        testPhase: ['setup', 'execution', 'validation'][index % 3],
        testSuite: Math.floor(index / 3) + 1,
        automationLevel: ['full', 'partial', 'manual'][index % 3],
        testDependencies: index > 0 ? [`task-${index-1}`] : [],
        expectedDuration: 30 + (index * 15)
    })
});

// Test Runner Functions
async function runProductCreationTest() {
    console.log('🏗️ Running Product Creation Test...');
    try {
        const result = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: generateTestProduct(0)
            }
        });
        console.log('✅ Product created successfully:', result.data.createProduct);
        return result.data.createProduct.id;
    } catch (error) {
        console.error('❌ Product creation failed:', error.message);
        throw error;
    }
}

async function runTaskCreationTest(productId) {
    console.log('📋 Running Task Creation Test...');
    const tasks = [];
    try {
        for (let i = 0; i < 3; i++) {
            const result = await client.mutate({
                mutation: CREATE_TASK,
                variables: {
                    input: {
                        ...generateTestTask(i),
                        productId
                    }
                }
            });
            tasks.push(result.data.createTask);
            console.log(`✅ Task ${i + 1} created successfully:`, result.data.createTask.name);
        }
        return tasks;
    } catch (error) {
        console.error('❌ Task creation failed:', error.message);
        throw error;
    }
}

async function runTaskDeletionTest(tasks) {
    console.log('🗑️ Running Task Deletion Test...');
    try {
        for (const task of tasks) {
            await client.mutate({
                mutation: DELETE_TASK,
                variables: { id: task.id }
            });
            console.log(`✅ Task deleted successfully: ${task.name}`);
        }
    } catch (error) {
        console.error('❌ Task deletion failed:', error.message);
        throw error;
    }
}

async function runProductDeletionTest(productId) {
    console.log('🗑️ Running Product Deletion Test...');
    try {
        await client.mutate({
            mutation: DELETE_PRODUCT,
            variables: { id: productId }
        });
        console.log('✅ Product deleted successfully');
    } catch (error) {
        console.error('❌ Product deletion failed:', error.message);
        throw error;
    }
}

// Main Test Sequence
async function runAllTests() {
    console.log('🚀 Starting automated test sequence...');
    try {
        // Create test product
        const productId = await runProductCreationTest();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay between operations

        // Create test tasks
        const tasks = await runTaskCreationTest(productId);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Delete tasks
        await runTaskDeletionTest(tasks);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Delete product
        await runProductDeletionTest(productId);

        console.log('🎉 All tests completed successfully!');
    } catch (error) {
        console.error('❌ Test sequence failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });