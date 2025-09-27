const { ApolloClient, InMemoryCache, createHttpLink } = require('@apollo/client');
const { gql } = require('@apollo/client');

// Apollo Client setup
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
        }
    }
});

const CREATE_PRODUCT = gql`
    mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
            id
            name
            description
        }
    }
`;

const CREATE_LICENSE = gql`
    mutation CreateLicense($input: LicenseInput!) {
        createLicense(input: $input) {
            id
            name
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
            sequenceNumber
        }
    }
`;

const GET_PRODUCT_TASKS = gql`
    query GetProductTasks {
        products {
            edges {
                node {
                    id
                    name
                    tasks(first: 20) {
                        edges {
                            node {
                                id
                                name
                                sequenceNumber
                            }
                        }
                    }
                }
            }
        }
    }
`;

const DELETE_TASK = gql`
    mutation QueueTaskSoftDelete($id: ID!) {
        queueTaskSoftDelete(id: $id)
    }
`;

const PROCESS_DELETIONS = gql`
    mutation ProcessDeletionQueue {
        processDeletionQueue
    }
`;

async function testSequenceReordering() {
    console.log('🧪 Testing sequence number reordering after task deletion...\n');

    try {
        // 1. Create a test product
        const productResult = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `Reorder Test Product ${Date.now()}`,
                    description: 'Testing sequence reordering'
                }
            }
        });

        const product = productResult.data.createProduct;
        console.log(`✅ Created product: ${product.name}`);

        // 2. Create license
        await client.mutate({
            mutation: CREATE_LICENSE,
            variables: {
                input: {
                    name: `${product.name} License`,
                    level: 1,
                    isActive: true,
                    productId: product.id
                }
            }
        });
        console.log(`✅ Created license for product`);

        // 3. Create 5 tasks sequentially
        const tasks = [];
        for (let i = 1; i <= 5; i++) {
            const taskResult = await client.mutate({
                mutation: CREATE_TASK,
                variables: {
                    input: {
                        productId: product.id,
                        name: `Task ${i}`,
                        description: `Test task ${i}`,
                        estMinutes: 60,
                        weight: 5,
                        licenseLevel: 'Essential',
                        priority: 'Medium'
                    }
                }
            });
            tasks.push(taskResult.data.createTask);
            console.log(`✅ Created Task ${i} with sequence: ${taskResult.data.createTask.sequenceNumber}`);
        }

        // 4. Check initial sequences
        let result = await client.query({
            query: GET_PRODUCT_TASKS,
            fetchPolicy: 'network-only'
        });

        const ourProduct = result.data.products.edges.find(edge => edge.node.id === product.id);
        let productTasks = ourProduct.node.tasks.edges.map(edge => edge.node)
            .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

        console.log(`\n📋 Before deletion - sequences: [${productTasks.map(t => t.sequenceNumber).join(', ')}]`);
        console.log(`Tasks: [${productTasks.map(t => t.name).join(', ')}]`);

        // 5. Delete task with sequence number 3 (Task 3)
        const taskToDelete = productTasks.find(t => t.sequenceNumber === 3);
        if (!taskToDelete) {
            throw new Error('Task with sequence 3 not found');
        }

        console.log(`\n🗑️  Deleting: ${taskToDelete.name} (sequence: ${taskToDelete.sequenceNumber})`);

        await client.mutate({
            mutation: DELETE_TASK,
            variables: { id: taskToDelete.id }
        });

        // 6. Process deletion queue
        const deletedCount = await client.mutate({
            mutation: PROCESS_DELETIONS
        });
        console.log(`♻️  Processed deletions: ${deletedCount.data.processDeletionQueue} tasks deleted`);

        // 7. Check sequences after deletion
        result = await client.query({
            query: GET_PRODUCT_TASKS,
            fetchPolicy: 'network-only'
        });

        const updatedProduct = result.data.products.edges.find(edge => edge.node.id === product.id);
        productTasks = updatedProduct.node.tasks.edges.map(edge => edge.node)
            .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

        console.log(`\n📋 After deletion - sequences: [${productTasks.map(t => t.sequenceNumber).join(', ')}]`);
        console.log(`Tasks: [${productTasks.map(t => t.name).join(', ')}]`);

        // 8. Analyze results
        const sequences = productTasks.map(t => t.sequenceNumber);
        const hasGaps = sequences.some((seq, i) => i > 0 && seq !== sequences[i - 1] + 1) || sequences[0] !== 1;
        const expectedSequences = [1, 2, 3, 4]; // After deleting sequence 3, should be [1,2,3,4]

        console.log(`\n🔍 Analysis:`);
        console.log(`Expected sequences: [${expectedSequences.join(', ')}]`);
        console.log(`Actual sequences:   [${sequences.join(', ')}]`);

        if (hasGaps) {
            console.log(`❌ SEQUENCE REORDERING FAILED: Gaps detected in sequence numbers`);
            console.log(`💡 The sequence reordering logic in the backend needs to be fixed`);
        } else {
            console.log(`✅ SEQUENCE REORDERING SUCCESSFUL: No gaps in sequence numbers`);
        }

    } catch (error) {
        console.error(`💥 Test failed:`, error.message);
        if (error.networkError) {
            console.error('Network error:', error.networkError);
        }
        if (error.graphQLErrors) {
            console.error('GraphQL errors:', error.graphQLErrors);
        }
    }
}

// Run the test
testSequenceReordering().then(() => {
    console.log(`\n🏁 Test completed`);
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
