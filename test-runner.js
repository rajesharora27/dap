#!/usr/bin/env node

// Simple test runner to execute GraphQL operations directly
// This bypasses the frontend UI to run tests programmatically

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

const httpLink = createHttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch: fetch,
    headers: {
        'Authorization': 'admin'
    }
});

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache()
});

// GraphQL Mutations
const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      customAttrs
      outcomes {
        id
        name
        description
      }
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      id
      name
      description
      estMinutes
      weight
      priority
      licenseLevel
      notes
    }
  }
`;

const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) {
      id
      name
      description
      level
      isActive
    }
  }
`;

const CREATE_OUTCOME = gql`
  mutation CreateOutcome($input: OutcomeInput!) {
    createOutcome(input: $input) {
      id
      name
      description
      product {
        id
        name
      }
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      customAttrs
      outcomes {
        id
        name
        description
      }
    }
  }
`;

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      edges {
        node {
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
          tasks {
            edges {
              node {
                id
                name
                weight
                licenseLevel
              }
            }
          }
        }
      }
    }
  }
`;

// Test functions
async function testProductCreation() {
    console.log('🧪 Testing Product Creation...');
    try {
        const result = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `Test Product ${Date.now()}`,
                    description: 'This is a test product created by the command-line test runner',
                    customAttrs: {
                        testCreated: true,
                        createdBy: 'CLI Test Runner',
                        createdAt: new Date().toISOString()
                    }
                }
            }
        });

        console.log('✅ Product created successfully:', result.data.createProduct.name);
        return result.data.createProduct;
    } catch (error) {
        console.error('❌ Product creation failed:', error.message);
        throw error;
    }
}

async function testLicenseCreation(productId) {
    console.log('🔐 Testing License Creation...');
    try {
        const result = await client.mutate({
            mutation: CREATE_LICENSE,
            variables: {
                input: {
                    name: `Test License ${Date.now()}`,
                    description: 'Test license for validation',
                    level: 1,
                    isActive: true,
                    productId: productId
                }
            }
        });

        console.log('✅ License created successfully:', result.data.createLicense.name);
        return result.data.createLicense;
    } catch (error) {
        console.error('❌ License creation failed:', error.message);
        throw error;
    }
}

async function testOutcomeCreation(productId) {
    console.log('🎯 Testing Outcome Creation...');
    try {
        const result = await client.mutate({
            mutation: CREATE_OUTCOME,
            variables: {
                input: {
                    name: `Test Outcome ${Date.now()}`,
                    description: 'Test outcome for validation',
                    productId: productId
                }
            }
        });

        console.log('✅ Outcome created successfully:', result.data.createOutcome.name);
        return result.data.createOutcome;
    } catch (error) {
        console.error('❌ Outcome creation failed:', error.message);
        throw error;
    }
}

async function testTaskCreation(productId) {
    console.log('📋 Testing Task Creation...');
    try {
        const result = await client.mutate({
            mutation: CREATE_TASK,
            variables: {
                input: {
                    name: `Test Task ${Date.now()}`,
                    description: 'Test task for validation',
                    estMinutes: 120,
                    weight: 10,
                    priority: 'Medium',
                    licenseLevel: 'Essential',
                    notes: 'Created by CLI test runner',
                    productId: productId
                }
            }
        });

        console.log('✅ Task created successfully:', result.data.createTask.name);
        return result.data.createTask;
    } catch (error) {
        console.error('❌ Task creation failed:', error.message);
        throw error;
    }
}

async function testProductUpdate(productId) {
    console.log('✏️ Testing Product Update...');
    try {
        const result = await client.mutate({
            mutation: UPDATE_PRODUCT,
            variables: {
                id: productId,
                input: {
                    name: `Updated Test Product ${Date.now()}`,
                    description: 'This product has been updated by the CLI test runner'
                }
            }
        });

        console.log('✅ Product updated successfully:', result.data.updateProduct.name);
        return result.data.updateProduct;
    } catch (error) {
        console.error('❌ Product update failed:', error.message);
        throw error;
    }
}

async function queryProducts() {
    console.log('🔍 Querying Products...');
    try {
        const result = await client.query({
            query: GET_PRODUCTS,
            fetchPolicy: 'network-only'
        });

        const products = result.data.products.edges.map(edge => edge.node);
        console.log(`✅ Found ${products.length} products`);
        return products;
    } catch (error) {
        console.error('❌ Product query failed:', error.message);
        throw error;
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting CLI Test Runner...\n');

    try {
        // Test 1: Query existing products
        console.log('=== Test 1: Query Products ===');
        const existingProducts = await queryProducts();
        console.log(`Found ${existingProducts.length} existing products\n`);

        // Test 2: Create product
        console.log('=== Test 2: Create Product ===');
        const product = await testProductCreation();
        console.log(`Created product ID: ${product.id}\n`);

        // Test 3: Create license for the product
        console.log('=== Test 3: Create License ===');
        const license = await testLicenseCreation(product.id);
        console.log(`Created license ID: ${license.id}\n`);

        // Test 4: Create outcome for the product  
        console.log('=== Test 4: Create Outcome ===');
        const outcome = await testOutcomeCreation(product.id);
        console.log(`Created outcome ID: ${outcome.id}\n`);

        // Test 5: Create task for the product
        console.log('=== Test 5: Create Task ===');
        const task = await testTaskCreation(product.id);
        console.log(`Created task ID: ${task.id}\n`);

        // Test 6: Update the product
        console.log('=== Test 6: Update Product ===');
        const updatedProduct = await testProductUpdate(product.id);
        console.log(`Updated product: ${updatedProduct.name}\n`);

        // Test 7: Query products again to verify
        console.log('=== Test 7: Verify Final State ===');
        const finalProducts = await queryProducts();
        console.log(`Final product count: ${finalProducts.length}\n`);

        console.log('🎉 All tests completed successfully!');

    } catch (error) {
        console.error('💥 Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run the tests
runTests();
