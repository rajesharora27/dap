/**
 * Cisco AI LLM Provider
 * 
 * Implementation of LLM provider using Cisco's AI Gateway.
 * Supports OAuth2 authentication and Azure OpenAI-compatible API.
 * 
 * TIER INFORMATION (as of 2024):
 * ┌────────────────────┬──────────────┬───────────────────┬──────────────────┐
 * │ Tier               │ Model        │ Requests/min      │ Peak Tokens      │
 * ├────────────────────┼──────────────┼───────────────────┼──────────────────┤
 * │ Free               │ GPT-4o mini  │ 30                │ 200K             │
 * │ Free               │ GPT-4.1      │ 15                │ 120K             │
 * │ Pay-as-you-use     │ GPT-4o mini  │ Unlimited         │ 1M               │
 * │ Pay-as-you-use     │ GPT-4o       │ Unlimited         │ 1M               │
 * └────────────────────┴──────────────┴───────────────────┴──────────────────┘
 * 
 * @module services/ai/providers/CiscoAIProvider
 * @version 1.1.0
 * @created 2025-12-06
 * @updated 2025-12-06 - Added tier support
 */

import {
    BaseLLMProvider,
    LLMProviderConfig,
    LLMCompletionResponse,
    LLMCompletionOptions,
} from './LLMProvider';

/**
 * Cisco AI tier options
 * - free: Limited requests/min (30 for 4o-mini, 15 for 4.1), lower token limits
 * - payg: Pay-as-you-go, unlimited requests, 1M peak tokens
 */
export type CiscoAITier = 'free' | 'payg';

/**
 * Tier-specific rate limits and model restrictions
 */
export const CISCO_AI_TIER_CONFIG: Record<CiscoAITier, {
    requestsPerMinute: Record<string, number>;
    peakTokens: Record<string, number>;
    availableModels: string[];
}> = {
    free: {
        requestsPerMinute: {
            'gpt-4o-mini': 30,
            'gpt-4.1': 15,
        },
        peakTokens: {
            'gpt-4o-mini': 200000,
            'gpt-4.1': 120000,
        },
        availableModels: ['gpt-4o-mini', 'gpt-4.1'],
    },
    payg: {
        requestsPerMinute: {
            'gpt-4o-mini': Infinity,
            'gpt-4o': Infinity,
        },
        peakTokens: {
            'gpt-4o-mini': 1000000,
            'gpt-4o': 1000000,
        },
        availableModels: ['gpt-4o-mini', 'gpt-4o'],
    },
};

export interface CiscoAIProviderConfig extends LLMProviderConfig {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    endpoint: string;
    apiKey: string; // The application key (app-key/api-key)
    apiVersion: string;
    scope?: string; // OAuth scope (e.g., "api://chat-ai.cisco.com/.default")
    audience?: string; // OAuth audience
    authMode?: 'oauth' | 'apikey'; // Authentication mode (default: oauth)
    tier?: CiscoAITier; // Pricing tier (free or payg)
}

interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export class CiscoAIProvider extends BaseLLMProvider {
    readonly name = 'cisco';
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(public config: CiscoAIProviderConfig) {
        super(config);
        this.validateTierConfig();
    }

    /**
     * Validate the tier configuration and warn about mismatches
     */
    private validateTierConfig(): void {
        const tier = this.getTier();
        const model = this.config.model;
        const tierConfig = CISCO_AI_TIER_CONFIG[tier];

        // Check if model is available for the tier
        if (!tierConfig.availableModels.includes(model)) {
            console.warn(`[CiscoAI] ⚠️ Warning: Model "${model}" may not be available on "${tier}" tier.`);
            console.warn(`[CiscoAI] Available models for ${tier} tier: ${tierConfig.availableModels.join(', ')}`);
        }

        // Log tier information
        const rateLimit = tierConfig.requestsPerMinute[model] || 'Unknown';
        const peakTokens = tierConfig.peakTokens[model] || 'Unknown';
        console.log(`[CiscoAI] Tier: ${tier}, Model: ${model}`);
        console.log(`[CiscoAI] Rate limit: ${rateLimit === Infinity ? 'Unlimited' : rateLimit} requests/min`);
        console.log(`[CiscoAI] Peak tokens: ${typeof peakTokens === 'number' ? (peakTokens / 1000) + 'K' : peakTokens}`);
    }

    /**
     * Get the configured tier (defaults to 'free')
     */
    getTier(): CiscoAITier {
        return this.config.tier || 'free';
    }

    /**
     * Get rate limit for the current tier and model
     */
    getRateLimit(): number {
        const tier = this.getTier();
        const model = this.config.model;
        return CISCO_AI_TIER_CONFIG[tier]?.requestsPerMinute[model] || 30;
    }

    /**
     * Get peak tokens for the current tier and model
     */
    getPeakTokens(): number {
        const tier = this.getTier();
        const model = this.config.model;
        return CISCO_AI_TIER_CONFIG[tier]?.peakTokens[model] || 200000;
    }

    /**
     * Get available models for the current tier
     */
    getAvailableModels(): string[] {
        const tier = this.getTier();
        return CISCO_AI_TIER_CONFIG[tier]?.availableModels || [];
    }

    isReady(): boolean {
        return Boolean(
            this.config.clientId &&
            this.config.clientSecret &&
            this.config.tokenUrl &&
            this.config.endpoint
        );
    }

    /**
     * Get a valid OAuth2 access token using Basic Authentication
     * Cisco IDP requires client_id:client_secret as Base64 in Authorization header
     */
    private async getAccessToken(): Promise<string> {
        const now = Date.now();
        // Use cached token if valid (with 60s buffer)
        if (this.accessToken && this.tokenExpiresAt > now + 60000) {
            return this.accessToken;
        }

        console.log('[CiscoAI] Refreshing access token...');

        // Cisco OAuth uses Basic Auth with base64-encoded credentials
        const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
        const base64Credentials = Buffer.from(credentials).toString('base64');

        // Body only contains grant_type (credentials are in header)
        const body = 'grant_type=client_credentials';

        try {
            console.log(`[CiscoAI] Token request to: ${this.config.tokenUrl}`);
            console.log(`[CiscoAI] Using Basic Auth with client credentials`);

            const response = await fetch(this.config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${base64Credentials}`,
                },
                body: body,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.log(`[CiscoAI] Token error body: ${errorBody}`);
                throw new Error(`Token request failed: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            const data: TokenResponse = await response.json();
            this.accessToken = data.access_token;
            this.tokenExpiresAt = now + (data.expires_in * 1000);

            // Debug: Decode JWT to inspect claims
            try {
                const tokenParts = data.access_token.split('.');
                if (tokenParts.length === 3) {
                    const payloadBase64 = tokenParts[1];
                    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
                    const payload = JSON.parse(payloadJson);
                    console.log('[CiscoAI Debug] Token Claims:');
                    console.log('  - Issuer (iss):', payload.iss || 'N/A');
                    console.log('  - Audience (aud):', payload.aud || 'N/A');
                    console.log('  - Scope (scp/scope):', payload.scp || payload.scope || 'N/A');
                    console.log('  - Expires:', new Date(payload.exp * 1000).toISOString());
                }
            } catch (decodeErr) {
                console.log('[CiscoAI Debug] Could not decode token for inspection');
            }

            console.log('[CiscoAI] Access token obtained successfully');
            return this.accessToken;
        } catch (error) {
            console.error('[CiscoAI] Error fetching access token:', error);
            throw error;
        }
    }

    async complete(
        prompt: string,
        options?: LLMCompletionOptions
    ): Promise<LLMCompletionResponse> {
        if (!this.isReady()) {
            throw new Error('Cisco AI provider is not fully configured.');
        }

        const startTime = Date.now();

        const messages = [
            { role: 'system', content: options?.systemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
        ];

        const requestBody = {
            messages,
            max_tokens: options?.maxTokens ?? this.config.maxTokens,
            temperature: options?.temperature ?? this.config.temperature,
            stream: false,
            user: JSON.stringify({ appkey: this.config.apiKey }),  // Cisco requires appkey in user field
            stop: ['<|im_end|>']  // Cisco recommended stop sequence
        };

        // Construct the URL. Use the model name as the deployment ID.
        const deploymentId = this.config.model;
        const url = `${this.config.endpoint}/openai/deployments/${deploymentId}/chat/completions`;

        // Get OAuth access token - this becomes the api-key for Cisco AI
        const token = await this.getAccessToken();

        // Build headers - Cisco AI Gateway uses the OAuth token as api-key
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'api-key': token,  // OAuth token goes here
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            console.log(`[CiscoAI] Sending request to: ${url}`);
            console.log(`[CiscoAI] Using OAuth token as api-key header`);
            console.log(`[CiscoAI] Headers: ${Object.keys(headers).join(', ')}`);

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Log response headers for debugging
            console.log(`[CiscoAI] Response status: ${response.status}`);
            const wwwAuth = response.headers.get('www-authenticate');
            if (wwwAuth) {
                console.log(`[CiscoAI] WWW-Authenticate: ${wwwAuth}`);
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.log(`[CiscoAI] Error response: ${errorText.substring(0, 500)}`);
                throw new Error(`Cisco AI API error: ${response.status} - ${errorText}`);
            }

            const data: any = await response.json();

            // Handle Azure/OpenAI unified response format
            const choice = data.choices?.[0];
            if (!choice?.message?.content) {
                throw new Error('Received empty response from Cisco AI');
            }

            return {
                text: choice.message.content,
                model: data.model || this.config.model,
                latency: Date.now() - startTime,
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0
                }
            };

        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timed out after ${this.config.timeout}ms`);
            }
            throw error;
        }
    }

    async generateStructured<T>(prompt: string, schema: object, options?: LLMCompletionOptions): Promise<T> {
        // Fallback implementation for structured output - basically same as complete but parsing JSON
        // Note: Older Azure versions might not support 'json_object' response_format well. 
        // We will try standard prompting first.

        const jsonPrompt = `${prompt}\n\nUnwrap your result in a valid JSON object matching this schema:\n${JSON.stringify(schema, null, 2)}\n\nRespond ONLY with the JSON.`;

        const response = await this.complete(jsonPrompt, {
            ...options,
            temperature: 0.1 // strict
        });

        try {
            // clean up markdown code blocks if present
            let cleanText = response.text.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
            if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');

            return JSON.parse(cleanText) as T;
        } catch (e) {
            throw new Error(`Failed to parse structured response: ${e}`);
        }
    }
}

export function createCiscoAIProvider(config: CiscoAIProviderConfig): CiscoAIProvider {
    return new CiscoAIProvider(config);
}
