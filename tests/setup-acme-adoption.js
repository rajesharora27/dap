#!/usr/bin/env node

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

const CREATE_PLAN = gql`
  mutation CreatePlan($customerProductId: ID!) {
    createAdoptionPlan(customerProductId: $customerProductId) {
      id
      totalTasks
    }
  }
`;

const SYNC_PLAN = gql`
  mutation SyncPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      totalTasks
      completedTasks
    }
  }
`;

async function setup() {
  try {
    const { data } = await client.query({
      query: GET_CUSTOMER,
      variables: { id: 'cmgr0jt9s0000b2jw03rso1xh' },  // Acme Corporation
      fetchPolicy: 'network-only',
    });
    
    const customer = data.customer;
    console.log(`Customer: ${customer.name}`);
    
    if (customer.products.length === 0) {
      console.log('No products');
      return;
    }
    
    const cp = customer.products[0];
    console.log(`Product: ${cp.product.name} (${cp.licenseLevel})`);
    
    let planId;
    if (cp.adoptionPlan) {
      console.log(`Plan exists: ${cp.adoptionPlan.id}`);
      planId = cp.adoptionPlan.id;
    } else {
      console.log('Creating plan...');
      const { data: planData } = await client.mutate({
        mutation: CREATE_PLAN,
        variables: { customerProductId: cp.id },
      });
      planId = planData.createAdoptionPlan.id;
      console.log(`Plan created: ${planId}`);
    }
    
    console.log('Syncing plan...');
    const { data: syncData } = await client.mutate({
      mutation: SYNC_PLAN,
      variables: { adoptionPlanId: planId },
    });
    
    console.log(`✅ Sync complete: ${syncData.syncAdoptionPlan.totalTasks} tasks`);
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.graphQLErrors) {
      console.error(JSON.stringify(err.graphQLErrors, null, 2));
    }
  }
}

setup();
