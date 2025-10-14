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

const SYNC_MUTATION = gql`
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      totalTasks
      completedTasks
      progressPercentage
      needsSync
    }
  }
`;

async function sync() {
  try {
    console.log('Syncing adoption plan: cmgr1kh9l0009b2hjgi650aef');
    const { data } = await client.mutate({
      mutation: SYNC_MUTATION,
      variables: {
        adoptionPlanId: 'cmgr1kh9l0009b2hjgi650aef',
      },
    });
    
    console.log('✅ Sync successful:');
    console.log(JSON.stringify(data.syncAdoptionPlan, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.graphQLErrors) {
      console.error('GraphQL Errors:', JSON.stringify(err.graphQLErrors, null, 2));
    }
  }
}

sync();
