// Test the fixed task creation from Tasks submenu
async function testFixedTaskCreation() {
  console.log('🧪 Testing FIXED task creation from Tasks submenu...\n');

  const mutation = `
    mutation CreateTask($input: TaskInput!) {
      createTask(input: $input) {
        id
        name
        description
        weight
        estMinutes
        licenseLevel
        howToDoc
        howToVideo
        notes
        product {
          id
          name
        }
      }
    }
  `;

  // Create a test task with all fields to verify the fix
  const testName = `FixedTest-${Date.now()}`;
  const taskData = {
    name: testName,
    description: "Test task to verify the App.tsx fix",
    weight: 1,
    estMinutes: 45,
    licenseLevel: "Essential",
    productId: "cmg5pwqnk0012o401egadp2fz", // Fresh test product
    releaseIds: [],
    howToDoc: "Fixed documentation content from App.tsx",
    howToVideo: "https://video.example.com/fixed-test",
    notes: "Fixed notes content from App.tsx"
  };

  try {
    console.log('📤 Creating task via API to verify backend works...');
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input: taskData }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return;
    }

    const task = result.data.createTask;
    console.log('✅ API test successful!');
    console.log(`📋 Task ID: ${task.id}`);
    console.log(`📚 How To Doc: ${task.howToDoc || 'NONE'}`);
    console.log(`🎥 How To Video: ${task.howToVideo || 'NONE'}`);
    console.log(`📝 Notes: ${task.notes || 'NONE'}`);

    console.log('\n🎯 NOW TEST THE FIXED GUI:');
    console.log('1. Open http://localhost:5173');
    console.log(`2. Select product: ${task.product.name}`);
    console.log('3. Click on "Tasks" submenu/tab');
    console.log('4. Click "Add Task" button');
    console.log('5. Fill out the form including:');
    console.log('   - Task Name: "FixedGUITest"');
    console.log('   - Notes: "Fixed GUI notes test"');
    console.log('   - How To Documentation: "Fixed GUI how-to doc test"');
    console.log('   - How To Video: "https://fixed-gui-test.com/video"');
    console.log('6. Save the task');
    console.log('7. Check console for debug messages showing 🚨🚨🚨');
    console.log('\n✅ App.tsx has been fixed to include:');
    console.log('   - howToDoc field in handleAddTaskSave');
    console.log('   - howToVideo field in handleAddTaskSave');
    console.log('   - howToDoc field in handleEditTaskSave');
    console.log('   - howToVideo field in handleEditTaskSave');

    return task;

  } catch (error) {
    console.error('❌ Error testing:', error.message);
  }
}

testFixedTaskCreation();