/**
 * LLM Providers Tests
 * 
 * Unit tests for the LLM provider layer.
 * 
 * @module services/ai/__tests__/providers.test
 * @version 1.0.0
 */

import {
  createLLMProvider,
  getDefaultProvider,
  getAvailableProviders,
  loadLLMConfig,
  clearConfigCache,
  resolveModelAlias,
  getProviderApiKey,
  MockProvider,
  ILLMProvider,
} from '../providers';

describe('LLM Providers', () => {
  beforeEach(() => {
    // Clear config cache before each test
    clearConfigCache();
  });

  describe('loadLLMConfig', () => {
    it('should load configuration', () => {
      const config = loadLLMConfig();
      
      expect(config).toBeDefined();
      expect(config.version).toBeDefined();
      expect(config.providers).toBeDefined();
      expect(config.fallbackOrder).toBeDefined();
    });

    it('should have all provider types defined', () => {
      const config = loadLLMConfig();
      
      expect(config.providers.openai).toBeDefined();
      expect(config.providers.gemini).toBeDefined();
      expect(config.providers.anthropic).toBeDefined();
      expect(config.providers.mock).toBeDefined();
    });

    it('should cache the configuration', () => {
      const config1 = loadLLMConfig();
      const config2 = loadLLMConfig();
      
      expect(config1).toBe(config2); // Same reference
    });
  });

  describe('createLLMProvider', () => {
    it('should create a mock provider', () => {
      const provider = createLLMProvider({ type: 'mock' });
      
      expect(provider).toBeDefined();
      expect(provider.name).toBe('mock');
      expect(provider.isReady()).toBe(true);
    });

    it('should throw for unknown provider type', () => {
      expect(() => {
        createLLMProvider({ type: 'unknown' as any });
      }).toThrow('Unknown LLM provider type');
    });

    it('should throw for OpenAI without API key', () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      expect(() => {
        createLLMProvider({ type: 'openai' });
      }).toThrow('OPENAI_API_KEY');
      
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    });

    it('should throw for Gemini without API key', () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      
      expect(() => {
        createLLMProvider({ type: 'gemini' });
      }).toThrow('GEMINI_API_KEY');
      
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    });

    it('should throw for Anthropic without API key', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      
      expect(() => {
        createLLMProvider({ type: 'anthropic' });
      }).toThrow('ANTHROPIC_API_KEY');
      
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });

    it('should allow runtime config overrides', () => {
      const provider = createLLMProvider({
        type: 'mock',
        model: 'custom-mock',
        maxTokens: 500,
        temperature: 0.9,
      });
      
      expect(provider).toBeDefined();
      expect(provider.name).toBe('mock');
    });
  });

  describe('MockProvider', () => {
    let provider: MockProvider;

    beforeEach(() => {
      provider = new MockProvider();
    });

    it('should be ready by default', () => {
      expect(provider.isReady()).toBe(true);
    });

    it('should complete prompts', async () => {
      const response = await provider.complete('Show me all products');
      
      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(response.model).toBe('mock-model');
      expect(response.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return predictable responses for known patterns', async () => {
      const productResponse = await provider.complete('List all products');
      // MockProvider may return JSON with capitalized model names
      expect(productResponse.text.toLowerCase()).toContain('product');

      const customerResponse = await provider.complete('Show customers');
      expect(customerResponse.text.toLowerCase()).toContain('customer');
    });

    it('should support custom responses', async () => {
      provider.setCustomResponse('test pattern', '{"custom": true}');
      
      const response = await provider.complete('This is a test pattern query');
      expect(response.text).toBe('{"custom": true}');
    });

    it('should clear custom responses', async () => {
      provider.setCustomResponse('custom', '{"result": 1}');
      provider.clearCustomResponses();
      
      const response = await provider.complete('custom query');
      expect(response.text).not.toBe('{"result": 1}');
    });

    it('should simulate delay', async () => {
      provider.setResponseDelay(100);
      
      const start = Date.now();
      await provider.complete('test');
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow some variance
    });

    it('should generate structured output', async () => {
      const schema = {
        type: 'object',
        properties: {
          intent: { type: 'string' },
          entity: { type: 'string' },
        },
      };
      
      const result = await provider.generateStructured<any>('List products', schema);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should track token usage', async () => {
      const response = await provider.complete('Short prompt');
      
      expect(response.usage).toBeDefined();
      expect(response.usage?.promptTokens).toBeGreaterThan(0);
      expect(response.usage?.completionTokens).toBeGreaterThan(0);
      expect(response.usage?.totalTokens).toBe(
        (response.usage?.promptTokens || 0) + (response.usage?.completionTokens || 0)
      );
    });
  });

  describe('getDefaultProvider', () => {
    it('should return a provider', () => {
      // Clear any API keys to ensure mock is returned
      const openaiKey = process.env.OPENAI_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      const ciscoClientId = process.env.CISCO_AI_CLIENT_ID;
      const ciscoClientSecret = process.env.CISCO_AI_CLIENT_SECRET;
      
      delete process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.CISCO_AI_CLIENT_ID;
      delete process.env.CISCO_AI_CLIENT_SECRET;
      
      const provider = getDefaultProvider();
      expect(provider).toBeDefined();
      expect(provider.isReady()).toBe(true);
      
      // Restore keys
      if (openaiKey) process.env.OPENAI_API_KEY = openaiKey;
      if (geminiKey) process.env.GEMINI_API_KEY = geminiKey;
      if (anthropicKey) process.env.ANTHROPIC_API_KEY = anthropicKey;
      if (ciscoClientId) process.env.CISCO_AI_CLIENT_ID = ciscoClientId;
      if (ciscoClientSecret) process.env.CISCO_AI_CLIENT_SECRET = ciscoClientSecret;
    });

    it('should fallback to mock when no API keys', () => {
      const openaiKey = process.env.OPENAI_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      const ciscoClientId = process.env.CISCO_AI_CLIENT_ID;
      const ciscoClientSecret = process.env.CISCO_AI_CLIENT_SECRET;
      
      delete process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.CISCO_AI_CLIENT_ID;
      delete process.env.CISCO_AI_CLIENT_SECRET;
      
      const provider = getDefaultProvider();
      expect(provider.name).toBe('mock');
      
      // Restore keys
      if (openaiKey) process.env.OPENAI_API_KEY = openaiKey;
      if (geminiKey) process.env.GEMINI_API_KEY = geminiKey;
      if (anthropicKey) process.env.ANTHROPIC_API_KEY = anthropicKey;
      if (ciscoClientId) process.env.CISCO_AI_CLIENT_ID = ciscoClientId;
      if (ciscoClientSecret) process.env.CISCO_AI_CLIENT_SECRET = ciscoClientSecret;
    });
  });

  describe('getAvailableProviders', () => {
    it('should always include mock', () => {
      const available = getAvailableProviders();
      expect(available).toContain('mock');
    });

    it('should return array of available providers', () => {
      const available = getAvailableProviders();
      expect(Array.isArray(available)).toBe(true);
      expect(available.length).toBeGreaterThan(0);
    });
  });

  describe('resolveModelAlias', () => {
    it('should resolve common aliases', () => {
      const config = loadLLMConfig();
      
      // Only test if aliases are defined in config
      if (Object.keys(config.modelAliases).length > 0) {
        const alias = Object.keys(config.modelAliases)[0];
        const resolved = resolveModelAlias(alias);
        expect(resolved).toBeDefined();
      }
    });

    it('should return null for unknown alias', () => {
      const resolved = resolveModelAlias('unknown-model-xyz');
      expect(resolved).toBeNull();
    });

    it('should be case-insensitive', () => {
      const config = loadLLMConfig();
      if (Object.keys(config.modelAliases).length > 0) {
        const alias = Object.keys(config.modelAliases)[0];
        const resolved1 = resolveModelAlias(alias.toLowerCase());
        const resolved2 = resolveModelAlias(alias.toUpperCase());
        expect(resolved1).toBe(resolved2);
      }
    });
  });

  describe('getProviderApiKey', () => {
    it('should return undefined for mock', () => {
      const key = getProviderApiKey('mock');
      expect(key).toBeUndefined();
    });

    it('should check OPENAI_API_KEY for openai', () => {
      const originalKey = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'test-key';
      
      const key = getProviderApiKey('openai');
      expect(key).toBe('test-key');
      
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    it('should check GEMINI_API_KEY for gemini', () => {
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'test-gemini-key';
      
      const key = getProviderApiKey('gemini');
      expect(key).toBe('test-gemini-key');
      
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
    });

    it('should check ANTHROPIC_API_KEY for anthropic', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
      
      const key = getProviderApiKey('anthropic');
      expect(key).toBe('test-anthropic-key');
      
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      } else {
        delete process.env.ANTHROPIC_API_KEY;
      }
    });

    it('should check CISCO_AI_CLIENT_ID for cisco', () => {
      const originalKey = process.env.CISCO_AI_CLIENT_ID;
      process.env.CISCO_AI_CLIENT_ID = 'test-cisco-client-id';
      
      const key = getProviderApiKey('cisco');
      expect(key).toBe('test-cisco-client-id');
      
      if (originalKey) {
        process.env.CISCO_AI_CLIENT_ID = originalKey;
      } else {
        delete process.env.CISCO_AI_CLIENT_ID;
      }
    });
  });

  describe('Cisco Provider', () => {
    it('should throw for Cisco without full configuration', () => {
      // Clear all Cisco env vars
      const origClientId = process.env.CISCO_AI_CLIENT_ID;
      const origClientSecret = process.env.CISCO_AI_CLIENT_SECRET;
      const origTokenUrl = process.env.CISCO_AI_TOKEN_URL;
      const origEndpoint = process.env.CISCO_AI_ENDPOINT;
      const origApiKey = process.env.CISCO_AI_API_KEY;
      
      delete process.env.CISCO_AI_CLIENT_ID;
      delete process.env.CISCO_AI_CLIENT_SECRET;
      delete process.env.CISCO_AI_TOKEN_URL;
      delete process.env.CISCO_AI_ENDPOINT;
      delete process.env.CISCO_AI_API_KEY;
      
      expect(() => {
        createLLMProvider({ type: 'cisco' });
      }).toThrow('CISCO_AI_CLIENT_ID');
      
      // Restore
      if (origClientId) process.env.CISCO_AI_CLIENT_ID = origClientId;
      if (origClientSecret) process.env.CISCO_AI_CLIENT_SECRET = origClientSecret;
      if (origTokenUrl) process.env.CISCO_AI_TOKEN_URL = origTokenUrl;
      if (origEndpoint) process.env.CISCO_AI_ENDPOINT = origEndpoint;
      if (origApiKey) process.env.CISCO_AI_API_KEY = origApiKey;
    });
  });
});

