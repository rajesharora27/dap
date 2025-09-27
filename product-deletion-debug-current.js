#!/usr/bin/env node

/**
 * Product Deletion Debug Script
 * 
 * This script will test the current product deletion functionality
 * and identify why products might not be deleted from the GUI
 */

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

const GET_PRODUCTS = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          description
          customAttrs
          licenses {
            id
            name
            level
            isActive
          }
          tasks {
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
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
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

async function getCurrentProducts() {
    console.log('📊 Getting current products...\n');

    try {
        const result = await client.query({
            query: GET_PRODUCTS,
            fetchPolicy: 'network-only'
        });

        const products = result.data.products.edges.map(edge => edge.node);

        console.log(`Found ${products.length} products:`);
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} (ID: ${product.id})`);
            console.log(`   - Tasks: ${product.tasks.edges.length}`);
            console.log(`   - Test Product: ${product.customAttrs?.testCreated ? 'YES' : 'NO'}`);
            console.log('');
        });

        return products;
    } catch (error) {
        console.error('❌ Failed to get products:', error.message);
        throw error;
    }
}

async function testProductDeletion() {
    console.log('🧪 Testing Product Deletion Process...\n');

    try {
        // Step 1: Get current products
        let products = await getCurrentProducts();

        // Find a test product to delete
        let productToDelete = products.find(p => p.customAttrs?.testCreated || p.name.includes('Test Product'));

        if (!productToDelete) {
            // Use the first product as a test
            productToDelete = products[0];
            console.log(`⚠️ No test product found, using first product: ${productToDelete.name}`);
        } else {
            console.log(`🎯 Found test product to delete: ${productToDelete.name}`);
        }

        if (!productToDelete) {
            console.log('❌ No products available for testing');
            return false;
        }

        const productId = productToDelete.id;
        const productName = productToDelete.name;
        const taskCount = productToDelete.tasks.edges.length;

        console.log(`\n🗑️ Starting deletion of: ${productName} (ID: ${productId})`);
        console.log(`   Tasks to handle: ${taskCount}\n`);

        // Step 2: Delete associated tasks first (if any)
        if (taskCount > 0) {
            console.log('🔄 Step 1: Handling associated tasks...');

            for (const taskEdge of productToDelete.tasks.edges) {
                try {
                    console.log(`   - Queuing task: ${taskEdge.node.name}`);
                    await client.mutate({
                        mutation: QUEUE_TASK_DELETION,
                        variables: { id: taskEdge.node.id }
                    });
                } catch (error) {
                    console.log(`   - Failed to queue task: ${error.message}`);
                }
            }

            console.log('   - Processing deletion queue...');
            const processResult = await client.mutate({
                mutation: PROCESS_DELETION_QUEUE
            });
            console.log(`   - Processed ${processResult.data.processDeletionQueue} deletions`);
        }

        // Step 3: Delete the product
        console.log('\n🔥 Step 2: Deleting product...');
        const deleteResult = await client.mutate({
            mutation: DELETE_PRODUCT,
            variables: { id: productId }
        });
        console.log(`   - Delete mutation result: ${deleteResult.data.deleteProduct}`);

        // Step 4: Wait for consistency
        console.log('\n⏳ Step 3: Waiting for database consistency...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 5: Clear Apollo cache
        console.log('🧹 Step 4: Clearing Apollo cache...');
        await client.clearStore();

        // Step 6: Verify deletion
        console.log('\n🔍 Step 5: Verifying deletion...');
        const refreshedProducts = await getCurrentProducts();

        const productStillExists = refreshedProducts.find(p => p.id === productId);

        if (productStillExists) {
            console.log(`❌ VERIFICATION FAILED: Product "${productName}" still exists!`);
            console.log(`   Current products: ${refreshedProducts.length}`);
            console.log(`   Product details:`);
            console.log(`     - ID: ${productStillExists.id}`);
            console.log(`     - Name: ${productStillExists.name}`);
            console.log(`     - Tasks: ${productStillExists.tasks.edges.length}`);
            return false;
        } else {
            console.log(`✅ SUCCESS: Product "${productName}" successfully deleted!`);
            console.log(`   Products before deletion: ${products.length}`);
            console.log(`   Products after deletion: ${refreshedProducts.length}`);
            console.log(`   Difference: ${products.length - refreshedProducts.length}`);
            return true;
        }

    } catch (error) {
        console.error('❌ Product deletion test failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Product Deletion Debug & Test\n');
    console.log('=====================================\n');

    try {
        const success = await testProductDeletion();

        console.log('\n📊 === FINAL RESULTS ===');
        console.log(`Product Deletion Test: ${success ? '✅ PASSED' : '❌ FAILED'}`);

        if (success) {
            console.log('\n🎉 Product deletion is working correctly!');
            console.log('If the TestPanelNew GUI is not reflecting changes:');
            console.log('   1. Check if the component is refreshing after deletion');
            console.log('   2. Verify Apollo cache clearing is working');
            console.log('   3. Ensure the loadProducts function is being called');
            console.log('   4. Check for any React state management issues');
        } else {
            console.log('\n❌ Product deletion has issues:');
            console.log('   1. Backend deletion may not be working');
            console.log('   2. Database consistency problems');
            console.log('   3. GraphQL schema issues');
            console.log('   4. Task cleanup may be blocking product deletion');
        }

    } catch (error) {
        console.error('💥 Debug script failed:', error.message);
        process.exit(1);
    }
}

main();
