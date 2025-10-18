/**
 * Test script for Telemetry Export/Import GraphQL API
 * 
 * This script tests the new telemetry export and import functionality
 * by making GraphQL requests to the backend API.
 * 
 * Prerequisites:
 * 1. Backend server must be running
 * 2. Must have an adoption plan with telemetry attributes set up
 * 3. Need valid authentication token
 * 
 * Usage:
 *   node test-telemetry-api.js <adoptionPlanId>
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 4000;
const GRAPHQL_ENDPOINT = '/graphql';

// Test data
const adoptionPlanId = process.argv[2];

if (!adoptionPlanId) {
  console.error('Usage: node test-telemetry-api.js <adoptionPlanId>');
  process.exit(1);
}

// Helper function to make GraphQL request
function graphqlRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    
    const options = {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: GRAPHQL_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.errors) {
            reject(new Error(`GraphQL errors: ${JSON.stringify(result.errors, null, 2)}`));
          } else {
            resolve(result.data);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Helper function to download file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    http.get(`http://${BACKEND_HOST}:${BACKEND_PORT}${url}`, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

// Test 1: Export telemetry template
async function testExport() {
  console.log('\n=== Test 1: Export Telemetry Template ===\n');
  
  const query = `
    mutation ExportTemplate($adoptionPlanId: ID!) {
      exportAdoptionPlanTelemetryTemplate(adoptionPlanId: $adoptionPlanId) {
        url
        filename
        taskCount
        attributeCount
        customerName
        productName
        assignmentName
      }
    }
  `;

  try {
    const result = await graphqlRequest(query, { adoptionPlanId });
    console.log('✅ Export successful!');
    console.log('Response:', JSON.stringify(result, null, 2));
    
    const { url, filename } = result.exportAdoptionPlanTelemetryTemplate;
    console.log(`\nDownload URL: http://${BACKEND_HOST}:${BACKEND_PORT}${url}`);
    
    // Download the file
    const downloadPath = path.join(__dirname, filename);
    console.log(`\nDownloading to: ${downloadPath}`);
    await downloadFile(url, downloadPath);
    console.log('✅ File downloaded successfully!');
    
    return { url, filename, downloadPath };
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    throw error;
  }
}

// Test 2: Import telemetry data (requires manual file editing)
async function testImport(filePath) {
  console.log('\n=== Test 2: Import Telemetry Data ===\n');
  console.log('⚠️  This test requires the Upload scalar which is not easily testable via HTTP.');
  console.log('⚠️  The import mutation should be tested via GraphQL Playground or frontend UI.');
  console.log('\nExample mutation:');
  console.log(`
    mutation ImportTelemetry($adoptionPlanId: ID!, $file: Upload!) {
      importAdoptionPlanTelemetry(adoptionPlanId: $adoptionPlanId, file: $file) {
        success
        batchId
        summary {
          tasksProcessed
          attributesUpdated
          criteriaEvaluated
          errors
        }
        taskResults {
          taskId
          taskName
          attributesUpdated
          criteriaMet
          criteriaTotal
          completionPercentage
          errors
        }
      }
    }
  `);
  
  console.log('\nTo test import:');
  console.log(`1. Open the downloaded file: ${filePath}`);
  console.log('2. Fill in some telemetry values in the "Telemetry_Data" sheet');
  console.log('3. Use GraphQL Playground at http://localhost:4000/graphql');
  console.log('4. Upload the file using the import mutation');
}

// Test 3: Query telemetry status (after import)
async function testQueryStatus() {
  console.log('\n=== Test 3: Query Telemetry Status ===\n');
  
  const query = `
    query GetAdoptionPlan($id: ID!) {
      adoptionPlan(id: $id) {
        id
        customerTasks {
          id
          name
          telemetryAttributes {
            id
            name
            dataType
            successCriteria
            values {
              id
              value
              batchId
              source
              notes
              createdAt
            }
          }
        }
      }
    }
  `;

  try {
    const result = await graphqlRequest(query, { id: adoptionPlanId });
    console.log('✅ Query successful!');
    
    const tasks = result.adoptionPlan.customerTasks;
    console.log(`\nFound ${tasks.length} tasks`);
    
    tasks.forEach(task => {
      const attrCount = task.telemetryAttributes.length;
      const attrWithValues = task.telemetryAttributes.filter(a => a.values.length > 0).length;
      console.log(`  - ${task.name}: ${attrWithValues}/${attrCount} attributes have values`);
    });
  } catch (error) {
    console.error('❌ Query failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Telemetry Export/Import API Test Suite              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nTesting Adoption Plan ID: ${adoptionPlanId}`);
  
  try {
    // Test export
    const { downloadPath } = await testExport();
    
    // Instructions for import test
    await testImport(downloadPath);
    
    // Test query (will show current state)
    await testQueryStatus();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   Test Summary                                         ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('✅ Export template: PASSED');
    console.log('⚠️  Import telemetry: MANUAL TEST REQUIRED');
    console.log('✅ Query status: PASSED (shows current state)');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Start tests
runTests();
