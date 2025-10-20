#!/usr/bin/env node

import ExcelJS from 'exceljs';

const files = [
  'telemetry_template_Acme Corporation 1760831321717_Cloud Platform Pro 1760831321114_1760920444984.xlsx'
];

for (const file of files) {
  console.log(`\nAnalyzing: ${file}\n`);
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  
  const sheet = workbook.getWorksheet('Telemetry_Data');
  if (!sheet) {
    console.log('No Telemetry_Data sheet found');
    continue;
  }
  
  console.log('Sheet:', sheet.name);
  console.log('Rows:', sheet.rowCount);
  console.log('Columns:', sheet.columnCount);
  
  // Print header row
  const headerRow = sheet.getRow(1);
  console.log('\nHeader Row:');
  headerRow.eachCell((cell, colNum) => {
    console.log(`  Col ${colNum}: ${cell.value}`);
  });
  
  // Print first data row
  console.log('\nFirst Data Row (Row 2):');
  const dataRow = sheet.getRow(2);
  dataRow.eachCell((cell, colNum) => {
    console.log(`  Col ${colNum}: ${cell.value}`);
  });
}
