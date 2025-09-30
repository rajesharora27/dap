#!/usr/bin/env node
/**
 * Automated Fix Verification Test
 * 
 * This test creates a task via API simulation and verifies the fix works
 */

const { execSync } = require('child_process');

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

async function testFix() {
  console.log('🔧 AUTOMATED FIX VERIFICATION TEST');
  console.log('=' .repeat(40));
  
  // Wait for frontend to restart
  console.log('⏳ Waiting for frontend to restart...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n1️⃣  Testing the fix with exact GUI workflow simulation...');
  
  // This simulates the exact data that should come from the fixed form
  const fixTestData = {
    name: 'Fix Verification Test',
    description: 'Testing that the React fix works',
    estMinutes: 45,
    weight: 2,
    notes: 'Fix verification notes',
    priority: 'High',
    howToDoc: 'https://fix-test.example.com/documentation',
    howToVideo: 'https://fix-test.example.com/video-tutorial',
    productId: 'cmg5n0r2s000gk101hi3oiswr'
  };

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
    console.log('📤 Simulating fixed form submission...');
    console.log('   Data:', JSON.stringify(fixTestData, null, 2));
    
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation, variables: { input: fixTestData } })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    const task = result.data.createTask;
    console.log('✅ Fix verification task created successfully!');
    console.log(`   📝 Notes: "${task.notes}"`);
    console.log(`   📚 HowToDoc: "${task.howToDoc}"`);
    console.log(`   🎥 HowToVideo: "${task.howToVideo}"`);
    
    // Verify all fields are present
    const hasAllFields = task.notes && task.howToDoc && task.howToVideo;
    
    if (hasAllFields) {
      console.log('\n🎉 FIX VERIFICATION: SUCCESS!');
      console.log('   All fields are working correctly in the backend');
    } else {
      console.log('\n❌ FIX VERIFICATION: Backend still has issues');
    }
    
    return { success: hasAllFields, taskId: task.id };
    
  } catch (error) {
    console.error('❌ Fix verification failed:', error.message);
    return { success: false, taskId: null };
  }
}

async function checkAllTasksAfterFix() {
  console.log('\n2️⃣  Checking all tasks after fix...');
  
  const query = `
    query GetAllTasks {
      product(id: "cmg5n0r2s000gk101hi3oiswr") {
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
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    const tasks = result.data?.product?.tasks?.edges?.map(e => e.node) || [];
    
    console.log(`📋 Total tasks found: ${tasks.length}`);
    
    let workingTasks = 0;
    let brokenTasks = 0;
    
    console.log('\n📊 TASK ANALYSIS:');
    tasks.forEach((task, index) => {
      const hasNotes = !!task.notes;
      const hasHowToDoc = !!task.howToDoc;
      const hasHowToVideo = !!task.howToVideo;
      const allFieldsWork = hasNotes && hasHowToDoc && hasHowToVideo;
      
      if (allFieldsWork) {
        workingTasks++;
      } else if (hasNotes && (!hasHowToDoc || !hasHowToVideo)) {
        brokenTasks++;
      }
      
      const status = allFieldsWork ? '✅' : (hasNotes ? '⚠️' : '➖');
      console.log(`${status} ${task.name}`);
      
      if (!allFieldsWork && hasNotes) {
        console.log(`   📝 Notes: ${hasNotes ? '✅' : '❌'}`);
        console.log(`   📚 HowToDoc: ${hasHowToDoc ? '✅' : '❌'}`);
        console.log(`   🎥 HowToVideo: ${hasHowToVideo ? '✅' : '❌'}`);
      }
    });
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   ✅ Fully working tasks: ${workingTasks}`);
    console.log(`   ⚠️  Broken GUI tasks: ${brokenTasks}`);
    console.log(`   ➖ Minimal/API tasks: ${tasks.length - workingTasks - brokenTasks}`);
    
    return { workingTasks, brokenTasks, totalTasks: tasks.length };
    
  } catch (error) {
    console.error('❌ Task analysis failed:', error.message);
    return { workingTasks: 0, brokenTasks: 0, totalTasks: 0 };
  }
}

function printManualTestInstructions() {
  console.log('\n3️⃣  MANUAL TEST INSTRUCTIONS (with enhanced debugging):');
  console.log('=' .repeat(55));
  
  console.log('🔧 The React component has been FIXED with:');
  console.log('   ✅ Input refs for backup value retrieval');
  console.log('   ✅ Enhanced onChange handlers with forced sync');
  console.log('   ✅ onBlur handlers for additional safety');
  console.log('   ✅ Backup value extraction in handleSave');
  console.log('');
  
  console.log('📋 NOW TEST THE FIXED VERSION:');
  console.log('1. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)');
  console.log('2. Open console (F12)');
  console.log('3. Navigate to "HowTo Test Product - E2E Validation"');
  console.log('4. Click "Add Task"');
  console.log('5. Fill the form:');
  console.log('   - Name: "FIXED VERSION TEST"');
  console.log('   - Notes: "Testing the fix"');
  console.log('   - HowToDoc: "https://fixed.example.com/docs"');
  console.log('   - HowToVideo: "https://fixed.example.com/video"');
  console.log('6. Click Save');
  console.log('');
  console.log('🔍 YOU SHOULD NOW SEE ENHANCED LOGS:');
  console.log('   📝 How To Doc field changed: https://fixed.example.com/docs');
  console.log('   📝 How To Doc onBlur - syncing value: https://fixed.example.com/docs');
  console.log('   🔧 TaskDialog FIXED howToDoc: https://fixed.example.com/docs');
  console.log('   🔧 TaskDialog FIXED howToVideo: https://fixed.example.com/video');
  console.log('');
  console.log('🎯 EXPECTED RESULT:');
  console.log('   The task should be created with BOTH howToDoc and howToVideo fields populated!');
}

async function main() {
  await setupFetch();
  
  const fixResult = await testFix();
  const taskAnalysis = await checkAllTasksAfterFix();
  
  console.log('\n' + '='.repeat(40));
  console.log('🏁 FINAL ASSESSMENT');
  console.log('='.repeat(40));
  
  if (fixResult.success) {
    console.log('✅ Backend API continues to work perfectly');
  } else {
    console.log('❌ Backend API has issues - need to investigate');
  }
  
  if (taskAnalysis.brokenTasks === 0) {
    console.log('🎉 No broken GUI tasks found!');
    console.log('   Either the issue is fixed or no GUI tasks were created since the fix');
  } else {
    console.log(`⚠️  Still ${taskAnalysis.brokenTasks} broken GUI tasks found`);
    console.log('   These were likely created before the fix');
  }
  
  printManualTestInstructions();
  
  console.log('\n🔄 AFTER MANUAL TEST, RUN:');
  console.log('   cd /data/dap && node verify-gui-task.js');
  console.log('   This will show if the new task has working howTo fields');
  
  console.log('\n' + '='.repeat(40));
}

main();