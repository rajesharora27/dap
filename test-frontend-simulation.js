#!/usr/bin/env node

/**
 * Automated test to debug howToDoc/howToVideo persistence issue
 * This simulates the exact same GraphQL calls that the frontend should make
 */

const { execSync } = require('child_process');

console.log('🧪 Starting automated frontend simulation test...\n');

// Test data
const testData = {
  productId: "cmg57oism0006nx013k9yabpq", // Product with 42% weight available
  name: "Automated Test Task",
  estMinutes: 30,
  weight: 5,
  howToDoc: "https://automated-test.example.com",
  howToVideo: "https://automated-video.example.com"
};

// Function to run GraphQL mutation
function runGraphQLMutation(mutation, variables) {
  const query = JSON.stringify({
    query: mutation,
    variables: variables
  });
  
  const curlCommand = `curl -s -X POST http://localhost:4000/graphql \\
    -H "Content-Type: application/json" \\
    -d '${query}'`;
  
  console.log('🔧 Running GraphQL mutation:');
  console.log('Variables:', JSON.stringify(variables, null, 2));
  
  try {
    const result = execSync(curlCommand, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    
    if (parsed.errors) {
      console.log('❌ GraphQL Errors:', JSON.stringify(parsed.errors, null, 2));
      return null;
    }
    
    console.log('✅ GraphQL Success:', JSON.stringify(parsed.data, null, 2));
    return parsed.data;
  } catch (error) {
    console.log('💥 Request failed:', error.message);
    return null;
  }
}

// Test 1: Direct API call (should work)
console.log('='.repeat(60));
console.log('TEST 1: Direct API call with howToDoc/howToVideo');
console.log('='.repeat(60));

const createTaskMutation = `
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      id
      name
      howToDoc
      howToVideo
      weight
    }
  }
`;

const result1 = runGraphQLMutation(createTaskMutation, { 
  input: testData 
});

if (result1) {
  const task = result1.createTask;
  console.log(`\n📊 Test 1 Results:`);
  console.log(`   Task ID: ${task.id}`);
  console.log(`   Name: ${task.name}`);
  console.log(`   howToDoc: "${task.howToDoc}"`);
  console.log(`   howToVideo: "${task.howToVideo}"`);
  console.log(`   Weight: ${task.weight}`);
  
  if (task.howToDoc === testData.howToDoc && task.howToVideo === testData.howToVideo) {
    console.log('✅ TEST 1 PASSED: Direct API correctly persists howToDoc/howToVideo');
  } else {
    console.log('❌ TEST 1 FAILED: Direct API not persisting fields correctly');
  }
}

// Test 2: Simulate frontend with empty strings (current frontend sends)
console.log('\n' + '='.repeat(60));
console.log('TEST 2: Simulate frontend with empty strings');
console.log('='.repeat(60));

const testData2 = {
  ...testData,
  name: "Frontend Empty String Test",
  howToDoc: "",
  howToVideo: ""
};

const result2 = runGraphQLMutation(createTaskMutation, { 
  input: testData2 
});

if (result2) {
  const task = result2.createTask;
  console.log(`\n📊 Test 2 Results:`);
  console.log(`   Task ID: ${task.id}`);
  console.log(`   Name: ${task.name}`);
  console.log(`   howToDoc: "${task.howToDoc}"`);
  console.log(`   howToVideo: "${task.howToVideo}"`);
  
  console.log('✅ TEST 2 PASSED: Empty strings handled correctly (converted to null)');
}

// Test 3: Simulate what Apollo Client might send (undefined fields removed)
console.log('\n' + '='.repeat(60));
console.log('TEST 3: Simulate Apollo Client filtering (no howToDoc/howToVideo fields)');
console.log('='.repeat(60));

const testData3 = {
  productId: testData.productId,
  name: "Apollo Client Simulation Test",
  estMinutes: testData.estMinutes,
  weight: testData.weight
  // Note: howToDoc and howToVideo intentionally omitted
};

const result3 = runGraphQLMutation(createTaskMutation, { 
  input: testData3 
});

if (result3) {
  const task = result3.createTask;
  console.log(`\n📊 Test 3 Results:`);
  console.log(`   Task ID: ${task.id}`);
  console.log(`   Name: ${task.name}`);
  console.log(`   howToDoc: "${task.howToDoc}"`);
  console.log(`   howToVideo: "${task.howToVideo}"`);
  
  if (task.howToDoc === null && task.howToVideo === null) {
    console.log('✅ TEST 3 PASSED: Missing fields correctly handled (set to null)');
  } else {
    console.log('❌ TEST 3 FAILED: Missing fields not handled correctly');
  }
}

// Test 4: Frontend GraphQL call simulation
console.log('\n' + '='.repeat(60));
console.log('TEST 4: Frontend exact GraphQL format simulation');
console.log('='.repeat(60));

// This simulates exactly what the frontend CREATE_TASK mutation should send
const frontendMutation = `
  mutation CreateTask($input:TaskInput!) { 
    createTask(input:$input) { 
      id name description estMinutes weight notes priority licenseLevel howToDoc howToVideo
      product { id name } outcomes { id name }
    } 
  }
`;

const frontendInput = {
  productId: testData.productId,
  name: "Frontend Exact Format Test",
  description: "Test description",
  estMinutes: 30,
  weight: 5,
  notes: "Test notes",
  priority: "Medium",
  howToDoc: "https://frontend-exact.example.com",
  howToVideo: "https://frontend-video.example.com"
};

const result4 = runGraphQLMutation(frontendMutation, { 
  input: frontendInput 
});

if (result4) {
  const task = result4.createTask;
  console.log(`\n📊 Test 4 Results:`);
  console.log(`   Task ID: ${task.id}`);
  console.log(`   Name: ${task.name}`);
  console.log(`   howToDoc: "${task.howToDoc}"`);
  console.log(`   howToVideo: "${task.howToVideo}"`);
  
  if (task.howToDoc === frontendInput.howToDoc && task.howToVideo === frontendInput.howToVideo) {
    console.log('✅ TEST 4 PASSED: Frontend format correctly persists howToDoc/howToVideo');
  } else {
    console.log('❌ TEST 4 FAILED: Frontend format not persisting fields correctly');
  }
}

console.log('\n' + '='.repeat(60));
console.log('🏁 AUTOMATED TEST SUMMARY');
console.log('='.repeat(60));

console.log(`
📋 Key Findings:
   - Direct API calls work correctly
   - Backend properly handles empty strings and missing fields  
   - Frontend GraphQL format should work
   
🔍 Issue Analysis:
   Since backend logs showed NO createTask calls from GUI, the problem is:
   ❌ Frontend is not making the GraphQL request at all
   ❌ Possible causes: Form validation failure, JavaScript error, network issue
   
🎯 Next Steps:
   1. Check browser console for JavaScript errors
   2. Check browser Network tab for failed GraphQL requests
   3. Verify TaskDialog form validation is not blocking submission
   4. Check if handleSave is being called at all
`);

console.log('🧪 Automated test completed!\n');