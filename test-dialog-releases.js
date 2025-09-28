/**
 * Test both Add Task and Edit Task dialogs for releases functionality
 * Run this in the browser console after selecting a product with releases
 */

function testTaskDialogs() {
  console.log('🔍 Testing Task Dialog Releases Functionality');
  console.log('\n📋 Instructions:');
  console.log('1. Select a product that has releases (FinTech Banking Suite, Test Product, or Sample Product)');
  console.log('2. This script will test both Add and Edit dialogs');
  console.log('3. Watch the console for debug messages from both dialogs\n');

  // Test Add Task Dialog
  console.log('🆕 Testing Add Task Dialog...');
  
  // Look for add task button
  const addTaskButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Add Task') || 
    btn.getAttribute('aria-label')?.includes('Add') ||
    btn.textContent?.includes('Add')
  );
  
  if (addTaskButton) {
    console.log('✅ Found Add Task button');
    
    // Click to open dialog
    setTimeout(() => {
      addTaskButton.click();
      console.log('🔄 Clicked Add Task button - check for debug messages above');
      
      // After 2 seconds, close the dialog and test edit
      setTimeout(() => {
        // Look for close button or backdrop
        const closeButton = document.querySelector('[aria-label="close"]') ||
                           document.querySelector('button[aria-label*="close"]') ||
                           Array.from(document.querySelectorAll('button')).find(btn => 
                             btn.textContent?.includes('Cancel')
                           );
        
        if (closeButton) {
          closeButton.click();
          console.log('🔄 Closed Add Task dialog');
          
          // Now test Edit Task Dialog
          setTimeout(() => {
            testEditTaskDialog();
          }, 500);
        }
      }, 2000);
    }, 500);
    
  } else {
    console.log('❌ Add Task button not found');
    console.log('🔍 Available buttons:', Array.from(document.querySelectorAll('button')).map(btn => btn.textContent));
  }
}

function testEditTaskDialog() {
  console.log('\n✏️ Testing Edit Task Dialog...');
  
  // Look for edit buttons (usually pencil icons or "Edit" text)
  const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.getAttribute('aria-label')?.includes('Edit') ||
    btn.querySelector('svg[data-testid="EditIcon"]') ||
    btn.textContent?.includes('Edit')
  );
  
  console.log(`🔍 Found ${editButtons.length} potential edit buttons`);
  
  if (editButtons.length > 0) {
    const editButton = editButtons[0];
    console.log('✅ Found Edit Task button');
    
    setTimeout(() => {
      editButton.click();
      console.log('🔄 Clicked Edit Task button - check for debug messages above');
      
      // After 2 seconds, close the dialog
      setTimeout(() => {
        const closeButton = document.querySelector('[aria-label="close"]') ||
                           Array.from(document.querySelectorAll('button')).find(btn => 
                             btn.textContent?.includes('Cancel')
                           );
        
        if (closeButton) {
          closeButton.click();
          console.log('🔄 Closed Edit Task dialog');
        }
        
        console.log('\n📊 Test completed! Check the debug messages above to compare:');
        console.log('• Add Task Dialog: availableReleasesCount');
        console.log('• Edit Task Dialog: availableReleasesCount');
        console.log('• Both should show the same number of releases for the selected product');
        
      }, 3000);
    }, 500);
    
  } else {
    console.log('❌ Edit Task button not found');
    console.log('💡 Make sure you have selected a product with tasks first!');
  }
}

// Start the test
testTaskDialogs();