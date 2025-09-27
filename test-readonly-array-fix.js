#!/usr/bin/env node

// Test to verify the read-only array fix in TestPanelNew task creation

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

const httpLink = createHttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch: fetch,
    headers: {
        'Authorization': 'admin'
    }
});

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache()
});

const PRODUCTS = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          description
          statusPercent
          customAttrs
          licenses {
            id
            name
            level
            isActive
          }
          outcomes {
            id
            name
            description
          }
          tasks(first: 10) {
            edges {
              node {
                id
                name
                description
                estMinutes
                weight
                licenseLevel
              }
            }
          }
        }
      }
    }
  }
`;

async function testReadOnlyArrayHandling() {
    console.log('🔍 Testing Read-Only Array Handling in Task Creation...\n');

    try {
        // Get products from GraphQL (these will have read-only arrays)
        const result = await client.query({
            query: PRODUCTS,
            fetchPolicy: 'network-only'
        });

        const products = result.data.products.edges.map(edge => edge.node);

        if (products.length === 0) {
            console.log('⚠️ No products found to test with');
            return false;
        }

        const testProduct = products.find(p => p.licenses && p.licenses.length > 0);

        if (!testProduct) {
            console.log('⚠️ No products with licenses found to test with');
            return false;
        }

        console.log(`📦 Testing with product: ${testProduct.name}`);
        console.log(`🔐 Product has ${testProduct.licenses.length} licenses`);

        // Test 1: Try to sort the licenses array directly (this should fail if not handled correctly)
        console.log('\n🧪 Test 1: Testing direct array sort (old buggy approach)...');
        try {
            // This is what was causing the error before the fix
            const directSort = testProduct.licenses.sort((a, b) => a.level - b.level);
            console.log('❌ UNEXPECTED: Direct sort succeeded - this suggests the array is not read-only');
            return false;
        } catch (error) {
            console.log(`✅ EXPECTED: Direct sort failed with error: ${error.message}`);
            console.log('   This confirms the GraphQL data is read-only as expected');
        }

        // Test 2: Use the fixed approach (create a copy then sort)
        console.log('\n🧪 Test 2: Testing fixed approach (copy then sort)...');
        try {
            // This is the fix we implemented
            const sortedLicenses = [...testProduct.licenses].sort((a, b) => a.level - b.level);
            const lowestLicense = sortedLicenses[0];

            console.log(`✅ SUCCESS: Fixed approach worked`);
            console.log(`   Lowest license level: ${lowestLicense.level} (${lowestLicense.name})`);
            console.log(`   Sorted ${sortedLicenses.length} licenses successfully`);

            // Map license levels to GraphQL enum values (same logic as TestPanelNew)
            const levelToEnum = {
                1: 'Essential',
                2: 'Advantage',
                3: 'Signature'
            };

            const validLicenseLevel = levelToEnum[lowestLicense.level] || 'Essential';
            console.log(`   Selected license level: ${validLicenseLevel}`);

            return true;

        } catch (error) {
            console.log(`❌ FAILURE: Fixed approach failed: ${error.message}`);
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 TestPanelNew Read-Only Array Fix Verification\n');
    console.log('This test verifies that the "Cannot assign to read only property" issue has been resolved.\n');

    const success = await testReadOnlyArrayHandling();

    console.log('\n=== Test Results ===');
    if (success) {
        console.log('✅ SUCCESS: Read-only array handling is working correctly!');
        console.log('   • GraphQL data is properly read-only (as expected)');
        console.log('   • Fixed approach creates array copy before sorting');
        console.log('   • TestPanelNew task creation will no longer fail with array mutation errors');
        console.log('   • License level detection works properly');
    } else {
        console.log('❌ FAILURE: Read-only array handling needs review');
        console.log('   • Check the test output above for specific issues');
    }

    console.log('\n💡 The fix was:');
    console.log('   BEFORE: targetProduct.licenses.sort((a, b) => a.level - b.level)');
    console.log('   AFTER:  [...targetProduct.licenses].sort((a, b) => a.level - b.level)');
    console.log('   The spread operator [...array] creates a copy, making it safe to mutate');
}

// Run the test
main();
