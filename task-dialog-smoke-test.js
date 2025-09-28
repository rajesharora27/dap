/**
 * Quick Task Dialog Smoke Test
 * Tests both Add Task and Edit Task dialogs for release functionality
 */

const GraphQLQuery = `
  query GetProductsWithTasksAndReleases {
    products {
      id
      name
      releases {
        id
        name
        level
      }
      tasks {
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
`;

console.log('=== TASK DIALOG SMOKE TEST ===');
console.log('Testing at: http://localhost:5173');
console.log('Backend at: http://localhost:4000');

console.log('\n=== TESTING PROCEDURE ===');
console.log('1. Open application');
console.log('2. Select "Sample Product"');
console.log('3. Click "Add Task" button');
console.log('4. Check if releases section appears');
console.log('5. Check if releases dropdown has options');
console.log('6. Cancel and edit existing task');
console.log('7. Check if Edit Task has same releases section');
console.log('8. Verify both dialogs look identical');

console.log('\n=== EXPECTED RESULTS ===');
console.log('✓ Add Task dialog has clean releases section (no orange styling)');
console.log('✓ Edit Task dialog has identical releases section');
console.log('✓ Both dropdowns show same release options');
console.log('✓ Both can select multiple releases');
console.log('✓ Both show selected releases as chips');
console.log('✓ No console errors');

console.log('\n=== BACKEND DATA VERIFICATION ===');
console.log('Query to test data:', GraphQLQuery);

async function testBackend() {
  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GraphQLQuery
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      return;
    }

    const products = result.data.products;
    console.log('\n=== BACKEND DATA STATUS ===');
    console.log(`Found ${products.length} products`);
    
    products.forEach(product => {
      console.log(`\nProduct: ${product.name}`);
      console.log(`  Releases: ${product.releases.length}`);
      product.releases.forEach(release => {
        console.log(`    - ${release.name} (v${release.level})`);
      });
      console.log(`  Tasks: ${product.tasks.length}`);
      product.tasks.forEach(task => {
        console.log(`    - ${task.name} (${task.releases.length} releases)`);
      });
    });

  } catch (error) {
    console.error('Backend test failed:', error.message);
  }
}

// Run backend test if in Node environment
if (typeof fetch !== 'undefined' || typeof require !== 'undefined') {
  // Only run if we can import fetch
  try {
    require('node-fetch');
    // testBackend();
  } catch (e) {
    console.log('\n(Backend test skipped - node-fetch not available)');
  }
}