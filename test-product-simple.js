#!/usr/bin/env node

/**
 * Simplified Product Import/Export Test Suite
 * 
 * Tests product import/export using the actual CSV format that works
 */

const fs = require('fs');

// Test configuration
const BACKEND_URL = 'http://localhost:4000/graphql';
const AUTH_TOKEN = 'admin';

/**
 * GraphQL request helper
 */
async function graphqlRequest(query, variables = {}) {
    const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': AUTH_TOKEN
        },
        body: JSON.stringify({
            query,
            variables
        })
    });

    const result = await response.json();
    if (result.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(result.errors, null, 2)}`);
    }

    return result.data;
}

/**
 * Test results tracking
 */
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

function logTest(testName, passed, message = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
    } else {
        testResults.failed++;
        testResults.errors.push(`${testName}: ${message}`);
        console.log(`❌ ${testName}: ${message}`);
    }
}

/**
 * Test 1: Import Clean Sample CSV
 */
async function testImportCleanSample() {
    try {
        const sampleCsv = fs.readFileSync('/home/rajarora/dap/product-import-sample.csv', 'utf8');

        const data = await graphqlRequest(`
      mutation($csv: String!) {
        importProductsCsv(csv: $csv) {
          success
          productsCreated
          productsUpdated
          errors
          warnings
        }
      }
    `, { csv: sampleCsv });

        const result = data.importProductsCsv;

        logTest('Import Clean Sample CSV',
            result.success && result.productsCreated >= 3,
            `Created: ${result.productsCreated}, Errors: ${result.errors.join(', ')}`
        );

        console.log(`📊 Sample Import Results: ${result.productsCreated} created, ${result.productsUpdated} updated`);
        if (result.warnings.length > 0) {
            console.log(`⚠️  Warnings: ${result.warnings.join(', ')}`);
        }

    } catch (error) {
        logTest('Import Clean Sample CSV', false, error.message);
    }
}

/**
 * Test 2: Export Products
 */
async function testExportProducts() {
    try {
        const data = await graphqlRequest(`
      mutation {
        exportProductsCsv
      }
    `);

        const csvContent = data.exportProductsCsv;

        logTest('Export Products CSV',
            csvContent.includes('id,name,description,customAttrs,licenseIds'),
            'Export should contain all expected headers'
        );

        // Save exported data for inspection
        fs.writeFileSync('products-exported-simple.csv', csvContent);
        console.log('💾 Exported CSV saved to products-exported-simple.csv');

        // Check first few lines
        const lines = csvContent.split('\n');
        console.log('📄 First 3 lines of export:');
        lines.slice(0, 3).forEach((line, i) => console.log(`${i + 1}: ${line}`));

    } catch (error) {
        logTest('Export Products CSV', false, error.message);
    }
}

/**
 * Test 3: Import Simple Product Using Correct Format
 */
async function testSimpleImport() {
    try {
        // Create a test CSV using the same format as our working sample
        const testCsv = `id,name,description,customAttrs,licenseIds
,Simple Test Product,"A basic test product for validation","{""test"": true, ""priority"": ""medium""}","[]"
prod-test-123,"Update Test Product","This should update if exists or create new","{""updated"": true, ""timestamp"": ""2024-01-15""}","[]"`;

        const data = await graphqlRequest(`
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

        const result = data.importProductsCsv;

        logTest('Simple Product Import',
            result.success && (result.productsCreated + result.productsUpdated) >= 2,
            `Created: ${result.productsCreated}, Updated: ${result.productsUpdated}, Errors: ${result.errors.join(', ')}`
        );

    } catch (error) {
        logTest('Simple Product Import', false, error.message);
    }
}

/**
 * Test 4: Download Sample CSV
 */
async function testDownloadSample() {
    try {
        const data = await graphqlRequest(`
      mutation {
        downloadProductSampleCsv
      }
    `);

        const sampleCsv = data.downloadProductSampleCsv;

        logTest('Download Sample CSV',
            sampleCsv.includes('id,name,description,customAttrs,licenseIds'),
            'Sample should contain expected headers'
        );

        // Save the downloaded sample
        fs.writeFileSync('product-sample-from-server.csv', sampleCsv);
        console.log('💾 Downloaded sample saved to product-sample-from-server.csv');

    } catch (error) {
        logTest('Download Sample CSV', false, error.message);
    }
}

/**
 * Main test execution
 */
async function runTests() {
    console.log('🚀 Starting Simplified Product Import/Export Tests\n');

    const testStartTime = Date.now();

    try {
        await testDownloadSample();
        await testImportCleanSample();
        await testExportProducts();
        await testSimpleImport();

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }

    const testEndTime = Date.now();
    const duration = ((testEndTime - testStartTime) / 1000).toFixed(2);

    // Print summary
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Duration: ${duration}s`);

    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);

    if (testResults.failed === 0) {
        console.log('🎉 All tests passed! Product import/export functionality is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please review the errors above.');
    }
}

// Handle script execution
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests };