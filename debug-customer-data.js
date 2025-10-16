/**
 * Debug script to check what data is actually being returned from GET_CUSTOMERS query
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
  },
});

const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      description
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

async function debugCustomerData() {
  console.log('🔍 Debugging Customer Data from GraphQL');
  console.log('=' .repeat(60));
  console.log('');

  try {
    const result = await client.query({ query: GET_CUSTOMERS });
    const customers = result.data.customers;

    console.log(`📊 Found ${customers.length} customers\n`);

    customers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.name} (${customer.id})`);
      console.log(`   Description: ${customer.description || 'N/A'}`);
      console.log(`   Products: ${customer.products?.length || 0}`);
      
      if (customer.products && customer.products.length > 0) {
        customer.products.forEach((cp, pIndex) => {
          console.log(`   ${pIndex + 1}. ${cp.product.name}`);
          console.log(`      - Customer Product ID: ${cp.id}`);
          console.log(`      - Product ID: ${cp.product.id}`);
          console.log(`      - License Level: ${cp.licenseLevel}`);
          console.log(`      - Adoption Plan: ${cp.adoptionPlan ? '✅ EXISTS' : '❌ NULL'}`);
          if (cp.adoptionPlan) {
            console.log(`        - Plan ID: ${cp.adoptionPlan.id}`);
            console.log(`        - Total Tasks: ${cp.adoptionPlan.totalTasks}`);
            console.log(`        - Completed Tasks: ${cp.adoptionPlan.completedTasks}`);
            console.log(`        - Progress: ${cp.adoptionPlan.progressPercentage}%`);
          }
        });
      } else {
        console.log(`   ⚠️  No products assigned`);
      }
      console.log('');
    });

    console.log('=' .repeat(60));
    console.log('✅ Debug complete\n');

    // Check if any customer-products are missing adoption plans
    const missingPlans = [];
    customers.forEach(customer => {
      customer.products?.forEach(cp => {
        if (!cp.adoptionPlan) {
          missingPlans.push({
            customer: customer.name,
            product: cp.product.name,
            customerProductId: cp.id,
          });
        }
      });
    });

    if (missingPlans.length > 0) {
      console.log('⚠️  CUSTOMER-PRODUCTS WITHOUT ADOPTION PLANS:');
      console.log('=' .repeat(60));
      missingPlans.forEach(item => {
        console.log(`❌ ${item.customer} → ${item.product}`);
        console.log(`   Customer Product ID: ${item.customerProductId}`);
        console.log(`   ACTION: Create adoption plan with:`);
        console.log(`   mutation { createAdoptionPlan(customerProductId: "${item.customerProductId}") { id } }`);
        console.log('');
      });
    } else {
      console.log('✅ All customer-products have adoption plans!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.networkError) {
      console.error('Network Error:', error.networkError);
    }
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(err => {
        console.error('GraphQL Error:', err.message);
      });
    }
  }
}

debugCustomerData();
