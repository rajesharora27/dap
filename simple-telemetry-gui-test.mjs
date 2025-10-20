#!/usr/bin/env node

/**
 * Simple Telemetry GUI Test
 * Tests export and import through the actual GraphQL API
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRAPHQL_URL = 'http://localhost:4000/graphql';
const ADOPTION_PLAN_ID = 'cmgwxi7c300otb25751jxznow';

console.log('\n' + '='.repeat(80));
console.log('TELEMETRY GUI TESTING');
console.log('='.repeat(80) + '\n');

// TEST 1: Export Template
console.log('TEST 1: Export Telemetry Template\n');

const exportMutation = `
  mutation ExportTelemetryTemplate($adoptionPlanId: ID!) {
    exportAdoptionPlanTelemetryTemplate(adoptionPlanId: $adoptionPlanId) {
      url
      filename
      taskCount
      attributeCount
    }
  }
`;

const exportResponse = await fetch(GRAPHQL_URL, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'apollo-require-preflight': 'true'
  },
  body: JSON.stringify({ 
    query: exportMutation, 
    variables: { adoptionPlanId: ADOPTION_PLAN_ID } 
  }),
});

const exportResult = await exportResponse.json();

if (exportResult.errors) {
  console.error('❌ Export failed:', JSON.stringify(exportResult.errors, null, 2));
  process.exit(1);
}

const exportData = exportResult.data.exportAdoptionPlanTelemetryTemplate;
console.log('✅ Export successful!');
console.log(`   Filename: ${exportData.filename}`);
console.log(`   Tasks: ${exportData.taskCount}, Attributes: ${exportData.attributeCount}`);

// Download the file
const fileUrl = `http://localhost:4000${exportData.url}`;
const fileResponse = await fetch(fileUrl);
const buffer = await fileResponse.arrayBuffer();
const filepath = path.join(__dirname, exportData.filename);
fs.writeFileSync(filepath, Buffer.from(buffer));

const stats = fs.statSync(filepath);
console.log(`   Downloaded: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`   Location: ${filepath}\n`);

// TEST 2: Check if we have filled data
console.log('TEST 2: Check for Pre-filled Excel File\n');

// Look for any existing filled file
const files = fs.readdirSync(__dirname).filter(f => f.includes('filled.xlsx'));
let filledPath = null;

if (files.length > 0) {
  filledPath = path.join(__dirname, files[0]);
  console.log(`✅ Found filled Excel file: ${files[0]}`);
} else {
  console.log('ℹ️  No filled Excel file found.');
  console.log('   To test import:');
  console.log(`   1. Open: ${filepath}`);
  console.log('   2. Fill in some telemetry values in the Telemetry_Data sheet');
  console.log('   3. Save as: telemetry_filled.xlsx');
  console.log('   4. Re-run this test\n');
  process.exit(0);
}

// TEST 3: Import the filled file
console.log('\nTEST 3: Import Telemetry Data\n');

const importMutation = `
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
`;

const fileBuffer = fs.readFileSync(filledPath);

const operations = {
  query: importMutation,
  variables: {
    adoptionPlanId: ADOPTION_PLAN_ID,
    file: null,
  },
};

const map = {
  '0': ['variables.file'],
};

const form = new FormData();
form.append('operations', JSON.stringify(operations));
form.append('map', JSON.stringify(map));
form.append('0', fileBuffer, {
  filename: path.basename(filledPath),
  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

const importResponse = await fetch(GRAPHQL_URL, {
  method: 'POST',
  body: form,
  headers: {
    ...form.getHeaders(),
    'apollo-require-preflight': 'true',
  },
});

const importResult = await importResponse.json();

if (importResult.errors) {
  console.error('❌ Import failed:', JSON.stringify(importResult.errors, null, 2));
  process.exit(1);
}

const importData = importResult.data.importAdoptionPlanTelemetry;

if (importData.success) {
  console.log('✅ Import successful!');
  console.log(`   Message: ${importData.message}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Values Imported: ${importData.summary.valuesImported}/${importData.summary.totalAttributes}`);
  console.log(`   Criteria Met: ${importData.summary.criteriaMet}/${importData.summary.criteriaEvaluated}`);
  
  if (importData.taskResults.length > 0) {
    console.log(`\n📋 Task Results:`);
    importData.taskResults.forEach((task, i) => {
      const percentage = task.criteriaTotal > 0 
        ? ((task.criteriaMet / task.criteriaTotal) * 100).toFixed(0)
        : 0;
      console.log(`   ${i + 1}. ${task.taskName}: ${task.criteriaMet}/${task.criteriaTotal} criteria met (${percentage}%)`);
    });
  }
  
  console.log('\n✅ ALL TESTS PASSED!\n');
} else {
  console.error('❌ Import failed:', importData.message);
  process.exit(1);
}
