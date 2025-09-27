#!/usr/bin/env node

// Focused test to identify license-task mismatch issues in test data

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client');
const fetch = require('cross-fetch');

const httpLink = createHttpLink({
    uri: 'http://localhost:4000/graphql',
    fetch: fetch,
    headers: {
        'Authorization': 'admin'
    }
});

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache()
});

const GET_PRODUCTS_DETAILED = gql`
  query GetProductsDetailed {
    products {
      edges {
        node {
          id
          name
          licenses {
            id
            name
            level
            isActive
          }
          tasks {
            edges {
              node {
                id
                name
                licenseLevel
              }
            }
          }
        }
      }
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      name
      description
      estMinutes
      weight
      licenseLevel
      priority
      notes
    }
  }
`;

// Function to map license levels
function licenseLevelToNumber(levelString) {
    const mapping = {
        'Essential': 1,
        'Advantage': 2,
        'Signature': 3
    };
    return mapping[levelString] || 0;
}

function numberToLicenseLevel(levelNumber) {
    const mapping = {
        1: 'Essential',
        2: 'Advantage',
        3: 'Signature'
    };
    return mapping[levelNumber] || 'Unknown';
}

async function analyzeCurrentData() {
    console.log('🔍 Analyzing current license-task relationships...\n');

    try {
        const result = await client.query({
            query: GET_PRODUCTS_DETAILED,
            fetchPolicy: 'network-only'
        });

        const products = result.data.products.edges.map(edge => edge.node);

        let totalMismatches = 0;
        let totalTasks = 0;

        for (const product of products) {
            console.log(`\n📦 Product: ${product.name}`);

            // Get available license levels for this product
            const availableLevels = product.licenses
                .filter(license => license.isActive)
                .map(license => license.level)
                .sort((a, b) => a - b);

            console.log(`   🔐 Available License Levels: ${availableLevels.map(l => `${l}(${numberToLicenseLevel(l)})`).join(', ')}`);

            // Check each task
            const tasks = product.tasks.edges.map(edge => edge.node);
            totalTasks += tasks.length;

            console.log(`   📋 Tasks (${tasks.length}):`);

            for (const task of tasks) {
                const taskLicenseLevel = licenseLevelToNumber(task.licenseLevel);
                const hasMatchingLicense = availableLevels.includes(taskLicenseLevel);

                const status = hasMatchingLicense ? '✅' : '❌';
                console.log(`      ${status} ${task.name} - requires ${task.licenseLevel}(${taskLicenseLevel})`);

                if (!hasMatchingLicense) {
                    totalMismatches++;
                    console.log(`         ⚠️  MISMATCH: Task requires level ${taskLicenseLevel} but product only has levels [${availableLevels.join(', ')}]`);
                }
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Total products analyzed: ${products.length}`);
        console.log(`   Total tasks analyzed: ${totalTasks}`);
        console.log(`   Total mismatches found: ${totalMismatches}`);

        if (totalMismatches === 0) {
            console.log('   🎉 No license-task mismatches found!');
        } else {
            console.log(`   ⚠️  ${totalMismatches} license-task mismatches found!`);
        }

        return { totalMismatches, products };

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        throw error;
    }
}

async function testTaskEditWithValidLicense() {
    console.log('\n🧪 Testing task edit with license validation...\n');

    try {
        // Get a product with multiple license levels and a task to edit
        const result = await client.query({
            query: GET_PRODUCTS_DETAILED,
            fetchPolicy: 'network-only'
        });

        const products = result.data.products.edges.map(edge => edge.node);

        // Find a product with tasks to edit
        const productWithTasks = products.find(p => p.tasks.edges.length > 0);

        if (!productWithTasks) {
            console.log('❌ No products with tasks found for testing');
            return false;
        }

        const task = productWithTasks.tasks.edges[0].node;
        const availableLevels = productWithTasks.licenses
            .filter(license => license.isActive)
            .map(license => license.level)
            .sort((a, b) => a - b);

        console.log(`📦 Testing with product: ${productWithTasks.name}`);
        console.log(`📋 Testing with task: ${task.name}`);
        console.log(`🔐 Available license levels: ${availableLevels.map(l => numberToLicenseLevel(l)).join(', ')}`);

        // Test 1: Update with VALID license level
        console.log('\n🧪 Test 1: Updating task with VALID license level...');

        const validLevel = numberToLicenseLevel(availableLevels[0]); // Use the first available level
        console.log(`   Attempting to use license level: ${validLevel}`);

        try {
            const updateResult = await client.mutate({
                mutation: UPDATE_TASK,
                variables: {
                    id: task.id,
                    input: {
                        name: `${task.name} - EDITED VALID`,
                        description: 'Task edited with valid license level',
                        estMinutes: 180,
                        weight: 15,
                        priority: 'High',
                        licenseLevel: validLevel,
                        notes: 'Updated with valid license level'
                    }
                }
            });

            console.log(`   ✅ Task update succeeded with valid license: ${updateResult.data.updateTask.licenseLevel}`);

        } catch (error) {
            console.log(`   ❌ Task update failed unexpectedly with valid license: ${error.message}`);
            return false;
        }

        // Test 2: Update with INVALID license level (if possible)
        if (availableLevels.length < 3) {
            console.log('\n🧪 Test 2: Updating task with INVALID license level...');

            // Find a license level that doesn't exist for this product
            const allLevels = [1, 2, 3];
            const invalidLevel = allLevels.find(level => !availableLevels.includes(level));

            if (invalidLevel) {
                const invalidLevelString = numberToLicenseLevel(invalidLevel);
                console.log(`   Attempting to use invalid license level: ${invalidLevelString}`);

                try {
                    const invalidUpdateResult = await client.mutate({
                        mutation: UPDATE_TASK,
                        variables: {
                            id: task.id,
                            input: {
                                name: `${task.name} - EDITED INVALID`,
                                description: 'Task edited with invalid license level',
                                estMinutes: 180,
                                weight: 15,
                                priority: 'High',
                                licenseLevel: invalidLevelString,
                                notes: 'Updated with invalid license level'
                            }
                        }
                    });

                    console.log(`   ⚠️ Task update succeeded unexpectedly with invalid license: ${invalidUpdateResult.data.updateTask.licenseLevel}`);
                    console.log(`   🚨 License validation may not be working properly!`);
                    return false;

                } catch (error) {
                    console.log(`   ✅ Task update properly rejected invalid license: ${error.message}`);
                }
            } else {
                console.log('   ℹ️ Product has all license levels, cannot test invalid license');
            }
        } else {
            console.log('   ℹ️ Product has all license levels, skipping invalid license test');
        }

        return true;

    } catch (error) {
        console.error('❌ Task edit test failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 License-Task Mismatch Analyzer\n');

    try {
        // Step 1: Analyze current data
        const analysisResult = await analyzeCurrentData();

        // Step 2: Test task editing with license validation
        const editTestResult = await testTaskEditWithValidLicense();

        // Step 3: Summary
        console.log('\n=== Final Results ===');
        console.log(`Data Analysis: ${analysisResult.totalMismatches === 0 ? '✅ PASSED' : '❌ FAILED'} (${analysisResult.totalMismatches} mismatches)`);
        console.log(`Edit Test: ${editTestResult ? '✅ PASSED' : '❌ FAILED'}`);

        if (analysisResult.totalMismatches === 0 && editTestResult) {
            console.log('\n🎉 All license-task relationships are correct and validation is working!');
        } else {
            console.log('\n⚠️ Issues found with license-task relationships or validation!');
        }

    } catch (error) {
        console.error('💥 Analysis failed:', error.message);
        process.exit(1);
    }
}

// Run the analysis
main();
