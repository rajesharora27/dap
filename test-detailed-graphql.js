const http = require('http');

// Test the exact configuration that frontend should use
function testGraphQLRequest() {
    const query = {
        query: `
            query Products {
                products {
                    edges {
                        node {
                            id
                            name
                            description
                            statusPercent
                            customAttrs
                            licenses {
                                id
                                name
                                description
                                level
                                isActive
                            }
                            outcomes {
                                id
                                name
                                description
                            }
                        }
                    }
                }
            }
        `
    };

    const postData = JSON.stringify(query);

    // Test direct to backend
    console.log('=== Testing Backend Direct ===');
    testEndpoint('localhost', 4000, '/graphql', postData, () => {
        // Test through frontend proxy
        console.log('\n=== Testing Frontend Proxy ===');
        testEndpoint('localhost', 5173, '/graphql', postData);
    });
}

function testEndpoint(hostname, port, path, postData, callback) {
    const options = {
        hostname,
        port,
        path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin',
            'Accept': 'application/json',
            'User-Agent': 'Node.js GraphQL Test'
        }
    };

    console.log(`Testing ${hostname}:${port}${path}`);
    console.log('Headers:', options.headers);
    console.log('Payload size:', postData.length, 'bytes');

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
        console.log('Response Headers:', res.headers);

        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.data && parsed.data.products && parsed.data.products.edges) {
                        console.log(`✅ Success! Found ${parsed.data.products.edges.length} products`);
                        console.log('First product:', parsed.data.products.edges[0]?.node);
                    } else {
                        console.log('❌ Unexpected response structure:', parsed);
                    }
                } catch (e) {
                    console.log('❌ Could not parse JSON response');
                    console.log('Raw response:', data.substring(0, 500));
                }
            } else if (res.statusCode === 400) {
                console.log('❌ 400 Bad Request - Response body:');
                console.log(data);

                try {
                    const parsed = JSON.parse(data);
                    if (parsed.errors) {
                        console.log('GraphQL Errors:', parsed.errors);
                    }
                } catch (e) {
                    console.log('Could not parse error response as JSON');
                }
            } else {
                console.log(`❌ HTTP ${res.statusCode} Error:`);
                console.log(data);
            }

            if (callback) callback();
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Request failed: ${e.message}`);
        if (callback) callback();
    });

    req.write(postData);
    req.end();
}

// Wait a moment then test
setTimeout(testGraphQLRequest, 2000);