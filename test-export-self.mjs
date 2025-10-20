import fetch from 'node-fetch';

async function test() {
  console.log('=== SELF-TESTING TELEMETRY EXPORT ===\n');
  
  // First, trigger the GraphQL mutation
  const mutation = `
    mutation {
      exportAdoptionPlanTelemetryTemplate(adoptionPlanId: "cmgwpfjsa00fxb21n4ybo5mse") {
        url
        filename
      }
    }
  `;
  
  console.log('Step 1: Calling GraphQL mutation...');
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: mutation })
  });
  
  const result = await response.json();
  console.log('GraphQL Response:', JSON.stringify(result, null, 2));
  
  if (result.errors) {
    console.error('\n❌ GraphQL Errors:', result.errors);
    return;
  }
  
  if (!result.data?.exportAdoptionPlanTelemetryTemplate) {
    console.error('\n❌ No data returned from mutation');
    return;
  }
  
  const { url, filename } = result.data.exportAdoptionPlanTelemetryTemplate;
  console.log('\n✓ URL returned:', url);
  console.log('✓ Filename:', filename);
  
  // Now try to download the file using backend URL
  const fileUrl = 'http://localhost:4000' + url;
  console.log('\nStep 2: Fetching file from:', fileUrl);
  
  const fileResponse = await fetch(fileUrl);
  console.log('Status:', fileResponse.status, fileResponse.statusText);
  console.log('Content-Type:', fileResponse.headers.get('content-type'));
  console.log('Content-Length:', fileResponse.headers.get('content-length'));
  
  if (!fileResponse.ok) {
    console.error('\n❌ File download failed!');
    const text = await fileResponse.text();
    console.error('Response:', text.substring(0, 200));
    return;
  }
  
  const buffer = await fileResponse.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const header = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('\nStep 3: Validating file content...');
  console.log('Downloaded bytes:', bytes.length);
  console.log('First 4 bytes (hex):', header);
  console.log('Expected header: 504b0304');
  
  if (header === '504b0304') {
    console.log('\n✅ SUCCESS! File is a valid Excel file (ZIP format)');
  } else {
    console.error('\n❌ FAILED! Invalid file header');
    console.log('First 100 bytes as text:', Buffer.from(bytes.slice(0, 100)).toString());
  }
  
  // Test with frontend URL construction
  console.log('\n=== Testing Frontend URL Construction ===');
  const apiConfigUrl = 'http://localhost:4000/graphql'; // This is what getApiUrl() returns in dev
  const windowOrigin = 'http://localhost:5173'; // Frontend origin
  
  try {
    console.log('apiConfigUrl:', apiConfigUrl);
    console.log('window.location.origin:', windowOrigin);
    
    const parsed = new URL(apiConfigUrl, windowOrigin);
    console.log('parsed URL:', parsed.href);
    console.log('parsed.protocol:', parsed.protocol);
    console.log('parsed.host:', parsed.host);
    
    const baseOrigin = `${parsed.protocol}//${parsed.host}`;
    console.log('Derived base origin:', baseOrigin);
    
    console.log('URL from mutation:', url);
    const frontendFileUrl = new URL(url, baseOrigin);
    console.log('Frontend would fetch:', frontendFileUrl.toString());
    
    // Test this URL
    console.log('\nStep 4: Testing frontend URL...');
    const frontendResponse = await fetch(frontendFileUrl.toString());
    console.log('Status:', frontendResponse.status);
    
    if (frontendResponse.ok) {
      const buf = await frontendResponse.arrayBuffer();
      const h = Array.from(new Uint8Array(buf).slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log('Header:', h);
      if (h === '504b0304') {
        console.log('✅ Frontend URL works correctly!');
      } else {
        console.log('❌ Frontend URL returns wrong content');
        // Show what it actually is
        const text = Buffer.from(buf).toString().substring(0, 100);
        console.log('Content starts with:', text);
      }
    } else {
      console.log('❌ Frontend URL failed:', frontendResponse.statusText);
    }
  } catch (err) {
    console.error('Frontend URL construction error:', err.message);
  }
}

test().catch(console.error);
