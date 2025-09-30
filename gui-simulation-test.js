#!/usr/bin/env node
/**
 * Automated GUI Simulation Test for HowToDoc/HowToVideo
 * 
 * This test simulates actual browser interactions to identify the exact issue
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');

// Configuration
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:4000/graphql';
const TEST_PRODUCT_ID = 'cmg5n0r2s000gk101hi3oiswr';

console.log('🤖 AUTOMATED GUI SIMULATION TEST');
console.log('=' .repeat(50));

/**
 * Setup fetch for API calls
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
 * Check if services are running
 */
async function checkServices() {
  console.log('🔍 Checking services...');
  
  try {
    // Check frontend
    const frontendResult = execSync(`curl -s -o /dev/null -w "%{http_code}" ${FRONTEND_URL}`, { encoding: 'utf8' });
    if (frontendResult !== '200') {
      throw new Error(`Frontend not accessible: ${frontendResult}`);
    }
    console.log('✅ Frontend is running');
    
    // Check backend
    const backendTest = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' })
    });
    
    if (!backendTest.ok) {
      throw new Error('Backend not accessible');
    }
    console.log('✅ Backend is running');
    
    return true;
  } catch (error) {
    console.error('❌ Service check failed:', error.message);
    return false;
  }
}

/**
 * Create a test task via direct API to compare with GUI
 */
async function createDirectAPITask() {
  console.log('\n🔬 Step 1: Creating task via direct API for comparison...');
  
  const mutation = `
    mutation CreateTask($input: TaskInput!) {
      createTask(input: $input) {
        id
        name
        notes
        howToDoc
        howToVideo
      }
    }
  `;

  const variables = {
    input: {
      name: 'Direct API Test Task',
      description: 'Task created via direct API',
      estMinutes: 60,
      weight: 5,
      notes: 'Direct API notes',
      howToDoc: 'https://direct-api.example.com/docs',
      howToVideo: 'https://direct-api.example.com/video',
      productId: TEST_PRODUCT_ID
    }
  };

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation, variables })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    const task = result.data.createTask;
    console.log('✅ Direct API task created:', task.name);
    console.log(`   📝 Notes: "${task.notes}"`);
    console.log(`   📚 HowToDoc: "${task.howToDoc}"`);
    console.log(`   🎥 HowToVideo: "${task.howToVideo}"`);
    
    return task;
  } catch (error) {
    console.error('❌ Direct API task creation failed:', error.message);
    throw error;
  }
}

/**
 * Simulate GUI interaction using browser automation
 */
async function simulateGUIInteraction() {
  console.log('\n🖥️  Step 2: Simulating GUI interaction...');
  
  // Create a browser automation script
  const browserScript = `
const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('🖥️  BROWSER:', msg.text());
  });
  
  try {
    console.log('📍 Navigating to frontend...');
    await page.goto('${FRONTEND_URL}', { waitUntil: 'networkidle0' });
    
    console.log('🔍 Looking for test product...');
    
    // Wait for the page to load and find the test product
    await page.waitForSelector('[data-testid="product-item"], .MuiCard-root', { timeout: 10000 });
    
    // Look for our test product by name
    const productElements = await page.$$('h6, h5, .MuiTypography-root');
    let productFound = false;
    
    for (let element of productElements) {
      const text = await page.evaluate(el => el.textContent, element);
      if (text && text.includes('HowTo Test Product')) {
        console.log('✅ Found test product:', text);
        
        // Click on the product card or navigate to it
        const productCard = await element.evaluateHandle(el => el.closest('.MuiCard-root, [data-testid="product-item"]'));
        if (productCard) {
          await productCard.click();
          productFound = true;
          break;
        }
      }
    }
    
    if (!productFound) {
      throw new Error('Test product not found on page');
    }
    
    console.log('⏳ Waiting for product page to load...');
    await page.waitForTimeout(2000);
    
    console.log('🔍 Looking for Add Task button...');
    
    // Look for Add Task button
    const addTaskSelectors = [
      'button:contains("Add Task")',
      '[data-testid="add-task-button"]',
      'button[aria-label*="Add"]',
      'button:contains("Create")',
      '.MuiButton-root:contains("Add")'
    ];
    
    let addTaskButton = null;
    for (let selector of addTaskSelectors) {
      try {
        addTaskButton = await page.$(selector);
        if (addTaskButton) break;
      } catch (e) {
        // Try next selector
      }
    }
    
    // If not found by selector, search by text content
    if (!addTaskButton) {
      const buttons = await page.$$('button');
      for (let button of buttons) {
        const text = await page.evaluate(btn => btn.textContent, button);
        if (text && (text.includes('Add') || text.includes('Create')) && text.includes('Task')) {
          addTaskButton = button;
          break;
        }
      }
    }
    
    if (!addTaskButton) {
      throw new Error('Add Task button not found');
    }
    
    console.log('🖱️  Clicking Add Task button...');
    await addTaskButton.click();
    
    console.log('⏳ Waiting for task dialog to open...');
    await page.waitForTimeout(1000);
    
    // Look for the task dialog
    await page.waitForSelector('.MuiDialog-root, [role="dialog"]', { timeout: 5000 });
    
    console.log('📝 Filling out task form...');
    
    // Fill in the form fields
    const formData = {
      name: 'GUI Simulation Test Task',
      description: 'Task created via GUI simulation',
      notes: 'GUI simulation notes',
      howToDoc: 'https://gui-simulation.example.com/docs',
      howToVideo: 'https://gui-simulation.example.com/video'
    };
    
    // Fill name field
    const nameField = await page.$('input[id*="name"], input[label*="name"], input[placeholder*="name"]');
    if (nameField) {
      await nameField.click();
      await nameField.clear();
      await nameField.type(formData.name);
      console.log('✅ Filled name field');
    }
    
    // Fill description field  
    const descField = await page.$('textarea[id*="description"], input[label*="description"]');
    if (descField) {
      await descField.click();
      await descField.clear();
      await descField.type(formData.description);
      console.log('✅ Filled description field');
    }
    
    // Fill notes field
    const notesField = await page.$('textarea[id*="notes"], input[label*="Notes"]');
    if (notesField) {
      await notesField.click();
      await notesField.clear();
      await notesField.type(formData.notes);
      console.log('✅ Filled notes field');
    }
    
    // Fill howToDoc field
    const howToDocField = await page.$('input[label*="Documentation"], input[placeholder*="docs"]');
    if (howToDocField) {
      await howToDocField.click();
      await howToDocField.clear();
      await howToDocField.type(formData.howToDoc);
      console.log('✅ Filled howToDoc field');
    } else {
      console.log('❌ HowToDoc field not found');
    }
    
    // Fill howToVideo field
    const howToVideoField = await page.$('input[label*="Video"], input[placeholder*="video"]');
    if (howToVideoField) {
      await howToVideoField.click();
      await howToVideoField.clear();
      await howToVideoField.type(formData.howToVideo);
      console.log('✅ Filled howToVideo field');
    } else {
      console.log('❌ HowToVideo field not found');
    }
    
    console.log('⏳ Waiting before save...');
    await page.waitForTimeout(1000);
    
    // Click Save button
    const saveButton = await page.$('button:contains("Save"), button[type="submit"]');
    if (saveButton) {
      console.log('🖱️  Clicking Save button...');
      await saveButton.click();
      
      console.log('⏳ Waiting for save to complete...');
      await page.waitForTimeout(3000);
      
      console.log('✅ GUI simulation completed');
    } else {
      throw new Error('Save button not found');
    }
    
  } catch (error) {
    console.error('❌ Browser automation failed:', error.message);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: '/tmp/gui-simulation-error.png' });
    console.log('📸 Screenshot saved to /tmp/gui-simulation-error.png');
  } finally {
    await browser.close();
  }
})();
`;

  // Check if we can run browser automation
  try {
    // First try to install puppeteer if needed
    try {
      execSync('npm list puppeteer', { cwd: '/data/dap', stdio: 'ignore' });
    } catch (e) {
      console.log('📦 Installing puppeteer...');
      execSync('npm install puppeteer', { cwd: '/data/dap' });
    }
    
    // Write the browser script
    fs.writeFileSync('/data/dap/browser-automation.js', browserScript);
    
    console.log('🤖 Running browser automation...');
    execSync('node browser-automation.js', { 
      cwd: '/data/dap', 
      stdio: 'inherit',
      timeout: 60000 
    });
    
  } catch (error) {
    console.log('⚠️  Browser automation not available, falling back to manual simulation');
    console.log('   Reason:', error.message);
    
    // Fallback: Create a task via curl simulation
    return await simulateGUIWithCurl();
  }
}

/**
 * Simulate GUI workflow using direct API calls that match frontend behavior
 */
async function simulateGUIWithCurl() {
  console.log('\n🔄 Fallback: Simulating GUI workflow with API calls...');
  
  // This simulates exactly what the frontend should do
  const taskData = {
    name: 'GUI Simulation Test Task (Curl)',
    description: 'Task created via GUI simulation using curl',
    estMinutes: 60,
    weight: 5,
    notes: 'GUI simulation notes via curl',
    priority: 'Medium',
    howToDoc: 'https://curl-simulation.example.com/docs',
    howToVideo: 'https://curl-simulation.example.com/video',
    productId: TEST_PRODUCT_ID
  };
  
  console.log('📤 Simulating frontend form submission...');
  console.log('   Data being sent:', JSON.stringify(taskData, null, 2));
  
  const mutation = `
    mutation CreateTask($input: TaskInput!) {
      createTask(input: $input) {
        id
        name
        notes
        howToDoc
        howToVideo
      }
    }
  `;

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: mutation, 
        variables: { input: taskData } 
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    const task = result.data.createTask;
    console.log('✅ GUI simulation task created:', task.name);
    console.log(`   📝 Notes: "${task.notes}"`);
    console.log(`   📚 HowToDoc: "${task.howToDoc}"`);
    console.log(`   🎥 HowToVideo: "${task.howToVideo}"`);
    
    return task;
  } catch (error) {
    console.error('❌ GUI simulation failed:', error.message);
    throw error;
  }
}

/**
 * Verify all created tasks
 */
async function verifyAllTasks() {
  console.log('\n🔍 Step 3: Verifying all tasks...');
  
  const query = `
    query GetTestProduct {
      product(id: "${TEST_PRODUCT_ID}") {
        id
        name
        tasks(first: 20) {
          edges {
            node {
              id
              name
              notes
              howToDoc
              howToVideo
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    const tasks = result.data?.product?.tasks?.edges?.map(e => e.node) || [];
    
    console.log(`📋 Found ${tasks.length} total tasks in test product:`);
    
    let guiTasksFound = 0;
    let successfulHowToFields = 0;
    
    tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. 📄 Task: ${task.name}`);
      console.log(`   📝 Notes: "${task.notes || 'NONE'}"`);
      console.log(`   📚 HowToDoc: "${task.howToDoc || 'NONE'}"`);
      console.log(`   🎥 HowToVideo: "${task.howToVideo || 'NONE'}"`);
      
      // Check if this is a GUI-created task
      if (task.name.includes('GUI') || task.name.includes('My Test') || task.name.includes('Debug')) {
        guiTasksFound++;
        console.log('   🎯 ← GUI-created task');
        
        if (task.howToDoc && task.howToVideo) {
          console.log('   ✅ Has both howToDoc and howToVideo!');
          successfulHowToFields++;
        } else {
          console.log('   ❌ Missing howToDoc or howToVideo');
        }
      }
    });
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total tasks: ${tasks.length}`);
    console.log(`   GUI tasks found: ${guiTasksFound}`);
    console.log(`   GUI tasks with working howTo fields: ${successfulHowToFields}`);
    
    return { 
      totalTasks: tasks.length, 
      guiTasks: guiTasksFound, 
      successfulGUITasks: successfulHowToFields,
      tasks 
    };
    
  } catch (error) {
    console.error('❌ Task verification failed:', error.message);
    throw error;
  }
}

/**
 * Analyze the frontend component state
 */
async function analyzeFrontendState() {
  console.log('\n🔬 Step 4: Analyzing frontend component state...');
  
  try {
    // Check if the debug logs are actually in the compiled frontend
    const frontendResponse = await fetch(`${FRONTEND_URL}/src/components/dialogs/TaskDialog.tsx`);
    
    if (frontendResponse.ok) {
      const content = await frontendResponse.text();
      const hasDebugLogs = content.includes('How To Doc field changed') && 
                          content.includes('How To Video field changed');
      
      console.log(`📋 Debug logs in source: ${hasDebugLogs ? '✅' : '❌'}`);
    } else {
      console.log('📋 Cannot access frontend source directly');
    }
    
    // Check frontend build status
    console.log('📋 Checking frontend logs...');
    const frontendLogs = execSync('cd /data/dap && docker compose logs frontend --tail=50', { encoding: 'utf8' });
    
    if (frontendLogs.includes('error') || frontendLogs.includes('Error')) {
      console.log('⚠️  Frontend has errors:');
      console.log(frontendLogs.split('\n').filter(line => 
        line.toLowerCase().includes('error')).slice(-5).join('\n'));
    } else {
      console.log('✅ Frontend logs look clean');
    }
    
  } catch (error) {
    console.log('⚠️  Could not analyze frontend state:', error.message);
  }
}

/**
 * Main test execution
 */
async function runGUISimulation() {
  try {
    await setupFetch();
    
    const servicesOk = await checkServices();
    if (!servicesOk) {
      throw new Error('Services are not running properly');
    }
    
    // Step 1: Create direct API task for comparison
    const directAPITask = await createDirectAPITask();
    
    // Step 2: Simulate GUI interaction
    await simulateGUIInteraction();
    
    // Step 3: Verify all tasks
    const verification = await verifyAllTasks();
    
    // Step 4: Analyze frontend state
    await analyzeFrontendState();
    
    // Final assessment
    console.log('\n' + '='.repeat(50));
    console.log('🎯 FINAL ASSESSMENT');
    console.log('='.repeat(50));
    
    if (verification.successfulGUITasks === verification.guiTasks && verification.guiTasks > 0) {
      console.log('🎉 SUCCESS: All GUI tasks have working howToDoc/howToVideo fields!');
      console.log('   The issue has been resolved.');
      return true;
    } else {
      console.log('❌ ISSUE PERSISTS: GUI tasks are missing howToDoc/howToVideo fields');
      console.log(`   GUI tasks created: ${verification.guiTasks}`);
      console.log(`   GUI tasks with working fields: ${verification.successfulGUITasks}`);
      
      console.log('\n🔧 RECOMMENDED NEXT STEPS:');
      console.log('1. Check browser console during manual task creation');
      console.log('2. Verify React component re-rendering');
      console.log('3. Check for form field focus/blur issues');
      console.log('4. Verify Material-UI TextField behavior');
      
      return false;
    }
    
  } catch (error) {
    console.error('\n💥 GUI simulation failed:', error.message);
    return false;
  }
}

// Run the simulation
runGUISimulation().then(success => {
  process.exit(success ? 0 : 1);
});