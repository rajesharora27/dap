#!/usr/bin/env node

/**
 * Reproduction Test: Sync Preserves Selections
 * 
 * This script verifies if syncing an adoption plan preserves existing
 * outcome selections instead of overwriting them with product defaults.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load JWT_SECRET from backend/.env
let JWT_SECRET = 'mac-demo-jwt-secret-change-if-needed';
try {
  const envPath = path.join(__dirname, '../backend/.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^JWT_SECRET=(.+)$/m);
  if (match) {
    JWT_SECRET = match[1].trim();
  }
} catch (error) {
  console.warn('⚠️ Could not read backend/.env, using default secret');
}

// Generate Admin Token
const adminToken = jwt.sign(
  {
    userId: 'cmh2l5nq00000b2nj1xm9tve6',
    username: 'admin',
    role: 'ADMIN',
    isAdmin: true,
    sessionId: 'cmjd6x1mm0001tkqcqagphtec'
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

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
          outcomes {
            id
            name
          }
        }
        selectedOutcomes {
          id
          name
        }
        adoptionPlan {
          id
        }
      }
    }
  }
`;

const UPDATE_CUSTOMER_PRODUCT = `
  mutation UpdateCustomerProduct($id: ID!, $input: UpdateCustomerProductInput!) {
    updateCustomerProduct(id: $id, input: $input) {
      id
      selectedOutcomes {
        id
        name
      }
    }
  }
`;

const SYNC_ADOPTION_PLAN = `
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      lastSyncedAt
    }
  }
`;

const GET_ADOPTION_PLAN = `
  query GetAdoptionPlan($id: ID!) {
    adoptionPlan(id: $id) {
      id
      customerProduct {
        id
        selectedOutcomes {
          id
          name
        }
      }
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
        'Authorization': `Bearer ${adminToken}`
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.errors) {
            console.error('❌ GraphQL Errors:', JSON.stringify(parsed.errors, null, 2));
            reject(new Error('GraphQL query failed'));
            return;
          }
          resolve(parsed.data);
        } catch (error) { reject(error); }
      });
    });

    req.on('error', (error) => { reject(error); });
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🧪 Testing Sync Preservation of Selections\n');

  try {
    // 1. Get a customer product with at least 2 outcomes
    const customersData = await graphql(GET_CUSTOMERS_WITH_PRODUCTS);
    const customer = customersData.customers.find(c =>
      c.products.some(cp => cp.product.outcomes.length >= 2)
    );

    if (!customer) {
      console.error('❌ No suitable test customer found with >= 2 outcomes');
      process.exit(1);
    }

    const cp = customer.products.find(cp => cp.product.outcomes.length >= 2);
    const adoptionPlanId = cp.adoptionPlan.id;
    const allOutcomeIds = cp.product.outcomes.map(o => o.id);

    console.log(`✅ Using Customer Product: ${cp.product.name} for ${customer.name}`);
    console.log(`   Initial Selected Outcomes: ${cp.selectedOutcomes.length} of ${allOutcomeIds.length}`);

    // 2. Select only ONE outcome
    const testOutcomeId = allOutcomeIds[0];
    console.log(`\n📋 Selecting only one outcome: ${testOutcomeId}`);

    await graphql(UPDATE_CUSTOMER_PRODUCT, {
      id: cp.id,
      input: { selectedOutcomeIds: [testOutcomeId] }
    });

    let adoptionPlanResponse = await graphql(GET_ADOPTION_PLAN, { id: adoptionPlanId });
    let updatedCp = adoptionPlanResponse.adoptionPlan.customerProduct;
    console.log(`   Selected Outcomes after update: ${updatedCp.selectedOutcomes.length}`);

    if (updatedCp.selectedOutcomes.length !== 1) {
      console.error('❌ Failed to update selected outcomes locally');
      process.exit(1);
    }

    // 3. Trigger Sync
    console.log(`\n📋 Triggering Sync for plan ${adoptionPlanId}...`);
    await graphql(SYNC_ADOPTION_PLAN, { adoptionPlanId });

    // 4. Verify selections
    console.log(`\n📋 Verifying selections after sync...`);
    const afterSyncResponse = await graphql(GET_ADOPTION_PLAN, { id: adoptionPlanId });
    console.log('   Debug Sync Response:', JSON.stringify(afterSyncResponse, null, 2));

    if (!afterSyncResponse.adoptionPlan) {
      console.error('❌ Adoption plan not found after sync!');
      process.exit(1);
    }

    const afterSyncCp = afterSyncResponse.adoptionPlan.customerProduct;
    const selectedAfterSync = afterSyncCp.selectedOutcomes.map(o => o.id);

    console.log(`   Selected Outcomes after sync: ${selectedAfterSync.length}`);

    if (selectedAfterSync.length === allOutcomeIds.length && allOutcomeIds.length > 1) {
      console.log('❌ BUG REPRODUCED: Sync overwrote selections with all product outcomes');
    } else if (selectedAfterSync.length === 1 && selectedAfterSync[0] === testOutcomeId) {
      console.log('✅ PASS: Sync preserved custom selection');
    } else {
      console.log('❓ Unexpected state:', selectedAfterSync);
    }

    // Cleanup: Restore all (optional, but good practice)
    console.log(`\n📋 Cleaning up: Restoring all outcomes...`);
    await graphql(UPDATE_CUSTOMER_PRODUCT, {
      id: cp.id,
      input: { selectedOutcomeIds: allOutcomeIds }
    });

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    process.exit(1);
  }
}

main();
