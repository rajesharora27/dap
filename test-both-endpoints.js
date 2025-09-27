// Minimal backend test
const https = require('https');
const http = require('http');

function testBackend() {
    const postData = JSON.stringify({
        query: `
            query Products {
                products {
                    edges {
                        node {
                            id
                            name
                            description
                        }
                    }
                }
            }
        `
    });

    const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/graphql',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('Testing backend GraphQL directly...');

    const req = http.request(options, (res) => {
        console.log(`Backend Status: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✅ Backend GraphQL working correctly');
                try {
                    const parsed = JSON.parse(data);
                    console.log(`Found ${parsed.data?.products?.edges?.length || 0} products`);
                } catch (e) {
                    console.log('Could not parse response');
                }
            } else {
                console.log('❌ Backend GraphQL error:', data);
            }

            // Now test frontend proxy
            testFrontendProxy();
        });
    });

    req.on('error', (e) => {
        console.error('❌ Backend connection failed:', e.message);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}

function testFrontendProxy() {
    const postData = JSON.stringify({
        query: `
            query Products {
                products {
                    edges {
                        node {
                            id
                            name
                            description
                        }
                    }
                }
            }
        `
    });

    const options = {
        hostname: 'localhost',
        port: 5173,
        path: '/graphql',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('\nTesting frontend proxy...');

    const req = http.request(options, (res) => {
        console.log(`Frontend Proxy Status: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✅ Frontend proxy working correctly');
                try {
                    const parsed = JSON.parse(data);
                    console.log(`Found ${parsed.data?.products?.edges?.length || 0} products through proxy`);
                } catch (e) {
                    console.log('Could not parse proxy response');
                }
            } else if (res.statusCode === 400) {
                console.log('❌ Frontend proxy returns 400 error:', data);
                console.log('\n🔍 This suggests a GraphQL query format issue in the frontend code');
            } else {
                console.log('❌ Frontend proxy error:', res.statusCode, data);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Frontend proxy connection failed:', e.message);
    });

    req.write(postData);
    req.end();
}

// Wait a moment for frontend to be ready
setTimeout(testBackend, 2000);