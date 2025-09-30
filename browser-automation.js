
const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('🖥️  BROWSER:', msg.text());
  });
  
  try {
    console.log('📍 Navigating to frontend...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    console.log('🔍 Looking for test product...');
    
    // Wait for the page to load and find the test product
    await page.waitForSelector('[data-testid="product-item"], .MuiCard-root', { timeout: 10000 });
    
    // Look for our test product by name
    const productElements = await page.$$('h6, h5, .MuiTypography-root');
    let productFound = false;
    
    for (let element of productElements) {
      const text = await page.evaluate(el => el.textContent, element);
      if (text && text.includes('HowTo Test Product')) {
        console.log('✅ Found test product:', text);
        
        // Click on the product card or navigate to it
        const productCard = await element.evaluateHandle(el => el.closest('.MuiCard-root, [data-testid="product-item"]'));
        if (productCard) {
          await productCard.click();
          productFound = true;
          break;
        }
      }
    }
    
    if (!productFound) {
      throw new Error('Test product not found on page');
    }
    
    console.log('⏳ Waiting for product page to load...');
    await page.waitForTimeout(2000);
    
    console.log('🔍 Looking for Add Task button...');
    
    // Look for Add Task button
    const addTaskSelectors = [
      'button:contains("Add Task")',
      '[data-testid="add-task-button"]',
      'button[aria-label*="Add"]',
      'button:contains("Create")',
      '.MuiButton-root:contains("Add")'
    ];
    
    let addTaskButton = null;
    for (let selector of addTaskSelectors) {
      try {
        addTaskButton = await page.$(selector);
        if (addTaskButton) break;
      } catch (e) {
        // Try next selector
      }
    }
    
    // If not found by selector, search by text content
    if (!addTaskButton) {
      const buttons = await page.$$('button');
      for (let button of buttons) {
        const text = await page.evaluate(btn => btn.textContent, button);
        if (text && (text.includes('Add') || text.includes('Create')) && text.includes('Task')) {
          addTaskButton = button;
          break;
        }
      }
    }
    
    if (!addTaskButton) {
      throw new Error('Add Task button not found');
    }
    
    console.log('🖱️  Clicking Add Task button...');
    await addTaskButton.click();
    
    console.log('⏳ Waiting for task dialog to open...');
    await page.waitForTimeout(1000);
    
    // Look for the task dialog
    await page.waitForSelector('.MuiDialog-root, [role="dialog"]', { timeout: 5000 });
    
    console.log('📝 Filling out task form...');
    
    // Fill in the form fields
    const formData = {
      name: 'GUI Simulation Test Task',
      description: 'Task created via GUI simulation',
      notes: 'GUI simulation notes',
      howToDoc: 'https://gui-simulation.example.com/docs',
      howToVideo: 'https://gui-simulation.example.com/video'
    };
    
    // Fill name field
    const nameField = await page.$('input[id*="name"], input[label*="name"], input[placeholder*="name"]');
    if (nameField) {
      await nameField.click();
      await nameField.clear();
      await nameField.type(formData.name);
      console.log('✅ Filled name field');
    }
    
    // Fill description field  
    const descField = await page.$('textarea[id*="description"], input[label*="description"]');
    if (descField) {
      await descField.click();
      await descField.clear();
      await descField.type(formData.description);
      console.log('✅ Filled description field');
    }
    
    // Fill notes field
    const notesField = await page.$('textarea[id*="notes"], input[label*="Notes"]');
    if (notesField) {
      await notesField.click();
      await notesField.clear();
      await notesField.type(formData.notes);
      console.log('✅ Filled notes field');
    }
    
    // Fill howToDoc field
    const howToDocField = await page.$('input[label*="Documentation"], input[placeholder*="docs"]');
    if (howToDocField) {
      await howToDocField.click();
      await howToDocField.clear();
      await howToDocField.type(formData.howToDoc);
      console.log('✅ Filled howToDoc field');
    } else {
      console.log('❌ HowToDoc field not found');
    }
    
    // Fill howToVideo field
    const howToVideoField = await page.$('input[label*="Video"], input[placeholder*="video"]');
    if (howToVideoField) {
      await howToVideoField.click();
      await howToVideoField.clear();
      await howToVideoField.type(formData.howToVideo);
      console.log('✅ Filled howToVideo field');
    } else {
      console.log('❌ HowToVideo field not found');
    }
    
    console.log('⏳ Waiting before save...');
    await page.waitForTimeout(1000);
    
    // Click Save button
    const saveButton = await page.$('button:contains("Save"), button[type="submit"]');
    if (saveButton) {
      console.log('🖱️  Clicking Save button...');
      await saveButton.click();
      
      console.log('⏳ Waiting for save to complete...');
      await page.waitForTimeout(3000);
      
      console.log('✅ GUI simulation completed');
    } else {
      throw new Error('Save button not found');
    }
    
  } catch (error) {
    console.error('❌ Browser automation failed:', error.message);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: '/tmp/gui-simulation-error.png' });
    console.log('📸 Screenshot saved to /tmp/gui-simulation-error.png');
  } finally {
    await browser.close();
  }
})();
