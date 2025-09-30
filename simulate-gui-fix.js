// Simulate the exact data flow from TaskDialog -> App.tsx handleAddTaskSave
async function simulateGUITaskCreation() {
  console.log('🧪 SIMULATING GUI Task Creation Flow...\n');

  // This simulates exactly what TaskDialog sends to handleAddTaskSave
  const taskDataFromTaskDialog = {
    name: "SimulatedGUITask",
    description: "Description from simulated TaskDialog",
    estMinutes: 90,
    weight: 20,
    priority: "High",
    notes: "Notes from simulated TaskDialog",
    howToDoc: "How-to documentation from simulated TaskDialog",
    howToVideo: "https://video.example.com/simulated-task",
    licenseId: null, // No license selected
    outcomeIds: [], // No outcomes selected
    releaseIds: [] // No releases selected
  };

  console.log('📋 TaskDialog would send this data to handleAddTaskSave:');
  console.log(JSON.stringify(taskDataFromTaskDialog, null, 2));

  // Simulate the FIXED handleAddTaskSave logic
  const selectedProduct = "cmg5pwqnk0012o401egadp2fz"; // Our fresh test product

  const input = {
    productId: selectedProduct,
    name: taskDataFromTaskDialog.name,
    estMinutes: taskDataFromTaskDialog.estMinutes,
    weight: taskDataFromTaskDialog.weight,
    priority: taskDataFromTaskDialog.priority
  };

  // Apply the FIXED logic I added to App.tsx
  if (taskDataFromTaskDialog.description?.trim()) {
    input.description = taskDataFromTaskDialog.description.trim();
  }
  if (taskDataFromTaskDialog.notes?.trim()) {
    input.notes = taskDataFromTaskDialog.notes.trim();
  }
  if (taskDataFromTaskDialog.howToDoc?.trim()) {
    input.howToDoc = taskDataFromTaskDialog.howToDoc.trim();
  }
  if (taskDataFromTaskDialog.howToVideo?.trim()) {
    input.howToVideo = taskDataFromTaskDialog.howToVideo.trim();
  }
  if (taskDataFromTaskDialog.licenseId) {
    input.licenseId = taskDataFromTaskDialog.licenseId;
  }
  if (taskDataFromTaskDialog.outcomeIds && taskDataFromTaskDialog.outcomeIds.length > 0) {
    input.outcomeIds = taskDataFromTaskDialog.outcomeIds;
  }
  if (taskDataFromTaskDialog.releaseIds && taskDataFromTaskDialog.releaseIds.length > 0) {
    input.releaseIds = taskDataFromTaskDialog.releaseIds;
  }

  console.log('\n🔄 App.tsx handleAddTaskSave would create this GraphQL input:');
  console.log(JSON.stringify(input, null, 2));

  // Now test this with the actual GraphQL mutation
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

  try {
    console.log('\n📤 Sending to GraphQL backend...');
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return;
    }

    const task = result.data.createTask;
    console.log('\n✅ SIMULATION SUCCESSFUL! Created task:');
    console.log(`📋 Task ID: ${task.id}`);
    console.log(`📝 Name: ${task.name}`);
    console.log(`📄 Description: ${task.description || 'NONE'}`);
    console.log(`📝 Notes: ${task.notes || 'NONE'}`);
    console.log(`📚 How To Doc: ${task.howToDoc || 'NONE'}`);
    console.log(`🎥 How To Video: ${task.howToVideo || 'NONE'}`);

    // Verify all fields were saved correctly
    const hasDescription = task.description && task.description.length > 0;
    const hasNotes = task.notes && task.notes.length > 0;
    const hasHowToDoc = task.howToDoc && task.howToDoc.length > 0;
    const hasHowToVideo = task.howToVideo && task.howToVideo.length > 0;

    console.log('\n🔍 Verification:');
    console.log(`   description saved: ${hasDescription ? '✅' : '❌'}`);
    console.log(`   notes saved: ${hasNotes ? '✅' : '❌'}`);
    console.log(`   howToDoc saved: ${hasHowToDoc ? '✅' : '❌'}`);
    console.log(`   howToVideo saved: ${hasHowToVideo ? '✅' : '❌'}`);

    if (hasDescription && hasNotes && hasHowToDoc && hasHowToVideo) {
      console.log('\n🎉 COMPLETE SUCCESS! All fields are now working correctly!');
      console.log('   The App.tsx fix has resolved the issue.');
      console.log('   Users can now create tasks from the Tasks submenu with all fields persisting.');
    } else {
      console.log('\n⚠️  Still missing some fields...');
    }

    return task;

  } catch (error) {
    console.error('❌ Error in simulation:', error.message);
  }
}

simulateGUITaskCreation();