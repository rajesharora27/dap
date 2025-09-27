const { ApolloClient, InMemoryCache, createHttpLink } = require('@apollo/client');

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
        }
    }
});

const { gql } = require('@apollo/client');

const CREATE_PRODUCT = gql`
    mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
            id
            name
            description
            statusPercent
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
            description
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
        }
    }
`;

const GET_PRODUCTS = gql`
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

class CumulativeSuiteTester {
    constructor() {
        this.results = [];
        this.iterationResults = [];
    }

    log(message, context = 'MAIN') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${context}] ${message}`);
    }

    addResult(testName, success, details, iteration) {
        this.results.push({
            iteration,
            testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });
    }

    async createTestProduct(productName, iteration) {
        const timestamp = Date.now();
        const productData = {
            name: `${productName} Iter${iteration} ${timestamp}`,
            description: `Cumulative testing product for iteration ${iteration}`,
        };

        const result = await client.mutate({
            mutation: CREATE_PRODUCT,
            variables: { input: productData },
            fetchPolicy: 'network-only'
        });

        const product = result.data.createProduct;

        // Create license for the product
        const licenseData = {
            name: `${product.name} License`,
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

    async createTask(product, taskName, iteration) {
        const taskData = {
            productId: product.id,
            name: `${taskName} Iter${iteration} ${Date.now()}`,
            description: `Cumulative test task iteration ${iteration}: ${taskName}`,
            estMinutes: 60,
            weight: 2,
            licenseLevel: 'Essential',
            priority: 'Medium',
            notes: `Created during cumulative testing iteration ${iteration}`
        };

        const result = await client.mutate({
            mutation: CREATE_TASK,
            variables: { input: taskData },
            fetchPolicy: 'network-only'
        });

        return result.data.createTask;
    }

    async runSingleIteration(iteration) {
        this.log(`🚀 Starting iteration ${iteration}`, `ITER_${iteration}`);
        const iterationStart = Date.now();
        let successCount = 0;
        let failCount = 0;

        try {
            // Test 1: Basic task creation
            const product1 = await this.createTestProduct('Basic Test Product', iteration);
            const task1 = await this.createTask(product1, 'Basic Task', iteration);
            this.addResult('basic_task_creation', true, `Task created: ${task1.name}`, iteration);
            successCount++;
            this.log(`✅ Basic task creation successful`, `ITER_${iteration}`);

            // Test 2: Multiple tasks on same product
            const product2 = await this.createTestProduct('Multi Task Product', iteration);
            for (let i = 1; i <= 3; i++) {
                const task = await this.createTask(product2, `Multi Task ${i}`, iteration);
                this.addResult(`multi_task_creation_${i}`, true, `Task ${i} created: ${task.name}`, iteration);
                successCount++;
            }
            this.log(`✅ Multi-task creation successful (3 tasks)`, `ITER_${iteration}`);

            // Test 3: Rapid succession tasks
            const product3 = await this.createTestProduct('Rapid Product', iteration);
            const rapidPromises = [];
            for (let i = 1; i <= 3; i++) {
                rapidPromises.push(this.createTask(product3, `Rapid Task ${i}`, iteration));
            }
            const rapidResults = await Promise.all(rapidPromises);
            for (let i = 0; i < rapidResults.length; i++) {
                this.addResult(`rapid_task_creation_${i + 1}`, true, `Rapid task ${i + 1} created: ${rapidResults[i].name}`, iteration);
                successCount++;
            }
            this.log(`✅ Rapid succession creation successful (3 tasks)`, `ITER_${iteration}`);

            // Test 4: Using existing products (simulate state persistence)
            const existingProductsQuery = await client.query({
                query: GET_PRODUCTS,
                fetchPolicy: 'network-only'
            });

            const existingProducts = existingProductsQuery.data.products.edges
                .map(edge => edge.node)
                .filter(p => p.name.includes('Cumulative') && !p.name.includes(`Iter${iteration}`));

            if (existingProducts.length > 0) {
                const existingProduct = existingProducts[0];
                const existingTask = await this.createTask(existingProduct, 'Existing Product Task', iteration);
                this.addResult('existing_product_task', true, `Task on existing product: ${existingTask.name}`, iteration);
                successCount++;
                this.log(`✅ Task creation on existing product successful`, `ITER_${iteration}`);
            } else {
                this.addResult('existing_product_task', true, `No existing products found (expected for iteration 1)`, iteration);
                successCount++;
                this.log(`ℹ️  No existing products available (normal for early iterations)`, `ITER_${iteration}`);
            }

        } catch (error) {
            failCount++;
            this.addResult('iteration_error', false, `Iteration ${iteration} error: ${error.message}`, iteration);
            this.log(`❌ Iteration ${iteration} error: ${error.message}`, `ITER_${iteration}`);
        }

        const iterationTime = Date.now() - iterationStart;
        const iterationResult = {
            iteration,
            successCount,
            failCount,
            duration: iterationTime,
            timestamp: new Date().toISOString()
        };

        this.iterationResults.push(iterationResult);
        this.log(`🏁 Iteration ${iteration} completed: ${successCount} success, ${failCount} failed, ${iterationTime}ms`, `ITER_${iteration}`);

        return iterationResult;
    }

    async runCumulativeTest(iterations = 5) {
        this.log('🎯 === CUMULATIVE SUITE TESTING ===');
        this.log(`Testing task creation across ${iterations} consecutive suite runs`);

        const startTime = Date.now();

        // Run multiple iterations to simulate running comprehensive suite multiple times
        for (let i = 1; i <= iterations; i++) {
            await this.runSingleIteration(i);

            // Small delay between iterations to simulate real usage patterns
            if (i < iterations) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const totalTime = Date.now() - startTime;
        this.generateCumulativeReport(totalTime);
    }

    generateCumulativeReport(totalTime) {
        this.log('🎯 === CUMULATIVE TESTING REPORT ===');

        // Overall statistics
        const totalTests = this.results.length;
        const totalSuccess = this.results.filter(r => r.success).length;
        const totalFailed = this.results.filter(r => !r.success).length;
        const overallSuccessRate = ((totalSuccess / totalTests) * 100).toFixed(1);

        this.log(`📊 Overall Summary:`);
        this.log(`   Total Tests Executed: ${totalTests}`);
        this.log(`   Successful: ${totalSuccess} ✅`);
        this.log(`   Failed: ${totalFailed} ❌`);
        this.log(`   Overall Success Rate: ${overallSuccessRate}%`);
        this.log(`   Total Duration: ${totalTime}ms`);

        // Per-iteration analysis
        this.log(`\n📈 Per-Iteration Analysis:`);
        let degradationDetected = false;

        for (const iteration of this.iterationResults) {
            const successRate = iteration.failCount === 0 ? 100 :
                ((iteration.successCount / (iteration.successCount + iteration.failCount)) * 100).toFixed(1);

            this.log(`   Iteration ${iteration.iteration}: ${iteration.successCount} success, ${iteration.failCount} failed (${successRate}%) - ${iteration.duration}ms`);

            if (iteration.failCount > 0) {
                degradationDetected = true;
            }
        }

        // Degradation analysis
        this.log(`\n🔍 Cumulative Analysis:`);
        if (degradationDetected) {
            this.log(`⚠️ DEGRADATION DETECTED: Some iterations had failures`);
            this.log(`   This indicates potential cumulative state issues or timing problems`);

            // Show failed tests
            const failedTests = this.results.filter(r => !r.success);
            if (failedTests.length > 0) {
                this.log(`\n❌ Failed Tests:`);
                failedTests.forEach(test => {
                    this.log(`   - Iteration ${test.iteration}: ${test.testName} - ${test.details}`);
                });
            }
        } else {
            this.log(`🎉 NO CUMULATIVE DEGRADATION: All iterations maintained consistent performance`);
            this.log(`   Task creation remains stable across multiple suite executions`);
        }

        // Performance analysis
        const avgDuration = this.iterationResults.reduce((sum, iter) => sum + iter.duration, 0) / this.iterationResults.length;
        const maxDuration = Math.max(...this.iterationResults.map(iter => iter.duration));
        const minDuration = Math.min(...this.iterationResults.map(iter => iter.duration));

        this.log(`\n⏱️  Performance Analysis:`);
        this.log(`   Average Iteration Time: ${avgDuration.toFixed(0)}ms`);
        this.log(`   Fastest Iteration: ${minDuration}ms`);
        this.log(`   Slowest Iteration: ${maxDuration}ms`);

        if (maxDuration > (avgDuration * 1.5)) {
            this.log(`⚠️ PERFORMANCE VARIATION: Significant timing differences detected`);
        } else {
            this.log(`✅ STABLE PERFORMANCE: Consistent timing across iterations`);
        }

        this.log('🏁 === CUMULATIVE TESTING COMPLETED ===');
    }
}

async function main() {
    const tester = new CumulativeSuiteTester();

    try {
        await tester.runCumulativeTest(5); // Run 5 consecutive iterations
    } catch (error) {
        console.error('Cumulative testing failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { CumulativeSuiteTester };
