// Quick script to find a valid product with licenses
async function findValidProduct() {
  const query = `
    query GetProducts {
      products {
        edges {
          node {
            id
            name
            licenses {
              id
              level
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return;
    }

    const products = result.data.products.edges.map(edge => edge.node);
    console.log('📋 Available products with licenses:');
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. Product: ${product.name} (${product.id})`);
      if (product.licenses && product.licenses.length > 0) {
        product.licenses.forEach(license => {
          console.log(`   - Level ${license.level}: ${license.name}`);
        });
      } else {
        console.log('   - No licenses found');
      }
    });

    // Find first product with licenses
    const productWithLicenses = products.find(p => p.licenses && p.licenses.length > 0);
    if (productWithLicenses) {
      console.log(`\n✅ Recommend using:`);
      console.log(`   Product ID: ${productWithLicenses.id}`);
      console.log(`   License Level: ${productWithLicenses.licenses[0].level}`);
      return productWithLicenses;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findValidProduct();