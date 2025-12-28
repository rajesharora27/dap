/**
 * LLM Provider Interface
 * 
 * Abstract interface for Language Model providers.
 * Allows swapping between OpenAI, Anthropic, or mock providers.
 * 
 * @module services/ai/providers/LLMProvider
 * @version 1.0.0
 * @created 2025-12-06
 */

/**
 * Configuration for LLM provider
 */
export interface LLMProviderConfig {
  /** API key for the provider */
  apiKey?: string;
  /** Model to use (e.g., 'gpt-4o', 'claude-3-sonnet') */
  model: string;
  /** Maximum tokens in response */
  maxTokens: number;
  /** Temperature for response generation (0-1) */
  temperature: number;
  /** Request timeout in milliseconds */
  timeout: number;
}

/**
 * Response from LLM completion
 */
export interface LLMCompletionResponse {
  /** The generated text */
  text: string;
  /** Token usage stats */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Model used */
  model: string;
  /** Time to generate in milliseconds */
  latency: number;
}

/**
 * Options for a completion request
 */
export interface LLMCompletionOptions {
  /** System prompt to set context */
  systemPrompt?: string;
  /** Temperature override (0-1) */
  temperature?: number;
  /** Max tokens override */
  maxTokens?: number;
  /** Stop sequences */
  stopSequences?: string[];
}

/**
 * Abstract interface for LLM providers
 */
export interface ILLMProvider {
  /** Provider name for logging/identification */
  readonly name: string;
  
  /**
   * Check if the provider is configured and ready to use
   * @returns true if ready, false otherwise
   */
  isReady(): boolean;
  
  /**
   * Complete a prompt using the LLM
   * @param prompt - The user prompt to complete
   * @param options - Optional completion options
   * @returns The completion response
   */
  complete(prompt: string, options?: LLMCompletionOptions): Promise<LLMCompletionResponse>;
  
  /**
   * Generate structured JSON output from a prompt
   * @param prompt - The user prompt
   * @param schema - JSON schema for the expected output
   * @param options - Optional completion options
   * @returns Parsed JSON object matching the schema
   */
  generateStructured<T>(
    prompt: string,
    schema: object,
    options?: LLMCompletionOptions
  ): Promise<T>;
}

/**
 * Base class with common functionality for LLM providers
 */
export abstract class BaseLLMProvider implements ILLMProvider {
  abstract readonly name: string;
  protected config: LLMProviderConfig;
  
  constructor(config: LLMProviderConfig) {
    this.config = config;
  }
  
  abstract isReady(): boolean;
  abstract complete(prompt: string, options?: LLMCompletionOptions): Promise<LLMCompletionResponse>;
  
  /**
   * Default implementation of generateStructured using JSON parsing
   * Can be overridden by providers that support native JSON mode
   */
  async generateStructured<T>(
    prompt: string,
    schema: object,
    options?: LLMCompletionOptions
  ): Promise<T> {
    const structuredPrompt = `${prompt}

Respond with valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

IMPORTANT: Respond with ONLY the JSON object, no markdown, no explanation.`;

    const response = await this.complete(structuredPrompt, {
      ...options,
      temperature: options?.temperature ?? 0.1, // Lower temperature for structured output
    });
    
    try {
      // Try to extract JSON from the response
      const text = response.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      return JSON.parse(text) as T;
    } catch (error) {
      throw new Error(`Failed to parse LLM response as JSON: ${response.text.substring(0, 200)}`);
    }
  }
}


