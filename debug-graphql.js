// Debug GraphQL Query Script
const fetch = require('node-fetch');

async function testGraphQLQuery() {
    const url = 'http://localhost:4000/graphql';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin'
    };

    // Test 1: Correct products query with edges/node
    console.log('=== TEST 1: Correct Products Query ===');
    try {
        const query1 = {
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
                            }
                        }
                    }
                }
            `
        };

        const response1 = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(query1)
        });

        const result1 = await response1.json();
        console.log('Status:', response1.status);
        console.log('Response:', JSON.stringify(result1, null, 2));
    } catch (error) {
        console.error('Error in test 1:', error);
    }

    // Test 2: Incorrect products query (direct fields)
    console.log('\n=== TEST 2: Incorrect Products Query ===');
    try {
        const query2 = {
            query: `
                query Products {
                    products {
                        id
                        name
                        description
                    }
                }
            `
        };

        const response2 = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(query2)
        });

        const result2 = await response2.json();
        console.log('Status:', response2.status);
        console.log('Response:', JSON.stringify(result2, null, 2));
    } catch (error) {
        console.error('Error in test 2:', error);
    }

    // Test 3: Test frontend proxy
    console.log('\n=== TEST 3: Frontend Proxy Query ===');
    try {
        const proxyUrl = 'http://localhost:5173/graphql';
        const query3 = {
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
        };

        const response3 = await fetch(proxyUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(query3)
        });

        const result3 = await response3.json();
        console.log('Status:', response3.status);
        console.log('Response:', JSON.stringify(result3, null, 2));
    } catch (error) {
        console.error('Error in test 3:', error);
    }
}

testGraphQLQuery().catch(console.error);