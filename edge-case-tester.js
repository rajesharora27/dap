#!/usr/bin/env node

// Comprehensive test runner to test edge cases and potential failure scenarios

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

// Additional GraphQL operations
const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
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

const QUEUE_TASK_DELETION = gql`
  mutation QueueTaskSoftDelete($id: ID!) {
    queueTaskSoftDelete(id: $id)
  }
`;

const PROCESS_DELETION_QUEUE = gql`
  mutation ProcessDeletionQueue {
    processDeletionQueue
  }
`;

const GET_PRODUCTS_WITH_DETAILS = gql`
  query GetProducts {
    products {
      edges {
        node {
          id
          name
          description
          customAttrs
          licenses {
            id
            name
            level
            isActive
          }
          outcomes {
            id
            name
            description
          }
          tasks {
            edges {
              node {
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
          }
        }
      }
    }
  }
`;

// Test functions for edge cases
async function testTaskDeletion(taskId) {
    console.log('🗑️ Testing Task Deletion (Soft Delete)...');
    try {
        // First try queuing the task for deletion
        console.log(`Queuing task ${taskId} for soft deletion...`);
        const queueResult = await client.mutate({
            mutation: QUEUE_TASK_DELETION,
            variables: { id: taskId }
        });

        console.log('✅ Task queued for deletion:', queueResult.data.queueTaskSoftDelete);

        // Then process the deletion queue
        console.log('Processing deletion queue...');
        const processResult = await client.mutate({
            mutation: PROCESS_DELETION_QUEUE
        });

        console.log('✅ Deletion queue processed:', processResult.data.processDeletionQueue);
        return true;
    } catch (error) {
        console.error('❌ Task deletion failed:', error.message);
        return false;
    }
}

async function testTaskUpdate(taskId, productId) {
    console.log('✏️ Testing Task Update...');
    try {
        const result = await client.mutate({
            mutation: UPDATE_TASK,
            variables: {
                id: taskId,
                input: {
                    name: `Updated Task ${Date.now()}`,
                    description: 'This task has been updated by the CLI test runner',
                    estMinutes: 180,
                    weight: 15,
                    priority: 'High',
                    licenseLevel: 'Advantage',
                    notes: 'Updated by CLI edge case tester'
                }
            }
        });

        console.log('✅ Task updated successfully:', result.data.updateTask.name);
        return result.data.updateTask;
    } catch (error) {
        console.error('❌ Task update failed:', error.message);
        return null;
    }
}

async function testProductDeletion(productId) {
    console.log('🗂️ Testing Product Deletion...');
    try {
        const result = await client.mutate({
            mutation: DELETE_PRODUCT,
            variables: { id: productId }
        });

        console.log('✅ Product deleted successfully:', result.data.deleteProduct);
        return true;
    } catch (error) {
        console.error('❌ Product deletion failed:', error.message);
        return false;
    }
}

async function testLicenseValidation() {
    console.log('🔐 Testing License Validation Scenarios...');

    try {
        // Create a product first
        const CREATE_PRODUCT = gql`
      mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
          id
          name
          description
          customAttrs
        }
      }
    `;

        const productResult = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `License Test Product ${Date.now()}`,
                    description: 'Product for testing license validation',
                    customAttrs: { testType: 'license-validation' }
                }
            }
        });

        const product = productResult.data.createProduct;
        console.log(`✅ Created test product: ${product.name}`);

        // Create license with level 1 (Essential)
        const CREATE_LICENSE = gql`
      mutation CreateLicense($input: LicenseInput!) {
        createLicense(input: $input) {
          id
          name
          description
          level
          isActive
        }
      }
    `;

        const licenseResult = await client.mutate({
            mutation: CREATE_LICENSE,
            variables: {
                input: {
                    name: `Essential License ${Date.now()}`,
                    description: 'Essential level license for testing',
                    level: 1,
                    isActive: true,
                    productId: product.id
                }
            }
        });

        const license = licenseResult.data.createLicense;
        console.log(`✅ Created license: ${license.name} (Level: ${license.level})`);

        // Try to create a task that requires a higher license level than available
        console.log('🧪 Testing task creation with invalid license level...');
        const CREATE_TASK = gql`
      mutation CreateTask($input: TaskInput!) {
        createTask(input: $input) {
          id
          name
          description
          licenseLevel
        }
      }
    `;

        try {
            const taskResult = await client.mutate({
                mutation: CREATE_TASK,
                variables: {
                    input: {
                        name: `Invalid License Task ${Date.now()}`,
                        description: 'Task requiring higher license than available',
                        estMinutes: 60,
                        weight: 5,
                        priority: 'Medium',
                        licenseLevel: 'Signature', // Level 3, but product only has level 1
                        notes: 'Should fail due to license validation',
                        productId: product.id
                    }
                }
            });

            console.log('⚠️ Task created unexpectedly - license validation may not be working:', taskResult.data.createTask.name);
            return { success: false, message: 'License validation not enforced' };

        } catch (error) {
            console.log('✅ License validation working - task creation rejected:', error.message);
            return { success: true, message: 'License validation properly enforced' };
        }

    } catch (error) {
        console.error('❌ License validation test failed:', error.message);
        return { success: false, message: error.message };
    }
}

async function testWeightAllocation() {
    console.log('⚖️ Testing Weight Allocation Scenarios...');

    try {
        // Create a product first
        const CREATE_PRODUCT = gql`
      mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
          id
          name
          description
          customAttrs
        }
      }
    `;

        const productResult = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `Weight Test Product ${Date.now()}`,
                    description: 'Product for testing weight allocation',
                    customAttrs: { testType: 'weight-validation' }
                }
            }
        });

        const product = productResult.data.createProduct;
        console.log(`✅ Created test product: ${product.name}`);

        // Create license for the product
        const CREATE_LICENSE = gql`
      mutation CreateLicense($input: LicenseInput!) {
        createLicense(input: $input) {
          id
          name
          description
          level
          isActive
        }
      }
    `;

        const licenseResult = await client.mutate({
            mutation: CREATE_LICENSE,
            variables: {
                input: {
                    name: `Weight Test License ${Date.now()}`,
                    description: 'License for weight testing',
                    level: 1,
                    isActive: true,
                    productId: product.id
                }
            }
        });

        console.log(`✅ Created license for weight testing`);

        // Try to create tasks that exceed 100% weight
        const CREATE_TASK = gql`
      mutation CreateTask($input: TaskInput!) {
        createTask(input: $input) {
          id
          name
          weight
        }
      }
    `;

        const tasks = [];

        // Create tasks totaling 95% weight
        for (let i = 1; i <= 3; i++) {
            const weight = i === 3 ? 35 : 30; // 30 + 30 + 35 = 95%

            try {
                const taskResult = await client.mutate({
                    mutation: CREATE_TASK,
                    variables: {
                        input: {
                            name: `Weight Test Task ${i} - ${Date.now()}`,
                            description: `Task ${i} for weight testing`,
                            estMinutes: 60,
                            weight: weight,
                            priority: 'Medium',
                            licenseLevel: 'Essential',
                            notes: `Weight allocation test task ${i}`,
                            productId: product.id
                        }
                    }
                });

                tasks.push(taskResult.data.createTask);
                console.log(`✅ Created task ${i} with ${weight}% weight`);

            } catch (error) {
                console.error(`❌ Failed to create task ${i} with ${weight}% weight:`, error.message);
                break;
            }
        }

        // Now try to create a task that would exceed 100%
        console.log('🧪 Testing weight validation - attempting to exceed 100%...');
        try {
            const invalidTaskResult = await client.mutate({
                mutation: CREATE_TASK,
                variables: {
                    input: {
                        name: `Invalid Weight Task ${Date.now()}`,
                        description: 'Task that should exceed weight limit',
                        estMinutes: 60,
                        weight: 10, // This would make total 105%
                        priority: 'Medium',
                        licenseLevel: 'Essential',
                        notes: 'Should fail due to weight validation',
                        productId: product.id
                    }
                }
            });

            console.log('⚠️ Task created unexpectedly - weight validation may not be working:', invalidTaskResult.data.createTask.name);
            return { success: false, message: 'Weight validation not enforced' };

        } catch (error) {
            console.log('✅ Weight validation working - task creation rejected:', error.message);
            return { success: true, message: 'Weight validation properly enforced' };
        }

    } catch (error) {
        console.error('❌ Weight validation test failed:', error.message);
        return { success: false, message: error.message };
    }
}

// Main comprehensive test runner
async function runComprehensiveTests() {
    console.log('🔬 Starting Comprehensive Edge Case Testing...\n');

    const results = {
        basic: false,
        taskDeletion: false,
        taskUpdate: false,
        productDeletion: false,
        licenseValidation: false,
        weightValidation: false
    };

    try {
        // First, run basic CRUD to get test entities
        console.log('=== Basic CRUD Setup ===');

        const CREATE_PRODUCT = gql`
      mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
          id
          name
          description
          customAttrs
        }
      }
    `;

        const CREATE_LICENSE = gql`
      mutation CreateLicense($input: LicenseInput!) {
        createLicense(input: $input) {
          id
          name
          description
          level
          isActive
        }
      }
    `;

        const CREATE_TASK = gql`
      mutation CreateTask($input: TaskInput!) {
        createTask(input: $input) {
          id
          name
          description
          estMinutes
          weight
          priority
          licenseLevel
          notes
        }
      }
    `;

        // Create test product
        const productResult = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
                input: {
                    name: `Edge Test Product ${Date.now()}`,
                    description: 'Product for edge case testing',
                    customAttrs: { testType: 'edge-cases' }
                }
            }
        });

        const product = productResult.data.createProduct;
        console.log(`✅ Created test product: ${product.name}`);

        // Create license
        const licenseResult = await client.mutate({
            mutation: CREATE_LICENSE,
            variables: {
                input: {
                    name: `Edge Test License ${Date.now()}`,
                    description: 'License for edge case testing',
                    level: 2, // Advantage level
                    isActive: true,
                    productId: product.id
                }
            }
        });

        console.log(`✅ Created license with level ${licenseResult.data.createLicense.level}`);

        // Create task
        const taskResult = await client.mutate({
            mutation: CREATE_TASK,
            variables: {
                input: {
                    name: `Edge Test Task ${Date.now()}`,
                    description: 'Task for edge case testing',
                    estMinutes: 120,
                    weight: 10,
                    priority: 'Medium',
                    licenseLevel: 'Advantage',
                    notes: 'Created for edge case testing',
                    productId: product.id
                }
            }
        });

        const task = taskResult.data.createTask;
        console.log(`✅ Created test task: ${task.name}\n`);

        results.basic = true;

        // Test task update
        console.log('=== Task Update Test ===');
        const updatedTask = await testTaskUpdate(task.id, product.id);
        results.taskUpdate = updatedTask !== null;
        console.log('');

        // Test task deletion
        console.log('=== Task Deletion Test ===');
        results.taskDeletion = await testTaskDeletion(task.id);
        console.log('');

        // Test license validation
        console.log('=== License Validation Test ===');
        const licenseTest = await testLicenseValidation();
        results.licenseValidation = licenseTest.success;
        console.log(`License validation result: ${licenseTest.message}\n`);

        // Test weight validation
        console.log('=== Weight Validation Test ===');
        const weightTest = await testWeightAllocation();
        results.weightValidation = weightTest.success;
        console.log(`Weight validation result: ${weightTest.message}\n`);

        // Test product deletion (cleanup)
        console.log('=== Product Deletion Test ===');
        results.productDeletion = await testProductDeletion(product.id);
        console.log('');

        // Summary
        console.log('=== Test Results Summary ===');
        console.log(`✅ Basic CRUD: ${results.basic ? 'PASSED' : 'FAILED'}`);
        console.log(`${results.taskUpdate ? '✅' : '❌'} Task Update: ${results.taskUpdate ? 'PASSED' : 'FAILED'}`);
        console.log(`${results.taskDeletion ? '✅' : '❌'} Task Deletion: ${results.taskDeletion ? 'PASSED' : 'FAILED'}`);
        console.log(`${results.productDeletion ? '✅' : '❌'} Product Deletion: ${results.productDeletion ? 'PASSED' : 'FAILED'}`);
        console.log(`${results.licenseValidation ? '✅' : '❌'} License Validation: ${results.licenseValidation ? 'PASSED' : 'FAILED'}`);
        console.log(`${results.weightValidation ? '✅' : '❌'} Weight Validation: ${results.weightValidation ? 'PASSED' : 'FAILED'}`);

        const passedTests = Object.values(results).filter(r => r).length;
        const totalTests = Object.keys(results).length;

        console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

        if (passedTests === totalTests) {
            console.log('🎉 All comprehensive tests PASSED!');
        } else {
            console.log(`⚠️ ${totalTests - passedTests} tests FAILED. Investigation needed.`);
        }

    } catch (error) {
        console.error('💥 Comprehensive test suite failed:', error.message);
        process.exit(1);
    }
}

// Run the comprehensive tests
runComprehensiveTests();
