#!/usr/bin/env node
/**
 * Quick diagnostic for Excel import workbooks.
 * Usage: node analyze-excel-import.js [path-to-workbook]
 */
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const WORKBOOK_PATH = process.argv[2] || 'Cisco Secure Access DAP.xlsx';

(async () => {
  const resolvedPath = path.resolve(WORKBOOK_PATH);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Workbook not found at ${resolvedPath}`);
    process.exit(1);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(resolvedPath);
  console.log(`🔍 Analyzing workbook: ${resolvedPath}`);

  const issues = [];
  const warnings = [];

  const toText = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return `${value}`;
    if (typeof value === 'object') {
      if (typeof value.text === 'string') return value.text;
      if (Array.isArray(value.richText)) {
        return value.richText.map((part) => part.text ?? '').join('');
      }
      if (typeof value.result !== 'undefined') {
        return toText(value.result);
      }
    }
    return String(value);
  };

  const sheet = (name) => workbook.getWorksheet(name);

  // --- Simple Attributes ---
  const simpleSheet = sheet('Simple Attributes');
  if (!simpleSheet) {
    issues.push('Simple Attributes sheet is missing. Include at least Name and Description.');
  } else {
    let name = '';
    let description = '';
    simpleSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const key = toText(row.getCell(1).value).trim().toLowerCase();
      const value = toText(row.getCell(2).value).trim();
      if (!key) return;
      if (key === 'name') name = value;
      if (key === 'description') description = value;
    });
    if (!name) {
      issues.push('Simple Attributes tab: "Name" is missing. Add a Name before importing.');
    }
    if (!description) {
      warnings.push('Simple Attributes tab: "Description" is blank. Optional, but recommended.');
    }
  }

  // Helper to collect sheet values
  const collectSheetValues = (sheetName, keyCol = 1) => {
    const ws = sheet(sheetName);
    if (!ws) return [];
    const values = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const value = toText(row.getCell(keyCol).value).trim();
      if (value) values.push({ rowNumber, value });
    });
    return values;
  };

  // --- Licenses ---
  const licenseEntries = collectSheetValues('Licenses', 1);
  const licenseSet = new Map();
  for (const { rowNumber, value } of licenseEntries) {
    const key = value.toLowerCase();
    if (licenseSet.has(key)) {
      issues.push(`Licenses tab (row ${rowNumber}): Duplicate license name "${value}". Names must be unique.`);
    } else {
      licenseSet.set(key, { rowNumber, value });
    }
  }

  // Check license level values
  const licensesSheet = sheet('Licenses');
  if (licensesSheet) {
    licensesSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const name = toText(row.getCell(1).value).trim();
      if (!name) return;
      const levelCell = row.getCell(3).value;
      const level = typeof levelCell === 'number' ? levelCell : Number(toText(levelCell));
      if (!Number.isFinite(level)) {
        issues.push(`Licenses tab (row ${rowNumber}): Level for "${name}" must be a number (1 = Essential, 2 = Advantage, 3 = Signature).`);
      }
    });
  }

  // --- Outcomes ---
  const outcomeEntries = collectSheetValues('Outcomes', 1);
  const outcomeSet = new Map();
  for (const { rowNumber, value } of outcomeEntries) {
    const key = value.toLowerCase();
    if (outcomeSet.has(key)) {
      issues.push(`Outcomes tab (row ${rowNumber}): Duplicate outcome name "${value}". Names must be unique.`);
    } else {
      outcomeSet.set(key, { rowNumber, value });
    }
  }

  // --- Releases ---
  const releaseEntries = collectSheetValues('Releases', 1);
  const releaseSet = new Map();
  const releasesSheet = sheet('Releases');
  if (releasesSheet) {
    releasesSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const name = toText(row.getCell(1).value).trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (releaseSet.has(key)) {
        issues.push(`Releases tab (row ${rowNumber}): Duplicate release name "${name}". Use unique names.`);
      } else {
        releaseSet.set(key, { rowNumber, name });
      }
      const levelCell = row.getCell(3).value;
      const level = typeof levelCell === 'number' ? levelCell : Number(toText(levelCell));
      if (!Number.isFinite(level)) {
        issues.push(`Releases tab (row ${rowNumber}): Level for "${name}" must be numeric (e.g., 1, 1.1, 2).`);
      }
    });
  }

  // --- Tasks ---
  const tasksSheet = sheet('Tasks');
  if (!tasksSheet) {
    issues.push('Tasks sheet is missing.');
  } else {
    const headerRow = tasksSheet.getRow(1);
    const headerLookup = {};
    headerRow.eachCell((cell, colNumber) => {
      headerLookup[toText(cell.text).trim().toLowerCase()] = colNumber;
    });

    const readCell = (row, logicalName) => {
      const column = headerLookup[logicalName];
      if (!column) return '';
      return toText(row.getCell(column).value).trim();
    };

    const taskNameToRow = new Map();

    tasksSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const name = readCell(row, 'name');
      if (!name) {
        issues.push(`Tasks tab (row ${rowNumber}): Name is required.`);
        return;
      }

      if (taskNameToRow.has(name.toLowerCase())) {
        warnings.push(`Tasks tab (row ${rowNumber}): Duplicate task name "${name}". Allowed, but be sure it is intentional.`);
      } else {
        taskNameToRow.set(name.toLowerCase(), rowNumber);
      }

      const seqValue = readCell(row, 'sequence number');
      if (!seqValue) {
        issues.push(`Tasks tab (row ${rowNumber}): Sequence Number is required for "${name}".`);
      } else if (Number.isNaN(Number(seqValue))) {
        issues.push(`Tasks tab (row ${rowNumber}): Sequence Number for "${name}" must be numeric.`);
      }

      const estMinutesValue = readCell(row, 'estimated minutes');
      if (!estMinutesValue) {
        warnings.push(`Tasks tab (row ${rowNumber}): Estimated Minutes missing for "${name}". Default will be 0.`);
      } else if (Number.isNaN(Number(estMinutesValue))) {
        issues.push(`Tasks tab (row ${rowNumber}): Estimated Minutes for "${name}" must be numeric.`);
      }

      const weightValue = readCell(row, 'weight');
      if (!weightValue) {
        warnings.push(`Tasks tab (row ${rowNumber}): Weight missing for "${name}". Default will be 0.`);
      } else if (Number.isNaN(Number(weightValue))) {
        issues.push(`Tasks tab (row ${rowNumber}): Weight for "${name}" must be numeric.`);
      }

      const licenseName = readCell(row, 'license name');
      if (licenseName && !licenseSet.has(licenseName.toLowerCase())) {
        issues.push(`Tasks tab (row ${rowNumber}): License "${licenseName}" not found in Licenses tab.`);
      }

      const recordNames = (raw, set, label) => {
        if (!raw) return;
        raw
          .split(/[,;\n]/)
          .map((value) => value.trim())
          .filter(Boolean)
          .forEach((value) => {
            if (!set.has(value.toLowerCase())) {
              issues.push(`Tasks tab (row ${rowNumber}): ${label} "${value}" not found in ${label} tab.`);
            }
          });
      };

      recordNames(readCell(row, 'outcome names'), outcomeSet, 'Outcome');
      recordNames(readCell(row, 'release names'), releaseSet, 'Release');
    });
  }

  // --- Custom Attributes ---
  const customSheet = sheet('Custom Attributes');
  if (customSheet) {
    const seen = new Map();
    customSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const key = toText(row.getCell(1).value).trim();
      if (!key) return;
      const lower = key.toLowerCase();
      if (seen.has(lower)) {
        issues.push(`Custom Attributes tab (row ${rowNumber}): Duplicate attribute name "${key}" (already defined in row ${seen.get(lower)}).`);
      } else {
        seen.set(lower, rowNumber);
      }
      const rawValue = toText(row.getCell(2).value).trim();
      if ((rawValue.startsWith('{') && rawValue.endsWith('}')) || (rawValue.startsWith('[') && rawValue.endsWith(']'))) {
        try {
          JSON.parse(rawValue);
        } catch (error) {
          issues.push(`Custom Attributes tab (row ${rowNumber}): Value for "${key}" is not valid JSON.`);
        }
      }
    });
  }

  // --- Summary ---
  const formatList = (items) => items.map((item, idx) => `  ${idx + 1}. ${item}`).join('\n');

  if (issues.length === 0 && warnings.length === 0) {
    console.log('\n✅ No blocking issues detected. Workbook is ready for import.');
  } else {
    if (issues.length > 0) {
      console.log(`\n❗ Found ${issues.length} issue${issues.length === 1 ? '' : 's'}:`);
      console.log(formatList(issues));
    } else {
      console.log('\n✅ No blocking issues detected.');
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} warning${warnings.length === 1 ? '' : 's'}:`);
      console.log(formatList(warnings));
    }
  }
})();
