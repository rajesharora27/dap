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

async function testCleanCSVWorkflow() {
    console.log('🧪 Testing Clean 3-Product CSV Workflow\n');

    try {
        // Step 1: Read our clean CSV file
        const csvContent = fs.readFileSync('/home/rajarora/dap/clean-3-products.csv', 'utf8');
        console.log('📄 Loaded clean CSV file:');
        console.log(csvContent);
        console.log();

        // Step 2: Import the clean CSV
        console.log('📥 Step 1: Importing clean CSV...');

        const importResult = await graphqlRequest(`
      mutation($csv: String!) {
        importProductsCsv(csv: $csv) {
          success
          productsCreated
          productsUpdated
          errors
          warnings
        }
      }
    `, { csv: csvContent });

        console.log('✅ Import Result:', importResult.importProductsCsv);

        if (!importResult.importProductsCsv.success) {
            console.log('❌ Initial import failed!');
            console.log('Errors:', importResult.importProductsCsv.errors);
            return;
        }

        // Step 3: Test modification - update test-prod-2 by changing it
        console.log('\n✏️  Step 2: Testing product modification...');

        const modifiedCsv = `id,name,description,customAttrs,licenseIds
test-prod-2,MODIFIED Mobile Banking App,MODIFIED secure mobile banking with enhanced biometric auth and new features,"{""security"":""critical"",""platform"":""mobile"",""compliance"":[""PCI"",""SOX""],""version"":""3.0"",""updated"":true}",[]`;

        console.log('📝 Modification CSV:');
        console.log(modifiedCsv);
        console.log();

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
    `, { csv: modifiedCsv });

        console.log('✅ Update Result:', updateResult.importProductsCsv);

        // Step 4: Export to verify changes
        console.log('\n📤 Step 3: Exporting to verify changes...');

        const exportResult = await graphqlRequest(`mutation { exportProductsCsv }`);
        const exportCsv = exportResult.exportProductsCsv;

        // Find our test products in the export
        const lines = exportCsv.split('\n');
        const testProducts = lines.filter(line => line.includes('test-prod-'));

        console.log(`📊 Found ${testProducts.length} test products in export:`);
        testProducts.forEach((line, i) => {
            const parts = line.split(',');
            const name = parts[1] || 'Unknown';
            const hasModified = line.includes('MODIFIED');
            console.log(`   ${i + 1}. ${parts[0]} - ${name} ${hasModified ? '(MODIFIED ✅)' : ''}`);

            if (parts[0] === 'test-prod-2') {
                console.log(`      Full line: ${line.substring(0, 120)}...`);
            }
        });

        // Step 5: Test creating a new product by changing ID
        console.log('\n➕ Step 4: Testing new product creation...');

        const newProductCsv = `id,name,description,customAttrs,licenseIds
test-prod-4,Brand New Product,This is a completely new product created via import,"{""new"":true,""category"":""testing"",""priority"":""medium""}",[]`;

        const newResult = await graphqlRequest(`
      mutation($csv: String!) {
        importProductsCsv(csv: $csv) {
          success
          productsCreated
          productsUpdated
          errors
          warnings
        }
      }
    `, { csv: newProductCsv });

        console.log('✅ New Product Result:', newResult.importProductsCsv);

        // Summary
        console.log('\n📋 WORKFLOW TEST SUMMARY');
        console.log('==========================');
        console.log(`Initial Import - Success: ${importResult.importProductsCsv.success}`);
        console.log(`  Created: ${importResult.importProductsCsv.productsCreated}`);
        console.log(`  Updated: ${importResult.importProductsCsv.productsUpdated}`);

        console.log(`Product Update - Success: ${updateResult.importProductsCsv.success}`);
        console.log(`  Created: ${updateResult.importProductsCsv.productsCreated}`);
        console.log(`  Updated: ${updateResult.importProductsCsv.productsUpdated}`);

        console.log(`New Product - Success: ${newResult.importProductsCsv.success}`);
        console.log(`  Created: ${newResult.importProductsCsv.productsCreated}`);
        console.log(`  Updated: ${newResult.importProductsCsv.productsUpdated}`);

        const allSuccess = importResult.importProductsCsv.success &&
            updateResult.importProductsCsv.success &&
            newResult.importProductsCsv.success;

        if (allSuccess) {
            console.log('\n🎉 ALL TESTS PASSED! Import/Export workflow is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed - please review the results above.');
        }

        // Save final export
        fs.writeFileSync('/home/rajarora/dap/final-test-export.csv', exportCsv);
        console.log('\n💾 Final export saved to final-test-export.csv');

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

testCleanCSVWorkflow();