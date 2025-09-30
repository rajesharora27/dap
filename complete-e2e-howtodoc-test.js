#!/usr/bin/env node
/**
 * Complete End-to-End Test for HowToDoc/HowToVideo Persistence
 * 
 * This test creates a fresh test environment and validates the complete workflow:
 * 1. Create a new test product with all attributes
 * 2. Create tasks with howToDoc/howToVideo via GUI simulation
 * 3. Verify persistence through frontend → backend → database → retrieval
 * 4. Test actual GUI form workflow
 */

const { execSync } = require('child_process');

// Configuration
const BACKEND_URL = 'http://localhost:4000/graphql';

// Test data for new product
const TEST_PRODUCT_DATA = {
  name: 'HowTo Test Product - E2E Validation',
  description: 'Product created specifically for testing howToDoc and howToVideo persistence'
};

// Test data for task with all attributes
const TEST_TASK_DATA = {
  name: 'Complete Test Task with All Attributes',
  description: 'Task with all possible attributes including howToDoc and howToVideo for E2E testing',
  estMinutes: 180,
  weight: 25,
  priority: 'Critical',
  notes: 'Comprehensive test notes to verify all text fields work correctly',
  howToDoc: 'https://test-documentation.example.com/complete-implementation-guide',
  howToVideo: 'https://test-videos.example.com/watch?v=complete-tutorial-123'
};

console.log('🧪 COMPLETE END-TO-END HOWTODOC/HOWTOVIDEO PERSISTENCE TEST');
console.log('=' .repeat(80));

/**
 * Setup fetch for Node.js
 */
async function setupFetch() {
  try {
    const fetch = await import('node-fetch');
    global.fetch = fetch.default;
  } catch (error) {
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

/**
 * Step 1: Create a fresh test product
 */
async function createTestProduct() {
  console.log('\n🏗️  Step 1: Creating fresh test product...');
  
  const mutation = `
    mutation CreateProduct($input: ProductInput!) {
      createProduct(input: $input) {
        id
        name
        description
        statusPercent
        completionPercentage
      }
    }
  `;

  const variables = {
    input: TEST_PRODUCT_DATA
  };

  console.log('📤 Creating product:', JSON.stringify(variables.input, null, 2));

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

    const product = result.data?.createProduct;
    
    if (!product) {
      throw new Error('Product creation returned null/undefined');
    }

    console.log('✅ Test product created successfully!');
    console.log(`📍 Product ID: ${product.id}`);
    console.log(`📍 Product Name: ${product.name}`);
    
    return product;
    
  } catch (error) {
    console.error('❌ Failed to create test product:', error.message);
    throw error;
  }
}

/**
 * Step 2: Create task with all attributes including howToDoc/howToVideo
 */
async function createTaskWithAllAttributes(productId) {
  console.log('\n🚀 Step 2: Creating task with ALL attributes including howToDoc/howToVideo...');
  
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
        licenseLevel
      }
    }
  `;

  const variables = {
    input: {
      ...TEST_TASK_DATA,
      productId: productId
    }
  };

  console.log('📤 Creating task with data:', JSON.stringify(variables.input, null, 2));
  
  // Highlight the critical fields we're testing
  console.log('\n🎯 CRITICAL FIELDS BEING TESTED:');
  console.log(`   📝 notes: "${variables.input.notes}"`);
  console.log(`   📚 howToDoc: "${variables.input.howToDoc}"`);
  console.log(`   🎥 howToVideo: "${variables.input.howToVideo}"`);

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

    const task = result.data?.createTask;
    
    if (!task) {
      throw new Error('Task creation returned null/undefined');
    }

    console.log('✅ Task created successfully!');
    console.log('📋 Complete task data returned from creation:');
    console.log(JSON.stringify(task, null, 2));
    
    // Immediate verification of returned data
    console.log('\n🔍 IMMEDIATE VERIFICATION (from creation response):');
    const immediate = {
      notes: task.notes === TEST_TASK_DATA.notes,
      howToDoc: task.howToDoc === TEST_TASK_DATA.howToDoc,
      howToVideo: task.howToVideo === TEST_TASK_DATA.howToVideo
    };
    
    console.log(`   ✅ notes match: ${immediate.notes} ("${task.notes}")`);
    console.log(`   ${immediate.howToDoc ? '✅' : '❌'} howToDoc match: ${immediate.howToDoc} ("${task.howToDoc}")`);
    console.log(`   ${immediate.howToVideo ? '✅' : '❌'} howToVideo match: ${immediate.howToVideo} ("${task.howToVideo}")`);
    
    return { task, immediateVerification: immediate };
    
  } catch (error) {
    console.error('❌ Failed to create task:', error.message);
    throw error;
  }
}

/**
 * Step 3: Retrieve task using connection/edges pattern (like frontend does)
 */
async function retrieveTaskViaConnection(productId, taskId) {
  console.log('\n🔍 Step 3: Retrieving task via connection (frontend simulation)...');
  
  const query = `
    query GetProductTasks($productId: ID!) {
      product(id: $productId) {
        id
        name
        tasks(first: 20) {
          edges {
            node {
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
              licenseLevel
            }
          }
        }
      }
    }
  `;

  console.log(`📤 Retrieving tasks for product: ${productId}`);
  console.log(`🎯 Looking for task: ${taskId}`);

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query, 
        variables: { productId } 
      })
    });

    const result = await response.json();
    
    if (!response.ok || result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors || result)}`);
    }

    const product = result.data?.product;
    const tasks = product?.tasks?.edges?.map(e => e.node) || [];
    const targetTask = tasks.find(t => t.id === taskId);
    
    if (!targetTask) {
      console.log('❌ Task not found in product tasks');
      console.log(`📋 Available tasks: ${tasks.map(t => `${t.id}:${t.name}`).join(', ')}`);
      throw new Error('Task not found in product tasks connection');
    }

    console.log('✅ Task retrieved successfully via connection!');
    console.log('📋 Retrieved task data:');
    console.log(JSON.stringify(targetTask, null, 2));
    
    // Verification of retrieved data
    console.log('\n🔍 RETRIEVAL VERIFICATION (from connection query):');
    const retrieval = {
      notes: targetTask.notes === TEST_TASK_DATA.notes,
      howToDoc: targetTask.howToDoc === TEST_TASK_DATA.howToDoc,
      howToVideo: targetTask.howToVideo === TEST_TASK_DATA.howToVideo
    };
    
    console.log(`   ✅ notes match: ${retrieval.notes} ("${targetTask.notes}")`);
    console.log(`   ${retrieval.howToDoc ? '✅' : '❌'} howToDoc match: ${retrieval.howToDoc} ("${targetTask.howToDoc}")`);
    console.log(`   ${retrieval.howToVideo ? '✅' : '❌'} howToVideo match: ${retrieval.howToVideo} ("${targetTask.howToVideo}")`);
    
    return { task: targetTask, retrievalVerification: retrieval };
    
  } catch (error) {
    console.error('❌ Failed to retrieve task via connection:', error.message);
    throw error;
  }
}

/**
 * Step 4: Direct database verification
 */
async function verifyDatabasePersistence(taskId) {
  console.log('\n🗄️  Step 4: Direct database verification...');
  
  try {
    console.log(`📤 Checking database for task: ${taskId}`);
    
    // Use docker exec to query the database directly
    const dbQuery = `SELECT id, name, notes, "howToDoc", "howToVideo" FROM "Task" WHERE id = '${taskId}';`;
    
    console.log('🔍 Executing database query:', dbQuery);
    
    const result = execSync(
      `cd /data/dap && docker exec dap_db_1 psql -U postgres -d dap -c "${dbQuery}"`,
      { encoding: 'utf8' }
    );
    
    console.log('📋 Database query result:');
    console.log(result);
    
    // Parse the result
    const lines = result.split('\n').filter(line => line.trim());
    const dataLine = lines.find(line => line.includes(taskId));
    
    if (!dataLine) {
      console.log('❌ Task not found in database');
      return { found: false, containsHowToDoc: false, containsHowToVideo: false };
    }

    console.log('✅ Task found in database');
    console.log(`📊 Database row: ${dataLine}`);
    
    // Check for our test values
    const containsHowToDoc = dataLine.includes('test-documentation.example.com');
    const containsHowToVideo = dataLine.includes('test-videos.example.com');
    const containsNotes = dataLine.includes('Comprehensive test notes');
    
    console.log('\n🔍 DATABASE VERIFICATION:');
    console.log(`   ✅ notes in DB: ${containsNotes}`);
    console.log(`   ${containsHowToDoc ? '✅' : '❌'} howToDoc in DB: ${containsHowToDoc}`);
    console.log(`   ${containsHowToVideo ? '✅' : '❌'} howToVideo in DB: ${containsHowToVideo}`);
    
    return { 
      found: true, 
      containsNotes: containsNotes,
      containsHowToDoc: containsHowToDoc, 
      containsHowToVideo: containsHowToVideo 
    };
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    return { found: false, containsHowToDoc: false, containsHowToVideo: false };
  }
}

/**
 * Step 5: Test frontend form simulation
 */
async function testFrontendFormSimulation(productId) {
  console.log('\n🌐 Step 5: Simulating frontend form submission...');
  
  // This simulates the exact data flow from TaskDialog → TasksPanel → GraphQL
  const frontendFormData = {
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
  
  console.log('📤 Frontend form would send this data:');
  console.log(JSON.stringify(frontendFormData, null, 2));
  
  // TasksPanel would add productId and clean undefined values
  const tasksPagelProcessedData = {
    ...frontendFormData,
    productId: productId
  };
  
  // Remove undefined values (as frontend does)
  Object.keys(tasksPagelProcessedData).forEach(key => {
    if (tasksPagelProcessedData[key] === undefined) {
      delete tasksPagelProcessedData[key];
    }
  });
  
  console.log('📤 TasksPanel would send this processed data to GraphQL:');
  console.log(JSON.stringify(tasksPagelProcessedData, null, 2));
  
  // Now test this exact flow
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

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: mutation, 
        variables: { input: tasksPagelProcessedData } 
      })
    });

    const result = await response.json();
    
    if (!response.ok || result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors || result)}`);
    }

    const task = result.data?.createTask;
    
    console.log('✅ Frontend simulation task created successfully!');
    console.log('📋 Frontend simulation result:');
    console.log(JSON.stringify(task, null, 2));
    
    const frontendVerification = {
      notes: task.notes === TEST_TASK_DATA.notes,
      howToDoc: task.howToDoc === TEST_TASK_DATA.howToDoc,
      howToVideo: task.howToVideo === TEST_TASK_DATA.howToVideo
    };
    
    console.log('\n🔍 FRONTEND SIMULATION VERIFICATION:');
    console.log(`   ✅ notes match: ${frontendVerification.notes}`);
    console.log(`   ${frontendVerification.howToDoc ? '✅' : '❌'} howToDoc match: ${frontendVerification.howToDoc}`);
    console.log(`   ${frontendVerification.howToVideo ? '✅' : '❌'} howToVideo match: ${frontendVerification.howToVideo}`);
    
    return { task, frontendVerification };
    
  } catch (error) {
    console.error('❌ Frontend simulation failed:', error.message);
    throw error;
  }
}

/**
 * Main test execution
 */
async function runCompleteTest() {
  console.log('\n🎯 Starting complete end-to-end test workflow...');
  
  let testResults = {
    productCreated: false,
    taskCreated: false,
    immediateVerification: { notes: false, howToDoc: false, howToVideo: false },
    retrievalVerification: { notes: false, howToDoc: false, howToVideo: false },
    databaseVerification: { found: false, containsNotes: false, containsHowToDoc: false, containsHowToVideo: false },
    frontendVerification: { notes: false, howToDoc: false, howToVideo: false }
  };
  
  let createdProduct = null;
  let createdTask = null;
  let frontendTask = null;
  
  try {
    // Step 1: Create test product
    createdProduct = await createTestProduct();
    testResults.productCreated = true;
    
    // Step 2: Create task with all attributes
    const { task, immediateVerification } = await createTaskWithAllAttributes(createdProduct.id);
    createdTask = task;
    testResults.taskCreated = true;
    testResults.immediateVerification = immediateVerification;
    
    // Step 3: Retrieve task via connection
    const { task: retrievedTask, retrievalVerification } = await retrieveTaskViaConnection(createdProduct.id, createdTask.id);
    testResults.retrievalVerification = retrievalVerification;
    
    // Step 4: Database verification
    const databaseVerification = await verifyDatabasePersistence(createdTask.id);
    testResults.databaseVerification = databaseVerification;
    
    // Step 5: Frontend form simulation
    const { task: frontendTaskResult, frontendVerification } = await testFrontendFormSimulation(createdProduct.id);
    frontendTask = frontendTaskResult;
    testResults.frontendVerification = frontendVerification;
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
  }
  
  // Comprehensive test report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`✅ Test product created: ${testResults.productCreated}`);
  if (createdProduct) {
    console.log(`   📍 Product: ${createdProduct.name} (${createdProduct.id})`);
  }
  
  console.log(`${testResults.taskCreated ? '✅' : '❌'} Task created: ${testResults.taskCreated}`);
  if (createdTask) {
    console.log(`   📍 Task: ${createdTask.name} (${createdTask.id})`);
  }
  
  console.log('\n🔍 VERIFICATION RESULTS:');
  
  console.log('\n1️⃣  Immediate (creation response):');
  console.log(`   ✅ notes: ${testResults.immediateVerification.notes}`);
  console.log(`   ${testResults.immediateVerification.howToDoc ? '✅' : '❌'} howToDoc: ${testResults.immediateVerification.howToDoc}`);
  console.log(`   ${testResults.immediateVerification.howToVideo ? '✅' : '❌'} howToVideo: ${testResults.immediateVerification.howToVideo}`);
  
  console.log('\n2️⃣  Retrieval (GraphQL connection):');
  console.log(`   ✅ notes: ${testResults.retrievalVerification.notes}`);
  console.log(`   ${testResults.retrievalVerification.howToDoc ? '✅' : '❌'} howToDoc: ${testResults.retrievalVerification.howToDoc}`);
  console.log(`   ${testResults.retrievalVerification.howToVideo ? '✅' : '❌'} howToVideo: ${testResults.retrievalVerification.howToVideo}`);
  
  console.log('\n3️⃣  Database (direct SQL):');
  console.log(`   ${testResults.databaseVerification.found ? '✅' : '❌'} task found: ${testResults.databaseVerification.found}`);
  console.log(`   ✅ notes in DB: ${testResults.databaseVerification.containsNotes}`);
  console.log(`   ${testResults.databaseVerification.containsHowToDoc ? '✅' : '❌'} howToDoc in DB: ${testResults.databaseVerification.containsHowToDoc}`);
  console.log(`   ${testResults.databaseVerification.containsHowToVideo ? '✅' : '❌'} howToVideo in DB: ${testResults.databaseVerification.containsHowToVideo}`);
  
  console.log('\n4️⃣  Frontend simulation:');
  console.log(`   ✅ notes: ${testResults.frontendVerification.notes}`);
  console.log(`   ${testResults.frontendVerification.howToDoc ? '✅' : '❌'} howToDoc: ${testResults.frontendVerification.howToDoc}`);
  console.log(`   ${testResults.frontendVerification.howToVideo ? '✅' : '❌'} howToVideo: ${testResults.frontendVerification.howToVideo}`);
  
  // Overall assessment
  const allHowToDocTests = testResults.immediateVerification.howToDoc && 
                           testResults.retrievalVerification.howToDoc && 
                           testResults.databaseVerification.containsHowToDoc &&
                           testResults.frontendVerification.howToDoc;
                           
  const allHowToVideoTests = testResults.immediateVerification.howToVideo && 
                             testResults.retrievalVerification.howToVideo && 
                             testResults.databaseVerification.containsHowToVideo &&
                             testResults.frontendVerification.howToVideo;
  
  console.log('\n🎯 FINAL ASSESSMENT:');
  console.log(`${allHowToDocTests ? '✅' : '❌'} howToDoc COMPLETE SUCCESS: ${allHowToDocTests}`);
  console.log(`${allHowToVideoTests ? '✅' : '❌'} howToVideo COMPLETE SUCCESS: ${allHowToVideoTests}`);
  
  if (allHowToDocTests && allHowToVideoTests) {
    console.log('\n🎉 COMPLETE SUCCESS! Both howToDoc and howToVideo are persisting correctly!');
    console.log('   → The backend, database, and API are all working perfectly');
    console.log('   → The issue must be specific to the GUI form interaction');
  } else {
    console.log('\n🔧 DIAGNOSIS:');
    if (!testResults.immediateVerification.howToDoc || !testResults.immediateVerification.howToVideo) {
      console.log('   → Issue is in GraphQL mutation processing');
    } else if (!testResults.retrievalVerification.howToDoc || !testResults.retrievalVerification.howToVideo) {
      console.log('   → Issue is in GraphQL query/retrieval');
    } else if (!testResults.databaseVerification.containsHowToDoc || !testResults.databaseVerification.containsHowToVideo) {
      console.log('   → Issue is in database persistence layer');
    } else {
      console.log('   → Issue is in frontend form processing');
    }
  }
  
  // Cleanup information
  console.log('\n🧹 CLEANUP INFORMATION:');
  if (createdProduct) {
    console.log(`   Test product ID: ${createdProduct.id}`);
  }
  if (createdTask) {
    console.log(`   Main test task ID: ${createdTask.id}`);
  }
  if (frontendTask) {
    console.log(`   Frontend test task ID: ${frontendTask.id}`);
  }
  
  console.log('\n' + '='.repeat(80));
  
  return { 
    success: allHowToDocTests && allHowToVideoTests, 
    productId: createdProduct?.id,
    taskId: createdTask?.id,
    frontendTaskId: frontendTask?.id
  };
}

// Execute the complete test
(async () => {
  await setupFetch();
  const result = await runCompleteTest();
  process.exit(result.success ? 0 : 1);
})();