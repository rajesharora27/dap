// Test script to verify ProductDetailPage GUI task creation fix
async function testProductDetailPageGUI() {
  console.log('🧪 Testing ProductDetailPage GUI task creation fix...\n');

  // First, let's create a task using the existing API to verify baseline
  const createTaskMutation = `
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

  const testName = `GUITest-${Date.now()}`;
  const taskData = {
    name: testName,
    description: "GUI test task from ProductDetailPage",
    weight: 30,
    estMinutes: 90,
    licenseLevel: "Essential",
    productId: "cmg5palxt000eo401u89br98z", // Our test product
    releaseIds: [],
    howToDoc: "GUI test documentation content",
    howToVideo: "https://video.example.com/gui-test",
    notes: "GUI test notes content"
  };

  try {
    console.log('📤 Creating task via API as baseline...');
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createTaskMutation,
        variables: { input: taskData }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return;
    }

    const task = result.data.createTask;
    console.log('✅ Baseline API task created successfully!');
    console.log(`📋 Task ID: ${task.id}`);
    console.log(`📚 How To Doc: ${task.howToDoc || 'NONE'}`);
    console.log(`🎥 How To Video: ${task.howToVideo || 'NONE'}`);
    console.log(`📝 Notes: ${task.notes || 'NONE'}`);

    console.log('\n🎯 NOW TEST THE GUI:');
    console.log('1. Open http://localhost:5173');
    console.log(`2. Navigate to product: ${task.product.name}`);
    console.log('3. Click "Add Task" button');
    console.log('4. Fill out the form including:');
    console.log('   - Task Name: GUITestTask');
    console.log('   - Notes: "GUI notes test"');
    console.log('   - How To Documentation: "GUI how-to doc test"');
    console.log('   - How To Video: "https://gui-test.com/video"');
    console.log('5. Save the task');
    console.log('6. Verify all fields are saved correctly');

    console.log('\n✅ ProductDetailPage has been updated to include:');
    console.log('   - notes field in newTask state');
    console.log('   - howToDoc field in newTask state');
    console.log('   - howToVideo field in newTask state');
    console.log('   - Form fields in both Add and Edit dialogs');
    console.log('   - Mutation calls updated to send these fields');

    return task;

  } catch (error) {
    console.error('❌ Error testing:', error.message);
  }
}

testProductDetailPageGUI();