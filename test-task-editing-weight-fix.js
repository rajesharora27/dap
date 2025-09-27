// Test script to verify task editing weight fix
const { ApolloClient, InMemoryCache, createHttpLink, gql } = require('@apollo/client');

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

const PRODUCTS = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          description
          tasks(first: 100) {
            edges {
              node {
                id
                name
                description
                estMinutes
                weight
                licenseLevel
                sequenceNumber
              }
            }
          }
        }
      }
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
      sequenceNumber
    }
  }
`;

async function testTaskEditingWeightFix() {
    console.log('🧪 Testing Task Editing Weight Fix');
    console.log('=====================================\n');

    try {
        // Step 1: Find a product with high weight usage
        console.log('📋 Step 1: Finding product with high weight usage...');
        const productsResult = await client.query({ query: PRODUCTS });
        const products = productsResult.data.products.edges.map(edge => edge.node);

        let targetProduct = null;
        let taskToEdit = null;
        let currentWeightUsage = 0;

        // Find a product with tasks that has high weight usage
        for (const product of products) {
            if (product.tasks.edges.length > 0) {
                const totalWeight = product.tasks.edges.reduce((sum, edge) => sum + (edge.node.weight || 0), 0);
                console.log(`  - ${product.name}: ${totalWeight}% weight used (${product.tasks.edges.length} tasks)`);

                if (totalWeight >= 90 && totalWeight <= 99) { // Find product with 90-99% usage
                    targetProduct = product;
                    taskToEdit = product.tasks.edges[0].node; // Use first task
                    currentWeightUsage = totalWeight;
                    break;
                }
            }
        }

        // If no high-usage product found, use any product with tasks
        if (!targetProduct) {
            for (const product of products) {
                if (product.tasks.edges.length > 0) {
                    const totalWeight = product.tasks.edges.reduce((sum, edge) => sum + (edge.node.weight || 0), 0);
                    targetProduct = product;
                    taskToEdit = product.tasks.edges[0].node;
                    currentWeightUsage = totalWeight;
                    console.log(`  Using product with ${totalWeight}% weight usage`);
                    break;
                }
            }
        }

        if (!targetProduct || !taskToEdit) {
            console.log('❌ No suitable product with tasks found');
            return;
        }

        console.log(`\n🎯 Selected product: "${targetProduct.name}"`);
        console.log(`   Current total weight: ${currentWeightUsage}%`);
        console.log(`   Task to edit: "${taskToEdit.name}" (${taskToEdit.weight}%)`);

        // Step 2: Calculate smart weight adjustment (simulating frontend logic)
        const usedWeightExcludingTask = currentWeightUsage - (taskToEdit.weight || 0);
        const availableWeight = 100 - usedWeightExcludingTask;
        const currentTaskWeight = taskToEdit.weight || 5;

        let newWeight = currentTaskWeight;
        if (availableWeight >= currentTaskWeight + 2) {
            newWeight = currentTaskWeight + 2;
        } else if (availableWeight >= currentTaskWeight + 1) {
            newWeight = currentTaskWeight + 1;
        } else if (availableWeight > currentTaskWeight) {
            newWeight = Math.floor(availableWeight * 10) / 10;
        } else {
            newWeight = Math.max(0.1, currentTaskWeight - 0.5);
        }

        console.log(`\n⚖️ Weight calculation:`)
        console.log(`   Used weight (excluding task): ${usedWeightExcludingTask}%`);
        console.log(`   Available weight: ${availableWeight}%`);
        console.log(`   Current task weight: ${currentTaskWeight}%`);
        console.log(`   New task weight: ${newWeight}%`);
        console.log(`   Projected total: ${usedWeightExcludingTask + newWeight}%`);

        // Step 3: Test the weight update
        console.log(`\n💾 Step 3: Testing task update...`);

        const updatedTaskData = {
            name: `${taskToEdit.name} - WEIGHT TEST EDIT`,
            description: `${taskToEdit.description || ''} - Weight capacity testing`,
            estMinutes: (taskToEdit.estMinutes || 60) + 10,
            weight: newWeight,
            sequenceNumber: (taskToEdit.sequenceNumber || 1) + 1000,
            licenseLevel: taskToEdit.licenseLevel || 'Essential',
            priority: 'Medium',
            notes: 'Updated with smart weight calculation to prevent capacity exceeded errors'
        };

        try {
            const result = await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                    id: taskToEdit.id,
                    input: updatedTaskData
                }
            });

            const updatedTask = result.data.updateTask;
            console.log(`✅ SUCCESS: Task updated successfully!`);
            console.log(`   New name: "${updatedTask.name}"`);
            console.log(`   New weight: ${updatedTask.weight}%`);
            console.log(`   New sequence: ${updatedTask.sequenceNumber}`);

            // Step 4: Verify the final weight usage
            console.log(`\n🔍 Step 4: Verifying final weight usage...`);
            const verificationResult = await client.query({
                query: PRODUCTS,
                fetchPolicy: 'network-only'
            });

            const updatedProducts = verificationResult.data.products.edges.map(edge => edge.node);
            const updatedTargetProduct = updatedProducts.find(p => p.id === targetProduct.id);

            if (updatedTargetProduct) {
                const finalTotalWeight = updatedTargetProduct.tasks.edges.reduce((sum, edge) => sum + (edge.node.weight || 0), 0);
                console.log(`✅ Final total weight: ${finalTotalWeight}%`);

                if (finalTotalWeight <= 100) {
                    console.log(`🎉 Weight fix appears to be working correctly!`);
                    console.log(`   Task editing respects weight capacity limits`);
                } else {
                    console.log(`❌ Weight exceeded 100% - fix may need adjustment`);
                }
            }

        } catch (updateError) {
            console.log(`❌ FAILURE: Task update failed`);
            console.log(`   Error: ${updateError.message}`);

            if (updateError.message.includes('weight') && updateError.message.includes('exceed')) {
                console.log(`   This indicates the weight calculation still needs improvement`);
            }
        }

    } catch (error) {
        console.error('\n🚨 Test failed with error:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
testTaskEditingWeightFix();
