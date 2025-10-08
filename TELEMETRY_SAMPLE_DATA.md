# Telemetry Data Added to Sample Tasks

## Overview
Comprehensive telemetry data has been added to all sample product tasks, providing realistic monitoring and success criteria for each task.

## Date
October 8, 2025

## Implementation

### Coverage
- **All 47 sample tasks** across 5 enterprise products
- Each task has **5 telemetry attributes**
- Each attribute has **3 historical values**

### Products with Telemetry

1. **Retail Management App** (15 tasks)
   - 75 telemetry attributes
   - 225 telemetry values

2. **Financial Services App** (14 tasks)
   - 70 telemetry attributes
   - 210 telemetry values

3. **IT Operations App** (6 tasks)
   - 30 telemetry attributes
   - 90 telemetry values

4. **AI-Powered Analytics App** (6 tasks)
   - 30 telemetry attributes
   - 90 telemetry values

5. **Network Management App** (6 tasks)
   - 30 telemetry attributes
   - 90 telemetry values

**Total**: 235 telemetry attributes with 705 historical values

## Telemetry Attributes Per Task

Each task includes 5 comprehensive telemetry attributes:

### 1. Deployment Status (BOOLEAN)
- **Type**: Boolean flag
- **Description**: Indicates if the task deployment is complete
- **Success Criteria**: 
  ```json
  {
    "type": "boolean_flag",
    "expectedValue": true,
    "description": "Task is considered complete when deployment status is true"
  }
  ```
- **Sample Values**:
  - `false` - "Initial deployment in progress" (6 days ago)
  - `true/false` - "Deployment status update" (4 days ago)
  - `true` - "Deployment completed successfully" (2 days ago)
- **Required**: Yes
- **Order**: 1

### 2. Performance Score (NUMBER)
- **Type**: Numeric score (0-100)
- **Description**: Performance score for the task
- **Success Criteria**:
  ```json
  {
    "type": "number_threshold",
    "operator": "greater_than_or_equal",
    "threshold": 85,
    "description": "Task is successful when performance score >= 85"
  }
  ```
- **Sample Values**:
  - `72` - "Initial performance baseline" (6 days ago)
  - `80-95` - "Performance improving" (4 days ago)
  - `88-99` - "Performance target met" (2 days ago)
- **Required**: Yes
- **Order**: 2

### 3. Code Quality (STRING)
- **Type**: String status indicator
- **Description**: Code quality status
- **Success Criteria**:
  ```json
  {
    "type": "string_match",
    "mode": "exact",
    "pattern": "PASSED",
    "caseSensitive": false,
    "description": "Task passes when code quality status is PASSED"
  }
  ```
- **Sample Values**:
  - `PENDING` - "Code review in progress" (6 days ago)
  - `IN_REVIEW` - "Code quality check running" (4 days ago)
  - `PASSED` - "All quality gates passed" (2 days ago)
- **Required**: No
- **Order**: 3

### 4. Last Updated (TIMESTAMP)
- **Type**: ISO 8601 timestamp
- **Description**: Timestamp of last update to track freshness
- **Success Criteria**:
  ```json
  {
    "type": "timestamp_comparison",
    "mode": "within_days",
    "referenceTime": "now",
    "withinDays": 7,
    "description": "Task data is fresh when updated within 7 days"
  }
  ```
- **Sample Values**:
  - Task-specific timestamps (6 days ago)
  - Task-specific timestamps (4 days ago)
  - Current timestamp (now)
- **Required**: No
- **Order**: 4

### 5. Composite Health Check (BOOLEAN)
- **Type**: Boolean with complex criteria
- **Description**: Combines multiple conditions for overall health
- **Success Criteria**:
  ```json
  {
    "type": "composite_and",
    "description": "All health conditions must pass",
    "criteria": [
      {
        "type": "boolean_flag",
        "expectedValue": true
      },
      {
        "type": "composite_or",
        "criteria": [
          {
            "type": "string_match",
            "mode": "contains",
            "pattern": "healthy",
            "caseSensitive": false
          },
          {
            "type": "string_match",
            "mode": "exact",
            "pattern": "operational",
            "caseSensitive": false
          }
        ]
      }
    ]
  }
  ```
- **Sample Values**:
  - `true/false` - "All health checks passing" (6 days ago)
  - `false` - "Some health checks failing" (4 days ago)
  - `true` - "Systems operational" (2 days ago)
- **Required**: No
- **Order**: 5

## Historical Value Pattern

Each attribute has 3 historical values with deterministic timestamps:
- **Value 1**: 6 days ago (oldest)
- **Value 2**: 4 days ago (middle)
- **Value 3**: 2 days ago (most recent)

This provides a realistic progression of values over time.

## Batch Organization

Telemetry values are organized into batches:
- **Batch ID Format**: `batch_{taskId}_{attributeName}`
- **Batch Contents**: First 2 values are in a batch, 3rd value is individual
- **Purpose**: Demonstrates bulk telemetry updates vs individual updates

### Example Batch ID
```
batch_xe0559_deployment_status
```

## Data Variation

Values vary by task to provide diverse sample data:

### Deployment Status
- Even-indexed tasks: Start with `false`, end with `true`
- Odd-indexed tasks: Progress varies

### Performance Score
- Task 0: 72 → 85 → 88
- Task 1: 75 → 90 → 95
- Task 2: 78 → 87 → 92
- Pattern continues with variation

### Code Quality
- All tasks: PENDING → IN_REVIEW → PASSED

### Composite Health Check
- Even-indexed tasks: true → false → true
- Odd-indexed tasks: false → false → true

## Database Schema

### TelemetryAttribute Table
```sql
CREATE TABLE "TelemetryAttribute" (
  id              TEXT PRIMARY KEY,
  taskId          TEXT NOT NULL REFERENCES "Task"(id),
  name            TEXT NOT NULL,
  description     TEXT,
  dataType        "TelemetryDataType" NOT NULL,
  isRequired      BOOLEAN NOT NULL DEFAULT false,
  successCriteria JSONB NOT NULL,
  order           INTEGER NOT NULL DEFAULT 0,
  isActive        BOOLEAN NOT NULL DEFAULT true,
  createdAt       TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### TelemetryValue Table
```sql
CREATE TABLE "TelemetryValue" (
  id           TEXT PRIMARY KEY,
  attributeId  TEXT NOT NULL REFERENCES "TelemetryAttribute"(id),
  value        TEXT NOT NULL,
  notes        TEXT,
  batchId      TEXT,
  createdAt    TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Querying Telemetry Data

### Get All Attributes for a Task
```sql
SELECT ta.name, ta.dataType, ta.isRequired, ta.successCriteria
FROM "TelemetryAttribute" ta
JOIN "Task" t ON ta."taskId" = t.id
WHERE t.name = 'Build Cloud POS System'
ORDER BY ta."order";
```

### Get Latest Values for Each Attribute
```sql
SELECT 
  ta.name AS attribute_name,
  tv.value AS latest_value,
  tv.notes,
  tv."createdAt"
FROM "TelemetryAttribute" ta
JOIN "TelemetryValue" tv ON ta.id = tv."attributeId"
WHERE ta."taskId" = (SELECT id FROM "Task" WHERE name = 'Build Cloud POS System' LIMIT 1)
  AND tv."createdAt" = (
    SELECT MAX("createdAt") 
    FROM "TelemetryValue" 
    WHERE "attributeId" = ta.id
  )
ORDER BY ta."order";
```

### Get Historical Values for an Attribute
```sql
SELECT 
  tv.value,
  tv.notes,
  tv."batchId",
  tv."createdAt"
FROM "TelemetryValue" tv
JOIN "TelemetryAttribute" ta ON tv."attributeId" = ta.id
WHERE ta."taskId" = (SELECT id FROM "Task" WHERE name = 'Build Cloud POS System' LIMIT 1)
  AND ta.name = 'Performance Score'
ORDER BY tv."createdAt" DESC;
```

## GraphQL Queries

### Get Task with Telemetry
```graphql
query GetTaskTelemetry {
  tasks(productId: "retail-app-001") {
    edges {
      node {
        id
        name
        telemetryAttributes {
          id
          name
          dataType
          isRequired
          successCriteria
          values {
            id
            value
            notes
            createdAt
          }
        }
        isCompleteBasedOnTelemetry
        telemetryCompletionPercentage
      }
    }
  }
}
```

## Success Criteria Types

The telemetry system supports multiple success criteria types:

1. **boolean_flag**: Simple true/false check
2. **number_threshold**: Numeric comparisons (>, >=, <, <=, ==)
3. **string_match**: String matching (exact, contains, regex)
4. **timestamp_comparison**: Time-based checks (within_days, before, after)
5. **composite_and**: All conditions must pass
6. **composite_or**: At least one condition must pass

## Use Cases

### 1. Task Completion Tracking
Monitor which tasks are actually deployed and operational based on telemetry data.

### 2. Performance Monitoring
Track performance scores over time to identify trends and issues.

### 3. Quality Assurance
Ensure code quality gates are passed before considering tasks complete.

### 4. Data Freshness
Verify that task data is being updated regularly.

### 5. Health Monitoring
Comprehensive health checks combining multiple criteria.

## Benefits

### 1. Realistic Demo Data
- Shows how telemetry works with actual values
- Demonstrates historical tracking
- Illustrates different data types

### 2. Testing Support
- Validates telemetry attribute creation
- Tests different success criteria types
- Verifies batch operations

### 3. Documentation
- Provides examples of telemetry usage
- Shows best practices for criteria definition
- Demonstrates data patterns

### 4. Development
- Enables frontend telemetry UI development
- Supports API testing
- Facilitates integration testing

## Files Modified

### backend/src/seed.ts
**Changes**:
1. Updated telemetry task query to include ALL sample product tasks (previously limited to 10)
2. Added explicit filter for sample product IDs only
3. Added comprehensive completion message with statistics
4. Added ordering by productId and sequenceNumber

**Before**:
```typescript
const allTasks = await prisma.task.findMany({ 
  where: { deletedAt: null },
  take: 10 // Only first 10 tasks
});
```

**After**:
```typescript
const sampleProductIds = [
  'retail-app-001',
  'financial-app-001', 
  'it-app-001',
  'ai-app-001',
  'networking-app-001'
];

const allTasks = await prisma.task.findMany({ 
  where: { 
    deletedAt: null,
    productId: { in: sampleProductIds }
  },
  orderBy: [
    { productId: 'asc' },
    { sequenceNumber: 'asc' }
  ]
});
```

## Verification

### Check Telemetry Coverage
```bash
docker exec dap_db_1 psql -U postgres -d dap -c "
  SELECT 
    p.name AS product,
    COUNT(DISTINCT t.id) AS tasks,
    COUNT(DISTINCT ta.id) AS telemetry_attrs,
    COUNT(tv.id) AS telemetry_values
  FROM \"Product\" p
  JOIN \"Task\" t ON p.id = t.\"productId\"
  LEFT JOIN \"TelemetryAttribute\" ta ON t.id = ta.\"taskId\"
  LEFT JOIN \"TelemetryValue\" tv ON ta.id = tv.\"attributeId\"
  WHERE p.id IN ('retail-app-001', 'financial-app-001', 'it-app-001', 'ai-app-001', 'networking-app-001')
    AND t.\"deletedAt\" IS NULL
  GROUP BY p.name
  ORDER BY p.name;
"
```

**Expected Output**:
```
         product          | tasks | telemetry_attrs | telemetry_values 
--------------------------+-------+-----------------+------------------
 AI-Powered Analytics App |     6 |              30 |               90
 Financial Services App   |    14 |              70 |              210
 IT Operations App        |     6 |              30 |               90
 Network Management App   |     6 |              30 |               90
 Retail Management App    |    15 |              75 |              225
```

### Add Sample Data with Telemetry
```bash
./dap add-sample
```

This will:
1. Add all 5 sample products
2. Create all tasks
3. Generate telemetry attributes for each task
4. Populate historical values

## Related Documentation

- [TELEMETRY_SYSTEM_DOCUMENTATION.md](./TELEMETRY_SYSTEM_DOCUMENTATION.md) - Complete telemetry system guide
- [SAMPLE_DATA_UPDATE.md](./SAMPLE_DATA_UPDATE.md) - Enterprise application sample data
- [SAMPLE_DATA_FIX.md](./SAMPLE_DATA_FIX.md) - Non-destructive sample data approach

## Status: ✅ COMPLETE

- ✅ All 47 sample tasks have telemetry attributes
- ✅ 235 telemetry attributes created
- ✅ 705 historical telemetry values generated
- ✅ Diverse data types demonstrated (BOOLEAN, NUMBER, STRING, TIMESTAMP)
- ✅ Complex success criteria examples included
- ✅ Batch organization implemented
- ✅ Historical progression realistic

**Sample data now includes comprehensive telemetry for all enterprise application tasks!** 🎉
