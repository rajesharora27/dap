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

const QUERY = gql`
  query {
    customers {
      id
      name
      products {
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
  }
`;

async function check() {
  try {
    const { data } = await client.query({ query: QUERY, fetchPolicy: 'network-only' });
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    if (err.graphQLErrors) {
      console.error('GraphQL Errors:', JSON.stringify(err.graphQLErrors, null, 2));
    }
  }
}

check();
