const { ApolloClient, InMemoryCache, HttpLink, gql } = require('@apollo/client/core');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://127.0.0.1:4000/graphql', fetch }),
  cache: new InMemoryCache()
});

async function testDelete() {
  console.log('Step 1: Check current products\n');
  
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
  const cisco = products.find(p => p.name === 'Cisco Secure Access');
  
  if (!cisco) {
    console.log('No Cisco product found. Creating one for testing...\n');
    
    const createResult = await client.mutate({
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
    }).catch(e => {
      console.log('Cannot create - unique constraint error');
      console.log('This means the product EXISTS in DB but not in query results!');
      console.log('It\'s probably soft-deleted.\n');
      return null;
    });
    
    if (!createResult) {
      console.log('❌ Cannot test deletion - product is in limbo state');
      return;
    }
  }
  
  // Try to delete
  console.log('Step 2: Attempting to delete Cisco product...\n');
  
  const ciscoToDelete = cisco || { id: 'prod-fintech-suite', name: 'Cisco Secure Access' };
  
  try {
    const deleteResult = await client.mutate({
      mutation: gql`
        mutation DeleteProduct($id: ID!) {
          deleteProduct(id: $id)
        }
      `,
      variables: { id: ciscoToDelete.id }
    });
    
    console.log('Delete mutation returned:', deleteResult.data.deleteProduct);
    
    if (deleteResult.data.deleteProduct === true) {
      console.log('✅ Mutation returned true\n');
    }
  } catch (error) {
    console.log('❌ Delete failed with error:', error.message);
    return;
  }
  
  // Verify it's gone
  console.log('Step 3: Verify product is deleted...\n');
  
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
  
  const remainingProducts = verifyResult.data.products.edges.map(e => e.node);
  const stillThere = remainingProducts.find(p => p.name === 'Cisco Secure Access');
  
  if (stillThere) {
    console.log('❌ Product still appears in query!');
  } else {
    console.log('✅ Product no longer in query results');
  }
  
  // Try to create it again
  console.log('\nStep 4: Try to create it again to see if it really deleted...\n');
  
  try {
    const recreateResult = await client.mutate({
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
          description: 'Testing recreation',
          customAttrs: {}
        }
      }
    });
    
    console.log('✅ Successfully created!');
    console.log('ID:', recreateResult.data.createProduct.id);
    console.log('\n🎉 Hard delete WORKED - can create fresh product!');
    
  } catch (error) {
    console.log('❌ Still getting error:', error.message);
    if (error.message.includes('Unique constraint')) {
      console.log('\n⚠️  PROBLEM: Product still exists in database!');
      console.log('The hard delete is NOT working properly.');
    }
  }
}

testDelete().catch(console.error);
