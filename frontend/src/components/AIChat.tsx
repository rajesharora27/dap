/**
 * AI Chat Component
 * 
 * A chat interface for the DAP AI Assistant.
 * Allows users to ask natural language questions about products, customers, and tasks.
 * 
 * @version 1.1.0
 * @created 2025-12-05
 * @updated 2025-12-06 - Refactored to use useAIAssistant hook
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
  Tooltip,
  Badge,
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
  Cached,
  DeleteOutline,
  Refresh,
  Storage,
} from '@mui/icons-material';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useAuth } from './AuthContext';
import { useAIAssistant, AIMessage } from '../hooks/useAIAssistant';
import QueryResultDisplay from './ai/QueryResultDisplay';

// GraphQL query for data context status
const AI_DATA_CONTEXT_STATUS = gql`
  query AIDataContextStatus {
    aiDataContextStatus {
      initialized
      lastRefreshed
      hasDataContext
    }
  }
`;

// GraphQL mutation for refreshing data context
const REFRESH_AI_DATA_CONTEXT = gql`
  mutation RefreshAIDataContext {
    refreshAIDataContext {
      success
      lastRefreshed
      statistics {
        totalProducts
        totalSolutions
        totalCustomers
        totalTasks
        totalTasksWithTelemetry
        totalTasksWithoutTelemetry
        totalAdoptionPlans
      }
      error
    }
  }
`;


interface AIChatProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (type: string, id: string) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ open, onClose, onNavigate }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Common/Recent Queries State
  const [commonQueries, setCommonQueries] = useState<{ query: string; count: number }[]>([]);

  // Data context status and refresh
  const { data: contextStatusData, refetch: refetchContextStatus } = useQuery(AI_DATA_CONTEXT_STATUS, {
    skip: !open,
    fetchPolicy: 'network-only',
  });

  const [refreshDataContext, { loading: refreshingContext }] = useMutation(REFRESH_AI_DATA_CONTEXT, {
    onCompleted: (data) => {
      if (data.refreshAIDataContext.success) {
        refetchContextStatus();
        // Add a system message about the refresh
        addMessage({
          role: 'assistant',
          content: `✅ **Data context refreshed successfully!**\n\nThe AI now has updated knowledge about:\n- ${data.refreshAIDataContext.statistics.totalProducts} products\n- ${data.refreshAIDataContext.statistics.totalSolutions} solutions\n- ${data.refreshAIDataContext.statistics.totalCustomers} customers\n- ${data.refreshAIDataContext.statistics.totalTasks} tasks (${data.refreshAIDataContext.statistics.totalTasksWithTelemetry} with telemetry, ${data.refreshAIDataContext.statistics.totalTasksWithoutTelemetry} without)`,
        });
      } else {
        addMessage({
          role: 'assistant',
          content: `❌ **Failed to refresh data context**\n\nError: ${data.refreshAIDataContext.error || 'Unknown error'}`,
        });
      }
    },
    onError: (error) => {
      addMessage({
        role: 'assistant',
        content: `❌ **Failed to refresh data context**\n\nError: ${error.message}`,
      });
    }
  });

  const handleRefreshContext = () => {
    if (!refreshingContext && user?.isAdmin) {
      refreshDataContext();
    }
  };

  // Format last refreshed time
  const formatLastRefreshed = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Native click handler for navigation links (dangerouslySetInnerHTML content)
  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const handleNativeClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;

        // Handle span elements with data-navigate attribute (using closest for robustness)
        const navigateSpan = target.closest('[data-navigate]');
        if (navigateSpan) {
          e.preventDefault();
          e.stopPropagation();
          const navData = navigateSpan.getAttribute('data-navigate');
          if (navData && onNavigate) {
            const parts = navData.split(':');
            if (parts.length === 2) {
              onNavigate(parts[0], parts[1]);
              // Close chat for non-task navigation to allow view transition
              if (parts[0] !== 'tasks') {
                onClose();
              }
            }
          }
          return;
        }

        // Legacy: Handle anchor elements with #navigate: href
        const navigateAnchor = target.closest('a');
        if (navigateAnchor) {
          const href = navigateAnchor.getAttribute('href');
          if (href && href.startsWith('#navigate:')) {
            e.preventDefault();
            e.stopPropagation();
            const parts = href.split(':');
            if (parts.length === 3 && onNavigate) {
              onNavigate(parts[1], parts[2]);
              if (parts[1] !== 'tasks') {
                onClose();
              }
            }
          }
        }
      };

      container.addEventListener('click', handleNativeClick, true);
      (container as any).__aiChatClickHandler = handleNativeClick;
    }, 50); // Reduced timeout

    return () => {
      clearTimeout(timeoutId);
      const container = messagesContainerRef.current;
      if (container && (container as any).__aiChatClickHandler) {
        container.removeEventListener('click', (container as any).__aiChatClickHandler, true);
        delete (container as any).__aiChatClickHandler;
      }
    };
  }, [open, onNavigate, onClose]);

  useEffect(() => {
    // Load common queries on mount
    try {
      const saved = localStorage.getItem('dap_common_queries');
      if (saved) {
        setCommonQueries(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load common queries', e);
    }
  }, []);

  const updateCommonQueries = (queryText: string) => {
    try {
      const normalized = queryText.trim();
      if (!normalized) return;

      let current = [...commonQueries];
      const existingIndex = current.findIndex(q => q.query.toLowerCase() === normalized.toLowerCase());

      if (existingIndex >= 0) {
        current[existingIndex].count += 1;
      } else {
        current.push({ query: normalized, count: 1 });
      }

      // Sort by count desc and limit
      current.sort((a, b) => b.count - a.count);
      current = current.slice(0, 10); // Keep top 10

      setCommonQueries(current);
      localStorage.setItem('dap_common_queries', JSON.stringify(current));
    } catch (e) {
      console.error('Failed to update common queries', e);
    }
  };

  // Use the AI Assistant hook for state management and API calls
  const {
    askQuestion,
    loading,
    messages,
    addMessage,
    clearHistory,
  } = useAIAssistant();

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
      addMessage({
        role: 'assistant',
        content: `👋 Hello${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! I'm the DAP AI Assistant.

I can help you explore your data with natural language questions. Try asking things like:
• "Show me all products"
• "Find customers with low adoption"
• "List tasks without telemetry"

What would you like to know?`,
        metadata: {
          suggestions: [
            'Show me all products',
            'List customers with low adoption',
            'Find tasks without descriptions',
          ],
        }
      });
    }
  }, [open, user, messages.length, addMessage]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userQuestion = input;
    setInput('');
    updateCommonQueries(userQuestion);
    await askQuestion(userQuestion);
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
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
        const isInternal = href.startsWith('#navigate:');
        const targetAttr = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
        return `<a href="${href}"${targetAttr} style="color: #1976d2; text-decoration: none; font-weight: 500;">${text}</a>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  const handleMessageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    console.log('Click detected on:', target.tagName, target);

    if (target.tagName === 'A') {
      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      console.log('Link clicked - href:', href, 'target:', targetAttr);

      // If it's an external link (target="_blank"), allow default browser behavior
      if (targetAttr === '_blank') {
        console.log('External link - allowing default behavior');
        return;
      }

      // Handle internal navigation links
      if (href && href.startsWith('#navigate:')) {
        console.log('Navigation link detected');
        e.preventDefault();
        e.stopPropagation();
        const parts = href.split(':');
        console.log('Parts:', parts, 'onNavigate exists:', !!onNavigate);
        if (parts.length === 3 && onNavigate) {
          console.log('Navigating via AI link:', parts[1], parts[2]);
          onNavigate(parts[1], parts[2]);
          // Close chat ONLY if not a task preview (which opens a dialog on top)
          if (parts[1] !== 'tasks') {
            onClose();
          }
        }
      } else {
        console.log('Link href does not start with #navigate:', href);
      }
    }
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

        {/* Context status and refresh button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {contextStatusData?.aiDataContextStatus?.hasDataContext && (
            <Tooltip title={`Data context last refreshed: ${formatLastRefreshed(contextStatusData.aiDataContextStatus.lastRefreshed)}`}>
              <Chip
                size="small"
                icon={<Storage sx={{ fontSize: 14 }} />}
                label={formatLastRefreshed(contextStatusData.aiDataContextStatus.lastRefreshed)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 24,
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            </Tooltip>
          )}

          {user?.isAdmin && (
            <Tooltip title="Refresh AI data context (updates entity names, statistics, etc.)">
              <IconButton
                onClick={handleRefreshContext}
                disabled={refreshingContext}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
                size="small"
              >
                {refreshingContext ? (
                  <CircularProgress size={18} sx={{ color: 'white' }} />
                ) : (
                  <Refresh sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
          )}

          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
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
          ref={messagesContainerRef}
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
                <Box>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{ lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                  />
                </Box>

                {/* Data Display */}
                {message.data && message.role === 'assistant' && (
                  <Box sx={{ mt: 2, mb: 1, width: '100%' }}>
                    <QueryResultDisplay
                      data={message.data}
                      maxHeight={300}
                      compact
                      onRowClick={(row) => {
                        if (row.id && onNavigate) {
                          // Check injected type first (most reliable)
                          if (row._type) {
                            onNavigate(row._type, row.id);
                            return;
                          }

                          // Fallback: Detect type based on row properties
                          // Tasks: have weight, estMinutes, or product reference
                          if (row.weight !== undefined || row.estMinutes !== undefined || row.product) {
                            onNavigate('tasks', row.id);
                          }
                          // Adoption Plans: have progressPercentage, totalTasks, completedWeight
                          else if (row.progressPercentage !== undefined || row.totalTasks !== undefined || row.completedWeight !== undefined) {
                            onNavigate('adoptionPlans', row.id);
                          }
                          // Products: have statusPercent or licenses
                          else if (row.statusPercent !== undefined || row.licenses !== undefined) {
                            onNavigate('products', row.id);
                          }
                          // Solutions: have products (as edges) but not statusPercent (distinguishes from products)
                          else if (row.products !== undefined && row.statusPercent === undefined) {
                            onNavigate('solutions', row.id);
                          }
                          // Customers: have adoptionPlan or customerProducts/customerSolutions
                          else if (row.adoptionPlan !== undefined || row.customerProducts !== undefined || row.customerSolutions !== undefined) {
                            onNavigate('customers', row.id);
                          }
                          else if (row.name) {
                            // If we have just name/description, try to infer from data context or default logging
                            console.warn('Could not detect row type for navigation:', row);
                            // Default to tasks if ambiguous but has ID
                            onNavigate('tasks', row.id);
                          } else {
                            // Absolute fallback
                            onNavigate('tasks', row.id);
                          }
                        }
                      }}
                    />
                  </Box>
                )}

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

          {/* Common Queries Section (only show when just welcome message is present) */}
          {messages.length <= 1 && commonQueries.length > 0 && (
            <Box sx={{ mt: 2, px: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Cached sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Commonly asked:
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {commonQueries.map((q, idx) => (
                  <Chip
                    key={`common-${idx}`}
                    label={q.query}
                    onClick={() => handleSuggestionClick(q.query)}
                    size="small"
                    variant="outlined"
                    clickable
                    sx={{ borderColor: alpha(theme.palette.primary.main, 0.3) }}
                  />
                ))}
              </Box>
            </Box>
          )}

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

