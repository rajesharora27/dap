// Task Creation Interference Detection Test
// This script tests task creation in different execution contexts to identify interference patterns

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

// GraphQL mutations
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

const PRODUCTS = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          description
          licenses {
            id
            name
            level
            isActive
          }
          tasks(first: 50) {
            edges {
              node {
                id
                name
                weight
              }
            }
          }
        }
      }
    }
  }
`;

class TaskCreationInterferenceDetector {
    constructor() {
        this.results = [];
        this.products = [];
        this.scenarios = [];
    }

    log(message, scenario = 'InterferenceTest') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${scenario}] ${message}`);
    }

    addResult(scenario, testName, success, message, details = {}) {
        this.results.push({
            scenario,
            testName,
            success,
            message,
            details,
            timestamp: new Date().toISOString()
        });
    }

    async run() {
        console.log('🔍 === TASK CREATION INTERFERENCE DETECTION ===');
        console.log('Testing task creation in different execution contexts to identify interference patterns\n');

        try {
            // Scenario 1: Fresh start - clean environment
            await this.runScenario('Fresh_Start', async () => {
                await this.clearAndSetup();
                return await this.createTask('Fresh_Start_Task');
            });

            // Scenario 2: After product operations
            await this.runScenario('After_Product_Ops', async () => {
                await this.performProductOperations();
                return await this.createTask('After_Product_Ops_Task');
            });

            // Scenario 3: After multiple task creations (weight consumption)
            await this.runScenario('After_Multiple_Tasks', async () => {
                await this.createMultipleTasks(3);
                return await this.createTask('After_Multiple_Tasks_Task');
            });

            // Scenario 4: With exhausted product capacity
            await this.runScenario('Exhausted_Capacity', async () => {
                await this.exhaustProductCapacity();
                return await this.createTask('Exhausted_Capacity_Task');
            });

            // Scenario 5: After cache operations
            await this.runScenario('After_Cache_Ops', async () => {
                await this.performCacheOperations();
                return await this.createTask('After_Cache_Ops_Task');
            });

            // Scenario 6: Concurrent execution simulation
            await this.runScenario('Concurrent_Execution', async () => {
                return await this.simulateConcurrentTasks();
            });

            // Generate comprehensive report
            this.generateInterferenceReport();

        } catch (error) {
            console.error('❌ Interference detection failed:', error.message);
        }
    }

    async runScenario(scenarioName, testFunction) {
        this.log(`🧪 Running scenario: ${scenarioName}`, scenarioName);
        try {
            const result = await testFunction();
            this.addResult(scenarioName, 'Execution', true, 'Scenario completed successfully', result);
            this.log(`✅ Scenario ${scenarioName} completed successfully`, scenarioName);
        } catch (error) {
            this.addResult(scenarioName, 'Execution', false, `Scenario failed: ${error.message}`, { error: error.message });
            this.log(`❌ Scenario ${scenarioName} failed: ${error.message}`, scenarioName);
        }
    }

    async clearAndSetup() {
        this.log('🧹 Clearing Apollo cache and setting up fresh environment');
        await client.clearStore();

        // Create a fresh test product for this scenario
        const timestamp = Date.now();
        const productData = {
            name: `Interference Test Product ${timestamp}`,
            description: `Product for interference testing created at ${new Date().toLocaleString()}`,
            customAttrs: {
                testCreated: true,
                interferenceTest: true,
                timestamp
            }
        };

        const productResult = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: { input: productData }
        });

        const product = productResult.data.createProduct;

        // Create Essential license
        const licenseData = {
            name: `Essential License for ${product.name}`,
            description: 'Essential license for interference testing',
            level: 1,
            isActive: true,
            productId: product.id
        };

        await client.mutate({
            mutation: CREATE_LICENSE,
            variables: { input: licenseData }
        });

        this.testProduct = product;
        this.log(`✅ Fresh test product created: ${product.name} (${product.id})`);

        return product;
    }

    async createTask(taskName, productOverride = null) {
        const targetProduct = productOverride || this.testProduct;

        if (!targetProduct) {
            throw new Error('No test product available for task creation');
        }

        const taskData = {
            productId: targetProduct.id,
            name: `${taskName} ${Date.now()}`,
            description: `Task created during interference testing: ${taskName}`,
            estMinutes: 60,
            weight: 2,
            licenseLevel: 'Essential',
            priority: 'Medium',
            notes: `Interference test task: ${taskName}`
        };

        this.log(`📋 Creating task: ${taskData.name}`);
        const result = await client.mutate({
            mutation: CREATE_TASK,
            variables: { input: taskData }
        });

        const createdTask = result.data.createTask;
        this.log(`✅ Task created: ${createdTask.name} (${createdTask.id})`);

        return createdTask;
    }

    async performProductOperations() {
        this.log('🔄 Performing product operations to simulate comprehensive suite environment');

        // Create multiple products
        for (let i = 0; i < 2; i++) {
            const timestamp = Date.now() + i;
            const productData = {
                name: `Product Operation Test ${timestamp}`,
                description: `Product ${i + 1} created during interference testing`,
                customAttrs: { operationTest: true, index: i }
            };

            const productResult = await client.mutate({
                mutation: CREATE_PRODUCT,
                variables: { input: productData }
            });

            const product = productResult.data.createProduct;
            this.products.push(product);

            // Create license for each product
            const licenseData = {
                name: `License for ${product.name}`,
                level: 1,
                isActive: true,
                productId: product.id
            };

            await client.mutate({
                mutation: CREATE_LICENSE,
                variables: { input: licenseData }
            });

            this.log(`✅ Created operation test product: ${product.name}`);
        }
    }

    async createMultipleTasks(count) {
        this.log(`📋 Creating ${count} tasks to consume weight capacity`);

        for (let i = 0; i < count; i++) {
            try {
                await this.createTask(`Multiple_Task_${i + 1}`);
                // Small delay to avoid overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                this.log(`⚠️ Task ${i + 1} creation failed: ${error.message}`);
            }
        }
    }

    async exhaustProductCapacity() {
        this.log('⚖️ Attempting to exhaust product weight capacity');

        // Create tasks until we hit capacity limit
        let taskCount = 0;
        const maxAttempts = 20; // Prevent infinite loop

        while (taskCount < maxAttempts) {
            try {
                await this.createTask(`Capacity_Test_${taskCount + 1}`);
                taskCount++;
            } catch (error) {
                if (error.message.includes('weight') || error.message.includes('capacity')) {
                    this.log(`✅ Product capacity exhausted after ${taskCount} tasks: ${error.message}`);
                    break;
                } else {
                    throw error;
                }
            }
        }

        return taskCount;
    }

    async performCacheOperations() {
        this.log('🧹 Performing cache operations to simulate comprehensive suite cache management');

        // Multiple cache clear operations
        await client.clearStore();
        this.log('🧹 Cache cleared (1/3)');

        // Refetch data
        await client.query({ query: PRODUCTS });
        this.log('📊 Data refetched');

        await client.clearStore();
        this.log('🧹 Cache cleared (2/3)');

        // Another refetch
        await client.query({ query: PRODUCTS });
        this.log('📊 Data refetched again');

        await client.clearStore();
        this.log('🧹 Cache cleared (3/3)');
    }

    async simulateConcurrentTasks() {
        this.log('🔄 Simulating concurrent task creation');

        const promises = [];
        for (let i = 0; i < 3; i++) {
            promises.push(this.createTask(`Concurrent_Task_${i + 1}`));
        }

        try {
            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            this.log(`✅ Concurrent execution results: ${successful} successful, ${failed} failed`);
            return { successful, failed, results };
        } catch (error) {
            this.log(`❌ Concurrent execution failed: ${error.message}`);
            throw error;
        }
    }

    generateInterferenceReport() {
        console.log('\n🎯 === INTERFERENCE DETECTION REPORT ===');

        const scenarios = [...new Set(this.results.map(r => r.scenario))];
        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);

        console.log(`📊 Summary:`);
        console.log(`   Total Scenarios: ${scenarios.length}`);
        console.log(`   Successful: ${successful.length} ✅`);
        console.log(`   Failed: ${failed.length} ❌`);
        console.log(`   Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);

        if (failed.length > 0) {
            console.log('\n❌ Failed Scenarios:');
            failed.forEach(r => {
                console.log(`   - ${r.scenario}: ${r.message}`);
            });
        }

        console.log('\n✅ Successful Scenarios:');
        successful.forEach(r => {
            console.log(`   - ${r.scenario}: Task creation successful`);
        });

        // Interference analysis
        console.log('\n🔍 Interference Analysis:');
        if (failed.length === 0) {
            console.log('🎉 NO INTERFERENCE DETECTED: All scenarios executed successfully');
            console.log('   Task creation appears to be stable across different execution contexts');
        } else {
            console.log('⚠️  INTERFERENCE PATTERNS DETECTED:');
            const failurePatterns = failed.map(f => f.scenario);
            console.log(`   Problematic scenarios: ${failurePatterns.join(', ')}`);
            console.log('   Recommended actions:');
            console.log('   1. Review test isolation between scenarios');
            console.log('   2. Check resource cleanup between tests');
            console.log('   3. Verify cache management strategies');
            console.log('   4. Analyze timing dependencies');
        }

        console.log('\n🏁 === INTERFERENCE DETECTION COMPLETED ===');
    }
}

// Run the interference detection
async function runInterferenceDetection() {
    const detector = new TaskCreationInterferenceDetector();
    await detector.run();
}

runInterferenceDetection().catch(console.error);
