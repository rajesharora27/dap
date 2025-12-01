# Deployment Consistency Guide

## Overview
This guide ensures consistency between DEV and PROD deployments to prevent RBAC issues and UI inconsistencies.

## Deployment Environments

### DEV Environment (centos1)
- **Server**: centos1.rajarora.csslab (172.22.156.32)
- **URL**: http://dev.rajarora.csslab/dap/
- **Apache Config**: `/etc/httpd/conf.d/dap.conf`
- **Frontend Path**: `/data/dap/frontend/dist/`
- **Backend Path**: `/data/dap/backend/`
- **Service**: `dap.service`

### PROD Environment (centos2)
- **Server**: centos2.rajarora.csslab
- **URL**: https://myapps.cxsaaslab.com/dap/
- **Apache Config**: `/etc/httpd/conf.d/dap.conf`
- **Frontend Path**: `/data/dap/frontend/dist/`
- **Backend Path**: `/data/dap/backend/`
- **Service**: `dap.service`

## Deployment Checklist

### Before Deployment
- [ ] Verify no duplicate component implementations exist
- [ ] Test RBAC changes in DEV first
- [ ] Clear browser cache after each deployment
- [ ] Remove old JavaScript bundles from `/data/dap/frontend/dist/assets/`

### Code Consistency Checks
```bash
# Check for duplicate implementations
grep -r "export const AssignProductDialog" frontend/src
grep -r "export const AssignSolutionDialog" frontend/src

# Verify no hardcoded environment URLs
grep -r "dev.rajarora.csslab\|prod.rajarora.csslab\|myapps.cxsaaslab.com" frontend/src backend/src
```

### Deployment Steps

#### 1. Backend Deployment
```bash
cd /data/dap/backend
npm install
npm run build
sudo systemctl restart dap
```

#### 2. Frontend Deployment
```bash
cd /data/dap/frontend
npm install
npm run build

# Clean old bundles (keep only latest)
cd /data/dap/frontend/dist/assets
# Keep only the latest index-*.js file, remove others
ls -t index-*.js | tail -n +2 | xargs rm -f

# Restart Apache
sudo systemctl restart httpd
```

#### 3. Verify Deployment
```bash
# Check Apache is serving new bundle
curl -s http://dev.rajarora.csslab/dap/ | grep -o 'index-[^.]*\.js'

# Check backend is running
sudo systemctl status dap

# Check logs for errors
tail -f /data/dap/backend.log
tail -f /var/log/httpd/error_log
```

### Force Browser Cache Clear
Direct users to:
```
http://dev.rajarora.csslab/dap/force-refresh.html
```
OR
```
https://myapps.cxsaaslab.com/dap/force-refresh.html
```

## Common Issues Fixed

### 1. Empty Dropdowns (Products/Solutions)
**Root Cause**: Material-UI `Select` component z-index/portal rendering issues in dialogs.

**Solution**: Replaced `Select` with `Autocomplete` component in:
- `frontend/src/components/dialogs/AssignProductDialog.tsx`
- `frontend/src/components/dialogs/AssignSolutionDialog.tsx`

### 2. Duplicate Dialog Rendering
**Root Cause**: Multiple `<AssignProductDialog>` rendered in same component.

**Solution**: Removed duplicate in `CustomerAdoptionPanelV4.tsx` (line 2856).

### 3. Dead Code with Duplicate Implementations
**Root Cause**: Unused `CustomerSolutionCard.tsx` containing duplicate `AssignSolutionDialog`.

**Solution**: Deleted `frontend/src/components/CustomerSolutionCard.tsx`.

## RBAC Permissions Summary

### CSS Role (Customer Success Specialist)
- **Customer**: Full CRUD (ADMIN level)
- **Product**: READ only
- **Solution**: READ only
- **Task**: No access

### SME Role (Subject Matter Expert)
- **Product**: Full CRUD (ADMIN level)
- **Solution**: Full CRUD (ADMIN level)
- **Task**: Full CRUD including DELETE
- **Customer**: No access

### ADMIN Role
- All resources: Full CRUD

## Files Modified for RBAC

### Backend
- `backend/src/lib/permissions.ts` - Core permission logic
- `backend/src/schema/resolvers/index.ts` - Task delete mutations

### Frontend
- `frontend/src/components/dialogs/AssignProductDialog.tsx` - Autocomplete
- `frontend/src/components/dialogs/AssignSolutionDialog.tsx` - Autocomplete
- `frontend/src/components/CustomerAdoptionPanelV4.tsx` - Removed duplicate dialog

### Deleted
- `frontend/src/components/CustomerSolutionCard.tsx` - Dead code

## Syncing DEV to PROD

To deploy tested changes from DEV to PROD:

```bash
# On DEV (centos1)
cd /data/dap
tar czf dap-deploy-$(date +%Y%m%d-%H%M%S).tar.gz \
  backend/src \
  frontend/src \
  backend/package.json \
  frontend/package.json

# Transfer to PROD (centos2)
scp dap-deploy-*.tar.gz rajarora@centos2.rajarora.csslab:/tmp/

# On PROD (centos2)
cd /data/dap
tar xzf /tmp/dap-deploy-*.tar.gz
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
sudo systemctl restart dap
sudo systemctl restart httpd
```

## Verification Tests

### Test CSS User
1. Login as `cssuser`
2. Navigate to Customers
3. Select a customer
4. **Products Tab**:
   - ✅ Can assign product (dropdown shows all products)
   - ✅ Can view product details
   - ❌ Cannot delete product
5. **Solutions Tab**:
   - ✅ Can assign solution (dropdown shows all solutions)
   - ✅ Can view solution details
   - ❌ Cannot delete solution

### Test SME User
1. Login as `smeuser`
2. Navigate to Products menu
3. **Products**:
   - ✅ Can create product
   - ✅ Can edit product
   - ✅ Can delete product
4. **Solutions**:
   - ✅ Can create solution
   - ✅ Can edit solution
   - ✅ Can delete solution
5. **Tasks**:
   - ✅ Can create task
   - ✅ Can edit task
   - ✅ **Can delete task** (queue for deletion)

## Maintenance

### Weekly
- Check for orphaned bundles in `frontend/dist/assets/`
- Review Apache access logs for 404s on old bundles

### Monthly
- Audit RBAC permissions against business requirements
- Review deleted dead code for any new duplicates

### Before Major Releases
- Full regression test of all roles
- Verify DEV and PROD are in sync
- Document any new RBAC changes

## Contact
For deployment issues, contact the development team.

Last Updated: December 1, 2025

