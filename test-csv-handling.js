const Papa = require('papaparse');

// Test basic JSON in CSV handling
const testData = [
    {
        id: 'test1',
        name: 'Test Product',
        description: 'Description with "quotes" and, commas',
        customAttrs: '{"priority": "high", "features": ["auth", "api"]}',
        licenseIds: '["license1", "license2"]'
    }
];

console.log('Original data:');
console.log(JSON.stringify(testData, null, 2));

const csv = Papa.unparse(testData);
console.log('\nCSV output:');
console.log(csv);

const parsed = Papa.parse(csv, { header: true });
console.log('\nParsed back:');
console.log(JSON.stringify(parsed.data, null, 2));

if (parsed.errors.length > 0) {
    console.log('\nParsing errors:');
    console.log(parsed.errors);
}