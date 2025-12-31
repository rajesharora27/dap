# DAP Developer Manual

**Version:** 1.0.0  
**Last Updated:** December 31, 2025  
**Audience:** Developers working on the DAP codebase

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Common Commands](#common-commands)
6. [Best Practices](#best-practices)
7. [Testing Guide](#testing-guide)
8. [Debugging Tips](#debugging-tips)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22+ | Runtime environment |
| npm | 10+ | Package manager |
| PostgreSQL | 16+ | Database |
| Git | 2.40+ | Version control |

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/rajesharora27/dap.git
cd dap

# 2. Install dependencies (this also installs git hooks)
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your local settings

# 4. Set up the database
cd backend
npx prisma generate
npx prisma migrate dev
cd ..

# 5. Start development servers
./dap start
# Or manually:
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
```

### Verify Installation

```bash
# Check backend
curl http://localhost:4000/health

# Check frontend
open http://localhost:5173

# Run quality checks
npm run quality:quick
```

---

## Project Structure

### Overview

```
dap/
├── backend/                 # Node.js GraphQL API
│   ├── src/
│   │   ├── modules/        # Domain modules (product, customer, etc.)
│   │   ├── shared/         # Shared utilities (auth, errors, cache)
│   │   ├── schema/         # GraphQL schema definitions
│   │   └── server.ts       # Express server entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── features/      # Feature modules (products, solutions, etc.)
│   │   ├── shared/        # Shared components and utilities
│   │   ├── pages/         # Route page components
│   │   └── main.tsx       # React entry point
│   └── package.json
│
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── e2e/                    # End-to-end tests
└── package.json            # Root package.json
```

### Backend Module Structure

Each backend module follows this pattern:

```
backend/src/modules/[domain]/
├── [domain].service.ts     # Business logic
├── [domain].resolver.ts    # GraphQL resolvers
├── [domain].schema.graphql # GraphQL type definitions
├── [domain].types.ts       # TypeScript interfaces
├── [domain].validation.ts  # Zod validation schemas
├── __tests__/              # Module tests
└── index.ts                # Barrel export (public API)
```

**Example: Product Module**
```
backend/src/modules/product/
├── product.service.ts      # Product CRUD operations
├── product.resolver.ts     # Product GraphQL resolvers
├── product.schema.graphql  # Product types and queries
├── product.types.ts        # ProductInput, ProductFilter, etc.
├── __tests__/
│   └── product.service.test.ts
└── index.ts                # export { ProductService, ... }
```

### Frontend Feature Structure

Each frontend feature follows this pattern:

```
frontend/src/features/[feature]/
├── components/             # React components
│   ├── [Feature]Dialog.tsx
│   ├── [Feature]List.tsx
│   └── shared/             # Feature-specific shared components
├── hooks/                  # Custom hooks
│   └── use[Feature].ts
├── graphql/                # GraphQL operations
│   ├── queries.ts
│   └── mutations.ts
├── types/                  # TypeScript interfaces
│   └── index.ts
└── index.ts                # Barrel export (public API)
```

---

## Development Workflow

### Daily Development Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Workflow                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Pull latest    →  2. Create branch  →  3. Make changes  │
│     git pull           git checkout -b      (code, test)    │
│                        feature/xyz                          │
│                                                             │
│  4. Quality check  →  5. Commit         →  6. Push & PR     │
│     npm run            git commit           git push        │
│     check:all          (hooks run)          → Create PR     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step

```bash
# 1. Start your day - pull latest changes
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/add-new-widget

# 3. Start development servers
./dap start

# 4. Make your changes
# ... edit files ...

# 5. Run quality checks before committing
npm run quality:quick

# 6. Commit (hooks will run automatically)
git add .
git commit -m "feat: Add new widget component"

# 7. Push and create PR
git push origin feature/add-new-widget
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(products): Add bulk import` |
| `fix` | Bug fix | `fix(auth): Resolve token refresh issue` |
| `docs` | Documentation | `docs: Update API reference` |
| `refactor` | Code refactoring | `refactor(tasks): Extract validation logic` |
| `test` | Tests | `test(products): Add service unit tests` |
| `chore` | Maintenance | `chore: Update dependencies` |

---

## Code Standards

### TypeScript Requirements

```typescript
// ✅ CORRECT: Strict typing with interfaces
interface CreateProductInput {
  name: string;
  description?: string;
  customAttrs?: Record<string, unknown>;
}

async function createProduct(input: CreateProductInput): Promise<Product> {
  // implementation
}

// ❌ WRONG: Using 'any' type
async function createProduct(input: any): any {
  // implementation
}
```

### Error Handling Pattern

```typescript
// ✅ CORRECT: Structured error with AppError
import { AppError, ErrorCodes } from '@shared/errors';

if (!user) {
  throw new AppError(
    'User not found',           // message
    ErrorCodes.NOT_FOUND,       // code
    404                         // HTTP status
  );
}

// ❌ WRONG: Raw Error throw
if (!user) {
  throw new Error('User not found');
}
```

### Async Handler Pattern

```typescript
// ✅ CORRECT: Wrap async operations for consistent error handling
import { asyncHandler } from '@shared/errors';

const createProduct = asyncHandler(async (input: CreateProductInput) => {
  const product = await prisma.product.create({ data: input });
  return product;
});

// ❌ WRONG: No error handling wrapper
const createProduct = async (input: CreateProductInput) => {
  const product = await prisma.product.create({ data: input });
  return product;
};
```

### DataLoader Pattern (Backend)

```typescript
// ✅ CORRECT: Use DataLoader to prevent N+1 queries
const ProductResolvers = {
  Product: {
    tasks: (parent: Product, _: unknown, ctx: Context) => {
      return ctx.loaders.tasksByProduct.load(parent.id);
    },
  },
};

// ❌ WRONG: Direct query in resolver (causes N+1)
const ProductResolvers = {
  Product: {
    tasks: async (parent: Product) => {
      return prisma.task.findMany({ where: { productId: parent.id } });
    },
  },
};
```

### Component Pattern (Frontend)

```typescript
// ✅ CORRECT: Typed props with JSDoc
interface ProductCardProps {
  /** The product to display */
  product: Product;
  /** Called when edit button is clicked */
  onEdit?: (product: Product) => void;
  /** Whether the card is in loading state */
  isLoading?: boolean;
}

/**
 * Displays a product card with edit capability.
 * @example
 * <ProductCard product={product} onEdit={handleEdit} />
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  isLoading = false,
}) => {
  // implementation
};

// ❌ WRONG: Untyped props
export const ProductCard = ({ product, onEdit, isLoading }) => {
  // implementation
};
```

### Import Organization

```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

// 2. Shared imports (using aliases)
import { AppError } from '@shared/errors';
import { Button } from '@shared/components';

// 3. Feature-internal imports
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from './ProductCard';

// 4. Types (can be grouped with their source)
import type { Product } from '../types';
```

---

## Common Commands

### Quality & Validation

```bash
# Quick quality check (recommended before commit)
npm run quality:quick
# Runs: lint, typecheck, circular dependency check

# Full quality check (recommended before PR)
npm run quality:full
# Runs: all checks + tests + builds

# Generate quality report
npm run quality:report
# Creates: quality-report-YYYYMMDD-HHMMSS.md

# Individual checks
npm run lint              # ESLint (backend + frontend)
npm run typecheck         # TypeScript compilation check
npm run check:circular    # Circular dependency detection
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Backend tests only
npm run test:backend

# Frontend tests only  
npm run test:frontend

# E2E tests (Playwright)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# E2E tests headed (see browser)
npm run test:e2e:headed
```

### Development

```bash
# Start all services
./dap start

# Start backend only
cd backend && npm run dev

# Start frontend only
cd frontend && npm run dev

# Build for production
cd backend && npm run build
cd frontend && npm run build
```

### Database

```bash
# Generate Prisma client
cd backend && npx prisma generate

# Run migrations
cd backend && npx prisma migrate dev

# Create new migration
cd backend && npx prisma migrate dev --name add_new_field

# Push schema changes (dev only, no migration)
cd backend && npx prisma db push

# Open Prisma Studio (database GUI)
cd backend && npx prisma studio

# Reset database
cd backend && npx prisma migrate reset
```

### Git Hooks

```bash
# Install/reinstall git hooks
bash scripts/install-hooks.sh

# Bypass pre-commit (emergency only!)
git commit --no-verify -m "message"

# Bypass pre-push (emergency only!)
git push --no-verify
```

---

## Best Practices

### 1. Module Placement

| Code Type | Backend Location | Frontend Location |
|-----------|------------------|-------------------|
| Business logic | `modules/[domain]/[domain].service.ts` | `features/[feature]/hooks/` |
| API definitions | `modules/[domain]/[domain].schema.graphql` | `features/[feature]/graphql/` |
| Types | `modules/[domain]/[domain].types.ts` | `features/[feature]/types/` |
| Validation | `modules/[domain]/[domain].validation.ts` | `shared/validation/` |
| Shared utilities | `shared/utils/` | `shared/utils/` |
| Shared components | N/A | `shared/components/` |

### 2. Naming Conventions

```typescript
// Files
product.service.ts      // lowercase with dots
ProductCard.tsx         // PascalCase for React components
useProducts.ts          // camelCase with 'use' prefix for hooks

// Variables
const productName = '';       // camelCase
const MAX_RETRIES = 3;        // SCREAMING_SNAKE for constants
const isLoading = true;       // Boolean prefix: is/has/can/should

// Types
interface ProductInput {}     // PascalCase
type ProductStatus = 'active' | 'inactive';  // PascalCase

// GraphQL
query Products {}             // PascalCase
mutation CreateProduct {}     // PascalCase
```

### 3. File Organization

```typescript
// Order within a file:
// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Helper functions
// 5. Main export (component/service/etc.)

// Example component file:
import React from 'react';
import { Box } from '@mui/material';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const CARD_WIDTH = 300;

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return <Box width={CARD_WIDTH}>...</Box>;
};
```

### 4. Error Messages

```typescript
// ✅ CORRECT: Descriptive, actionable error messages
throw new AppError(
  `Product with ID ${id} not found. Verify the ID is correct.`,
  ErrorCodes.NOT_FOUND,
  404
);

// ❌ WRONG: Vague error messages
throw new Error('Not found');
```

### 5. Comments & Documentation

```typescript
/**
 * Creates a new product in the database.
 * 
 * @param input - Product creation parameters
 * @returns The created product with generated ID
 * @throws {AppError} If a product with the same name exists
 * 
 * @example
 * const product = await createProduct({
 *   name: 'New Product',
 *   description: 'Product description'
 * });
 */
async function createProduct(input: CreateProductInput): Promise<Product> {
  // Check for duplicate name
  const existing = await prisma.product.findFirst({
    where: { name: input.name, deletedAt: null }
  });
  
  if (existing) {
    throw new AppError(
      `Product "${input.name}" already exists`,
      ErrorCodes.DUPLICATE,
      409
    );
  }
  
  return prisma.product.create({ data: input });
}
```

### 6. React Component Guidelines

```tsx
// ✅ Best practices for React components

// 1. Destructure props with defaults
const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  isLoading = false,
}) => { ... };

// 2. Use meaningful handler names
const handleEditClick = () => onEdit?.(product);
const handleDeleteConfirm = () => { ... };

// 3. Extract complex logic to hooks
const { products, isLoading, error } = useProducts();

// 4. Use early returns for loading/error states
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;

// 5. Memoize expensive computations
const sortedProducts = useMemo(
  () => products.sort((a, b) => a.name.localeCompare(b.name)),
  [products]
);
```

---

## Testing Guide

### Unit Tests

```typescript
// backend/src/modules/product/__tests__/product.service.test.ts

import { ProductService } from '../product.service';
import { prismaMock } from '@shared/test/prisma-mock';

describe('ProductService', () => {
  describe('createProduct', () => {
    it('should create a product with valid input', async () => {
      // Arrange
      const input = { name: 'Test Product', description: 'Test' };
      prismaMock.product.create.mockResolvedValue({
        id: '1',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await ProductService.create(input);

      // Assert
      expect(result.name).toBe('Test Product');
      expect(prismaMock.product.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it('should throw error for duplicate name', async () => {
      // Arrange
      prismaMock.product.findFirst.mockResolvedValue({ id: '1', name: 'Existing' });

      // Act & Assert
      await expect(
        ProductService.create({ name: 'Existing' })
      ).rejects.toThrow('already exists');
    });
  });
});
```

### Component Tests

```tsx
// frontend/src/features/products/components/__tests__/ProductCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test description',
  };

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const handleEdit = jest.fn();
    render(<ProductCard product={mockProduct} onEdit={handleEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(handleEdit).toHaveBeenCalledWith(mockProduct);
  });
});
```

### E2E Tests

```typescript
// e2e/products.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('can create a new product', async ({ page }) => {
    await page.goto('/products');
    await page.click('button:has-text("Add Product")');
    
    await page.fill('[name="name"]', 'New Test Product');
    await page.fill('[name="description"]', 'Test description');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=New Test Product')).toBeVisible();
  });
});
```

---

## Debugging Tips

### Backend Debugging

```bash
# View backend logs
tail -f backend/backend.log

# Run with debug logging
DEBUG=* npm run dev

# Use Prisma logging
# In .env: DATABASE_URL="...?log=query"

# Debug GraphQL queries
# Open: http://localhost:4000/graphql
# Use Apollo Sandbox for query testing
```

### Frontend Debugging

```bash
# View console in browser DevTools (F12)

# React DevTools extension
# Install from Chrome/Firefox extension store

# Apollo DevTools extension  
# Install for GraphQL query inspection

# Enable source maps (already enabled in dev)
# Set breakpoints in browser DevTools
```

### Common Debug Scenarios

```typescript
// Debug GraphQL resolver
const resolver = async (parent, args, ctx) => {
  console.log('Args:', JSON.stringify(args, null, 2));
  console.log('User:', ctx.user);
  
  const result = await service.method(args);
  console.log('Result:', result);
  
  return result;
};

// Debug React component
const MyComponent = ({ data }) => {
  useEffect(() => {
    console.log('Data changed:', data);
  }, [data]);
  
  // ...
};

// Debug Apollo cache
import { useApolloClient } from '@apollo/client';
const client = useApolloClient();
console.log('Cache:', client.cache.extract());
```

---

## Deployment Guide

### Local Build

```bash
# Build everything
cd backend && npm run build
cd ../frontend && npm run build

# Test production build locally
cd backend && node dist/server.js
# In another terminal:
cd frontend && npm run preview
```

### Deploy to Development Server

```bash
# From your local machine
./deploy/deploy-to-dev.sh

# Or manually:
ssh dev-server
cd /data/dap
git pull
npm run build
./dap restart
```

### Deploy to Production

```bash
# Create release package
./deploy/create-release.sh

# Deploy to production
./deploy-to-production.sh

# This script:
# 1. Creates backup
# 2. Activates maintenance mode
# 3. Transfers files
# 4. Runs migrations
# 5. Restarts services
# 6. Verifies deployment
```

---

## Troubleshooting

### Common Issues

#### "Cannot find module" errors

```bash
# Regenerate Prisma client
cd backend && npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
cd backend && npm install
cd ../frontend && npm install
```

#### TypeScript errors after pulling

```bash
# Regenerate types
cd backend && npx prisma generate
cd ../frontend && npm run typecheck
```

#### Database connection issues

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string in .env
cat backend/.env | grep DATABASE_URL

# Test connection
cd backend && npx prisma db pull
```

#### Pre-commit hook failures

```bash
# See detailed errors
npm run quality:quick

# Fix common issues
npm run lint:fix        # Auto-fix lint issues
npm run typecheck       # See TypeScript errors

# Bypass hook (emergency only!)
git commit --no-verify -m "message"
```

#### Port already in use

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>

# Or use different port
PORT=4001 npm run dev
```

### Getting Help

1. **Check Documentation**
   - `docs/CONTEXT.md` - Project overview
   - `docs/QUALITY_STANDARDS.md` - Code standards
   - `docs/API_REFERENCE.md` - API documentation

2. **Search Existing Code**
   - Look for similar patterns in the codebase
   - Check how other modules implement similar features

3. **Ask the Team**
   - Create an issue with detailed description
   - Include error messages and steps to reproduce

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                  DAP Quick Reference                         │
├─────────────────────────────────────────────────────────────┤
│ Start Development    │ ./dap start                          │
│ Quality Check        │ npm run quality:quick                │
│ Run Tests           │ npm test                              │
│ TypeScript Check    │ npm run typecheck                     │
│ Lint Fix            │ npm run lint:fix                      │
│ Database GUI        │ cd backend && npx prisma studio       │
│ Create Migration    │ cd backend && npx prisma migrate dev  │
├─────────────────────────────────────────────────────────────┤
│ Backend URL         │ http://localhost:4000/graphql         │
│ Frontend URL        │ http://localhost:5173                 │
│ Health Check        │ http://localhost:4000/health          │
├─────────────────────────────────────────────────────────────┤
│ Commit Convention   │ feat|fix|docs|refactor(scope): msg    │
│ Branch Convention   │ feature/*, fix/*, docs/*              │
└─────────────────────────────────────────────────────────────┘
```

---

**Happy Coding! 🚀**

For questions or issues, see `docs/CONTEXT.md` or create a GitHub issue.

