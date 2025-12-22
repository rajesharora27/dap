# Developer Onboarding Guide

Welcome to DAP (Digital Adoption Platform). This guide walks you through the first week so you can be productive quickly without risking production.

## Day 0 – Access Checklist
- GitHub repository access with SSH key.
- VPN or bastion credentials for centos1 (dev) and centos2 (prod).
- Database credentials and environment secrets from the vault (stored in `.env` on the target machine, never committed).
- Slack access to `#dap-dev` and PagerDuty rotation.

## Day 1 – Local Environment
```bash
# Clone the repo
ssh centos1
cd /data
sudo mkdir -p dap && sudo chown $USER:$USER dap
cd /data/dap
git clone git@github.com:org/dap.git .

# Install dependencies & start dev stack
./dev
```
The `dev` script provisions Dockerized Postgres (`dap_postgres_dev`), runs Prisma migrations, seeds dev data, and launches:
- Backend @ http://localhost:4000 (nodemon hot reload).
- Frontend @ http://localhost:5173 (Vite HMR).

### Default Accounts
| User | Password | Role |
|------|----------|------|
| admin | admin | ADMIN |
| smeuser | smeuser | SME |
| cssuser | cssuser | CSS |

## Day 2 – Codebase Tour
1. Read `CONTEXT.md` for the product domain.
2. Skim `docs/DEV_SPEED_OPTIMIZATION.md` for dev tooling philosophy.
3. Backend entry points:
   - `src/server.ts` – Express + Apollo server bootstrap.
   - `src/config/env.ts` – Environment feature toggles.
   - `src/schema/resolvers/` – GraphQL resolvers (per domain).
4. Frontend entry points:
   - `src/pages/App.tsx` – top-level routing & layout.
   - `src/graphql/queries.ts` / `mutations.ts` – canonical GraphQL documents.
   - `src/components/CustomerAdoptionPanelV4.tsx` – primary workflow surface.

## Day 3 – Tooling & Commands
```bash
# Backend
cd /data/dap/backend
npm run dev                 # nodemon hot reload
npm run test                # Jest unit suite
npm run test:watch          # Only changed tests
npm run reset               # Truncate + reseed dev DB

# Frontend
cd /data/dap/frontend
npm run dev                 # Vite + React Fast Refresh
npm run codegen:watch       # GraphQL typings
```
GraphQL types live in `frontend/src/generated/graphql.ts` (generated from backend schema). Keep this file committed so CI is deterministic.

## Day 4 – Release Flow Primer
1. Every feature branch targets `develop`.
2. CI (GitHub Actions) runs lint, tests, and build steps.
3. Release artefacts are produced via `deploy/release-manager.sh` and pushed to centos2.
4. Hotfixes go through the same scripts but use the `patch` mode to limit blast radius.

## Day 5 – First Contribution
- Pick a `good-first-issue` or backlog bug.
- Pair with team for code review expectations (2 approvals, lint/test green).
- Update CHANGELOG or release notes if the change is user-facing.

## Support Resources
- **Troubleshooting**: see `docs/TROUBLESHOOTING_RUNBOOK.md`.
- **DB Snapshots**: `backend/scripts/snapshot.sh` & `restore.sh` for quick state saves.
- **Monitoring**: run `deploy/health-check.sh` to verify dev/prod health after deployments.
- **Deployment**: `DEPLOY_TO_PRODUCTION.sh` for manual cutovers (still uses release scripts under the hood).

Stay curious! Ship often! EOF
