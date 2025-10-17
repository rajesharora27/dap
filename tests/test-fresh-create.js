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
        description
      }
    }
  `,
  variables: {
    input: {
      name: 'Cisco Secure Access',
      description: 'Test creation after hard delete',
      customAttrs: {}
    }
  }
}).then(result => {
  console.log('✅ Product created successfully!');
  console.log('ID:', result.data.createProduct.id);
  console.log('Name:', result.data.createProduct.name);
  console.log('\n🎉 No unique constraint error - hard delete worked!');
}).catch(error => {
  console.error('❌ Error:', error.message);
  if (error.message.includes('Unique constraint')) {
    console.log('\n⚠️  Still getting unique constraint - hard delete may not have worked');
  }
});
