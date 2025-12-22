/**
 * LLM Providers Index
 * 
 * Exports and factory function for LLM providers.
 * Supports OpenAI, Google Gemini, Anthropic Claude, Cisco AI, and Mock providers.
 * Configuration is loaded from config/llm.config.json.
 * 
 * @module services/ai/providers
 * @version 1.1.0
 * @created 2025-12-06
 */

import * as fs from 'fs';
import * as path from 'path';

// Export interfaces and types
export {
  ILLMProvider,
  BaseLLMProvider,
  LLMProviderConfig,
  LLMCompletionResponse,
  LLMCompletionOptions,
} from './LLMProvider';

// Export providers
export { MockProvider, createMockProvider } from './MockProvider';
export { OpenAIProvider, OpenAIProviderConfig, createOpenAIProvider } from './OpenAIProvider';
export { GeminiProvider, GeminiProviderConfig, createGeminiProvider } from './GeminiProvider';
export { AnthropicProvider, AnthropicProviderConfig, createAnthropicProvider } from './AnthropicProvider';
export { CiscoAIProvider, CiscoAIProviderConfig, createCiscoAIProvider } from './CiscoAIProvider';

import { ILLMProvider } from './LLMProvider';
import { createMockProvider } from './MockProvider';
import { createOpenAIProvider } from './OpenAIProvider';
import { createGeminiProvider } from './GeminiProvider';
import { createAnthropicProvider } from './AnthropicProvider';
import { createCiscoAIProvider } from './CiscoAIProvider';

/**
 * Supported provider types
 */
export type ProviderType = 'openai' | 'gemini' | 'anthropic' | 'cisco' | 'mock';

/**
 * Provider configuration from config file
 */
export interface ProviderConfigEntry {
  enabled: boolean;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  description?: string;
}

/**
 * LLM config file structure
 */
export interface LLMConfig {
  version: string;
  description: string;
  defaultProvider: ProviderType;
  providers: Record<ProviderType, ProviderConfigEntry>;
  fallbackOrder: ProviderType[];
  apiKeys: Record<string, string>;
  modelAliases: Record<string, ProviderType>;
  rateLimits?: Record<string, { requestsPerMinute: number; tokensPerMinute: number }>;
}

/**
 * Runtime configuration for creating a provider
 */
export interface CreateProviderConfig {
  /** Provider type */
  type: ProviderType;
  /** API key (overrides environment variable) */
  apiKey?: string;
  /** Model to use (overrides config file) */
  model?: string;
  /** Max tokens (overrides config file) */
  maxTokens?: number;
  /** Temperature (overrides config file) */
  temperature?: number;
  /** Request timeout in ms (overrides config file) */
  timeout?: number;
}

// Cached config
let cachedConfig: LLMConfig | null = null;

/**
 * Load LLM configuration from config file
 */
export function loadLLMConfig(): LLMConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Try multiple paths for config file
  const configPaths = [
    path.join(process.cwd(), 'config', 'llm.config.json'),
    path.join(__dirname, '../../../../config/llm.config.json'),
    path.join(__dirname, '../../../../../config/llm.config.json'),
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        cachedConfig = JSON.parse(configContent) as LLMConfig;
        console.log(`[LLM] Loaded config from ${configPath}`);
        return cachedConfig;
      }
    } catch (error) {
      console.warn(`[LLM] Failed to load config from ${configPath}:`, error);
    }
  }

  // Return default config if file not found
  console.log('[LLM] Using default configuration (config file not found)');
  cachedConfig = getDefaultConfig();
  return cachedConfig;
}

/**
 * Get default configuration
 */
function getDefaultConfig(): LLMConfig {
  return {
    version: '1.0.0',
    description: 'Default LLM configuration',
    defaultProvider: 'mock',
    providers: {
      openai: {
        enabled: true,
        model: 'gpt-4o',
        maxTokens: 2000,
        temperature: 0.3,
        timeout: 30000,
      },
      gemini: {
        enabled: true,
        model: 'gemini-1.5-pro',
        maxTokens: 2000,
        temperature: 0.3,
        timeout: 30000,
      },
      anthropic: {
        enabled: true,
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 2000,
        temperature: 0.3,
        timeout: 30000,
      },
      cisco: {
        enabled: true,
        model: 'gpt-4o',
        maxTokens: 2000,
        temperature: 0.3,
        timeout: 30000,
      },
      mock: {
        enabled: true,
        model: 'mock-model',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 5000,
      },
    },
    fallbackOrder: ['cisco', 'openai', 'gemini', 'anthropic', 'mock'],
    apiKeys: {},
    modelAliases: {},
  };
}

/**
 * Clear cached configuration (for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}

/**
 * Get API key for a provider from environment
 */
export function getProviderApiKey(provider: ProviderType): string | undefined {
  const envKeys: Record<ProviderType, string> = {
    openai: 'OPENAI_API_KEY',
    gemini: 'GEMINI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    cisco: 'CISCO_AI_CLIENT_ID',  // Check for client ID as indicator of Cisco config
    mock: '',
  };

  const envKey = envKeys[provider];
  return envKey ? process.env[envKey] : undefined;
}

/**
 * Check if Cisco AI provider is fully configured
 */
export function isCiscoConfigured(): boolean {
  const requiredVars = [
    'CISCO_AI_CLIENT_ID',
    'CISCO_AI_CLIENT_SECRET',
    'CISCO_AI_TOKEN_URL',
    'CISCO_AI_ENDPOINT',
    'CISCO_AI_API_KEY'
  ];
  
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.log(`[LLM] Cisco AI not fully configured. Missing: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Create an LLM provider based on type and config
 * 
 * @param config - Provider configuration (type is required, others override config file)
 * @returns Configured LLM provider instance
 * @throws Error if provider type is invalid or required config is missing
 * 
 * @example
 * // Create OpenAI provider using config file settings
 * const provider = createLLMProvider({ type: 'openai' });
 * 
 * @example
 * // Create with custom settings
 * const provider = createLLMProvider({
 *   type: 'anthropic',
 *   model: 'claude-3-opus-20240229',
 *   temperature: 0.5,
 * });
 */
export function createLLMProvider(config: CreateProviderConfig): ILLMProvider {
  const { type } = config;
  const llmConfig = loadLLMConfig();
  const providerConfig = llmConfig.providers[type];

  if (!providerConfig) {
    throw new Error(`Unknown LLM provider type: ${type}. Supported types: openai, gemini, anthropic, mock`);
  }

  if (!providerConfig.enabled) {
    throw new Error(`Provider '${type}' is disabled in configuration`);
  }

  // Merge config file settings with runtime overrides
  const baseConfig = {
    model: config.model ?? providerConfig.model,
    maxTokens: config.maxTokens ?? providerConfig.maxTokens,
    temperature: config.temperature ?? providerConfig.temperature,
    timeout: config.timeout ?? providerConfig.timeout,
  };

  // Get API key (runtime override > env var)
  const apiKey = config.apiKey ?? getProviderApiKey(type);

  switch (type) {
    case 'openai': {
      if (!apiKey) {
        throw new Error('OpenAI provider requires OPENAI_API_KEY environment variable');
      }
      return createOpenAIProvider({
        ...baseConfig,
        apiKey,
      });
    }

    case 'gemini': {
      if (!apiKey) {
        throw new Error('Gemini provider requires GEMINI_API_KEY environment variable');
      }
      return createGeminiProvider({
        ...baseConfig,
        apiKey,
      });
    }

    case 'anthropic': {
      if (!apiKey) {
        throw new Error('Anthropic provider requires ANTHROPIC_API_KEY environment variable');
      }
      return createAnthropicProvider({
        ...baseConfig,
        apiKey,
      });
    }

    case 'cisco': {
      if (!isCiscoConfigured()) {
        throw new Error('Cisco AI provider requires CISCO_AI_CLIENT_ID, CISCO_AI_CLIENT_SECRET, CISCO_AI_TOKEN_URL, CISCO_AI_ENDPOINT, and CISCO_AI_API_KEY environment variables');
      }
      // Get tier from environment (defaults to 'free')
      const tier = (process.env.CISCO_AI_TIER?.toLowerCase() === 'payg') ? 'payg' : 'free';
      return createCiscoAIProvider({
        ...baseConfig,
        clientId: process.env.CISCO_AI_CLIENT_ID!,
        clientSecret: process.env.CISCO_AI_CLIENT_SECRET!,
        tokenUrl: process.env.CISCO_AI_TOKEN_URL!,
        endpoint: process.env.CISCO_AI_ENDPOINT!,
        apiKey: process.env.CISCO_AI_API_KEY!,
        apiVersion: process.env.CISCO_AI_API_VERSION || '2023-12-01-preview',
        tier,
      });
    }

    case 'mock': {
      return createMockProvider(baseConfig);
    }

    default:
      throw new Error(`Unknown LLM provider type: ${type}`);
  }
}

/**
 * Resolve a model alias to a provider type
 */
export function resolveModelAlias(alias: string): ProviderType | null {
  const config = loadLLMConfig();
  const lowerAlias = alias.toLowerCase();
  return config.modelAliases[lowerAlias] || null;
}

/**
 * Get the first available provider based on fallback order
 * 
 * Checks each provider in fallbackOrder and returns the first one
 * that is enabled and has an API key configured.
 * 
 * @returns Configured LLM provider
 */
export function getDefaultProvider(): ILLMProvider {
  const config = loadLLMConfig();

  for (const providerType of config.fallbackOrder) {
    const providerConfig = config.providers[providerType];

    if (!providerConfig?.enabled) {
      continue;
    }

    // Mock provider doesn't need an API key
    if (providerType === 'mock' || process.env.NODE_ENV === 'test') {
      console.log('[LLM] Using mock provider (for development/testing)');
      return createLLMProvider({ type: 'mock' });
    }

    // Cisco requires multiple env vars
    if (providerType === 'cisco') {
      if (isCiscoConfigured()) {
        console.log(`[LLM] Using Cisco AI provider with ${providerConfig.model}`);
        return createLLMProvider({ type: 'cisco' });
      }
      continue;
    }

    // Check if API key is available
    const apiKey = getProviderApiKey(providerType);
    if (apiKey) {
      console.log(`[LLM] Using ${providerType} provider with ${providerConfig.model}`);
      return createLLMProvider({ type: providerType });
    }
  }

  // Fallback to mock if no provider is configured
  console.log('[LLM] No API keys found, using mock provider');
  return createLLMProvider({ type: 'mock' });
}

/**
 * Get list of available providers (enabled and with API keys)
 */
export function getAvailableProviders(): ProviderType[] {
  const config = loadLLMConfig();
  const available: ProviderType[] = [];

  for (const [type, providerConfig] of Object.entries(config.providers)) {
    if (!providerConfig.enabled) continue;

    const providerType = type as ProviderType;

    if (providerType === 'mock') {
      available.push(providerType);
    } else if (providerType === 'cisco') {
      if (isCiscoConfigured()) {
        available.push(providerType);
      }
    } else if (getProviderApiKey(providerType)) {
      available.push(providerType);
    }
  }

  return available;
}

/**
 * Get provider configuration info
 */
export function getProviderInfo(type: ProviderType): ProviderConfigEntry | null {
  const config = loadLLMConfig();
  return config.providers[type] || null;
}
