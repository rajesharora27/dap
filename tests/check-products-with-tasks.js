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
    products(first: 100) {
      edges {
        node {
          id
          name
          tasks(first: 100) {
            edges {
              node {
                id
                name
                telemetryAttributes {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function check() {
  try {
    const { data } = await client.query({ query: QUERY, fetchPolicy: 'network-only' });
    
    console.log('Products with tasks and telemetry:');
    data.products.edges.forEach(edge => {
      const p = edge.node;
      const tasks = p.tasks.edges.map(e => e.node);
      const tasksWithTelemetry = tasks.filter(t => t.telemetryAttributes && t.telemetryAttributes.length > 0);
      if (tasks.length > 0) {
        console.log(`\n${p.name} (${p.id})`);
        console.log(`  Total tasks: ${tasks.length}`);
        console.log(`  Tasks with telemetry: ${tasksWithTelemetry.length}`);
      }
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
