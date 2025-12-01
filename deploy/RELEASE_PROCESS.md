# Standard Release Process: DEV → PROD

## Overview

This document defines the standard process for releasing changes from the development environment (centos1) to production (centos2).

## Environments

| Environment | Server | URL | Purpose |
|------------|--------|-----|---------|
| **DEV** | centos1.rajarora.csslab | http://dev.rajarora.csslab/dap/ | Development & Testing |
| **PROD** | centos2.rajarora.csslab | https://myapps.cxsaaslab.com/dap/ | Production |

## 📋 Release Workflow

```
1. Develop & Test on DEV (centos1)
   ↓
2. Create Release Package
   ↓
3. Run Pre-Deployment Checklist
   ↓
4. Create Production Backup
   ↓
5. Deploy to PROD (centos2)
   ↓
6. Verify Deployment
   ↓
7. Monitor for Issues
```

## 🔢 Step-by-Step Process

### Step 1: Develop & Test on DEV

**Location**: centos1

```bash
# Make your changes in /data/dap
cd /data/dap

# Test backend changes
cd backend
npm run build
npm test  # If tests exist

# Test frontend changes
cd ../frontend
npm run build

# Restart services to test
cd /data/dap
./dap restart

# Verify in browser: http://dev.rajarora.csslab/dap/
```

**Acceptance Criteria:**
- [ ] All code changes tested locally
- [ ] No console errors in browser (F12)
- [ ] No backend errors in logs (`tail -f backend.log`)
- [ ] All RBAC roles tested (admin, smeuser, cssuser)
- [ ] UI looks correct and responsive

### Step 2: Create Release Package

**Location**: centos1

```bash
cd /data/dap

# Use the release script
./deploy/create-release.sh

# This creates:
# - releases/release-YYYYMMDD-HHMMSS.tar.gz
# - releases/release-YYYYMMDD-HHMMSS.manifest.txt
# - releases/release-YYYYMMDD-HHMMSS.md (release notes)
```

### Step 3: Pre-Deployment Checklist

**Review before deploying:**

#### Code Quality
- [ ] All debug console.logs removed
- [ ] No hardcoded URLs or credentials
- [ ] TypeScript compiles without errors
- [ ] Linter passes without errors

#### Testing
- [ ] Tested with all user roles (Admin, SME, CSS)
- [ ] Tested all CRUD operations
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
- [ ] Tested in incognito mode (no cache)

#### Database
- [ ] Database migrations documented
- [ ] Schema changes backward compatible (if any)
- [ ] Sample data scripts updated (if needed)

#### Documentation
- [ ] CHANGELOG.md updated
- [ ] Release notes created
- [ ] User-facing changes documented

#### Communication
- [ ] Users notified of deployment window
- [ ] Expected downtime communicated (usually < 5 min)
- [ ] Rollback plan prepared

### Step 4: Create Production Backup

**Location**: centos2

```bash
# SSH to production
ssh rajarora@centos2.rajarora.csslab

cd /data/dap

# Create backup (via GUI or command)
# Option A: Via GraphQL
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createBackup { success filename message } }"}'

# Option B: Via GUI
# https://myapps.cxsaaslab.com/dap/ → Backup & Restore → Create Backup

# Verify backup created
ls -lh backend/temp/backups/

# Download backup for safekeeping
scp rajarora@centos2.rajarora.csslab:/data/dap/backend/temp/backups/dap_backup_*.sql ~/backups/
```

### Step 5: Deploy to PROD

**Location**: centos1 → centos2

#### Option A: Automated Deployment Script

```bash
# On centos1
cd /data/dap
./deploy/release-to-prod.sh releases/release-YYYYMMDD-HHMMSS.tar.gz
```

#### Option B: Manual Deployment

```bash
# On centos1 - Transfer release package
scp releases/release-*.tar.gz rajarora@centos2.rajarora.csslab:/tmp/

# On centos2 - Apply release
ssh rajarora@centos2.rajarora.csslab
cd /data/dap

# Extract release
tar xzf /tmp/release-*.tar.gz

# Build backend
cd backend
npm install  # Only if package.json changed
npm run build

# Apply database changes (if any)
# If there's a migration script in the release:
node ../scripts/apply-migrations.js

# Restart backend
cd /data/dap
pkill -f "node.*src/server"
nohup npm --prefix backend start > backend.log 2>&1 &
sleep 5

# Restart Apache (for frontend)
sudo systemctl restart httpd
```

### Step 6: Verify Deployment

**Location**: centos2

```bash
# On centos2

# 1. Check backend is running
curl -s http://localhost:4000/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | jq .
# Expected: {"data":{"__typename":"Query"}}

# 2. Check products query
curl -s http://localhost:4000/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { totalCount } }"}' | jq .
# Expected: {"data":{"products":{"totalCount":N}}}

# 3. Check frontend bundle
curl -s http://localhost/dap/ | grep -o 'index-[^.]*\.js'
# Should show latest bundle

# 4. Check backend logs for errors
tail -50 /data/dap/backend.log | grep -i error
# Should be clean

# 5. Check Apache logs
sudo tail -50 /var/log/httpd/error_log | grep -i error
# Should be clean
```

**Browser Testing:**

1. **Clear cache**: https://myapps.cxsaaslab.com/dap/force-refresh.html
2. **Test Admin user**: Login and verify full access
3. **Test CSS user**: Verify customer management + product/solution viewing
4. **Test SME user**: Verify product/solution management + task deletion
5. **Check console**: F12 → No errors

### Step 7: Monitor for Issues

**First 30 minutes after deployment:**

```bash
# On centos2

# Watch backend logs in real-time
tail -f /data/dap/backend.log

# Watch Apache access logs
sudo tail -f /var/log/httpd/access_log | grep "/dap/"

# Monitor for errors
sudo tail -f /var/log/httpd/error_log

# Check system resources
top  # Look for high CPU/memory usage
df -h  # Check disk space
```

**Metrics to Watch:**
- Response times (should be < 1s for most queries)
- Error rates (should be 0%)
- User complaints (none expected)
- Database connection count (stable)

## 🔙 Rollback Procedure

If critical issues are found:

### Quick Rollback (< 5 minutes)

```bash
# On centos2
cd /data/dap

# 1. Stop current backend
pkill -f "node.*src/server"

# 2. Restore from backup
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { restoreBackup(filename: \"PRE_DEPLOYMENT_BACKUP.sql\") { success message } }"}'

# Or via command line:
# ./dap restore PRE_DEPLOYMENT_BACKUP.sql

# 3. Checkout previous version (if using git)
git checkout HEAD~1

# 4. Rebuild
cd backend && npm run build
cd ../frontend && npm run build

# 5. Restart
cd /data/dap
./dap restart
sudo systemctl restart httpd

# 6. Verify
curl -s http://localhost:4000/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | jq .
```

## 📦 Release Package Structure

Each release should contain:

```
release-YYYYMMDD-HHMMSS/
├── backend/
│   └── src/
│       ├── lib/
│       ├── schema/
│       ├── services/
│       └── ...
├── frontend/
│   └── dist/
│       ├── assets/
│       └── index.html
├── scripts/
│   └── (any migration/setup scripts)
├── config/
│   └── (any config changes)
├── RELEASE_NOTES.md
├── MANIFEST.txt
└── ROLLBACK.txt
```

## 🔐 Security Considerations

- [ ] No passwords or secrets in release package
- [ ] Environment-specific configs excluded
- [ ] .env files not included (use existing prod .env)
- [ ] Database backups created before deploy
- [ ] Passwords preserved during database operations

## 📊 Release Types

### Patch Release (Bug Fixes)
- Version: x.x.X (e.g., 2.1.1 → 2.1.2)
- Changes: Bug fixes only
- Testing: Focused on affected areas
- Downtime: < 5 minutes
- Example: RBAC dropdown fixes

### Minor Release (New Features)
- Version: x.X.x (e.g., 2.1.0 → 2.2.0)
- Changes: New features, enhancements
- Testing: Full regression testing
- Downtime: 5-15 minutes
- Example: New telemetry features

### Major Release (Breaking Changes)
- Version: X.x.x (e.g., 2.0.0 → 3.0.0)
- Changes: Breaking changes, major refactors
- Testing: Comprehensive testing required
- Downtime: May require maintenance window
- Example: Database schema overhaul

## 🛠️ Tools & Scripts

### deploy/create-release.sh
Creates a release package from current dev state

### deploy/release-to-prod.sh
Deploys a release package to production

### APPLY_RBAC_PATCH.sh
Quick patch application for focused fixes

### scripts/fix-rbac-permissions.js
Updates database role permissions

### scripts/test-with-real-user.js
Automated testing with real user authentication

## 📝 Communication Template

**Pre-Deployment Email:**
```
Subject: DAP Deployment - [DATE] at [TIME]

Team,

We will be deploying updates to the DAP production environment:
- Date: [DATE]
- Time: [TIME] [TIMEZONE]
- Expected Downtime: < 5 minutes
- URL: https://myapps.cxsaaslab.com/dap/

Changes:
- [List key changes]

Actions Required:
- Save any work in progress
- Clear browser cache after deployment

Thank you,
[Your Name]
```

**Post-Deployment Email:**
```
Subject: DAP Deployment Complete

Team,

The DAP deployment is complete and verified:
- Status: ✅ Successful
- Version: [VERSION]
- Features: [Key features deployed]

Please:
1. Clear your browser cache (Ctrl+Shift+Delete)
2. Or visit: https://myapps.cxsaaslab.com/dap/force-refresh.html
3. Report any issues immediately

Thank you,
[Your Name]
```

## 📈 Post-Deployment Review

Within 24 hours of deployment:

- [ ] Review error logs for new issues
- [ ] Check user feedback
- [ ] Monitor system performance
- [ ] Update documentation if needed
- [ ] Document lessons learned

## 🎯 Best Practices

1. **Always backup production before deploying**
2. **Test thoroughly in DEV first**
3. **Deploy during low-traffic hours**
4. **Have rollback plan ready**
5. **Monitor logs for 30 minutes post-deploy**
6. **Communicate with users**
7. **Document everything**
8. **Keep release packages for 30 days**

## 📁 File Organization

```
/data/dap/
├── deploy/
│   ├── create-release.sh
│   ├── release-to-prod.sh
│   └── RELEASE_PROCESS.md (this file)
├── releases/
│   ├── release-20251201-165246.tar.gz
│   ├── release-20251201-165246.manifest.txt
│   └── release-20251201-165246.md
├── scripts/
│   ├── fix-rbac-permissions.js
│   ├── test-with-real-user.js
│   └── apply-migrations.js
└── APPLY_RBAC_PATCH.sh (for quick patches)
```

---

**Version**: 1.0  
**Last Updated**: December 1, 2025  
**Owner**: Development Team

