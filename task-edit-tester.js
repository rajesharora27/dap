#!/usr/bin/env node

// Test to reproduce the specific "edit task is failing" issue

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

const GET_TASK_DETAILS = gql`
  query GetTaskDetails($id: ID!) {
    task(id: $id) {
      id
      name
      description
      estMinutes
      weight
      licenseLevel
      priority
      notes
      product {
        id
        name
        licenses {
          id
          name
          level
          isActive
        }
      }
    }
  }
`;

const GET_PRODUCTS = gql`
  query GetProducts {
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
                weight
                priority
              }
            }
          }
        }
      }
    }
  }
`;

async function testTaskEditScenarios() {
    console.log('🔧 Testing Task Edit Scenarios...\n');

    try {
        // Get products with tasks
        const result = await client.query({
            query: GET_PRODUCTS,
            fetchPolicy: 'network-only'
        });

        const products = result.data.products.edges.map(edge => edge.node);
        const productsWithTasks = products.filter(p => p.tasks.edges.length > 0);

        if (productsWithTasks.length === 0) {
            console.log('❌ No products with tasks found for testing');
            return false;
        }

        let testResults = [];

        for (let i = 0; i < Math.min(3, productsWithTasks.length); i++) {
            const product = productsWithTasks[i];
            const task = product.tasks.edges[0].node;

            console.log(`\n=== Test ${i + 1}: Editing task in ${product.name} ===`);
            console.log(`Task: ${task.name}`);
            console.log(`Current License Level: ${task.licenseLevel}`);
            console.log(`Available Product Licenses: ${product.licenses.map(l => `${l.level}(${l.name.split(' - ')[1] || 'Unknown'})`).join(', ')}`);

            // Scenario 1: Edit with same license level (should always work)
            console.log('\n📝 Scenario 1: Edit with SAME license level...');
            try {
                const sameResult = await client.mutate({
                    mutation: UPDATE_TASK,
                    variables: {
                        id: task.id,
                        input: {
                            name: `${task.name} - SAME LICENSE TEST`,
                            description: 'Test edit with same license level',
                            estMinutes: task.estMinutes || 120,
                            weight: task.weight || 10,
                            priority: task.priority || 'Medium',
                            licenseLevel: task.licenseLevel, // Keep same license level
                            notes: 'Edited with same license level'
                        }
                    }
                });

                console.log(`   ✅ SUCCESS: Task updated with same license level (${sameResult.data.updateTask.licenseLevel})`);
                testResults.push({ test: `Product ${i + 1} - Same License`, result: 'PASS' });

            } catch (error) {
                console.log(`   ❌ FAILED: Task edit with same license level failed: ${error.message}`);
                testResults.push({ test: `Product ${i + 1} - Same License`, result: 'FAIL', error: error.message });
            }

            // Scenario 2: Edit with different valid license level
            const availableLevels = product.licenses
                .filter(license => license.isActive)
                .map(license => license.level);

            const levelToName = { 1: 'Essential', 2: 'Advantage', 3: 'Signature' };
            const nameToLevel = { 'Essential': 1, 'Advantage': 2, 'Signature': 3 };

            const currentLevel = nameToLevel[task.licenseLevel] || 1;
            const differentValidLevel = availableLevels.find(level => level !== currentLevel);

            if (differentValidLevel) {
                console.log('\n📝 Scenario 2: Edit with DIFFERENT valid license level...');
                const differentLicenseName = levelToName[differentValidLevel];
                console.log(`   Changing from ${task.licenseLevel} to ${differentLicenseName}`);

                try {
                    const differentResult = await client.mutate({
                        mutation: UPDATE_TASK,
                        variables: {
                            id: task.id,
                            input: {
                                name: `${task.name} - DIFFERENT LICENSE TEST`,
                                description: 'Test edit with different valid license level',
                                estMinutes: task.estMinutes || 120,
                                weight: task.weight || 10,
                                priority: task.priority || 'Medium',
                                licenseLevel: differentLicenseName,
                                notes: 'Edited with different valid license level'
                            }
                        }
                    });

                    console.log(`   ✅ SUCCESS: Task updated with different valid license level (${differentResult.data.updateTask.licenseLevel})`);
                    testResults.push({ test: `Product ${i + 1} - Different Valid License`, result: 'PASS' });

                } catch (error) {
                    console.log(`   ❌ FAILED: Task edit with different valid license failed: ${error.message}`);
                    testResults.push({ test: `Product ${i + 1} - Different Valid License`, result: 'FAIL', error: error.message });
                }
            } else {
                console.log('\n📝 Scenario 2: SKIPPED - Product only has one license level');
                testResults.push({ test: `Product ${i + 1} - Different Valid License`, result: 'SKIPPED' });
            }

            // Scenario 3: Edit with invalid license level (if product doesn't have all levels)
            const allLevels = [1, 2, 3];
            const invalidLevel = allLevels.find(level => !availableLevels.includes(level));

            if (invalidLevel) {
                console.log('\n📝 Scenario 3: Edit with INVALID license level...');
                const invalidLicenseName = levelToName[invalidLevel];
                console.log(`   Attempting invalid license level: ${invalidLicenseName}`);

                try {
                    const invalidResult = await client.mutate({
                        mutation: UPDATE_TASK,
                        variables: {
                            id: task.id,
                            input: {
                                name: `${task.name} - INVALID LICENSE TEST`,
                                description: 'Test edit with invalid license level',
                                estMinutes: task.estMinutes || 120,
                                weight: task.weight || 10,
                                priority: task.priority || 'Medium',
                                licenseLevel: invalidLicenseName,
                                notes: 'Attempted edit with invalid license level'
                            }
                        }
                    });

                    console.log(`   ⚠️ UNEXPECTED SUCCESS: Task updated with invalid license level (${invalidResult.data.updateTask.licenseLevel}) - Validation may be broken!`);
                    testResults.push({ test: `Product ${i + 1} - Invalid License`, result: 'FAIL', error: 'Validation not working' });

                } catch (error) {
                    console.log(`   ✅ EXPECTED FAILURE: Task edit with invalid license properly rejected: ${error.message}`);
                    testResults.push({ test: `Product ${i + 1} - Invalid License`, result: 'PASS' });
                }
            } else {
                console.log('\n📝 Scenario 3: SKIPPED - Product has all license levels');
                testResults.push({ test: `Product ${i + 1} - Invalid License`, result: 'SKIPPED' });
            }
        }

        // Summary
        console.log('\n=== Test Results Summary ===');
        console.log('Test                                  | Result | Details');
        console.log('--------------------------------------|--------|--------');

        let passCount = 0;
        let failCount = 0;

        for (const result of testResults) {
            const status = result.result === 'PASS' ? '✅' : result.result === 'FAIL' ? '❌' : '⏭️';
            const details = result.error ? `Error: ${result.error}` : '';
            console.log(`${result.test.padEnd(38)}| ${status} ${result.result.padEnd(4)} | ${details}`);

            if (result.result === 'PASS') passCount++;
            if (result.result === 'FAIL') failCount++;
        }

        console.log(`\n📊 Overall: ${passCount} passed, ${failCount} failed, ${testResults.length - passCount - failCount} skipped`);

        if (failCount === 0) {
            console.log('🎉 All task edit tests passed!');
            return true;
        } else {
            console.log(`⚠️ ${failCount} task edit tests failed - investigation needed!`);
            return false;
        }

    } catch (error) {
        console.error('❌ Task edit testing failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Task Edit Failure Investigation\n');

    const success = await testTaskEditScenarios();

    console.log('\n=== Investigation Complete ===');
    if (success) {
        console.log('✅ No issues found with task editing and license validation');
    } else {
        console.log('❌ Issues found with task editing - see details above');
    }
}

// Run the test
main();
