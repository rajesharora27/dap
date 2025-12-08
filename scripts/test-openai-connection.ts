
import dotenv from 'dotenv';
import path from 'path';
import { createOpenAIProvider } from '../backend/src/services/ai/providers/OpenAIProvider';

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testOpenAIConnection() {
    console.log('--- Testing OpenAI Connection ---');

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.startsWith('sk-...') || apiKey.length < 10) {
        console.error('❌ Error: OPENAI_API_KEY is not set or valid in .env');
        console.log('Please add your OpenAI API Key to the .env file.');
        process.exit(1);
    }

    console.log(`✅ API Key found: ${apiKey.substring(0, 7)}...`);

    const provider = createOpenAIProvider({
        apiKey: apiKey,
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        maxTokens: 100,
        temperature: 0.7,
        timeout: 30000,
    });

    try {
        console.log(`\nSending request to OpenAI (Model: ${(provider as any).config.model})...`);
        const startTime = Date.now();

        // Simple test query
        const response = await provider.complete('Hello! Are you working? Respond with "Yes, I am functioning correctly." if you receive this.');

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

testOpenAIConnection();
