# DAP Features Documentation

This document provides a comprehensive overview of all features in the Data Application Platform (DAP).

## Table of Contents

1. [Core Features](#core-features)
2. [Customer Adoption Planning](#customer-adoption-planning)
3. [Excel Import/Export](#excel-importexport)
4. [Telemetry System](#telemetry-system)
5. [Task Management](#task-management)
6. [Product Management](#product-management)
7. [UI/UX Features](#uiux-features)
8. [AI Agent](#ai-agent)

---

## Core Features

### Multi-Tenancy Support
- Role-based access control (admin/user)
- Organization-based data isolation
- Secure authentication headers

### Real-Time Synchronization
- Apollo Client subscriptions
- Automatic cache invalidation
- GraphQL WebSocket connections
- Optimistic UI updates

### Configuration Management
- Environment-specific configs (dev/staging/prod)
- No hardcoded URLs
- Runtime configuration loading
- Docker Compose orchestration

---

## Customer Adoption Planning

### Overview
Customer Adoption Plans allow you to create customized implementation roadmaps for each customer based on your product offerings.

### Key Features

#### 1. **Sync with Product Updates** ✅
- **Auto-sync**: Automatically includes ALL product outcomes and releases when syncing
- **One-click sync**: Updates adoption plan with latest product changes
- **Smart filtering**: Only shows relevant tasks based on customer's license level
- **Real-time updates**: Changes to products immediately reflect in adoption plans

#### 2. **Task Management**
- **Sequence management**: Automatic renumbering when tasks are added/deleted/reordered
- **Inline editing**: Edit sequence numbers directly in the task list view
- **Validation**: Prevents duplicate sequence numbers with automatic adjustment
- **License filtering**: Tasks filtered by customer's license level

#### 3. **HowTo Documentation Links** ✅
- **Documentation Links**: Add howToDoc URLs to tasks
- **Video Links**: Add howToVideo URLs to tasks
- **Clickable Icons**: Professional Material-UI icons (Article for docs, OndemandVideo for videos)
- **Tooltip Support**: Hover to see link type
- **One-click Access**: Click icon to open link in new tab

#### 4. **Clean Task List View** ✅
- **Progressive Disclosure**: Description shown only on hover
- **Icon-based Actions**: Professional Material-UI icons throughout
- **No Clutter**: Removed unnecessary chips and badges
- **Hover Details**: Show task description on mouse hover

#### 5. **Product Menu Auto-Expand** ✅
- **One-click Navigation**: Product menu automatically expands when clicked
- **Improved UX**: No need to click twice to see product details
- **Smooth Transitions**: Material-UI animations

### GraphQL API

#### Sync Adoption Plan
```graphql
mutation {
  syncAdoptionPlan(
    customerId: "customer-123"
    productIds: ["product-1", "product-2"]
  ) {
    id
    customer { id name }
    tasks {
      id
      name
      sequenceNumber
      howToDoc
      howToVideo
    }
  }
}
```

#### Query Adoption Plan
```graphql
query {
  customerAdoptionPlans(customerId: "customer-123") {
    id
    customer { id name }
    tasks {
      id
      name
      description
      sequenceNumber
      estMinutes
      weight
      priority
      license { name level }
      outcomes { id name }
      releases { id name }
      howToDoc
      howToVideo
    }
  }
}
```

---

## Excel Import/Export

### Multi-Sheet Workbook Export
- **8-tab structure**: Instructions, Product, Tasks, Licenses, Releases, Outcomes, CustomAttributes, Telemetry
- **ExcelJS-powered**: Professional Excel generation on backend
- **Comprehensive data**: All related entities in one workbook
- **Instructions tab**: Built-in documentation for import format

### Smart Import Features
- **Header tolerance**: Accepts variations in column names
- **Data normalization**: Automatic cleanup of license levels, priorities
- **Relationship mapping**: Maps names back to IDs (licenses, outcomes, releases)
- **Telemetry preservation**: Optional telemetry rows maintained
- **Custom attributes**: JSON-based custom field sync
- **Default handling**: Sensible defaults for missing data (e.g., Essential license)

### Export Formats
```graphql
mutation {
  exportProductsCsv  # Legacy CSV export
  exportProductsExcel(productId: "product-123")  # Full workbook
}
```

### Import Validation
- Real-time error checking
- Relationship validation
- Required field verification
- Data type enforcement

---

## Telemetry System

### Task-Level Telemetry
- **Attribute Configuration**: Configure telemetry per task
- **Data Types**: String, Number, Boolean, Date, JSON
- **Success Criteria**: Define completion metrics
- **Requirement Flags**: Mark attributes as required
- **Active State**: Enable/disable attributes
- **Ordering**: Custom attribute display order

### Evaluation Engine
- **Automatic Calculation**: Backend evaluation of success criteria
- **Completion Metrics**: Track task completion percentage
- **Dashboard Integration**: Real-time metrics display
- **JSON Schema Support**: Flexible attribute definitions

### Configuration Example
```typescript
{
  attributeName: "response_time",
  dataType: "number",
  successCriteria: "< 200",
  isRequired: true,
  isActive: true,
  displayOrder: 1
}
```

---

## Task Management

### Sequence Number Management ✅

#### Features
- **Automatic Renumbering**: When tasks are deleted, remaining tasks automatically renumber
- **Inline Editing**: Edit sequence numbers directly in the list view
- **Conflict Resolution**: Prevents unique constraint violations
- **Two-Phase Updates**: Uses temporary negative values to avoid conflicts

#### Implementation Details
- **Database Constraint**: Unique constraint on (productId, sequenceNumber)
- **Transaction Safety**: Two-phase approach ensures atomicity
- **Cache Management**: Apollo cache eviction and garbage collection

#### GraphQL Mutations
```graphql
mutation {
  updateTask(
    id: "task-123"
    input: { sequenceNumber: 5 }
  ) {
    id
    sequenceNumber
  }
}

mutation {
  deleteTask(id: "task-123") {
    success
  }
}
```

### Task Attributes
- **Documentation**: Link to task documentation
- **Video**: Link to instructional video
- **Estimation**: Time estimates in minutes
- **Weight**: Task complexity/importance (1-20)
- **Priority**: High/Medium/Low
- **License Association**: Link to specific license level
- **Outcome Mapping**: Link to multiple outcomes
- **Release Mapping**: Link to product releases

### Task Deletion Queue
- **Soft Delete**: Tasks marked for deletion
- **Batch Processing**: Process deletions in batches
- **Cascade Handling**: Updates dependent tasks automatically
- **Cache Invalidation**: Ensures GUI updates immediately

---

## Product Management

### Product Hierarchy
```
Product
├── Licenses (Essential/Advantage/Signature)
├── Outcomes (Business goals)
├── Releases (Version milestones)
├── Tasks (Implementation work)
└── Custom Attributes (JSON metadata)
```

### License Levels
1. **Essential** (Level 1): Basic features
2. **Advantage** (Level 2): Advanced features
3. **Signature** (Level 3): Premium features

### Outcome Synchronization ✅
- **Coordinated Refetch**: All outcome mutations refetch 'Outcomes' query
- **Cache Consistency**: Changes visible across all components
- **Shared Handlers**: Reusable CRUD operations in `sharedHandlers.ts`

### Custom Attributes
- JSON-based flexible metadata
- Import/export support
- Schema-free extension points

---

## UI/UX Features

### Material-UI Components
- **Professional Icons**: Article, OndemandVideo, Edit, Delete, DragIndicator
- **Tooltips**: Contextual help throughout
- **Responsive Design**: Mobile-friendly layouts
- **Smooth Animations**: Material-UI transitions

### Drag & Drop
- **DnD Kit**: Modern drag and drop implementation
- **Reordering**: Visual task reordering
- **Accessibility**: Keyboard navigation support

### Apollo Client Integration
- **Optimistic Updates**: Immediate UI feedback
- **Cache Management**: Intelligent cache eviction
- **Error Handling**: User-friendly error messages
- **Loading States**: Skeleton screens and spinners

### Progressive Disclosure
- **Hover Details**: Show additional info on hover
- **Expandable Sections**: Collapse/expand content
- **Clean Views**: Hide complexity until needed

### Form Validation
- **Real-time Validation**: Immediate feedback
- **Required Fields**: Clear required field indicators
- **Error Messages**: Helpful validation messages
- **Submit Safeguards**: Prevent invalid submissions

---

## Performance Optimizations

### Backend
- **Prisma ORM**: Optimized database queries
- **Connection Pooling**: Efficient database connections
- **Transaction Management**: ACID compliance
- **Index Strategy**: Optimized database indexes

### Frontend
- **Code Splitting**: Lazy loading components
- **Memoization**: React.memo for expensive renders
- **Virtual Scrolling**: Handle large lists efficiently
- **Bundle Optimization**: Vite build optimizations

### Caching Strategy
- **Apollo Cache**: Normalized client-side cache
- **Cache Eviction**: Automatic cleanup
- **Garbage Collection**: Memory management
- **Refetch Coordination**: Minimize redundant queries

---

## Security Features

### Authentication
- Header-based authentication
- Role-based access control
- Secure API endpoints

### Data Validation
- Input sanitization
- Type checking
- SQL injection prevention
- XSS protection

### Error Handling
- Graceful degradation
- User-friendly messages
- Detailed logging
- Error boundaries

---

## Development Features

### TypeScript
- **Type Safety**: Compile-time error checking
- **IntelliSense**: Rich IDE support
- **Refactoring**: Safe code refactoring
- **Documentation**: Self-documenting code

### Testing
- **Jest**: Unit testing framework
- **Testing Library**: React component testing
- **GraphQL Testing**: API integration tests
- **Mock Data**: Comprehensive test fixtures

### DevTools
- **Apollo DevTools**: GraphQL debugging
- **React DevTools**: Component inspection
- **Prisma Studio**: Database GUI
- **Hot Reload**: Fast development iteration

---

## Deployment Features

### Docker Support
- **Multi-container**: Frontend, backend, database
- **Docker Compose**: Orchestration
- **Environment Variables**: Configuration management
- **Health Checks**: Container monitoring

### CI/CD Ready
- **Build Scripts**: Automated builds
- **Test Automation**: Pre-deployment testing
- **Deployment Guides**: Comprehensive documentation
- **Environment Promotion**: Dev → Staging → Production

---

## AI Agent

### Overview
The **AI Agent** is a powerful assistant that answers questions about your data and documentation.

### Core Capabilities

1.  **Text-to-SQL Engine** ✅
    *   **Natural Language Queries**: "Show me all products with no customers"
    *   **Dynamic Schema**: Automatically learns new tables and columns
    *   **Safety First**: Read-only queries, RBAC filtered

2.  **Documentation RAG** ✅
    *   **Knowledge Base**: Answers from architecture docs, guides, and release notes
    *   **How-To Support**: "How do I create a new user?"
    *   **Context Aware**: Knows the difference between Data and Docs questions

3.  **Smart Routing** ✅
    *   Automatically detects intent (Data vs Docs)
    *   No need to switch modes

### Example Questions
*   "Show me all products" (Data)
*   "How do I back up the database?" (Docs)
*   "Which customers are stuck?" (Data)
*   "Explain the architecture" (Docs)

---

For implementation details, see:
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment instructions
- [TECHNICAL-DOCUMENTATION.md](TECHNICAL-DOCUMENTATION.md) - Deep technical details
