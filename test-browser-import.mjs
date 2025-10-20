#!/usr/bin/env node

/**
 * Test Import via GraphQL using curl (simulates browser file upload)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRAPHQL_URL = 'http://localhost:4000/graphql';
const ADOPTION_PLAN_ID = 'cmgwxi7c300otb25751jxznow';
const TEST_FILE = 'telemetry_test_filled.xlsx';

console.log('\n' + '='.repeat(80));
console.log('TESTING IMPORT VIA BROWSER SIMULATION');
console.log('='.repeat(80) + '\n');

// Check if filled file exists
if (!fs.existsSync(TEST_FILE)) {
  console.log('❌ Test file not found:', TEST_FILE);
  console.log('   Run: node create-filled-test-file.mjs');
  process.exit(1);
}

console.log('✅ Found test file:', TEST_FILE);
console.log('📊 File size:', (fs.statSync(TEST_FILE).size / 1024).toFixed(2), 'KB\n');

// Create the GraphQL multipart request using curl
// This simulates what the browser does when uploading a file

const mutation = `
mutation ImportTelemetry($adoptionPlanId: ID!, $file: Upload!) {
  importAdoptionPlanTelemetry(adoptionPlanId: $adoptionPlanId, file: $file) {
    success
    message
    summary {
      totalAttributes
      valuesImported
      criteriaEvaluated
      criteriaMet
    }
    taskResults {
      taskName
      attributesImported
      criteriaMet
      criteriaTotal
    }
  }
}
`.trim();

const operations = JSON.stringify({
  query: mutation,
  variables: {
    adoptionPlanId: ADOPTION_PLAN_ID,
    file: null
  }
});

const map = JSON.stringify({
  '0': ['variables.file']
});

// Build curl command for multipart upload
const curlCommand = `curl -s '${GRAPHQL_URL}' \\
  -H 'apollo-require-preflight: true' \\
  -F 'operations=${operations.replace(/'/g, "'")}' \\
  -F 'map=${map}' \\
  -F '0=@${TEST_FILE}'`;

console.log('🚀 Uploading file to GraphQL endpoint...\n');

try {
  const result = execSync(curlCommand, { 
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024 
  });
  
  const response = JSON.parse(result);
  
  if (response.errors) {
    console.log('❌ Import failed with errors:');
    console.log(JSON.stringify(response.errors, null, 2));
    process.exit(1);
  }
  
  if (response.data && response.data.importAdoptionPlanTelemetry) {
    const data = response.data.importAdoptionPlanTelemetry;
    
    if (data.success) {
      console.log('✅ IMPORT SUCCESSFUL!\n');
      console.log('📋 Message:', data.message);
      console.log('\n📊 Summary:');
      console.log('   Total Attributes:', data.summary.totalAttributes);
      console.log('   Values Imported:', data.summary.valuesImported);
      console.log('   Criteria Evaluated:', data.summary.criteriaEvaluated);
      console.log('   Criteria Met:', data.summary.criteriaMet);
      
      const percentage = ((data.summary.criteriaMet / data.summary.criteriaEvaluated) * 100).toFixed(1);
      console.log('   Success Rate:', percentage + '%');
      
      if (data.taskResults && data.taskResults.length > 0) {
        console.log('\n📋 Task Results:');
        data.taskResults.forEach((task, i) => {
          const taskPct = task.criteriaTotal > 0 
            ? ((task.criteriaMet / task.criteriaTotal) * 100).toFixed(0)
            : 0;
          console.log(`   ${i + 1}. ${task.taskName}`);
          console.log(`      → ${task.attributesImported} values imported`);
          console.log(`      → ${task.criteriaMet}/${task.criteriaTotal} criteria met (${taskPct}%)`);
        });
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('✅ BROWSER IMPORT TEST PASSED!');
      console.log('='.repeat(80) + '\n');
      
    } else {
      console.log('❌ Import failed:', data.message);
      process.exit(1);
    }
  } else {
    console.log('❌ Unexpected response format');
    console.log(JSON.stringify(response, null, 2));
    process.exit(1);
  }
  
} catch (error) {
  console.log('❌ Error during import:', error.message);
  console.log('\nResponse:', error.stdout?.toString() || 'No output');
  process.exit(1);
}
