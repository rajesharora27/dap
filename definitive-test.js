/**
 * Definitive test to check if both dialogs have releases
 */

async function definitiveReleasesTest() {
  console.clear();
  console.log('🎯 DEFINITIVE RELEASES TEST');
  console.log('===========================');
  
  // Test both dialog configurations  
  console.log('\n📊 Backend Check:');
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
                  releases { id name level }
                }
              }
            }
          }
        `
      })
    });
    
    const result = await response.json();
    const products = result.data.products.edges.map(e => e.node);
    const productsWithReleases = products.filter(p => p.releases.length > 0);
    
    console.log(`✅ Found ${productsWithReleases.length} products with releases:`);
    productsWithReleases.forEach(p => {
      console.log(`  - ${p.name}: ${p.releases.length} releases`);
    });
    
  } catch (error) {
    console.log('❌ Backend check failed:', error);
    return;
  }
  
  console.log('\n🔧 Manual Test Required:');
  console.log('1. Select "Sample Product" from dropdown');
  console.log('2. Open browser dev tools (F12) and go to Console tab');
  console.log('3. Click "Add Task" button');
  console.log('4. In the dialog, look for PINK BORDER around releases section');
  console.log('5. Check console for debug messages about availableReleases');
  console.log('6. Cancel dialog');
  console.log('7. Click Edit on any existing task');
  console.log('8. In the dialog, look for PINK BORDER around releases section');
  console.log('9. Check console for debug messages about availableReleases');
  
  console.log('\n✅ Success Indicators:');
  console.log('- Both dialogs show pink-bordered "🚀 RELEASES SECTION (5 available)"');
  console.log('- Both dialogs have "Releases" dropdown with 5 options');
  console.log('- Console shows same release count for both dialogs');
  
  console.log('\n❌ Failure Indicators:');
  console.log('- Add dialog has pink border, Edit dialog doesn\'t');
  console.log('- Add dialog shows "(5 available)", Edit shows "(0 available)"');
  console.log('- Console shows different data for the two dialogs');
  
  console.log('\n⚠️ If edit dialog is missing releases section:');
  console.log('- Take screenshot of both dialogs');
  console.log('- Copy console output for both dialogs');
  console.log('- This will help identify the exact issue');
}

definitiveReleasesTest();