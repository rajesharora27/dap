/**
 * Google Gemini LLM Provider
 * 
 * Implementation of LLM provider using Google's Gemini models.
 * Supports Gemini 1.5 Pro, Gemini 1.5 Flash, and other Gemini models.
 * 
 * @module services/ai/providers/GeminiProvider
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
 * Gemini-specific configuration
 */
export interface GeminiProviderConfig extends LLMProviderConfig {
  /** Google AI API key (required) */
  apiKey: string;
  /** Base URL for API */
  baseUrl?: string;
}

/**
 * Gemini API response structure
 */
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Google Gemini LLM Provider
 */
export class GeminiProvider extends BaseLLMProvider {
  readonly name = 'gemini';
  private apiKey: string;
  private baseUrl: string;
  
  constructor(config: GeminiProviderConfig) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }
  
  /**
   * Check if the provider is configured with an API key
   */
  isReady(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }
  
  /**
   * Complete a prompt using Gemini's generateContent API
   */
  async complete(
    prompt: string,
    options?: LLMCompletionOptions
  ): Promise<LLMCompletionResponse> {
    if (!this.isReady()) {
      throw new Error('Gemini provider is not configured. Missing API key.');
    }
    
    const startTime = Date.now();
    
    // Build contents array
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    
    // Gemini uses systemInstruction for system prompts
    let systemInstruction: { parts: Array<{ text: string }> } | undefined;
    if (options?.systemPrompt) {
      systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }
    
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });
    
    // Build request body
    const requestBody: any = {
      contents,
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? this.config.maxTokens,
        temperature: options?.temperature ?? this.config.temperature,
        ...(options?.stopSequences && { stopSequences: options.stopSequences }),
      },
    };
    
    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }
    
    const url = `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.apiKey}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      
      const data: GeminiResponse = await response.json();
      const latency = Date.now() - startTime;
      
      const candidate = data.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        throw new Error('Gemini returned empty response');
      }
      
      const text = candidate.content.parts.map(p => p.text).join('');
      
      return {
        text,
        model: this.config.model,
        latency,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        } : undefined,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Gemini request timed out after ${this.config.timeout}ms`);
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
    // Gemini supports JSON mode via response_mime_type
    const structuredPrompt = `${prompt}

Respond with valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

IMPORTANT: Respond with ONLY the JSON object, no markdown, no explanation.`;

    const response = await this.complete(structuredPrompt, {
      ...options,
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
      throw new Error(`Failed to parse Gemini response as JSON: ${response.text.substring(0, 200)}`);
    }
  }
}

/**
 * Create a Gemini provider instance
 */
export function createGeminiProvider(config: GeminiProviderConfig): GeminiProvider {
  return new GeminiProvider(config);
}


