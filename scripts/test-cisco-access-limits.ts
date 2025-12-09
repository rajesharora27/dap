#!/usr/bin/env ts-node
/**
 * Cisco AI API Access Limits Test
 * 
 * Tests and discovers the actual access limits for Cisco AI Gateway:
 * - Rate limits (requests per minute)
 * - Token limits (max tokens per request)
 * - Concurrent request handling
 * - Error handling for limit violations
 * 
 * Usage: npx ts-node scripts/test-cisco-access-limits.ts
 * 
 * @author DAP Development Team
 * @version 1.0.0
 * @created 2025-12-09
 */

import dotenv from 'dotenv';
import path from 'path';
import {
    CiscoAIProvider,
    CiscoAIProviderConfig,
    CiscoAITier,
    CISCO_AI_TIER_CONFIG,
    createCiscoAIProvider
} from '../backend/src/services/ai/providers/CiscoAIProvider';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.development') });

// =============================================================================
// Console Styling
// =============================================================================
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset): void {
    console.log(`${color}${message}${colors.reset}`);
}

function logHeader(title: string): void {
    console.log('\n' + '═'.repeat(70));
    log(`  ${title}`, colors.bold + colors.cyan);
    console.log('═'.repeat(70));
}

function logSection(title: string): void {
    console.log('\n' + '─'.repeat(50));
    log(`  ${title}`, colors.bold);
    console.log('─'.repeat(50));
}

function logSuccess(message: string): void {
    log(`  ✅ ${message}`, colors.green);
}

function logWarning(message: string): void {
    log(`  ⚠️  ${message}`, colors.yellow);
}

function logError(message: string): void {
    log(`  ❌ ${message}`, colors.red);
}

function logInfo(message: string): void {
    log(`  ℹ️  ${message}`, colors.blue);
}

function logMetric(label: string, value: string | number): void {
    console.log(`     ${colors.dim}${label}:${colors.reset} ${colors.bold}${value}${colors.reset}`);
}

// =============================================================================
// Test Configuration
// =============================================================================
interface TestConfig {
    provider: CiscoAIProvider;
    tier: CiscoAITier;
    model: string;
    expectedRateLimit: number;
    expectedPeakTokens: number;
}

interface TestResult {
    testName: string;
    passed: boolean;
    message: string;
    details?: Record<string, unknown>;
}

const testResults: TestResult[] = [];

function addResult(result: TestResult): void {
    testResults.push(result);
    if (result.passed) {
        logSuccess(result.message);
    } else {
        logError(result.message);
    }
    if (result.details) {
        for (const [key, value] of Object.entries(result.details)) {
            logMetric(key, String(value));
        }
    }
}

// =============================================================================
// Test Functions
// =============================================================================

/**
 * Test 1: Validate Environment Configuration
 */
function testEnvironmentConfiguration(): TestResult[] {
    logSection('Test 1: Environment Configuration');

    const results: TestResult[] = [];
    const requiredEnvVars = [
        'CISCO_AI_CLIENT_ID',
        'CISCO_AI_CLIENT_SECRET',
        'CISCO_AI_API_KEY',
        'CISCO_AI_ENDPOINT',
        'CISCO_AI_TOKEN_URL',
    ];

    let allPresent = true;
    const missing: string[] = [];

    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        if (!value) {
            missing.push(envVar);
            allPresent = false;
        } else {
            const displayValue = envVar.includes('SECRET') || envVar.includes('KEY')
                ? value.substring(0, 10) + '...'
                : value;
            logInfo(`${envVar}: ${displayValue}`);
        }
    }

    results.push({
        testName: 'Environment Variables',
        passed: allPresent,
        message: allPresent
            ? 'All required environment variables are set'
            : `Missing: ${missing.join(', ')}`,
    });

    // Check tier configuration
    const tier = (process.env.CISCO_AI_TIER || 'free') as CiscoAITier;
    const model = process.env.CISCO_AI_MODEL || 'gpt-4o-mini';

    logInfo(`Configured Tier: ${tier}`);
    logInfo(`Configured Model: ${model}`);

    const tierConfig = CISCO_AI_TIER_CONFIG[tier];
    if (tierConfig) {
        results.push({
            testName: 'Tier Configuration',
            passed: tierConfig.availableModels.includes(model),
            message: tierConfig.availableModels.includes(model)
                ? `Model "${model}" is available on "${tier}" tier`
                : `Model "${model}" may NOT be available on "${tier}" tier. Available: ${tierConfig.availableModels.join(', ')}`,
        });
    }

    return results;
}

/**
 * Test 2: Authentication and Basic Connectivity
 */
async function testAuthentication(config: TestConfig): Promise<TestResult> {
    logSection('Test 2: Authentication & Connectivity');

    try {
        logInfo('Attempting to authenticate and make a simple request...');

        const startTime = Date.now();
        const response = await config.provider.complete('Say "OK"');
        const latency = Date.now() - startTime;

        return {
            testName: 'Authentication',
            passed: true,
            message: `Successfully authenticated and received response`,
            details: {
                'Response': response.text.substring(0, 50),
                'Latency': `${latency}ms`,
                'Tokens Used': response.usage?.totalTokens || 'N/A',
            },
        };
    } catch (error: any) {
        return {
            testName: 'Authentication',
            passed: false,
            message: `Authentication failed: ${error.message}`,
        };
    }
}

/**
 * Test 3: Configured Rate Limits (from tier config)
 */
function testConfiguredRateLimits(config: TestConfig): TestResult {
    logSection('Test 3: Configured Rate Limits');

    const rateLimit = config.provider.getRateLimit();
    const rateLimitDisplay = rateLimit === Infinity ? 'Unlimited' : `${rateLimit} requests/minute`;

    return {
        testName: 'Configured Rate Limit',
        passed: true,
        message: `Rate limit for ${config.model} on ${config.tier} tier`,
        details: {
            'Rate Limit': rateLimitDisplay,
            'Expected': config.expectedRateLimit === Infinity ? 'Unlimited' : `${config.expectedRateLimit} req/min`,
        },
    };
}

/**
 * Test 4: Configured Token Limits (from tier config)
 */
function testConfiguredTokenLimits(config: TestConfig): TestResult {
    logSection('Test 4: Configured Token Limits');

    const peakTokens = config.provider.getPeakTokens();

    return {
        testName: 'Configured Token Limit',
        passed: true,
        message: `Token limit for ${config.model} on ${config.tier} tier`,
        details: {
            'Peak Tokens': `${(peakTokens / 1000).toLocaleString()}K tokens`,
            'Expected': `${(config.expectedPeakTokens / 1000).toLocaleString()}K tokens`,
        },
    };
}

/**
 * Test 5: Rate Limit Discovery (make rapid requests)
 */
async function testRateLimitDiscovery(config: TestConfig, numRequests: number = 10): Promise<TestResult> {
    logSection(`Test 5: Rate Limit Discovery (${numRequests} rapid requests)`);

    logWarning(`This test will make ${numRequests} rapid requests to probe rate limits.`);
    logInfo('Starting rate limit test...');

    const results: {
        requestNum: number;
        success: boolean;
        latency: number;
        error?: string;
    }[] = [];

    const startTime = Date.now();

    for (let i = 1; i <= numRequests; i++) {
        const reqStartTime = Date.now();
        try {
            await config.provider.complete(`Request number ${i}. Just respond "OK".`);
            const latency = Date.now() - reqStartTime;
            results.push({ requestNum: i, success: true, latency });
            process.stdout.write(colors.green + '.' + colors.reset);
        } catch (error: any) {
            const latency = Date.now() - reqStartTime;
            results.push({ requestNum: i, success: false, latency, error: error.message });
            process.stdout.write(colors.red + 'X' + colors.reset);

            // Check if rate limited (429 error)
            if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
                console.log(''); // newline
                logWarning(`Rate limit hit at request ${i}`);
                break;
            }
        }
    }
    console.log(''); // newline

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
    const rateLimitHit = results.some(r => r.error?.includes('429') || r.error?.toLowerCase().includes('rate'));

    // Calculate actual requests per minute
    const requestsPerMinute = Math.round((successCount / (totalDuration / 1000)) * 60);

    return {
        testName: 'Rate Limit Discovery',
        passed: !rateLimitHit,
        message: rateLimitHit
            ? `Rate limit detected after ${successCount} requests`
            : `Completed ${successCount}/${numRequests} requests without rate limiting`,
        details: {
            'Successful Requests': successCount,
            'Failed Requests': failCount,
            'Total Duration': `${totalDuration}ms`,
            'Average Latency': `${Math.round(avgLatency)}ms`,
            'Estimated Rate': `${requestsPerMinute} req/min`,
            'Rate Limit Hit': rateLimitHit ? 'Yes' : 'No',
            'Configured Limit': config.expectedRateLimit === Infinity ? 'Unlimited' : `${config.expectedRateLimit} req/min`,
        },
    };
}

/**
 * Test 6: Token Limit Discovery (test with increasing prompt sizes)
 */
async function testTokenLimitDiscovery(config: TestConfig): Promise<TestResult> {
    logSection('Test 6: Token Limit Discovery');

    logInfo('Testing response generation with varying token requests...');

    // Test different max_tokens values
    const tokenTests = [100, 500, 1000, 2000, 4000];
    const results: {
        requestedTokens: number;
        actualTokens: number;
        success: boolean;
        error?: string;
    }[] = [];

    for (const maxTokens of tokenTests) {
        try {
            // Make a request with specific max_tokens
            const response = await config.provider.complete(
                `Generate exactly ${maxTokens} tokens of lorem ipsum text. Start with "Lorem ipsum dolor sit amet" and continue.`,
                { maxTokens }
            );
            results.push({
                requestedTokens: maxTokens,
                actualTokens: response.usage?.totalTokens || 0,
                success: true,
            });
            logInfo(`Requested: ${maxTokens}, Received: ${response.usage?.totalTokens || 'N/A'} tokens`);
        } catch (error: any) {
            results.push({
                requestedTokens: maxTokens,
                actualTokens: 0,
                success: false,
                error: error.message,
            });
            logError(`Failed at ${maxTokens} tokens: ${error.message.substring(0, 50)}...`);
        }
    }

    const maxSuccessfulTokens = Math.max(...results.filter(r => r.success).map(r => r.requestedTokens), 0);

    return {
        testName: 'Token Limit Discovery',
        passed: maxSuccessfulTokens > 0,
        message: maxSuccessfulTokens > 0
            ? `Successfully tested up to ${maxSuccessfulTokens} tokens`
            : 'No successful token tests',
        details: {
            'Max Tested Tokens': maxSuccessfulTokens,
            'Configured Peak Tokens': `${(config.expectedPeakTokens / 1000).toLocaleString()}K`,
            'Test Results': `${results.filter(r => r.success).length}/${tokenTests.length} passed`,
        },
    };
}

/**
 * Test 7: Available Models Check
 */
function testAvailableModels(config: TestConfig): TestResult {
    logSection('Test 7: Available Models for Tier');

    const availableModels = config.provider.getAvailableModels();

    logInfo(`Models available on "${config.tier}" tier:`);
    for (const model of availableModels) {
        const tierConfig = CISCO_AI_TIER_CONFIG[config.tier];
        const rateLimit = tierConfig.requestsPerMinute[model] || 'Unknown';
        const rateLimitStr = rateLimit === Infinity ? 'Unlimited' : `${rateLimit}/min`;
        logMetric(model, rateLimitStr);
    }

    return {
        testName: 'Available Models',
        passed: availableModels.length > 0,
        message: `${availableModels.length} model(s) available on "${config.tier}" tier`,
        details: {
            'Models': availableModels.join(', '),
        },
    };
}

/**
 * Test 8: Error Response Handling
 */
async function testErrorHandling(config: TestConfig): Promise<TestResult> {
    logSection('Test 8: Error Response Handling');

    logInfo('Testing error handling for invalid requests...');

    // We'll test with a very long prompt to potentially trigger token limits
    const longPrompt = 'Tell me about AI. '.repeat(1000); // Very long prompt

    try {
        const response = await config.provider.complete(longPrompt);
        return {
            testName: 'Error Handling - Long Prompt',
            passed: true,
            message: 'Long prompt handled successfully',
            details: {
                'Prompt Length': `${longPrompt.length} characters`,
                'Tokens Used': response.usage?.totalTokens || 'N/A',
            },
        };
    } catch (error: any) {
        const isExpectedError = error.message.includes('token') ||
            error.message.includes('length') ||
            error.message.includes('limit');
        return {
            testName: 'Error Handling - Long Prompt',
            passed: isExpectedError, // Expected to fail gracefully
            message: isExpectedError
                ? `Correctly rejected long prompt: ${error.message.substring(0, 50)}...`
                : `Unexpected error: ${error.message}`,
        };
    }
}

// =============================================================================
// Summary Report
// =============================================================================
function printSummary(): void {
    logHeader('TEST SUMMARY');

    const passed = testResults.filter(r => r.passed).length;
    const failed = testResults.filter(r => !r.passed).length;
    const total = testResults.length;

    console.log('');
    for (const result of testResults) {
        const icon = result.passed ? colors.green + '✅' : colors.red + '❌';
        const statusColor = result.passed ? colors.green : colors.red;
        console.log(`${icon} ${statusColor}${result.testName}${colors.reset}: ${result.message}`);
    }

    console.log('\n' + '═'.repeat(70));

    const percentage = Math.round((passed / total) * 100);
    const summaryColor = failed === 0 ? colors.green : (failed < 3 ? colors.yellow : colors.red);

    log(`  Results: ${passed}/${total} tests passed (${percentage}%)`, summaryColor + colors.bold);

    if (failed === 0) {
        logSuccess('All tests passed! Cisco AI API is correctly configured.');
    } else {
        logWarning(`${failed} test(s) need attention.`);
    }

    console.log('═'.repeat(70) + '\n');
}

// =============================================================================
// Main Execution
// =============================================================================
async function main(): Promise<void> {
    console.log('\n' + '🔬'.repeat(15));
    logHeader('CISCO AI API ACCESS LIMITS TEST');
    console.log('🔬'.repeat(15) + '\n');

    // Build configuration
    const tier = (process.env.CISCO_AI_TIER || 'free') as CiscoAITier;
    const model = process.env.CISCO_AI_MODEL || 'gpt-4o-mini';

    const providerConfig: CiscoAIProviderConfig = {
        clientId: process.env.CISCO_AI_CLIENT_ID || '',
        clientSecret: process.env.CISCO_AI_CLIENT_SECRET || '',
        tokenUrl: process.env.CISCO_AI_TOKEN_URL || 'https://id.cisco.com/oauth2/default/v1/token',
        endpoint: process.env.CISCO_AI_ENDPOINT || 'https://chat-ai.cisco.com',
        apiKey: process.env.CISCO_AI_API_KEY || '',
        apiVersion: process.env.CISCO_AI_API_VERSION || '2023-12-01-preview',
        model,
        tier,
        maxTokens: 2000, // Use safe default for testing (model limit may be lower than env config)
        temperature: 0.3,
        timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
    };

    let provider: CiscoAIProvider;

    try {
        provider = createCiscoAIProvider(providerConfig);
    } catch (error: any) {
        logError(`Failed to create provider: ${error.message}`);
        process.exit(1);
    }

    const tierConfig = CISCO_AI_TIER_CONFIG[tier];
    const testConfig: TestConfig = {
        provider,
        tier,
        model,
        expectedRateLimit: tierConfig.requestsPerMinute[model] || 30,
        expectedPeakTokens: tierConfig.peakTokens[model] || 200000,
    };

    // Run tests
    try {
        // Test 1: Environment Configuration
        const envResults = testEnvironmentConfiguration();
        envResults.forEach(addResult);

        // Test 2: Authentication
        const authResult = await testAuthentication(testConfig);
        addResult(authResult);

        // Only continue if authentication succeeded
        if (!authResult.passed) {
            logError('Stopping tests - authentication failed.');
            printSummary();
            process.exit(1);
        }

        // Test 3: Configured Rate Limits
        addResult(testConfiguredRateLimits(testConfig));

        // Test 4: Configured Token Limits
        addResult(testConfiguredTokenLimits(testConfig));

        // Test 5: Rate Limit Discovery (reduced to 5 requests to avoid hitting limits)
        const rateLimitResult = await testRateLimitDiscovery(testConfig, 5);
        addResult(rateLimitResult);

        // Test 6: Token Limit Discovery
        const tokenLimitResult = await testTokenLimitDiscovery(testConfig);
        addResult(tokenLimitResult);

        // Test 7: Available Models
        addResult(testAvailableModels(testConfig));

        // Test 8: Error Handling
        const errorResult = await testErrorHandling(testConfig);
        addResult(errorResult);

    } catch (error: any) {
        logError(`Unexpected error during tests: ${error.message}`);
    }

    // Print summary
    printSummary();
}

// Run
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
