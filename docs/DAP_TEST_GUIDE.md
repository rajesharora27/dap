# DAP Test Runner Guide

**Version:** 1.0.0  
**Last Updated:** December 19, 2025  
**Script:** `./dap-test`

---

## Overview

The `dap-test` script is a consolidated test runner for the DAP application. It provides a unified interface for running all types of tests including unit tests, integration tests, E2E tests, and legacy test scripts.

### Key Features

- **Shadow Database**: All tests run against `dap_test` database, protecting your development data
- **Multiple Test Types**: E2E, unit, integration, tags, and legacy tests
- **Cross-Platform**: Works on both macOS and Linux
- **Coverage Reports**: Built-in support for code coverage analysis
- **Pattern Matching**: Run specific tests using pattern matching

---

## Quick Start

```bash
# Run all tests
./dap-test all

# Run comprehensive E2E tests
./dap-test e2e

# Run specific unit tests
./dap-test unit auth

# List all available tests
./dap-test list
```

---

## Commands

### Test Suites

| Command | Description |
|---------|-------------|
| `./dap-test all` | Run all test suites (e2e, tags, integration) |
| `./dap-test e2e` | Run comprehensive E2E CRUD tests (38 tests) |
| `./dap-test crud` | Alias for `e2e` |
| `./dap-test tags` | Run tags implementation tests |
| `./dap-test integration` | Run GraphQL integration tests |

### Unit Tests

| Command | Description |
|---------|-------------|
| `./dap-test unit` | Run all unit tests |
| `./dap-test unit <pattern>` | Run tests matching pattern |
| `./dap-test unit --coverage` | Run with coverage report |
| `./dap-test coverage` | Alias for `unit --coverage` |

### Utility Commands

| Command | Description |
|---------|-------------|
| `./dap-test list` | List all available test files |
| `./dap-test legacy <script>` | Run legacy test script from `tests/` directory |
| `./dap-test help` | Show help message |

---

## Test Suites Explained

### E2E/CRUD Tests (38 tests)

Comprehensive end-to-end tests covering all CRUD operations:

```bash
./dap-test e2e
```

**What's tested:**
- ✅ Product CRUD (create, read, update, delete, outcomes, releases, licenses)
- ✅ Task CRUD (create, read, update, delete, telemetry, reorder)
- ✅ Solution CRUD (create, read, update, add/remove products)
- ✅ Customer CRUD (create, read, update, delete)
- ✅ Adoption Plans (assign products, create/update/delete plans)
- ✅ Import/Export (full data export, custom attributes)
- ✅ Telemetry Evaluation (success criteria, multiple data types)

**Location:** `backend/src/__tests__/e2e/comprehensive-crud.test.ts`

---

### Tags Tests

Tests for the tag management and filtering system:

```bash
./dap-test tags
```

**What's tested:**
- Tag creation and management
- Task tag assignments
- Tag filtering functionality
- Tag synchronization to customer adoption plans

**Location:** `backend/src/__tests__/e2e/tags-implementation.test.ts`

---

### Integration Tests

GraphQL API integration tests:

```bash
./dap-test integration
```

**What's tested:**
- Products GraphQL queries and mutations
- Solutions GraphQL queries and mutations
- Customers GraphQL queries and mutations
- Tags GraphQL queries and mutations

**Location:** `backend/src/__tests__/integration/`

**Files:**
- `graphql-products.test.ts`
- `graphql-solutions.test.ts`
- `graphql-customers.test.ts`
- `graphql-tags.test.ts`

---

### Unit Tests

Individual component and service tests:

```bash
# Run all unit tests
./dap-test unit

# Run specific tests by pattern
./dap-test unit auth
./dap-test unit permissions
./dap-test unit telemetry
```

**Locations:**
- `backend/src/__tests__/*.test.ts`
- `backend/src/__tests__/services/*.test.ts`

**Service Tests:**
- `auth.test.ts` - Authentication
- `permissions.test.ts` - RBAC permissions
- `product.test.ts` - Product service
- `solution.test.ts` - Solution service
- `customer-service.test.ts` - Customer service
- `telemetry.test.ts` - Telemetry service
- `telemetry-evaluation.test.ts` - Telemetry evaluation

---

## Coverage Reports

Generate test coverage reports:

```bash
# Run with coverage
./dap-test coverage

# Or explicitly
./dap-test unit --coverage
```

**Output:**
- Coverage summary displayed in terminal
- Detailed report in `backend/coverage/`
- HTML report: `backend/coverage/lcov-report/index.html`

**Metrics tracked:**
- Lines covered
- Statements covered
- Functions covered
- Branches covered

---

## Legacy Test Scripts

Run legacy test scripts from the `tests/` directory:

```bash
# List available legacy tests
./dap-test list

# Run a specific legacy test
./dap-test legacy test-adoption-sync
./dap-test legacy test-sync-preserves-selections
```

### Available Legacy Tests

| Script | Purpose |
|--------|---------|
| `test-adoption-sync-filters.js` | Test adoption plan sync with filters |
| `test-sync-preserves-selections.js` | Verify sync preserves user selections |
| `test-edit-entitlements-and-sync.js` | Test entitlement editing and sync |
| `complete-customer-adoption-test.js` | Full customer adoption workflow |
| `test-adoption-plan-display.js` | Test adoption plan UI display |
| `test-sync-new-outcome.js` | Test syncing new outcomes |
| `check-telemetry-criteria.js` | Verify telemetry success criteria |

---

## Test Database

### Shadow Database Protection

All tests run against a **shadow database** (`dap_test`) that is completely isolated from your development database (`dap`).

```
Development Database: dap        ← Your data is SAFE
Test Database:        dap_test   ← Tests run here
```

### Database Management

The test runner automatically:
1. Creates `dap_test` database if it doesn't exist
2. Runs migrations on the test database
3. Cleans up test data after tests complete

### Manual Database Reset

If needed, you can manually reset the test database:

```bash
# Mac
dropdb dap_test
createdb dap_test

# Linux (Docker)
docker exec dap_db psql -U postgres -c "DROP DATABASE IF EXISTS dap_test;"
docker exec dap_db psql -U postgres -c "CREATE DATABASE dap_test;"
```

---

## Examples

### Common Workflows

```bash
# Before deploying: Run all tests
./dap-test all

# After changing product code: Run product-related tests
./dap-test unit product
./dap-test integration

# After changing auth: Run auth tests
./dap-test unit auth
./dap-test unit permissions

# After changing tags: Run tags tests
./dap-test tags

# Check code coverage
./dap-test coverage

# Debug a specific legacy test
./dap-test legacy test-adoption-sync-filters
```

### Pattern Matching

```bash
# Run tests with "auth" in the name
./dap-test unit auth

# Run tests with "product" in the name
./dap-test unit product

# Run tests with "telemetry" in the name
./dap-test unit telemetry
```

---

## Test File Locations

```
backend/
├── src/__tests__/
│   ├── e2e/
│   │   ├── comprehensive-crud.test.ts    # Main E2E tests (38 tests)
│   │   └── tags-implementation.test.ts   # Tags tests
│   ├── integration/
│   │   ├── graphql-products.test.ts
│   │   ├── graphql-solutions.test.ts
│   │   ├── graphql-customers.test.ts
│   │   └── graphql-tags.test.ts
│   ├── services/
│   │   ├── auth.test.ts
│   │   ├── permissions.test.ts
│   │   ├── product.test.ts
│   │   ├── solution.test.ts
│   │   ├── customer-service.test.ts
│   │   ├── telemetry.test.ts
│   │   └── telemetry-evaluation.test.ts
│   ├── factories/
│   │   └── TestFactory.ts                # Test data factory
│   └── setup.ts                          # Jest setup
│
frontend/
├── src/__tests__/
│   ├── App.test.tsx
│   ├── AppValidation.test.js
│   └── e2e/
│       └── tags-filtering.test.tsx

tests/                                     # Legacy test scripts
├── test-adoption-sync-filters.js
├── test-sync-preserves-selections.js
├── complete-customer-adoption-test.js
└── ... (29 total scripts)
```

---

## Troubleshooting

### Tests Hang or Timeout

```bash
# Ensure test database is available
psql -h localhost -p 5432 -l | grep dap_test

# Reset test database
dropdb dap_test && createdb dap_test

# Re-run with verbose output
cd backend && npm test -- --verbose --runInBand
```

### "Cannot find module" Errors

```bash
# Regenerate Prisma client
cd backend && npx prisma generate

# Reinstall dependencies
cd backend && npm install
```

### Connection Refused

```bash
# Ensure PostgreSQL is running
# Mac
brew services start postgresql@16

# Linux
./dap start  # Starts Docker container
```

### Database Lock Errors

```bash
# Restart database to clear connections
./dap restart-db

# Or kill all connections
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'dap_test';"
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Tests
  run: |
    ./dap-test e2e
    ./dap-test unit --coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: backend/coverage/lcov.info
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "Running tests before commit..."
./dap-test e2e
```

---

## Related Documentation

- **Main DAP Script:** `./dap help`
- **Context Document:** `docs/CONTEXT.md`
- **Development Guide:** `docs/DEV_QUICKSTART.md`
- **Testing Panel:** `docs/TEST_PANEL_GUIDE.md`

---

**Last Updated:** December 19, 2025  
**Maintainer:** AI Assistant + Development Team
