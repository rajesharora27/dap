#!/usr/bin/env node

/**
 * Product Deletion Debug Tool
 * 
 * This script helps debug the "Delete product shows successful but product is not deleted" issue
 * by testing the entire deletion flow and validating each step.
 */

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client/core');

console.log('🚀 Product Deletion Debug Tool');
console.log('=================================\n');

const testProductDeletion = async () => {
    console.log('🧪 Testing Product Deletion with Complete Verification\n');

    try {
        // Step 1: Get current product count
        console.log('📊 Step 1: Getting current product count...');
        const beforeCount = await getCurrentProductCount();
        console.log(`   Current products in system: ${beforeCount}`);

        if (beforeCount === 0) {
            console.log('⚠️ No products available for testing. Need to create a product first.');
            return false;
        }

        // Step 2: Get a specific product to delete
        console.log('\n🎯 Step 2: Selecting product for deletion...');
        const productToDelete = await getTestProduct();

        if (!productToDelete) {
            console.log('❌ No suitable test product available for deletion');
            return false;
        }

        console.log(`   Selected product: ${productToDelete.name}`);
        console.log(`   Product ID: ${productToDelete.id}`);
        console.log(`   Has tasks: ${productToDelete.taskCount > 0 ? 'YES' : 'NO'}`);

        // Step 3: Delete associated tasks first if any
        if (productToDelete.taskCount > 0) {
            console.log(`\n🗑️ Step 3a: Deleting ${productToDelete.taskCount} associated tasks first...`);
            const taskDeletionResult = await deleteAssociatedTasks(productToDelete.tasks);
            console.log(`   Tasks queued: ${taskDeletionResult.queued}`);
            console.log(`   Tasks processed: ${taskDeletionResult.processed}`);
        }

        // Step 4: Delete the product
        console.log('\n🔥 Step 4: Deleting the product...');
        const deleteResult = await deleteProduct(productToDelete.id);
        console.log(`   Delete result: ${deleteResult}`);

        // Step 5: Wait for consistency
        console.log('\n⏳ Step 5: Waiting for database consistency...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 6: Verify deletion
        console.log('\n🔍 Step 6: Verifying product deletion...');
        const afterCount = await getCurrentProductCount();
        console.log(`   Products after deletion: ${afterCount}`);

        // Check if product still exists
        const productExists = await checkProductExists(productToDelete.id);

        if (productExists) {
            console.log(`❌ ISSUE CONFIRMED: Product ${productToDelete.id} still exists after deletion!`);
            console.log('   This explains why the GUI shows "successful" but product remains');
            return false;
        } else {
            console.log(`✅ Product ${productToDelete.id} successfully deleted and verified`);
            console.log(`   Product count reduced from ${beforeCount} to ${afterCount}`);
            return true;
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
};

async function getCurrentProductCount() {
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

    return result.data.products.edges.length;
}

async function getTestProduct() {
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
                                description
                                customAttrs
                                tasks(first: 10) {
                                    edges {
                                        node {
                                            id
                                            name
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

    // Priority 1: Look for test products created by GUI Test Studio
    let testProduct = result.data.products.edges.find(edge => {
        const product = edge.node;
        return product.name.includes('Test Product') ||
            product.name.includes('GUI Test') ||
            product.name.includes('Validation Test') ||
            (product.customAttrs && product.customAttrs.testCreated);
    });

    // Priority 2: Look for any product with fewer tasks to minimize impact
    if (!testProduct) {
        const productsWithTasks = result.data.products.edges.map(edge => ({
            ...edge.node,
            taskCount: edge.node.tasks.edges.length
        }));

        // Find product with fewest tasks
        productsWithTasks.sort((a, b) => a.taskCount - b.taskCount);
        testProduct = productsWithTasks[0] ? { node: productsWithTasks[0] } : null;
    }

    if (testProduct) {
        const product = testProduct.node;
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            taskCount: product.tasks.edges.length,
            tasks: product.tasks.edges.map(edge => edge.node)
        };
    }

    return null;
}

async function deleteAssociatedTasks(tasks) {
    let queued = 0;
    let processed = 0;

    // Queue all tasks for deletion
    for (const task of tasks) {
        try {
            const queueResponse = await fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'admin'
                },
                body: JSON.stringify({
                    query: `
                        mutation {
                            queueTaskSoftDelete(id: "${task.id}")
                        }
                    `
                })
            });

            const queueResult = await queueResponse.json();
            if (!queueResult.errors && queueResult.data.queueTaskSoftDelete) {
                queued++;
            }
        } catch (error) {
            console.log(`   Failed to queue task ${task.name}: ${error.message}`);
        }
    }

    // Process deletion queue
    try {
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
        if (!processResult.errors) {
            processed = processResult.data.processDeletionQueue;
        }
    } catch (error) {
        console.log(`   Failed to process deletion queue: ${error.message}`);
    }

    return { queued, processed };
}

async function deleteProduct(productId) {
    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({
            query: `
                mutation {
                    deleteProduct(id: "${productId}")
                }
            `
        })
    });

    const result = await response.json();

    if (result.errors) {
        throw new Error(`Product deletion failed: ${result.errors[0].message}`);
    }

    return result.data.deleteProduct;
}

async function checkProductExists(productId) {
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

    // Check if product still exists
    const productExists = result.data.products.edges.some(edge => edge.node.id === productId);

    return productExists;
}

// Run the test
testProductDeletion().then(success => {
    console.log(`\n🎯 === FINAL RESULT ===`);
    if (success) {
        console.log('✅ Product deletion is working correctly at backend level!');
        console.log('💡 If GUI still shows issues, the problem is in frontend caching/refresh logic');
        console.log('🔧 Need to enhance TestPanelNew component like we did for task deletion');
    } else {
        console.log('❌ Product deletion has backend issues');
        console.log('💡 Products are not being properly deleted from the database');
        console.log('🔧 Check backend product deletion logic');
    }
}).catch(error => {
    console.error('❌ Verification failed:', error);
});
