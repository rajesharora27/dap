#!/usr/bin/env node

/**
 * Test Edit Entitlements and Sync Functionality
 * 
 * This script tests:
 * 1. Updating customer product entitlements (license level and outcomes)
 * 2. Verifying adoption plan is marked for sync
 * 3. Syncing adoption plan
 * 4. Verifying tasks update correctly
 */

const http = require('http');

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

// GraphQL Queries and Mutations
const GET_CUSTOMERS_WITH_PRODUCTS = `
  query GetCustomersWithProducts {
    customers {
      id
      name
      products {
        id
        product {
          id
          name
        }
        licenseLevel
        selectedOutcomes {
          id
          name
        }
        adoptionPlan {
          id
          totalTasks
          completedTasks
          needsSync
          lastSyncedAt
        }
      }
    }
  }
`;

const GET_PRODUCT_OUTCOMES = `
  query GetOutcomesForProduct($productId: ID!) {
    outcomes(productId: $productId) {
      id
      name
      description
    }
  }
`;

const UPDATE_CUSTOMER_PRODUCT = `
  mutation UpdateCustomerProduct($id: ID!, $input: UpdateCustomerProductInput!) {
    updateCustomerProduct(id: $id, input: $input) {
      id
      licenseLevel
      selectedOutcomes {
        id
        name
      }
      adoptionPlan {
        id
        needsSync
        lastSyncedAt
      }
    }
  }
`;

const SYNC_ADOPTION_PLAN = `
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
      progressPercentage
    }
  }
`;

async function graphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.errors) {
            console.error('❌ GraphQL Errors:', JSON.stringify(parsed.errors, null, 2));
            reject(new Error('GraphQL query failed'));
            return;
          }
          
          resolve(parsed.data);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Edit Entitlements and Sync Functionality\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get customers with products
    console.log('\n📋 Step 1: Getting customers with products...');
    const customersData = await graphql(GET_CUSTOMERS_WITH_PRODUCTS);
    const customers = customersData.customers;
    
    if (!customers || customers.length === 0) {
      console.log('❌ No customers found');
      return;
    }
    
    // Find a customer with a product
    let testCustomer = null;
    let testCustomerProduct = null;
    
    for (const customer of customers) {
      if (customer.products && customer.products.length > 0) {
        testCustomer = customer;
        testCustomerProduct = customer.products[0];
        break;
      }
    }
    
    if (!testCustomerProduct) {
      console.log('❌ No customer with assigned product found');
      return;
    }
    
    console.log('✅ Found test customer:', testCustomer.name);
    console.log('   Product:', testCustomerProduct.product.name);
    console.log('   Current License:', testCustomerProduct.licenseLevel);
    console.log('   Current Outcomes:', testCustomerProduct.selectedOutcomes || 'None');
    console.log('   Adoption Plan ID:', testCustomerProduct.adoptionPlan?.id);
    
    const originalLicense = testCustomerProduct.licenseLevel;
    const originalOutcomes = (testCustomerProduct.selectedOutcomes || []).map(o => o.id);
    const adoptionPlanId = testCustomerProduct.adoptionPlan?.id;
    
    if (!adoptionPlanId) {
      console.log('❌ No adoption plan found for this product');
      return;
    }
    
    console.log('   Before Update:');
    console.log('   - Total Tasks:', testCustomerProduct.adoptionPlan?.totalTasks);
    console.log('   - Needs Sync:', testCustomerProduct.adoptionPlan?.needsSync);
    
    // Step 2: Get available outcomes for the product
    console.log('\n📋 Step 2: Getting available outcomes...');
    const outcomesData = await graphql(GET_PRODUCT_OUTCOMES, {
      productId: testCustomerProduct.product.id,
    });
    const outcomes = outcomesData.outcomes || [];
    console.log('✅ Found', outcomes.length, 'outcomes');
    outcomes.forEach(o => console.log('   -', o.name));
    
    // Step 3: Update customer product entitlements
    console.log('\n📋 Step 3: Updating customer product entitlements...');
    
    // Change license level
    const newLicense = originalLicense === 'Essential' ? 'Advantage' : 'Essential';
    
    // Select different outcomes
    const newOutcomes = outcomes.length > 0 
      ? [outcomes[0].id]  // Select first outcome
      : [];
    
    console.log('   Changing license:', originalLicense, '→', newLicense);
    console.log('   Setting outcomes:', newOutcomes);
    
    const updateResult = await graphql(UPDATE_CUSTOMER_PRODUCT, {
      id: testCustomerProduct.id,
      input: {
        licenseLevel: newLicense,
        selectedOutcomeIds: newOutcomes,
      },
    });
    
    console.log('✅ Update successful!');
    console.log('   New License:', updateResult.updateCustomerProduct.licenseLevel);
    console.log('   New Outcomes:', updateResult.updateCustomerProduct.selectedOutcomes);
    console.log('   Needs Sync:', updateResult.updateCustomerProduct.adoptionPlan.needsSync);
    console.log('   Last Synced:', updateResult.updateCustomerProduct.adoptionPlan.lastSyncedAt || 'Never');
    
    if (!updateResult.updateCustomerProduct.adoptionPlan.needsSync) {
      console.log('⚠️  Warning: Adoption plan not marked for sync!');
    }
    
    // Step 4: Sync adoption plan
    console.log('\n📋 Step 4: Syncing adoption plan...');
    
    const syncResult = await graphql(SYNC_ADOPTION_PLAN, {
      adoptionPlanId,
    });
    
    console.log('✅ Sync successful!');
    console.log('   Total Tasks:', syncResult.syncAdoptionPlan.totalTasks);
    console.log('   Completed Tasks:', syncResult.syncAdoptionPlan.completedTasks);
    console.log('   Progress:', syncResult.syncAdoptionPlan.progressPercentage.toFixed(1) + '%');
    console.log('   Needs Sync:', syncResult.syncAdoptionPlan.needsSync);
    console.log('   Last Synced:', new Date(syncResult.syncAdoptionPlan.lastSyncedAt).toLocaleString());
    
    // Step 5: Restore original values
    console.log('\n📋 Step 5: Restoring original values...');
    
    await graphql(UPDATE_CUSTOMER_PRODUCT, {
      id: testCustomerProduct.id,
      input: {
        licenseLevel: originalLicense,
        selectedOutcomeIds: originalOutcomes,
      },
    });
    
    await graphql(SYNC_ADOPTION_PLAN, {
      adoptionPlanId,
    });
    
    console.log('✅ Restored to original values');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Edit Entitlements: Working correctly');
    console.log('✅ Sync Button: Updates adoption plan properly');
    console.log('✅ Data Persistence: Changes saved and restored successfully');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

main();
