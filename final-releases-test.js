/**
 * FINAL TEST - This should definitively show if releases section is present
 */

console.log('🔥 FINAL RELEASES VERIFICATION TEST');
console.log('==================================');
console.log('');
console.log('This test uses an IMPOSSIBLE TO MISS visual design:');
console.log('• ORANGE BACKGROUND with thick orange border');
console.log('• Large heading showing release count and dialog title');
console.log('• Clear success/error messages');
console.log('');
console.log('📋 Test Steps:');
console.log('1. Open http://localhost:5173');
console.log('2. Select "Sample Product" (has 5 releases)');
console.log('3. Click "Add Task"');
console.log('4. Look for ORANGE BOX with "📋 RELEASES (5 available) - Add New Task"');
console.log('5. Cancel dialog');
console.log('6. Click edit on any existing task');
console.log('7. Look for ORANGE BOX with "📋 RELEASES (5 available) - Edit Task"');
console.log('');
console.log('✅ EXPECTED RESULT:');
console.log('Both dialogs should have IDENTICAL orange boxes with:');
console.log('- Same heading format');
console.log('- Same release count (5)');
console.log('- Same dropdown with 5 release options');
console.log('- Same success message');
console.log('');
console.log('❌ IF DIFFERENT:');
console.log('- Add has orange box, Edit doesn\'t → Configuration issue');
console.log('- Different release counts → Data passing issue');
console.log('- Different dropdown options → Available releases issue');
console.log('');
console.log('🚨 NOTE: This styling is TEMPORARY for testing only!');
console.log('Once confirmed working, the styling will be normalized.');

// Check backend
async function checkBackend() {
  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            products {
              edges {
                node {
                  name
                  releases { name level }
                }
              }
            }
          }
        `
      })
    });
    
    const result = await response.json();
    const products = result.data.products.edges.map(e => e.node);
    const sampleProduct = products.find(p => p.name === 'Sample Product');
    
    console.log(`\n📊 Backend Status: Sample Product has ${sampleProduct?.releases?.length || 0} releases`);
    if (sampleProduct?.releases) {
      sampleProduct.releases.forEach(r => console.log(`  - ${r.name} (v${r.level})`));
    }
  } catch (error) {
    console.log('\n❌ Backend check failed:', error.message);
  }
}

checkBackend();