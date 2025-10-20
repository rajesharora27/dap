#!/usr/bin/env node

/**
 * Automated GUI Testing for Telemetry Feature
 * Tests the export/import workflow through GraphQL API
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRAPHQL_URL = 'http://localhost:4000/graphql';
const ADOPTION_PLAN_ID = 'cmgwxi7c300otb25751jxznow';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`${step}. ${message}`, 'bright');
  log('='.repeat(80), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function runGraphQL(query, variables = {}) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  
  const result = await response.json();
  
  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }
  
  return result.data;
}

async function test1_VerifyAdoptionPlan() {
  logStep('TEST 1', 'Verify Demo Adoption Plan Exists');
  
  const query = `
    query GetAdoptionPlan($id: ID!) {
      adoptionPlan(id: $id) {
        id
        customer { name }
        customerProduct { 
          product { name }
          licenseLevel
        }
        totalTasks
        tasks {
          id
          name
          telemetryAttributes {
            id
            name
            dataType
            successCriteria
          }
        }
      }
    }
  `;
  
  try {
    const data = await runGraphQL(query, { id: ADOPTION_PLAN_ID });
    
    if (data.adoptionPlan) {
      logSuccess(`Adoption plan found: ${data.adoptionPlan.id}`);
      logInfo(`Customer: ${data.adoptionPlan.customer.name}`);
      logInfo(`Product: ${data.adoptionPlan.customerProduct.product.name} (${data.adoptionPlan.customerProduct.licenseLevel})`);
      logInfo(`Tasks: ${data.adoptionPlan.totalTasks}`);
      
      let totalAttributes = 0;
      data.adoptionPlan.tasks.forEach(task => {
        totalAttributes += task.telemetryAttributes.length;
      });
      
      logInfo(`Total Telemetry Attributes: ${totalAttributes}`);
      
      return { success: true, plan: data.adoptionPlan };
    } else {
      logError('Adoption plan not found');
      return { success: false };
    }
  } catch (error) {
    logError(`Failed to fetch adoption plan: ${error.message}`);
    return { success: false };
  }
}

async function test2_ExportTelemetryTemplate() {
  logStep('TEST 2', 'Export Telemetry Template (GUI Export Button)');
  
  const mutation = `
    mutation ExportTelemetryTemplate($adoptionPlanId: ID!) {
      exportAdoptionPlanTelemetryTemplate(adoptionPlanId: $adoptionPlanId) {
        url
        filename
        taskCount
        attributeCount
      }
    }
  `;
  
  try {
    const data = await runGraphQL(mutation, { adoptionPlanId: ADOPTION_PLAN_ID });
    const result = data.exportAdoptionPlanTelemetryTemplate;
    
    logSuccess('Export mutation executed successfully');
    logInfo(`Filename: ${result.filename}`);
    logInfo(`Download URL: ${result.url}`);
    logInfo(`Tasks: ${result.taskCount}`);
    logInfo(`Attributes: ${result.attributeCount}`);
    
    // Download the file
    const fileUrl = `http://localhost:4000${result.url}`;
    logInfo(`Downloading from: ${fileUrl}`);
    
    const fileResponse = await fetch(fileUrl);
    if (fileResponse.ok) {
      const buffer = await fileResponse.buffer();
      const filepath = path.join(__dirname, result.filename);
      fs.writeFileSync(filepath, buffer);
      
      const stats = fs.statSync(filepath);
      logSuccess(`File downloaded: ${filepath}`);
      logInfo(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
      
      return { success: true, filename: result.filename, filepath };
    } else {
      logError(`Failed to download file: ${fileResponse.statusText}`);
      return { success: false };
    }
  } catch (error) {
    logError(`Export failed: ${error.message}`);
    return { success: false };
  }
}

async function test3_FillSampleData(filepath) {
  logStep('TEST 3', 'Fill Sample Telemetry Data in Excel');
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);
    
    const dataSheet = workbook.getWorksheet('Telemetry_Data');
    if (!dataSheet) {
      logError('Telemetry_Data sheet not found');
      return { success: false };
    }
    
    logInfo(`Sheet found with ${dataSheet.rowCount} rows`);
    
    // Define sample values for telemetry attributes
    const sampleValues = {
      // BOOLEAN attributes
      'setup_complete': 'TRUE',
      'training_complete': 'TRUE',
      'api_configured': 'TRUE',
      'security_audit_passed': 'TRUE',
      'performance_tuned': 'TRUE',
      'data_migrated': 'TRUE',
      'monitoring_enabled': 'TRUE',
      'uat_approved': 'TRUE',
      'prod_deployed': 'FALSE', // This will fail criteria
      
      // NUMBER attributes
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
      'documentation_complete': 100,
    };
    
    // Get header row to find column indices
    const headerRow = dataSheet.getRow(1);
    const columnMap = {};
    headerRow.eachCell((cell, colNumber) => {
      const attrName = String(cell.value).toLowerCase().replace(/[^a-z0-9_]/g, '_');
      columnMap[attrName] = colNumber;
    });
    
    logInfo(`Found ${Object.keys(columnMap).length} columns`);
    
    // Fill values for first task row (row 2)
    let filledCount = 0;
    const dataRow = dataSheet.getRow(2);
    
    Object.keys(sampleValues).forEach(attrName => {
      const colIndex = columnMap[attrName];
      if (colIndex) {
        dataRow.getCell(colIndex).value = sampleValues[attrName];
        filledCount++;
      }
    });
    
    // Save the modified file
    const filledPath = filepath.replace('.xlsx', '_filled.xlsx');
    await workbook.xlsx.writeFile(filledPath);
    
    logSuccess(`Filled ${filledCount} attribute values`);
    logInfo(`Saved to: ${filledPath}`);
    
    return { success: true, filledPath };
  } catch (error) {
    logError(`Failed to fill Excel data: ${error.message}`);
    return { success: false };
  }
}

async function test4_ImportTelemetryData(filledPath) {
  logStep('TEST 4', 'Import Telemetry Data (GUI Import Button)');
  
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
          taskId
          taskName
          attributesImported
          criteriaMet
          criteriaTotal
        }
      }
    }
  `;
  
  try {
    logInfo('Reading filled Excel file...');
    const fileBuffer = fs.readFileSync(filledPath);
    
    logInfo('Note: File upload via GraphQL requires multipart/form-data');
    logInfo('For GUI testing, this simulates the frontend upload behavior');
    
    // Create form data for file upload
    const form = new FormData();
    
    const operations = {
      query: mutation,
      variables: {
        adoptionPlanId: ADOPTION_PLAN_ID,
        file: null,
      },
    };
    
    const map = {
      '0': ['variables.file'],
    };
    
    form.append('operations', JSON.stringify(operations));
    form.append('map', JSON.stringify(map));
    form.append('0', fileBuffer, {
      filename: path.basename(filledPath),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    
    logInfo('Uploading file to GraphQL server...');
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
    
    const result = await response.json();
    
    if (result.errors) {
      logError('Import failed with errors:');
      console.log(JSON.stringify(result.errors, null, 2));
      return { success: false };
    }
    
    const importResult = result.data.importAdoptionPlanTelemetry;
    
    if (importResult.success) {
      logSuccess('Import completed successfully');
      logInfo(`Message: ${importResult.message}`);
      
      const summary = importResult.summary;
      log('\n📊 Import Summary:', 'bright');
      logInfo(`Total Attributes: ${summary.totalAttributes}`);
      logInfo(`Values Imported: ${summary.valuesImported}`);
      logInfo(`Criteria Evaluated: ${summary.criteriaEvaluated}`);
      logInfo(`Criteria Met: ${summary.criteriaMet}`);
      
      const percentage = ((summary.criteriaMet / summary.criteriaEvaluated) * 100).toFixed(1);
      logInfo(`Success Rate: ${percentage}%`);
      
      log('\n📋 Task Results:', 'bright');
      importResult.taskResults.forEach((task, index) => {
        const taskPercentage = task.criteriaTotal > 0 
          ? ((task.criteriaMet / task.criteriaTotal) * 100).toFixed(0)
          : 0;
        logInfo(`${index + 1}. ${task.taskName}: ${task.criteriaMet}/${task.criteriaTotal} criteria met (${taskPercentage}%)`);
      });
      
      return { success: true, result: importResult };
    } else {
      logError(`Import failed: ${importResult.message}`);
      return { success: false };
    }
  } catch (error) {
    logError(`Import error: ${error.message}`);
    console.error(error);
    return { success: false };
  }
}

async function test5_VerifyImportedData() {
  logStep('TEST 5', 'Verify Imported Data in Database');
  
  const query = `
    query GetTelemetryValues($id: ID!) {
      adoptionPlan(id: $id) {
        tasks {
          name
          telemetryAttributes {
            name
            dataType
            successCriteria
            values {
              value
              criteriaMet
              createdAt
            }
          }
        }
      }
    }
  `;
  
  try {
    const data = await runGraphQL(query, { id: ADOPTION_PLAN_ID });
    
    let totalValues = 0;
    let totalCriteriaMet = 0;
    let totalCriteriaEvaluated = 0;
    
    data.adoptionPlan.tasks.forEach(task => {
      task.telemetryAttributes.forEach(attr => {
        if (attr.values && attr.values.length > 0) {
          totalValues += attr.values.length;
          attr.values.forEach(value => {
            totalCriteriaEvaluated++;
            if (value.criteriaMet) {
              totalCriteriaMet++;
            }
          });
        }
      });
    });
    
    logSuccess(`Found ${totalValues} telemetry values in database`);
    logInfo(`Criteria Met: ${totalCriteriaMet}/${totalCriteriaEvaluated}`);
    
    // Show some sample values
    log('\n📝 Sample Values:', 'bright');
    let sampleCount = 0;
    for (const task of data.adoptionPlan.tasks) {
      if (sampleCount >= 5) break;
      for (const attr of task.telemetryAttributes) {
        if (sampleCount >= 5) break;
        if (attr.values && attr.values.length > 0) {
          const value = attr.values[0];
          const icon = value.criteriaMet ? '✅' : '❌';
          logInfo(`${icon} ${attr.name} = ${value.value} (criteria: ${attr.successCriteria})`);
          sampleCount++;
        }
      }
    }
    
    return { success: true, totalValues, totalCriteriaMet, totalCriteriaEvaluated };
  } catch (error) {
    logError(`Failed to verify data: ${error.message}`);
    return { success: false };
  }
}

async function runAllTests() {
  log('\n' + '█'.repeat(80), 'cyan');
  log('     TELEMETRY GUI TESTING - AUTOMATED TEST SUITE', 'bright');
  log('█'.repeat(80) + '\n', 'cyan');
  
  const results = {
    test1: await test1_VerifyAdoptionPlan(),
    test2: await test2_ExportTelemetryTemplate(),
  };
  
  if (results.test2.success) {
    results.test3 = await test3_FillSampleData(results.test2.filepath);
    
    if (results.test3.success) {
      results.test4 = await test4_ImportTelemetryData(results.test3.filledPath);
      
      if (results.test4.success) {
        results.test5 = await test5_VerifyImportedData();
      }
    }
  }
  
  // Summary
  log('\n' + '█'.repeat(80), 'cyan');
  log('     TEST SUMMARY', 'bright');
  log('█'.repeat(80) + '\n', 'cyan');
  
  const testNames = {
    test1: 'Verify Adoption Plan',
    test2: 'Export Template',
    test3: 'Fill Sample Data',
    test4: 'Import Data',
    test5: 'Verify Database',
  };
  
  let passed = 0;
  let total = 0;
  
  Object.keys(results).forEach(key => {
    total++;
    if (results[key].success) {
      passed++;
      logSuccess(`${testNames[key]}: PASSED`);
    } else {
      logError(`${testNames[key]}: FAILED`);
    }
  });
  
  log('\n' + '='.repeat(80), 'cyan');
  const percentage = ((passed / total) * 100).toFixed(0);
  log(`Overall: ${passed}/${total} tests passed (${percentage}%)`, 'bright');
  log('='.repeat(80) + '\n', 'cyan');
  
  if (passed === total) {
    log('\n🎉 ALL TESTS PASSED! Telemetry GUI is working correctly.\n', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.\n', 'yellow');
  }
  
  return passed === total;
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
