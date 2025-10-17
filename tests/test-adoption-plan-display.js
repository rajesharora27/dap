/**
 * Test: Verify adoption plan is created and displayed after product assignment
 * 
 * This test validates the fix for the issue where adoption plans were not
 * being displayed after assigning a product to a customer.
 */

const { ApolloClient, InMemoryCache, gql, HttpLink } = require('@apollo/client/core');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch,
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    query: { fetchPolicy: 'no-cache' },
    mutate: { fetchPolicy: 'no-cache' },
  },
});

// Mutations and Queries
const GET_CUSTOMERS = gql`
  query GetCustomers {
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
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
        }
      }
    }
  }
`;

const GET_PRODUCTS = gql`
  query GetProducts {
    products(first: 100) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      id
      name
    }
  }
`;

const ASSIGN_PRODUCT = gql`
  mutation AssignProductToCustomer($input: AssignProductToCustomerInput!) {
    assignProductToCustomer(input: $input) {
      id
      licenseLevel
      product {
        id
        name
      }
      adoptionPlan {
        id
        progressPercentage
        totalTasks
        completedTasks
      }
    }
  }
`;

const CREATE_ADOPTION_PLAN = gql`
  mutation CreateAdoptionPlan($customerProductId: ID!) {
    createAdoptionPlan(customerProductId: $customerProductId) {
      id
      totalTasks
      completedTasks
      progressPercentage
    }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

async function testAdoptionPlanDisplay() {
  console.log('🧪 Testing: Adoption Plan Display After Product Assignment\n');
  
  let testCustomerId = null;
  
  try {
    // Step 1: Get available products
    console.log('1️⃣  Fetching available products...');
    const productsResult = await client.query({ query: GET_PRODUCTS });
    const products = productsResult.data.products.edges.map(e => e.node);
    
    if (products.length === 0) {
      throw new Error('No products available for testing');
    }
    
    const testProduct = products[0];
    console.log(`   ✅ Found product: ${testProduct.name} (${testProduct.id})`);
    
    // Step 2: Create a test customer
    console.log('\n2️⃣  Creating test customer...');
    const customerResult = await client.mutate({
      mutation: CREATE_CUSTOMER,
      variables: {
        input: {
          name: 'Test Customer - Adoption Plan Display',
          description: 'Test customer for adoption plan display validation',
        },
      },
    });
    
    testCustomerId = customerResult.data.createCustomer.id;
    console.log(`   ✅ Created customer: ${customerResult.data.createCustomer.name}`);
    console.log(`   📋 Customer ID: ${testCustomerId}`);
    
    // Step 3: Assign product to customer WITH adoption plan creation
    console.log('\n3️⃣  Assigning product with immediate adoption plan creation...');
    const assignResult = await client.mutate({
      mutation: ASSIGN_PRODUCT,
      variables: {
        input: {
          customerId: testCustomerId,
          productId: testProduct.id,
          licenseLevel: 'Essential',
          selectedOutcomeIds: [],
        },
      },
    });
    
    const customerProduct = assignResult.data.assignProductToCustomer;
    console.log(`   ✅ Product assigned: ${customerProduct.product.name}`);
    console.log(`   📋 License Level: ${customerProduct.licenseLevel}`);
    console.log(`   📋 Customer Product ID: ${customerProduct.id}`);
    
    // Step 4: Create adoption plan
    console.log('\n4️⃣  Creating adoption plan...');
    const planResult = await client.mutate({
      mutation: CREATE_ADOPTION_PLAN,
      variables: {
        customerProductId: customerProduct.id,
      },
    });
    
    const adoptionPlan = planResult.data.createAdoptionPlan;
    console.log(`   ✅ Adoption plan created: ${adoptionPlan.id}`);
    console.log(`   📊 Total tasks: ${adoptionPlan.totalTasks}`);
    console.log(`   📊 Completed tasks: ${adoptionPlan.completedTasks}`);
    console.log(`   📊 Progress: ${adoptionPlan.progressPercentage}%`);
    
    // Step 5: Verify adoption plan is visible in customer query
    console.log('\n5️⃣  Verifying adoption plan is visible in customer query...');
    const customersResult = await client.query({ query: GET_CUSTOMERS });
    const testCustomer = customersResult.data.customers.find(c => c.id === testCustomerId);
    
    if (!testCustomer) {
      throw new Error('Test customer not found in query');
    }
    
    if (testCustomer.products.length === 0) {
      throw new Error('❌ Product not found in customer data');
    }
    
    const customerProductData = testCustomer.products[0];
    console.log(`   ✅ Customer has ${testCustomer.products.length} product(s)`);
    console.log(`   ✅ Product: ${customerProductData.product.name}`);
    
    if (!customerProductData.adoptionPlan) {
      throw new Error('❌ ADOPTION PLAN NOT VISIBLE IN QUERY - FIX DID NOT WORK');
    }
    
    console.log(`   ✅ Adoption plan is visible!`);
    console.log(`   📊 Plan ID: ${customerProductData.adoptionPlan.id}`);
    console.log(`   📊 Total tasks: ${customerProductData.adoptionPlan.totalTasks}`);
    console.log(`   📊 Progress: ${customerProductData.adoptionPlan.progressPercentage}%`);
    
    // Validate data consistency
    if (customerProductData.adoptionPlan.id !== adoptionPlan.id) {
      throw new Error('❌ Adoption plan ID mismatch');
    }
    
    if (customerProductData.adoptionPlan.totalTasks !== adoptionPlan.totalTasks) {
      throw new Error('❌ Task count mismatch');
    }
    
    console.log('\n✅ ALL VALIDATIONS PASSED!');
    console.log('   ✓ Adoption plan created successfully');
    console.log('   ✓ Adoption plan visible in customer query');
    console.log('   ✓ Data consistency verified');
    console.log('   ✓ Sync button should now be visible in UI');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    return false;
  } finally {
    // Cleanup: Delete test customer
    if (testCustomerId) {
      console.log('\n🧹 Cleaning up test data...');
      try {
        await client.mutate({
          mutation: DELETE_CUSTOMER,
          variables: { id: testCustomerId },
        });
        console.log('   ✅ Test customer deleted');
      } catch (error) {
        console.log('   ⚠️  Could not delete test customer:', error.message);
      }
    }
  }
}

// Run the test
testAdoptionPlanDisplay()
  .then((success) => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 TEST SUITE PASSED - Fix verified!');
      console.log('='.repeat(60));
      process.exit(0);
    } else {
      console.log('💔 TEST SUITE FAILED - Issue persists');
      console.log('='.repeat(60));
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
