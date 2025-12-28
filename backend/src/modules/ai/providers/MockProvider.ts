/**
 * Mock LLM Provider
 * 
 * A mock provider for testing that returns predictable responses.
 * Useful for unit tests and development without API costs.
 * 
 * @module services/ai/providers/MockProvider
 * @version 1.0.0
 * @created 2025-12-06
 */

import {
  BaseLLMProvider,
  LLMProviderConfig,
  LLMCompletionResponse,
  LLMCompletionOptions,
} from './LLMProvider';

/**
 * Mock response patterns for different query types
 */
const MOCK_RESPONSES: Record<string, string> = {
  // Product queries
  'products': JSON.stringify({
    model: 'Product',
    operation: 'findMany',
    args: { where: { deletedAt: null } }
  }),
  'product': JSON.stringify({
    model: 'Product',
    operation: 'findMany',
    args: { where: { deletedAt: null }, take: 5 }
  }),

  // Customer queries
  'customers': JSON.stringify({
    model: 'Customer',
    operation: 'findMany',
    args: { where: { deletedAt: null } }
  }),
  'customer': JSON.stringify({
    model: 'Customer',
    operation: 'findMany',
    args: { where: { deletedAt: null }, take: 5 }
  }),
  'adoption': JSON.stringify({
    model: 'AdoptionPlan',
    operation: 'findMany',
    args: { take: 10 }
  }),

  // Task queries
  'tasks': JSON.stringify({
    model: 'Task',
    operation: 'findMany',
    args: { where: { deletedAt: null } }
  }),
  'task': JSON.stringify({
    model: 'Task',
    operation: 'findMany',
    args: { where: { deletedAt: null }, take: 5 }
  }),

  // Solution queries
  'solutions': JSON.stringify({
    model: 'Solution',
    operation: 'findMany',
    args: { where: { deletedAt: null } }
  }),

  // Count queries
  'count': JSON.stringify({
    model: 'Product',
    operation: 'count',
    args: { where: { deletedAt: null } }
  }),
  'how many': JSON.stringify({
    model: 'Product',
    operation: 'count',
    args: { where: { deletedAt: null } }
  }),

  // Default fallback
  'default': JSON.stringify({
    model: 'Product',
    operation: 'findMany',
    args: { where: { deletedAt: null }, take: 3 }
  }),
};

/**
 * Mock LLM Provider for testing
 */
export class MockProvider extends BaseLLMProvider {
  readonly name = 'mock';
  private responseDelay: number;
  private customResponses: Map<string, string> = new Map();

  constructor(config?: Partial<LLMProviderConfig>) {
    super({
      model: 'mock-model',
      maxTokens: 1000,
      temperature: 0.7,
      timeout: 5000,
      ...config,
    });
    this.responseDelay = 50; // Simulate network delay
  }

  /**
   * Mock provider is always ready
   */
  isReady(): boolean {
    return true;
  }

  /**
   * Set response delay for testing
   */
  setResponseDelay(ms: number): void {
    this.responseDelay = ms;
  }

  /**
   * Set a custom response for a specific prompt pattern
   */
  setCustomResponse(pattern: string, response: string): void {
    this.customResponses.set(pattern.toLowerCase(), response);
  }

  /**
   * Clear all custom responses
   */
  clearCustomResponses(): void {
    this.customResponses.clear();
  }

  /**
   * Complete a prompt with a mock response
   */
  async complete(
    prompt: string,
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResponse> {
    const startTime = Date.now();

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.responseDelay));

    // Find matching response
    const lowerPrompt = prompt.toLowerCase();
    let responseText = MOCK_RESPONSES['default'];

    // Check custom responses first
    for (const [pattern, response] of this.customResponses) {
      if (lowerPrompt.includes(pattern)) {
        responseText = response;
        break;
      }
    }

    // Check built-in patterns if no custom match
    if (responseText === MOCK_RESPONSES['default']) {
      for (const [keyword, response] of Object.entries(MOCK_RESPONSES)) {
        if (keyword !== 'default' && lowerPrompt.includes(keyword)) {
          responseText = response;
          break;
        }
      }
    }

    const latency = Date.now() - startTime;
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(responseText.length / 4);

    return {
      text: responseText,
      model: this.config.model,
      latency,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  /**
   * Generate structured output (mock version)
   */
  async generateStructured<T>(
    prompt: string,
    schema: object,
    options?: LLMCompletionOptions
  ): Promise<T> {
    const response = await this.complete(prompt, options);

    try {
      return JSON.parse(response.text) as T;
    } catch {
      // If parsing fails, return a mock object matching common schema patterns
      const mockResult: any = {};
      if ('intent' in (schema as any)?.properties || prompt.includes('intent')) {
        mockResult.intent = 'unknown';
        mockResult.entity = 'unknown';
        mockResult.confidence = 0.5;
      }
      return mockResult as T;
    }
  }
}

/**
 * Create a mock provider instance
 */
export function createMockProvider(config?: Partial<LLMProviderConfig>): MockProvider {
  return new MockProvider(config);
}


