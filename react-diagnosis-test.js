#!/usr/bin/env node
/**
 * React Component Diagnosis Test
 * 
 * This test focuses on diagnosing the React component behavior
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

async function testBackendDirectly() {
  console.log('🔬 REACT COMPONENT DIAGNOSIS TEST');
  console.log('='.repeat(40));
  
  console.log('\n1️⃣  Testing backend API directly...');
  
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

  const testData = {
    name: 'Component Diagnosis Test',
    description: 'Testing component behavior',
    estMinutes: 60,
    weight: 3,
    notes: 'Component test notes',
    howToDoc: 'https://component-test.example.com/docs',
    howToVideo: 'https://component-test.example.com/video',
    productId: 'cmg5n0r2s000gk101hi3oiswr'
  };

  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation, variables: { input: testData } })
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    const task = result.data.createTask;
    console.log('✅ Backend API works perfectly:');
    console.log(`   📝 Notes: "${task.notes}"`);
    console.log(`   📚 HowToDoc: "${task.howToDoc}"`);
    console.log(`   🎥 HowToVideo: "${task.howToVideo}"`);
    
    return true;
  } catch (error) {
    console.error('❌ Backend API failed:', error.message);
    return false;
  }
}

async function checkCurrentTasks() {
  console.log('\n2️⃣  Checking current tasks in test product...');
  
  const query = `
    query GetTestProduct {
      product(id: "cmg5n0r2s000gk101hi3oiswr") {
        id
        name
        tasks(first: 10) {
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
    
    console.log(`📋 Found ${tasks.length} tasks:`);
    
    let guiTasksWithoutHowTo = [];
    
    tasks.forEach((task, index) => {
      const hasNotes = !!task.notes;
      const hasHowToDoc = !!task.howToDoc;
      const hasHowToVideo = !!task.howToVideo;
      
      console.log(`\n${index + 1}. ${task.name}`);
      console.log(`   📝 Notes: ${hasNotes ? '✅' : '❌'} "${task.notes || 'NONE'}"`);
      console.log(`   📚 HowToDoc: ${hasHowToDoc ? '✅' : '❌'} "${task.howToDoc || 'NONE'}"`);
      console.log(`   🎥 HowToVideo: ${hasHowToVideo ? '✅' : '❌'} "${task.howToVideo || 'NONE'}"`);
      
      // Check if this looks like a GUI-created task with missing howTo fields
      if (hasNotes && (!hasHowToDoc || !hasHowToVideo)) {
        guiTasksWithoutHowTo.push({
          name: task.name,
          hasNotes: hasNotes,
          hasHowToDoc: hasHowToDoc,
          hasHowToVideo: hasHowToVideo
        });
      }
    });
    
    return { tasks, guiTasksWithoutHowTo };
    
  } catch (error) {
    console.error('❌ Task check failed:', error.message);
    return { tasks: [], guiTasksWithoutHowTo: [] };
  }
}

function analyzeProblem(taskData) {
  console.log('\n3️⃣  PROBLEM ANALYSIS:');
  console.log('='.repeat(25));
  
  const { guiTasksWithoutHowTo } = taskData;
  
  if (guiTasksWithoutHowTo.length === 0) {
    console.log('🎉 No problematic GUI tasks found!');
    console.log('   Either the issue is resolved or no GUI tasks were created yet.');
    return;
  }
  
  console.log(`❌ Found ${guiTasksWithoutHowTo.length} GUI tasks with missing howTo fields:`);
  
  guiTasksWithoutHowTo.forEach(task => {
    console.log(`\n📋 ${task.name}:`);
    console.log(`   📝 Notes work: ${task.hasNotes ? '✅' : '❌'}`);
    console.log(`   📚 HowToDoc: ${task.hasHowToDoc ? '✅' : '❌'}`);
    console.log(`   🎥 HowToVideo: ${task.hasHowToVideo ? '✅' : '❌'}`);
  });
  
  console.log('\n🔍 PATTERN ANALYSIS:');
  
  const allHaveNotes = guiTasksWithoutHowTo.every(t => t.hasNotes);
  const noneHaveHowToDoc = guiTasksWithoutHowTo.every(t => !t.hasHowToDoc);
  const noneHaveHowToVideo = guiTasksWithoutHowTo.every(t => !t.hasHowToVideo);
  
  if (allHaveNotes && noneHaveHowToDoc && noneHaveHowToVideo) {
    console.log('🎯 CLEAR PATTERN IDENTIFIED:');
    console.log('   ✅ Notes field always works');
    console.log('   ❌ HowToDoc field never works');
    console.log('   ❌ HowToVideo field never works');
    console.log('');
    console.log('📊 DIAGNOSIS:');
    console.log('   The issue is SPECIFIC to the howToDoc/howToVideo form fields');
    console.log('   This suggests:');
    console.log('   1. Form fields might not be triggering onChange events');
    console.log('   2. React state updates might be failing for these specific fields');
    console.log('   3. Form field values might not be included in form submission');
    console.log('   4. Component re-rendering might be preventing state updates');
  } else {
    console.log('🤔 MIXED PATTERN - needs further investigation');
  }
}

function generateNextSteps() {
  console.log('\n4️⃣  IMMEDIATE ACTIONS TO TAKE:');
  console.log('='.repeat(30));
  
  console.log('📋 MANUAL TEST INSTRUCTIONS:');
  console.log('1. Open http://localhost:5173 in browser');
  console.log('2. Open browser console (F12) BEFORE doing anything');
  console.log('3. Navigate to "HowTo Test Product - E2E Validation"');
  console.log('4. Click "Add Task"');
  console.log('5. Check console for:');
  console.log('   🎨 TaskDialog render - open: true task: NEW');
  console.log('   🎨 TaskDialog current state: { howToDoc: "", howToVideo: "", notes: "" }');
  console.log('');
  console.log('6. Fill ONLY the Name field: "Console Debug Test"');
  console.log('7. Fill Notes field: "Debug notes work"');
  console.log('8. Fill HowToDoc field: "https://debug.com/doc" - CHECK CONSOLE!');
  console.log('9. Fill HowToVideo field: "https://debug.com/video" - CHECK CONSOLE!');
  console.log('');
  console.log('🔍 WHAT TO LOOK FOR:');
  console.log('   When typing in HowToDoc, you should see:');
  console.log('   📝 How To Doc field changed: https://debug.com/doc');
  console.log('   📝 Previous howToDoc state: ');
  console.log('   📝 After setHowToDoc called with: https://debug.com/doc');
  console.log('');
  console.log('   When clicking Save, you should see:');
  console.log('   🖱️ Save button clicked!');
  console.log('   🔍 Current state before handleSave:');
  console.log('     howToDoc state: https://debug.com/doc');
  console.log('     howToVideo state: https://debug.com/video');
  console.log('');
  console.log('❗ IF YOU DON\'T SEE THESE LOGS:');
  console.log('   - The React component is not loading the debug version');
  console.log('   - The form fields are not triggering onChange events');
  console.log('   - There\'s a fundamental React rendering issue');
}

async function main() {
  await setupFetch();
  
  const backendWorks = await testBackendDirectly();
  
  if (!backendWorks) {
    console.log('❌ Backend not working - fix backend first');
    return;
  }
  
  const taskData = await checkCurrentTasks();
  analyzeProblem(taskData);
  generateNextSteps();
  
  console.log('\n' + '='.repeat(40));
  console.log('🎯 NEXT: Perform the manual test above');
  console.log('📤 Report exactly what console output you see');
  console.log('='.repeat(40));
}

main();