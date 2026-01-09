# DAP Developer Guide

**Version:** 2.0.0 (Consolidated)  
**Last Updated:** January 9, 2026  

Welcome to the DAP (Digital Adoption Platform) developer documentation. This guide is your single source of truth for setting up, developing, testing, and deploying the application.

---

## ⚡️ Quick Start

This project works on macOS, Linux Dev (centos1), and Production (centos2) using a unified `./dap` management script.

### 1. Initial Setup
```bash
# Clone
git clone https://github.com/rajesharora27/dap.git
cd dap

# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Configure Environment
cp .env.example .env
# Edit .env if needed (defaults usually work for Mac)

# Start Everything (Database, Backend, Frontend)
./dap start
```

### 2. Daily Workflow
```bash
./dap start       # Start stack (localhost:5173 / localhost:4000)
./dap status      # Check health
./dap stop        # Stop stack
./dap restart     # Restart stack (preserves data)
./dap reset       # Reset DB to fresh demo data
```

### 3. Environment URLs
| Env | URL |
|-----|-----|
| **Local (Mac)** | http://localhost:5173 |
| **Dev (Linux)** | http://centos1.rajarora.csslab:5173 |
| **Stage** | http://centos2.rajarora.csslab/dap/ |
| **Prod** | https://dapoc.cisco.com/dap/ |

---

## 📅 Onboarding Roadmap (New Hires)

### Day 1: Access & Setup
1. **Access**: Ensure GitHub, VPN/Bastion, and Database credentials are set.
2. **Local Setup**: Run `./dap start` on your machine.
3. **Verify**: Check `http://localhost:5173`. Default Admin: `admin` / `DAP123!!!` (or `Admin@123` depending on seed).

### Day 2: Codebase Tour
1. **Domain**: Read `docs/core/CONTEXT.md` and `docs/core/FEATURES.md`.
2. **Architecture**: Skim `docs/core/ARCHITECTURE.md`.
3. **Key Entry Points**:
   - Backend: `backend/src/server.ts`
   - Frontend: `frontend/src/pages/App.tsx`
   - Schema: `backend/prisma/schema.prisma`

### Day 3: Development Tools
1. **GraphQL**: Explore http://localhost:4000/graphql.
2. **Commands**:
   - `npm run quality:quick` (Pre-commit check)
   - `npm test` (Run tests)
   - `./dap reset` (Reset data)

---

## 🛠 Project Structure

```
dap/
├── backend/                 # Node.js + Express + Apollo + Prisma
│   ├── src/modules/        # Domain modules (REQUIRED)
│   ├── src/shared/         # Shared utils, auth, errors
│   └── prisma/             # Database schema
├── frontend/                # React + Vite + TypeScript
│   ├── src/features/       # Feature modules (REQUIRED)
│   ├── src/shared/         # Shared components
│   └── src/pages/          # Route definitions
├── docs/                    # Documentation
├── scripts/                 # Automation scripts
└── e2e/                     # Playwright tests
```

---

## 💻 Development Workflow

### 1. Branching Strategy
- **Main**: Stable, deployable code.
- **Feature Branches**: `feature/your-feature-name`
- **Bug Fixes**: `fix/bug-description`

### 2. Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(auth): add login rate limiting`
- `fix(ui): fix navbar alignment`
- `docs: update setup guide`

### 3. Quality Checks
Always run before pushing:
```bash
npm run quality:quick
```

---

## 📏 Code Standards

### Naming
See **[Naming Conventions](../reference/NAMING.md)** for detailed rules.

### Error Handling
**Backend**: Always use `AppError` and `asyncHandler`.
```typescript
throw new AppError('Item not found', ErrorCodes.NOT_FOUND, 404);
```

**Frontend**: Use Error Boundaries and `toast` notifications.

### Testing
- **Unit**: Jest (Backend services, Utils)
- **Component**: React Testing Library
- **E2E**: Playwright (`npm run test:e2e`)

---

## 🚀 Deployment

### Mac / Local
Auto-detected by `./dap`. Uses Homebrew PostgreSQL.

### Linux Dev / Stage / Prod
Uses Docker or Systemd managed by scripts:
- `./deploy-to-stage.sh`
- `./deploy-to-production.sh`

**Note**: Always verify on Stage before Production.

---

## 🔧 Debugging Tips

- **Backend Logs**: `tail -f backend/backend.log`
- **Frontend Logs**: Browser Console
- **Prisma Studio**: `cd backend && npx prisma studio` (DB GUI)
- **GraphQL**: Use the Playground at `http://localhost:4000/graphql` to test queries manually.

---

## 🆘 Troubleshooting

See **[Troubleshooting Guide](./TROUBLESHOOTING.md)** for common issues like "Port in use", "DB permission denied", or "Build failures".
