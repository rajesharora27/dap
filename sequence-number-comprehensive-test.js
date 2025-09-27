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

// GraphQL mutations and queries
const CREATE_PRODUCT = gql`
    mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
            id
            name
            description
            statusPercent
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
            description
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

const GET_TASKS = gql`
    query GetTasks {
        products {
            edges {
                node {
                    id
                    name
                    tasks(first: 50) {
                        edges {
                            node {
                                id
                                name
                                sequenceNumber
                                deletedAt
                            }
                        }
                    }
                }
            }
        }
    }
`;

const QUEUE_TASK_SOFT_DELETE = gql`
    mutation QueueTaskSoftDelete($id: ID!) {
        queueTaskSoftDelete(id: $id)
    }
`;

const PROCESS_DELETION_QUEUE = gql`
    mutation ProcessDeletionQueue {
        processDeletionQueue
    }
`;

class SequenceNumberTester {
    constructor() {
        this.results = [];
        this.createdTasks = [];
        this.testProduct = null;
    }

    log(message, context = 'MAIN') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${context}] ${message}`);
    }

    addResult(testName, success, details) {
        this.results.push({
            testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });
    }

    async setupTestEnvironment() {
        this.log('🔧 Setting up test environment...');

        // Create test product
        const timestamp = Date.now();
        const productData = {
            name: `Sequence Test Product ${timestamp}`,
            description: 'Testing sequence number management',
        };

        const productResult = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: { input: productData },
            fetchPolicy: 'network-only'
        });

        this.testProduct = productResult.data.createProduct;

        // Create license for the product
        const licenseData = {
            name: `${this.testProduct.name} License`,
            level: 1,
            isActive: true,
            productId: this.testProduct.id
        };

        await client.mutate({
            mutation: CREATE_LICENSE,
            variables: { input: licenseData }
        });

        this.log(`✅ Test environment created - Product: ${this.testProduct.name}`, 'SETUP');
        return this.testProduct;
    }

    async createTask(taskName, expectedSequence = null) {
        const taskData = {
            productId: this.testProduct.id,
            name: `${taskName} ${Date.now()}`,
            description: `Sequence test task: ${taskName}`,
            estMinutes: 60,
            weight: 2,
            licenseLevel: 'Essential',
            priority: 'Medium',
            notes: `Testing sequence numbers`
        };

        const result = await client.mutate({
            mutation: CREATE_TASK,
            variables: { input: taskData },
            fetchPolicy: 'network-only'
        });

        const task = result.data.createTask;
        this.createdTasks.push(task);

        this.log(`➕ Created task: ${task.name} (seq: ${task.sequenceNumber})`, 'CREATE');

        if (expectedSequence !== null && task.sequenceNumber !== expectedSequence) {
            throw new Error(`Expected sequence ${expectedSequence}, got ${task.sequenceNumber}`);
        }

        return task;
    }

    async getTaskSequences() {
        const result = await client.query({
            query: GET_TASKS,
            fetchPolicy: 'network-only'
        });

        // Find our test product and get its tasks
        const productEdges = result.data.products.edges;
        const ourProduct = productEdges.find(edge => edge.node.id === this.testProduct.id);

        if (!ourProduct) {
            return [];
        }

        const tasks = ourProduct.node.tasks.edges.map(edge => edge.node);
        const activeTasks = tasks.filter(task => !task.deletedAt);

        // Sort by sequence number for display
        activeTasks.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

        this.log(`📋 Current task sequences: ${activeTasks.map(t => `${t.name.split(' ')[0]}(${t.sequenceNumber})`).join(', ')}`, 'QUERY');

        return activeTasks;
    }

    async softDeleteTask(taskId) {
        await client.mutate({
            mutation: QUEUE_TASK_SOFT_DELETE,
            variables: { id: taskId },
            fetchPolicy: 'network-only'
        });

        this.log(`🗑️  Queued task for deletion: ${taskId}`, 'DELETE');
    }

    async processDeletionQueue() {
        const result = await client.mutate({
            mutation: PROCESS_DELETION_QUEUE,
            fetchPolicy: 'network-only'
        });

        const deletedCount = result.data.processDeletionQueue;
        this.log(`♻️  Processed deletion queue - deleted ${deletedCount} tasks`, 'PROCESS');

        return deletedCount;
    }

    async testSequentialTaskCreation() {
        this.log('🧪 Testing sequential task creation...');

        try {
            // Create 5 tasks sequentially
            await this.createTask('Task1', 1);
            await this.createTask('Task2', 2);
            await this.createTask('Task3', 3);
            await this.createTask('Task4', 4);
            await this.createTask('Task5', 5);

            const tasks = await this.getTaskSequences();
            const sequences = tasks.map(t => t.sequenceNumber);
            const expectedSequences = [1, 2, 3, 4, 5];

            if (JSON.stringify(sequences) === JSON.stringify(expectedSequences)) {
                this.addResult('sequential_creation', true, `Tasks created with correct sequences: ${sequences.join(', ')}`);
                this.log('✅ Sequential task creation test passed', 'TEST');
            } else {
                this.addResult('sequential_creation', false, `Expected sequences [${expectedSequences.join(', ')}], got [${sequences.join(', ')}]`);
                this.log('❌ Sequential task creation test failed', 'TEST');
            }

        } catch (error) {
            this.addResult('sequential_creation', false, `Sequential creation failed: ${error.message}`);
            this.log(`❌ Sequential task creation error: ${error.message}`, 'TEST');
        }
    }

    async testConcurrentTaskCreation() {
        this.log('🧪 Testing concurrent task creation...');

        try {
            // Create multiple tasks concurrently
            const promises = [];
            for (let i = 6; i <= 10; i++) {
                promises.push(this.createTask(`ConcurrentTask${i}`));
            }

            const tasks = await Promise.all(promises);
            const sequences = tasks.map(t => t.sequenceNumber).sort((a, b) => a - b);
            const expectedSequences = [6, 7, 8, 9, 10];

            if (JSON.stringify(sequences) === JSON.stringify(expectedSequences)) {
                this.addResult('concurrent_creation', true, `Concurrent tasks created with correct sequences: ${sequences.join(', ')}`);
                this.log('✅ Concurrent task creation test passed', 'TEST');
            } else {
                this.addResult('concurrent_creation', false, `Expected sequences [${expectedSequences.join(', ')}], got [${sequences.join(', ')}]`);
                this.log('❌ Concurrent task creation test failed', 'TEST');
            }

        } catch (error) {
            this.addResult('concurrent_creation', false, `Concurrent creation failed: ${error.message}`);
            this.log(`❌ Concurrent task creation error: ${error.message}`, 'TEST');
        }
    }

    async testSequenceNumberReorderingAfterDeletion() {
        this.log('🧪 Testing sequence number reordering after deletion...');

        try {
            const tasksBeforeDeletion = await this.getTaskSequences();
            this.log(`📋 Before deletion: ${tasksBeforeDeletion.length} tasks with sequences [${tasksBeforeDeletion.map(t => t.sequenceNumber).join(', ')}]`, 'TEST');

            // Delete the 3rd task (should have sequence number 3)
            const taskToDelete = tasksBeforeDeletion.find(t => t.sequenceNumber === 3);
            if (!taskToDelete) {
                throw new Error('Could not find task with sequence number 3');
            }

            this.log(`🎯 Deleting task with sequence 3: ${taskToDelete.name}`, 'TEST');

            // Soft delete the task
            await this.softDeleteTask(taskToDelete.id);

            // Process deletion queue
            await this.processDeletionQueue();

            // Check sequences after deletion
            const tasksAfterDeletion = await this.getTaskSequences();
            this.log(`📋 After deletion: ${tasksAfterDeletion.length} tasks with sequences [${tasksAfterDeletion.map(t => t.sequenceNumber).join(', ')}]`, 'TEST');

            // Expected: sequences should be reordered to [1, 2, 3, 4, 5, 6, 7, 8, 9] (removing the gap)
            const actualSequences = tasksAfterDeletion.map(t => t.sequenceNumber).sort((a, b) => a - b);
            const expectedSequences = Array.from({ length: tasksAfterDeletion.length }, (_, i) => i + 1);

            const hasGaps = actualSequences.some((seq, i) => i > 0 && seq !== actualSequences[i - 1] + 1) || actualSequences[0] !== 1;

            if (hasGaps) {
                this.addResult('sequence_reordering', false, `Sequence numbers were NOT reordered after deletion. Found gaps: [${actualSequences.join(', ')}], expected continuous: [${expectedSequences.join(', ')}]`);
                this.log('❌ Sequence number reordering test failed - gaps detected', 'TEST');
            } else {
                this.addResult('sequence_reordering', true, `Sequence numbers were correctly reordered after deletion: [${actualSequences.join(', ')}]`);
                this.log('✅ Sequence number reordering test passed', 'TEST');
            }

        } catch (error) {
            this.addResult('sequence_reordering', false, `Sequence reordering test failed: ${error.message}`);
            this.log(`❌ Sequence reordering test error: ${error.message}`, 'TEST');
        }
    }

    async testTaskCreationAfterDeletion() {
        this.log('🧪 Testing task creation after deletion (should fill gaps or continue sequence)...');

        try {
            const tasksBeforeNewTask = await this.getTaskSequences();
            const maxSequenceBefore = Math.max(...tasksBeforeNewTask.map(t => t.sequenceNumber));

            // Create a new task
            const newTask = await this.createTask('NewTaskAfterDeletion');

            // Check if the new task got the correct sequence number
            const expectedSequence = maxSequenceBefore + 1;

            if (newTask.sequenceNumber === expectedSequence) {
                this.addResult('creation_after_deletion', true, `New task got correct sequence ${newTask.sequenceNumber} (expected ${expectedSequence})`);
                this.log('✅ Task creation after deletion test passed', 'TEST');
            } else {
                this.addResult('creation_after_deletion', false, `New task got sequence ${newTask.sequenceNumber}, expected ${expectedSequence}`);
                this.log('❌ Task creation after deletion test failed', 'TEST');
            }

        } catch (error) {
            this.addResult('creation_after_deletion', false, `Task creation after deletion failed: ${error.message}`);
            this.log(`❌ Task creation after deletion error: ${error.message}`, 'TEST');
        }
    }

    async runComprehensiveSequenceTest() {
        this.log('🎯 === COMPREHENSIVE SEQUENCE NUMBER TESTING ===');

        try {
            // Setup
            await this.setupTestEnvironment();

            // Test 1: Sequential task creation
            await this.testSequentialTaskCreation();

            // Test 2: Concurrent task creation
            await this.testConcurrentTaskCreation();

            // Test 3: Sequence reordering after deletion
            await this.testSequenceNumberReorderingAfterDeletion();

            // Test 4: Task creation after deletion
            await this.testTaskCreationAfterDeletion();

            this.generateReport();

        } catch (error) {
            this.log(`💥 Test suite error: ${error.message}`, 'ERROR');
        }
    }

    generateReport() {
        this.log('🎯 === SEQUENCE NUMBER TEST REPORT ===');

        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.success).length;
        const failedTests = this.results.filter(r => !r.success).length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        this.log(`📊 Test Summary:`);
        this.log(`   Total Tests: ${totalTests}`);
        this.log(`   Passed: ${passedTests} ✅`);
        this.log(`   Failed: ${failedTests} ❌`);
        this.log(`   Success Rate: ${successRate}%`);

        if (failedTests > 0) {
            this.log(`\n❌ Failed Tests:`);
            this.results.filter(r => !r.success).forEach(result => {
                this.log(`   - ${result.testName}: ${result.details}`);
            });
        }

        if (passedTests > 0) {
            this.log(`\n✅ Passed Tests:`);
            this.results.filter(r => r.success).forEach(result => {
                this.log(`   - ${result.testName}: ${result.details}`);
            });
        }

        this.log('\n🔍 Key Issues Identified:');
        const hasSequenceIssues = this.results.some(r => !r.success && (r.testName.includes('sequence') || r.testName.includes('creation')));
        const hasReorderingIssues = this.results.some(r => !r.success && r.testName.includes('reordering'));

        if (hasSequenceIssues) {
            this.log('   🚨 SEQUENCE NUMBER CONFLICTS: Tasks are failing to get unique sequence numbers');
        }

        if (hasReorderingIssues) {
            this.log('   🚨 SEQUENCE REORDERING MISSING: Tasks are not being reordered after deletion');
            this.log('     💡 Fix needed: Implement sequence number reordering in deletion process');
        }

        if (!hasSequenceIssues && !hasReorderingIssues) {
            this.log('   🎉 NO CRITICAL ISSUES: Sequence number management appears to be working correctly');
        }

        this.log('🏁 === SEQUENCE NUMBER TESTING COMPLETED ===');
    }
}

async function main() {
    const tester = new SequenceNumberTester();

    try {
        await tester.runComprehensiveSequenceTest();
    } catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { SequenceNumberTester };
