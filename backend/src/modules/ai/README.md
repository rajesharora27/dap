# AI Module

## Responsibility

Provides natural language query capabilities for the DAP system. Users can ask questions about their data in plain English, and the AI agent interprets the query, executes appropriate database lookups, and returns formatted results. Uses a hybrid approach: fast regex-based templates for common queries, with LLM fallback for complex questions.

## Public API

Exports from `index.ts`:

```typescript
// Main Service
export { AIAgentService } from './AIAgentService';

// Supporting Services
export { QueryTemplates } from './QueryTemplates';
export { QueryExecutor } from './QueryExecutor';
export { SchemaContextManager } from './SchemaContextManager';
export { DataContextManager } from './DataContextManager';
export { ResponseFormatter } from './ResponseFormatter';
export { RBACFilter } from './RBACFilter';
export { CacheManager } from './CacheManager';
export { AuditLogger } from './AuditLogger';
export { ErrorHandler } from './ErrorHandler';

// Providers
export { GeminiProvider } from './providers/GeminiProvider';
export { OpenAIProvider } from './providers/OpenAIProvider';
export { AnthropicProvider } from './providers/AnthropicProvider';

// Types
export type { AIQuery, AIResponse, QueryTemplate } from './types';
```

## Dependencies

| Module | Purpose |
|--------|---------|
| `shared/auth` | Permission checking (RBAC) |
| `shared/database` | Prisma client for queries |

**External Dependencies:**
- `@google/generative-ai` - Gemini API
- `openai` - OpenAI API
- `@anthropic-ai/sdk` - Anthropic API

## Architecture

```
User Query → QueryTemplates (regex match) → Direct Prisma Query (fast)
         ↘ No Match → LLM + SchemaContext + DataContext → Generated Query
```

### Components

| Component | Responsibility |
|-----------|----------------|
| `AIAgentService` | Main orchestration, provider selection |
| `QueryTemplates` | 20+ regex patterns for common queries |
| `QueryExecutor` | Safe query execution with limits |
| `SchemaContextManager` | Database schema for LLM context |
| `DataContextManager` | Sample data for LLM context |
| `ResponseFormatter` | Format results for display |
| `RBACFilter` | Apply user permissions to results |
| `CacheManager` | Cache frequent queries |
| `AuditLogger` | Log all AI interactions |
| `ErrorHandler` | Graceful error handling |

## GraphQL Operations

### Queries
| Query | Description | Auth |
|-------|-------------|------|
| `aiAgentAvailable` | Check if AI agent is enabled | Required |
| `askAI(question)` | Submit natural language query | Required |

### Mutations
| Mutation | Description | Auth |
|----------|-------------|------|
| `refreshAIContext` | Refresh schema/data context | ADMIN |

## Query Templates

Pre-built patterns for fast responses:

| Pattern | Example Query |
|---------|--------------|
| Products without telemetry | "Show products without telemetry" |
| Tasks for product | "List tasks for Cisco Secure Access" |
| Customers with low adoption | "Customers with less than 50% adoption" |
| Product task count | "How many tasks does product X have" |
| Unassigned tasks | "Tasks not assigned to any outcome" |
| High weight tasks | "Tasks with weight over 10" |

## Business Rules

1. **aiuser Required**: A dedicated `aiuser` account must exist
2. **Read-Only**: All queries are SELECT only, no mutations
3. **Row Limits**: Results capped at 100 rows
4. **Timeouts**: Queries timeout after 30 seconds
5. **RBAC Applied**: Results filtered by user permissions
6. **Audit Logged**: All queries logged for compliance

## Error Codes

| Code | Description |
|------|-------------|
| `AI_NOT_AVAILABLE` | aiuser account not configured |
| `AI_PROVIDER_ERROR` | LLM provider returned error |
| `AI_QUERY_TIMEOUT` | Query exceeded time limit |
| `AI_QUERY_UNSAFE` | Query attempted mutation |

## Configuration

Environment variables:

```bash
# Provider selection (gemini, openai, anthropic)
AI_PROVIDER=gemini

# API Keys (only needed for selected provider)
GEMINI_API_KEY=xxx
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx

# Query limits
AI_MAX_ROWS=100
AI_TIMEOUT_MS=30000
```

## Testing

```bash
# Run AI module tests
npm test -- backend/src/modules/ai/__tests__/
```

## Related Documentation

- [CONTEXT.md](../../../../docs/CONTEXT.md) - AI Agent section
- [providers/README.md](./providers/README.md) - Provider implementations

