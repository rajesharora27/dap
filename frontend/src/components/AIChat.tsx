/**
 * AI Chat Component
 * 
 * A chat interface for the DAP AI Assistant.
 * Allows users to ask natural language questions about products, customers, and tasks.
 * 
 * @version 1.0.0
 * @created 2025-12-05
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close,
  Send,
  SmartToy,
  Psychology,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  Lightbulb,
} from '@mui/icons-material';
import { gql } from '@apollo/client';
import { useAuth } from './AuthContext';

// GraphQL mutation for AI queries
const ASK_AI = gql`
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
`;

interface Message {
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
  };
}

interface AIChatProps {
  open: boolean;
  onClose: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Note: Using fetch directly for the GraphQL query instead of Apollo hooks
  // because the AI query can be long-running and we want more control over the request

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Add welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hello${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! I'm the DAP AI Assistant.

I can help you explore your data with natural language questions. Try asking things like:
• "Show me all products"
• "Find customers with low adoption"
• "List tasks without telemetry"

What would you like to know?`,
        timestamp: new Date(),
        metadata: {
          suggestions: [
            'Show me all products',
            'List customers with low adoption',
            'Find tasks without descriptions',
            'How many customers do we have?'
          ]
        }
      }]);
    }
  }, [open, user]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Use fetch directly for the GraphQL query
      const response = await fetch('/dap/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
            question: userMessage.content,
            conversationId: null,
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error');
      }

      const aiResponse = result.data.askAI;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponse.answer || 'I could not process your question.',
        timestamp: new Date(),
        metadata: {
          executionTime: aiResponse.metadata?.executionTime,
          templateUsed: aiResponse.metadata?.templateUsed,
          query: aiResponse.query,
          suggestions: aiResponse.suggestions,
          error: aiResponse.error,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Sorry, I encountered an error processing your question.',
        timestamp: new Date(),
        metadata: {
          error: error.message || 'Unknown error',
        },
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatMarkdown = (text: string) => {
    // Simple markdown formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: 700,
          borderRadius: 3,
          overflow: 'hidden',
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #0D274D 0%, #1a3a5c 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.15)',
            }}
          >
            <Psychology sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              DAP AI Assistant
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Ask questions about your data
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      {/* Messages */}
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8f9fa',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  maxWidth: '85%',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: message.role === 'user' ? '#0D274D' : 'white',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                }}
              >
                {/* Message Content */}
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                />

                {/* Metadata */}
                {message.metadata && message.role === 'assistant' && (
                  <Box sx={{ mt: 1.5 }}>
                    {/* Template Badge */}
                    {message.metadata.templateUsed && (
                      <Chip
                        size="small"
                        icon={<SmartToy sx={{ fontSize: 16 }} />}
                        label={`Template: ${message.metadata.templateUsed}`}
                        sx={{
                          mr: 1,
                          mb: 1,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.dark,
                        }}
                      />
                    )}

                    {/* Execution Time */}
                    {message.metadata.executionTime !== undefined && (
                      <Chip
                        size="small"
                        label={`${message.metadata.executionTime}ms`}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    )}

                    {/* Error */}
                    {message.metadata.error && (
                      <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                        {message.metadata.error}
                      </Alert>
                    )}

                    {/* Query Preview */}
                    {message.metadata.query && (
                      <Box sx={{ mt: 1 }}>
                        <Box
                          onClick={() => setExpandedQuery(
                            expandedQuery === message.id ? null : message.id
                          )}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main' },
                          }}
                        >
                          {expandedQuery === message.id ? <ExpandLess /> : <ExpandMore />}
                          <Typography variant="caption">View Query</Typography>
                        </Box>
                        <Collapse in={expandedQuery === message.id}>
                          <Box
                            sx={{
                              mt: 1,
                              p: 1.5,
                              bgcolor: '#1e1e1e',
                              borderRadius: 1,
                              position: 'relative',
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(message.metadata?.query || '')}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                color: 'grey.400',
                              }}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                            <Typography
                              variant="caption"
                              component="pre"
                              sx={{
                                color: '#d4d4d4',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                m: 0,
                              }}
                            >
                              {message.metadata.query}
                            </Typography>
                          </Box>
                        </Collapse>
                      </Box>
                    )}

                    {/* Suggestions */}
                    {message.metadata.suggestions && message.metadata.suggestions.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <Lightbulb sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="caption" color="text.secondary">
                            Try asking:
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {message.metadata.suggestions.map((suggestion, idx) => (
                            <Chip
                              key={idx}
                              size="small"
                              label={suggestion}
                              onClick={() => handleSuggestionClick(suggestion)}
                              sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </Box>
          ))}

          {/* Loading indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Thinking...
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Divider />
        <Box
          sx={{
            p: 2,
            bgcolor: 'white',
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
          }}
        >
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask a question about your data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!input.trim() || loading}
            sx={{
              bgcolor: '#0D274D',
              color: 'white',
              '&:hover': { bgcolor: '#1a3a5c' },
              '&:disabled': { bgcolor: 'grey.300' },
            }}
          >
            <Send />
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AIChat;

