/**
 * Anthropic Claude LLM Provider
 * 
 * Implementation of LLM provider using Anthropic's Claude models.
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, and other Claude models.
 * 
 * @module services/ai/providers/AnthropicProvider
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
 * Anthropic-specific configuration
 */
export interface AnthropicProviderConfig extends LLMProviderConfig {
  /** Anthropic API key (required) */
  apiKey: string;
  /** Base URL for API */
  baseUrl?: string;
  /** API version header */
  apiVersion?: string;
}

/**
 * Anthropic API response structure
 */
interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Anthropic Claude LLM Provider
 */
export class AnthropicProvider extends BaseLLMProvider {
  readonly name = 'anthropic';
  private apiKey: string;
  private baseUrl: string;
  private apiVersion: string;
  
  constructor(config: AnthropicProviderConfig) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.apiVersion = config.apiVersion || '2023-06-01';
  }
  
  /**
   * Check if the provider is configured with an API key
   */
  isReady(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }
  
  /**
   * Complete a prompt using Anthropic's messages API
   */
  async complete(
    prompt: string,
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResponse> {
    if (!this.isReady()) {
      throw new Error('Anthropic provider is not configured. Missing API key.');
    }
    
    const startTime = Date.now();
    
    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: 'user', content: prompt },
    ];
    
    // Build request body
    const requestBody: any = {
      model: this.config.model,
      messages,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
    };
    
    // Anthropic uses system parameter (not in messages)
    if (options?.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }
    
    if (options?.stopSequences) {
      requestBody.stop_sequences = options.stopSequences;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': this.apiVersion,
    };
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      
      const data: AnthropicResponse = await response.json();
      const latency = Date.now() - startTime;
      
      const textContent = data.content.find(c => c.type === 'text');
      if (!textContent?.text) {
        throw new Error('Anthropic returned empty response');
      }
      
      return {
        text: textContent.text,
        model: data.model,
        latency,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Anthropic request timed out after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }
  
  /**
   * Generate structured JSON output
   */
  async generateStructured<T>(
    prompt: string,
    schema: object,
    options?: LLMCompletionOptions
  ): Promise<T> {
    const structuredPrompt = `${prompt}

Respond with valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

IMPORTANT: Respond with ONLY the JSON object, no markdown code blocks, no explanation.`;

    const systemPrompt = `${options?.systemPrompt || 'You are a helpful assistant.'} You always respond with valid JSON only, no explanations or markdown.`;

    const response = await this.complete(structuredPrompt, {
      ...options,
      systemPrompt,
      temperature: options?.temperature ?? 0.1,
    });
    
    try {
      const text = response.text.trim();
      // Remove markdown code blocks if present
      const cleanText = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      return JSON.parse(cleanText) as T;
    } catch (error) {
      throw new Error(`Failed to parse Anthropic response as JSON: ${response.text.substring(0, 200)}`);
    }
  }
}

/**
 * Create an Anthropic provider instance
 */
export function createAnthropicProvider(config: AnthropicProviderConfig): AnthropicProvider {
  return new AnthropicProvider(config);
}


