#!/usr/bin/env node

/**
 * Task Deletion Verification Tool
 * 
 * This script comprehensively tests task deletion to resolve the 
 * "Delete task shows successful but task is not deleted" issue.
 */

console.log('🚀 Task Deletion Verification Tool');
console.log('===================================\n');

const testTaskDeletion = async () => {
    console.log('🧪 Testing Task Deletion with Complete Verification\n');

    try {
        // Step 1: Get current task count
        console.log('📊 Step 1: Getting current task count...');
        const beforeCount = await getCurrentTaskCount();
        console.log(`   Current tasks in system: ${beforeCount}`);

        if (beforeCount === 0) {
            console.log('⚠️ No tasks available for testing. Creating a test task first...');
            await createTestTask();
        }

        // Step 2: Get a specific task to delete
        console.log('\n🎯 Step 2: Selecting task for deletion...');
        const taskToDelete = await getFirstAvailableTask();

        if (!taskToDelete) {
            console.log('❌ No tasks available for deletion');
            return false;
        }

        console.log(`   Selected task: ${taskToDelete.name}`);
        console.log(`   Task ID: ${taskToDelete.id}`);
        console.log(`   Product: ${taskToDelete.productName}`);

        // Step 3: Delete the task
        console.log('\n🗑️ Step 3: Deleting the task...');
        const deleteResult = await deleteTask(taskToDelete.id);
        console.log(`   Queue result: ${deleteResult.queueResult}`);
        console.log(`   Process result: ${deleteResult.processResult} tasks processed`);

        // Step 4: Wait for consistency
        console.log('\n⏳ Step 4: Waiting for database consistency...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 5: Verify deletion
        console.log('\n🔍 Step 5: Verifying task deletion...');
        const afterCount = await getCurrentTaskCount();
        console.log(`   Tasks after deletion: ${afterCount}`);

        // Check if task still exists
        const taskExists = await checkTaskExists(taskToDelete.id);

        if (taskExists) {
            console.log(`❌ ISSUE CONFIRMED: Task ${taskToDelete.id} still exists after deletion!`);
            console.log('   This explains why the GUI shows "successful" but task remains');
            return false;
        } else {
            console.log(`✅ Task ${taskToDelete.id} successfully deleted and verified`);
            console.log(`   Task count reduced from ${beforeCount} to ${afterCount}`);
            return true;
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
};

async function getCurrentTaskCount() {
    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({
            query: `
                query {
                    products {
                        edges {
                            node {
                                tasks(first: 50) {
                                    edges {
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `
        })
    });

    const result = await response.json();

    if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    let count = 0;
    result.data.products.edges.forEach(productEdge => {
        count += productEdge.node.tasks.edges.length;
    });

    return count;
}

async function getFirstAvailableTask() {
    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({
            query: `
                query {
                    products {
                        edges {
                            node {
                                id
                                name
                                tasks(first: 10) {
                                    edges {
                                        node {
                                            id
                                            name
                                            description
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `
        })
    });

    const result = await response.json();

    if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    // Find first available task
    for (const productEdge of result.data.products.edges) {
        const product = productEdge.node;
        const tasks = product.tasks.edges;

        if (tasks.length > 0) {
            const task = tasks[0].node;
            return {
                id: task.id,
                name: task.name,
                description: task.description,
                productName: product.name,
                productId: product.id
            };
        }
    }

    return null;
}

async function deleteTask(taskId) {
    // Step 1: Queue for deletion
    const queueResponse = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({
            query: `
                mutation {
                    queueTaskSoftDelete(id: "${taskId}")
                }
            `
        })
    });

    const queueResult = await queueResponse.json();

    if (queueResult.errors) {
        throw new Error(`Queue deletion failed: ${queueResult.errors[0].message}`);
    }

    // Step 2: Process deletion queue
    const processResponse = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({
            query: `
                mutation {
                    processDeletionQueue
                }
            `
        })
    });

    const processResult = await processResponse.json();

    if (processResult.errors) {
        throw new Error(`Process deletion failed: ${processResult.errors[0].message}`);
    }

    return {
        queueResult: queueResult.data.queueTaskSoftDelete,
        processResult: processResult.data.processDeletionQueue
    };
}

async function checkTaskExists(taskId) {
    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({
            query: `
                query {
                    products {
                        edges {
                            node {
                                tasks(first: 50) {
                                    edges {
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `
        })
    });

    const result = await response.json();

    if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    // Check if task still exists
    for (const productEdge of result.data.products.edges) {
        const tasks = productEdge.node.tasks.edges;
        for (const taskEdge of tasks) {
            if (taskEdge.node.id === taskId) {
                return true;
            }
        }
    }

    return false;
}

async function createTestTask() {
    // First get a product to add task to
    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({
            query: `
                query {
                    products(first: 1) {
                        edges {
                            node {
                                id
                                name
                            }
                        }
                    }
                }
            `
        })
    });

    const result = await response.json();

    if (result.errors || result.data.products.edges.length === 0) {
        throw new Error('No products available to create task');
    }

    const product = result.data.products.edges[0].node;

    // Create test task
    const createResponse = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({
            query: `
                mutation {
                    createTask(input: {
                        productId: "${product.id}"
                        name: "Test Task for Deletion Verification"
                        description: "This task was created for testing the deletion functionality"
                        estMinutes: 60
                        weight: 1
                        licenseLevel: Essential
                    }) {
                        id
                        name
                    }
                }
            `
        })
    });

    const createResult = await createResponse.json();

    if (createResult.errors) {
        throw new Error(`Create task failed: ${createResult.errors[0].message}`);
    }

    console.log(`   ✅ Created test task: ${createResult.data.createTask.name}`);
    return createResult.data.createTask;
}

// Run the test
testTaskDeletion().then(success => {
    console.log(`\n🎯 === FINAL RESULT ===`);
    if (success) {
        console.log('✅ Task deletion is working correctly!');
        console.log('💡 If GUI still shows issues, the problem is in frontend caching/refresh logic');
        console.log('🔧 The enhanced TestPanelNew component should fix the issue');
    } else {
        console.log('❌ Task deletion has backend issues');
        console.log('💡 Tasks are not being properly deleted from the database');
        console.log('🔧 Check backend soft delete logic and database consistency');
    }
}).catch(error => {
    console.error('❌ Verification failed:', error);
});
