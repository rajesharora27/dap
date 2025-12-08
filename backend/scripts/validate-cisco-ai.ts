#!/usr/bin/env ts-node
/**
 * Cisco AI Configuration Validator
 * 
 * Tests the tier configuration for Cisco AI models.
 * Run with: npx ts-node scripts/validate-cisco-ai.ts
 */

import {
    CiscoAIProvider,
    CiscoAIProviderConfig,
    CiscoAITier,
    CISCO_AI_TIER_CONFIG
} from '../src/services/ai/providers/CiscoAIProvider';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
};

function log(message: string, color: string = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logHeader(title: string) {
    console.log('\n' + '='.repeat(60));
    log(title, colors.bold + colors.blue);
    console.log('='.repeat(60));
}

function logSuccess(message: string) {
    log(`✅ ${message}`, colors.green);
}

function logWarning(message: string) {
    log(`⚠️  ${message}`, colors.yellow);
}

function logError(message: string) {
    log(`❌ ${message}`, colors.red);
}

// Test configuration (no real credentials needed for config validation)
const baseConfig: Partial<CiscoAIProviderConfig> = {
    clientId: 'test-client-id',
    clientSecret: 'test-secret',
    tokenUrl: 'https://id.cisco.com/oauth2/default/v1/token',
    endpoint: 'https://chat-ai.cisco.com',
    apiKey: 'test-api-key',
    apiVersion: '2023-12-01-preview',
    maxTokens: 2000,
    temperature: 0.3,
    timeout: 30000,
};

async function validateTierConfig() {
    logHeader('Cisco AI Tier Configuration');

    console.log('\nTier Configuration Constants:');
    console.log('-'.repeat(60));

    for (const [tier, config] of Object.entries(CISCO_AI_TIER_CONFIG)) {
        console.log(`\n${colors.bold}Tier: ${tier.toUpperCase()}${colors.reset}`);
        console.log(`  Available Models: ${config.availableModels.join(', ')}`);
        console.log('  Rate Limits:');
        for (const [model, limit] of Object.entries(config.requestsPerMinute)) {
            const limitStr = limit === Infinity ? 'Unlimited' : `${limit} req/min`;
            console.log(`    - ${model}: ${limitStr}`);
        }
        console.log('  Peak Tokens:');
        for (const [model, tokens] of Object.entries(config.peakTokens)) {
            console.log(`    - ${model}: ${(tokens / 1000).toLocaleString()}K`);
        }
    }
}

async function validateModelAvailability() {
    logHeader('Model Availability by Tier');

    const testCases = [
        { tier: 'free' as CiscoAITier, model: 'gpt-4o-mini', shouldWork: true },
        { tier: 'free' as CiscoAITier, model: 'gpt-4.1', shouldWork: true },
        { tier: 'free' as CiscoAITier, model: 'gpt-4o', shouldWork: false },
        { tier: 'payg' as CiscoAITier, model: 'gpt-4o-mini', shouldWork: true },
        { tier: 'payg' as CiscoAITier, model: 'gpt-4o', shouldWork: true },
        { tier: 'payg' as CiscoAITier, model: 'gpt-4.1', shouldWork: false },
    ];

    console.log('\nValidating model availability:');
    console.log('-'.repeat(60));

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
        const tierConfig = CISCO_AI_TIER_CONFIG[testCase.tier];
        const isAvailable = tierConfig.availableModels.includes(testCase.model);

        const expectedResult = testCase.shouldWork ? 'available' : 'NOT available';
        const actualResult = isAvailable ? 'available' : 'NOT available';

        if (isAvailable === testCase.shouldWork) {
            logSuccess(`${testCase.tier} + ${testCase.model}: ${actualResult} (expected)`);
            passed++;
        } else {
            logError(`${testCase.tier} + ${testCase.model}: ${actualResult} (expected: ${expectedResult})`);
            failed++;
        }
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

async function validateProviderCreation() {
    logHeader('Provider Creation Validation');

    const testConfigs = [
        { tier: 'free' as CiscoAITier, model: 'gpt-4o-mini', expectWarning: false },
        { tier: 'free' as CiscoAITier, model: 'gpt-4.1', expectWarning: false },
        { tier: 'free' as CiscoAITier, model: 'gpt-4o', expectWarning: true },
        { tier: 'payg' as CiscoAITier, model: 'gpt-4o', expectWarning: false },
        { tier: 'payg' as CiscoAITier, model: 'gpt-4o-mini', expectWarning: false },
    ];

    console.log('\nCreating providers with different configurations:');
    console.log('-'.repeat(60));

    for (const testConfig of testConfigs) {
        console.log(`\n${colors.bold}Testing: ${testConfig.tier} tier with ${testConfig.model}${colors.reset}`);

        // Capture console output
        const originalWarn = console.warn;
        let warningCaptured = false;
        console.warn = (...args: any[]) => {
            warningCaptured = true;
            originalWarn.apply(console, args);
        };

        try {
            const provider = new CiscoAIProvider({
                ...baseConfig,
                model: testConfig.model,
                tier: testConfig.tier,
            } as CiscoAIProviderConfig);

            // Restore console.warn
            console.warn = originalWarn;

            // Check provider methods
            const rateLimit = provider.getRateLimit();
            const peakTokens = provider.getPeakTokens();
            const availableModels = provider.getAvailableModels();

            console.log(`  Rate Limit: ${rateLimit === Infinity ? 'Unlimited' : rateLimit + ' req/min'}`);
            console.log(`  Peak Tokens: ${(peakTokens / 1000).toLocaleString()}K`);
            console.log(`  Available Models: ${availableModels.join(', ')}`);
            console.log(`  isReady(): ${provider.isReady()}`);

            if (testConfig.expectWarning && !warningCaptured) {
                logWarning(`Expected warning for ${testConfig.model} on ${testConfig.tier} tier, but none captured`);
            } else if (!testConfig.expectWarning && warningCaptured) {
                logWarning(`Unexpected warning for ${testConfig.model} on ${testConfig.tier} tier`);
            } else {
                logSuccess(`Configuration validated correctly`);
            }

        } catch (error: any) {
            console.warn = originalWarn;
            logError(`Failed to create provider: ${error.message}`);
        }
    }
}

async function validateEnvironmentConfig() {
    logHeader('Environment Configuration');

    console.log('\nCurrent environment settings:');
    console.log('-'.repeat(60));

    const envVars = [
        'CISCO_AI_TIER',
        'CISCO_AI_MODEL',
        'CISCO_AI_CLIENT_ID',
        'CISCO_AI_CLIENT_SECRET',
        'CISCO_AI_API_KEY',
        'CISCO_AI_TOKEN_URL',
        'CISCO_AI_ENDPOINT',
        'CISCO_AI_API_VERSION',
    ];

    for (const envVar of envVars) {
        const value = process.env[envVar];
        if (value) {
            // Mask secrets
            const displayValue = envVar.includes('SECRET') || envVar.includes('KEY')
                ? value.substring(0, 8) + '...'
                : value;
            logSuccess(`${envVar}: ${displayValue}`);
        } else {
            logWarning(`${envVar}: not set`);
        }
    }

    // Validate tier + model combination
    const tier = (process.env.CISCO_AI_TIER?.toLowerCase() === 'payg') ? 'payg' : 'free';
    const model = process.env.CISCO_AI_MODEL || 'gpt-4o';

    console.log('\n' + '-'.repeat(60));
    console.log(`Validating: ${tier} tier with ${model} model`);

    const tierConfig = CISCO_AI_TIER_CONFIG[tier as CiscoAITier];
    if (tierConfig.availableModels.includes(model)) {
        logSuccess(`Model "${model}" is available on "${tier}" tier`);
    } else {
        logError(`Model "${model}" is NOT available on "${tier}" tier!`);
        logWarning(`Available models for ${tier}: ${tierConfig.availableModels.join(', ')}`);
    }
}

async function main() {
    console.log('\n' + '🔍 '.repeat(20));
    log('\n  CISCO AI CONFIGURATION VALIDATOR\n', colors.bold + colors.blue);
    console.log('🔍 '.repeat(20) + '\n');

    await validateTierConfig();
    const modelTestPassed = await validateModelAvailability();
    await validateProviderCreation();
    await validateEnvironmentConfig();

    logHeader('Summary');

    if (modelTestPassed) {
        logSuccess('All tier configuration tests passed!');
    } else {
        logError('Some tests failed. Please review the output above.');
    }

    console.log('\n');
}

main().catch(console.error);
