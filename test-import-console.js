#!/usr/bin/env node

/**
 * Browser Console Test Script for Excel Import
 * 
 * Instructions:
 * 1. Open the application in your browser (http://localhost:5173)
 * 2. Open the browser's Developer Tools (F12)
 * 3. Go to the Console tab
 * 4. Copy and paste this entire script into the console
 * 5. Press Enter to run it
 * 6. The script will trigger the import dialog
 * 7. Select "Cisco Secure Access DAP.xlsx"
 * 8. Check the console for detailed error messages
 */

console.log('%c=== Excel Import Debug Helper ===', 'color: blue; font-weight: bold; font-size: 14px');
console.log('This script will help identify import errors with detailed logging.\n');

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Enhanced console methods
console.error = function(...args) {
  originalError.apply(console, ['🔴 ERROR:', ...args]);
};

console.warn = function(...args) {
  originalWarn.apply(console, ['⚠️ WARNING:', ...args]);
};

// Find the import button and click it
setTimeout(() => {
  const importButton = Array.from(document.querySelectorAll('button'))
    .find(btn => btn.textContent?.includes('Import All Product Data'));
  
  if (importButton) {
    console.log('✅ Found import button, clicking it now...');
    console.log('📂 Please select the Excel file: Cisco Secure Access DAP.xlsx');
    importButton.click();
  } else {
    console.error('❌ Could not find the "Import All Product Data" button');
    console.log('💡 Make sure you are on the correct page with the import button visible');
  }
}, 1000);

console.log('\n📋 Instructions:');
console.log('1. The import dialog should open automatically in 1 second');
console.log('2. Select "Cisco Secure Access DAP.xlsx" from /data/dap/');
console.log('3. Watch this console for detailed error messages');
console.log('4. Any errors will be highlighted in RED (🔴)');
console.log('5. Warnings will be shown in YELLOW (⚠️)\n');
