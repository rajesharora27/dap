/**
 * Comprehensive test to verify both Add and Edit task dialogs
 * This will show debug output from both dialogs to compare their release functionality
 */

async function comprehensiveTaskDialogTest() {
  console.clear();
  console.log('🔍 COMPREHENSIVE TASK DIALOG TEST');
  console.log('=================================\n');

  // Step 1: Check which products have releases
  console.log('📊 Step 1: Checking backend data...');
  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetProductsWithReleases {
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
    const productsWithReleases = products.filter(p => p.releases.length > 0);

    console.log(`✅ Found ${productsWithReleases.length} products with releases:`);
    productsWithReleases.forEach(product => {
      console.log(`  • ${product.name}: ${product.releases.length} releases`);
    });

    if (productsWithReleases.length === 0) {
      console.log('❌ No products with releases found. Please create some releases first.');
      return;
    }

  } catch (error) {
    console.error('❌ Error checking backend:', error);
    return;
  }

  console.log('\n📋 Step 2: Manual Test Instructions');
  console.log('===================================');
  console.log('Please follow these steps and observe the console output:');
  console.log('');
  console.log('1. Select a product with releases (e.g., "Sample Product" or "Test Product")');
  console.log('2. Click "Add Task" button');
  console.log('3. Look for debug output showing availableReleases');
  console.log('4. Cancel the dialog');
  console.log('5. Click edit on any existing task');
  console.log('6. Look for debug output showing availableReleases');
  console.log('7. Compare the debug output - both should show same releases');
  console.log('');
  console.log('🔍 What to look for in console:');
  console.log('  • "TaskDialog (Add New Task): availableReleases count = X"');
  console.log('  • "TaskDialog (Edit Task): availableReleases count = X"');
  console.log('  • Both should have the same count and release names');
  console.log('');
  console.log('📝 If releases are missing from edit dialog:');
  console.log('  • Check if availableReleases count is 0 for edit but > 0 for add');
  console.log('  • Verify the selected product has releases');
  console.log('  • Look for any error messages');

  console.log('\n⏳ Waiting for manual testing...');
  console.log('(This test will monitor console output)');
}

// Run the test
comprehensiveTaskDialogTest();