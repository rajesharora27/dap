#!/usr/bin/env node

/**
 * Automated task creation test to simulate button click behavior
 * This will help us identify where the frontend is failing
 */

const { execSync, spawn } = require('child_process');
const http = require('http');

console.log('🔍 Starting comprehensive frontend debugging test...\n');

// Function to check if services are ready
function checkServices() {
  try {
    // Check backend
    execSync('curl -s http://localhost:4000/health', { timeout: 5000 });
    console.log('✅ Backend service is ready');
    
    // Check frontend
    const frontendCheck = execSync('curl -s http://localhost:5173', { timeout: 5000 });
    console.log('✅ Frontend service is ready');
    
    return true;
  } catch (error) {
    console.log('❌ Services not ready:', error.message);
    return false;
  }
}

// Function to monitor backend logs in real-time
function startBackendLogMonitor() {
  console.log('🔍 Starting backend log monitor...');
  
  const logProcess = spawn('docker', ['compose', 'logs', '-f', 'backend'], {
    cwd: '/data/dap',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  logProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('CREATE_TASK CALLED') || output.includes('🚀')) {
      console.log('📡 BACKEND LOG:', output.trim());
    }
  });
  
  return logProcess;
}

// Function to simulate the exact frontend GraphQL call that should be made
function simulateFrontendCall() {
  console.log('\n🎯 Simulating frontend task creation...');
  
  const mutation = `
    mutation CreateTask($input:TaskInput!) { 
      createTask(input:$input) { 
        id name description estMinutes weight notes priority licenseLevel howToDoc howToVideo
        product { id name } outcomes { id name }
      } 
    }
  `;
  
  const variables = {
    input: {
      productId: "cmg57oism0006nx013k9yabpq",
      name: "Frontend Debug Test",
      description: "Testing frontend issue",
      estMinutes: 30,
      weight: 5,
      notes: "Debug notes",
      priority: "Medium", 
      howToDoc: "https://debug-frontend.example.com",
      howToVideo: "https://debug-video.example.com"
    }
  };
  
  const requestBody = JSON.stringify({
    query: mutation,
    variables: variables
  });
  
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/graphql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
}

// Function to check frontend HTML to see if form elements exist
function checkFrontendForm() {
  console.log('\n🔍 Checking frontend form structure...');
  
  try {
    const frontendHtml = execSync('curl -s http://localhost:5173', { encoding: 'utf8' });
    
    // Check if basic HTML is loaded
    if (frontendHtml.includes('<div id="root">')) {
      console.log('✅ Frontend React app is loaded');
    } else {
      console.log('❌ Frontend React app not properly loaded');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to check frontend:', error.message);
    return false;
  }
}

// Main test execution
async function runComprehensiveTest() {
  console.log('='.repeat(60));
  console.log('🧪 COMPREHENSIVE FRONTEND DEBUG TEST');
  console.log('='.repeat(60));
  
  // Check services
  if (!checkServices()) {
    console.log('❌ Services not ready. Exiting...');
    return;
  }
  
  // Check frontend form
  if (!checkFrontendForm()) {
    console.log('❌ Frontend form check failed. Exiting...');
    return;
  }
  
  // Start backend log monitoring
  const logMonitor = startBackendLogMonitor();
  
  // Wait a moment for log monitor to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n⏰ Waiting 5 seconds for you to try creating a task in the GUI...');
  console.log('📋 Please create a task with:');
  console.log('   - Name: "GUI Debug Test"');
  console.log('   - How To Doc: "https://gui-test.example.com"');
  console.log('   - How To Video: "https://gui-video.example.com"');
  console.log('\n🎯 Monitoring backend logs for createTask calls...\n');
  
  // Wait for GUI interaction
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
  
  console.log('\n⏰ GUI test window ended. Now testing direct API call...\n');
  
  // Test direct API call to confirm backend works
  try {
    const result = await simulateFrontendCall();
    
    if (result.errors) {
      console.log('❌ Direct API call failed:', JSON.stringify(result.errors, null, 2));
    } else {
      console.log('✅ Direct API call succeeded:', JSON.stringify(result.data.createTask, null, 2));
      
      const task = result.data.createTask;
      if (task.howToDoc && task.howToVideo) {
        console.log('✅ Direct API correctly persisted howToDoc/howToVideo');
      } else {
        console.log('❌ Direct API failed to persist howToDoc/howToVideo');
      }
    }
  } catch (error) {
    console.log('💥 Direct API call failed:', error.message);
  }
  
  // Stop log monitoring
  logMonitor.kill();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log(`
📊 Analysis:
   1. If backend logs showed createTask calls: Frontend is working, backend has issue
   2. If NO backend logs: Frontend is not making GraphQL requests at all
   3. If direct API works but GUI doesn't: Frontend form/validation issue
   
🔍 Most Likely Causes (if no backend logs):
   ❌ Form validation blocking submission
   ❌ JavaScript error in browser console
   ❌ Network connectivity issue
   ❌ Apollo Client configuration problem
   ❌ Button click handler not connected
   
🎯 Next Steps:
   1. Check browser console for JavaScript errors
   2. Check browser Network tab for failed requests
   3. Verify form validation logic
   4. Check if Save button is properly connected to handleSave
  `);
}

// Clean up function
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

// Start the test
runComprehensiveTest().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});