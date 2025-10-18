#!/usr/bin/env node

/**
 * Create adoption plan for Healthcare Network Inc
 */

const { ApolloClient, InMemoryCache, gql, HttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch,
  }),
  cache: new InMemoryCache(),
});

const GET_CUSTOMER = gql`
  query GetCustomer($id: ID!) {
    customer(id: $id) {
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
        }
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

async function createPlan() {
  try {
    console.log('Fetching customer details...');
    const { data } = await client.query({
      query: GET_CUSTOMER,
      variables: { id: 'customer-health-1' },
      fetchPolicy: 'network-only',
    });

    const customer = data.customer;
    console.log(`Customer: ${customer.name}`);
    console.log(`Products: ${customer.products.length}`);

    if (customer.products.length === 0) {
      console.log('No products assigned');
      return;
    }

    const customerProduct = customer.products[0];
    console.log(`Product: ${customerProduct.product.name} (${customerProduct.licenseLevel})`);

    if (customerProduct.adoptionPlan) {
      console.log(`✅ Adoption plan already exists: ${customerProduct.adoptionPlan.id}`);
      return;
    }

    console.log('\nCreating adoption plan...');
    const { data: planData } = await client.mutate({
      mutation: CREATE_ADOPTION_PLAN,
      variables: {
        customerProductId: customerProduct.id,
      },
    });

    console.log('✅ Adoption plan created successfully:');
    console.log(JSON.stringify(planData.createAdoptionPlan, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    if (err.graphQLErrors) {
      console.error('GraphQL Errors:', err.graphQLErrors);
    }
  }
}

createPlan();
