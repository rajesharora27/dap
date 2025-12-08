
import dotenv from 'dotenv';
import path from 'path';
import { createCiscoAIProvider } from '../backend/src/services/ai/providers/CiscoAIProvider';

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testCiscoConnection() {
    console.log('--- Testing Cisco AI Gateway Connection ---');

    // Get auth mode from env (default: oauth, can be 'apikey' to skip OAuth)
    const authMode = (process.env.CISCO_AI_AUTH_MODE || 'oauth') as 'oauth' | 'apikey';
    
    const config = {
        clientId: process.env.CISCO_AI_CLIENT_ID || '',
        clientSecret: process.env.CISCO_AI_CLIENT_SECRET || '',
        tokenUrl: process.env.CISCO_AI_TOKEN_URL || '',
        endpoint: process.env.CISCO_AI_ENDPOINT || '',
        apiKey: process.env.CISCO_AI_API_KEY || '',
        apiVersion: process.env.CISCO_AI_API_VERSION || '2023-12-01-preview',
        model: process.env.CISCO_AI_MODEL || 'gpt-4o',
        scope: process.env.CISCO_AI_SCOPE || '',
        audience: process.env.CISCO_AI_AUDIENCE || '',
        authMode,
        maxTokens: 100,
        temperature: 0.7,
        timeout: 30000,
    };

    // Basic Validation
    if (!config.clientId || !config.clientSecret) {
        console.error('❌ Missing Client ID or Secret in .env');
        process.exit(1);
    }

    console.log(`✅ Configuration loaded for model: ${config.model}`);
    console.log(`   Endpoint: ${config.endpoint}`);
    console.log(`   Token URL: ${config.tokenUrl}`);
    console.log(`   Scope: ${config.scope || '(not set)'}`);
    console.log(`   Audience: ${config.audience || '(not set)'}`);
    console.log(`   API Key: ${config.apiKey ? config.apiKey.substring(0, 20) + '...' : '(not set)'}`);
    console.log(`   API Version: ${config.apiVersion}`);

    const provider = createCiscoAIProvider(config);

    try {
        console.log(`\n1. Authenticating...`);
        // This will trigger getAccessToken internally

        console.log(`\n2. Sending test request...`);
        const startTime = Date.now();

        const response = await provider.complete('Hello! Please verify you are operational by responding with "System Operational".');

        const duration = Date.now() - startTime;
        console.log(`\n✅ Response received in ${duration}ms:`);
        console.log('--------------------------------------------------');
        console.log(response.text);
        console.log('--------------------------------------------------');
        console.log(`Usage: ${JSON.stringify(response.usage)}`);

    } catch (error: any) {
        console.error('\n❌ Connection Failed:');
        if (error.message) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error(error);
        }
    }
}

testCiscoConnection();
