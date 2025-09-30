// Create comprehensive test product with all attributes
async function createComprehensiveTestProduct() {
  console.log('🏭 CREATING COMPREHENSIVE TEST PRODUCT');
  console.log('='.repeat(60));
  
  const timestamp = Date.now();
  const productName = `TestProduct-Full-${timestamp}`;
  
  console.log(`📦 Creating product: ${productName}`);
  console.log('   Will include: licenses, releases, outcomes, and custom attributes\n');

  // Step 1: Create the base product
  const createProductMutation = `
    mutation CreateProduct($input: ProductInput!) {
      createProduct(input: $input) {
        id
        name
        description
        customAttrs
      }
    }
  `;

  const productInput = {
    name: productName,
    description: "Comprehensive test product with all features for testing task creation",
    customAttrs: {
      version: "1.0.0",
      testEnvironment: "development", 
      targetAudience: "developers",
      complexity: "medium",
      category: "testing"
    }
  };

  let productId;
  try {
    console.log('📦 Creating base product...');
    const productResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: createProductMutation,
        variables: { input: productInput }
      })
    });

    const productResult = await productResponse.json();
    if (productResult.errors) {
      console.error('❌ Product creation failed:', productResult.errors);
      return;
    }

    productId = productResult.data.createProduct.id;
    console.log(`   ✅ Product created: ${productId}`);
    console.log(`   📄 Description: ${productResult.data.createProduct.description}`);
    console.log(`   ⚙️ Custom Attributes: ${JSON.stringify(productResult.data.createProduct.customAttrs, null, 2)}`);

  } catch (error) {
    console.error('❌ Error creating product:', error.message);
    return;
  }

  // Step 2: Create licenses
  const createLicenseMutation = `
    mutation CreateLicense($input: LicenseInput!) {
      createLicense(input: $input) {
        id
        name
        level
        isActive
      }
    }
  `;

  const licenses = [
    { name: "Basic License", level: 1.0, productId },
    { name: "Professional License", level: 2.0, productId },
    { name: "Enterprise License", level: 3.0, productId }
  ];

  console.log('\n🔑 Creating licenses...');
  for (const license of licenses) {
    try {
      const licenseResponse = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: createLicenseMutation,
          variables: { input: license }
        })
      });

      const licenseResult = await licenseResponse.json();
      if (licenseResult.errors) {
        console.error(`❌ License creation failed for ${license.name}:`, licenseResult.errors);
      } else {
        console.log(`   ✅ License: ${licenseResult.data.createLicense.name} (Level ${licenseResult.data.createLicense.level})`);
      }
    } catch (error) {
      console.error(`❌ Error creating license ${license.name}:`, error.message);
    }
  }

  // Step 3: Create releases
  const createReleaseMutation = `
    mutation CreateRelease($input: ReleaseInput!) {
      createRelease(input: $input) {
        id
        name
        level
        description
      }
    }
  `;

  const releases = [
    { name: "Alpha Release", level: 0.1, description: "Early alpha version", productId },
    { name: "Beta Release", level: 0.5, description: "Beta testing version", productId },
    { name: "Release Candidate", level: 0.9, description: "Release candidate", productId },
    { name: "Production Release", level: 1.0, description: "Production ready", productId }
  ];

  console.log('\n🚀 Creating releases...');
  for (const release of releases) {
    try {
      const releaseResponse = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: createReleaseMutation,
          variables: { input: release }
        })
      });

      const releaseResult = await releaseResponse.json();
      if (releaseResult.errors) {
        console.error(`❌ Release creation failed for ${release.name}:`, releaseResult.errors);
      } else {
        console.log(`   ✅ Release: ${releaseResult.data.createRelease.name} (Level ${releaseResult.data.createRelease.level})`);
      }
    } catch (error) {
      console.error(`❌ Error creating release ${release.name}:`, error.message);
    }
  }

  // Step 4: Create outcomes
  const createOutcomeMutation = `
    mutation CreateOutcome($input: OutcomeInput!) {
      createOutcome(input: $input) {
        id
        name
        description
      }
    }
  `;

  const outcomes = [
    { name: "User Authentication", description: "Secure user login and registration", productId },
    { name: "Data Processing", description: "Efficient data processing capabilities", productId },
    { name: "API Integration", description: "Seamless API integration", productId },
    { name: "Performance Optimization", description: "Optimized system performance", productId },
    { name: "Security Compliance", description: "Security standards compliance", productId }
  ];

  console.log('\n🎯 Creating outcomes...');
  for (const outcome of outcomes) {
    try {
      const outcomeResponse = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: createOutcomeMutation,
          variables: { input: outcome }
        })
      });

      const outcomeResult = await outcomeResponse.json();
      if (outcomeResult.errors) {
        console.error(`❌ Outcome creation failed for ${outcome.name}:`, outcomeResult.errors);
      } else {
        console.log(`   ✅ Outcome: ${outcomeResult.data.createOutcome.name}`);
        console.log(`      📝 ${outcomeResult.data.createOutcome.description}`);
      }
    } catch (error) {
      console.error(`❌ Error creating outcome ${outcome.name}:`, error.message);
    }
  }

  // Step 5: Verify complete product with all attributes
  const getProductQuery = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        name
        description
        customAttrs
        licenses {
          id
          name
          level
          isActive
        }
        releases {
          id
          name
          level
          description
        }
        outcomes {
          id
          name
          description
        }
      }
    }
  `;

  try {
    console.log('\n🔍 Verifying complete product...');
    const verifyResponse = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: getProductQuery,
        variables: { id: productId }
      })
    });

    const verifyResult = await verifyResponse.json();
    if (verifyResult.errors) {
      console.error('❌ Product verification failed:', verifyResult.errors);
      return;
    }

    const product = verifyResult.data.product;
    console.log('\n🎉 COMPREHENSIVE TEST PRODUCT CREATED!');
    console.log('='.repeat(60));
    console.log(`📦 Product ID: ${product.id}`);
    console.log(`📝 Name: ${product.name}`);
    console.log(`📄 Description: ${product.description}`);
    console.log(`🔢 Version: ${product.customAttrs?.version || 'N/A'}`);
    console.log(`⚙️ Custom Attributes: ${Object.keys(product.customAttrs || {}).length} items`);
    console.log(`🔑 Licenses: ${product.licenses?.length || 0} items`);
    console.log(`🚀 Releases: ${product.releases?.length || 0} items`);
    console.log(`🎯 Outcomes: ${product.outcomes?.length || 0} items`);
    
    if (product.licenses?.length > 0) {
      console.log('\n🔑 Available Licenses:');
      product.licenses.forEach(license => {
        console.log(`   • ${license.name} (Level ${license.level})`);
      });
    }
    
    if (product.releases?.length > 0) {
      console.log('\n🚀 Available Releases:');
      product.releases.forEach(release => {
        console.log(`   • ${release.name} (Level ${release.level})`);
      });
    }
    
    if (product.outcomes?.length > 0) {
      console.log('\n🎯 Available Outcomes:');
      product.outcomes.forEach(outcome => {
        console.log(`   • ${outcome.name}`);
      });
    }

    console.log('\n✅ This product is ready for comprehensive task testing!');
    console.log('   📋 Use this product to test task creation with all fields');
    console.log('   🔑 Multiple license levels available');
    console.log('   🚀 Multiple release options available');
    console.log('   🎯 Multiple outcome selections available');
    console.log('   ⚙️ Custom attributes configured');
    
    return {
      productId: product.id,
      productName: product.name,
      licenses: product.licenses,
      releases: product.releases,
      outcomes: product.outcomes
    };

  } catch (error) {
    console.error('❌ Error verifying product:', error.message);
  }
}

createComprehensiveTestProduct();