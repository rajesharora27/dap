// Debug CSV generation issue
console.log('Testing CSV generation:');

const licenseIds = ['license1', 'license2'];
const licenseIdsJson = JSON.stringify(licenseIds);
console.log('License IDs JSON:', licenseIdsJson);

const csvLine = `,"Test Product","Description","{""key"": ""value""}","${licenseIdsJson}"`;
console.log('Generated CSV line:');
console.log(csvLine);

// Test what happens when we manually create the format that works
const workingFormat = ',"Test Product","Description","{""key"": ""value""}","[""license1"", ""license2""]"';
console.log('Working format:');
console.log(workingFormat);

console.log('Are they the same?', csvLine === workingFormat);
console.log('Difference:', csvLine.length, 'vs', workingFormat.length);

// Character by character comparison
for (let i = 0; i < Math.max(csvLine.length, workingFormat.length); i++) {
    if (csvLine[i] !== workingFormat[i]) {
        console.log(`Difference at position ${i}: '${csvLine[i] || 'EOF'}' vs '${workingFormat[i] || 'EOF'}'`);
        break;
    }
}