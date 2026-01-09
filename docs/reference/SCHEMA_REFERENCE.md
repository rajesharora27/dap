# DAP Database Schema Reference

**Version:** 3.0.0  
**Last Updated:** December 30, 2025  
**Database:** PostgreSQL 16  
**ORM:** Prisma 5.x

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Entities](#core-entities)
4. [User & Authentication](#user--authentication)
5. [Product Domain](#product-domain)
6. [Solution Domain](#solution-domain)
7. [Customer & Adoption](#customer--adoption)
8. [Telemetry System](#telemetry-system)
9. [Tagging System](#tagging-system)
10. [Audit & History](#audit--history)
11. [Indexing Strategy](#indexing-strategy)
12. [Data Types & Enums](#data-types--enums)
13. [Naming Conventions](#naming-conventions)
14. [Migration Guidelines](#migration-guidelines)

---

## Overview

DAP uses a PostgreSQL database with Prisma ORM. The schema is designed for:

- **Flexibility**: Products, Solutions, and Customers can be customized
- **Auditability**: Full change tracking and audit logs
- **Performance**: Strategic indexing for common query patterns
- **Data Integrity**: Foreign keys, unique constraints, and soft deletes

### Statistics

| Metric | Count |
|--------|-------|
| Total Models | 45+ |
| Junction Tables | 15+ |
| Enums | 10 |
| Indexes | 60+ |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER DOMAIN                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  User ──┬── Session ── LockedEntity                                     │
│         ├── UserRole ── Role ── RolePermission                          │
│         ├── Permission                                                  │
│         ├── AuditLog                                                    │
│         └── DiaryTodo / DiaryBookmark                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            PRODUCT DOMAIN                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Product ──┬── Task ──┬── TelemetryAttribute ── TelemetryValue          │
│            │          ├── TaskOutcome ── Outcome                        │
│            │          ├── TaskRelease ── Release                        │
│            │          └── TaskTag ── ProductTag                         │
│            ├── License                                                  │
│            ├── Outcome                                                  │
│            ├── Release                                                  │
│            ├── ProductTag                                               │
│            └── CustomAttribute                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           SOLUTION DOMAIN                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Solution ──┬── SolutionProduct ── Product                              │
│             ├── Task (solution-level)                                   │
│             ├── License                                                 │
│             ├── Outcome                                                 │
│             ├── Release                                                 │
│             ├── SolutionTag                                             │
│             └── SolutionTaskOrder                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER DOMAIN                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Customer ──┬── CustomerProduct ── AdoptionPlan ── CustomerTask         │
│             │                                                           │
│             └── CustomerSolution ── SolutionAdoptionPlan                │
│                                     ├── CustomerSolutionTask            │
│                                     └── SolutionAdoptionProduct         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Entities

### Product

The central entity for product definition and configuration.

```prisma
model Product {
  id               String            @id @default(cuid())
  name             String            @unique
  description      String?
  resources        Json?             // { label: string, url: string }[]
  customAttrs      Json?             // Legacy custom attributes
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  deletedAt        DateTime?         // Soft delete support
  
  // Relations
  tasks            Task[]
  licenses         License[]
  outcomes         Outcome[]
  releases         Release[]
  tags             ProductTag[]
  customAttributes CustomAttribute[]
  customers        CustomerProduct[]
  solutions        SolutionProduct[]
}
```

**Key Points:**
- `name` is unique across all products
- `deletedAt` enables soft delete pattern
- `resources` stores documentation/video links as JSON array
- `customAttrs` is legacy; migrate to `CustomAttribute` model

### Solution

Bundles multiple products into a cohesive offering.

```prisma
model Solution {
  id          String              @id @default(cuid())
  name        String
  description String?
  resources   Json?
  customAttrs Json?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  deletedAt   DateTime?
  
  // Relations
  products    SolutionProduct[]   // Products in this solution
  tasks       Task[]              // Solution-specific tasks
  licenses    License[]
  outcomes    Outcome[]
  releases    Release[]
  tags        SolutionTag[]
  taskOrders  SolutionTaskOrder[] // Task sequencing
  customers   CustomerSolution[]
}
```

### Customer

Represents a customer organization.

```prisma
model Customer {
  id          String             @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  deletedAt   DateTime?
  
  // Relations
  products    CustomerProduct[]  // Assigned products
  solutions   CustomerSolution[] // Assigned solutions
}
```

---

## User & Authentication

### User

Core user entity with authentication and authorization.

```prisma
model User {
  id                 String       @id @default(cuid())
  email              String       @unique
  username           String       @unique
  name               String?
  fullName           String?      @default("")
  role               SystemRole   @default(USER)
  password           String       // bcrypt hashed
  isAdmin            Boolean      @default(false)
  isActive           Boolean      @default(true)
  mustChangePassword Boolean      @default(true)
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @default(now()) @updatedAt
  
  // Relations
  sessions           Session[]
  permissions        Permission[]
  userRoles          UserRole[]
  auditLogs          AuditLog[]
}
```

**Security Notes:**
- `password` is bcrypt hashed (never stored in plain text)
- `mustChangePassword` forces password change on first login
- `isActive` can be used to disable accounts without deletion

### Session & Lock Management

```prisma
model Session {
  id             String         @id @default(cuid())
  userId         String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  expiresAt      DateTime
  
  user           User           @relation(...)
  lockedEntities LockedEntity[] // Entities locked by this session
}

model LockedEntity {
  id         String   @id @default(cuid())
  entityType String   // "Product", "Task", etc.
  entityId   String
  sessionId  String
  createdAt  DateTime @default(now())
  expiresAt  DateTime
  
  @@index([entityType, entityId]) // Fast lock lookup
}
```

---

## Product Domain

### Task

The core unit of work within products or solutions.

```prisma
model Task {
  id                  String           @id @default(cuid())
  productId           String?          // NULL for solution tasks
  solutionId          String?          // NULL for product tasks
  name                String
  description         String?
  estMinutes          Int              // Estimated time
  notes               String?
  weight              Decimal          @db.Decimal(5, 2)
  sequenceNumber      Int
  licenseLevel        LicenseLevel     @default(ESSENTIAL)
  howToDoc            String[]         // Documentation URLs
  howToVideo          String[]         // Video URLs
  rawTelemetryMapping String?
  completedAt         DateTime?
  completedReason     String?
  softDeleteQueued    Boolean          @default(false)
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  deletedAt           DateTime?
  
  // Relations
  telemetryAttributes TelemetryAttribute[]
  outcomes            TaskOutcome[]
  releases            TaskRelease[]
  taskTags            TaskTag[]
  
  @@index([productId, sequenceNumber])  // Fast product task lookup
  @@index([solutionId, sequenceNumber]) // Fast solution task lookup
}
```

**Design Notes:**
- Task belongs to EITHER a Product OR Solution (not both)
- `weight` should sum to 100 within a product (enforced in app layer)
- `sequenceNumber` determines display order

### License, Outcome, Release

```prisma
model License {
  id          String    @id @default(cuid())
  name        String
  description String?
  level       Int       @default(1)  // 1=Essential, 2=Advantage, 3=Signature
  isActive    Boolean   @default(true)
  productId   String?
  solutionId  String?
  displayOrder Int      @default(0)
  
  @@unique([solutionId, productId]) // One license per product in solution
}

model Outcome {
  id           String    @id @default(cuid())
  productId    String?
  solutionId   String?
  name         String
  description  String?
  displayOrder Int       @default(0)
  
  @@unique([productId, name])   // Unique per product
  @@unique([solutionId, name])  // Unique per solution
}

model Release {
  id           String    @id @default(cuid())
  name         String
  description  String?
  level        Float     @default(1.0)  // 1.0, 1.1, 2.0, etc.
  isActive     Boolean   @default(true)
  productId    String?
  solutionId   String?
  displayOrder Int       @default(0)
  
  @@index([productId, level])   // Ordered release lookup
  @@index([solutionId, level])
}
```

---

## Customer & Adoption

### CustomerProduct & AdoptionPlan

```prisma
model CustomerProduct {
  id                String              @id @default(cuid())
  customerId        String
  productId         String
  name              String              // Assignment name (required)
  customerSolutionId String?            // If part of solution
  licenseLevel      LicenseLevel        @default(ESSENTIAL)
  selectedOutcomes  Json?               // Outcome IDs
  selectedReleases  Json?               // Release IDs
  purchasedAt       DateTime            @default(now())
  
  adoptionPlan      AdoptionPlan?       // 1:1 adoption plan
  
  @@index([customerId])
  @@index([productId])
  @@index([customerSolutionId])
}

model AdoptionPlan {
  id                  String              @id @default(cuid())
  customerProductId   String              @unique  // 1:1 with CustomerProduct
  productId           String              // Snapshot reference
  productName         String              // Snapshot
  licenseLevel        LicenseLevel
  
  // Progress tracking
  totalTasks          Int                 @default(0)
  completedTasks      Int                 @default(0)
  totalWeight         Decimal             @db.Decimal(10, 2)
  completedWeight     Decimal             @db.Decimal(10, 2)
  progressPercentage  Decimal             @db.Decimal(5, 2)
  
  lastSyncedAt        DateTime?           // Last sync with product
  
  tasks               CustomerTask[]
  
  @@index([customerProductId])
  @@index([productId])
}
```

### CustomerTask

Customer-specific task with status tracking.

```prisma
model CustomerTask {
  id                    String                    @id @default(cuid())
  adoptionPlanId        String
  originalTaskId        String                    // Reference to product task
  name                  String                    // Snapshot
  description           String?
  weight                Decimal                   @db.Decimal(5, 2)
  sequenceNumber        Int
  licenseLevel          LicenseLevel
  
  // Status tracking
  status                CustomerTaskStatus        @default(NOT_STARTED)
  statusUpdatedAt       DateTime?
  statusUpdatedBy       String?                   // User ID or "telemetry"
  statusUpdateSource    StatusUpdateSource?
  statusNotes           String?
  
  // Completion
  isComplete            Boolean                   @default(false)
  completedAt           DateTime?
  completedBy           String?
  
  @@index([adoptionPlanId])
  @@index([originalTaskId])
  @@index([status])  // Status-based filtering
}
```

---

## Telemetry System

### TelemetryAttribute & TelemetryValue

```prisma
model TelemetryAttribute {
  id              String                @id @default(cuid())
  taskId          String
  name            String                // "login_enabled", "user_count"
  description     String?
  dataType        TelemetryDataType     @default(STRING)
  isRequired      Boolean               @default(false)
  successCriteria Json                  // Flexible criteria (AND/OR)
  order           Int                   @default(0)
  isActive        Boolean               @default(true)
  
  values          TelemetryValue[]
  
  @@unique([taskId, name])  // One attribute per name per task
  @@index([taskId])
}

model TelemetryValue {
  id          String             @id @default(cuid())
  attributeId String
  value       Json               // Actual data
  source      String?            // "manual", "api", "database"
  batchId     String?            // Grouping for imports
  notes       String?
  createdAt   DateTime           @default(now())
  
  @@index([attributeId])
  @@index([batchId])
  @@index([createdAt])  // Time-series queries
}
```

---

## Tagging System

### ProductTag & TaskTag

```prisma
model ProductTag {
  id           String   @id @default(cuid())
  productId    String
  name         String
  description  String?
  color        String?  // Theme color key
  displayOrder Int      @default(0)
  
  taskTags     TaskTag[]
  
  @@unique([productId, name])  // Unique per product
  @@index([productId])
}

model TaskTag {
  id        String     @id @default(cuid())
  taskId    String
  tagId     String
  
  @@unique([taskId, tagId])  // No duplicate assignments
  @@index([taskId])
  @@index([tagId])
}
```

---

## Audit & History

### AuditLog

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  userId       String?
  action       String   // "CREATE", "UPDATE", "DELETE"
  entity       String?  // "Product", "Task", etc.
  entityId     String?
  details      Json?    // Change details
  resourceType String?
  resourceId   String?
  ipAddress    String?
  createdAt    DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])  // Time-based queries
}
```

### ChangeSet & ChangeItem

For detailed change tracking:

```prisma
model ChangeSet {
  id          String       @id @default(cuid())
  userId      String?
  createdAt   DateTime     @default(now())
  committedAt DateTime?
  
  items       ChangeItem[]
}

model ChangeItem {
  id          String    @id @default(cuid())
  changeSetId String
  entityType  String
  entityId    String
  before      Json?     // Previous state
  after       Json?     // New state
  createdAt   DateTime  @default(now())
}
```

---

## Indexing Strategy

### Primary Indexes (Automatic)

- All `@id` fields are automatically indexed
- All `@unique` fields are automatically indexed

### Strategic Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `Task` | `[productId, sequenceNumber]` | Ordered task lists |
| `Task` | `[solutionId, sequenceNumber]` | Solution task ordering |
| `CustomerTask` | `[status]` | Status-based filtering |
| `CustomerTask` | `[originalTaskId]` | Task sync operations |
| `TelemetryValue` | `[createdAt]` | Time-series queries |
| `AuditLog` | `[createdAt]` | Log pagination |
| `LockedEntity` | `[entityType, entityId]` | Fast lock checks |
| `Release` | `[productId, level]` | Ordered release lists |

### Composite Unique Constraints

```prisma
@@unique([productId, name])      // Unique outcomes per product
@@unique([taskId, outcomeId])    // No duplicate task-outcome links
@@unique([customerId, solutionId, name])  // Unique named assignments
```

---

## Data Types & Enums

### System Enums

```prisma
enum SystemRole {
  ADMIN    // Full system access
  USER     // Standard user
  SME      // Subject Matter Expert
  CSS      // Customer Success
  VIEWER   // Read-only access
}

enum LicenseLevel {
  ESSENTIAL   // Level 1 - Basic features
  ADVANTAGE   // Level 2 - Enhanced features
  SIGNATURE   // Level 3 - Premium features
}

enum CustomerTaskStatus {
  NOT_STARTED      // Task not begun
  IN_PROGRESS      // Work in progress
  COMPLETED        // Alias for DONE
  DONE             // Task completed
  NOT_APPLICABLE   // Skipped/not relevant
  NO_LONGER_USING  // Was using, now stopped
}

enum StatusUpdateSource {
  MANUAL      // Updated via GUI
  TELEMETRY   // Auto-updated via telemetry
  IMPORT      // Updated via CSV import
  SYSTEM      // System-generated update
}

enum TelemetryDataType {
  BOOLEAN
  NUMBER
  STRING
  TIMESTAMP
  JSON
}
```

---

## Naming Conventions

### Tables

- **Singular nouns**: `Product`, `Task`, `Customer`
- **PascalCase**: `CustomerProduct`, `TelemetryAttribute`
- **Junction tables**: `{Entity1}{Entity2}` (e.g., `TaskOutcome`)

### Columns

- **camelCase**: `createdAt`, `productId`, `sequenceNumber`
- **Boolean prefixes**: `is*`, `has*` (e.g., `isActive`, `isComplete`)
- **Timestamp suffixes**: `*At` (e.g., `updatedAt`, `completedAt`)
- **User references**: `*By` (e.g., `completedBy`, `statusUpdatedBy`)

### Indexes

- Composite indexes for common query patterns
- Include columns in order of selectivity

---

## Migration Guidelines

### Creating Migrations

```bash
cd backend

# Create a new migration
npx prisma migrate dev --name add_new_field

# Apply migrations (production)
npx prisma migrate deploy

# Regenerate Prisma client
npx prisma generate
```

### Safe Migration Practices

1. **Additive Changes**: Prefer adding new optional columns
2. **Non-Breaking**: New columns should have defaults
3. **Data Migration**: Use separate scripts for data transformation
4. **Backups**: Always backup before migration

### Example: Adding a Column

```prisma
model Product {
  // ... existing fields
  
  // New optional field with default
  priority Int @default(0)  // SAFE: Has default value
  
  // New optional field
  category String?          // SAFE: Nullable
}
```

### Dangerous Operations (Require Care)

```prisma
// DANGEROUS: Removing columns
// 1. First deprecate in code
// 2. Run data backup
// 3. Remove in separate migration

// DANGEROUS: Renaming columns
// Use @map for backwards compatibility
model Product {
  displayName String @map("name")  // Rename in DB only
}
```

---

## Performance Considerations

### Query Optimization

1. **Use includes sparingly**: Only include needed relations
2. **Pagination**: Always use `take` and `skip` for lists
3. **DataLoader**: Batch queries in GraphQL resolvers
4. **Indexes**: Check query plans for slow queries

### Connection Pooling

Prisma uses connection pooling by default. Configure in `DATABASE_URL`:

```
postgresql://user:pass@host:5432/db?connection_limit=10
```

---

*For API usage, see [API_REFERENCE.md](API_REFERENCE.md)*  
*For migration history, see `backend/prisma/migrations/`*

