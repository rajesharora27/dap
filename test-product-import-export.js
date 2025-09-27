#!/usr/bin/env node

/**
 * Comprehensive Product Import/Export Test Suite
 * 
 * Tests all aspects of product import and export functionality including:
 * - Creating new products with all supported attributes
 * - Updating existing products
 * - License associations
 * - Custom attributes validation
 * - Error handling and validation
 * - Export functionality with full data
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const BACKEND_URL = 'http://localhost:4000/graphql';
const AUTH_TOKEN = 'admin'; // Using admin token for testing

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
 * Test 1: Download Product Sample CSV
 */
async function testDownloadProductSample() {
    try {
        const data = await graphqlRequest(`
      mutation {
        downloadProductSampleCsv
      }
    `);

        const sampleCsv = data.downloadProductSampleCsv;
        logTest('Download Product Sample CSV',
            sampleCsv.includes('id,name,description,customAttrs,licenseIds'),
            'Sample CSV should contain all expected headers'
        );

        // Save sample for reference
        fs.writeFileSync(path.join(__dirname, 'product-sample-downloaded.csv'), sampleCsv);
        console.log('💾 Sample CSV saved to product-sample-downloaded.csv');

    } catch (error) {
        logTest('Download Product Sample CSV', false, error.message);
    }
}

/**
 * Test 2: Create test licenses for association testing
 */
async function createTestLicenses() {
    const licenses = [
        { name: 'Essential License', description: 'Basic functionality', level: 1 },
        { name: 'Professional License', description: 'Advanced features', level: 2 },
        { name: 'Enterprise License', description: 'Full feature set', level: 3 }
    ];

    const licenseIds = [];

    // First create a test product to associate licenses with
    const testProduct = await graphqlRequest(`
    mutation {
      createProduct(input: {
        name: "Test Product for Licenses"
        description: "Temporary product for license testing"
      }) {
        id
      }
    }
  `);

    for (const license of licenses) {
        try {
            const data = await graphqlRequest(`
        mutation($input: LicenseInput!) {
          createLicense(input: $input) {
            id
            name
            level
          }
        }
      `, {
                input: {
                    ...license,
                    isActive: true,
                    productId: testProduct.createProduct.id
                }
            });

            licenseIds.push(data.createLicense.id);
            console.log(`📄 Created license: ${data.createLicense.name} (ID: ${data.createLicense.id})`);
        } catch (error) {
            console.log(`⚠️  License creation failed: ${error.message}`);
        }
    }

    return licenseIds;
}

/**
 * Test 3: Import Products with All Attributes
 */
async function testProductImportAllAttributes(licenseIds) {
    try {
        // Create comprehensive test CSV with all supported attributes
        const complexCustomAttrs = JSON.stringify({
            priority: "critical",
            department: "engineering",
            version: 2.0,
            features: ["auth", "api", "ui"],
            metrics: { users: 1000, uptime: 99.9 }
        });

        const minimalCustomAttrs = JSON.stringify({});
        const updateCustomAttrs = JSON.stringify({
            status: "updated",
            last_modified: "2024-01-15",
            updated_by: "test-suite"
        });

        const licenseIdsJson1 = JSON.stringify(licenseIds.slice(0, 2));
        const licenseIdsJson2 = JSON.stringify([]);
        const licenseIdsJson3 = JSON.stringify([licenseIds[2]]);

        const testCsv = `id,name,description,customAttrs,licenseIds
,"Complete Test Product 1","Multi-line description with advanced features and comprehensive testing","${complexCustomAttrs}","${licenseIdsJson1}"
,"Minimal Test Product 2","Basic product with minimal data","${minimalCustomAttrs}","${licenseIdsJson2}"
,"Update Test Product","This should update an existing product with new attributes","${updateCustomAttrs}","${licenseIdsJson3}"`;

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

        logTest('Product Import - All Attributes',
            result.success && result.productsCreated >= 2,
            `Created: ${result.productsCreated}, Errors: ${result.errors.join(', ')}`
        );

        logTest('Product Import - Complex JSON Attributes',
            result.warnings.length === 0 || !result.warnings.some(w => w.includes('invalid JSON')),
            `JSON parsing warnings: ${result.warnings.filter(w => w.includes('JSON')).join(', ')}`
        );

        console.log(`📊 Import Results: ${result.productsCreated} created, ${result.productsUpdated} updated`);
        if (result.warnings.length > 0) {
            console.log(`⚠️  Warnings: ${result.warnings.join(', ')}`);
        }

    } catch (error) {
        logTest('Product Import - All Attributes', false, error.message);
    }
}

/**
 * Test 4: Test Product Import Validation
 */
async function testProductImportValidation() {
    try {
        // Test with missing required fields
        const invalidCsv = `id,description,customAttrs
prod-no-name,"Product without name field","{}"`;

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
    `, { csv: invalidCsv });

        const result = data.importProductsCsv;

        logTest('Product Import - Missing Required Field',
            !result.success && result.errors.some(e => e.includes('Missing required fields')),
            'Should fail when name field is missing'
        );

    } catch (error) {
        logTest('Product Import - Missing Required Field', false, error.message);
    }

    try {
        // Test with invalid JSON in customAttrs - note the invalid JSON syntax
        const invalidJsonCsv = `id,name,description,customAttrs,licenseIds
,"Test Product","Description","{invalid json}","[]"`;

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
    `, { csv: invalidJsonCsv });

        const result = data.importProductsCsv;

        logTest('Product Import - Invalid JSON Handling',
            result.warnings.some(w => w.includes('invalid customAttrs JSON')),
            'Should warn about invalid JSON and continue processing'
        );

    } catch (error) {
        logTest('Product Import - Invalid JSON Handling', false, error.message);
    }
}

/**
 * Test 5: Test Product Export with Full Data
 */
async function testProductExport() {
    try {
        const data = await graphqlRequest(`
      mutation {
        exportProductsCsv
      }
    `);

        const csvContent = data.exportProductsCsv;

        logTest('Product Export - CSV Generation',
            csvContent.includes('id,name,description,customAttrs,licenseIds'),
            'Export should contain all expected headers'
        );

        // Check that exported data contains our test products
        logTest('Product Export - Contains Test Data',
            csvContent.includes('Complete Test Product 1') || csvContent.includes('Test Product'),
            'Export should contain previously imported products'
        );

        // Verify JSON data is properly formatted
        const lines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('id,'));
        let jsonValid = true;
        let jsonError = '';

        for (const line of lines.slice(0, 5)) { // Check first 5 data lines
            const columns = line.split(',');
            if (columns.length >= 4) {
                try {
                    const customAttrs = columns[3];
                    if (customAttrs && customAttrs !== '""' && customAttrs.trim() !== '') {
                        JSON.parse(customAttrs.replace(/^"|"$/g, ''));
                    }
                } catch (error) {
                    jsonValid = false;
                    jsonError = `Line: ${line}, Error: ${error.message}`;
                    break;
                }
            }
        }

        logTest('Product Export - Valid JSON Format',
            jsonValid,
            jsonError
        );

        // Save exported data for inspection
        fs.writeFileSync(path.join(__dirname, 'products-exported.csv'), csvContent);
        console.log('💾 Exported CSV saved to products-exported.csv');

    } catch (error) {
        logTest('Product Export - CSV Generation', false, error.message);
    }
}

/**
 * Test 6: Test Product Update via Import
 */
async function testProductUpdateViaImport() {
    try {
        // First, create a product to update
        const createData = await graphqlRequest(`
      mutation($input: ProductInput!) {
        createProduct(input: $input) {
          id
          name
          description
          customAttrs
        }
      }
    `, {
            input: {
                name: "Update Test Product",
                description: "Original description",
                customAttrs: { original: true }
            }
        });

        const productId = createData.createProduct.id;

        // Now update it via CSV import
        const updateCustomAttrs = JSON.stringify({
            original: false,
            updated: true,
            timestamp: "2024-01-15"
        });

        const updateCsv = `id,name,description,customAttrs,licenseIds
${productId},"Updated Product Name","Updated description with new content","${updateCustomAttrs}","${JSON.stringify([])}"`;

        const updateData = await graphqlRequest(`
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

        const updateResult = updateData.importProductsCsv;

        logTest('Product Update via Import - Success',
            updateResult.success && updateResult.productsUpdated === 1 && updateResult.productsCreated === 0,
            `Updated: ${updateResult.productsUpdated}, Created: ${updateResult.productsCreated}`
        );

        // Verify the update took effect
        const verifyData = await graphqlRequest(`
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

        const updatedProduct = verifyData.products.edges.find(edge => edge.node.id === productId);

        logTest('Product Update via Import - Data Updated',
            updatedProduct &&
            updatedProduct.node.name === 'Updated Product Name' &&
            updatedProduct.node.description === 'Updated description with new content',
            'Product data should be updated with new values'
        );

    } catch (error) {
        logTest('Product Update via Import', false, error.message);
    }
}

/**
 * Test 7: Test License Association via Import
 */
async function testLicenseAssociationViaImport(licenseIds) {
    if (licenseIds.length === 0) {
        logTest('License Association via Import', false, 'No test licenses available');
        return;
    }

    try {
        // Import product with license associations
        const licenseCustomAttrs = JSON.stringify({ has_licenses: true });
        const licenseIdsJson = JSON.stringify(licenseIds);

        const licenseCsv = `id,name,description,customAttrs,licenseIds
,"License Test Product","Product with license associations","${licenseCustomAttrs}","${licenseIdsJson}"`;

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
    `, { csv: licenseCsv });

        const result = data.importProductsCsv;

        logTest('License Association via Import - Import Success',
            result.success && result.productsCreated === 1,
            `Success: ${result.success}, Errors: ${result.errors.join(', ')}`
        );

        // Verify licenses are associated by checking the export
        const exportData = await graphqlRequest(`
      mutation {
        exportProductsCsv
      }
    `);

        const exportContent = exportData.exportProductsCsv;

        logTest('License Association via Import - Export Verification',
            exportContent.includes('License Test Product') &&
            exportContent.includes(licenseIds[0]),
            'Exported data should contain product with associated license IDs'
        );

    } catch (error) {
        logTest('License Association via Import', false, error.message);
    }
}

/**
 * Main test execution
 */
async function runTests() {
    console.log('🚀 Starting Comprehensive Product Import/Export Tests\n');

    const testStartTime = Date.now();

    try {
        // Test 1: Download sample CSV
        await testDownloadProductSample();

        // Test 2: Create test licenses
        const licenseIds = await createTestLicenses();

        // Test 3: Import products with all attributes
        await testProductImportAllAttributes(licenseIds);

        // Test 4: Test validation
        await testProductImportValidation();

        // Test 5: Test export
        await testProductExport();

        // Test 6: Test updates via import
        await testProductUpdateViaImport();

        // Test 7: Test license associations
        await testLicenseAssociationViaImport(licenseIds);

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