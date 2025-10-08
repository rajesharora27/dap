const { ApolloClient, InMemoryCache, HttpLink, gql } = require('@apollo/client/core');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://127.0.0.1:4000/graphql', fetch }),
  cache: new InMemoryCache()
});

client.mutate({
  mutation: gql`
    mutation CreateProduct($input: ProductInput!) {
      createProduct(input: $input) {
        id
        name
      }
    }
  `,
  variables: {
    input: {
      name: 'Cisco Secure Access',
      description: 'Test',
      customAttrs: {}
    }
  }
}).then(result => {
  console.log('Created:', result.data.createProduct);
}).catch(error => {
  console.log('Error:', error.message);
  if (error.message.includes('Unique constraint')) {
    console.log('\nProduct "Cisco Secure Access" exists but is soft-deleted!');
  }
});
