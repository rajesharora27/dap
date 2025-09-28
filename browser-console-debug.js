/**
 * Browser Console Test for Task Dialog Releases
 * Run this in browser console to debug the issue
 */

console.log(`
=== TASK DIALOG RELEASES TEST ===

1. BROWSER CONSOLE TESTS:
   
   // Test 1: Check if releases data is available
   console.log("Products data:", window.products || "Not available");
   
   // Test 2: When Add Task dialog opens, inspect props
   console.log("Looking for TaskDialog component logs...");
   
   // Test 3: When Edit Task dialog opens, compare props
   console.log("Compare Add vs Edit dialog props");

2. MANUAL INSPECTION:
   - Right-click on releases section in Add Task dialog → Inspect Element
   - Note the HTML structure and styling
   - Open Edit Task dialog and look for same section
   - Check if section exists but is hidden (display:none, visibility:hidden)
   
3. ELEMENT INSPECTION:
   - Look for: <div><FormControl><InputLabel>Releases</InputLabel>
   - Check if this element exists in Edit Task dialog
   - Check if it has different styling or visibility

4. NETWORK INSPECTION:
   - Open Network tab
   - Check GraphQL queries when opening Edit Task
   - Verify task data includes releases array
   
5. COMPONENT STATE INSPECTION:
   - Check React DevTools if available
   - Look for TaskDialog component props
   - Compare availableReleases prop between Add and Edit modes

=== DEBUGGING STEPS ===

Step 1: Open Add Task dialog
- Check console for "TaskDialog Debug" logs
- Note availableReleasesCount value
- Verify releases section appears

Step 2: Close Add Task, open Edit Task dialog  
- Check console for "TaskDialog Debug" logs
- Compare availableReleasesCount with Step 1
- Check if releases section appears

Step 3: Visual comparison
- Screenshot both dialogs
- Compare UI elements side by side
- Look for missing or hidden elements

=== COPY/PASTE BROWSER CONSOLE COMMANDS ===

// Check for TaskDialog debug logs in console
console.log("Checking for TaskDialog debug logs...");

// Inspect releases sections (run when dialogs are open)
document.querySelectorAll('[aria-label*="Releases"], [for*="releases"], input[id*="releases"]').forEach(el => console.log("Releases element:", el));

// Check for FormControl with Releases label
document.querySelectorAll('label').forEach(el => {
  if(el.textContent.includes('Releases')) console.log("Found Releases label:", el);
});
`);

console.log('Browser console test script ready.');
console.log('Open http://localhost:5173 and run the manual tests above.');

module.exports = {
  testType: 'browser-console-debug',
  targetUrl: 'http://localhost:5173',
  focus: 'Compare Add Task vs Edit Task dialog releases sections'
};