#!/usr/bin/env node

import ExcelJS from 'exceljs';
import fs from 'fs';

const templateFile = 'telemetry_template_Acme Corporation 1760831321717_Cloud Platform Pro 1760831321114_1760920444984.xlsx';

console.log('📂 Loading template:', templateFile);

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(templateFile);

const sheet = workbook.getWorksheet('Telemetry_Data');
if (!sheet) {
  console.log('❌ Telemetry_Data sheet not found');
  process.exit(1);
}

console.log('📋 Found sheet with', sheet.rowCount, 'rows');

// Sample values to fill
const attributeValues = {
  'Environment Provisioned': 'TRUE',
  'Configuration Completion': 85,
  'Training Sessions Completed': 'TRUE',
  'Training Hours': 45,
  'API Integration Complete': 'TRUE',
  'API Calls Count': 1500,
  'Security Audit Passed': 'TRUE',
  'Security Score': 95,
  'Performance Tuned': 'TRUE',
  'Response Time (ms)': 450,
  'Data Migration Complete': 'TRUE',
  'Records Migrated': 12000,
  'Monitoring Enabled': 'TRUE',
  'Alerts Configured': 25,
  'UAT Approved': 'TRUE',
  'Test Cases Passed': 48,
};

// Fill values in "Current Value" column (column 5)
let filled = 0;
for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
  const row = sheet.getRow(rowNum);
  const attributeName = row.getCell(2).value; // Column 2 is "Attribute Name"
  
  if (attributeName && attributeValues[attributeName]) {
    row.getCell(5).value = attributeValues[attributeName]; // Column 5 is "Current Value"
    filled++;
  }
}

const outputFile = 'telemetry_properly_filled.xlsx';
await workbook.xlsx.writeFile(outputFile);

console.log('✅ Created properly filled file:', outputFile);
console.log('✅ Filled', filled, 'attribute values');
console.log('\n📤 Ready to import!');
