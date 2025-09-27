const fs = require('fs');

async function graphqlRequest(query, variables = {}) {
    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({ query, variables })
    });

    const result = await response.json();
    if (result.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(result.errors, null, 2)}`);
    }

    return result.data;
}

async function testUpdateIssue() {
    console.log('🔍 Debugging Product Update Issue\n');

    try {
        // Step 1: Check current state of clean-prod-2
        console.log('📋 Step 1: Check current state of clean-prod-2');

        const currentExport = await graphqlRequest(`mutation { exportProductsCsv }`);
        const lines = currentExport.exportProductsCsv.split('\n');
        const cleanProd2Line = lines.find(line => line.includes('clean-prod-2'));

        if (cleanProd2Line) {
            console.log('Current clean-prod-2:');
            console.log(cleanProd2Line);
        } else {
            console.log('❌ clean-prod-2 not found in export');
        }

        // Step 2: Try to update clean-prod-2 and immediately verify
        console.log('\n📋 Step 2: Update clean-prod-2 and verify immediately');

        const updateCsv = `id,name,description,customAttrs,licenseIds
clean-prod-2,VERIFIED UPDATED Mobile Banking,VERIFIED updated secure mobile banking with verification,"{""VERIFIED"":true,""security_level"":""critical"",""platform"":""mobile"",""version"":""3.0"",""updated_timestamp"":""${new Date().toISOString()}""}",[]`;

        console.log('Update CSV:');
        console.log(updateCsv);

        const updateResult = await graphqlRequest(`
      mutation($csv: String!) {
        importProductsCsv(csv: $csv) {
          success
          productsCreated
          productsUpdated
          errors
          warnings
        }
      }
    `, { csv: updateCsv });

        console.log('\nUpdate result:', updateResult.importProductsCsv);

        // Step 3: Wait a moment then check export again
        console.log('\n📋 Step 3: Immediate verification export');

        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms

        const verifyExport = await graphqlRequest(`mutation { exportProductsCsv }`);
        const verifyLines = verifyExport.exportProductsCsv.split('\n');
        const updatedLine = verifyLines.find(line => line.includes('clean-prod-2'));

        if (updatedLine) {
            console.log('\nUpdated clean-prod-2:');
            console.log(updatedLine);

            if (updatedLine.includes('VERIFIED')) {
                console.log('✅ Update successful - VERIFIED found in export');
            } else {
                console.log('❌ Update may have failed - VERIFIED not found in export');
            }
        } else {
            console.log('❌ clean-prod-2 not found in verification export');
        }

        // Step 4: Check via direct product query
        console.log('\n📋 Step 4: Direct product query verification');

        const productQuery = await graphqlRequest(`
      query {
        products {
          edges {
            node {
              id
              name
              description
              customAttrs
            }
          }
        }
      }
    `);

        const cleanProd2 = productQuery.products.edges.find(edge => edge.node.id === 'clean-prod-2');

        if (cleanProd2) {
            console.log('\nDirect query result for clean-prod-2:');
            console.log('Name:', cleanProd2.node.name);
            console.log('Description:', cleanProd2.node.description);
            console.log('CustomAttrs:', JSON.stringify(cleanProd2.node.customAttrs));

            if (cleanProd2.node.name.includes('VERIFIED')) {
                console.log('✅ Direct query confirms update was successful');
            } else {
                console.log('❌ Direct query shows update was NOT successful');
            }
        } else {
            console.log('❌ clean-prod-2 not found in direct query');
        }

        // Save the verification export
        fs.writeFileSync('/home/rajarora/dap/update-verification-export.csv', verifyExport.exportProductsCsv);
        console.log('\n💾 Verification export saved to update-verification-export.csv');

    } catch (error) {
        console.error('💥 Debug test failed:', error.message);
    }
}

testUpdateIssue();