# Test Panel - Complete Guide

**Date:** 2025-12-14  
**Status:** ✅ Fully Implemented

## Overview

The Test Panel provides a comprehensive GUI for running tests in the DAP application. It's designed to:

1. **Protect Development Data**: All tests run on a shadow database (`dap_test`)
2. **Organize Tests by Category**: Unit, Integration, and E2E tests are clearly separated
3. **Provide CLI Parity**: Commands shown in the GUI can be run identically from the terminal
4. **Allow Selective Execution**: Run specific tests or entire categories

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Test Panel GUI                          │
│  (frontend/src/components/dev/TestPanelNew.tsx)                │
├─────────────────────────────────────────────────────────────────┤
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │  DevTools API - /api/dev/tests/*                          │ │
│  │  (backend/src/api/devTools.ts)                            │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │  Jest Test Runner                                         │ │
│  │  npm test -- --runInBand                                  │ │
│  └─────────────────────────┬─────────────────────────────────┘ │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │  Shadow Database (dap_test)                               │ │
│  │  postgres://postgres:postgres@localhost:5432/dap_test     │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Test Categories

### Unit Tests (`services/`)
- **Location**: `backend/src/__tests__/services/`
- **Purpose**: Test individual service methods in isolation
- **Speed**: Fast (< 10s per file)
- **Examples**:
  - `customer-service.test.ts`
  - `permissions.test.ts`
  - `telemetry-evaluation.test.ts`

### Integration Tests (`integration/`)
- **Location**: `backend/src/__tests__/integration/`
- **Purpose**: Test GraphQL API endpoints with database
- **Speed**: Medium (10-30s per file)
- **Examples**:
  - `graphql-products.test.ts`
  - `graphql-customers.test.ts`
  - `graphql-solutions.test.ts`

### E2E Tests (`e2e/`)
- **Location**: `backend/src/__tests__/e2e/`
- **Purpose**: Comprehensive workflow tests
- **Speed**: Slow (60s+ per file)
- **Examples**:
  - `comprehensive-crud.test.ts`

## Shadow Database Protection

### How It Works

1. **DevTools API** sets `DATABASE_URL` to `dap_test` when spawning tests
2. **Test Setup** (`setup.ts`) defaults to `dap_test` if not set
3. **TestFactory** validates it's using `dap_test` before any cleanup
4. **Safety Check** refuses to run TRUNCATE on non-test databases

### Multiple Layers of Protection

```
Layer 1: DevTools sets DATABASE_URL → dap_test
         ↓
Layer 2: Test setup.ts defaults → dap_test
         ↓
Layer 3: TestFactory defaults → dap_test
         ↓
Layer 4: TestFactory.cleanup() safety check
         (Throws error if not dap_test)
```

### User Table Protection

Even in the test database, **User tables are never truncated**:

```typescript
// TestFactory.cleanup() - tables that ARE cleaned
const tablenames = [
  'CustomerTask',
  'AdoptionPlan',
  'CustomerProduct',
  'Customer',
  'Task',
  'Product',
  'Solution'
  // User, Session, etc. are NOT included
];
```

## Using the Test Panel

### 1. Select Tests

- **Check/uncheck entire categories** using the category checkbox
- **Select individual tests** within each category
- **E2E tests are unchecked by default** (they're slow)

### 2. View Command Preview

The panel shows the exact command that will be executed:

```bash
cd /data/dap/backend && DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap_test npm test -- --runInBand --testPathPattern="auth|customer"
```

This command can be copied and run directly in the terminal for identical results.

### 3. Run Tests

Click "Run Tests" to start execution. Output streams in real-time.

### 4. View Results

After completion, you'll see:
- ✅ Passed count
- ❌ Failed count
- ⏱️ Duration
- Exit code

## CLI Commands

### Run Comprehensive E2E Test (38 tests)
```bash
./dap test
```

### Run All Tests (Shadow Database)
```bash
./dap unit-test
```

### Run Specific Tests
```bash
./dap unit-test auth
./dap unit-test customer
./dap unit-test graphql-products
./dap unit-test comprehensive-crud
```

### Run with Coverage
```bash
./dap unit-test --coverage
```

### Direct npm Commands
```bash
cd /data/dap/backend

# All tests
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap_test npm test

# Specific pattern
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap_test npm test -- --testPathPattern="auth"

# Comprehensive E2E test (identical to GUI/CLI)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap_test npm test -- --runInBand --passWithNoTests --testPathPattern="comprehensive-crud"
```

## API Endpoints

### List Test Suites
```
GET /api/dev/tests/suites
```

Response:
```json
{
  "suites": [
    {
      "id": "services/auth.test.ts",
      "name": "auth",
      "type": "unit",
      "path": "/data/dap/backend/src/__tests__/services/auth.test.ts",
      "relativePath": "services/auth.test.ts"
    }
  ]
}
```

### Run Tests
```
POST /api/dev/tests/run-stream
Content-Type: application/json

{
  "pattern": "auth|customer",
  "coverage": false,
  "tests": ["services/auth.test.ts"]
}
```

Response:
```json
{
  "jobId": "test-1702547723456-abc123",
  "status": "started",
  "message": "Tests started in background"
}
```

### Get Test Status
```
GET /api/dev/tests/status/:jobId?offset=0
```

Response:
```json
{
  "id": "test-1702547723456-abc123",
  "status": "completed",
  "output": "...",
  "exitCode": 0,
  "passed": 15,
  "failed": 0,
  "total": 15,
  "duration": 12.5
}
```

## Troubleshooting

### Tests Not Running
1. Check if database container is running: `./dap status`
2. Check DevTools service: `curl http://localhost:4001/health`
3. Verify test database exists: `docker exec dap_db_1 psql -U postgres -c '\l' | grep dap_test`

### User Data Lost
If development users were somehow lost:
```bash
./scripts/ensure-admin-user.sh
```

### Test Database Needs Reset
```bash
docker exec dap_db_1 psql -U postgres -c "DROP DATABASE IF EXISTS dap_test;"
docker exec dap_db_1 psql -U postgres -c "CREATE DATABASE dap_test;"
cd /data/dap/backend && DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap_test npx prisma migrate deploy
```

## Files

### Frontend
- `/frontend/src/components/dev/TestPanelNew.tsx` - New test panel component

### Backend
- `/backend/src/api/devTools.ts` - Test execution API
- `/backend/src/__tests__/setup.ts` - Test setup with safety checks
- `/backend/src/__tests__/factories/TestFactory.ts` - Test data factory with safety checks

### Scripts
- `/scripts/setup-test-db.sh` - Setup test database
- `/dap` - CLI with `unit-test` command

### Documentation
- `/docs/TEST_DATABASE_ISOLATION.md` - Database isolation details
- `/docs/TEST_PANEL_GUIDE.md` - This guide
