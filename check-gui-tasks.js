// Script to check GUI-created tasks
async function checkGUICreatedTasks() {
  console.log('🔍 Checking recently created tasks for GUI testing...\n');

  const query = `
    query GetTasks($productId: ID!) {
      product(id: $productId) {
        id
        name
        tasks {
          edges {
            node {
              id
              name
              description
              weight
              estMinutes
              howToDoc
              howToVideo
              notes
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { productId: "cmg5pwqnk0012o401egadp2fz" } // New test product
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return;
    }

    const product = result.data.product;
    const tasks = product.tasks.edges.map(edge => edge.node);
    
    console.log(`📋 Tasks in product "${product.name}":`);
    console.log('=' * 60);

    tasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.name}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Description: ${task.description || 'None'}`);
      console.log(`   Weight: ${task.weight}%`);
      console.log(`   Est Minutes: ${task.estMinutes}`);
      console.log(`   📝 Notes: ${task.notes || 'NONE'}`);
      console.log(`   📚 How To Doc: ${task.howToDoc || 'NONE'}`);
      console.log(`   🎥 How To Video: ${task.howToVideo || 'NONE'}`);
    });

    // Find tasks that were likely created via GUI (no field values)
    const guiTasks = tasks.filter(task => 
      task.name.includes('GUI') || task.name.includes('Test') || task.name.includes('bbb') || task.name.includes('aaa') || task.name.includes('abc')
    );

    if (guiTasks.length > 0) {
      console.log(`\n🔍 Analysis of likely GUI-created tasks:`);
      guiTasks.forEach(task => {
        const hasNotes = task.notes && task.notes.length > 0;
        const hasHowToDoc = task.howToDoc && task.howToDoc.length > 0;
        const hasHowToVideo = task.howToVideo && task.howToVideo.length > 0;

        console.log(`\n📋 ${task.name}:`);
        console.log(`   Notes saved: ${hasNotes ? '✅' : '❌'} (${task.notes || 'empty'})`);
        console.log(`   HowToDoc saved: ${hasHowToDoc ? '✅' : '❌'} (${task.howToDoc || 'empty'})`);
        console.log(`   HowToVideo saved: ${hasHowToVideo ? '✅' : '❌'} (${task.howToVideo || 'empty'})`);
        
        if (hasNotes && hasHowToDoc && hasHowToVideo) {
          console.log(`   🎉 SUCCESS: All fields are working!`);
        } else {
          console.log(`   ⚠️  ISSUE: Some fields are missing`);
        }
      });
    }

    return tasks;

  } catch (error) {
    console.error('❌ Error checking tasks:', error.message);
  }
}

checkGUICreatedTasks();