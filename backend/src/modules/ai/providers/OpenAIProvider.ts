/**
 * OpenAI LLM Provider
 * 
 * Implementation of LLM provider using OpenAI's GPT models.
 * Supports GPT-4o and other OpenAI models.
 * 
 * @module services/ai/providers/OpenAIProvider
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
 * OpenAI-specific configuration
 */
export interface OpenAIProviderConfig extends LLMProviderConfig {
  /** OpenAI API key (required) */
  apiKey: string;
  /** OpenAI organization ID (optional) */
  organizationId?: string;
  /** Base URL for API (for proxies or Azure) */
  baseUrl?: string;
}

/**
 * OpenAI API response structure
 */
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI LLM Provider
 */
export class OpenAIProvider extends BaseLLMProvider {
  readonly name = 'openai';
  private apiKey: string;
  private organizationId?: string;
  private baseUrl: string;
  
  constructor(config: OpenAIProviderConfig) {
    super(config);
    this.apiKey = config.apiKey;
    this.organizationId = config.organizationId;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }
  
  /**
   * Check if the provider is configured with an API key
   */
  isReady(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }
  
  /**
   * Complete a prompt using OpenAI's chat completion API
   */
  async complete(
    prompt: string,
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResponse> {
    if (!this.isReady()) {
      throw new Error('OpenAI provider is not configured. Missing API key.');
    }
    
    const startTime = Date.now();
    
    // Build messages array
    const messages: Array<{ role: string; content: string }> = [];
    
    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt,
    });
    
    // Build request body
    const requestBody = {
      model: this.config.model,
      messages,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? this.config.temperature,
      ...(options?.stopSequences && { stop: options.stopSequences }),
    };
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
    
    if (this.organizationId) {
      headers['OpenAI-Organization'] = this.organizationId;
    }
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      
      const data: OpenAIResponse = await response.json();
      const latency = Date.now() - startTime;
      
      const choice = data.choices[0];
      if (!choice || !choice.message?.content) {
        throw new Error('OpenAI returned empty response');
      }
      
      return {
        text: choice.message.content,
        model: data.model,
        latency,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`OpenAI request timed out after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }
  
  /**
   * Generate structured JSON output using OpenAI's JSON mode
   */
  async generateStructured<T>(
    prompt: string,
    schema: object,
    options?: LLMCompletionOptions
  ): Promise<T> {
    if (!this.isReady()) {
      throw new Error('OpenAI provider is not configured. Missing API key.');
    }
    
    const startTime = Date.now();
    
    // Build system prompt for JSON mode
    const systemPrompt = `${options?.systemPrompt || 'You are a helpful assistant.'}

You must respond with valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

IMPORTANT: Respond with ONLY the JSON object. No markdown code blocks, no explanations.`;

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];
    
    const requestBody = {
      model: this.config.model,
      messages,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      temperature: options?.temperature ?? 0.1, // Lower temperature for structured output
      response_format: { type: 'json_object' },
    };
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
    
    if (this.organizationId) {
      headers['OpenAI-Organization'] = this.organizationId;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      
      const data: OpenAIResponse = await response.json();
      const choice = data.choices[0];
      
      if (!choice || !choice.message?.content) {
        throw new Error('OpenAI returned empty response');
      }
      
      return JSON.parse(choice.message.content) as T;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`OpenAI request timed out after ${this.config.timeout}ms`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse OpenAI JSON response: ${error.message}`);
      }
      throw error;
    }
  }
}

/**
 * Create an OpenAI provider instance
 */
export function createOpenAIProvider(config: OpenAIProviderConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}


