/**
 * Simple visual test to verify releases section visibility
 * This will create a step-by-step test to compare Add vs Edit dialogs
 */

console.log('🔍 VISUAL RELEASES TEST');
console.log('=====================');
console.log('');
console.log('📋 STEP-BY-STEP TEST INSTRUCTIONS:');
console.log('1. Open http://localhost:5173 in your browser');
console.log('2. Select "Sample Product" from the dropdown (it has 5 releases)');
console.log('3. Click "Add Task" button');  
console.log('4. Look for a RED BOX with "RELEASES SECTION" - should show "5 releases available"');
console.log('5. Cancel the dialog');
console.log('6. Click edit on any existing task');
console.log('7. Look for a RED BOX with "RELEASES SECTION" - should show "5 releases available"');
console.log('');
console.log('🔍 WHAT TO LOOK FOR:');
console.log('✅ Both dialogs should have identical red boxes');
console.log('✅ Both should show the same number of available releases');
console.log('✅ The releases dropdown should be populated in both');
console.log('');
console.log('❌ If you see differences:');
console.log('  • Add dialog has red box but Edit dialog doesn\'t');
console.log('  • Add dialog shows "5 releases" but Edit shows "0 releases"');
console.log('  • One dialog has dropdown options, the other doesn\'t');
console.log('');
console.log('🚨 The red box and debug text are temporary - just for testing');
console.log('Once we verify both dialogs work the same way, I\'ll remove the red styling');
console.log('');
console.log('Please test now and let me know what you see!');