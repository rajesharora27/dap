// Test script to verify task visibility fix
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

async function testTaskVisibilityFix() {
    console.log('🧪 Testing Task Visibility Fix');
    console.log('=====================================\n');

    try {
        // Step 1: Get current state
        console.log('📋 Step 1: Getting current products and task counts...');
        const productsResult = await client.query({ query: PRODUCTS });
        const products = productsResult.data.products.edges.map(edge => edge.node);

        console.log('\nCurrent products and task counts:');
        products.forEach(product => {
            const taskCount = product.tasks.edges.length;
            console.log(`  - ${product.name}: ${taskCount} tasks`);
            if (taskCount >= 10) {
                console.log(`    ⚠️  This product has ${taskCount} tasks (≥10 - could cause visibility issues with old limit)`);
            }
        });

        // Step 2: Find a product with room for more tasks (or use the test product)
        let targetProduct = products.find(p => p.name.includes('Fresh Task Test Product')) ||
            products.find(p => p.tasks.edges.length < 95); // Leave room for test

        if (!targetProduct) {
            console.log('\n❌ No suitable product found for testing');
            return;
        }

        console.log(`\n🎯 Selected product: "${targetProduct.name}" (${targetProduct.tasks.edges.length} existing tasks)`);

        // Step 3: Create a new task
        console.log('\n💾 Step 3: Creating a new task...');
        const timestamp = Date.now();
        const taskData = {
            productId: targetProduct.id,
            name: `Visibility Test Task ${timestamp}`,
            description: 'Testing task visibility after increasing query limit',
            estMinutes: 60,
            weight: 1,
            licenseLevel: 'Essential',
            priority: 'Medium',
            notes: 'Created to test the task visibility fix'
        };

        const createResult = await client.mutate({
            mutation: CREATE_TASK,
            variables: { input: taskData }
        });

        const createdTask = createResult.data.createTask;
        console.log(`✅ Task created: ${createdTask.name} (${createdTask.id})`);
        console.log(`   Sequence Number: ${createdTask.sequenceNumber}`);

        // Step 4: Wait for database consistency
        console.log('\n⏳ Step 4: Waiting for database consistency...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 5: Query again to verify visibility
        console.log('\n🔍 Step 5: Checking task visibility with increased limit...');
        const verificationResult = await client.query({
            query: PRODUCTS,
            fetchPolicy: 'network-only' // Force fresh data
        });

        const updatedProducts = verificationResult.data.products.edges.map(edge => edge.node);
        const updatedTargetProduct = updatedProducts.find(p => p.id === targetProduct.id);

        if (!updatedTargetProduct) {
            console.log('❌ Target product not found in verification query');
            return;
        }

        const foundTask = updatedTargetProduct.tasks.edges.find(edge => edge.node.id === createdTask.id);

        if (foundTask) {
            console.log(`✅ SUCCESS: Task found in verification query!`);
            console.log(`   Task: "${foundTask.node.name}"`);
            console.log(`   Product: "${updatedTargetProduct.name}"`);
            console.log(`   Total tasks in product: ${updatedTargetProduct.tasks.edges.length}`);
            console.log(`   Task sequence number: ${foundTask.node.sequenceNumber}`);
        } else {
            console.log(`❌ FAILURE: Task not found in verification query`);
            console.log(`   Expected task: "${createdTask.name}" (${createdTask.id})`);
            console.log(`   Product: "${updatedTargetProduct.name}"`);
            console.log(`   Total tasks in product: ${updatedTargetProduct.tasks.edges.length}`);
            console.log(`   Tasks in product:`);
            updatedTargetProduct.tasks.edges.forEach((edge, index) => {
                console.log(`     ${index + 1}. ${edge.node.name} (${edge.node.id}) - Seq: ${edge.node.sequenceNumber}`);
            });
        }

        // Step 6: Summary
        console.log('\n📊 Test Summary:');
        console.log(`   Product: ${updatedTargetProduct.name}`);
        console.log(`   Tasks before: ${targetProduct.tasks.edges.length}`);
        console.log(`   Tasks after: ${updatedTargetProduct.tasks.edges.length}`);
        console.log(`   Task visibility: ${foundTask ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
        console.log(`   Query limit: 100 tasks (increased from 10)`);

        if (foundTask) {
            console.log('\n🎉 Task visibility fix appears to be working correctly!');
            console.log('   The increased query limit (first: 100) successfully retrieved the new task.');
        } else {
            console.log('\n⚠️  Task visibility issue persists. Further investigation needed.');
            console.log('   Possible causes:');
            console.log('   - Caching issue');
            console.log('   - Database transaction not committed');
            console.log('   - Task ordering issue');
        }

    } catch (error) {
        console.error('\n🚨 Test failed with error:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
testTaskVisibilityFix();
