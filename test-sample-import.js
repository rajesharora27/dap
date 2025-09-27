const fs = require('fs');
const path = require('path');

async function testSampleImport() {
    const sampleCsv = fs.readFileSync(path.join(__dirname, 'product-import-sample.csv'), 'utf8');
    console.log('Sample CSV first few lines:');
    console.log(sampleCsv.split('\n').slice(0, 3).join('\n'));

    const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': 'admin'
        },
        body: JSON.stringify({
            query: `mutation($csv: String!) { importProductsCsv(csv: $csv) { success productsCreated productsUpdated errors warnings } }`,
            variables: { csv: sampleCsv }
        })
    });

    const result = await response.json();
    console.log('Import result:', JSON.stringify(result, null, 2));
}

testSampleImport().catch(console.error);