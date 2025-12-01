# Release Notes - December 2025 RBAC Fixes

**Version**: 2.1.1  
**Release Date**: December 1, 2025  
**Type**: Patch Release (Bug Fixes)

## 🎯 Summary

This release fixes critical RBAC (Role-Based Access Control) issues and improves dialog usability.

## ✅ Issues Fixed

### 1. Products/Solutions Dropdowns Empty for CSS Users
**Severity**: High  
**Impact**: CSS users unable to assign products/solutions to customers

**Fix**:
- Updated database role permissions for CSS role
- Added READ access to PRODUCT and SOLUTION for CSS
- Fixed backend authentication userId field compatibility

### 2. SME Users Cannot Delete Tasks
**Severity**: Medium  
**Impact**: SME users unable to manage task lifecycle

**Fix**:
- Added SME role to task deletion permissions
- Updated `queueTaskSoftDelete` and `processDeletionQueue` mutations

### 3. Dialog Buttons Covered by Dropdowns
**Severity**: Medium  
**Impact**: OK/Cancel buttons hidden when dropdowns opened

**Fix**:
- Implemented sticky DialogActions layout
- Added proper overflow handling to DialogContent
- Limited dialog height to 90vh with scrolling

### 4. Debug Console Logs in Production
**Severity**: Low  
**Impact**: Console noise, minor performance impact

**Fix**:
- Removed all debug console.logs from backend
- Removed all debug console.logs from frontend
- Cleaned production build

## 🔧 Technical Changes

### Backend
- `backend/src/lib/auth.ts` - Fixed userId field compatibility
- `backend/src/lib/permissions.ts` - Added fallback admin handling
- `backend/src/schema/resolvers/index.ts` - Cleaned logs, fixed SME permissions

### Frontend  
- `frontend/src/components/dialogs/AssignProductDialog.tsx` - Fixed layout
- `frontend/src/components/dialogs/AssignSolutionDialog.tsx` - Fixed layout
- Bundle: `index-nGOB7zHX.js`

### Database
- SME role: Added PRODUCT (ALL): ADMIN, SOLUTION (ALL): ADMIN
- CSS role: Added PRODUCT (ALL): READ, SOLUTION (ALL): READ

## 📊 Verification

### Tested Scenarios
✅ Admin user - Full access to all features  
✅ CSS user - Can assign products/solutions to customers  
✅ SME user - Can delete tasks  
✅ All dialogs - Buttons remain visible  
✅ Cross-browser - Chrome, Firefox, Edge

### Performance
- No performance degradation
- Bundle size similar to previous version
- All queries respond < 500ms

## 🚀 Deployment Instructions

See `deploy/QUICK_DEPLOY_GUIDE.md` or run:

```bash
cd /data/dap
./APPLY_RBAC_PATCH.sh
```

## 🔙 Rollback

If issues occur, restore from backup:

```bash
ssh rajarora@centos2.rajarora.csslab
cd /data/dap
# Restore latest backup via GUI or:
curl -X POST http://localhost:4000/graphql \
  -d '{"query":"mutation { restoreBackup(filename: \"BACKUP.sql\") { success } }"}'
```

## 👥 User Impact

### CSS Users
- ✅ Can now assign products to customers
- ✅ Can now assign solutions to customers
- ✅ Dropdowns show all available items

### SME Users
- ✅ Can now delete tasks
- ✅ Full CRUD on products and solutions

### Admin Users
- No changes (already had full access)

## 📝 Documentation Updated

- Added `deploy/RELEASE_PROCESS.md` - Standard release workflow
- Added `deploy/QUICK_DEPLOY_GUIDE.md` - Quick reference
- Added `deploy/testing-checklist.md` - Testing procedures
- Added `PASSWORD_SECURITY_BACKUPS.md` - Backup security info
- Updated `DEPLOYMENT_CONSISTENCY_GUIDE.md`

## 🐛 Known Issues

None.

## 🔮 Future Improvements

- Add automated testing pipeline
- Implement CI/CD for automatic deployments
- Add database migration versioning
- Create user acceptance testing (UAT) environment

---

**Built on**: centos1.rajarora.csslab  
**Deployed to**: centos2.rajarora.csslab  
**Status**: ✅ Ready for Production
