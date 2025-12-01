#!/usr/bin/env node
/**
 * Test GraphQL with Real User Authentication
 * Simulates browser requests with actual JWT tokens
 */

const http = require('http');

// Test configuration
const BACKEND_URL = 'localhost';
const BACKEND_PORT = 4000;

// Test users
const TEST_USERS = [
  { username: 'admin', password: 'admin', description: 'Admin User' },
  { username: 'smeuser', password: 'smeuser', description: 'SME User' },
  { username: 'cssuser', password: 'cssuser', description: 'CSS User' }
];

// GraphQL queries to test
const QUERIES = {
  products: `{ products(first: 20) { edges { node { id name } } totalCount } }`,
  solutions: `{ solutions(first: 20) { edges { node { id name } } totalCount } }`,
  customers: `{ customers(first: 20) { edges { node { id name } } totalCount } }`
};

/**
 * Make HTTP request to GraphQL endpoint
 */
function makeRequest(query, token = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    
    const options = {
      hostname: BACKEND_URL,
      port: BACKEND_PORT,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Login and get JWT token
 */
async function login(username, password) {
  const query = `
    mutation {
      login(username: "${username}", password: "${password}")
    }
  `;

  const response = await makeRequest(query);
  
  if (response.errors) {
    throw new Error(`Login failed: ${JSON.stringify(response.errors)}`);
  }

  // The login mutation returns just a token string
  const token = response.data.login;

  // Now get user info with the token
  const meQuery = `{ me { id username isAdmin } }`;
  const meResponse = await makeRequest(meQuery, token);

  if (meResponse.errors) {
    throw new Error(`Failed to get user info: ${JSON.stringify(meResponse.errors)}`);
  }

  return {
    token: token,
    user: meResponse.data.me
  };
}

/**
 * Test products query with specific user
 */
async function testUserAccess(username, password, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${description} (${username})`);
  console.log('='.repeat(60));

  try {
    // Step 1: Login
    console.log('1️⃣  Logging in...');
    const { token, user } = await login(username, password);
    console.log(`   ✅ Logged in as: ${user.username} (ID: ${user.id}, Admin: ${user.isAdmin})`);

    // Step 2: Test Products Query
    console.log('\n2️⃣  Testing Products Query...');
    const productsResult = await makeRequest(QUERIES.products, token);
    
    if (productsResult.errors) {
      console.log('   ❌ Products query failed:');
      console.log('   ', JSON.stringify(productsResult.errors, null, 2));
    } else {
      const count = productsResult.data?.products?.totalCount || 0;
      console.log(`   ✅ Products: ${count} items`);
      if (count > 0 && productsResult.data.products.edges.length > 0) {
        productsResult.data.products.edges.slice(0, 3).forEach(edge => {
          console.log(`      - ${edge.node.name}`);
        });
        if (count > 3) console.log(`      ... and ${count - 3} more`);
      }
    }

    // Step 3: Test Solutions Query
    console.log('\n3️⃣  Testing Solutions Query...');
    const solutionsResult = await makeRequest(QUERIES.solutions, token);
    
    if (solutionsResult.errors) {
      console.log('   ❌ Solutions query failed:');
      console.log('   ', JSON.stringify(solutionsResult.errors, null, 2));
    } else {
      const count = solutionsResult.data?.solutions?.totalCount || 0;
      console.log(`   ✅ Solutions: ${count} items`);
      if (count > 0 && solutionsResult.data.solutions.edges.length > 0) {
        solutionsResult.data.solutions.edges.slice(0, 3).forEach(edge => {
          console.log(`      - ${edge.node.name}`);
        });
        if (count > 3) console.log(`      ... and ${count - 3} more`);
      }
    }

    // Step 4: Test Customers Query
    console.log('\n4️⃣  Testing Customers Query...');
    const customersResult = await makeRequest(QUERIES.customers, token);
    
    if (customersResult.errors) {
      console.log('   ❌ Customers query failed:');
      console.log('   ', JSON.stringify(customersResult.errors, null, 2));
    } else {
      const count = customersResult.data?.customers?.totalCount || 0;
      console.log(`   ✅ Customers: ${count} items`);
      if (count > 0 && customersResult.data.customers.edges.length > 0) {
        customersResult.data.customers.edges.slice(0, 3).forEach(edge => {
          console.log(`      - ${edge.node.name}`);
        });
        if (count > 3) console.log(`      ... and ${count - 3} more`);
      }
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 Starting RBAC Integration Tests');
  console.log('📡 Backend: http://' + BACKEND_URL + ':' + BACKEND_PORT + '/graphql\n');

  let passCount = 0;
  let failCount = 0;

  for (const testUser of TEST_USERS) {
    const success = await testUserAccess(
      testUser.username,
      testUser.password,
      testUser.description
    );
    
    if (success) passCount++;
    else failCount++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(60) + '\n');

  if (failCount > 0) {
    console.log('⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

