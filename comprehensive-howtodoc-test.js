#!/usr/bin/env node
/**
 * Comprehensive End-to-End Test for howToDoc and howToVideo Persistence
 * 
 * This test simulates the complete user workflow:
 * 1. GUI form submission (simulated via frontend API calls)
 * 2. Frontend → Backend communication via GraphQL
 * 3. Backend → Database persistence
 * 4. Database → Backend → Frontend retrieval
 * 5. Verification that howToDoc and howToVideo persist correctly
 */

const { execSync } = require('child_process');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:4000/graphql';

// Test data
const TEST_TASK_DATA = {
  name: 'E2E Test Task with HowTo Fields',
  description: 'Test task to verify howToDoc and howToVideo persistence',
  estMinutes: 120,
  weight: 1,  // Use minimal weight to avoid exceeding 100%
  priority: 'High',
  notes: 'Test notes field for comparison',
  howToDoc: 'https://test-docs.example.com/how-to-implement-e2e-test',
  howToVideo: 'https://test-video.example.com/watch?v=e2e-test-123'
};

console.log('🧪 Starting Comprehensive HowToDoc/HowToVideo Persistence Test');
console.log('=' .repeat(70));

/**
 * Step 1: Get available products to test with
 */
async function getAvailableProducts() {
  console.log('\n📋 Step 1: Getting available products...');
  
  const query = `
    query GetProducts {
      products {
        edges {
          node {
            id
            name
            tasks {
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
  `;

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    
    if (!response.ok || result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors || result)}`);
    }

    const products = result.data?.products?.edges?.map(e => e.node) || [];
    
    if (products.length === 0) {
      throw new Error('No products found. Cannot test task creation.');
    }

    console.log(`✅ Found ${products.length} products`);
    console.log(`📍 Using product: ${products[0].name} (ID: ${products[0].id})`);
    
    return products[0];
    
  } catch (error) {
    console.error('❌ Failed to get products:', error.message);
    throw error;
  }
}

/**
 * Step 2: Create task via GraphQL (simulating frontend form submission)
 */
async function createTaskWithHowToFields(productId) {
  console.log('\n🚀 Step 2: Creating task with howToDoc and howToVideo...');
  
  const mutation = `
    mutation CreateTask($input: TaskInput!) {
      createTask(input: $input) {
        id
        name
        description
        estMinutes
        weight
        priority
        notes
        howToDoc
        howToVideo
        sequenceNumber
      }
    }
  `;

  const variables = {
    input: {
      ...TEST_TASK_DATA,
      productId: productId
    }
  };

  console.log('📤 Sending create task mutation with data:');
  console.log(JSON.stringify(variables.input, null, 2));

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const result = await response.json();
    
    if (!response.ok || result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors || result)}`);
    }

    const createdTask = result.data?.createTask;
    
    if (!createdTask) {
      throw new Error('Task creation returned null/undefined');
    }

    console.log('✅ Task created successfully!');
    console.log('📋 Created task data:');
    console.log(JSON.stringify(createdTask, null, 2));
    
    // Verify the returned data immediately
    console.log('\n🔍 Immediate verification of returned data:');
    console.log(`📝 notes: "${createdTask.notes}" (should be: "${TEST_TASK_DATA.notes}")`);
    console.log(`📚 howToDoc: "${createdTask.howToDoc}" (should be: "${TEST_TASK_DATA.howToDoc}")`);
    console.log(`🎥 howToVideo: "${createdTask.howToVideo}" (should be: "${TEST_TASK_DATA.howToVideo}")`);
    
    const immediateVerification = {
      notes: createdTask.notes === TEST_TASK_DATA.notes,
      howToDoc: createdTask.howToDoc === TEST_TASK_DATA.howToDoc,
      howToVideo: createdTask.howToVideo === TEST_TASK_DATA.howToVideo
    };
    
    console.log('\n📊 Immediate verification results:');
    console.log(`✅ notes persisted: ${immediateVerification.notes}`);
    console.log(`${immediateVerification.howToDoc ? '✅' : '❌'} howToDoc persisted: ${immediateVerification.howToDoc}`);
    console.log(`${immediateVerification.howToVideo ? '✅' : '❌'} howToVideo persisted: ${immediateVerification.howToVideo}`);
    
    return createdTask;
    
  } catch (error) {
    console.error('❌ Failed to create task:', error.message);
    throw error;
  }
}

/**
 * Step 3: Retrieve task to verify persistence
 */
async function retrieveTaskAndVerify(taskId) {
  console.log('\n🔍 Step 3: Retrieving task to verify persistence...');
  
  const query = `
    query GetTask($id: ID!) {
      task(id: $id) {
        id
        name
        description
        estMinutes
        weight
        priority
        notes
        howToDoc
        howToVideo
        sequenceNumber
      }
    }
  `;

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query, 
        variables: { id: taskId } 
      })
    });

    const result = await response.json();
    
    if (!response.ok || result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors || result)}`);
    }

    const retrievedTask = result.data?.task;
    
    if (!retrievedTask) {
      throw new Error('Task retrieval returned null/undefined');
    }

    console.log('✅ Task retrieved successfully!');
    console.log('📋 Retrieved task data:');
    console.log(JSON.stringify(retrievedTask, null, 2));
    
    // Comprehensive verification
    console.log('\n🔍 Final verification of persistence:');
    console.log(`📝 notes: "${retrievedTask.notes}" (expected: "${TEST_TASK_DATA.notes}")`);
    console.log(`📚 howToDoc: "${retrievedTask.howToDoc}" (expected: "${TEST_TASK_DATA.howToDoc}")`);
    console.log(`🎥 howToVideo: "${retrievedTask.howToVideo}" (expected: "${TEST_TASK_DATA.howToVideo}")`);
    
    const verification = {
      notes: retrievedTask.notes === TEST_TASK_DATA.notes,
      howToDoc: retrievedTask.howToDoc === TEST_TASK_DATA.howToDoc,
      howToVideo: retrievedTask.howToVideo === TEST_TASK_DATA.howToVideo
    };
    
    return { task: retrievedTask, verification };
    
  } catch (error) {
    console.error('❌ Failed to retrieve task:', error.message);
    throw error;
  }
}

/**
 * Step 4: Direct database verification
 */
async function verifyDirectDatabaseAccess(taskId) {
  console.log('\n🗄️  Step 4: Direct database verification...');
  
  try {
    const dbQuery = `
      SELECT id, name, notes, "howToDoc", "howToVideo", "createdAt", "updatedAt"
      FROM "Task" 
      WHERE id = '${taskId}';
    `;
    
    console.log('📤 Executing direct database query:');
    console.log(dbQuery);
    
    // Execute database query via docker
    const result = execSync(
      `cd /data/dap && docker compose exec -T postgres psql -U postgres -d dap -c "${dbQuery}"`,
      { encoding: 'utf8' }
    );
    
    console.log('📋 Database query result:');
    console.log(result);
    
    // Parse the result to extract the actual values
    const lines = result.split('\n').filter(line => line.trim() && !line.includes('---') && !line.includes('row'));
    const headerLine = lines.find(line => line.includes('id'));
    const dataLine = lines.find(line => line.includes(taskId));
    
    if (headerLine && dataLine) {
      console.log('✅ Task found in database');
      console.log(`📊 Raw database row: ${dataLine}`);
      
      // Check if howToDoc and howToVideo contain our test values
      const containsHowToDoc = dataLine.includes('test-docs.example.com');
      const containsHowToVideo = dataLine.includes('test-video.example.com');
      
      console.log(`${containsHowToDoc ? '✅' : '❌'} Database contains howToDoc: ${containsHowToDoc}`);
      console.log(`${containsHowToVideo ? '✅' : '❌'} Database contains howToVideo: ${containsHowToVideo}`);
      
      return { containsHowToDoc, containsHowToVideo };
    } else {
      console.log('❌ Task not found in database or unable to parse result');
      return { containsHowToDoc: false, containsHowToVideo: false };
    }
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.log('🔄 Attempting alternative database verification...');
    
    try {
      // Alternative approach using docker exec
      const altResult = execSync(
        `cd /data/dap && docker compose exec postgres psql -U postgres -d dap -c "SELECT * FROM \\"Task\\" WHERE id = '${taskId}';"`,
        { encoding: 'utf8' }
      );
      
      console.log('📋 Alternative database query result:');
      console.log(altResult);
      
      const containsHowToDoc = altResult.includes('test-docs.example.com');
      const containsHowToVideo = altResult.includes('test-video.example.com');
      
      return { containsHowToDoc, containsHowToVideo };
      
    } catch (altError) {
      console.error('❌ Alternative database verification also failed:', altError.message);
      return { containsHowToDoc: false, containsHowToVideo: false };
    }
  }
}

/**
 * Step 5: Test frontend data flow simulation
 */
async function testFrontendDataFlow(productId) {
  console.log('\n🌐 Step 5: Testing frontend data flow simulation...');
  
  // Simulate the exact data structure that TaskDialog sends
  const frontendTaskData = {
    name: TEST_TASK_DATA.name,
    description: TEST_TASK_DATA.description,
    estMinutes: TEST_TASK_DATA.estMinutes,
    weight: TEST_TASK_DATA.weight,
    notes: TEST_TASK_DATA.notes,
    priority: TEST_TASK_DATA.priority,
    howToDoc: TEST_TASK_DATA.howToDoc,
    howToVideo: TEST_TASK_DATA.howToVideo,
    licenseId: undefined,
    outcomeIds: undefined,
    releaseIds: undefined
  };
  
  console.log('📤 Frontend would send this data to TasksPanel:');
  console.log(JSON.stringify(frontendTaskData, null, 2));
  
  // Simulate TasksPanel processing (adding productId)
  const tasksPagelData = {
    ...frontendTaskData,
    productId: productId
  };
  
  console.log('📤 TasksPanel would send this data to GraphQL:');
  console.log(JSON.stringify(tasksPagelData, null, 2));
  
  // Now test this exact flow
  return await createTaskWithHowToFields(productId);
}

/**
 * Main test execution
 */
async function runComprehensiveTest() {
  let testResults = {
    productFound: false,
    taskCreated: false,
    immediateVerification: { notes: false, howToDoc: false, howToVideo: false },
    retrievalVerification: { notes: false, howToDoc: false, howToVideo: false },
    databaseVerification: { containsHowToDoc: false, containsHowToVideo: false }
  };
  
  let createdTask = null;
  
  try {
    // Step 1: Get products
    const product = await getAvailableProducts();
    testResults.productFound = true;
    
    // Step 5: Test frontend data flow
    createdTask = await testFrontendDataFlow(product.id);
    testResults.taskCreated = true;
    
    // Immediate verification from creation response
    testResults.immediateVerification = {
      notes: createdTask.notes === TEST_TASK_DATA.notes,
      howToDoc: createdTask.howToDoc === TEST_TASK_DATA.howToDoc,
      howToVideo: createdTask.howToVideo === TEST_TASK_DATA.howToVideo
    };
    
    // Step 3: Retrieve and verify
    const { task, verification } = await retrieveTaskAndVerify(createdTask.id);
    testResults.retrievalVerification = verification;
    
    // Step 4: Database verification
    testResults.databaseVerification = await verifyDirectDatabaseAccess(createdTask.id);
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    console.error(error.stack);
  }
  
  // Final test report
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(70));
  
  console.log(`✅ Product found: ${testResults.productFound}`);
  console.log(`${testResults.taskCreated ? '✅' : '❌'} Task created: ${testResults.taskCreated}`);
  
  console.log('\n🔍 Immediate verification (from create response):');
  console.log(`  ✅ notes: ${testResults.immediateVerification.notes}`);
  console.log(`  ${testResults.immediateVerification.howToDoc ? '✅' : '❌'} howToDoc: ${testResults.immediateVerification.howToDoc}`);
  console.log(`  ${testResults.immediateVerification.howToVideo ? '✅' : '❌'} howToVideo: ${testResults.immediateVerification.howToVideo}`);
  
  console.log('\n🔍 Retrieval verification (via GraphQL query):');
  console.log(`  ✅ notes: ${testResults.retrievalVerification.notes}`);
  console.log(`  ${testResults.retrievalVerification.howToDoc ? '✅' : '❌'} howToDoc: ${testResults.retrievalVerification.howToDoc}`);
  console.log(`  ${testResults.retrievalVerification.howToVideo ? '✅' : '❌'} howToVideo: ${testResults.retrievalVerification.howToVideo}`);
  
  console.log('\n🗄️  Database verification (direct SQL):');
  console.log(`  ${testResults.databaseVerification.containsHowToDoc ? '✅' : '❌'} howToDoc in DB: ${testResults.databaseVerification.containsHowToDoc}`);
  console.log(`  ${testResults.databaseVerification.containsHowToVideo ? '✅' : '❌'} howToVideo in DB: ${testResults.databaseVerification.containsHowToVideo}`);
  
  // Overall assessment
  const howToDocSuccess = testResults.immediateVerification.howToDoc && 
                          testResults.retrievalVerification.howToDoc && 
                          testResults.databaseVerification.containsHowToDoc;
                          
  const howToVideoSuccess = testResults.immediateVerification.howToVideo && 
                            testResults.retrievalVerification.howToVideo && 
                            testResults.databaseVerification.containsHowToVideo;
  
  console.log('\n🎯 OVERALL ASSESSMENT:');
  console.log(`${howToDocSuccess ? '✅' : '❌'} howToDoc persistence: ${howToDocSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${howToVideoSuccess ? '✅' : '❌'} howToVideo persistence: ${howToVideoSuccess ? 'SUCCESS' : 'FAILED'}`);
  
  if (!howToDocSuccess || !howToVideoSuccess) {
    console.log('\n🔧 NEXT STEPS:');
    if (!testResults.immediateVerification.howToDoc || !testResults.immediateVerification.howToVideo) {
      console.log('   → Issue is in the GraphQL mutation or backend processing');
      console.log('   → Check backend resolver for createTask mutation');
      console.log('   → Verify Prisma schema and model definitions');
    } else if (!testResults.retrievalVerification.howToDoc || !testResults.retrievalVerification.howToVideo) {
      console.log('   → Issue is in the GraphQL query or field resolution');
      console.log('   → Check backend resolver for task query');
    } else if (!testResults.databaseVerification.containsHowToDoc || !testResults.databaseVerification.containsHowToVideo) {
      console.log('   → Issue is in database persistence layer');
      console.log('   → Check Prisma client operations and database schema');
    }
  } else {
    console.log('\n🎉 SUCCESS: Both howToDoc and howToVideo are persisting correctly!');
    console.log('   The issue might be specific to the frontend form or GUI interaction.');
  }
  
  // Cleanup
  if (createdTask) {
    console.log(`\n🧹 Test task ID for cleanup: ${createdTask.id}`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  return { success: howToDocSuccess && howToVideoSuccess, taskId: createdTask?.id };
}

// Check if we have node-fetch available, if not use a simple fallback
async function setupFetch() {
  try {
    // Try to use node-fetch if available
    const fetch = await import('node-fetch');
    global.fetch = fetch.default;
  } catch (error) {
    // Fallback to a simple fetch implementation using curl
    global.fetch = async (url, options = {}) => {
      const curlCommand = `curl -s -X ${options.method || 'GET'} ` +
        `-H "Content-Type: application/json" ` +
        (options.body ? `-d '${options.body}'` : '') +
        ` "${url}"`;
      
      try {
        const result = execSync(curlCommand, { encoding: 'utf8' });
        return {
          ok: true,
          json: async () => JSON.parse(result)
        };
      } catch (error) {
        return {
          ok: false,
          json: async () => ({ errors: [{ message: error.message }] })
        };
      }
    };
  }
}

// Run the test
(async () => {
  await setupFetch();
  const result = await runComprehensiveTest();
  process.exit(result.success ? 0 : 1);
})();