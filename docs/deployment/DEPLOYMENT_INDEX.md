# Deployment Index - Quick Navigation

## 🚀 For Current RBAC Patch Deployment

**To deploy the current RBAC fixes to production RIGHT NOW:**

```bash
cd /data/dap
./APPLY_RBAC_PATCH.sh
```

This applies all the RBAC fixes from December 1, 2025 to centos2.

---

## 📚 For Future Releases

### Standard Process

1. **Read First**: `deploy/RELEASE_PROCESS.md` - Complete workflow
2. **Create Release**: `./deploy/create-release.sh`
3. **Deploy**: `./deploy/release-to-prod.sh releases/release-*.tar.gz`

### Quick Reference

- **Quick Deploy Guide**: `deploy/QUICK_DEPLOY_GUIDE.md`
- **Testing Checklist**: `deploy/testing-checklist.md`
- **Release Notes**: `RELEASE_NOTES_DEC2025.md`

---

## 🎯 What Was Fixed (December 2025)

| Issue | Status |
|-------|--------|
| CSS user can't see products dropdown | ✅ Fixed |
| CSS user can't see solutions dropdown | ✅ Fixed |
| SME user can't delete tasks | ✅ Fixed |
| Dialog buttons covered by dropdowns | ✅ Fixed |
| Debug logs in production | ✅ Removed |

---

## 📦 Deployment Options

### Option 1: Quick Patch (Current RBAC Fixes)
```bash
./APPLY_RBAC_PATCH.sh
```
**Use when**: Applying focused bug fixes  
**Time**: 3-5 minutes

### Option 2: Standard Release (Future Updates)
```bash
./deploy/create-release.sh
./deploy/release-to-prod.sh releases/release-*.tar.gz
```
**Use when**: Regular feature releases  
**Time**: 5-10 minutes

### Option 3: Manual (If Scripts Fail)
See: `deploy/QUICK_DEPLOY_GUIDE.md` → "Manual Deployment"  
**Use when**: Automation fails  
**Time**: 10-15 minutes

---

## 🔐 Security Notes

✅ **Passwords excluded from backups** - See `PASSWORD_SECURITY_BACKUPS.md`  
✅ **Existing passwords preserved** - During restore operations  
✅ **No credentials in release packages** - Safe to share/store

---

## 📊 Server Information

| Environment | Server | URL |
|------------|--------|-----|
| **DEV** | centos1.rajarora.csslab | http://dev.rajarora.csslab/dap/ |
| **PROD** | centos2.rajarora.csslab | https://myapps.cxsaaslab.com/dap/ |

---

## 🆘 Emergency Procedures

### If Deployment Fails

1. **Don't panic**
2. Check logs: `tail -f /data/dap/backend.log`
3. Rollback: See `deploy/RELEASE_PROCESS.md` → "Rollback Procedure"
4. Restore backup if needed

### If Production is Down

1. SSH to centos2: `ssh rajarora@centos2.rajarora.csslab`
2. Check status: `cd /data/dap && ./dap status`
3. Restart: `./dap restart`
4. Check logs: `tail -100 backend.log`

---

## 📁 File Structure

```
/data/dap/
├── deploy/
│   ├── RELEASE_PROCESS.md          ← Standard workflow
│   ├── QUICK_DEPLOY_GUIDE.md       ← Quick reference
│   ├── testing-checklist.md         ← Pre-deploy tests
│   ├── create-release.sh            ← Create release package
│   └── release-to-prod.sh           ← Deploy to prod
│
├── APPLY_RBAC_PATCH.sh              ← Current patch (Dec 2025)
├── DEPLOYMENT_INDEX.md              ← This file
├── RELEASE_NOTES_DEC2025.md         ← Current release notes
├── PATCH_SUMMARY.md                 ← Patch details
│
└── releases/
    └── release-*.tar.gz             ← Release packages
```

---

## ✅ Checklist for Current Deployment

- [ ] Code tested in DEV (centos1) ✅ Done
- [ ] Debug logs removed ✅ Done  
- [ ] Documentation updated ✅ Done
- [ ] Release notes created ✅ Done
- [ ] Deployment script ready ✅ Done
- [ ] **Next: Run `./APPLY_RBAC_PATCH.sh`** ⏳

---

**Quick Start**: `./APPLY_RBAC_PATCH.sh`  
**Full Process**: See `deploy/RELEASE_PROCESS.md`  
**Questions**: Review docs in `deploy/` directory

