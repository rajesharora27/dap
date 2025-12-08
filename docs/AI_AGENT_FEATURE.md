# AI Agent for DAP - Feature Documentation

**Version:** 1.0.0  
**Created:** December 3, 2025  
**Status:** In Implementation - Phase 2 Complete  
**Author:** Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Requirements](#2-requirements)
3. [Architecture Design](#3-architecture-design)
4. [Implementation Plan](#4-implementation-plan)
5. [Technical Specifications](#5-technical-specifications)
6. [Example Interactions](#6-example-interactions)
7. [Cost Estimates](#7-cost-estimates)
8. [Risks & Mitigations](#8-risks--mitigations)
9. [Success Metrics](#9-success-metrics)
10. [Appendix](#10-appendix)

---

## 1. Executive Summary

### Overview

Add an intelligent AI assistant to DAP that understands the database schema and application functionality, enabling users to ask natural language questions about products, solutions, customers, and adoption progress.

### Business Value

- **Faster Insights**: Users get answers in seconds instead of manual data exploration
- **Self-Service Analytics**: Reduce dependency on technical staff for reports
- **Data Quality**: Easily find incomplete or missing data
- **Better Decision Making**: Quick access to adoption metrics and trends

### Target Users

| User Role | Use Cases |
|-----------|-----------|
| **Admin** | Full data access, system health, analytics |
| **SME** | Product/solution data quality, task completeness |
| **CSS** | Customer adoption progress, stuck customers |

---

## 2. Requirements

### 2.1 Functional Requirements

#### Core Capabilities

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| FR-1 | Natural language query interface | High | Users can ask questions in plain English |
| FR-2 | Entity understanding | High | AI understands Products, Solutions, Tasks, Customers, Adoption Plans, Telemetry |
| FR-3 | Query generation | High | Generate accurate database queries from natural language |
| FR-4 | Formatted responses | High | Return human-readable responses with data tables |
| FR-5 | Aggregations | High | Support counts, percentages, averages, sums |
| FR-6 | Filtering & comparisons | High | Support filters, date ranges, comparisons |
| FR-7 | RBAC compliance | High | Respect user permissions - only show authorized data |
| FR-8 | Query transparency | Medium | Optionally show the generated query |
| FR-9 | Follow-up suggestions | Medium | Suggest related questions |
| FR-10 | Export results | Low | Export query results to CSV/Excel |

#### Example Queries to Support

**Products & Solutions:**
```
- "Show me all products with tasks that have no telemetry attributes"
- "List products with incomplete task definitions (missing descriptions or weights)"
- "Which solutions have the most tasks?"
- "Show products without any assigned customers"
- "Find tasks with weight = 0"
- "List all tasks for product X"
- "Which products have tasks with missing how-to documentation?"
```

**Customers & Adoption:**
```
- "Show customers with adoption progress less than 50%"
- "Which customers haven't started their adoption plan?"
- "List customers with tasks stuck in IN_PROGRESS for more than 30 days"
- "Show me the top 5 customers by adoption completion percentage"
- "Which customers are using product X?"
- "Find customers who completed adoption in the last 30 days"
- "Show customers with NO_LONGER_USING status on any task"
```

**Telemetry:**
```
- "Find tasks with telemetry attributes but no success criteria defined"
- "Show telemetry attributes that have never received values"
- "List tasks where telemetry shows NO_LONGER_USING status"
- "Which telemetry attributes are most commonly used?"
- "Find tasks with Boolean telemetry that's never been set"
```

**Analytics:**
```
- "What's the average adoption rate across all customers?"
- "Which products have the highest adoption success rate?"
- "Show monthly adoption progress trends"
- "Compare adoption rates between Essential and Advantage license levels"
- "What's the average time to complete adoption?"
- "Which tasks are most commonly skipped (NOT_APPLICABLE)?"
```

**Data Quality:**
```
- "Find products with no tasks defined"
- "Show tasks with missing estimated minutes"
- "List solutions with only one product"
- "Find duplicate customer names"
- "Show adoption plans that haven't been synced in 90 days"
```

### 2.2 Non-Functional Requirements

| ID | Requirement | Target | Notes |
|----|-------------|--------|-------|
| NFR-1 | Response time | < 5s simple, < 15s complex | Measured from query submission |
| NFR-2 | Availability | 99.5% uptime | Match main application SLA |
| NFR-3 | Security | Zero SQL injection | Use parameterized queries only |
| NFR-4 | RBAC | 100% compliance | No data leakage |
| NFR-5 | Audit | Full logging | Log all AI queries |
| NFR-6 | Scalability | 10 concurrent users | Can be increased |
| NFR-7 | Cost efficiency | < $250/month | Caching to reduce API calls |

### 2.3 User Stories

```gherkin
Feature: AI Assistant for DAP

  Scenario: Admin asks about adoption progress
    Given I am logged in as an Admin
    When I ask "Show customers with adoption below 50%"
    Then I should see a list of all matching customers
    And I should see their adoption percentages
    And I should see suggested follow-up questions

  Scenario: CSS user asks about their customers
    Given I am logged in as a CSS user
    And I have access to customers A, B, and C
    When I ask "Show customers with adoption below 50%"
    Then I should only see customers A, B, or C if they match
    And I should NOT see other customers even if they match

  Scenario: SME finds data quality issues
    Given I am logged in as an SME user
    When I ask "Find tasks with missing telemetry"
    Then I should see tasks from products I have access to
    And each task should show its product name
    And I should be able to navigate to fix the issues
```

---

## 3. Architecture Design

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    AI Chat Interface                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │ Chat Input   │  │ Response     │  │ Query History    │   │   │
│  │  │ Component    │  │ Display      │  │ & Suggestions    │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ GraphQL (askAI mutation)
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend (Node.js)                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    AI Agent Service                           │   │
│  │                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │ Query        │  │ Schema       │  │ Response         │   │   │
│  │  │ Interpreter  │→ │ Context      │→ │ Formatter        │   │   │
│  │  │ (LLM)        │  │ Manager      │  │                  │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │   │
│  │         ↓                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │ Query        │  │ Permission   │  │ Query            │   │   │
│  │  │ Generator    │→ │ Filter       │→ │ Executor         │   │   │
│  │  │ (Prisma)     │  │ (RBAC)       │  │                  │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                 │                                    │
│                                 ↓                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Prisma ORM                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ↓
                        ┌──────────────────┐
                        │   PostgreSQL     │
                        └──────────────────┘
```

### 3.2 Component Design

#### 3.2.1 AI Agent Service

**Location:** `backend/src/services/ai/AIAgentService.ts`

```typescript
interface AIAgentConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  maxTokens: number;
  temperature: number;
}

interface QueryRequest {
  question: string;
  userId: string;
  userRole: string;
  conversationId?: string;  // For follow-up questions
}

interface QueryResponse {
  answer: string;           // Natural language response
  data?: any[];             // Raw data results
  query?: string;           // Generated query (for transparency)
  suggestions?: string[];   // Follow-up question suggestions
  error?: string;           // Error message if failed
  metadata?: {
    executionTime: number;
    rowCount: number;
    cached: boolean;
  };
}

class AIAgentService {
  constructor(config: AIAgentConfig);
  
  // Main entry point
  async processQuestion(request: QueryRequest): Promise<QueryResponse>;
  
  // Internal pipeline
  private async interpretQuestion(question: string): Promise<QueryIntent>;
  private async generateQuery(intent: QueryIntent): Promise<PrismaQuery>;
  private async applyRBACFilters(query: PrismaQuery, userId: string): Promise<PrismaQuery>;
  private async executeQuery(query: PrismaQuery): Promise<any[]>;
  private async formatResponse(data: any[], intent: QueryIntent): Promise<string>;
  private async generateSuggestions(question: string, data: any[]): Promise<string[]>;
}
```

#### 3.2.2 Schema Context Manager

**Location:** `backend/src/services/ai/SchemaContextManager.ts`

```typescript
interface TableInfo {
  name: string;
  description: string;
  columns: ColumnInfo[];
  relationships: RelationshipInfo[];
}

interface SchemaContext {
  tables: TableInfo[];
  relationships: RelationshipInfo[];
  businessRules: string[];
  examples: QueryExample[];
  enumValues: Record<string, string[]>;
}

class SchemaContextManager {
  // Build full schema context (cached)
  getFullContext(): SchemaContext;
  
  // Get relevant subset for a question
  getRelevantContext(question: string): SchemaContext;
  
  // Get context as prompt string
  getContextPrompt(): string;
}
```

#### 3.2.3 Query Templates

**Location:** `backend/src/services/ai/QueryTemplates.ts`

Pre-defined safe query templates for common questions:

```typescript
interface QueryTemplate {
  id: string;
  description: string;
  patterns: string[];        // Regex patterns to match
  query: PrismaQueryBuilder; // Function to build query
  parameters: ParameterDef[];
}

const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: 'products_without_telemetry',
    description: 'Find products with tasks missing telemetry',
    patterns: [
      /products?.*(without|missing|no)\s*telemetry/i,
      /tasks?.*(without|missing|no)\s*telemetry/i
    ],
    query: (params) => ({
      model: 'Product',
      include: {
        tasks: {
          include: { telemetryAttributes: true },
          where: { telemetryAttributes: { none: {} } }
        }
      },
      where: {
        tasks: { some: { telemetryAttributes: { none: {} } } }
      }
    }),
    parameters: []
  },
  
  {
    id: 'customers_low_adoption',
    description: 'Find customers with low adoption progress',
    patterns: [
      /customers?.*(below|under|less than)\s*(\d+)%/i,
      /adoption.*(below|under|less than)\s*(\d+)/i
    ],
    query: (params) => ({
      model: 'Customer',
      include: {
        customerProducts: {
          include: { adoptionPlan: true }
        }
      },
      where: {
        customerProducts: {
          some: {
            adoptionPlan: {
              completionPercentage: { lt: params.threshold }
            }
          }
        }
      }
    }),
    parameters: [{ name: 'threshold', type: 'number', extract: /(\d+)%?/ }]
  },
  
  // ... 20+ more templates
];
```

### 3.3 GraphQL Schema

**Location:** `backend/src/schema/typeDefs.ts` (additions)

```graphql
# AI Agent Types
type AIQueryResponse {
  """Natural language answer to the question"""
  answer: String!
  
  """Raw data results as JSON"""
  data: JSON
  
  """The generated query (for transparency)"""
  query: String
  
  """Suggested follow-up questions"""
  suggestions: [String!]
  
  """Error message if query failed"""
  error: String
  
  """Query execution metadata"""
  metadata: AIQueryMetadata
}

type AIQueryMetadata {
  executionTime: Int!
  rowCount: Int!
  cached: Boolean!
}

type AIConversation {
  id: ID!
  messages: [AIMessage!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AIMessage {
  id: ID!
  role: String!  # 'user' or 'assistant'
  content: String!
  data: JSON
  timestamp: DateTime!
}

# Extend Query
extend type Query {
  """Ask the AI assistant a question about DAP data"""
  askAI(
    question: String!
    conversationId: String
  ): AIQueryResponse!
  
  """Get conversation history"""
  aiConversations(limit: Int): [AIConversation!]!
  
  """Get a specific conversation"""
  aiConversation(id: ID!): AIConversation
}

# Extend Mutation
extend type Mutation {
  """Start a new AI conversation"""
  startAIConversation: AIConversation!
  
  """Clear conversation history"""
  clearAIConversations: Boolean!
}
```

### 3.4 Security Design

#### 3.4.1 Query Safety Layers

```
Layer 1: Input Validation
  ↓ Sanitize and validate user input
Layer 2: Template Matching (Preferred)
  ↓ Use pre-defined safe templates when possible
Layer 3: Prisma Query Generation
  ↓ Generate Prisma queries (not raw SQL)
Layer 4: Query Validation
  ↓ Validate generated query structure
Layer 5: RBAC Filtering
  ↓ Apply permission filters
Layer 6: Execution Limits
  ↓ Timeout, row limits, read-only
Layer 7: Audit Logging
  ↓ Log all queries and results
```

#### 3.4.2 RBAC Integration

```typescript
async function applyRBACFilters(
  query: PrismaQuery,
  userId: string,
  userRole: string
): Promise<PrismaQuery> {
  // Admin: Full access - no filters
  if (userRole === 'ADMIN') {
    return query;
  }
  
  // SME: Products and Solutions only
  if (userRole === 'SME') {
    // Get accessible product/solution IDs
    const accessibleIds = await getAccessibleResources(userId, 'PRODUCT');
    
    // Add filter to query
    return addResourceFilter(query, 'productId', accessibleIds);
  }
  
  // CSS: Customers only (with READ on products/solutions)
  if (userRole === 'CSS' || userRole === 'CS') {
    const accessibleCustomers = await getAccessibleResources(userId, 'CUSTOMER');
    return addResourceFilter(query, 'customerId', accessibleCustomers);
  }
  
  // Default: Very restricted
  throw new Error('Insufficient permissions for AI queries');
}
```

#### 3.4.3 Audit Logging

```typescript
interface AIAuditLog {
  id: string;
  userId: string;
  userRole: string;
  question: string;
  generatedQuery: string;
  executionTime: number;
  rowCount: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

// Log every AI query
await prisma.aiAuditLog.create({
  data: {
    userId: request.userId,
    userRole: request.userRole,
    question: request.question,
    generatedQuery: JSON.stringify(query),
    executionTime: metrics.executionTime,
    rowCount: results.length,
    success: true,
    timestamp: new Date()
  }
});
```

---

## 4. Implementation Plan

### 4.1 Phase 1: Foundation (Week 1-2)

**Goal:** Set up infrastructure and basic query capability

#### Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 1.1 | Create AI service directory structure | 2h |
| 1.2 | Implement SchemaContextManager | 8h |
| 1.3 | Create 20 query templates | 8h |
| 1.4 | Set up LLM provider integration | 4h |
| 1.5 | Add GraphQL schema and resolvers | 4h |
| 1.6 | Implement basic query execution | 8h |
| 1.7 | Add audit logging | 4h |
| 1.8 | Testing and debugging | 8h |

**Deliverables:**
- Working `askAI` GraphQL endpoint
- 20 pre-defined query templates
- Basic LLM integration
- Audit logging

### 4.2 Phase 2: Core Intelligence (Week 3-4)

**Goal:** Improve query understanding and generation

#### Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 2.1 | Implement intent classification | 8h |
| 2.2 | Add entity extraction | 8h |
| 2.3 | Implement dynamic Prisma query generation | 12h |
| 2.4 | Add RBAC integration | 8h |
| 2.5 | Implement response formatting | 6h |
| 2.6 | Add suggestion generation | 4h |
| 2.7 | Testing with various queries | 8h |

**Deliverables:**
- Dynamic query generation
- RBAC-compliant queries
- Formatted responses with suggestions

### 4.3 Phase 3: Frontend UI (Week 5-6)

**Goal:** Create intuitive chat interface

#### Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 3.1 | Create AIAssistantPanel component | 8h |
| 3.2 | Implement ChatInterface | 8h |
| 3.3 | Create QueryResultDisplay | 6h |
| 3.4 | Add SuggestionChips | 4h |
| 3.5 | Implement conversation history | 6h |
| 3.6 | Add to navigation menu | 2h |
| 3.7 | Styling and polish | 4h |
| 3.8 | Testing and UX refinement | 8h |

**Deliverables:**
- Full chat interface
- Results display with tables
- Conversation history
- Menu integration

### 4.4 Phase 4: Enhancement (Week 7-8)

**Goal:** Optimize performance and add advanced features

#### Tasks

| Task | Description | Effort |
|------|-------------|--------|
| 4.1 | Implement query caching | 6h |
| 4.2 | Add conversation context | 8h |
| 4.3 | Implement export functionality | 4h |
| 4.4 | Add keyboard shortcuts | 2h |
| 4.5 | Performance optimization | 6h |
| 4.6 | Documentation | 4h |
| 4.7 | End-to-end testing | 8h |
| 4.8 | Bug fixes and polish | 8h |

**Deliverables:**
- Caching layer
- Conversation memory
- Export to CSV/Excel
- Complete documentation

### 4.5 Timeline Summary

```
Week 1-2: Foundation
├── Day 1-2: Setup, directory structure
├── Day 3-5: Schema context, templates
├── Day 6-8: GraphQL integration
└── Day 9-10: Testing

Week 3-4: Core Intelligence
├── Day 1-3: Intent classification
├── Day 4-6: Query generation
├── Day 7-8: RBAC integration
└── Day 9-10: Response formatting

Week 5-6: Frontend UI
├── Day 1-3: Main components
├── Day 4-6: Results display
├── Day 7-8: History, navigation
└── Day 9-10: Styling, testing

Week 7-8: Enhancement
├── Day 1-3: Caching, context
├── Day 4-5: Export, shortcuts
├── Day 6-7: Performance
└── Day 8-10: Documentation, testing
```

---

## 5. Technical Specifications

### 5.1 LLM Provider Options

| Provider | Model | Pros | Cons | Cost |
|----------|-------|------|------|------|
| **OpenAI** | GPT-4o | Best reasoning, function calling, wide adoption | Higher cost, data privacy concerns | ~$0.01/query |
| **Anthropic** | Claude 3.5 Sonnet | Great instruction following, longer context | Slightly lower reasoning | ~$0.008/query |
| **OpenAI** | GPT-4o-mini | Good balance of quality/cost | Less capable than GPT-4o | ~$0.002/query |
| **Local** | Llama 3.1 70B | Full privacy, no API costs | Requires GPU, lower quality | Infrastructure cost |

**Recommendation:** 
- **Primary:** OpenAI GPT-4o for best results
- **Fallback:** GPT-4o-mini for cost optimization
- **Future:** Option for local deployment

### 5.2 Environment Variables

```bash
# AI Agent Configuration
AI_PROVIDER=openai                    # openai | anthropic | local
AI_MODEL=gpt-4o                       # Model name
AI_API_KEY=sk-...                     # API key (required for cloud)
AI_MAX_TOKENS=2000                    # Max response tokens
AI_TEMPERATURE=0.1                    # Low for deterministic queries
AI_TIMEOUT=30000                      # Request timeout (ms)

# Query Limits
AI_MAX_ROWS=1000                      # Max rows returned
AI_QUERY_TIMEOUT=15000                # Query execution timeout
AI_CACHE_TTL=300                      # Cache TTL in seconds

# Feature Flags
AI_ENABLED=true                       # Enable/disable AI feature
AI_SHOW_QUERY=true                    # Show generated queries to users
AI_AUDIT_LOGGING=true                 # Log all queries
```

### 5.3 System Prompt

```typescript
const SYSTEM_PROMPT = `
You are an AI assistant for DAP (Digital Adoption Platform). Your role is to help users 
query and understand data about products, solutions, customers, and adoption progress.

## Database Schema Overview

### Core Entities

**Product**
- id, name, description
- Has many: Tasks, Licenses, Outcomes, Releases, CustomAttributes
- Related to: Solutions (many-to-many), Customers (via CustomerProduct)

**Solution**
- id, name, description
- Has many: Tasks, Products (via SolutionProduct)
- Related to: Customers (via CustomerSolution)

**Task**
- id, name, description, weight, estimatedMinutes, sequence
- Belongs to: Product OR Solution
- Has many: TelemetryAttributes
- Fields: howToDocLinks, howToVideoLinks, isActive

**Customer**
- id, name, description
- Has many: CustomerProducts, CustomerSolutions
- Each assignment creates an AdoptionPlan

**AdoptionPlan**
- Belongs to: CustomerProduct
- Fields: completionPercentage, selectedLicenseId, selectedReleaseIds
- Has many: CustomerTasks

**CustomerTask**
- Copy of Task for specific customer
- Fields: status, statusUpdatedAt, statusUpdateSource
- Has many: CustomerTelemetryAttributes

**TelemetryAttribute**
- Belongs to: Task
- Fields: name, description, dataType, successCriteria, isRequired
- dataType: BOOLEAN, NUMBER, STRING, TIMESTAMP, JSON

### Enum Values

**TaskStatus**: NOT_STARTED, IN_PROGRESS, DONE, COMPLETED, NOT_APPLICABLE, NO_LONGER_USING
**StatusUpdateSource**: MANUAL, TELEMETRY, IMPORT, SYSTEM
**LicenseLevel**: (hierarchical) Essential < Advantage < Signature
**DataType**: BOOLEAN, NUMBER, STRING, TIMESTAMP, JSON

### Key Relationships

- Product → Tasks (1:many)
- Task → TelemetryAttributes (1:many)
- Customer → CustomerProducts (1:many)
- CustomerProduct → AdoptionPlan (1:1)
- AdoptionPlan → CustomerTasks (1:many)
- Solution → Products (many:many via SolutionProduct)

### Business Rules

1. Adoption progress = weighted sum of completed tasks (not simple count)
2. Manual status updates take precedence over telemetry
3. License levels are hierarchical (Signature includes all Advantage and Essential features)
4. CustomerTask is a snapshot - can diverge from source Task
5. TelemetryAttribute success criteria can use AND/OR logic

## Your Capabilities

1. **Data Queries**: Find, filter, and aggregate data from any entity
2. **Quality Analysis**: Find missing data, incomplete configurations
3. **Adoption Metrics**: Calculate progress, identify stuck customers
4. **Comparisons**: Compare across products, customers, license levels
5. **Trends**: Analyze changes over time

## Response Guidelines

1. Provide clear, concise answers
2. Include data tables when showing multiple records
3. Always mention the count of results found
4. Suggest relevant follow-up questions
5. Explain any limitations or caveats
6. If unsure, say so rather than guessing

## Restrictions

1. Only query data the user has permission to access
2. Never expose sensitive information (passwords, API keys)
3. Don't make up data - only report what's in the database
4. Limit results to reasonable amounts (max 100 rows in display)
`;
```

### 5.4 File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── ai/
│   │   │   ├── index.ts                 # Exports
│   │   │   ├── AIAgentService.ts        # Main service class
│   │   │   ├── SchemaContextManager.ts  # Schema context builder
│   │   │   ├── QueryGenerator.ts        # Query generation logic
│   │   │   ├── QueryExecutor.ts         # Safe query execution
│   │   │   ├── QueryTemplates.ts        # Pre-defined templates
│   │   │   ├── ResponseFormatter.ts     # Format results
│   │   │   ├── SuggestionGenerator.ts   # Generate follow-ups
│   │   │   ├── RBACFilter.ts            # Permission filtering
│   │   │   ├── CacheManager.ts          # Query caching
│   │   │   └── providers/
│   │   │       ├── index.ts
│   │   │       ├── LLMProvider.ts       # Base interface
│   │   │       ├── OpenAIProvider.ts    # OpenAI implementation
│   │   │       └── AnthropicProvider.ts # Anthropic implementation
│   │   │
│   ├── schema/
│   │   ├── resolvers/
│   │   │   └── ai.ts                    # AI GraphQL resolvers
│   │   └── typeDefs.ts                  # (add AI types)

frontend/
├── src/
│   ├── components/
│   │   ├── ai/
│   │   │   ├── index.ts                 # Exports
│   │   │   ├── AIAssistantPanel.tsx     # Main panel component
│   │   │   ├── ChatInterface.tsx        # Chat UI
│   │   │   ├── ChatInput.tsx            # Input with autocomplete
│   │   │   ├── ChatMessage.tsx          # Message bubble
│   │   │   ├── QueryResultTable.tsx     # Data table display
│   │   │   ├── QueryResultChart.tsx     # Optional chart display
│   │   │   ├── SuggestionChips.tsx      # Follow-up suggestions
│   │   │   ├── ConversationHistory.tsx  # Past conversations
│   │   │   └── ExportButton.tsx         # Export results
│   │   │
│   ├── hooks/
│   │   └── useAIAssistant.ts            # AI hook
│   │
│   ├── graphql/
│   │   └── ai.ts                        # AI queries/mutations
│   │
│   └── pages/
│       └── App.tsx                      # (add AI menu item)
```

---

## 6. Example Interactions

### Example 1: Products with Missing Telemetry

**User Input:**
```
Show me all products with tasks that don't have telemetry configured
```

**AI Response:**
```
I found 3 products with tasks missing telemetry attributes:

┌────────────────────────┬──────────────────────────┬─────────────┐
│ Product                │ Tasks Without Telemetry  │ Total Tasks │
├────────────────────────┼──────────────────────────┼─────────────┤
│ Cisco Secure Access    │ 5                        │ 12          │
│ Webex Contact Center   │ 3                        │ 8           │
│ Duo Security           │ 2                        │ 15          │
└────────────────────────┴──────────────────────────┴─────────────┘

Would you like me to:
• Show the specific tasks missing telemetry?
• Find tasks with telemetry but no success criteria?
• See which products have complete telemetry coverage?
```

### Example 2: Low Adoption Customers

**User Input:**
```
Which customers have adoption progress below 50%?
```

**AI Response:**
```
Found 4 customers with adoption progress below 50%:

┌──────────────────┬────────────────────────┬──────────┬─────────────────┐
│ Customer         │ Product                │ Progress │ Status          │
├──────────────────┼────────────────────────┼──────────┼─────────────────┤
│ Acme Corp        │ Cisco Secure Access    │ 23%      │ 3/12 tasks done │
│ TechStart Inc    │ Duo Security           │ 35%      │ 5/15 tasks done │
│ Global Systems   │ Webex Contact Center   │ 42%      │ 4/8 tasks done  │
│ DataFlow Ltd     │ Cisco Secure Access    │ 48%      │ 6/12 tasks done │
└──────────────────┴────────────────────────┴──────────┴─────────────────┘

**Insights:**
• Most common stuck tasks: SSO Integration (3 customers), Directory Sync (2 customers)
• Average time stuck: 28 days
• 2 customers haven't had any activity in 30+ days

Would you like to:
• See details for a specific customer?
• Find which tasks are blocking progress?
• Compare with customers above 50%?
```

### Example 3: License Level Comparison

**User Input:**
```
Compare adoption rates between Essential and Advantage license customers
```

**AI Response:**
```
License Level Adoption Comparison (across all products):

┌────────────┬──────────────────┬───────────┬─────────────────┬────────────┐
│ Metric     │ Essential        │ Advantage │ Difference      │ Trend      │
├────────────┼──────────────────┼───────────┼─────────────────┼────────────┤
│ Avg Compl. │ 45%              │ 72%       │ +27%            │ 📈         │
│ Customers  │ 12               │ 8         │ -              │            │
│ Time to 50%│ 45 days          │ 28 days   │ -17 days        │ 📈         │
│ Stuck Rate │ 25%              │ 10%       │ -15%            │ 📈         │
│ Full Adopt.│ 2 (17%)          │ 4 (50%)   │ +33%            │ 📈         │
└────────────┴──────────────────┴───────────┴─────────────────┴────────────┘

**Key Insights:**
• Advantage customers complete adoption 60% faster
• Essential customers are 2.5x more likely to get stuck
• Only 17% of Essential customers reach full adoption vs 50% of Advantage

**Recommendation:** Consider identifying Essential customers who might benefit 
from upgrading to Advantage for better adoption support.

Would you like to:
• See which Essential customers are best candidates for upgrade?
• Analyze why Essential customers get stuck more often?
• View adoption trends over time by license level?
```

### Example 4: Data Quality Check

**User Input:**
```
Find tasks with incomplete configuration
```

**AI Response:**
```
Found 15 tasks with incomplete configuration across 4 products:

**Missing Descriptions (8 tasks):**
┌────────────────────────┬──────────────────────────────┬──────────┐
│ Product                │ Task                         │ Issue    │
├────────────────────────┼──────────────────────────────┼──────────┤
│ Cisco Secure Access    │ Configure SAML               │ No desc  │
│ Cisco Secure Access    │ Set up MFA                   │ No desc  │
│ Duo Security           │ Install Duo Gateway          │ No desc  │
│ ...                    │ ...                          │ ...      │
└────────────────────────┴──────────────────────────────┴──────────┘

**Missing Weights (4 tasks):**
• Webex CC: "Agent Training" (weight = 0)
• Webex CC: "Supervisor Setup" (weight = 0)
• Duo: "Test Authentication" (weight = 0)
• Duo: "Documentation Review" (weight = 0)

**Missing How-To Documentation (3 tasks):**
• Cisco Secure Access: "Advanced Routing"
• Cisco Secure Access: "Custom Policies"
• Duo Security: "API Integration"

Would you like to:
• Export this list to fix in bulk?
• See tasks missing telemetry configuration?
• Get a complete data quality report?
```

---

## 7. Cost Estimates

### 7.1 Development Effort

| Phase | Duration | Hours | Cost (@$100/hr) |
|-------|----------|-------|-----------------|
| Phase 1: Foundation | 2 weeks | 46 hours | $4,600 |
| Phase 2: Core Intelligence | 2 weeks | 54 hours | $5,400 |
| Phase 3: Frontend UI | 2 weeks | 46 hours | $4,600 |
| Phase 4: Enhancement | 2 weeks | 46 hours | $4,600 |
| **Total** | **8 weeks** | **192 hours** | **$19,200** |

### 7.2 Ongoing Monthly Costs

| Item | Low Usage | Medium Usage | High Usage |
|------|-----------|--------------|------------|
| OpenAI API (GPT-4o) | $30 | $100 | $300 |
| OpenAI API (GPT-4o-mini fallback) | $5 | $20 | $50 |
| Additional server resources | $0 | $25 | $50 |
| **Monthly Total** | **$35** | **$145** | **$400** |

### 7.3 Cost Optimization Strategies

1. **Query Caching**: Cache frequent queries (5min TTL) - ~40% reduction
2. **Template Matching**: Use templates instead of LLM when possible - ~30% reduction
3. **Model Selection**: Use GPT-4o-mini for simple queries - ~60% cost per query
4. **Batch Processing**: Combine related queries - ~20% reduction

---

## 8. Risks & Mitigations

### 8.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **SQL Injection** | Critical | Low | Use Prisma ORM only, no raw SQL from LLM |
| **Data Leakage** | Critical | Medium | RBAC filters at query level, not display |
| **Incorrect Queries** | High | Medium | Templates for common queries, validation |
| **Poor Response Quality** | Medium | Medium | Extensive prompting, examples, fallbacks |
| **High Latency** | Medium | Medium | Caching, query optimization, timeouts |
| **API Outages** | Medium | Low | Fallback provider, graceful degradation |

### 8.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **High API Costs** | Medium | Medium | Caching, rate limiting, cost alerts |
| **User Confusion** | Medium | Medium | Clear examples, suggestions, help text |
| **Over-reliance on AI** | Low | Medium | Maintain traditional query methods |
| **Privacy Concerns** | High | Low | On-prem option, data handling policy |

### 8.3 Mitigation Strategies

#### For SQL Injection:
```typescript
// NEVER do this:
const query = `SELECT * FROM users WHERE name = '${userInput}'`;

// ALWAYS do this:
const result = await prisma.user.findMany({
  where: { name: userInput }  // Prisma handles escaping
});
```

#### For Data Leakage:
```typescript
// Apply filters BEFORE execution, not after
async function executeQuery(query, userId, role) {
  // 1. Apply RBAC filters to query
  const filteredQuery = await applyRBACFilters(query, userId, role);
  
  // 2. Execute filtered query
  const results = await prisma.$queryRaw(filteredQuery);
  
  // 3. Double-check results (defense in depth)
  return verifyAccessRights(results, userId, role);
}
```

#### For API Costs:
```typescript
// Implement cost controls
const costLimits = {
  perUser: { daily: 100, monthly: 2000 },  // queries
  global: { daily: 1000, monthly: 20000 }   // queries
};

async function checkCostLimits(userId) {
  const userQueries = await getQueryCount(userId, 'day');
  if (userQueries >= costLimits.perUser.daily) {
    throw new Error('Daily query limit reached. Try again tomorrow.');
  }
}
```

---

## 9. Success Metrics

### 9.1 Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Query Success Rate** | > 90% | Queries returning useful results |
| **Average Response Time** | < 5 seconds | Time from submit to response |
| **User Satisfaction** | > 4.0/5.0 | Post-query feedback rating |
| **Daily Active Users** | > 50% of admins | Unique users per day |
| **Queries per User** | > 3/day | Average queries per active user |
| **Template Match Rate** | > 60% | Queries handled by templates |
| **Cost per Query** | < $0.05 | Average API + compute cost |

### 9.2 Quality Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| **Accuracy** | > 95% | Correct data returned |
| **Relevance** | > 90% | Response addresses the question |
| **Completeness** | > 85% | All relevant data included |
| **False Positives** | < 5% | Incorrect data returned |
| **RBAC Compliance** | 100% | No unauthorized data exposed |

### 9.3 Monitoring Dashboard

Track these metrics in real-time:
- Query volume (hourly, daily, weekly)
- Response times (p50, p90, p99)
- Error rates by type
- Most popular queries
- User satisfaction trends
- API cost trends

---

## 10. Appendix

### 10.1 Query Template Examples

See: `backend/src/services/ai/QueryTemplates.ts`

### 10.2 Schema Context Document

See: `backend/src/services/ai/schema-context.md`

### 10.3 API Documentation

See: GraphQL schema in `backend/src/schema/typeDefs.ts`

### 10.4 User Guide

See: `docs/AI_ASSISTANT_USER_GUIDE.md` (to be created)

### 10.5 Related Documents

- [CONTEXT.md](/CONTEXT.md) - Application overview
- [Architecture](/docs/ARCHITECTURE.md) - System architecture
- [Database Schema](/backend/prisma/schema.prisma) - Full schema

---

## Approval & Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Security Review | | | |

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-03 | Dev Team | Initial document |



