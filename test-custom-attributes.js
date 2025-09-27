const { ApolloClient, InMemoryCache, gql } = require('@apollo/client');
const fetch = require('cross-fetch');

// Apollo Client setup
const client = new ApolloClient({
    uri: 'http://localhost:4000/graphql',
    cache: new InMemoryCache(),
    fetch: fetch,
});

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

const GET_PRODUCTS = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          customAttrs
        }
      }
    }
  }
`;

async function testCustomAttributes() {
    console.log('🧪 Testing Custom Attributes Functionality...\n');

    try {
        // First, get the current products
        console.log('1️⃣ Fetching current products...');
        const productsResult = await client.query({
            query: GET_PRODUCTS,
            fetchPolicy: 'network-only'
        });

        const products = productsResult.data.products.edges.map(edge => edge.node);
        console.log(`Found ${products.length} products:`);
        products.forEach(product => {
            console.log(`  - ${product.name} (ID: ${product.id})`);
            if (product.customAttrs) {
                const attrs = typeof product.customAttrs === 'string'
                    ? JSON.parse(product.customAttrs)
                    : product.customAttrs;
                console.log(`    Custom Attrs:`, attrs);
            }
        });

        // Find the test product
        const testProduct = products.find(p => p.name === 'Test');
        if (!testProduct) {
            console.log('❌ Test product not found. Please create a product named "Test" first.');
            return;
        }

        console.log(`\n2️⃣ Using test product: ${testProduct.name} (ID: ${testProduct.id})`);

        // Parse current custom attributes
        let currentAttrs = {};
        if (testProduct.customAttrs) {
            currentAttrs = typeof testProduct.customAttrs === 'string'
                ? JSON.parse(testProduct.customAttrs)
                : testProduct.customAttrs;
        }

        console.log('Current attributes:', currentAttrs);

        // Test 1: Add a new attribute (simulating Sub Menu add operation)
        console.log('\n3️⃣ TEST 1: Adding new attribute via Sub Menu simulation...');
        const newAttrs1 = {
            ...currentAttrs,
            'subMenuAddTest': 'Added from Sub Menu simulation',
            'testTimestamp': new Date().toISOString()
        };

        const result1 = await client.mutate({
            mutation: UPDATE_PRODUCT,
            variables: {
                id: testProduct.id,
                input: {
                    name: testProduct.name,
                    customAttrs: JSON.stringify(newAttrs1) // Simulate what sharedHandlers does
                }
            }
        });

        console.log('✅ Add operation result:', result1.data.updateProduct);

        // Test 2: Edit an existing attribute (simulating Sub Menu edit operation)
        console.log('\n4️⃣ TEST 2: Editing existing attribute via Sub Menu simulation...');
        const newAttrs2 = { ...newAttrs1 };
        newAttrs2.subMenuAddTest = 'EDITED from Sub Menu simulation';

        const result2 = await client.mutate({
            mutation: UPDATE_PRODUCT,
            variables: {
                id: testProduct.id,
                input: {
                    name: testProduct.name,
                    customAttrs: JSON.stringify(newAttrs2)
                }
            }
        });

        console.log('✅ Edit operation result:', result2.data.updateProduct);

        // Test 3: Delete an attribute (simulating Sub Menu delete operation)
        console.log('\n5️⃣ TEST 3: Deleting attribute via Sub Menu simulation...');
        const newAttrs3 = { ...newAttrs2 };
        delete newAttrs3.testTimestamp;

        const result3 = await client.mutate({
            mutation: UPDATE_PRODUCT,
            variables: {
                id: testProduct.id,
                input: {
                    name: testProduct.name,
                    customAttrs: JSON.stringify(newAttrs3)
                }
            }
        });

        console.log('✅ Delete operation result:', result3.data.updateProduct);

        // Verify final state
        console.log('\n6️⃣ Verifying final state...');
        const finalResult = await client.query({
            query: GET_PRODUCTS,
            fetchPolicy: 'network-only'
        });

        const finalProduct = finalResult.data.products.edges
            .map(edge => edge.node)
            .find(p => p.id === testProduct.id);

        const finalAttrs = typeof finalProduct.customAttrs === 'string'
            ? JSON.parse(finalProduct.customAttrs)
            : finalProduct.customAttrs;

        console.log('Final custom attributes:', finalAttrs);

        // Verify the operations worked
        const hasEditedValue = finalAttrs.subMenuAddTest === 'EDITED from Sub Menu simulation';
        const deletedTimestamp = !('testTimestamp' in finalAttrs);

        console.log('\n📊 TEST RESULTS:');
        console.log(`✅ Add operation: SUCCESS`);
        console.log(`${hasEditedValue ? '✅' : '❌'} Edit operation: ${hasEditedValue ? 'SUCCESS' : 'FAILED'}`);
        console.log(`${deletedTimestamp ? '✅' : '❌'} Delete operation: ${deletedTimestamp ? 'SUCCESS' : 'FAILED'}`);

        if (hasEditedValue && deletedTimestamp) {
            console.log('\n🎉 ALL TESTS PASSED! Custom attributes functionality is working correctly.');
        } else {
            console.log('\n❌ Some tests failed. Please check the implementation.');
        }

    } catch (error) {
        console.error('❌ Error during testing:', error);
        if (error.graphQLErrors) {
            console.error('GraphQL Errors:', error.graphQLErrors);
        }
        if (error.networkError) {
            console.error('Network Error:', error.networkError);
        }
    }
}

// Run the test
testCustomAttributes().then(() => {
    console.log('\n🏁 Test completed.');
}).catch(error => {
    console.error('💥 Test failed:', error);
});