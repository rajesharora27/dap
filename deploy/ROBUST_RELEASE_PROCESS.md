# Robust Release Process - Full Guide

**Version**: 2.0  
**Last Updated**: December 1, 2025  
**Status**: Production Ready

---

## Overview

This comprehensive release process supports:
- ✅ **Full releases** with complete system updates
- ✅ **Quick patches** for urgent fixes
- ✅ **Database migrations** with rollback support
- ✅ **Automatic backups** before every deployment
- ✅ **Health checks** and verification
- ✅ **One-command rollback** if anything breaks
- ✅ **Password exclusion** from all backups

---

## Quick Start

### Deploy Full Release
```bash
cd /data/dap
./deploy/create-release.sh              # Create release package
./deploy/release-manager.sh deploy releases/release-*.tar.gz
```

### Deploy Quick Patch
```bash
cd /data/dap
./deploy/release-manager.sh patch
```

### Rollback if Needed
```bash
./deploy/release-manager.sh rollback
```

### Check Health
```bash
./deploy/health-check.sh
```

---

## Release Manager Commands

### 1. Full Release Deployment

**Command**: `./deploy/release-manager.sh deploy <release-package.tar.gz>`

**What it does**:
1. Creates automatic snapshot of production (database + code)
2. Transfers release package to production
3. Stops services
4. Deploys backend, frontend, and migrations
5. Rebuilds and installs dependencies
6. Starts services
7. Runs verification checks
8. Reports success or failure

**When to use**:
- Major version releases
- New features
- Significant changes
- Scheduled deployments

**Example**:
```bash
./deploy/create-release.sh
# Follow prompts for version and description

./deploy/release-manager.sh deploy releases/release-20251201-190000.tar.gz
# Type 'yes' to confirm
```

### 2. Quick Patch Deployment

**Command**: `./deploy/release-manager.sh patch`

**What it does**:
1. Creates automatic snapshot
2. Builds code locally
3. Transfers only changed files
4. Rebuilds on production
5. Restarts services
6. Verifies deployment

**When to use**:
- Bug fixes
- Small changes
- Urgent hotfixes
- Single file updates

**Example**:
```bash
cd /data/dap
# Make your changes to backend/src or frontend/src

./deploy/release-manager.sh patch
```

### 3. Rollback

**Command**: `./deploy/release-manager.sh rollback`

**What it does**:
1. Finds latest snapshot
2. Confirms with you
3. Stops services
4. Restores backend from snapshot
5. Restores frontend from snapshot
6. Restores database (preserves passwords)
7. Starts services
8. Verifies rollback

**When to use**:
- Deployment breaks production
- Verification fails
- Critical bug discovered
- Need to revert quickly

**Example**:
```bash
./deploy/release-manager.sh rollback
# Type 'yes' to confirm
```

### 4. Verify Deployment

**Command**: `./deploy/release-manager.sh verify`

**What it does**:
- Tests backend GraphQL endpoint
- Tests frontend serving
- Checks all services running
- Reports pass/fail

**Example**:
```bash
./deploy/release-manager.sh verify
```

### 5. Check Status

**Command**: `./deploy/release-manager.sh status`

**What it does**:
- Shows all running services
- Displays versions
- Lists recent snapshots
- Shows disk usage
- Shows migration history

**Example**:
```bash
./deploy/release-manager.sh status
```

---

## Database Migration Management

### Create New Migration

**Command**: `./deploy/migration-manager.sh create <name>`

**Creates**: `migrations/YYYYMMDDHHMMSS_<name>.sql`

**Example**:
```bash
./deploy/migration-manager.sh create add_user_avatar

# Edit migrations/20251201190000_add_user_avatar.sql
# Add your schema changes
```

**Migration Template**:
```sql
-- Migration: add_user_avatar
-- Created: 20251201190000
-- Description: Add avatar field to User table

-- UP Migration (apply changes)
BEGIN;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
CREATE INDEX IF NOT EXISTS "idx_user_avatar" ON "User"("avatar");

-- Record migration
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid(),
    '',
    NOW(),
    '20251201190000_add_user_avatar',
    'Manual migration',
    NULL,
    NOW(),
    1
) ON CONFLICT DO NOTHING;

COMMIT;

-- DOWN Migration (rollback changes)
-- BEGIN;
-- ALTER TABLE "User" DROP COLUMN IF EXISTS "avatar";
-- DROP INDEX IF EXISTS "idx_user_avatar";
-- DELETE FROM _prisma_migrations WHERE migration_name = '20251201190000_add_user_avatar';
-- COMMIT;
```

### Apply Migrations

**Development**:
```bash
./deploy/migration-manager.sh apply dev
```

**Production**:
```bash
./deploy/migration-manager.sh apply production
# Type 'yes' to confirm
```

### Check Migration Status

```bash
./deploy/migration-manager.sh status production
```

---

## Health Check

### Run Health Check

```bash
./deploy/health-check.sh
```

**Checks**:
1. ✅ Backend services (PM2 instances)
2. ✅ Backend GraphQL response
3. ✅ Backend data queries
4. ✅ Frontend serving
5. ✅ Frontend assets
6. ✅ PostgreSQL running
7. ✅ Database connection
8. ✅ Table counts
9. ✅ Disk space
10. ✅ Memory available
11. ✅ Load average
12. ✅ Web server running
13. ✅ Firewall status
14. ✅ Recent error logs

**Output Example**:
```
1. Backend Services
-------------------
  ✓ Backend instances running (4)
  ✓ Backend GraphQL responding
  ✓ Backend data queries working

2. Frontend
-----------
  ✓ Frontend bundle: index-nGOB7zHX.js
  ✓ Frontend assets accessible

3. Database
-----------
  ✓ PostgreSQL running
  ✓ Database connection OK
  ✓ Database tables: 25

4. System Resources
-------------------
  ✓ Disk usage: 45%
  ✓ Memory available: 42567MB
  ✓ Load average: 1.23

5. Network & Security
---------------------
  ✓ Web server running
  ✓ Firewall active

6. Recent Logs
--------------
  ✓ Backend errors in last 100 lines: 0

=========================================
Health Check Summary
=========================================
Passed: 14
Warnings: 0
Failed: 0

✓ System Health: GOOD
```

---

## Snapshot System

### Automatic Snapshots

**Created automatically before**:
- Every full release deployment
- Every patch deployment
- Every rollback operation

**Snapshot contents**:
- `database.sql` - Full database dump (passwords excluded)
- `backend.tar.gz` - Complete backend code
- `frontend.tar.gz` - Complete frontend dist
- `pm2-status.txt` - Service status
- `migrations.txt` - Migration history
- `MANIFEST.txt` - Snapshot metadata

**Location**: `/data/dap/backups/releases/YYYYMMDD-HHMMSS/`

### Manual Snapshot

```bash
ssh rajarora@centos2.rajarora.csslab
cd /data/dap
./deploy/release-manager.sh status  # Lists recent snapshots
```

### List Snapshots

```bash
ssh rajarora@centos2.rajarora.csslab
ls -lh /data/dap/backups/releases/
```

### Delete Old Snapshots

```bash
ssh rajarora@centos2.rajarora.csslab
# Keep last 10 snapshots, delete older
cd /data/dap/backups/releases
ls -t | tail -n +11 | xargs rm -rf
```

---

## Complete Release Workflow

### 1. Development Phase

```bash
cd /data/dap

# Make changes to code
vim backend/src/...
vim frontend/src/...

# Test locally
cd backend && npm run build && npm start
cd frontend && npm run build && npm run dev

# Create migration if database changes needed
./deploy/migration-manager.sh create add_new_feature
vim migrations/YYYYMMDDHHMMSS_add_new_feature.sql

# Test migration locally
./deploy/migration-manager.sh apply dev
```

### 2. Pre-Deployment Testing

```bash
# Run tests
cd backend && npm test
cd frontend && npm test

# Check linting
cd backend && npm run lint
cd frontend && npm run lint

# Manual testing checklist
# - Test all RBAC roles (admin, smeuser, cssuser)
# - Test all CRUD operations
# - Test all dialogs
# - Check browser console for errors
# - Check backend logs for errors
```

### 3. Create Release Package

```bash
cd /data/dap
./deploy/create-release.sh

# Enter version number (e.g., 2.1.2)
# Enter description of changes

# This creates: releases/release-YYYYMMDD-HHMMSS.tar.gz
```

### 4. Deploy to Production

```bash
# Check production health first
./deploy/health-check.sh

# Deploy release
./deploy/release-manager.sh deploy releases/release-*.tar.gz

# Type 'yes' to confirm

# Automatic process runs:
# - Creates snapshot
# - Transfers package
# - Deploys all components
# - Applies migrations
# - Restarts services
# - Verifies deployment
```

### 5. Post-Deployment Verification

```bash
# Run health check
./deploy/health-check.sh

# Check services
ssh rajarora@centos2.rajarora.csslab
sudo -u dap pm2 list

# Check logs
tail -f /data/dap/backend.log

# Browser testing
# Visit: https://myapps.cxsaaslab.com/dap/
# Test with: admin, smeuser, cssuser
```

### 6. Monitor (First 30 minutes)

```bash
# Watch logs
ssh rajarora@centos2.rajarora.csslab
tail -f /data/dap/backend.log

# Watch PM2
sudo -u dap pm2 monit

# Check for errors
tail -100 /data/dap/backend.log | grep -i error
```

### 7. If Issues Found - Rollback

```bash
./deploy/release-manager.sh rollback

# Type 'yes' to confirm

# Automatic rollback runs:
# - Restores code from snapshot
# - Restores database (preserves passwords)
# - Restarts services
# - Verifies rollback
```

---

## Emergency Procedures

### Quick Rollback

```bash
./deploy/release-manager.sh rollback
```

### Manual Rollback

If scripts fail, manual rollback:

```bash
ssh rajarora@centos2.rajarora.csslab

# Find latest snapshot
SNAPSHOT=$(ls -t /data/dap/backups/releases/ | head -1)
cd /data/dap/backups/releases/$SNAPSHOT

# Stop services
sudo -u dap pm2 stop all

# Restore backend
sudo rm -rf /data/dap/app/backend
sudo tar xzf backend.tar.gz -C /data/dap/app/
sudo chown -R dap:dap /data/dap/app/backend

# Restore frontend
sudo rm -rf /data/dap/app/frontend/dist
sudo tar xzf frontend.tar.gz -C /data/dap/app/frontend/
sudo chown -R dap:dap /data/dap/app/frontend/dist

# Restore database
sudo -u postgres psql -d dap < database.sql

# Start services
sudo -u dap pm2 start all
```

### Fix Broken Services

```bash
ssh rajarora@centos2.rajarora.csslab

# Check what's running
sudo -u dap pm2 list

# Restart all
sudo -u dap pm2 restart all

# Or restart individual service
sudo -u dap pm2 restart dap-backend

# Check logs
sudo -u dap pm2 logs dap-backend
```

### Database Recovery

```bash
# If database is corrupted
ssh rajarora@centos2.rajarora.csslab

# Find backup
ls -lh /data/dap/backups/releases/

# Restore from snapshot
SNAPSHOT=$(ls -t /data/dap/backups/releases/ | head -1)
sudo -u postgres psql -d dap < /data/dap/backups/releases/$SNAPSHOT/database.sql
```

---

## Best Practices

### Before Deployment

- ✅ Test thoroughly in DEV
- ✅ Run health check
- ✅ Check disk space
- ✅ Review all changes
- ✅ Have rollback plan ready
- ✅ Deploy during low-traffic hours
- ✅ Notify users if needed

### During Deployment

- ✅ Watch deployment output
- ✅ Verify each step completes
- ✅ Don't interrupt process
- ✅ Take notes of any warnings

### After Deployment

- ✅ Run health check
- ✅ Test with all user roles
- ✅ Monitor logs for 30 minutes
- ✅ Check for user reports
- ✅ Update documentation
- ✅ Document lessons learned

### If Rollback Needed

- ✅ Don't panic
- ✅ Use rollback script
- ✅ Document what went wrong
- ✅ Fix issue in DEV
- ✅ Re-test before re-deploying

---

## Password Security

### Passwords Excluded from Backups

All snapshots and backups **automatically exclude passwords**:
- User passwords are NOT included in `database.sql`
- Only password hashes are stored in production database
- Backups can be safely stored and transferred

### Passwords Preserved on Restore

When restoring from backup:
- Existing user passwords are **automatically preserved**
- Users can still log in with their current passwords
- No password resets needed after rollback

### Implementation

**Backup** (passwords removed):
```sql
-- In snapshot creation
sed -i '/INSERT INTO "User".*password/d' database.sql
```

**Restore** (passwords preserved):
```sql
-- Before restore
CREATE TEMP TABLE temp_passwords AS 
  SELECT id, password FROM "User";

-- After restore
UPDATE "User" u 
SET password = tp.password 
FROM temp_passwords tp 
WHERE u.id = tp.id;
```

---

## Troubleshooting

### Deployment Fails

**Check**:
```bash
./deploy/health-check.sh
./deploy/release-manager.sh status
```

**Common issues**:
- Disk space full → Clean old snapshots
- Services not starting → Check logs
- Database connection failed → Check PostgreSQL
- Build errors → Check dependencies

### Verification Fails

**Re-run verification**:
```bash
./deploy/release-manager.sh verify
```

**If still failing**:
```bash
./deploy/release-manager.sh rollback
```

### Rollback Fails

**Manual rollback** (see Emergency Procedures above)

**Get help**:
```bash
# Check logs
tail -100 /data/dap/backend.log

# Check services
sudo -u dap pm2 list
sudo -u dap pm2 logs
```

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| **Release Manager** | `/data/dap/deploy/release-manager.sh` | Main deployment script |
| **Migration Manager** | `/data/dap/deploy/migration-manager.sh` | Database migrations |
| **Health Check** | `/data/dap/deploy/health-check.sh` | System health checks |
| **Create Release** | `/data/dap/deploy/create-release.sh` | Package releases |
| **Snapshots** | `/data/dap/backups/releases/` | Automatic backups |
| **Migrations** | `/data/dap/migrations/` | Database migration files |
| **Backend** | `/data/dap/app/backend/` | Backend code (prod) |
| **Frontend** | `/data/dap/app/frontend/dist/` | Frontend code (prod) |

---

## Support

**Questions or issues?**
1. Check `./deploy/release-manager.sh status`
2. Run `./deploy/health-check.sh`
3. Review logs: `tail -f /data/dap/backend.log`
4. Try rollback if needed

**Documentation**:
- This file: Complete release process
- `RELEASE_PROCESS.md`: Original workflow
- `QUICK_DEPLOY_GUIDE.md`: Quick reference
- `testing-checklist.md`: Testing procedures

---

**Version**: 2.0  
**Last Updated**: December 1, 2025  
**Status**: ✅ Production Ready

