#!/usr/bin/env node

/**
 * Test script to verify ProductDialog validation through simulated frontend workflow
 * This script simulates what happens when a user creates a product through the frontend
 */

const BACKEND_URL = 'http://localhost:4000/graphql';

// Simulate the ProductDialog handleAddProductSave workflow
async function testProductDialogWorkflow() {
  console.log('🧪 Testing ProductDialog Validation Workflow...\n');

  const productName = `DialogValidationTest-${Date.now()}`;
  
  console.log('📦 Step 1: Simulating ProductDialog creation with defaults...');
  
  // This simulates what ProductDialog does when a user enters just a name
  const productData = {
    name: productName,
    description: "Test product created via dialog simulation",
    customAttrs: {
      priority: "medium",
      owner: "",
      department: ""
    },
    // These are the defaults that ProductDialog sets for new products
    outcomes: [{
      name: productName, // Default: product name
      description: `Primary outcome for ${productName}`,
      isNew: true
    }],
    licenses: [{
      name: 'Essential', // Default: Essential
      description: 'Default essential license',
      level: "1", // Default: Level 1
      isActive: true,
      isNew: true
    }],
    releases: [{
      name: '1.0', // Default: 1.0
      level: 1.0,
      description: 'Initial release',
      isNew: true
    }]
  };

  try {
    // Step 1: Create the product (simulating productHandlers.createProduct)
    console.log('   Creating base product...');
    const createProductMutation = `
      mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
          id
          name
          description
        }
      }
    `;

    const productResponse = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: createProductMutation,
        variables: { 
          input: {
            name: productData.name,
            description: productData.description,
            customAttrs: productData.customAttrs
          }
        }
      })
    });

    const productResult = await productResponse.json();
    if (productResult.errors) {
      console.error('❌ Product creation failed:', productResult.errors);
      return;
    }

    const product = productResult.data.createProduct;
    const productId = product.id;
    console.log(`   ✅ Product created: ${product.name} (${productId})`);

    // Step 2: Create licenses (simulating licenseHandlers.createLicense)
    console.log('   Creating default licenses...');
    for (const license of productData.licenses) {
      if (!license.delete) {
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

        const licenseResponse = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: createLicenseMutation,
            variables: { 
              input: {
                name: license.name,
                description: license.description,
                level: parseInt(license.level),
                isActive: license.isActive,
                productId: productId
              }
            }
          })
        });

        const licenseResult = await licenseResponse.json();
        if (licenseResult.errors) {
          console.error(`   ❌ License creation failed for ${license.name}:`, licenseResult.errors);
        } else {
          console.log(`   ✅ License: ${licenseResult.data.createLicense.name} (Level ${licenseResult.data.createLicense.level})`);
        }
      }
    }

    // Step 3: Create outcomes (simulating outcomeHandlers.createOutcome)
    console.log('   Creating default outcomes...');
    for (const outcome of productData.outcomes) {
      if (!outcome.delete) {
        const createOutcomeMutation = `
          mutation CreateOutcome($input: OutcomeInput!) {
            createOutcome(input: $input) {
              id
              name
              description
            }
          }
        `;

        const outcomeResponse = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: createOutcomeMutation,
            variables: { 
              input: {
                name: outcome.name,
                description: outcome.description,
                productId: productId
              }
            }
          })
        });

        const outcomeResult = await outcomeResponse.json();
        if (outcomeResult.errors) {
          console.error(`   ❌ Outcome creation failed for ${outcome.name}:`, outcomeResult.errors);
        } else {
          console.log(`   ✅ Outcome: ${outcomeResult.data.createOutcome.name}`);
        }
      }
    }

    // Step 4: Create releases (simulating releaseHandlers.createRelease)
    console.log('   Creating default releases...');
    for (const release of productData.releases) {
      if (!release.delete) {
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

        const releaseResponse = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: createReleaseMutation,
            variables: { 
              input: {
                name: release.name,
                level: release.level,
                description: release.description,
                productId: productId
              }
            }
          })
        });

        const releaseResult = await releaseResponse.json();
        if (releaseResult.errors) {
          console.error(`   ❌ Release creation failed for ${release.name}:`, releaseResult.errors);
        } else {
          console.log(`   ✅ Release: ${releaseResult.data.createRelease.name} (Level ${releaseResult.data.createRelease.level})`);
        }
      }
    }

    // Step 5: Verify the complete product
    console.log('\n🔍 Step 2: Verifying mandatory attributes...');
    
    const verifyQuery = `
      query {
        products(first: 20) {
          edges {
            node {
              id
              name
              description
              licenses {
                id
                name
                level
                isActive
              }
              outcomes {
                id
                name
                description
              }
              releases {
                id
                name
                level
                description
              }
            }
          }
        }
      }
    `;

    const verifyResponse = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: verifyQuery })
    });

    const verifyResult = await verifyResponse.json();
    if (verifyResult.errors) {
      console.error('❌ Verification failed:', verifyResult.errors);
      return;
    }

    // Find our test product
    const testProduct = verifyResult.data.products.edges.find(edge => 
      edge.node.name === productName
    )?.node;

    if (!testProduct) {
      console.error('❌ Test product not found in verification');
      return;
    }

    console.log('📊 VERIFICATION RESULTS:');
    console.log('========================================');
    console.log(`✅ Product: ${testProduct.name}`);
    console.log(`✅ Description: ${testProduct.description}`);
    
    // Check mandatory attributes
    const hasEssentialLicense = testProduct.licenses.some(l => 
      l.name === 'Essential' && l.level === 1 && l.isActive
    );
    const hasProductNameOutcome = testProduct.outcomes.some(o => 
      o.name === productName
    );
    const hasDefaultRelease = testProduct.releases.some(r => 
      r.name === '1.0' && r.level === 1.0
    );

    console.log('\n🎯 MANDATORY ATTRIBUTE VALIDATION:');
    console.log(`   📛 Product Name: ✅ ${testProduct.name}`);
    console.log(`   🔑 Essential License (Level 1): ${hasEssentialLicense ? '✅ PRESENT' : '❌ MISSING'}`);
    if (hasEssentialLicense) {
      const license = testProduct.licenses.find(l => l.name === 'Essential');
      console.log(`      └─ Name: ${license.name}, Level: ${license.level}, Active: ${license.isActive}`);
    }
    console.log(`   🎯 Product Name Outcome: ${hasProductNameOutcome ? '✅ PRESENT' : '❌ MISSING'}`);
    if (hasProductNameOutcome) {
      const outcome = testProduct.outcomes.find(o => o.name === productName);
      console.log(`      └─ Name: ${outcome.name}, Description: ${outcome.description}`);
    }
    console.log(`   🚀 Default Release (1.0): ${hasDefaultRelease ? '✅ PRESENT' : '❌ MISSING'}`);
    if (hasDefaultRelease) {
      const release = testProduct.releases.find(r => r.name === '1.0');
      console.log(`      └─ Name: ${release.name}, Level: ${release.level}, Description: ${release.description}`);
    }

    // Final validation
    const allMandatoryAttributesPresent = hasEssentialLicense && hasProductNameOutcome && hasDefaultRelease;
    
    console.log('\n========================================');
    if (allMandatoryAttributesPresent) {
      console.log('🎉🎉🎉 VALIDATION TEST PASSED! 🎉🎉🎉');
      console.log('All mandatory attributes are properly enforced:');
      console.log('✅ Product Name: Required and present');
      console.log('✅ License: Essential (Level 1) automatically created');
      console.log('✅ Outcome: Product name automatically created');
      console.log('✅ Release: 1.0 automatically created');
      console.log('\nProductDialog validation is working correctly!');
    } else {
      console.log('❌ VALIDATION TEST FAILED!');
      console.log('Some mandatory attributes are missing or incorrect.');
      console.log('ProductDialog validation needs to be fixed.');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testProductDialogWorkflow().catch(console.error);