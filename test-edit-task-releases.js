/**
 * Test script to verify edit task release functionality
 * This script will interact with the GraphQL API to test editing tasks with releases
 */

const fetch = require('node-fetch');

// GraphQL endpoint
const GRAPHQL_URL = 'http://localhost:4000/graphql';

async function graphqlQuery(query, variables = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  
  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
  }
  
  return result.data;
}

// Queries
const GET_PRODUCTS_QUERY = `
  query GetProducts {
    products {
      id
      name
      releases {
        id
        name
        level
        description
      }
    }
  }
`;

const GET_TASKS_QUERY = `
  query GetTasks {
    tasks {
      id
      name
      description
      product {
        id
        name
      }
      releases {
        id
        name
        level
      }
      releaseIds
    }
  }
`;

const UPDATE_TASK_MUTATION = `
  mutation UpdateTask($id: ID!, $input: TaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      name
      description
      releases {
        id
        name
        level
      }
      releaseIds
    }
  }
`;

async function testEditTaskReleases() {
  console.log('🚀 Testing Edit Task Releases Functionality\n');

  try {
    // Step 1: Get products with releases
    console.log('📋 Step 1: Fetching products with releases...');
    const productsResult = await graphqlQuery(GET_PRODUCTS_QUERY);
    const productsWithReleases = productsResult.products.filter(p => p.releases.length > 0);
    
    console.log(`Found ${productsWithReleases.length} products with releases:`);
    productsWithReleases.forEach(product => {
      console.log(`  - ${product.name}: ${product.releases.length} releases`);
      product.releases.forEach(r => console.log(`    * ${r.name} (v${r.level})`));
    });

    if (productsWithReleases.length === 0) {
      console.log('❌ No products with releases found. Cannot test edit functionality.');
      return;
    }

    // Step 2: Get tasks for the first product with releases
    console.log('\n📋 Step 2: Fetching tasks...');
    const tasksResult = await graphqlQuery(GET_TASKS_QUERY);
    const testProduct = productsWithReleases[0];
    const tasksForProduct = tasksResult.tasks.filter(t => t.product.id === testProduct.id);
    
    console.log(`Found ${tasksForProduct.length} tasks for product "${testProduct.name}"`);
    
    if (tasksForProduct.length === 0) {
      console.log(`❌ No tasks found for product "${testProduct.name}". Cannot test edit functionality.`);
      return;
    }

    // Step 3: Test editing a task with releases
    const testTask = tasksForProduct[0];
    const availableReleases = testProduct.releases;
    
    console.log(`\n📋 Step 3: Testing edit of task "${testTask.name}"`);
    console.log(`Current task releases: ${testTask.releases?.map(r => r.name).join(', ') || 'None'}`);
    console.log(`Available releases: ${availableReleases.map(r => r.name).join(', ')}`);

    // Select different releases for the task
    const newReleaseIds = availableReleases.slice(0, Math.min(2, availableReleases.length)).map(r => r.id);
    
    console.log(`\n🔧 Updating task with release IDs: ${newReleaseIds}`);
    
    const updateResult = await graphqlQuery(UPDATE_TASK_MUTATION, {
      id: testTask.id,
      input: {
        name: testTask.name,
        description: testTask.description,
        releaseIds: newReleaseIds
      }
    });

    const updatedTask = updateResult.updateTask;
    console.log(`✅ Task updated successfully!`);
    console.log(`New releases: ${updatedTask.releases?.map(r => `${r.name} (v${r.level})`).join(', ') || 'None'}`);
    console.log(`Release IDs: ${updatedTask.releaseIds || []}`);

    // Step 4: Verify the update
    console.log('\n📋 Step 4: Verifying the update...');
    const verifyResult = await graphqlQuery(GET_TASKS_QUERY);
    
    const verifiedTask = verifyResult.tasks.find(t => t.id === testTask.id);
    console.log(`Verified task releases: ${verifiedTask.releases?.map(r => `${r.name} (v${r.level})`).join(', ') || 'None'}`);
    
    console.log('\n✅ Edit task releases functionality test completed successfully!');
    console.log('\n📝 Frontend Testing Notes:');
    console.log('1. Open the DAP application at http://localhost:5173');
    console.log('2. Navigate to the task list for the test product');
    console.log('3. Click the edit button on any task');
    console.log('4. Verify the "Releases" dropdown is visible and populated');
    console.log('5. Select different releases and save');
    console.log('6. Verify the changes are persisted');
    console.log('7. Check browser console for debug messages from TaskDialog');

  } catch (error) {
    console.error('❌ Error testing edit task releases:', error.message);
  }
}

// Run the test
testEditTaskReleases();