// Create a minimal test product for testing
async function createTestProduct() {
  console.log('🧪 Creating minimal test product for ProductDetailPage testing...\n');

  const createProductMutation = `
    mutation CreateProduct($input: ProductInput!) {
      createProduct(input: $input) {
        id
        name
      }
    }
  `;

  const createLicenseMutation = `
    mutation CreateLicense($input: LicenseInput!) {
      createLicense(input: $input) {
        id
        name
        level
      }
    }
  `;

  const productName = `TestProduct-${Date.now()}`;
  
  try {
    // Create product
    console.log('📦 Creating test product...');
    const productResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createProductMutation,
        variables: { 
          input: {
            name: productName,
            description: "Minimal test product for ProductDetailPage testing"
          }
        }
      })
    });

    const productResult = await productResponse.json();
    
    if (productResult.errors) {
      console.error('❌ Product creation errors:', productResult.errors);
      return;
    }

    const product = productResult.data.createProduct;
    console.log(`✅ Product created: ${product.name} (${product.id})`);

    // Create license
    console.log('🔑 Creating test license...');
    const licenseResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createLicenseMutation,
        variables: { 
          input: {
            name: "Test Essential License",
            description: "Essential license for testing",
            level: 1,
            productId: product.id
          }
        }
      })
    });

    const licenseResult = await licenseResponse.json();
    
    if (licenseResult.errors) {
      console.error('❌ License creation errors:', licenseResult.errors);
      return;
    }

    const license = licenseResult.data.createLicense;
    console.log(`✅ License created: ${license.name} (Level ${license.level})`);

    console.log(`\n🎯 Use this for testing:`);
    console.log(`   Product ID: ${product.id}`);
    console.log(`   License Level: Essential`);

    return product;

  } catch (error) {
    console.error('❌ Error creating test product:', error.message);
  }
}

createTestProduct();