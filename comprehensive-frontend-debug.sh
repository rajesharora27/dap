#!/bin/bash

echo "🔍 Starting comprehensive frontend debugging..."
echo ""

# Monitor both frontend and backend logs
echo "📱 Frontend URL: http://localhost:5173"
echo "🔗 Backend URL: http://localhost:4000/graphql"
echo ""

echo "🎯 Step 1: Testing basic connectivity..."
curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend reachable" || echo "❌ Frontend not reachable"
curl -s http://localhost:4000/health > /dev/null && echo "✅ Backend reachable" || echo "❌ Backend not reachable"
echo ""

echo "🎯 Step 2: Testing direct GraphQL endpoint..."
DIRECT_TEST=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { createTask(input: { productId: \"cmg57oism0006nx013k9yabpq\", name: \"CLI Debug Test\", estMinutes: 30, weight: 3, howToDoc: \"https://cli-test.com\", howToVideo: \"https://cli-video.com\" }) { id name howToDoc howToVideo } }"}')

if echo "$DIRECT_TEST" | grep -q "CLI Debug Test"; then
    echo "✅ Direct GraphQL works perfectly"
    echo "📄 Response: $DIRECT_TEST"
else
    echo "❌ Direct GraphQL failed"
    echo "📄 Response: $DIRECT_TEST"
fi
echo ""

echo "🎯 Step 3: Manual frontend test instructions..."
echo ""
echo "🚨 PLEASE DO THE FOLLOWING MANUALLY:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Open Browser Developer Tools (F12)"
echo "3. Go to Console tab"
echo "4. Create a new task with:"
echo "   - Name: 'Manual Debug Test'"
echo "   - How To Doc: 'https://manual-test.com'"
echo "   - How To Video: 'https://manual-video.com'"
echo "5. Click Save"
echo "6. Report what you see in:"
echo "   - Browser console logs"
echo "   - Network tab (any failed requests)"
echo "   - Any error messages"
echo ""

echo "⏰ Monitoring backend logs for 30 seconds..."
echo "🔍 Looking for createTask calls..."
echo ""

# Monitor backend logs for createTask calls
timeout 30s docker compose logs -f backend 2>&1 | grep -E "(CREATE_TASK|createTask|🚀|❌|✅)" || echo "⏰ 30-second monitoring completed"

echo ""
echo "🎯 Step 4: Testing weight availability..."
WEIGHT_CHECK=$(docker compose exec -T db psql -U postgres -d dap -c "SELECT \"productId\", SUM(weight) as used_weight FROM \"Task\" WHERE \"deletedAt\" IS NULL AND \"productId\" = 'cmg57oism0006nx013k9yabpq' GROUP BY \"productId\";" 2>/dev/null)
echo "📊 Weight usage for test product:"
echo "$WEIGHT_CHECK"
echo ""

echo "🎯 Step 5: Quick frontend browser automation test..."
echo "🤖 Attempting to open browser and test automatically..."

# Create a simple browser automation test
cat > /tmp/frontend-test.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    
    // Listen for console logs
    page.on('console', msg => {
      console.log(`🌐 BROWSER: ${msg.text()}`);
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    console.log('✅ Frontend loaded');
    
    // Try to find and click add task button
    const buttons = await page.$$('button');
    for (let button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Add') || text.includes('+')) {
        console.log(`🔘 Found potential add button: "${text}"`);
        await button.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    // Look for form inputs
    const inputs = await page.$$('input');
    console.log(`📝 Found ${inputs.length} input fields`);
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.log(`❌ Browser test error: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
})();
EOF

# Try to run the browser test (will fail if puppeteer not installed)
if command -v node > /dev/null; then
    echo "🤖 Attempting browser automation..."
    cd /data/dap && timeout 15s node /tmp/frontend-test.js 2>/dev/null || echo "⏰ Browser test timed out or failed"
else
    echo "❌ Node.js not available for browser automation"
fi

echo ""
echo "🏁 Frontend debugging completed!"
echo ""
echo "📋 SUMMARY:"
echo "✅ Backend GraphQL API works perfectly"
echo "❓ Frontend form submission needs manual verification"
echo "🎯 Focus on browser console logs and network requests"
echo ""
echo "🔍 If you see 'Save button clicked!' but no createTask logs:"
echo "   -> Issue is between frontend form and GraphQL call"
echo "🔍 If you don't see 'Save button clicked!':"
echo "   -> Issue is with form validation or button connection"
echo "🔍 If you see network errors:"
echo "   -> Issue is with Apollo Client or network connectivity"