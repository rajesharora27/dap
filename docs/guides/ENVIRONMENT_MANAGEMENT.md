# Environment Variable Management

**Last Updated:** December 22, 2025

This document describes DAP's environment configuration system, which uses a **single `.env.example` template** as the source of truth and **Zod-based runtime validation** to ensure all required variables are present before the application starts.

---

## Table of Contents

1. [Overview](#overview)
2. [Configuration Files](#configuration-files)
3. [How It Works: Zod Validation](#how-it-works-zod-validation)
4. [Environment Setup by Platform](#environment-setup-by-platform)
5. [Required vs Optional Variables](#required-vs-optional-variables)
6. [Troubleshooting](#troubleshooting)
7. [Adding New Variables](#adding-new-variables)

---

## Overview

### The Single Source of Truth Model

```
.env.example     →     .env          →     backend/.env
   (template)       (your config)         (synced copy)
```

| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `.env.example` | **Template** with all variables documented | ✅ Yes |
| `.env` | Your **active configuration** (copy of template, customized) | ❌ No (gitignored) |
| `backend/.env` | **Synced copy** for backend runtime | ❌ No (gitignored) |

### Key Principles

1. **One template, multiple environments** - The same `.env.example` works for Mac, Linux, Stage, and Production
2. **Runtime validation** - The backend validates all variables at startup using Zod schemas
3. **Fail fast** - Missing or invalid required variables cause immediate startup failure with clear error messages
4. **Type safety** - All variables are parsed and typed (strings become booleans, numbers, enums)

---

## Configuration Files

### `.env.example` (Template)

This is the **canonical reference** for all environment variables. It contains:

- All 40+ variables organized by category
- Documentation comments explaining each variable
- Sensible defaults for development
- Placeholders for secrets (e.g., `CHANGE-THIS-TO-A-SECURE-RANDOM-STRING`)

**Location:** Project root (`/dap/.env.example`)

### `.env` (Active Configuration)

Your working configuration file. Created by copying `.env.example` and customizing for your environment.

**Location:** Project root (`/dap/.env`)

### `backend/.env` (Synced Copy)

The backend reads from `backend/.env`. This is automatically synced from the root `.env` by:

- `./dap start` (via `scripts/mac-light-deploy.sh` or internal logic)
- `./scripts/sync-env.sh` (manual sync)

---

## How It Works: Zod Validation

### The Configuration Service

The backend uses **Zod** (a TypeScript schema validation library) to validate all environment variables at startup.

**File:** `backend/src/config/env.ts`

```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

// Define strict schema
const envSchema = z.object({
  // Required - will fail startup if missing
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Required with minimum length
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  
  // Optional with defaults
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  
  // Boolean transforms (string → boolean)
  GRAPHQL_PLAYGROUND: z.string().optional().transform(v => v === '1' || v === 'true'),
  
  // Number transforms
  RATE_LIMIT_MAX: z.string().optional().transform(v => parseInt(v || '5000', 10)),
});

// Validate at startup
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);  // ← Application won't start with invalid config
}

export const envConfig = parsedEnv.data;
```

### What Happens at Startup

```
┌─────────────────────────────────────────────────────────────┐
│ 1. dotenv.config() loads backend/.env into process.env     │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Zod schema validates all variables                      │
│    - Checks required fields exist                           │
│    - Validates formats (min length, enums, etc.)            │
│    - Transforms types (string → boolean/number)             │
└────────────────────────────┬────────────────────────────────┘
                             ↓
              ┌──────────────┴──────────────┐
              ↓                             ↓
┌─────────────────────────┐    ┌─────────────────────────────┐
│ ✅ Validation Passes    │    │ ❌ Validation Fails          │
│    App starts normally  │    │    App exits with error     │
└─────────────────────────┘    │    showing missing/invalid  │
                               │    variables                │
                               └─────────────────────────────┘
```

### Example Error Output

If `DATABASE_URL` is missing:

```
❌ Invalid environment configuration: {
  "_errors": [],
  "DATABASE_URL": {
    "_errors": ["DATABASE_URL is required"]
  }
}
```

---

## Environment Setup by Platform

### MacBook (mac-demo mode)

**Purpose:** Lightweight production-like environment for demos

**Setup:**

```bash
# 1. Copy template to create your .env
cp .env.example .env

# 2. Edit .env with Mac-specific settings
```

**Required `.env` changes for Mac:**

```bash
# Core
NODE_ENV=production

# Database - Use your macOS username for peer auth
# Replace 'yourusername' with your actual macOS username
DATABASE_URL=postgresql://yourusername@localhost:5432/dap?schema=public&connection_limit=5

# JWT Secret - Change this!
JWT_SECRET=your-secure-secret-at-least-32-characters-long

# Frontend paths (root-level, no subpath)
VITE_BASE_PATH=/
VITE_GRAPHQL_ENDPOINT=/graphql

# Disable dev menu for demo
SHOW_DEV_MENU=false
VITE_SHOW_DEV_MENU=false
```

**Start:**

```bash
./dap start
# Syncs .env → backend/.env
# Installs PostgreSQL via Homebrew if needed
# Runs migrations and builds
# Starts on http://localhost:5173
```

**Verify Configuration:**

```bash
# Check if .env exists
ls -la .env

# Check DATABASE_URL format
grep DATABASE_URL .env

# Test connection
./dap status
```

---

### CentOS1 (linux-dev mode)

**Purpose:** Full development environment with Docker PostgreSQL

**Setup:**

```bash
# 1. Copy template
cp .env.example .env

# 2. Edit .env with development settings
```

**Required `.env` changes for CentOS1:**

```bash
# Core
NODE_ENV=development

# Database - Docker PostgreSQL with password
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dap?schema=public

# JWT Secret
JWT_SECRET=dev-secret-at-least-32-chars-long-for-safety

# Frontend paths (subpath for reverse proxy)
VITE_BASE_PATH=/dap/
VITE_GRAPHQL_ENDPOINT=/dap/graphql

# Enable dev menu
SHOW_DEV_MENU=true
VITE_SHOW_DEV_MENU=true

# Development features
GRAPHQL_PLAYGROUND=true
APOLLO_INTROSPECTION=true
```

**Start:**

```bash
./dap start
# Starts Docker PostgreSQL container
# Runs migrations
# Starts dev servers with hot reload
```

---

### CentOS2 / Stage (production mode)

**Purpose:** Pre-production testing environment

**Setup on Stage Server:**

```bash
# On centos2.rajarora.csslab
cd /data/dap/app

# 1. Copy template
cp .env.example .env

# 2. Edit with stage settings
```

**Required `.env` changes for Stage:**

```bash
# Core
NODE_ENV=production

# Database - Systemd PostgreSQL with secure password
DATABASE_URL=postgresql://dap:your-stage-password@localhost:5432/dap?schema=public&connection_limit=20

# JWT Secret - MUST BE UNIQUE TO STAGE
JWT_SECRET=stage-unique-secret-at-least-32-characters

# Frontend paths (subpath behind Apache)
VITE_BASE_PATH=/dap/
VITE_GRAPHQL_ENDPOINT=/dap/graphql

# CORS for stage domain
CORS_ORIGIN=http://centos2.rajarora.csslab

# Disable dev menu
SHOW_DEV_MENU=false
VITE_SHOW_DEV_MENU=false

# Production security
GRAPHQL_PLAYGROUND=false
APOLLO_INTROSPECTION=false
RATE_LIMIT_ENABLED=true
```

**Deployment:**

```bash
# From centos1 (development machine)
./deploy-to-stage.sh
```

---

### DAPOC / Production (production mode)

**Purpose:** Live production environment

**Setup on Production Server:**

```bash
# On dapoc server
cd /data/dap/app

# 1. Copy template
cp .env.example .env

# 2. Edit with production settings
```

**Required `.env` changes for Production:**

```bash
# Core
NODE_ENV=production

# Database - STRONG password required
DATABASE_URL=postgresql://dap:STRONG-UNIQUE-PASSWORD@localhost:5432/dap?schema=public&connection_limit=50

# JWT Secret - MUST BE UNIQUE AND SECURE
JWT_SECRET=PRODUCTION-UNIQUE-SECRET-64-CHARACTERS-RECOMMENDED

# Frontend paths (subpath behind Nginx)
VITE_BASE_PATH=/dap/
VITE_GRAPHQL_ENDPOINT=/dap/graphql

# CORS for production domain
CORS_ORIGIN=https://myapps.cxsaaslab.com

# Disable ALL dev features
SHOW_DEV_MENU=false
VITE_SHOW_DEV_MENU=false
GRAPHQL_PLAYGROUND=false
APOLLO_INTROSPECTION=false
DEVTOOLS_ENABLED=false

# Production security
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
LOG_LEVEL=info
LOG_PRETTY=false
```

**Deployment:**

```bash
# From centos1 (development machine)
./deploy-to-production.sh
```

---

## Required vs Optional Variables

### Required Variables (Startup Will Fail Without These)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dap` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | `your-secure-secret-32-chars-min` |

### Variables with Smart Defaults

These have sensible defaults but should be reviewed:

| Variable | Default | Production Recommendation |
|----------|---------|--------------------------|
| `NODE_ENV` | `development` | Set to `production` |
| `PORT` | `4000` | Keep default |
| `JWT_EXPIRES_IN` | `24h` | Consider `8h` for production |
| `RATE_LIMIT_ENABLED` | `false` in dev | Set to `true` |
| `GRAPHQL_PLAYGROUND` | `true` in dev | Set to `false` |
| `SHOW_DEV_MENU` | `true` in dev | Set to `false` |

### Optional Variables

| Variable | Purpose | When Needed |
|----------|---------|-------------|
| `OPENAI_API_KEY` | OpenAI integration | If using OpenAI for AI Agent |
| `GEMINI_API_KEY` | Gemini integration | If using Gemini for AI Agent |
| `CISCO_AI_*` | Cisco AI Gateway | If using Cisco AI |
| `SENTRY_DSN` | Error tracking | If using Sentry |

---

## Troubleshooting

### "DATABASE_URL is required"

```bash
# Check if .env exists
ls -la .env

# Check if DATABASE_URL is set
grep DATABASE_URL .env

# Ensure it's synced to backend
./scripts/sync-env.sh
# OR
cp .env backend/.env
```

### "JWT_SECRET must be at least 32 characters"

```bash
# Generate a secure secret
openssl rand -base64 48

# Update .env
JWT_SECRET=your-new-64-character-secret-here-replace-this-now
```

### "Mac PostgreSQL auth issues (peer auth / wrong username)"

Homebrew PostgreSQL commonly uses **peer auth**, meaning your DB username must match your macOS username.

```bash
# Confirm your macOS username
whoami

# Ensure DATABASE_URL uses that username
grep '^DATABASE_URL=' .env
```

### "Cannot connect to database"

```bash
# Mac - check PostgreSQL is running
brew services list | grep postgresql
pg_isready -h localhost -p 5432

# Linux - check Docker container
docker ps | grep dap_db

# Production - check systemd service
systemctl status postgresql-16
```

### Verify Configuration is Loaded

```bash
# Check what the backend sees
cd backend
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? '✅ DATABASE_URL set' : '❌ DATABASE_URL missing')"
```

---

## Adding New Variables

### Step 1: Add to `.env.example`

```bash
# In .env.example, add with documentation:

# -----------------------------------------------------------------------------
# New Feature Configuration
# -----------------------------------------------------------------------------
# MY_NEW_FEATURE: Enable the new feature
#   - true: Feature enabled
#   - false: Feature disabled (default)
MY_NEW_FEATURE=false

# MY_NEW_API_KEY: API key for new integration
#   ⚠️ Required if MY_NEW_FEATURE=true
# MY_NEW_API_KEY=your-api-key-here
```

### Step 2: Add to Zod Schema

Edit `backend/src/config/env.ts`:

```typescript
const envSchema = z.object({
  // ... existing variables ...
  
  // New variables
  MY_NEW_FEATURE: z.string().optional().transform(v => v === '1' || v === 'true'),
  MY_NEW_API_KEY: z.string().optional(),
});
```

### Step 3: Export in envConfig

```typescript
export const envConfig = {
  // ... existing config ...
  
  myNewFeature: {
    enabled: env.MY_NEW_FEATURE ?? false,
    apiKey: env.MY_NEW_API_KEY,
  }
};
```

### Step 4: Update Your `.env`

```bash
# Copy new variables from .env.example to your .env
MY_NEW_FEATURE=true
MY_NEW_API_KEY=actual-key-here
```

### Step 5: Sync and Restart

```bash
./scripts/sync-env.sh  # OR ./dap start
./dap restart
```

---

## Quick Reference: Environment Checklist

### Before Starting Any Environment

- [ ] `.env` file exists in project root
- [ ] `DATABASE_URL` is set and valid for your platform
- [ ] `JWT_SECRET` is at least 32 characters
- [ ] `NODE_ENV` is correct (`development` or `production`)

### Mac-Specific

- [ ] PostgreSQL installed via Homebrew (`brew install postgresql@16`)
- [ ] Database user matches macOS username (peer auth)
- [ ] `VITE_BASE_PATH=/` (no subpath)

### Linux Dev (centos1)

- [ ] Docker installed and running
- [ ] `DATABASE_URL` uses `postgres:postgres` credentials
- [ ] `VITE_BASE_PATH=/dap/` (subpath for reverse proxy)

### Stage/Production

- [ ] Strong, unique passwords for database
- [ ] Strong, unique JWT_SECRET (different from dev!)
- [ ] `SHOW_DEV_MENU=false`
- [ ] `GRAPHQL_PLAYGROUND=false`
- [ ] `RATE_LIMIT_ENABLED=true`
- [ ] `CORS_ORIGIN` set to actual domain

---

## Related Documentation

- **Quick Start:** `docs/DEV_QUICKSTART.md`
- **Local Development:** `docs/DEV_CONTEXT_LOCAL.md`
- **Deployment:** `docs/deployment/DEPLOYMENT_INDEX.md`
- **Zod Schema:** `backend/src/config/env.ts`
