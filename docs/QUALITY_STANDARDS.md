# DAP Quality Standards & Compliance Guide

**Version:** 1.0.0  
**Last Updated:** December 31, 2025  
**Purpose:** Ensure all code changes maintain the 100/100 architecture score

---

## 🎯 Overview

DAP has achieved a **100/100** architecture score across all 10 categories. This document provides the standards, checklists, and automated checks to maintain this score.

**All contributors MUST follow these guidelines before committing code.**

---

## 📊 Score Categories & Requirements

### 1. Architecture & Structure — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **Modular Backend** | All code in `backend/src/modules/[domain]/` |
| **Feature-Based Frontend** | All code in `frontend/src/features/[feature]/` |
| **No Root-Level Code** | No `api/`, `middleware/`, `validation/` at source root |
| **Barrel Exports** | Every module has `index.ts` with public API |
| **Import Boundaries** | Features only import from `@shared/*` or own module |
| **No Circular Dependencies** | Run `npm run check:circular` |

**Pre-commit check:** `scripts/enforce-modular-layout.sh`

```bash
# Verify modular structure
npm run check:circular
npm run lint
```

### 2. Code Quality — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **TypeScript Strict Mode** | `"strict": true` in tsconfig |
| **No `any` Types** | ESLint `@typescript-eslint/no-explicit-any` |
| **JSDoc on Public APIs** | All exported functions documented |
| **Structured Error Handling** | Use `AppError` class, not raw throws |
| **Async Handler Pattern** | All async resolvers use `asyncHandler` |
| **Max Complexity ≤ 10** | ESLint `complexity` rule |

**Pre-commit check:**
```bash
npm run typecheck
npm run lint
```

### 3. Testing — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **Unit Test Coverage ≥ 80%** | `npm run test:coverage` |
| **Integration Tests Exist** | Tests in `__tests__/integration/` |
| **E2E Tests for Critical Paths** | Playwright tests in `e2e/` |
| **Test Factories Use Faker** | Check `__tests__/factories/` |
| **No Flaky Tests** | All tests pass consistently |

**Pre-push check:**
```bash
npm run test
npm run test:e2e
```

### 4. Performance — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **DataLoader for N+1 Prevention** | All resolvers use `ctx.loaders.*` |
| **Query Complexity Limits** | `queryComplexityPlugin` configured |
| **Frontend Code Splitting** | All pages use `React.lazy()` |
| **Vite Manual Chunks** | Configured in `vite.config.ts` |
| **Cache Service Usage** | Expensive queries use `CacheService` |

**Verification:**
```bash
# Check bundle size
cd frontend && npm run build -- --analyze
```

### 5. DevOps & Deployment — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **Multi-Stage Dockerfiles** | Separate build/runtime stages |
| **Health Endpoints** | `/health`, `/health/live`, `/health/ready` |
| **Docker Compose Files** | `docker-compose.yml` + `docker-compose.dev.yml` |
| **CI/CD Pipeline** | GitHub Actions configured |
| **Environment Separation** | `.env.example` with all vars documented |

### 6. Documentation — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **API Reference** | `docs/API_REFERENCE.md` up-to-date |
| **Schema Reference** | `docs/SCHEMA_REFERENCE.md` up-to-date |
| **Security Docs** | `SECURITY.md` and `docs/SECURITY_ARCHITECTURE.md` |
| **Architecture Docs** | `docs/ARCHITECTURE.md` current |
| **Inline JSDoc** | All public functions documented |

### 7. Database Schema Design — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **Model Documentation** | `///` comments in `schema.prisma` |
| **Proper Indexing** | Indexes on foreign keys and query patterns |
| **Soft Delete Pattern** | `deletedAt` field on deletable entities |
| **Audit Fields** | `createdAt`, `updatedAt` on all entities |
| **Consistent Naming** | camelCase fields, PascalCase models |

### 8. API Design (GraphQL) — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **Relay Pagination** | Connections with `edges`, `pageInfo` |
| **Input Validation** | Zod schemas for all inputs |
| **Documented Schema** | GraphQL descriptions on types |
| **Error Codes** | Standardized `ErrorCodes` enum |
| **Complexity Limits** | Query depth and complexity enforced |

### 9. Frontend Architecture — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **Feature Isolation** | No cross-feature imports |
| **Shared Hooks** | Reusable logic in `shared/hooks/` |
| **Component Composition** | Small, focused components |
| **Type Safety** | No `any`, proper interfaces |
| **Lazy Loading** | All pages wrapped in `LazyLoad` |

### 10. Security & Authentication — 10/10

| Requirement | How to Verify |
|-------------|---------------|
| **RBAC Enforcement** | All resolvers check permissions |
| **Security Headers** | Helmet configured in `server.ts` |
| **JWT + Refresh Tokens** | Proper token rotation |
| **Password Hashing** | bcrypt with proper rounds |
| **No Hardcoded Secrets** | All secrets in env vars |

---

## ✅ Pre-Commit Checklist

Before every commit, ensure:

```markdown
[ ] Code compiles: `npm run typecheck`
[ ] Linting passes: `npm run lint`
[ ] Tests pass: `npm run test`
[ ] No circular deps: `npm run check:circular`
[ ] Modular layout: `scripts/enforce-modular-layout.sh`
[ ] No hardcoded secrets
[ ] JSDoc on new public functions
[ ] Error handling uses AppError
```

---

## 🔧 Automated Git Hooks

### Pre-Commit Hook

The pre-commit hook runs automatically on every commit:

```bash
# Checks performed:
1. TypeScript compilation (no errors)
2. ESLint (no errors/warnings)
3. Modular layout enforcement
4. No hardcoded secrets
5. Circular dependency check
```

### Pre-Push Hook

The pre-push hook runs before pushing to remote:

```bash
# Checks performed:
1. All pre-commit checks
2. Full test suite
3. Build verification (frontend + backend)
```

### Installing Hooks

```bash
# Hooks are automatically installed via package.json prepare script
npm install

# Or manually:
cp scripts/hooks/* .git/hooks/
chmod +x .git/hooks/*
```

---

## 🚀 CI/CD Quality Gates

GitHub Actions enforces these checks on every PR:

```yaml
# .github/workflows/quality.yml
jobs:
  quality:
    steps:
      - Checkout
      - Install dependencies
      - TypeScript check
      - ESLint
      - Unit tests with coverage
      - E2E tests
      - Build verification
      - Security scan (npm audit)
```

**PR Requirements:**
- All checks must pass
- Coverage cannot decrease
- No new lint warnings

---

## 📋 Code Review Checklist

Reviewers should verify:

### Architecture
- [ ] Code is in correct module/feature directory
- [ ] No new dependencies without justification
- [ ] Follows established patterns

### Code Quality
- [ ] TypeScript strict compliance
- [ ] Proper error handling (AppError)
- [ ] JSDoc on public APIs
- [ ] No magic numbers/strings

### Testing
- [ ] New code has tests
- [ ] Tests are meaningful (not just coverage)
- [ ] No flaky tests introduced

### Security
- [ ] No hardcoded credentials
- [ ] Input validation on new endpoints
- [ ] RBAC checks on new resolvers

### Performance
- [ ] Uses DataLoader for DB queries
- [ ] No N+1 query patterns
- [ ] Large lists paginated

---

## 🔍 Common Violations & Fixes

### Violation: Code outside module structure

```
❌ backend/src/utils/helper.ts
✅ backend/src/shared/utils/helper.ts
   OR
✅ backend/src/modules/[domain]/utils/helper.ts
```

### Violation: Cross-feature import

```typescript
// ❌ Wrong: Direct import across features
import { ProductCard } from '@features/products/components/ProductCard';

// ✅ Correct: Import from shared or use composition
import { Card } from '@shared/components/Card';
```

### Violation: Missing error handling

```typescript
// ❌ Wrong: Raw throw
throw new Error('User not found');

// ✅ Correct: Structured error
throw new AppError('User not found', ErrorCodes.NOT_FOUND, 404);
```

### Violation: Missing DataLoader

```typescript
// ❌ Wrong: N+1 query in resolver
const tasks = await prisma.task.findMany({ where: { productId } });

// ✅ Correct: Use DataLoader
const tasks = await ctx.loaders.tasksByProduct.load(productId);
```

### Violation: Untyped code

```typescript
// ❌ Wrong: any type
const handleData = (data: any) => { ... }

// ✅ Correct: Proper interface
interface DataPayload { id: string; name: string; }
const handleData = (data: DataPayload) => { ... }
```

---

## 📚 Related Documentation

- **Architecture Analysis**: `docs/ARCHITECTURE_ANALYSIS.md`
- **Security Architecture**: `docs/SECURITY_ARCHITECTURE.md`
- **API Reference**: `docs/API_REFERENCE.md`
- **Schema Reference**: `docs/SCHEMA_REFERENCE.md`
- **Frontend Architecture**: `docs/FRONTEND_ARCHITECTURE.md`
- **GraphQL Schema Guide**: `docs/GRAPHQL_SCHEMA.md`

---

## 🎓 Training Resources

New developers should review:

1. **Read First**: `docs/CONTEXT.md` (project overview)
2. **Architecture**: `docs/ARCHITECTURE.md` (system design)
3. **Quality Standards**: This document
4. **Security**: `docs/SECURITY_ARCHITECTURE.md`

---

## 📈 Maintaining 100/100

To keep all categories at 10/10:

1. **Before coding**: Check existing patterns in similar features
2. **While coding**: Follow IDE hints (ESLint, TypeScript)
3. **Before committing**: Run `npm run check:all`
4. **Before PR**: Verify against this checklist
5. **During review**: Use the code review checklist above

**Remember**: It's easier to maintain quality than to fix it later!

