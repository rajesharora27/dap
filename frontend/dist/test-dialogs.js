/**
 * Simple test to check task dialog functionality
 * This will help us verify if releases are working in both add and edit modes
 */
console.log('🚀 DAP Application Ready for Testing');
console.log('📋 Test Instructions:');
console.log('1. Select a product that has releases (e.g., "FinTech Banking Suite", "Test Product", or "Sample Product")');
console.log('2. Open the "Add Task" dialog and check console for debug messages');
console.log('3. Open the "Edit Task" dialog for any existing task and check console for debug messages');
console.log('4. Compare the availableReleases count and data between both dialogs');
console.log('5. Verify that the Releases dropdown is visible in both dialogs');

// Function to wait and then test if we can access the UI
function waitForUI() {
  setTimeout(() => {
    const addTaskButton = document.querySelector('button[aria-label*="Add"]') || 
                          document.querySelector('button:contains("Add Task")') ||
                          document.querySelector('[data-testid="add-task"]');
    
    if (addTaskButton) {
      console.log('✅ Add Task button found in UI');
    } else {
      console.log('❌ Add Task button not found - may need to select a product first');
    }
    
    const editButtons = document.querySelectorAll('button[aria-label*="Edit"], button:contains("Edit")');
    console.log(`📝 Found ${editButtons.length} edit buttons in the UI`);
    
  }, 2000);
}

// Wait for the page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForUI);
} else {
  waitForUI();
}