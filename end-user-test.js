#!/usr/bin/env node

/**
 * End-User Test Script
 * Simulates real user interactions to verify the application works correctly
 */

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:4000/graphql';
const PROXY_URL = 'http://localhost:5173/graphql';

async function testBackendDirectly() {
  console.log('🔧 Testing Backend API directly...');
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'query { products { edges { node { id name } } } }'
      })
    });
    
    const data = await response.json();
    if (data.data && data.data.products && data.data.products.edges.length > 0) {
      console.log('✅ Backend API working - found', data.data.products.edges.length, 'products');
      return true;
    } else {
      console.log('❌ Backend API not returning products');
      console.log('Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Backend API error:', error.message);
    return false;
  }
}

async function testProxyConnection() {
  console.log('🔧 Testing Vite Proxy...');
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'query { products { edges { node { id name } } } }'
      })
    });
    
    const data = await response.json();
    if (data.data && data.data.products && data.data.products.edges.length > 0) {
      console.log('✅ Vite Proxy working - found', data.data.products.edges.length, 'products');
      return true;
    } else {
      console.log('❌ Vite Proxy not returning products');
      console.log('Response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Vite Proxy error:', error.message);
    return false;
  }
}

async function testFrontendInBrowser() {
  console.log('🌐 Testing Frontend in Browser...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Listen for network errors
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    
    console.log('🔍 Loading frontend page...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for React to load
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('✅ React app loaded');
    
    // Check if products panel exists
    try {
      await page.waitForSelector('[data-testid="products-panel"], .products-panel, .product-item', { timeout: 10000 });
      console.log('✅ Products panel found');
    } catch (error) {
      console.log('⚠️  Products panel not found, checking for any product elements...');
      
      // Look for any signs of products
      const productElements = await page.$$eval('*', elements => 
        elements.filter(el => 
          el.textContent?.includes('product') || 
          el.textContent?.includes('Product') ||
          el.className?.includes('product') ||
          el.className?.includes('Product')
        ).length
      );
      
      if (productElements > 0) {
        console.log(`✅ Found ${productElements} product-related elements`);
      } else {
        console.log('❌ No product elements found');
      }
    }
    
    // Check for telemetry-related elements
    try {
      const telemetryElements = await page.$$eval('*', elements => 
        elements.filter(el => 
          el.textContent?.includes('telemetry') || 
          el.textContent?.includes('Telemetry') ||
          el.className?.includes('telemetry')
        ).length
      );
      
      if (telemetryElements > 0) {
        console.log(`✅ Found ${telemetryElements} telemetry-related elements`);
      } else {
        console.log('ℹ️  No telemetry elements visible (may be in dialogs)');
      }
    } catch (error) {
      console.log('⚠️  Could not check telemetry elements');
    }
    
    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach(error => console.log('  ', error));
    } else {
      console.log('✅ No console errors');
    }
    
    // Report network errors
    if (networkErrors.length > 0) {
      console.log('❌ Network Errors Found:');
      networkErrors.forEach(error => console.log('  ', error));
    } else {
      console.log('✅ No network errors');
    }
    
    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    return consoleErrors.length === 0 && networkErrors.length === 0;
    
  } catch (error) {
    console.log('❌ Browser test error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function runEndUserTest() {
  console.log('🚀 DAP End-User Test Suite');
  console.log('==========================');
  console.log('Testing as if a real user is accessing the application...\n');
  
  const tests = [
    { name: 'Backend API', test: testBackendDirectly },
    { name: 'Vite Proxy', test: testProxyConnection },
    { name: 'Frontend Browser', test: testFrontendInBrowser }
  ];
  
  let allPassed = true;
  
  for (const { name, test } of tests) {
    console.log(`\n--- ${name} Test ---`);
    const passed = await test();
    allPassed = allPassed && passed;
    console.log(passed ? '✅ PASSED' : '❌ FAILED');
  }
  
  console.log('\n=== END-USER TEST SUMMARY ===');
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - Application ready for users!');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Issues need to be resolved');
  }
  
  console.log('\n📋 User Access Instructions:');
  console.log('1. Open browser to: http://localhost:5173');
  console.log('2. Expect to see: Product list and navigation');
  console.log('3. Test telemetry: Double-click any task to open telemetry tab');
  
  process.exit(allPassed ? 0 : 1);
}

// Handle missing puppeteer gracefully
(async () => {
  try {
    await runEndUserTest();
  } catch (error) {
    if (error.message.includes('puppeteer')) {
      console.log('⚠️  Puppeteer not available, running basic tests only...');
      console.log('\n🔧 Installing puppeteer...');
      const { execSync } = require('child_process');
      try {
        execSync('npm install puppeteer', { stdio: 'inherit' });
        console.log('✅ Puppeteer installed, retrying...');
        await runEndUserTest();
      } catch (installError) {
        console.log('❌ Could not install puppeteer, running basic tests only');
        
        const backendOk = await testBackendDirectly();
        const proxyOk = await testProxyConnection();
        
        console.log('\n=== BASIC TEST SUMMARY ===');
        if (backendOk && proxyOk) {
          console.log('✅ Backend and Proxy working - Manual browser test recommended');
        } else {
          console.log('❌ Backend or Proxy issues detected');
        }
      }
    } else {
      console.log('❌ Test error:', error.message);
      process.exit(1);
    }
  }
})();