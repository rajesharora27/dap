#!/usr/bin/env node

/**
 * Task Deletion Debug Tool
 * 
 * This script helps debug the "Delete task shows successful but task is not deleted" issue
 * by testing the entire deletion flow and validating each step.
 */

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client/core');

// Apollo Client setup
const client = new ApolloClient({
    link: createHttpLink({ uri: 'http://localhost:4000/graphql' }),
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: { fetchPolicy: 'no-cache' },
        query: { fetchPolicy: 'no-cache' }
    }
});

// GraphQL queries and mutations
const PRODUCTS_WITH_TASKS = gql`
  query ProductsWithTasks {
    products {
      edges {
        node {
          id
          name
          description
          tasks(first: 10) {
            edges {
              node {
                id
                name
                description
                estMinutes
                weight
                licenseLevel
                deletedAt
              }
            }
          }
        }
      }
    }
  }
`;

const QUEUE_TASK_DELETION = gql`
  mutation QueueTaskSoftDelete($id: ID!) {
    queueTaskSoftDelete(id: $id)
  }
`;

const PROCESS_DELETION_QUEUE = gql`
  mutation ProcessDeletionQueue {
    processDeletionQueue
  }
`;

const CREATE_TEST_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) { 
      id 
      name 
      description 
      estMinutes
      weight
      licenseLevel
      deletedAt
    }
  }
`;

// Debug functions
async function listAllTasksWithDetails() {
    console.log('\n🔍 === LISTING ALL TASKS WITH DETAILS ===');

    try {
        const result = await client.query({
            query: PRODUCTS_WITH_TASKS,
            fetchPolicy: 'network-only'
        });

        const products = result.data.products.edges.map(edge => edge.node);
        let totalTasks = 0;

        products.forEach((product, pIndex) => {
            const tasks = product.tasks?.edges || [];
            totalTasks += tasks.length;

            console.log(`\nProduct ${pIndex + 1}: ${product.name}`);
            console.log(`  - ID: ${product.id}`);
            console.log(`  - Tasks: ${tasks.length}`);

            if (tasks.length > 0) {
                tasks.forEach((taskEdge, tIndex) => {
                    const task = taskEdge.node;
                    console.log(`    Task ${tIndex + 1}: ${task.name}`);
                    console.log(`      - ID: ${task.id}`);
                    console.log(`      - Description: ${task.description || 'N/A'}`);
                    console.log(`      - EstMinutes: ${task.estMinutes || 'N/A'}`);
                    console.log(`      - Weight: ${task.weight || 'N/A'}`);
                    console.log(`      - LicenseLevel: ${task.licenseLevel || 'N/A'}`);
                    console.log(`      - DeletedAt: ${task.deletedAt || 'null (not deleted)'}`);
                });
            } else {
                console.log(`    No tasks found`);
            }
        });

        console.log(`\n📊 Summary: ${totalTasks} total tasks across ${products.length} products`);
        return products;
    } catch (error) {
        console.error('❌ Error listing tasks:', error.message);
        return [];
    }
}

async function createTestTaskForDeletion() {
    console.log('\n🆕 === CREATING TEST TASK FOR DELETION ===');

    try {
        // Get first product
        const products = await listAllTasksWithDetails();
        if (products.length === 0) {
            throw new Error('No products available');
        }

        const targetProduct = products[0];
        console.log(`🎯 Using product: ${targetProduct.name}`);

        const testTaskData = {
            productId: targetProduct.id,
            name: `DEBUG Task ${Date.now()}`,
            description: 'Task created specifically for deletion debugging purposes',
            estMinutes: 30,
            weight: 2,
            licenseLevel: 'Essential'
        };

        console.log('💾 Creating test task...');
        const result = await client.mutate({
            mutation: CREATE_TEST_TASK,
            variables: { input: testTaskData }
        });

        const createdTask = result.data.createTask;
        console.log(`✅ Test task created successfully:`);
        console.log(`   - Name: ${createdTask.name}`);
        console.log(`   - ID: ${createdTask.id}`);
        console.log(`   - DeletedAt: ${createdTask.deletedAt || 'null (not deleted)'}`);

        return createdTask;
    } catch (error) {
        console.error('❌ Error creating test task:', error.message);
        return null;
    }
}

async function testTaskDeletionFlow(taskId, taskName) {
    console.log(`\n🗑️ === TESTING DELETION FLOW FOR TASK: ${taskName} ===`);

    try {
        // Step 1: Verify task exists before deletion
        console.log('📋 Step 1: Verifying task exists before deletion...');
        const beforeProducts = await client.query({
            query: PRODUCTS_WITH_TASKS,
            fetchPolicy: 'network-only'
        });

        let taskFoundBefore = false;
        let taskDetailsBefore = null;

        beforeProducts.data.products.edges.forEach(productEdge => {
            const product = productEdge.node;
            const task = product.tasks?.edges.find(taskEdge => taskEdge.node.id === taskId);
            if (task) {
                taskFoundBefore = true;
                taskDetailsBefore = task.node;
                console.log(`✅ Task found BEFORE deletion in product: ${product.name}`);
                console.log(`   - Task name: ${task.node.name}`);
                console.log(`   - Task deletedAt: ${task.node.deletedAt || 'null (not deleted)'}`);
            }
        });

        if (!taskFoundBefore) {
            console.log('❌ Task not found before deletion - cannot proceed');
            return false;
        }

        // Step 2: Queue task for deletion
        console.log('🔄 Step 2: Queuing task for deletion...');
        const queueResult = await client.mutate({
            mutation: QUEUE_TASK_DELETION,
            variables: { id: taskId }
        });

        console.log(`✅ Task queued for deletion result: ${queueResult.data.queueTaskSoftDelete}`);

        // Step 3: Check if task is marked as deleted (soft delete)
        console.log('📋 Step 3: Checking task status after queuing...');
        const afterQueueProducts = await client.query({
            query: PRODUCTS_WITH_TASKS,
            fetchPolicy: 'network-only'
        });

        let taskFoundAfterQueue = false;
        let taskDetailsAfterQueue = null;

        afterQueueProducts.data.products.edges.forEach(productEdge => {
            const product = productEdge.node;
            const task = product.tasks?.edges.find(taskEdge => taskEdge.node.id === taskId);
            if (task) {
                taskFoundAfterQueue = true;
                taskDetailsAfterQueue = task.node;
                console.log(`📍 Task status AFTER queuing:`);
                console.log(`   - Still visible in GraphQL: ${task ? 'YES' : 'NO'}`);
                console.log(`   - Task deletedAt: ${task.node.deletedAt || 'null (not deleted)'}`);
                console.log(`   - Task name: ${task.node.name}`);
            }
        });

        if (!taskFoundAfterQueue) {
            console.log('⚠️ Task no longer visible after queuing');
        }

        // Step 4: Process deletion queue
        console.log('🧹 Step 4: Processing deletion queue...');
        const processResult = await client.mutate({
            mutation: PROCESS_DELETION_QUEUE
        });

        console.log(`✅ Deletion queue processed result: ${processResult.data.processDeletionQueue}`);

        // Step 5: Final verification
        console.log('🏁 Step 5: Final verification - checking if task is truly deleted...');
        const finalProducts = await client.query({
            query: PRODUCTS_WITH_TASKS,
            fetchPolicy: 'network-only'
        });

        let taskFoundAfterProcessing = false;
        let taskDetailsAfterProcessing = null;

        finalProducts.data.products.edges.forEach(productEdge => {
            const product = productEdge.node;
            const task = product.tasks?.edges.find(taskEdge => taskEdge.node.id === taskId);
            if (task) {
                taskFoundAfterProcessing = true;
                taskDetailsAfterProcessing = task.node;
                console.log(`⚠️ Task STILL EXISTS after processing:`);
                console.log(`   - Product: ${product.name}`);
                console.log(`   - Task name: ${task.node.name}`);
                console.log(`   - Task deletedAt: ${task.node.deletedAt || 'null (not deleted)'}`);
            }
        });

        // Results summary
        console.log(`\n📊 === DELETION FLOW SUMMARY ===`);
        console.log(`Task Before Deletion: ${taskFoundBefore ? 'FOUND' : 'NOT FOUND'}`);
        console.log(`Queue Deletion Result: ${queueResult.data.queueTaskSoftDelete}`);
        console.log(`Task After Queue: ${taskFoundAfterQueue ? 'STILL VISIBLE' : 'NO LONGER VISIBLE'}`);
        console.log(`Process Queue Result: ${processResult.data.processDeletionQueue}`);
        console.log(`Task After Processing: ${taskFoundAfterProcessing ? 'STILL EXISTS' : 'DELETED'}`);

        if (taskFoundAfterProcessing) {
            console.log(`\n❌ ISSUE CONFIRMED: Task shows as deleted but still exists in database`);
            console.log(`   - This explains why the GUI shows "successful" but task remains visible`);
            console.log(`   - The deletedAt field may be: ${taskDetailsAfterProcessing.deletedAt || 'null'}`);
            return false;
        } else {
            console.log(`\n✅ Task deletion completed successfully`);
            return true;
        }

    } catch (error) {
        console.error('❌ Error in deletion flow:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Task Deletion Debug Tool');
    console.log('==============================\n');

    try {
        // Step 1: List all current tasks
        console.log('📋 Current state of all tasks:');
        await listAllTasksWithDetails();

        // Step 2: Create a test task for deletion
        const testTask = await createTestTaskForDeletion();
        if (!testTask) {
            console.log('❌ Could not create test task - stopping debug');
            return;
        }

        // Step 3: Test the deletion flow
        const deletionSuccessful = await testTaskDeletionFlow(testTask.id, testTask.name);

        // Step 4: Final state check
        console.log('\n🔍 Final state of all tasks:');
        await listAllTasksWithDetails();

        // Summary
        console.log(`\n🎯 === DEBUG CONCLUSION ===`);
        if (deletionSuccessful) {
            console.log('✅ Task deletion is working correctly');
            console.log('💡 If GUI still shows issues, problem may be in frontend refresh logic');
        } else {
            console.log('❌ Task deletion has backend issues');
            console.log('💡 Task remains in database after deletion process');
            console.log('🔧 Check backend deletion logic and soft delete implementation');
        }

    } catch (error) {
        console.error('❌ Debug tool error:', error.message);
    }
}

// Run the debug tool
main().catch(console.error);
