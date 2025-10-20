#!/usr/bin/env node

import ExcelJS from 'exceljs';
import fs from 'fs';

// Find the most recent template file
const files = fs.readdirSync('.').filter(f => f.includes('telemetry_template') && f.endsWith('.xlsx') && !f.includes('filled'));

if (files.length === 0) {
  console.log('❌ No template found. Please run export first.');
  process.exit(1);
}

const templateFile = files[files.length - 1];
console.log('📂 Using template:', templateFile);

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(templateFile);

const sheet = workbook.getWorksheet('Telemetry_Data');
if (!sheet) {
  console.log('❌ Telemetry_Data sheet not found');
  process.exit(1);
}

// Get header row to find columns
const headerRow = sheet.getRow(1);
const columns = {};
headerRow.eachCell((cell, colNum) => {
  columns[String(cell.value).toLowerCase()] = colNum;
});

console.log('📋 Found', Object.keys(columns).length, 'columns');

// Fill first task row (row 2) with sample data
const dataRow = sheet.getRow(2);

// Fill BOOLEAN values
['setup_complete', 'training_complete', 'api_configured', 'security_audit_passed', 
 'performance_tuned', 'data_migrated', 'monitoring_enabled', 'uat_approved'].forEach(attr => {
  const col = columns[attr];
  if (col) dataRow.getCell(col).value = 'TRUE';
});

// prod_deployed = FALSE to test criteria failure
if (columns['prod_deployed']) {
  dataRow.getCell(columns['prod_deployed']).value = 'FALSE';
}

// Fill NUMBER values
const numberValues = {
  'training_hours': 45,
  'api_calls': 1500,
  'security_score': 95,
  'response_time': 450,
  'error_rate': 0.02,
  'uptime_percentage': 99.9,
  'migration_records': 12000,
  'data_accuracy': 99.8,
  'alerts_configured': 25,
  'dashboard_views': 15,
  'test_cases_passed': 48,
  'user_acceptance': 92,
  'defects_found': 3,
  'go_live_readiness': 95,
  'documentation_complete': 100
};

Object.keys(numberValues).forEach(attr => {
  const col = columns[attr];
  if (col) dataRow.getCell(col).value = numberValues[attr];
});

const outputFile = 'telemetry_test_filled.xlsx';
await workbook.xlsx.writeFile(outputFile);
console.log('✅ Created filled test file:', outputFile);

// Count filled cells
let filled = 0;
dataRow.eachCell((cell, colNum) => {
  if (colNum > 3 && cell.value !== null && cell.value !== undefined) filled++;
});
console.log('✅ Filled', filled, 'attribute values');
console.log('\n📝 Next step: Import this file via browser UI at http://localhost:5173');
