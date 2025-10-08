const { ApolloClient, InMemoryCache, HttpLink, gql } = require('@apollo/client/core');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://127.0.0.1:4000/graphql', fetch }),
  cache: new InMemoryCache()
});

async function cleanupCiscoProduct() {
  console.log('🔍 Checking for Cisco Secure Access product...\n');
  
  // Get all products
  const productsResult = await client.query({
    query: gql`
      query Products {
        products(first: 100) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `,
    fetchPolicy: 'network-only'
  });
  
  const products = productsResult.data.products.edges.map(e => e.node);
  const ciscoProduct = products.find(p => p.name === 'Cisco Secure Access');
  
  if (ciscoProduct) {
    console.log(`Found: ${ciscoProduct.name} (${ciscoProduct.id})`);
    console.log('Deleting it to clean up for fresh import...\n');
    
    try {
      await client.mutate({
        mutation: gql`
          mutation DeleteProduct($id: ID!) {
            deleteProduct(id: $id)
          }
        `,
        variables: { id: ciscoProduct.id }
      });
      
      console.log('✅ Product deleted successfully!');
      console.log('The database is now clean for a fresh import.\n');
    } catch (error) {
      console.error('❌ Error deleting product:', error.message);
    }
  } else {
    console.log('✅ No Cisco Secure Access product found.');
    console.log('Database is clean - ready for import.\n');
  }
  
  // Verify final state
  const verifyResult = await client.query({
    query: gql`
      query Products {
        products(first: 100) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `,
    fetchPolicy: 'network-only'
  });
  
  console.log('Current products in database:');
  verifyResult.data.products.edges.forEach(e => {
    console.log(`  - ${e.node.name} (${e.node.id})`);
  });
}

cleanupCiscoProduct().catch(console.error);
