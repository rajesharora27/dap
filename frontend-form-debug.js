const puppeteer = require('puppeteer');

async function debugFrontendFormFlow() {
    console.log('🔍 Starting systematic frontend debugging...\n');
    
    let browser;
    try {
        // Launch browser with extended logging
        browser = await puppeteer.launch({
            headless: false, // Show browser for debugging
            slowMo: 100,
            devtools: true,
            args: [
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--no-sandbox'
            ]
        });
        
        const page = await browser.newPage();
        
        // Enable console logging from browser
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'log' || type === 'error' || type === 'warn') {
                console.log(`🌐 BROWSER ${type.toUpperCase()}: ${msg.text()}`);
            }
        });
        
        // Catch network errors
        page.on('response', response => {
            if (!response.ok()) {
                console.log(`❌ NETWORK ERROR: ${response.status()} ${response.url()}`);
            }
        });
        
        console.log('📱 Navigating to frontend...');
        await page.goto('http://localhost:5173', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('⏰ Waiting for React app to load...');
        await page.waitForTimeout(3000);
        
        console.log('🎯 Looking for tasks panel...');
        
        // Try to find the Add Task button
        const addButtons = await page.$$('button');
        console.log(`🔍 Found ${addButtons.length} buttons on page`);
        
        let addTaskButton = null;
        for (let button of addButtons) {
            const text = await page.evaluate(el => el.textContent, button);
            console.log(`🔘 Button text: "${text}"`);
            if (text.includes('Add Task') || text.includes('Create Task') || text.includes('+')) {
                addTaskButton = button;
                console.log(`✅ Found potential Add Task button: "${text}"`);
                break;
            }
        }
        
        if (!addTaskButton) {
            console.log('❌ Could not find Add Task button');
            
            // Check if we need to navigate to products first
            console.log('🔍 Looking for products...');
            const productLinks = await page.$$('a');
            for (let link of productLinks) {
                const text = await page.evaluate(el => el.textContent, link);
                if (text.includes('Product') || text.includes('Debug')) {
                    console.log(`🔗 Clicking product link: "${text}"`);
                    await link.click();
                    await page.waitForTimeout(2000);
                    break;
                }
            }
            
            // Try again to find Add Task button
            const newAddButtons = await page.$$('button');
            for (let button of newAddButtons) {
                const text = await page.evaluate(el => el.textContent, button);
                if (text.includes('Add Task') || text.includes('Create Task') || text.includes('+')) {
                    addTaskButton = button;
                    console.log(`✅ Found Add Task button after navigation: "${text}"`);
                    break;
                }
            }
        }
        
        if (!addTaskButton) {
            console.log('❌ CRITICAL: Cannot find Add Task button anywhere');
            return;
        }
        
        console.log('🖱️  Clicking Add Task button...');
        await addTaskButton.click();
        await page.waitForTimeout(1000);
        
        console.log('🔍 Looking for task form dialog...');
        
        // Wait for dialog to appear
        await page.waitForSelector('[role="dialog"], .MuiDialog-root', { timeout: 5000 });
        console.log('✅ Task dialog opened');
        
        // Fill in the form
        console.log('📝 Filling form fields...');
        
        // Task name
        const nameField = await page.$('input[label="Task Name"], input[placeholder*="name"], input[placeholder*="Name"]');
        if (nameField) {
            await nameField.click();
            await nameField.type('Puppeteer Debug Test');
            console.log('✅ Filled task name');
        } else {
            console.log('❌ Could not find task name field');
        }
        
        // Find How To Doc field
        const howToDocField = await page.$('input[placeholder*="docs.example.com"], input[label*="How To Documentation"]');
        if (howToDocField) {
            await howToDocField.click();
            await howToDocField.type('https://puppeteer-debug.example.com');
            console.log('✅ Filled How To Doc field');
        } else {
            console.log('❌ Could not find How To Doc field');
        }
        
        // Find How To Video field
        const howToVideoField = await page.$('input[placeholder*="youtube.com"], input[label*="How To Video"]');
        if (howToVideoField) {
            await howToVideoField.click();
            await howToVideoField.type('https://video-puppeteer.example.com');
            console.log('✅ Filled How To Video field');
        } else {
            console.log('❌ Could not find How To Video field');
        }
        
        console.log('💾 Looking for Save button...');
        
        // Find Save/Create button
        const saveButtons = await page.$$('button');
        let saveButton = null;
        for (let button of saveButtons) {
            const text = await page.evaluate(el => el.textContent, button);
            if (text.includes('Save') || text.includes('Create') || text.includes('Add')) {
                saveButton = button;
                console.log(`✅ Found Save button: "${text}"`);
                break;
            }
        }
        
        if (!saveButton) {
            console.log('❌ CRITICAL: Cannot find Save button');
            return;
        }
        
        console.log('🖱️  Clicking Save button...');
        console.log('🔍 Monitoring for console logs and network activity...');
        
        // Click save and wait for processing
        await saveButton.click();
        await page.waitForTimeout(3000);
        
        console.log('📊 Checking if task was created...');
        
        // Check if dialog closed (success) or still open (error)
        const dialogStillOpen = await page.$('[role="dialog"], .MuiDialog-root');
        if (!dialogStillOpen) {
            console.log('✅ Dialog closed - task creation likely succeeded');
        } else {
            console.log('❌ Dialog still open - task creation likely failed');
            
            // Check for error messages
            const errorText = await page.$eval('body', el => el.textContent);
            if (errorText.includes('error') || errorText.includes('Error')) {
                console.log('❌ Error message found on page');
            }
        }
        
    } catch (error) {
        console.error('💥 Frontend debugging error:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Install puppeteer if needed
const { execSync } = require('child_process');
try {
    require('puppeteer');
} catch (e) {
    console.log('📦 Installing puppeteer...');
    execSync('npm install puppeteer', { stdio: 'inherit' });
}

debugFrontendFormFlow().then(() => {
    console.log('\n🏁 Frontend debugging completed');
}).catch(error => {
    console.error('💥 Test failed:', error);
});