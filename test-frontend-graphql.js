const http = require('http');

// Test the frontend proxy directly
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

console.log('Testing GraphQL through frontend proxy...');
console.log('Request options:', options);
console.log('Request data:', postData);

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response body:', data);
        try {
            const parsed = JSON.parse(data);
            console.log('Parsed response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Could not parse as JSON');
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();