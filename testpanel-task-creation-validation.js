// Validation Test for TestPanelNew Task Creation Functionality
// This script tests the specific task creation logic used in TestPanelNew.tsx

const { ApolloClient, InMemoryCache, createHttpLink, gql } = require('@apollo/client');

// Apollo Client setup (same as TestPanelNew.tsx)
const httpLink = createHttpLink({
    uri: 'http://localhost:4000/graphql',
    headers: {
        'authorization': 'admin'
    }
});

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'network-only',
        },
        query: {
            fetchPolicy: 'network-only',
        },
    },
});

// GraphQL queries (matching TestPanelNew.tsx)
const PRODUCTS = gql`
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
            level
            isActive
            description
          }
          outcomes {
            id
            name
            description
          }
          tasks(first: 50) {
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
                sequenceNumber
              }
            }
          }
        }
      }
    }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      statusPercent
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
      productId
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
      licenseLevel
      priority
      notes
      sequenceNumber
      product {
        id
        name
      }
    }
  }
`;

class TestPanelTaskCreationValidator {
    constructor() {
        this.results = [];
        this.testProduct = null;
    }

    log(message, testName = 'ValidationTest') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${testName}] ${message}`);
    }

    addResult(testName, success, message, details = {}) {
        this.results.push({
            testName,
            success,
            message,
            details,
            timestamp: new Date().toISOString()
        });
    }

    async run() {
        console.log('🧪 === TESTPANEL TASK CREATION VALIDATION ===');
        console.log('This validates the exact logic used in TestPanelNew.tsx component\n');

        try {
            // Test 1: Connection
            await this.testConnection();

            // Test 2: Create fresh product (like comprehensive test)
            await this.createFreshTestProduct();

            // Test 3: Simulate TestPanelNew task creation logic
            await this.simulateTestPanelTaskCreation();

            // Test 4: Verify results
            this.generateReport();

        } catch (error) {
            console.error('❌ Validation failed:', error.message);
        }
    }

    async testConnection() {
        try {
            const result = await client.query({ query: PRODUCTS });
            const products = result.data.products.edges.map(edge => edge.node);
            this.addResult('Connection', true, `Connected to GraphQL, found ${products.length} products`);
            this.log(`✅ Connected to GraphQL server, found ${products.length} products`);
        } catch (error) {
            this.addResult('Connection', false, `Connection failed: ${error.message}`);
            throw error;
        }
    }

    async createFreshTestProduct() {
        try {
            const timestamp = Date.now();
            const productData = {
                name: `TestPanel Validation Product ${timestamp}`,
                description: `Product created for TestPanelNew validation at ${new Date().toLocaleString()}`,
                customAttrs: {
                    testCreated: true,
                    createdBy: 'TestPanelValidator',
                    timestamp,
                    validationTest: true
                }
            };

            const createResult = await client.mutate({
                mutation: CREATE_PRODUCT,
                variables: { input: productData }
            });

            this.testProduct = createResult.data.createProduct;
            this.addResult('ProductCreation', true, `Created validation product: ${this.testProduct.name}`);
            this.log(`✅ Created fresh test product: ${this.testProduct.name} (ID: ${this.testProduct.id})`);

        } catch (error) {
            this.addResult('ProductCreation', false, `Product creation failed: ${error.message}`);
            throw error;
        }
    }

    async simulateTestPanelTaskCreation() {
        try {
            if (!this.testProduct) {
                throw new Error('Test product not available');
            }

            this.log('🧪 Simulating TestPanelNew.tsx task creation logic...');

            // This mirrors the exact logic from simulateTaskCreation() in TestPanelNew.tsx
            const targetProduct = this.testProduct;

            // Determine valid license level for this product (exact TestPanelNew logic)
            let validLicenseLevel = 'Essential'; // Default
            if (targetProduct.licenses && targetProduct.licenses.length > 0) {
                // Find the lowest level license (typically Essential = level 1)
                const sortedLicenses = [...targetProduct.licenses].sort((a, b) => a.level - b.level);
                const lowestLicense = sortedLicenses[0];

                // Map license levels to GraphQL enum values
                const levelToEnum = {
                    1: 'Essential',
                    2: 'Advantage',
                    3: 'Signature'
                };

                validLicenseLevel = levelToEnum[lowestLicense.level] || 'Essential';
                this.log(`🔐 Selected license level: ${validLicenseLevel} (level ${lowestLicense.level})`);
            } else {
                // No licenses exist for this product - create an Essential license first
                this.log(`🔐 No licenses found for product "${targetProduct.name}" - creating Essential license...`);
                try {
                    const licenseData = {
                        name: `Essential License for ${targetProduct.name}`,
                        description: `Essential-level license automatically created for task creation in product "${targetProduct.name}"`,
                        level: 1,
                        isActive: true,
                        productId: targetProduct.id
                    };

                    const licenseResult = await client.mutate({
                        mutation: CREATE_LICENSE,
                        variables: { input: licenseData }
                    });

                    const createdLicense = licenseResult.data.createLicense;
                    this.log(`✅ Essential license created: ${createdLicense.name} (ID: ${createdLicense.id})`);
                    validLicenseLevel = 'Essential';
                } catch (licenseError) {
                    this.log(`⚠️ Failed to create license, will attempt task creation without license level: ${licenseError.message}`);
                    // Continue with task creation, but remove licenseLevel to avoid validation error
                    validLicenseLevel = null;
                }
            }

            const testTaskData = {
                productId: targetProduct.id,
                name: `Test Task ${Date.now()}`,
                description: 'This is a test task created by the GUI Test Studio for validation purposes.',
                estMinutes: 120,
                weight: 5,
                priority: 'Medium',
                notes: 'Created by GUI Test Studio automated test'
            };

            // Only include licenseLevel if we have a valid one
            if (validLicenseLevel) {
                testTaskData.licenseLevel = validLicenseLevel;
            }

            this.log('📋 Task data prepared:');
            this.log(`   Product ID: ${testTaskData.productId}`);
            this.log(`   Name: ${testTaskData.name}`);
            this.log(`   Weight: ${testTaskData.weight}%`);
            this.log(`   Duration: ${testTaskData.estMinutes} minutes`);
            this.log(`   License Level: ${testTaskData.licenseLevel || 'None'}`);

            this.log('💾 Calling CREATE_TASK mutation...');
            const result = await client.mutate({
                mutation: CREATE_TASK,
                variables: { input: testTaskData }
            });

            const createdTask = result.data.createTask;
            this.log(`✅ Task created successfully: ${createdTask.name} (ID: ${createdTask.id})`);

            // Verify the task matches our input
            const matches = {
                name: createdTask.name === testTaskData.name,
                productId: createdTask.product.id === testTaskData.productId,
                weight: createdTask.weight === testTaskData.weight,
                estMinutes: createdTask.estMinutes === testTaskData.estMinutes,
                licenseLevel: createdTask.licenseLevel === testTaskData.licenseLevel,
                priority: createdTask.priority === testTaskData.priority
            };

            const allMatch = Object.values(matches).every(m => m);

            if (allMatch) {
                this.addResult('TaskCreation', true, `Task creation successful and data integrity verified`);
                this.log('✅ Task creation PASSED - All data fields match expected values');
            } else {
                const mismatches = Object.entries(matches).filter(([_, match]) => !match);
                this.addResult('TaskCreation', false, `Task created but data mismatches: ${mismatches.map(([field]) => field).join(', ')}`);
                this.log(`⚠️ Task created but data integrity issues: ${mismatches.map(([field]) => field).join(', ')}`);
            }

            // Test cache clearing and visibility (like TestPanelNew does)
            this.log('🧹 Testing cache clearing and visibility...');
            await client.clearStore();

            // Verify visibility
            const refreshResult = await client.query({ query: PRODUCTS });
            const products = refreshResult.data.products.edges.map(edge => edge.node);
            const updatedProduct = products.find(p => p.id === this.testProduct.id);

            if (updatedProduct) {
                const taskFound = updatedProduct.tasks.edges.find(edge => edge.node.id === createdTask.id);
                if (taskFound) {
                    this.addResult('Visibility', true, 'Task visible after cache clear and refetch');
                    this.log('✅ Task visibility verified - found in refreshed product data');
                } else {
                    this.addResult('Visibility', false, 'Task not found after cache clear');
                    this.log('❌ Task visibility failed - not found in refreshed data');
                }
            } else {
                this.addResult('Visibility', false, 'Product not found after refresh');
                this.log('❌ Product not found after refresh');
            }

        } catch (error) {
            this.addResult('TaskCreation', false, `Task creation failed: ${error.message}`);
            this.log(`❌ Task creation failed: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n🎯 === VALIDATION REPORT ===');

        const passed = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);

        console.log(`📊 Test Summary:`);
        console.log(`   Total Tests: ${this.results.length}`);
        console.log(`   Passed: ${passed.length} ✅`);
        console.log(`   Failed: ${failed.length} ❌`);
        console.log(`   Success Rate: ${((passed.length / this.results.length) * 100).toFixed(1)}%`);

        if (failed.length > 0) {
            console.log('\n❌ Failed Tests:');
            failed.forEach(r => {
                console.log(`   - ${r.testName}: ${r.message}`);
            });
        }

        if (passed.length > 0) {
            console.log('\n✅ Passed Tests:');
            passed.forEach(r => {
                console.log(`   - ${r.testName}: ${r.message}`);
            });
        }

        // Overall assessment
        const successRate = (passed.length / this.results.length) * 100;
        console.log('\n🔍 Overall Assessment:');
        if (successRate >= 100) {
            console.log('🎉 EXCELLENT: TestPanelNew task creation is fully functional!');
        } else if (successRate >= 75) {
            console.log('✅ GOOD: TestPanelNew task creation is working well with minor issues');
        } else if (successRate >= 50) {
            console.log('⚠️  FAIR: TestPanelNew task creation has some issues that need attention');
        } else {
            console.log('❌ POOR: TestPanelNew task creation has significant problems');
        }

        console.log('\n🏁 === VALIDATION COMPLETED ===');
    }
}

// Run the validation
async function runValidation() {
    const validator = new TestPanelTaskCreationValidator();
    await validator.run();
}

runValidation().catch(console.error);
