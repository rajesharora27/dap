# Troubleshooting Runbook

This document captures the fastest path to diagnose common DAP issues across dev and prod.

## Backend Won't Start
**Symptoms**: `npm run dev` exits, PM2 process flaps, `/health` endpoint fails.

1. **Check logs**
   ```bash
   tail -200 /data/dap/backend/backend.log
   ```
2. **Verify port conflicts**
   ```bash
   lsof -i :4000
   ```
   Kill lingering processes with `kill -9 <pid>`.
3. **Validate database connectivity**
   ```bash
   psql "$DATABASE_URL" -c 'select 1'
   ```
4. **Prisma client drift** – regenerate if schema changed.
   ```bash
   cd /data/dap/backend
   npx prisma generate
   ```

## Frontend Shows Stale Assets
**Symptoms**: Browser displays old JS/CSS despite redeploy.

1. Confirm Apache headers via `curl -I https://dev.rajarora.csslab/dap/` (should include `Cache-Control: no-store`).
2. Bust the service-worker by visiting `/dap/clear-cache.html`.
3. Redeploy fresh static bundle: `deploy/release-manager.sh --target dev --components frontend`.

## CSS/SME Permissions Incorrect
**Symptoms**: Dropdowns empty, SME cannot delete tasks.

1. Run the RBAC fix script:
   ```bash
   cd /data/dap/scripts
   node fix-rbac-permissions.js
   ```
2. Verify GraphQL `products` resolver logs using `tail -f backend.log | grep PRODUCTS`.
3. If fallback auth is in play (`AUTH_BYPASS=1`), ensure `ctx.user.userId` is populated (see `src/lib/auth.ts`).

## Release Script Fails Mid-flight
1. Check release manager logs under `/data/dap/releases/logs/latest.log`.
2. Confirm snapshots exist under `/data/dap/releases/snapshots/?` before attempting rollback.
3. Rerun in `--dry-run` to reproduce without touching prod.
4. Run `deploy/health-check.sh` after any rollback to confirm service health.

## Database Reset Needed in Dev
```bash
cd /data/dap/backend
npm run reset          # truncates & seeds minimal dataset
npm run seed:dev       # optional for extra fixtures
```
`./dev` automatically reruns migrations and (optionally) seeds on startup when `AUTO_SEED=true`.

## Support Escalation
1. Capture relevant logs (backend, Apache, release scripts).
2. Create a GitHub issue with repro steps & environment (`dev` vs `prod`).
3. Page on-call via PagerDuty for Sev1/Sev2 incidents.
