---
description: Test Panel E2E Test Configuration
---

# Test Panel - Complete Reimplementation

## Summary
The Test Panel has been completely reimplemented from scratch with the following features:

1. **Organized tests by category** - Unit, Integration, and E2E tests in separate accordions
2. **Individual test selection** - Select specific tests or entire categories
3. **Command preview** - Shows the exact command that will be executed
4. **Shadow database** - Tests run on `dap_test` database (dev data protected!)
5. **Real-time output** - Streaming output as tests execute
6. **Results summary** - Pass/fail counts with duration
7. **CLI parity** - Commands can be run identically from the terminal

## Key Files Changed

### Frontend
- **NEW: `frontend/src/components/dev/TestPanelNew.tsx`** - Complete new test panel component
- `frontend/src/pages/App.tsx` - Updated to use new TestPanelNew component

### Backend
- `backend/src/api/devTools.ts` - Enhanced test runner with pattern support and command preview

### CLI
- `dap` script - Added `unit-test` command for CLI test execution

### Documentation
- `docs/TEST_PANEL_GUIDE.md` - Complete guide
- `scripts/setup-test-db.sh` - Test database setup script

## How to Use

### Using the GUI
1. Open Development Toolkit → Tests Panel
2. Select tests by category or individually
3. View the command preview (shows exact CLI command)
4. Click "Run Tests"
5. View real-time output and results

### Using the CLI

**Run all tests on shadow database:**
```bash
// turbo
./dap unit-test
```

**Run specific test pattern:**
```bash
// turbo
./dap unit-test auth
./dap unit-test customer-service
./dap unit-test graphql-products
```

**Run with coverage:**
```bash
// turbo
./dap unit-test --coverage
```

**Run comprehensive E2E test:**
```bash
// turbo
./dap test
```

## Shadow Database Protection

Tests always run on `dap_test` database with multiple safety layers:

1. DevTools API explicitly sets `DATABASE_URL` to `dap_test`
2. Test setup.ts defaults to `dap_test` if not set
3. TestFactory validates database before any cleanup
4. User tables are never truncated (even in test DB)

## Verification Steps

// turbo
1. Check test suites API:
```bash
curl -s http://localhost:4001/api/dev/tests/suites | jq '.suites | length'
```

// turbo
2. Check user count before tests:
```bash
podman exec dap_db_1 psql -U postgres -d dap -c 'SELECT COUNT(*) FROM "User";'
```

// turbo
3. Run tests through API:
```bash
curl -s -X POST http://localhost:4001/api/dev/tests/run-stream -H "Content-Type: application/json" -d '{"pattern":"", "coverage":false}'
```

// turbo
4. Verify user count after tests (should be unchanged):
```bash
podman exec dap_db_1 psql -U postgres -d dap -c 'SELECT COUNT(*) FROM "User";'
```
