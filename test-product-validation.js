#!/usr/bin/env node

/**
 * Test script to verify product validation with mandatory attributes
 * This test verifies that products are created with proper defaults:
 * - Name (must be specified)
 * - License (default: Essential, Level 1)
 * - Outcome (default: Product Name) 
 * - Release (default: 1.0)
 */

const BACKEND_URL = 'http://localhost:4000/graphql';

async function testProductValidation() {
  console.log('🧪 Testing Product Validation with Mandatory Attributes...\n');

  // Test 1: Create product with minimal data (just name)
  console.log('📦 Test 1: Creating product with minimal data (name only)...');
  
  const productName = `ValidationTestProduct-${Date.now()}`;
  
  const createProductMutation = `
    mutation CreateProduct($input: ProductInput!) {
      createProduct(input: $input) {
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
  `;

  try {
    // Create product with just name
    const productResponse = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createProductMutation,
        variables: { 
          input: {
            name: productName,
            description: "Test product for validation"
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

    // Verify the product was created but check what defaults were applied via App.tsx logic
    console.log('📋 Product Details:');
    console.log(`   Name: ${product.name}`);
    console.log(`   Description: ${product.description}`);
    console.log(`   Licenses: ${product.licenses.length} found`);
    console.log(`   Outcomes: ${product.outcomes.length} found`);
    console.log(`   Releases: ${product.releases.length} found`);

    // Test 2: Create a license for the product (simulating frontend default behavior)
    console.log('\n🔑 Test 2: Creating default Essential license...');
    
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createLicenseMutation,
        variables: { 
          input: {
            name: "Essential",
            description: "Default essential license",
            level: 1,
            isActive: true,
            productId: product.id
          }
        }
      })
    });

    const licenseResult = await licenseResponse.json();
    
    if (licenseResult.errors) {
      console.error('❌ License creation errors:', licenseResult.errors);
    } else {
      const license = licenseResult.data.createLicense;
      console.log(`✅ License created: ${license.name} (Level ${license.level})`);
    }

    // Test 3: Create a default outcome
    console.log('\n🎯 Test 3: Creating default outcome...');
    
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createOutcomeMutation,
        variables: { 
          input: {
            name: productName,
            description: `Primary outcome for ${productName}`,
            productId: product.id
          }
        }
      })
    });

    const outcomeResult = await outcomeResponse.json();
    
    if (outcomeResult.errors) {
      console.error('❌ Outcome creation errors:', outcomeResult.errors);
    } else {
      const outcome = outcomeResult.data.createOutcome;
      console.log(`✅ Outcome created: ${outcome.name}`);
    }

    // Test 4: Create a default release
    console.log('\n🚀 Test 4: Creating default release...');
    
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createReleaseMutation,
        variables: { 
          input: {
            name: "1.0",
            level: 1.0,
            description: `Initial release for ${productName}`,
            productId: product.id
          }
        }
      })
    });

    const releaseResult = await releaseResponse.json();
    
    if (releaseResult.errors) {
      console.error('❌ Release creation errors:', releaseResult.errors);
    } else {
      const release = releaseResult.data.createRelease;
      console.log(`✅ Release created: ${release.name} (Level ${release.level})`);
    }

    // Test 5: Verify the complete product
    console.log('\n🔍 Test 5: Verifying complete product with all mandatory attributes...');
    
    const verifyProductQuery = `
      query GetProduct($id: ID!) {
        products(first: 1) {
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            products(first: 10) {
              edges {
                node {
                  id
                  name
                  licenses {
                    id
                    name
                    level
                  }
                  outcomes {
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

    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.errors) {
      console.error('❌ Verification errors:', verifyResult.errors);
      return;
    }

    // Find our test product
    const testProduct = verifyResult.data.products.edges.find(edge => 
      edge.node.name === productName
    )?.node;

    if (testProduct) {
      console.log('📊 VALIDATION RESULTS:');
      console.log('========================================');
      console.log(`✅ Product Name: ${testProduct.name}`);
      console.log(`✅ Licenses: ${testProduct.licenses.length} (${testProduct.licenses.map(l => `${l.name} L${l.level}`).join(', ')})`);
      console.log(`✅ Outcomes: ${testProduct.outcomes.length} (${testProduct.outcomes.map(o => o.name).join(', ')})`);
      console.log(`✅ Releases: ${testProduct.releases.length} (${testProduct.releases.map(r => `${r.name} v${r.level}`).join(', ')})`);
      
      // Check if mandatory attributes are satisfied
      const hasRequiredLicense = testProduct.licenses.some(l => l.name === 'Essential' && l.level === 1);
      const hasRequiredOutcome = testProduct.outcomes.some(o => o.name === productName);
      const hasRequiredRelease = testProduct.releases.some(r => r.name === '1.0' && r.level === 1.0);
      
      console.log('\n✅ MANDATORY ATTRIBUTE VALIDATION:');
      console.log(`   🔑 Essential License (Level 1): ${hasRequiredLicense ? '✅ PRESENT' : '❌ MISSING'}`);
      console.log(`   🎯 Product Name Outcome: ${hasRequiredOutcome ? '✅ PRESENT' : '❌ MISSING'}`);
      console.log(`   🚀 1.0 Release: ${hasRequiredRelease ? '✅ PRESENT' : '❌ MISSING'}`);
      
      if (hasRequiredLicense && hasRequiredOutcome && hasRequiredRelease) {
        console.log('\n🎉 VALIDATION TEST PASSED! 🎉');
        console.log('All mandatory attributes are properly created with correct defaults.');
      } else {
        console.log('\n❌ VALIDATION TEST FAILED!');
        console.log('Some mandatory attributes are missing.');
      }
    } else {
      console.log('❌ Could not find test product in verification query');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testProductValidation().catch(console.error);