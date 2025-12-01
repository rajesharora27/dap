# Production Deployment Package - December 1, 2025

## 🎯 What's Being Deployed

### RBAC Fixes & UI Improvements

| Component | Changes |
|-----------|---------|
| **Backend** | Fixed userId authentication, role permissions, SME task deletion |
| **Frontend** | Fixed dialog layouts, removed debug logs, improved UX |
| **Database** | Updated SME and CSS role permissions |
| **Documentation** | Consolidated guides, removed temporary docs |

## 📦 Files to Deploy

### Backend Files
```
backend/src/lib/auth.ts
backend/src/lib/permissions.ts
backend/src/schema/resolvers/index.ts
backend/src/services/BackupRestoreService.ts
```

### Frontend Files
```
frontend/dist/  (entire directory)
```

### Configuration Files
```
/etc/httpd/conf.d/dap.conf  (if not already configured)
```

### Scripts
```
scripts/fix-rbac-permissions.js
scripts/reset-test-passwords.js (optional, for dev/test)
```

## 🚀 Deployment Steps for Production (centos2)

### Pre-Deployment Checklist

- [ ] **Backup current production database**
- [ ] **Test all fixes in DEV environment** (centos1)
- [ ] **Notify users of brief downtime** (< 5 minutes)
- [ ] **SSH access to centos2**
- [ ] **Verify disk space** (`df -h`)

### Step 1: Create Deployment Package on DEV (centos1)

```bash
# On centos1 (DEV server)
cd /data/dap
export DEPLOY_DATE=$(date +%Y%m%d-%H%M%S)

# Create deployment tarball
tar czf dap-deploy-${DEPLOY_DATE}.tar.gz \
  backend/src/lib/auth.ts \
  backend/src/lib/permissions.ts \
  backend/src/schema/resolvers/index.ts \
  backend/src/services/BackupRestoreService.ts \
  backend/package.json \
  backend/package-lock.json \
  frontend/dist \
  scripts/fix-rbac-permissions.js \
  DEPLOYMENT_CONSISTENCY_GUIDE.md \
  PASSWORD_SECURITY_BACKUPS.md \
  PRODUCTION_DEPLOYMENT_PACKAGE.md

echo "✅ Created: dap-deploy-${DEPLOY_DATE}.tar.gz"
ls -lh dap-deploy-${DEPLOY_DATE}.tar.gz
```

### Step 2: Transfer to Production (centos2)

```bash
# From centos1, transfer to centos2
scp dap-deploy-${DEPLOY_DATE}.tar.gz rajarora@centos2.rajarora.csslab:/tmp/

# Or if direct SSH not available, transfer via your local machine
scp rajarora@centos1.rajarora.csslab:/data/dap/dap-deploy-${DEPLOY_DATE}.tar.gz .
scp dap-deploy-${DEPLOY_DATE}.tar.gz rajarora@centos2.rajarora.csslab:/tmp/
```

### Step 3: Backup Production Database

```bash
# On centos2 (PROD server)
ssh rajarora@centos2.rajarora.csslab

cd /data/dap

# Create pre-deployment backup
./dap add-sample  # Ensure sample data exists if needed
cd backend && npm start &  # Ensure backend is running
sleep 5

# Create backup via GraphQL
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createBackup { success filename message } }"}'

# Or use the GUI: http://myapps.cxsaaslab.com/dap/ → Backup & Restore → Create Backup

echo "✅ Production backup created"
```

### Step 4: Deploy Backend Changes

```bash
# On centos2
cd /data/dap

# Stop backend
pkill -f "node.*src/server" || true

# Extract deployment package
tar xzf /tmp/dap-deploy-*.tar.gz

# Install dependencies and build
cd backend
npm install
npm run build

echo "✅ Backend deployed"
```

### Step 5: Update Database Role Permissions

```bash
# On centos2
cd /data/dap/backend

# Run the RBAC fix script
node ../scripts/fix-rbac-permissions.js

# Expected output:
# ✅ SME → PRODUCT (ALL): ADMIN
# ✅ SME → SOLUTION (ALL): ADMIN
# ✅ CSS → CUSTOMER (ALL): ADMIN
# ✅ CSS → PRODUCT (ALL): READ
# ✅ CSS → SOLUTION (ALL): READ
```

### Step 6: Deploy Frontend Changes

```bash
# On centos2
cd /data/dap

# The frontend/dist directory was extracted in Step 4
# Just restart Apache to serve new bundle

sudo systemctl restart httpd

# Verify new bundle is being served
curl -s http://localhost/dap/ | grep -o 'index-[^.]*\.js'
# Should show: index-nGOB7zHX.js (or newer)

echo "✅ Frontend deployed"
```

### Step 7: Restart Backend

```bash
# On centos2
cd /data/dap

# Start backend using the dap script
./dap restart

# Or if using systemd:
# sudo systemctl restart dap

# Verify backend is running
sleep 5
curl -s http://localhost:4000/graphql -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | jq .

# Should return: {"data":{"__typename":"Query"}}
```

### Step 8: Verify Deployment

```bash
# Test products query
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { totalCount } }"}' | jq .

# Should return: {"data":{"products":{"totalCount":6}}}
```

### Step 9: Browser Testing

**URL**: https://myapps.cxsaaslab.com/dap/

1. **Clear browser cache** or use incognito
2. **Test CSS User**:
   - Login: `cssuser` / `cssuser`
   - Go to Customers → Select customer
   - Products tab → "Add Product"
   - **Verify**: Dropdown shows all products
   - **Verify**: Can select and assign product
   - **Verify**: OK/Cancel buttons always visible

3. **Test SME User**:
   - Login: `smeuser` / `smeuser`
   - Go to Products menu
   - Select product → Tasks tab
   - **Verify**: Can delete tasks

4. **Test Admin User**:
   - Login: `admin` / `admin`
   - **Verify**: Full access to all features

## 🔄 Rollback Procedure

If deployment fails:

```bash
# On centos2
cd /data/dap

# Restore from backup created in Step 3
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { restoreBackup(filename: \"BACKUP_FILENAME.sql\") { success message } }"}'

# Restart services
./dap restart
sudo systemctl restart httpd

# Verify rollback
curl -s http://localhost:4000/graphql -X POST -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { totalCount } }"}' | jq .
```

## ✅ Post-Deployment Verification

### Backend Health Check
```bash
# On centos2
tail -f /data/dap/backend.log | grep -i error
# Should see no errors

# Check for successful startup
tail -100 /data/dap/backend.log | grep "Server"
# Should see: Server running on port 4000
```

### Frontend Health Check
```bash
# Verify Apache is serving correct bundle
curl -s http://myapps.cxsaaslab.com/dap/ | grep -o 'index-[^.]*\.js'

# Check Apache logs
sudo tail -f /var/log/httpd/access_log | grep "/dap/"
```

### Database Health Check
```bash
# Test GraphQL queries
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products { totalCount } solutions { totalCount } customers { id } }"}' | jq .
```

## 📊 Expected Results After Deployment

| Feature | Status |
|---------|--------|
| Products dropdown (CSS) | ✅ Shows 6 products |
| Solutions dropdown (CSS) | ✅ Shows solutions |
| Task deletion (SME) | ✅ Can delete |
| Dialog OK/Cancel buttons | ✅ Always visible |
| Password security in backups | ✅ Excluded |
| Backend authentication | ✅ Working |
| Role permissions | ✅ Correct |

## 🐛 Troubleshooting

### Issue: Products dropdown still empty

**Solution**:
```bash
# Force browser cache clear
# Visit: https://myapps.cxsaaslab.com/dap/force-refresh.html

# Or clear manually: Ctrl+Shift+Delete → Clear cached images
```

### Issue: Backend not starting

**Solution**:
```bash
# Check logs
tail -50 /data/dap/backend.log

# Verify database is running
ps aux | grep postgres

# Restart everything
cd /data/dap && ./dap restart
```

### Issue: Role permissions not working

**Solution**:
```bash
# Re-run permissions fix
cd /data/dap/backend
node ../scripts/fix-rbac-permissions.js

# Verify in database
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.rolePermission.findMany({ include: { role: true } })
  .then(rps => {
    rps.forEach(rp => console.log(\`\${rp.role.name} → \${rp.resourceType}: \${rp.permissionLevel}\`));
    process.exit(0);
  });
"
```

## 📞 Support

If issues persist:
1. Check `/data/dap/backend.log`
2. Check `/var/log/httpd/error_log`
3. Review browser console (F12)
4. Restore from backup if needed

## 📝 Deployment Checklist

- [ ] Backup created
- [ ] Files transferred to centos2
- [ ] Backend deployed and built
- [ ] Database permissions updated
- [ ] Frontend deployed
- [ ] Services restarted
- [ ] Backend health check passed
- [ ] Frontend health check passed
- [ ] User testing completed
- [ ] Documentation updated
- [ ] Team notified

---

**Deployment Package Version**: 2025-12-01  
**Tested on**: centos1 (DEV)  
**Ready for**: centos2 (PROD)  
**Status**: ✅ Ready to Deploy

