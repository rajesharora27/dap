const fetch = require('node-fetch');

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

async function testSimpleImportExport() {
    console.log('🧪 Testing Simple Product Import/Export with 3 Products\n');

    try {
        // Step 1: Create a clean test CSV with just 3 products
        console.log('📝 Step 1: Creating test CSV with 3 products...');

        const testCsv = `id,name,description,customAttrs,licenseIds
test-prod-1,Test E-Commerce Platform,Modern e-commerce platform with payment integration,"{""priority"": ""high"", ""category"": ""ecommerce"", ""status"": ""active""}","[]"
test-prod-2,Test Mobile Banking,Secure mobile banking with biometric auth,"{""security"": ""high"", ""platform"": ""mobile"", ""compliance"": [""PCI""]}","[]"
test-prod-3,Test CRM System,Customer relationship management platform,"{""type"": ""crm"", ""users"": 100, ""features"": [""contacts"", ""sales""]}","[]"`;

        console.log('📊 Test CSV created with 3 products');
        console.log('🔍 CSV Preview:');
        console.log(testCsv.split('\n').slice(0, 2).join('\n'));
        console.log('...');

        // Step 2: Import the test products
        console.log('\n📥 Step 2: Importing test products...');

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
    `, { csv: testCsv });

        console.log(`✅ Import Result:`, importResult.importProductsCsv);

        if (!importResult.importProductsCsv.success) {
            console.log('❌ Import failed!');
            return;
        }

        // Step 3: Export products to verify
        console.log('\n📤 Step 3: Exporting products...');

        const exportResult = await graphqlRequest(`mutation { exportProductsCsv }`);
        const exportCsv = exportResult.exportProductsCsv;

        // Save the export
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(path.join(__dirname, 'test-export.csv'), exportCsv);
        console.log('💾 Export saved to test-export.csv');

        // Check if our test products are in the export
        const lines = exportCsv.split('\n');
        const testProducts = lines.filter(line => line.includes('test-prod-'));

        console.log(`📊 Found ${testProducts.length} test products in export:`);
        testProducts.forEach((line, i) => {
            const parts = line.split(',');
            console.log(`   ${i + 1}. ${parts[0]} - ${parts[1]}`);
        });

        // Step 4: Test updating one of the products
        console.log('\n✏️  Step 4: Testing product update...');

        const updateCsv = `id,name,description,customAttrs,licenseIds
test-prod-1,UPDATED E-Commerce Platform,UPDATED modern e-commerce platform with new features,"{""priority"": ""critical"", ""category"": ""ecommerce"", ""status"": ""updated"", ""version"": ""2.0""}","[]"`;

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

        console.log(`✅ Update Result:`, updateResult.importProductsCsv);

        // Step 5: Export again to verify update
        console.log('\n🔍 Step 5: Verifying update...');

        const finalExportResult = await graphqlRequest(`mutation { exportProductsCsv }`);
        const finalExportCsv = finalExportResult.exportProductsCsv;

        // Check if the update worked
        const updatedLine = finalExportCsv.split('\n').find(line => line.includes('test-prod-1'));
        if (updatedLine) {
            console.log('📝 Updated product line:');
            console.log(`   ${updatedLine.substring(0, 150)}...`);

            if (updatedLine.includes('UPDATED') && updatedLine.includes('critical')) {
                console.log('✅ Product update successful!');
            } else {
                console.log('❌ Product update may have failed - changes not detected');
            }
        }

        console.log('\n🎉 Simple import/export test completed!');
        console.log('📁 Files created:');
        console.log('   - test-export.csv (full export)');
        console.log('\n✨ Test Summary:');
        console.log(`   - Created: ${importResult.importProductsCsv.productsCreated} products`);
        console.log(`   - Updated: ${updateResult.importProductsCsv.productsUpdated} products`);
        console.log(`   - Import success: ${importResult.importProductsCsv.success}`);
        console.log(`   - Update success: ${updateResult.importProductsCsv.success}`);

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

testSimpleImportExport();