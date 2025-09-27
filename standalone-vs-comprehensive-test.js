const { ApolloClient, InMemoryCache, createHttpLink } = require('@apollo/client');
const { gql } = require('@apollo/client');

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

// GraphQL mutations
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

class StandaloneVsComprehensiveTester {
    constructor() {
        this.results = [];
    }

    log(message, context = 'MAIN') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${context}] ${message}`);
    }

    addResult(testName, success, details, testType) {
        this.results.push({
            testName,
            success,
            details,
            testType,
            timestamp: new Date().toISOString()
        });
    }

    async createTestProduct(productName, testType) {
        const timestamp = Date.now();
        const productData = {
            name: `${productName} ${testType} ${timestamp}`,
            description: `Testing product for ${testType} execution`,
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

    async createTask(product, taskName, testType) {
        const taskData = {
            productId: product.id,
            name: `${taskName} ${testType} ${Date.now()}`,
            description: `Test task for ${testType} execution: ${taskName}`,
            estMinutes: 60,
            weight: 2,
            licenseLevel: 'Essential',
            priority: 'Medium',
            notes: `Created during ${testType} testing`
        };

        const result = await client.mutate({
            mutation: CREATE_TASK,
            variables: { input: taskData },
            fetchPolicy: 'network-only'
        });

        return result.data.createTask;
    }

    async runStandaloneTest() {
        this.log('🔍 === STANDALONE TEST EXECUTION ===');
        const testType = 'STANDALONE';
        let successCount = 0;
        let failCount = 0;

        try {
            // Single task creation
            const product1 = await this.createTestProduct('Standalone Product', testType);
            const task1 = await this.createTask(product1, 'Standalone Task', testType);
            this.addResult('standalone_single_task', true, `Task created: ${task1.name}`, testType);
            successCount++;
            this.log(`✅ Single task creation successful: ${task1.name}`, 'STANDALONE');

            // Sequential tasks on same product
            for (let i = 2; i <= 4; i++) {
                const task = await this.createTask(product1, `Standalone Sequential Task ${i}`, testType);
                this.addResult(`standalone_sequential_${i}`, true, `Sequential task ${i} created: ${task.name}`, testType);
                successCount++;
                this.log(`✅ Sequential task ${i} created: ${task.name}`, 'STANDALONE');
            }

            // Test rapid succession (the problematic case)
            this.log('🚀 Testing rapid succession in standalone...', 'STANDALONE');
            const rapidProduct = await this.createTestProduct('Standalone Rapid Product', testType);
            const rapidPromises = [];
            for (let i = 1; i <= 3; i++) {
                rapidPromises.push(this.createTask(rapidProduct, `Standalone Rapid Task ${i}`, testType));
            }
            const rapidResults = await Promise.all(rapidPromises);

            for (let i = 0; i < rapidResults.length; i++) {
                this.addResult(`standalone_rapid_${i + 1}`, true, `Rapid task ${i + 1} created: ${rapidResults[i].name}`, testType);
                successCount++;
                this.log(`✅ Rapid task ${i + 1} created: ${rapidResults[i].name}`, 'STANDALONE');
            }

        } catch (error) {
            failCount++;
            this.addResult('standalone_error', false, `Standalone test error: ${error.message}`, testType);
            this.log(`❌ Standalone test error: ${error.message}`, 'STANDALONE');
        }

        this.log(`🏁 Standalone test completed: ${successCount} success, ${failCount} failed`, 'STANDALONE');
        return { successCount, failCount, testType: 'STANDALONE' };
    }

    async runComprehensiveTest() {
        this.log('🔍 === COMPREHENSIVE TEST EXECUTION ===');
        const testType = 'COMPREHENSIVE';
        let successCount = 0;
        let failCount = 0;

        try {
            // Test 1: Basic task creation
            const product1 = await this.createTestProduct('Comprehensive Product 1', testType);
            const task1 = await this.createTask(product1, 'Comprehensive Task 1', testType);
            this.addResult('comprehensive_basic', true, `Basic task created: ${task1.name}`, testType);
            successCount++;
            this.log(`✅ Basic task creation successful: ${task1.name}`, 'COMPREHENSIVE');

            // Test 2: Multiple tasks on different products
            for (let i = 2; i <= 4; i++) {
                const product = await this.createTestProduct(`Comprehensive Product ${i}`, testType);
                const task = await this.createTask(product, `Comprehensive Task ${i}`, testType);
                this.addResult(`comprehensive_multi_${i}`, true, `Multi task ${i} created: ${task.name}`, testType);
                successCount++;
                this.log(`✅ Multi-product task ${i} created: ${task.name}`, 'COMPREHENSIVE');
            }

            // Test 3: Sequential tasks on same product
            const seqProduct = await this.createTestProduct('Comprehensive Sequential Product', testType);
            for (let i = 1; i <= 3; i++) {
                const task = await this.createTask(seqProduct, `Comprehensive Sequential Task ${i}`, testType);
                this.addResult(`comprehensive_sequential_${i}`, true, `Sequential task ${i} created: ${task.name}`, testType);
                successCount++;
                this.log(`✅ Sequential task ${i} created: ${task.name}`, 'COMPREHENSIVE');
            }

            // Test 4: Rapid succession (the critical test that fails)
            this.log('🚀 Testing rapid succession in comprehensive...', 'COMPREHENSIVE');
            const rapidProduct = await this.createTestProduct('Comprehensive Rapid Product', testType);
            const rapidPromises = [];
            for (let i = 1; i <= 3; i++) {
                rapidPromises.push(this.createTask(rapidProduct, `Comprehensive Rapid Task ${i}`, testType));
            }
            const rapidResults = await Promise.all(rapidPromises);

            for (let i = 0; i < rapidResults.length; i++) {
                this.addResult(`comprehensive_rapid_${i + 1}`, true, `Rapid task ${i + 1} created: ${rapidResults[i].name}`, testType);
                successCount++;
                this.log(`✅ Rapid task ${i + 1} created: ${rapidResults[i].name}`, 'COMPREHENSIVE');
            }

            // Test 5: Complex scenario (multiple rapid creations)
            this.log('🚀 Testing complex rapid scenario...', 'COMPREHENSIVE');
            const complexProduct = await this.createTestProduct('Comprehensive Complex Product', testType);

            // First batch
            const batch1Promises = [];
            for (let i = 1; i <= 2; i++) {
                batch1Promises.push(this.createTask(complexProduct, `Comprehensive Complex Batch1 Task ${i}`, testType));
            }
            await Promise.all(batch1Promises);

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 100));

            // Second batch
            const batch2Promises = [];
            for (let i = 1; i <= 2; i++) {
                batch2Promises.push(this.createTask(complexProduct, `Comprehensive Complex Batch2 Task ${i}`, testType));
            }
            await Promise.all(batch2Promises);

            successCount += 4; // 2 from each batch
            this.log(`✅ Complex rapid scenario completed (4 tasks)`, 'COMPREHENSIVE');

        } catch (error) {
            failCount++;
            this.addResult('comprehensive_error', false, `Comprehensive test error: ${error.message}`, testType);
            this.log(`❌ Comprehensive test error: ${error.message}`, 'COMPREHENSIVE');
        }

        this.log(`🏁 Comprehensive test completed: ${successCount} success, ${failCount} failed`, 'COMPREHENSIVE');
        return { successCount, failCount, testType: 'COMPREHENSIVE' };
    }

    async runSequentialComparison() {
        this.log('🎯 === STANDALONE VS COMPREHENSIVE COMPARISON ===');
        this.log('Simulating user scenario: "Create task test works when used standalone in sequence with other test but fails as part of comprehensive suite"');

        // Run standalone first (should work)
        const standaloneResult = await this.runStandaloneTest();

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Run comprehensive after (may show issues)
        const comprehensiveResult = await this.runComprehensiveTest();

        this.generateComparisonReport(standaloneResult, comprehensiveResult);
    }

    generateComparisonReport(standaloneResult, comprehensiveResult) {
        this.log('🎯 === COMPARISON REPORT ===');

        // Calculate success rates
        const standaloneSuccessRate = standaloneResult.failCount === 0 ? 100 :
            ((standaloneResult.successCount / (standaloneResult.successCount + standaloneResult.failCount)) * 100).toFixed(1);

        const comprehensiveSuccessRate = comprehensiveResult.failCount === 0 ? 100 :
            ((comprehensiveResult.successCount / (comprehensiveResult.successCount + comprehensiveResult.failCount)) * 100).toFixed(1);

        this.log('📊 Execution Results:');
        this.log(`   STANDALONE: ${standaloneResult.successCount} success, ${standaloneResult.failCount} failed (${standaloneSuccessRate}%)`);
        this.log(`   COMPREHENSIVE: ${comprehensiveResult.successCount} success, ${comprehensiveResult.failCount} failed (${comprehensiveSuccessRate}%)`);

        // Analyze the pattern
        const standaloneWorks = standaloneResult.failCount === 0;
        const comprehensiveFails = comprehensiveResult.failCount > 0;

        this.log('\\n🔍 Pattern Analysis:');
        if (standaloneWorks && comprehensiveFails) {
            this.log('🚨 PATTERN CONFIRMED: Standalone works, comprehensive fails!');
            this.log('   This matches your reported issue exactly.');
            this.log('   The problem appears when running comprehensive test suites.');
        } else if (standaloneWorks && !comprehensiveFails) {
            this.log('✅ NO PATTERN: Both standalone and comprehensive work');
            this.log('   Issue may be intermittent or environment-specific.');
        } else if (!standaloneWorks && comprehensiveFails) {
            this.log('⚠️ GENERAL FAILURE: Both standalone and comprehensive fail');
            this.log('   Indicates broader task creation issues.');
        } else if (!standaloneWorks && !comprehensiveFails) {
            this.log('🤔 INVERSE PATTERN: Standalone fails, comprehensive works');
            this.log('   Unusual pattern - may indicate timing or state issues.');
        }

        // Show failed tests by type
        const standaloneFailures = this.results.filter(r => r.testType === 'STANDALONE' && !r.success);
        const comprehensiveFailures = this.results.filter(r => r.testType === 'COMPREHENSIVE' && !r.success);

        if (standaloneFailures.length > 0) {
            this.log('\\n❌ Standalone Failures:');
            standaloneFailures.forEach(failure => {
                this.log(`   - ${failure.testName}: ${failure.details}`);
            });
        }

        if (comprehensiveFailures.length > 0) {
            this.log('\\n❌ Comprehensive Failures:');
            comprehensiveFailures.forEach(failure => {
                this.log(`   - ${failure.testName}: ${failure.details}`);
            });
        }

        // Performance comparison
        const standaloneTests = this.results.filter(r => r.testType === 'STANDALONE');
        const comprehensiveTests = this.results.filter(r => r.testType === 'COMPREHENSIVE');

        this.log('\\n⏱️  Test Volume Comparison:');
        this.log(`   Standalone Tests: ${standaloneTests.length} operations`);
        this.log(`   Comprehensive Tests: ${comprehensiveTests.length} operations`);

        if (comprehensiveTests.length > standaloneTests.length) {
            this.log('   📈 Comprehensive suite runs more operations - higher chance of conflicts');
        }

        this.log('\\n💡 Recommendations:');
        if (standaloneWorks && comprehensiveFails) {
            this.log('   1. Sequence number conflicts are likely in comprehensive suites');
            this.log('   2. Add delays between rapid task creations');
            this.log('   3. Implement better sequence number handling in the backend');
            this.log('   4. Consider batch operations for multiple tasks');
        } else if (!standaloneWorks || !comprehensiveFails) {
            this.log('   1. Run this test multiple times to identify intermittent patterns');
            this.log('   2. Check backend logs for specific error patterns');
            this.log('   3. Monitor database sequence number generation');
        }

        this.log('🏁 === COMPARISON COMPLETED ===');
    }
}

async function main() {
    const tester = new StandaloneVsComprehensiveTester();

    try {
        await tester.runSequentialComparison();
    } catch (error) {
        console.error('Sequential comparison failed:', error);
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

module.exports = { StandaloneVsComprehensiveTester };
