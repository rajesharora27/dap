/**
 * Debug test to verify edit task dialog releases
 * This will provide step-by-step instructions and what to look for
 */

console.log('🔍 DEBUG TEST: Edit Task Dialog Releases');
console.log('========================================\n');

console.log('📋 Test Steps:');
console.log('1. Open http://localhost:5173');
console.log('2. Select "Sample Product" (it has 5 releases)');
console.log('3. Click "Add Task" and look in console for:');
console.log('   - "Add TaskDialog - availableReleases being passed"');
console.log('   - "TaskDialog useEffect - Debug Info" with title "Add New Task"');
console.log('4. Cancel the dialog');
console.log('5. Click edit on any existing task and look for:');
console.log('   - "Edit TaskDialog - availableReleases being passed"');
console.log('   - "TaskDialog useEffect - Debug Info" with title "Edit Task"');
console.log('6. Look for the pink-bordered "🚀 RELEASES SECTION" in both dialogs');

console.log('\n🔍 What to Compare:');
console.log('- Both should show same releasesCount (should be 5 for Sample Product)');
console.log('- Both should show same release names/levels');
console.log('- Both should have the pink-bordered releases section visible');

console.log('\n❌ If Different:');
console.log('- Add dialog shows 5 releases but Edit shows 0 → data passing issue');
console.log('- Add dialog has pink border but Edit doesn\'t → rendering issue');
console.log('- Console shows different debug data → configuration problem');

console.log('\n⚠️ Note: The pink border and debug logs are temporary for testing');

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
                  id
                  name
                  releases {
                    id
                    name
                    level
                  }
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
    
    if (sampleProduct) {
      console.log(`\n✓ Sample Product found with ${sampleProduct.releases.length} releases:`);
      sampleProduct.releases.forEach(r => console.log(`  - ${r.name} (v${r.level})`));
    } else {
      console.log('\n❌ Sample Product not found - please select a different product');
    }
  } catch (error) {
    console.log('\n❌ Could not check backend data:', error.message);
  }
}

checkBackend();