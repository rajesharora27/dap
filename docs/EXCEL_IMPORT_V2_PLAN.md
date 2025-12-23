# Excel Import/Export V2 - Implementation Plan

## 📋 Executive Summary

Create a robust, error-proof "v2" Excel Import system using a **Two-Phase Import Workflow** (Dry Run + Commit) with strict Zod validation, atomic Prisma transactions, and a polished frontend UI with validation preview.

---

## 🔍 Current State Analysis

### Existing Implementation (v1)

**Backend Files:**
- `backend/src/services/excel/ExcelImportService.ts` (~1487 lines)
- `backend/src/services/excel/ExcelExportService.ts` (~648 lines)

**Frontend Files:**
- `frontend/src/features/products/hooks/useProductImportExport.ts` (~101 lines)
- `frontend/src/utils/productImport.ts` (~82 lines)

**Current Weaknesses:**
1. No dry-run/preview before actual write
2. Validation errors discovered during import (data may be partially written)
3. No atomic transactions - partial failures leave inconsistent state
4. Validation logic scattered throughout parsing code
5. No user-facing preview of what will change
6. Single API call does both validation and import

---

## 🎯 V2 Architecture Goals

### Core Principles
1. **Two-Phase Workflow**: Validate first, commit second
2. **Zod-First Validation**: Centralized, strict schema validation
3. **Atomic Transactions**: All-or-nothing commits with Prisma `$transaction`
4. **Rich Preview UI**: Show exactly what will change before committing
5. **Backwards Compatible**: V1 remains functional until V2 is proven

### Enhanced Features (New)
6. **Session Caching**: Cache validated data server-side to avoid re-parsing on commit
7. **Diff View**: For updates, show exactly which fields are changing (old → new)
8. **Entity-Agnostic Design**: Support both Products AND Solutions with shared architecture
9. **Progress Streaming**: Real-time progress updates for large file imports (500+ rows)
10. **Export V2 Alignment**: Export format matches exactly what Import V2 expects (round-trip fidelity)

---

## 📂 File Structure

```
backend/src/
├── services/
│   └── excel-v2/
│       ├── index.ts                    # Barrel export
│       ├── schemas/                    # Zod schemas
│       │   ├── index.ts
│       │   ├── common.schema.ts        # Shared schemas (task, license, etc.)
│       │   ├── product.schema.ts       # Product-specific
│       │   ├── solution.schema.ts      # Solution-specific (NEW)
│       │   ├── task.schema.ts
│       │   ├── license.schema.ts
│       │   ├── outcome.schema.ts
│       │   ├── release.schema.ts
│       │   ├── tag.schema.ts
│       │   ├── telemetry.schema.ts
│       │   └── customAttribute.schema.ts
│       ├── parsers/                    # Excel sheet parsers
│       │   ├── index.ts
│       │   ├── workbook.parser.ts      # Main orchestrator
│       │   ├── base.parser.ts          # Shared parsing logic (NEW)
│       │   ├── product.parser.ts
│       │   ├── solution.parser.ts      # (NEW)
│       │   ├── task.parser.ts
│       │   └── ... (other sheet parsers)
│       ├── validators/                 # Business logic validators
│       │   ├── index.ts
│       │   ├── base.validator.ts       # Shared validation (NEW)
│       │   ├── product.validator.ts
│       │   ├── solution.validator.ts   # (NEW)
│       │   ├── task.validator.ts
│       │   └── relationship.validator.ts
│       ├── executors/                  # Database write logic
│       │   ├── index.ts
│       │   ├── transaction.executor.ts
│       │   ├── product.writer.ts
│       │   ├── solution.writer.ts      # (NEW)
│       │   └── entity.writers.ts
│       ├── cache/                      # Session caching (NEW)
│       │   ├── index.ts
│       │   ├── importSessionCache.ts   # In-memory cache with TTL
│       │   └── types.ts
│       ├── diff/                       # Diff utilities (NEW)
│       │   ├── index.ts
│       │   └── fieldDiff.ts            # Generate field-level diffs
│       ├── export/                     # Export V2 (NEW)
│       │   ├── index.ts
│       │   ├── ExcelExportServiceV2.ts
│       │   └── templates/              # Export templates
│       ├── types.ts                    # Shared TypeScript types
│       └── __tests__/
│           ├── schemas.test.ts
│           ├── parsers.test.ts
│           ├── validators.test.ts
│           ├── cache.test.ts           # (NEW)
│           ├── diff.test.ts            # (NEW)
│           └── transaction.test.ts
│
├── schema/resolvers/
│   └── importV2.ts                     # GraphQL resolvers

frontend/src/
├── features/
│   └── import-v2/
│       ├── components/
│       │   ├── BulkImportDialog.tsx    # Main dialog component
│       │   ├── FileUploader.tsx        # Drag & drop file upload
│       │   ├── ValidationReport.tsx    # Error/warning display
│       │   ├── ChangePreview.tsx       # Show what will change
│       │   ├── DiffView.tsx            # Field-level diff display (NEW)
│       │   ├── ImportProgress.tsx      # Progress indicator with streaming
│       │   └── EntityTypeSelector.tsx  # Product or Solution selector (NEW)
│       ├── hooks/
│       │   ├── useImportV2.ts          # State management
│       │   └── useImportProgress.ts    # SSE/subscription progress (NEW)
│       ├── graphql/
│       │   ├── mutations.ts            # V2 mutations
│       │   └── subscriptions.ts        # Progress subscriptions (NEW)
│       └── types.ts
```

---

## 📊 Phase 1: Dry Run (Validation Only)

### Backend: `parseAndValidateFile()`

**Input:** Base64-encoded Excel file content

**Process:**
1. Decode and parse Excel workbook using `exceljs`
2. Parse each sheet into raw row data
3. Validate each row against Zod schemas
4. Check business logic rules:
   - Product name uniqueness
   - Task weight ranges (0-100)
   - License level enum values
   - Foreign key references (outcomes, releases, tags)
5. Determine operation type for each row:
   - `CREATE` - No ID, no matching name
   - `UPDATE` - ID provided OR name matches existing
   - `DELETE` - (optional) Row marked for deletion

**Output: `DryRunResult`**
```typescript
interface DryRunResult {
  isValid: boolean;
  productSummary: {
    name: string;
    action: 'create' | 'update';
    existingId?: string;
  };
  records: {
    tasks: RecordPreview[];
    outcomes: RecordPreview[];
    releases: RecordPreview[];
    licenses: RecordPreview[];
    tags: RecordPreview[];
    customAttributes: RecordPreview[];
    telemetryAttributes: RecordPreview[];
  };
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalRecords: number;
    toCreate: number;
    toUpdate: number;
    toDelete: number;
    errorCount: number;
    warningCount: number;
  };
}

interface RecordPreview {
  rowNumber: number;
  action: 'create' | 'update' | 'delete' | 'skip';
  data: Record<string, any>;
  existingData?: Record<string, any>;  // For updates
  changes?: string[];                   // What fields changed
}

interface ValidationError {
  sheet: string;
  row: number;
  column: string;
  field: string;
  value: any;
  message: string;
  code: string;
}

interface ValidationWarning {
  sheet: string;
  row: number;
  column?: string;
  message: string;
  code: string;
}
```

---

## 📊 Phase 2: Commit (Execution)

### Backend: `executeImport()`

**Input:** Validated data from dry run + user confirmation

**Process:**
1. Wrap entire import in `prisma.$transaction(async (tx) => { ... })`
2. Execute in dependency order:
   - Product (create/update)
   - Licenses
   - Outcomes
   - Releases
   - Tags
   - Tasks (with references to licenses, outcomes, releases)
   - Task-Outcome associations
   - Task-Release associations
   - Task-Tag associations
   - Custom Attributes
   - Telemetry Attributes
3. If ANY step fails → entire transaction rolls back

**Output: `ImportResult`**
```typescript
interface ImportResult {
  success: boolean;
  productId: string;
  productName: string;
  stats: {
    tasksCreated: number;
    tasksUpdated: number;
    outcomesCreated: number;
    outcomesUpdated: number;
    // ... other entities
  };
  errors: ValidationError[];  // Should be empty if successful
  duration: number;           // Time taken in ms
}
```

---

## 🔄 Enhanced Feature: Session Caching

### Problem
Parsing Excel files is expensive. Without caching, we parse the file twice:
1. On dry run (validation)
2. On commit (execution)

### Solution: Server-Side Session Cache

```typescript
// backend/src/services/excel-v2/cache/importSessionCache.ts

interface CachedImportSession {
  id: string;
  entityType: 'product' | 'solution';
  parsedData: ParsedWorkbook;
  dryRunResult: DryRunResult;
  createdAt: Date;
  expiresAt: Date;
}

class ImportSessionCache {
  private cache: Map<string, CachedImportSession> = new Map();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Store validated data after dry run
  async store(data: ParsedWorkbook, result: DryRunResult): Promise<string> {
    const sessionId = crypto.randomUUID();
    this.cache.set(sessionId, {
      id: sessionId,
      entityType: data.entityType,
      parsedData: data,
      dryRunResult: result,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.TTL_MS),
    });
    return sessionId;
  }

  // Retrieve on execute - no re-parsing needed
  get(sessionId: string): CachedImportSession | null {
    const session = this.cache.get(sessionId);
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      this.cache.delete(sessionId);
      return null;
    }
    return session;
  }

  // Cleanup expired sessions (run periodically)
  cleanup(): void {
    const now = new Date();
    for (const [id, session] of this.cache) {
      if (session.expiresAt < now) {
        this.cache.delete(id);
      }
    }
  }
}

export const importSessionCache = new ImportSessionCache();
```

### API Flow
```
1. Frontend: Upload file → POST /import/dry-run
2. Backend: Parse, validate, cache → Return { sessionId, dryRunResult }
3. Frontend: User reviews preview
4. Frontend: Confirm → POST /import/execute { sessionId, confirmWarnings }
5. Backend: Retrieve from cache, execute transaction
```

---

## 📝 Enhanced Feature: Diff View for Updates

### Problem
When updating existing records, users can't see what's actually changing.

### Solution: Field-Level Diff Generation

```typescript
// backend/src/services/excel-v2/diff/fieldDiff.ts

interface FieldDiff {
  field: string;
  oldValue: any;
  newValue: any;
  displayOld: string;  // Human-readable
  displayNew: string;
}

interface RecordDiff {
  rowNumber: number;
  entityType: 'task' | 'license' | 'outcome' | etc;
  entityName: string;
  action: 'update';
  changes: FieldDiff[];
}

function generateDiff(existing: Record<string, any>, incoming: Record<string, any>): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const fieldsToCompare = ['name', 'description', 'weight', 'estMinutes', 'licenseLevel', 'notes'];

  for (const field of fieldsToCompare) {
    const oldVal = existing[field];
    const newVal = incoming[field];
    
    if (!isEqual(oldVal, newVal)) {
      diffs.push({
        field,
        oldValue: oldVal,
        newValue: newVal,
        displayOld: formatForDisplay(oldVal),
        displayNew: formatForDisplay(newVal),
      });
    }
  }
  return diffs;
}
```

### Frontend: DiffView Component
```tsx
// Renders inline diff like GitHub
<DiffView changes={record.changes}>
  {/* Output:
    Task "Setup SSO" - UPDATE
      • weight: 50 → 75
      • licenseLevel: Essential → Advantage
      • description: "Old desc..." → "New desc..."
  */}
</DiffView>
```

---

## 🔀 Enhanced Feature: Product & Solution Support

### Problem
V1 focuses on Products. Solutions share 90% of the same structure but need separate handling.

### Solution: Entity-Agnostic Architecture

```typescript
// Shared base types
type EntityType = 'product' | 'solution';

interface ImportContext {
  entityType: EntityType;
  entityId?: string;      // For updates
  entityName: string;
}

// Shared schemas with entity-specific extensions
const BaseEntitySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
});

const ProductSchema = BaseEntitySchema.extend({
  // Product-specific fields (none currently)
});

const SolutionSchema = BaseEntitySchema.extend({
  // Solution-specific: linked products
  linkedProducts: z.array(z.string()).optional(), // Product names
});
```

### Shared Parsers with Inheritance
```typescript
abstract class BaseWorkbookParser {
  abstract getEntityType(): EntityType;
  
  // Shared parsing logic
  parseTasksSheet(worksheet: ExcelJS.Worksheet): TaskRow[] { ... }
  parseLicensesSheet(worksheet: ExcelJS.Worksheet): LicenseRow[] { ... }
  // ...

  // Template method - subclasses implement
  abstract parseEntitySheet(worksheet: ExcelJS.Worksheet): EntityRow;
}

class ProductParser extends BaseWorkbookParser {
  getEntityType() { return 'product'; }
  parseEntitySheet(ws) { return parseProductInfoSheet(ws); }
}

class SolutionParser extends BaseWorkbookParser {
  getEntityType() { return 'solution'; }
  parseEntitySheet(ws) { return parseSolutionInfoSheet(ws); }
}
```

### Frontend: Entity Type Selector
```tsx
<EntityTypeSelector
  value={entityType}
  onChange={setEntityType}
  options={[
    { value: 'product', label: 'Product' },
    { value: 'solution', label: 'Solution' },
  ]}
/>
```

---

## 📡 Enhanced Feature: Progress Streaming

### Problem
Large imports (500+ rows) can take 10-30 seconds. Users see nothing during this time.

### Solution: Server-Sent Events (SSE) for Real-Time Progress

```typescript
// backend/src/services/excel-v2/executors/progressEmitter.ts

interface ImportProgress {
  sessionId: string;
  phase: 'parsing' | 'validating' | 'writing' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
  percentage: number;
}

class ProgressEmitter extends EventEmitter {
  emit(sessionId: string, progress: ImportProgress) {
    super.emit(sessionId, progress);
  }
}

export const progressEmitter = new ProgressEmitter();
```

### Backend: SSE Endpoint
```typescript
// In Express router
app.get('/api/import/progress/:sessionId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const handler = (progress: ImportProgress) => {
    res.write(`data: ${JSON.stringify(progress)}\n\n`);
    if (progress.phase === 'complete' || progress.phase === 'error') {
      res.end();
    }
  };

  progressEmitter.on(req.params.sessionId, handler);

  req.on('close', () => {
    progressEmitter.off(req.params.sessionId, handler);
  });
});
```

### Frontend: useImportProgress Hook
```typescript
function useImportProgress(sessionId: string | null) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    
    const eventSource = new EventSource(`/api/import/progress/${sessionId}`);
    
    eventSource.onmessage = (event) => {
      setProgress(JSON.parse(event.data));
    };

    return () => eventSource.close();
  }, [sessionId]);

  return progress;
}
```

### Frontend: Progress UI
```tsx
<ImportProgress progress={progress}>
  {/* Output:
    ████████████░░░░░░░░ 60%
    Writing tasks... (30 of 50)
  */}
</ImportProgress>
```

---

## 📤 Enhanced Feature: Export V2 Alignment

### Problem
Export and Import may produce/expect different formats, breaking round-trip workflows.

### Solution: Single Source of Truth for Format

```typescript
// Shared column definitions used by BOTH import and export
const TASK_COLUMNS = [
  { key: 'id', header: 'ID', width: 40 },
  { key: 'name', header: 'Task Name', width: 40, required: true },
  { key: 'description', header: 'Description', width: 60 },
  { key: 'weight', header: 'Weight', width: 10, type: 'number' },
  { key: 'sequenceNumber', header: 'Sequence', width: 10, type: 'number' },
  { key: 'estMinutes', header: 'Est. Minutes', width: 15, type: 'number' },
  { key: 'licenseLevel', header: 'License Level', width: 15, enum: ['Essential', 'Advantage', 'Signature'] },
  { key: 'notes', header: 'Notes', width: 60 },
  { key: 'howToDoc', header: 'How To Doc', width: 40, array: true },
  { key: 'howToVideo', header: 'How To Video', width: 40, array: true },
  { key: 'outcomes', header: 'Outcomes', width: 30, array: true },
  { key: 'releases', header: 'Releases', width: 30, array: true },
  { key: 'tags', header: 'Tags', width: 30, array: true },
] as const;

// Export uses these columns
class ExcelExportServiceV2 {
  createTasksSheet(workbook: ExcelJS.Workbook, tasks: Task[]) {
    const sheet = workbook.addWorksheet('Tasks');
    sheet.columns = TASK_COLUMNS.map(c => ({ header: c.header, key: c.key, width: c.width }));
    // ... add rows
  }
}

// Import parses using same column mappings
class TaskParser {
  parse(worksheet: ExcelJS.Worksheet): TaskRow[] {
    return worksheet.getSheetValues().map(row => ({
      id: row[columnIndex('id')],
      name: row[columnIndex('name')],
      // ... same columns
    }));
  }
}
```

### Round-Trip Test
```typescript
it('should import what it exports with no data loss', async () => {
  // Export a product
  const exported = await ExportServiceV2.exportProduct('Test Product');
  
  // Import the same file
  const imported = await ImportServiceV2.dryRun(exported.buffer);
  
  // All records should be "no change" updates
  expect(imported.records.tasks.every(t => t.action === 'skip' || t.changes.length === 0)).toBe(true);
});
```

## 🎨 Frontend: BulkImportDialog

### UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Import Product Data                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📁 Drag & drop Excel file here                     │   │
│  │     or click to browse                              │   │
│  │     (.xlsx, .xls)                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ── After file selected ──                                 │
│                                                             │
│  📊 Validation Report                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Sheet     │ Row │ Status │ Details                  │   │
│  ├───────────┼─────┼────────┼──────────────────────────│   │
│  │ Tasks     │ 2   │ ✅     │ Create: "Setup SSO"      │   │
│  │ Tasks     │ 3   │ ✅     │ Update: "Configure MFA"  │   │
│  │ Tasks     │ 5   │ ❌     │ Weight must be 0-100    │   │
│  │ Tasks     │ 7   │ ⚠️     │ Outcome "XYZ" not found  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Summary: 5 new, 3 updates, 2 errors, 1 warning            │
│                                                             │
│  ☐ I understand there are warnings/errors                  │
│                                                             │
│  [Cancel]                              [Import] (disabled)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component States

1. **Initial**: File upload area visible
2. **Validating**: Spinner with "Validating file..."
3. **Preview**: Show validation results
   - Errors in red (blocks import)
   - Warnings in amber (requires checkbox confirmation)
   - Valid rows in green
4. **Importing**: Progress bar with "Importing..."
5. **Complete**: Success message with stats
6. **Error**: Error message with retry option

---

## 🗃️ Zod Schema Examples

### `task.schema.ts`
```typescript
import { z } from 'zod';

export const LicenseLevelEnum = z.enum(['Essential', 'Advantage', 'Signature']);

export const TaskRowSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Task name is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  weight: z.number()
    .min(0, 'Weight must be >= 0')
    .max(100, 'Weight must be <= 100'),
  sequenceNumber: z.number().int().positive().optional().default(1),
  estMinutes: z.number().int().nonnegative().optional().default(60),
  licenseLevel: LicenseLevelEnum.default('Essential'),
  notes: z.string().max(5000).optional().nullable(),
  howToDoc: z.array(z.string().url()).optional().default([]),
  howToVideo: z.array(z.string().url()).optional().default([]),
  outcomes: z.array(z.string()).optional().default([]),  // Outcome names
  releases: z.array(z.string()).optional().default([]),  // Release names
  tags: z.array(z.string()).optional().default([]),      // Tag names
});

export type TaskRow = z.infer<typeof TaskRowSchema>;
```

### `product.schema.ts`
```typescript
import { z } from 'zod';

export const ProductRowSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  // Custom attributes handled separately
});

export type ProductRow = z.infer<typeof ProductRowSchema>;
```

---

## 🧪 Test Cases

### Unit Tests (Jest/Vitest)

```typescript
describe('ExcelImportV2', () => {
  describe('Zod Schema Validation', () => {
    it('should reject task with weight > 100', () => { ... });
    it('should reject task with empty name', () => { ... });
    it('should accept valid task data', () => { ... });
    it('should handle optional fields correctly', () => { ... });
  });

  describe('Dry Run', () => {
    it('should identify duplicate products by name', () => { ... });
    it('should return CREATE action for new tasks', () => { ... });
    it('should return UPDATE action for tasks with matching ID', () => { ... });
    it('should return UPDATE action for tasks with matching name', () => { ... });
    it('should report row/column for validation errors', () => { ... });
  });

  describe('Transaction Rollback', () => {
    it('should rollback entire transaction if task validation fails', async () => {
      // Arrange: Product creates successfully, one task has invalid data
      // Act: Execute import
      // Assert: Product should NOT exist in database
    });
    
    it('should rollback if foreign key reference fails', async () => {
      // Task references non-existent outcome
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Excel file', () => { ... });
    it('should handle missing required columns', () => { ... });
    it('should handle case-insensitive sheet names', () => { ... });
    it('should handle whitespace in cell values', () => { ... });
  });
});
```

---

## 📈 GraphQL Schema

```graphql
# Types
type DryRunResult {
  isValid: Boolean!
  productSummary: ProductSummary!
  records: RecordSummaryByType!
  errors: [ValidationError!]!
  warnings: [ValidationWarning!]!
  summary: ImportSummary!
}

type ProductSummary {
  name: String!
  action: String!  # 'create' | 'update'
  existingId: ID
}

type RecordSummaryByType {
  tasks: [RecordPreview!]!
  outcomes: [RecordPreview!]!
  releases: [RecordPreview!]!
  licenses: [RecordPreview!]!
  tags: [RecordPreview!]!
  customAttributes: [RecordPreview!]!
  telemetryAttributes: [RecordPreview!]!
}

type RecordPreview {
  rowNumber: Int!
  action: String!
  data: JSON!
  existingData: JSON
  changes: [String!]
}

type ValidationError {
  sheet: String!
  row: Int!
  column: String!
  field: String!
  value: JSON
  message: String!
  code: String!
}

type ValidationWarning {
  sheet: String!
  row: Int!
  column: String
  message: String!
  code: String!
}

type ImportSummary {
  totalRecords: Int!
  toCreate: Int!
  toUpdate: Int!
  toDelete: Int!
  errorCount: Int!
  warningCount: Int!
}

type ImportV2Result {
  success: Boolean!
  productId: ID
  productName: String!
  stats: ImportStats!
  errors: [ValidationError!]!
  duration: Int!
}

type ImportStats {
  tasksCreated: Int!
  tasksUpdated: Int!
  outcomesCreated: Int!
  outcomesUpdated: Int!
  releasesCreated: Int!
  releasesUpdated: Int!
  licensesCreated: Int!
  licensesUpdated: Int!
  tagsCreated: Int!
  tagsUpdated: Int!
  customAttributesCreated: Int!
  customAttributesUpdated: Int!
  telemetryAttributesCreated: Int!
  telemetryAttributesUpdated: Int!
}

# Mutations
extend type Mutation {
  # Phase 1: Dry Run
  importProductDryRun(content: String!): DryRunResult!
  
  # Phase 2: Execute Import
  importProductExecute(
    content: String!
    confirmWarnings: Boolean!
  ): ImportV2Result!
}
```

---

## 🔧 Implementation Order

### Phase 1: Foundation (Backend) - 2 hours
- [ ] Create folder structure
- [ ] Define TypeScript types (`types.ts`)
- [ ] Create Zod schemas for all entities (Product, Solution, Task, etc.)
- [ ] Create shared column definitions for export/import alignment
- [ ] Unit tests for schemas

### Phase 2: Parsing (Backend) - 3 hours
- [ ] Implement base workbook parser (shared logic)
- [ ] Implement ProductParser and SolutionParser (inheritance)
- [ ] Implement sheet parsers (row → typed objects)
- [ ] Handle edge cases (empty cells, whitespace, case)
- [ ] Unit tests for parsers

### Phase 3: Validation + Diff (Backend) - 4 hours
- [ ] Business logic validators (duplicate detection, references)
- [ ] Field-level diff generation for updates
- [ ] Combine schema + business validation
- [ ] Generate rich error/warning objects with diffs
- [ ] Unit tests for validators and diff

### Phase 4: Session Cache (Backend) - 2 hours
- [ ] Implement ImportSessionCache with TTL
- [ ] Add periodic cleanup job
- [ ] Unit tests for cache expiry

### Phase 5: Dry Run API (Backend + Frontend) - 4 hours
- [ ] GraphQL resolver: `importProductDryRun` / `importSolutionDryRun`
- [ ] Return sessionId for cached data
- [ ] Frontend: Entity type selector (Product/Solution)
- [ ] Frontend: File upload component
- [ ] Frontend: Validation report with diff view
- [ ] Integration test

### Phase 6: Execution + Progress (Backend) - 5 hours
- [ ] Transaction executor with Prisma `$transaction`
- [ ] Product/Solution writers with shared base
- [ ] Progress emitter with SSE endpoint
- [ ] Rollback testing
- [ ] Unit + integration tests

### Phase 7: Execute API (Backend + Frontend) - 4 hours
- [ ] GraphQL resolver: `importProductExecute` / `importSolutionExecute`
- [ ] Use sessionId to retrieve cached data
- [ ] Frontend: Confirmation checkbox + buttons
- [ ] Frontend: Progress streaming with useImportProgress hook
- [ ] E2E test

### Phase 8: Export V2 (Backend) - 3 hours
- [ ] ExcelExportServiceV2 using shared column definitions
- [ ] Round-trip test (export → import → no changes)
- [ ] GraphQL resolver: `exportProductV2` / `exportSolutionV2`

### Phase 9: Polish & Deploy - 3 hours
- [ ] Error messages refinement
- [ ] Performance optimization (large files)
- [ ] Documentation
- [ ] Feature flag to enable V2
- [ ] Shadow testing V1 vs V2

---

## ⏱️ Estimated Timeline

| Phase | Duration | Notes |
|-------|----------|-------|
| 1. Foundation | 2 hours | Types, schemas, column definitions |
| 2. Parsing | 3 hours | Base parser + Product/Solution inheritance |
| 3. Validation + Diff | 4 hours | Core new logic + field diffs |
| 4. Session Cache | 2 hours | In-memory cache with TTL |
| 5. Dry Run API | 4 hours | Backend + frontend |
| 6. Execution + Progress | 5 hours | Transactions + SSE streaming |
| 7. Execute API | 4 hours | Frontend streaming + confirmation |
| 8. Export V2 | 3 hours | Round-trip alignment |
| 9. Polish | 3 hours | Testing + docs |

**Total: ~30 hours** (with all enhanced features)

---

## 🚪 Migration Strategy

1. **V2 ships alongside V1** - No breaking changes
2. **Feature flag**: `ENABLE_IMPORT_V2=true`
3. **UI Toggle**: "Try new import (beta)" option
4. **Monitoring**: Log both V1 and V2 usage
5. **Gradual rollout**: Enable for power users first
6. **Deprecate V1**: After 2-4 weeks of stable V2 usage

---

## ✅ Acceptance Criteria

### Core Features
- [ ] Dry run returns accurate preview without DB writes
- [ ] All validation errors include row number and column name
- [ ] Transaction rollback prevents partial data
- [ ] UI shows clear green/yellow/red status for each row
- [ ] Import button disabled until errors are resolved or warnings acknowledged
- [ ] Performance: 1000 rows processed in < 5 seconds
- [ ] All tests passing (unit + integration)

### Session Caching
- [ ] Dry run caches parsed data with sessionId
- [ ] Execute uses cached data (no re-parsing)
- [ ] Session expires after 5 minutes
- [ ] Expired sessions return clear error message

### Diff View
- [ ] Updates show field-level changes (old → new)
- [ ] Unchanged fields are not listed
- [ ] Arrays (outcomes, releases, tags) show added/removed items

### Product & Solution Support
- [ ] Both Products and Solutions can be imported
- [ ] Entity type selector in UI
- [ ] Shared validation logic works for both
- [ ] Solutions can reference existing products

### Progress Streaming
- [ ] Large imports (100+ rows) show real-time progress
- [ ] Progress includes phase, percentage, and current item
- [ ] Frontend updates without page refresh
- [ ] Works even if user navigates away and back

### Export V2 Alignment
- [ ] Exported files can be re-imported with zero changes
- [ ] Column headers match exactly between import/export
- [ ] Round-trip test passes

