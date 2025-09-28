/**
 * Debug script to verify task dialog releases functionality
 * This will check what data is being passed to the TaskDialog components
 */

// Function to test the GraphQL query and check what data we have
async function checkBackendData() {
  console.log('🔍 Checking backend data for releases...');
  
  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetProductsAndTasks {
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
            tasks {
              edges {
                node {
                  id
                  name
                  product {
                    id
                    name
                  }
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
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return;
    }
    
    const products = result.data.products.edges.map(e => e.node);
    const tasks = result.data.tasks.edges.map(e => e.node);
    
    console.log('📊 Products with releases:');
    products.forEach(product => {
      if (product.releases.length > 0) {
        console.log(`  • ${product.name}: ${product.releases.length} releases`);
        product.releases.forEach(r => console.log(`    - ${r.name} (v${r.level})`));
      }
    });
    
    console.log('\n📊 Tasks with releases:');
    tasks.forEach(task => {
      if (task.releases.length > 0) {
        console.log(`  • ${task.name} (${task.product.name}): ${task.releases.length} releases`);
        task.releases.forEach(r => console.log(`    - ${r.name} (v${r.level})`));
      }
    });
    
    const productsWithReleases = products.filter(p => p.releases.length > 0);
    const tasksForTesting = tasks.filter(t => productsWithReleases.some(p => p.id === t.product.id));
    
    console.log(`\n✅ Found ${productsWithReleases.length} products with releases`);
    console.log(`✅ Found ${tasksForTesting.length} tasks in products that have releases`);
    
    return { productsWithReleases, tasksForTesting };
    
  } catch (error) {
    console.error('❌ Error checking backend data:', error);
  }
}

// Run the check when the page loads
checkBackendData();