/**
 * useAIAssistant Hook
 * 
 * React hook for interacting with the DAP AI Assistant.
 * Provides a clean interface for asking questions and managing conversation state.
 * 
 * Features:
 * - Ask natural language questions about DAP data
 * - Conversation history management
 * - Response caching for repeated queries
 * - Loading and error state handling
 * - Automatic retry with exponential backoff
 * 
 * @version 1.0.0
 * @created 2025-12-06
 * 
 * @example
 * ```tsx
 * const { askQuestion, loading, error, messages, clearHistory } = useAIAssistant();
 * 
 * const handleAsk = async () => {
 *   const response = await askQuestion('Show me all products');
 *   console.log(response.answer);
 * };
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { AIQueryResponse, AIQueryMetadata } from '../graphql/ai';

/**
 * Message in the conversation
 */
export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: {
        executionTime?: number;
        templateUsed?: string;
        query?: string;
        suggestions?: string[];
        error?: string;
        rowCount?: number;
        truncated?: boolean;
        cached?: boolean;
    };
    data?: any;
}

/**
 * Options for the useAIAssistant hook
 */
export interface UseAIAssistantOptions {
    /** Initial messages to populate the conversation */
    initialMessages?: AIMessage[];
    /** Enable response caching (default: true) */
    enableCache?: boolean;
    /** Cache TTL in milliseconds (default: 5 minutes) */
    cacheTTL?: number;
    /** Maximum retry attempts (default: 2) */
    maxRetries?: number;
    /** Custom GraphQL endpoint (default: /dap/graphql) */
    endpoint?: string;
}

/**
 * Return type for the useAIAssistant hook
 */
export interface UseAIAssistantReturn {
    /** Send a question to the AI */
    askQuestion: (question: string) => Promise<AIQueryResponse | null>;
    /** Current loading state */
    loading: boolean;
    /** Last error that occurred */
    error: string | null;
    /** All messages in the conversation */
    messages: AIMessage[];
    /** Last response from the AI */
    lastResponse: AIQueryResponse | null;
    /** Clear conversation history */
    clearHistory: () => void;
    /** Clear the error state */
    clearError: () => void;
    /** Add a message to the conversation (for initial/welcome messages) */
    addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
    /** Check if a query result is cached */
    isCached: (question: string) => boolean;
}

/**
 * Cache entry for AI responses
 */
interface CacheEntry {
    response: AIQueryResponse;
    timestamp: number;
}

/**
 * Hook for interacting with the DAP AI Assistant
 */
export function useAIAssistant(options: UseAIAssistantOptions = {}): UseAIAssistantReturn {
    const {
        initialMessages = [],
        enableCache = true,
        cacheTTL = 5 * 60 * 1000, // 5 minutes
        maxRetries = 2,
        endpoint = '/dap/graphql',
    } = options;

    // State
    const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResponse, setLastResponse] = useState<AIQueryResponse | null>(null);

    // Cache ref (persists across renders but doesn't trigger re-renders)
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

    /**
     * Generate a unique message ID
     */
    const generateId = useCallback((prefix: string) => {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    /**
     * Normalize question for cache key
     */
    const normalizeQuestion = useCallback((question: string): string => {
        return question.toLowerCase().trim().replace(/\s+/g, ' ');
    }, []);

    /**
     * Check if a cached response is still valid
     */
    const isCacheValid = useCallback((entry: CacheEntry): boolean => {
        return Date.now() - entry.timestamp < cacheTTL;
    }, [cacheTTL]);

    /**
     * Check if a question result is cached
     */
    const isCached = useCallback((question: string): boolean => {
        if (!enableCache) return false;
        const key = normalizeQuestion(question);
        const entry = cacheRef.current.get(key);
        return entry !== undefined && isCacheValid(entry);
    }, [enableCache, normalizeQuestion, isCacheValid]);

    /**
     * Get cached response if available
     */
    const getCachedResponse = useCallback((question: string): AIQueryResponse | null => {
        if (!enableCache) return null;
        const key = normalizeQuestion(question);
        const entry = cacheRef.current.get(key);
        if (entry && isCacheValid(entry)) {
            return { ...entry.response, metadata: { ...entry.response.metadata, cached: true } };
        }
        return null;
    }, [enableCache, normalizeQuestion, isCacheValid]);

    /**
     * Cache a response
     */
    const cacheResponse = useCallback((question: string, response: AIQueryResponse): void => {
        if (!enableCache) return;
        const key = normalizeQuestion(question);
        cacheRef.current.set(key, {
            response,
            timestamp: Date.now(),
        });
    }, [enableCache, normalizeQuestion]);

    /**
     * Execute the GraphQL query
     */
    const executeQuery = useCallback(async (
        question: string,
        retryCount = 0
    ): Promise<AIQueryResponse> => {
        const token = localStorage.getItem('token');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify({
                query: `
          query AskAI($question: String!, $conversationId: String) {
            askAI(question: $question, conversationId: $conversationId) {
              answer
              data
              query
              suggestions
              error
              metadata {
                executionTime
                rowCount
                truncated
                cached
                templateUsed
              }
            }
          }
        `,
                variables: {
                    question,
                    conversationId: null,
                },
            }),
        });

        if (!response.ok) {
            // Retry on network errors
            if (retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
                return executeQuery(question, retryCount + 1);
            }
            throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0]?.message || 'GraphQL error');
        }

        return result.data.askAI;
    }, [endpoint, maxRetries]);

    /**
     * Add a message to the conversation
     */
    const addMessage = useCallback((message: Omit<AIMessage, 'id' | 'timestamp'>) => {
        const fullMessage: AIMessage = {
            ...message,
            id: generateId(message.role),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, fullMessage]);
    }, [generateId]);

    /**
     * Ask a question to the AI
     */
    const askQuestion = useCallback(async (question: string): Promise<AIQueryResponse | null> => {
        if (!question.trim()) {
            return null;
        }

        // Add user message
        const userMessage: AIMessage = {
            id: generateId('user'),
            role: 'user',
            content: question.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        // Check cache first
        const cachedResponse = getCachedResponse(question);
        if (cachedResponse) {
            const assistantMessage: AIMessage = {
                id: generateId('assistant'),
                role: 'assistant',
                content: cachedResponse.answer,
                timestamp: new Date(),
                metadata: {
                    executionTime: cachedResponse.metadata?.executionTime,
                    templateUsed: cachedResponse.metadata?.templateUsed,
                    query: cachedResponse.query,
                    suggestions: cachedResponse.suggestions,
                    error: cachedResponse.error,
                    rowCount: cachedResponse.metadata?.rowCount,
                    truncated: cachedResponse.metadata?.truncated,
                    cached: true,
                },
                data: cachedResponse.data,
            };
            setMessages(prev => [...prev, assistantMessage]);
            setLastResponse(cachedResponse);
            return cachedResponse;
        }

        // Execute query
        setLoading(true);
        setError(null);

        try {
            const response = await executeQuery(question);

            // Cache the response
            cacheResponse(question, response);

            // Add assistant message
            const assistantMessage: AIMessage = {
                id: generateId('assistant'),
                role: 'assistant',
                content: response.answer || 'I could not process your question.',
                timestamp: new Date(),
                metadata: {
                    executionTime: response.metadata?.executionTime,
                    templateUsed: response.metadata?.templateUsed,
                    query: response.query,
                    suggestions: response.suggestions,
                    error: response.error,
                    rowCount: response.metadata?.rowCount,
                    truncated: response.metadata?.truncated,
                    cached: false,
                },
                data: response.data,
            };
            setMessages(prev => [...prev, assistantMessage]);
            setLastResponse(response);

            return response;

        } catch (err: any) {
            const errorMessage = err.message || 'Unknown error occurred';
            setError(errorMessage);

            // Add error message to conversation
            const errorAssistantMessage: AIMessage = {
                id: generateId('assistant'),
                role: 'assistant',
                content: '❌ Sorry, I encountered an error processing your question.',
                timestamp: new Date(),
                metadata: {
                    error: errorMessage,
                },
            };
            setMessages(prev => [...prev, errorAssistantMessage]);

            return null;

        } finally {
            setLoading(false);
        }
    }, [generateId, getCachedResponse, executeQuery, cacheResponse]);

    /**
     * Clear conversation history
     */
    const clearHistory = useCallback(() => {
        setMessages([]);
        setLastResponse(null);
        setError(null);
    }, []);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        askQuestion,
        loading,
        error,
        messages,
        lastResponse,
        clearHistory,
        clearError,
        addMessage,
        isCached,
    };
}

export default useAIAssistant;
