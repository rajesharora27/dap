#!/usr/bin/env node

/**
 * Test script to verify what's happening with the import
 */

const { ApolloClient, InMemoryCache, HttpLink, gql } = require('@apollo/client/core');
const fetch = require('cross-fetch');

const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://127.0.0.1:4000/graphql', fetch }),
  cache: new InMemoryCache()
});

async function testImport() {
  console.log('🔍 Testing Import Logic\n');
  
  // 1. Get current products
  console.log('1. Fetching existing products...');
  const productsResult = await client.query({
    query: gql`
      query Products {
        products {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `
  });
  
  const products = productsResult.data.products.edges.map(e => e.node);
  console.log(`   Found ${products.length} products:`);
  products.forEach(p => console.log(`   - ${p.name} (${p.id})`));
  
  // 2. Check if "Cisco Secure Access" exists
  const ciscoProduct = products.find(p => p.name.toLowerCase().trim() === 'cisco secure access');
  console.log(`\n2. Checking for "Cisco Secure Access"...`);
  if (ciscoProduct) {
    console.log(`   ✅ EXISTS: ${ciscoProduct.name} (${ciscoProduct.id})`);
    console.log(`   📌 The resolver should return: { status: 'use-existing', product: {...} }`);
  } else {
    console.log(`   ❌ NOT FOUND`);
    console.log(`   📌 The resolver should return: { status: 'create-new', name: 'Cisco Secure Access' }`);
  }
  
  // 3. Try to create the product
  console.log(`\n3. Attempting to create "Cisco Secure Access"...`);
  try {
    const createResult = await client.mutate({
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
          description: 'Secure Access to internet and private resources based on your identity',
          customAttrs: {}
        }
      }
    });
    
    console.log(`   ✅ SUCCESS: Created product ${createResult.data.createProduct.id}`);
    console.log(`   Product: ${JSON.stringify(createResult.data.createProduct, null, 2)}`);
  } catch (error) {
    if (error.message.includes('Unique constraint')) {
      console.log(`   ⚠️  UNIQUE CONSTRAINT ERROR`);
      console.log(`   This means the product already exists, but wasn't found in step 1!`);
      console.log(`   Possible causes:`);
      console.log(`   - Product exists but is filtered out in the query`);
      console.log(`   - Caching issue in the frontend`);
      console.log(`   - Race condition (import triggered twice)`);
    } else {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }
  
  // 4. Try again to see current state
  console.log(`\n4. Fetching products again...`);
  const productsResult2 = await client.query({
    query: gql`
      query Products {
        products {
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
  
  const products2 = productsResult2.data.products.edges.map(e => e.node);
  console.log(`   Found ${products2.length} products:`);
  products2.forEach(p => console.log(`   - ${p.name} (${p.id})`));
  
  const ciscoProduct2 = products2.find(p => p.name.toLowerCase().trim() === 'cisco secure access');
  if (ciscoProduct2) {
    console.log(`\n   ✅ "Cisco Secure Access" NOW EXISTS: ${ciscoProduct2.id}`);
  } else {
    console.log(`\n   ❌ "Cisco Secure Access" STILL NOT FOUND`);
  }
}

testImport().catch(console.error);
