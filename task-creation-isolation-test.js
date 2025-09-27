// Targeted Task Creation Test Isolation
// This tests specific scenarios to identify the exact failure pattern

const { ApolloClient, InMemoryCache, createHttpLink, gql } = require('@apollo/client');

// Apollo Client setup
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

class TaskCreationIsolationTester {
    constructor() {
        this.results = [];
    }

    log(message, testName = 'IsolationTest') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${testName}] ${message}`);
    }

    addResult(testName, success, message) {
        this.results.push({
            testName,
            success,
            message,
            timestamp: new Date().toISOString()
        });
    }

    async run() {
        console.log('🎯 === TASK CREATION ISOLATION TESTING ===');
        console.log('Testing specific isolation scenarios to identify failure patterns\n');

        try {
            // Test 1: Single task creation (baseline)
            await this.testSingleTaskCreation();

            // Test 2: Sequential task creation on same product
            await this.testSequentialTaskCreation();

            // Test 3: Task creation after environment setup (like comprehensive suite)
            await this.testAfterEnvironmentSetup();

            // Test 4: Task creation with existing products (no fresh creation)
            await this.testWithExistingProducts();

            // Test 5: Rapid succession task creation
            await this.testRapidSuccessionCreation();

            this.generateIsolationReport();

        } catch (error) {
            console.error('❌ Isolation testing failed:', error.message);
        }
    }

    async createTestProduct(name) {
        const timestamp = Date.now();
        const productData = {
            name: `${name} ${timestamp}`,
            description: `Product for isolation testing: ${name}`,
            customAttrs: { testCreated: true, isolationTest: true, timestamp }
        };

        const productResult = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: { input: productData }
        });

        const product = productResult.data.createProduct;

        // Create Essential license
        const licenseData = {
            name: `Essential License for ${product.name}`,
            level: 1,
            isActive: true,
            productId: product.id
        };

        await client.mutate({
            mutation: CREATE_LICENSE,
            variables: { input: licenseData }
        });

        return product;
    }

    async createTask(product, taskName) {
        const taskData = {
            productId: product.id,
            name: `${taskName} ${Date.now()}`,
            description: `Isolation test task: ${taskName}`,
            estMinutes: 60,
            weight: 2,
            licenseLevel: 'Essential',
            priority: 'Medium',
            notes: `Created during isolation testing for: ${taskName}`
        };

        const result = await client.mutate({
            mutation: CREATE_TASK,
            variables: { input: taskData }
        });

        return result.data.createTask;
    }

    async testSingleTaskCreation() {
        const testName = 'Single_Task_Creation';
        try {
            this.log('🔍 Testing single task creation (baseline)', testName);

            const product = await this.createTestProduct('Single Task Product');
            const task = await this.createTask(product, 'Single Task');

            this.addResult(testName, true, `Single task created successfully: ${task.name}`);
            this.log(`✅ Single task created successfully: ${task.name}`, testName);

        } catch (error) {
            this.addResult(testName, false, `Single task creation failed: ${error.message}`);
            this.log(`❌ Single task creation failed: ${error.message}`, testName);
        }
    }

    async testSequentialTaskCreation() {
        const testName = 'Sequential_Task_Creation';
        try {
            this.log('🔍 Testing sequential task creation on same product', testName);

            const product = await this.createTestProduct('Sequential Tasks Product');

            // Create multiple tasks in sequence
            const tasks = [];
            for (let i = 1; i <= 3; i++) {
                const task = await this.createTask(product, `Sequential Task ${i}`);
                tasks.push(task);
                this.log(`✅ Task ${i} created: ${task.name}`, testName);
            }

            this.addResult(testName, true, `Sequential creation successful: ${tasks.length} tasks created`);
            this.log(`✅ Sequential creation successful: ${tasks.length} tasks created`, testName);

        } catch (error) {
            this.addResult(testName, false, `Sequential task creation failed: ${error.message}`);
            this.log(`❌ Sequential task creation failed: ${error.message}`, testName);
        }
    }

    async testAfterEnvironmentSetup() {
        const testName = 'After_Environment_Setup';
        try {
            this.log('🔍 Testing task creation after comprehensive environment setup', testName);

            // Simulate comprehensive suite environment setup
            const products = [];
            for (let i = 1; i <= 3; i++) {
                const product = await this.createTestProduct(`Environment Product ${i}`);
                products.push(product);
            }

            // Clear cache like comprehensive suite does
            await client.clearStore();

            // Now try task creation
            const targetProduct = products[0]; // Use first product
            const task = await this.createTask(targetProduct, 'After Environment Setup Task');

            this.addResult(testName, true, `Task created after environment setup: ${task.name}`);
            this.log(`✅ Task created after environment setup: ${task.name}`, testName);

        } catch (error) {
            this.addResult(testName, false, `Task creation after environment setup failed: ${error.message}`);
            this.log(`❌ Task creation after environment setup failed: ${error.message}`, testName);
        }
    }

    async testWithExistingProducts() {
        const testName = 'With_Existing_Products';
        try {
            this.log('🔍 Testing task creation with existing products (no fresh creation)', testName);

            // Query existing products instead of creating fresh ones
            const PRODUCTS = gql`
              query Products {
                products {
                  edges {
                    node {
                      id
                      name
                      licenses {
                        id
                        level
                      }
                      tasks(first: 50) {
                        edges {
                          node {
                            id
                            weight
                          }
                        }
                      }
                    }
                  }
                }
              }
            `;

            const result = await client.query({ query: PRODUCTS });
            const products = result.data.products.edges.map(edge => edge.node);

            // Find a product with available capacity and licenses
            let suitableProduct = null;
            for (const product of products) {
                const usedWeight = product.tasks.edges.reduce((sum, edge) => sum + (edge.node.weight || 0), 0);
                const remainingWeight = 100 - usedWeight;
                const hasLicenses = product.licenses && product.licenses.length > 0;

                if (remainingWeight >= 5 && hasLicenses) {
                    suitableProduct = product;
                    this.log(`Found suitable existing product: ${product.name} (${remainingWeight}% capacity)`, testName);
                    break;
                }
            }

            if (!suitableProduct) {
                throw new Error('No existing products with sufficient capacity and licenses found');
            }

            const task = await this.createTask(suitableProduct, 'Existing Product Task');

            this.addResult(testName, true, `Task created with existing product: ${task.name}`);
            this.log(`✅ Task created with existing product: ${task.name}`, testName);

        } catch (error) {
            this.addResult(testName, false, `Task creation with existing products failed: ${error.message}`);
            this.log(`❌ Task creation with existing products failed: ${error.message}`, testName);
        }
    }

    async testRapidSuccessionCreation() {
        const testName = 'Rapid_Succession_Creation';
        try {
            this.log('🔍 Testing rapid succession task creation', testName);

            const product = await this.createTestProduct('Rapid Succession Product');

            // Create tasks in rapid succession (simulate concurrent-like behavior)
            const promises = [];

            // Create all promises first with delayed execution
            for (let i = 1; i <= 3; i++) {
                const delay = i * 50; // 50ms apart
                const promise = new Promise((resolve) => {
                    setTimeout(async () => {
                        try {
                            const result = await this.createTask(product, `Rapid Task ${i}`);
                            resolve({ success: true, result });
                        } catch (error) {
                            resolve({ success: false, error });
                        }
                    }, delay);
                });
                promises.push(promise);
            }

            // Wait for all to complete
            const results = await Promise.all(promises);
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            this.addResult(testName, successful > 0, `Rapid succession results: ${successful} successful, ${failed} failed`);
            this.log(`✅ Rapid succession results: ${successful} successful, ${failed} failed`, testName);

        } catch (error) {
            this.addResult(testName, false, `Rapid succession creation failed: ${error.message}`);
            this.log(`❌ Rapid succession creation failed: ${error.message}`, testName);
        }
    }

    generateIsolationReport() {
        console.log('\n🎯 === ISOLATION TESTING REPORT ===');

        const passed = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);

        console.log(`📊 Summary:`);
        console.log(`   Total Isolation Tests: ${this.results.length}`);
        console.log(`   Passed: ${passed.length} ✅`);
        console.log(`   Failed: ${failed.length} ❌`);
        console.log(`   Success Rate: ${((passed.length / this.results.length) * 100).toFixed(1)}%`);

        if (failed.length > 0) {
            console.log('\n❌ Failed Isolation Tests:');
            failed.forEach(r => {
                console.log(`   - ${r.testName}: ${r.message}`);
            });
        }

        console.log('\n✅ Passed Isolation Tests:');
        passed.forEach(r => {
            console.log(`   - ${r.testName}: ${r.message}`);
        });

        console.log('\n🔍 Isolation Analysis:');
        if (failed.length === 0) {
            console.log('🎉 NO ISOLATION ISSUES: Task creation works consistently across all test scenarios');
            console.log('   The issue may be environment-specific or timing-related');
        } else {
            console.log('⚠️ ISOLATION ISSUES DETECTED:');
            console.log('   Failed scenarios indicate specific conditions where task creation fails');
            console.log('   Recommend investigating the failed scenarios for root cause');
        }

        console.log('\n🏁 === ISOLATION TESTING COMPLETED ===');
    }
}

// Run the isolation testing
async function runIsolationTesting() {
    const tester = new TaskCreationIsolationTester();
    await tester.run();
}

runIsolationTesting().catch(console.error);
