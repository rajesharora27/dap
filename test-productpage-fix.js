// Test script to verify the ProductDetailPage task creation fix

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProductDetailPageTaskCreation() {
  console.log('🧪 Testing ProductDetailPage task creation with howToDoc/howToVideo fields...\n');

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

  // Create a test task with all fields
  const testName = `ProductPageTest-${Date.now()}`;
  const taskData = {
    name: testName,
    description: "Test task created from ProductDetailPage",
    weight: 25,
    estMinutes: 60,
    licenseLevel: "Essential",
    productId: "cmg5palxt000eo401u89br98z", // Fresh test product
    releaseIds: [],
    howToDoc: "Documentation for ProductDetailPage test task",
    howToVideo: "https://video.example.com/productpage-test",
    notes: "Test notes from ProductDetailPage"
  };

  try {
    console.log('📤 Creating task via API...');
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
    console.log('✅ Task created successfully!');
    console.log(`📋 Task ID: ${task.id}`);
    console.log(`📝 Name: ${task.name}`);
    console.log(`🏗️  Product: ${task.product.name}`);
    console.log(`📚 How To Doc: ${task.howToDoc || 'NONE'}`);
    console.log(`🎥 How To Video: ${task.howToVideo || 'NONE'}`);
    console.log(`📝 Notes: ${task.notes || 'NONE'}`);

    // Verify fields were saved correctly
    const hasHowToDoc = task.howToDoc && task.howToDoc.length > 0;
    const hasHowToVideo = task.howToVideo && task.howToVideo.length > 0;
    const hasNotes = task.notes && task.notes.length > 0;

    console.log('\n🔍 Verification:');
    console.log(`   howToDoc saved: ${hasHowToDoc ? '✅' : '❌'}`);
    console.log(`   howToVideo saved: ${hasHowToVideo ? '✅' : '❌'}`);
    console.log(`   notes saved: ${hasNotes ? '✅' : '❌'}`);

    if (hasHowToDoc && hasHowToVideo && hasNotes) {
      console.log('\n🎉 SUCCESS: All fields are now being saved correctly!');
      console.log('   The ProductDetailPage task creation fix is working.');
    } else {
      console.log('\n⚠️  ISSUE: Some fields are still not being saved.');
    }

    return task;

  } catch (error) {
    console.error('❌ Error testing task creation:', error.message);
  }
}

// Main execution
testProductDetailPageTaskCreation()
  .then(task => {
    if (task) {
      console.log('\n✅ Test completed successfully');
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });