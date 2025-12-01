# RBAC Patch Summary - December 1, 2025

## 🎯 Quick Patch Application

To apply RBAC fixes to production (centos2):

```bash
cd /data/dap
./APPLY_RBAC_PATCH.sh
```

This will:
1. Transfer only the changed files to centos2
2. Build backend
3. Update database role permissions
4. Restart services
5. Verify deployment

## 📝 Files Changed

### Backend (3 files)
1. **`backend/src/lib/auth.ts`**
   - Fixed userId field compatibility
   - Added userId fallback for old/new code

2. **`backend/src/lib/permissions.ts`**
   - Added fallback admin detection
   - Removed debug console.logs

3. **`backend/src/schema/resolvers/index.ts`**
   - Removed debug console.logs from products query
   - Added SME role to task deletion

### Frontend (1 directory)
4. **`frontend/dist/*`**
   - New bundle: `index-nGOB7zHX.js`
   - Removed debug console.logs from AssignProductDialog
   - Fixed dialog layouts (sticky buttons)
   - Removed visual debug styles

### Scripts (1 file)
5. **`scripts/fix-rbac-permissions.js`**
   - Database role permission updater
   - Sets correct permissions for SME and CSS roles

## 🔍 What Gets Fixed

| Issue | Fix |
|-------|-----|
| CSS user can't see products | ✅ Fixed (database permissions + UI) |
| SME user can't delete tasks | ✅ Fixed (backend permissions) |
| Dialog buttons covered | ✅ Fixed (sticky layout) |
| Debug logs in production | ✅ Removed |
| Passwords in backups | ✅ Already excluded |

## 📊 Database Changes

The script automatically updates these role permissions:

**SME Role:**
- PRODUCT (ALL): ADMIN
- SOLUTION (ALL): ADMIN

**CSS Role:**
- CUSTOMER (ALL): ADMIN
- PRODUCT (ALL): READ
- SOLUTION (ALL): READ

## ⚡ Quick Manual Application (if script fails)

### On centos1 (DEV):
```bash
cd /data/dap

# Transfer files
scp backend/src/lib/auth.ts \
    backend/src/lib/permissions.ts \
    backend/src/schema/resolvers/index.ts \
    rajarora@centos2.rajarora.csslab:/data/dap/backend/src/lib/

scp -r frontend/dist/* \
    rajarora@centos2.rajarora.csslab:/data/dap/frontend/dist/

scp scripts/fix-rbac-permissions.js \
    rajarora@centos2.rajarora.csslab:/data/dap/scripts/
```

### On centos2 (PROD):
```bash
cd /data/dap/backend
npm run build

node ../scripts/fix-rbac-permissions.js

cd /data/dap
pkill -f "node.*src/server"
nohup npm --prefix backend start > backend.log 2>&1 &

sudo systemctl restart httpd
```

## ✅ Verification

After applying patch:

```bash
# On centos2
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { totalCount } }"}' | jq .

# Should return: {"data":{"products":{"totalCount":6}}}
```

**Browser Test:**
1. Go to https://myapps.cxsaaslab.com/dap/
2. Login as `cssuser` / `cssuser`
3. Customers → Select customer → Products tab
4. Click "Add Product"
5. **Verify**: Dropdown shows 6 products ✅

## 🔙 Rollback (if needed)

```bash
# On centos2
cd /data/dap

# Restore from git (if using version control)
git checkout HEAD~1 backend/src/lib/auth.ts
git checkout HEAD~1 backend/src/lib/permissions.ts
git checkout HEAD~1 backend/src/schema/resolvers/index.ts

# Rebuild and restart
cd backend && npm run build
cd /data/dap
pkill -f "node.*src/server"
nohup npm --prefix backend start > backend.log 2>&1 &
```

## 📞 Support

**Production URL**: https://myapps.cxsaaslab.com/dap/  
**Backend Logs**: `tail -f /data/dap/backend.log`  
**Apache Logs**: `sudo tail -f /var/log/httpd/error_log`

---

**Patch Version**: 2025-12-01  
**Status**: ✅ Ready to Apply  
**Estimated Time**: 3-5 minutes

