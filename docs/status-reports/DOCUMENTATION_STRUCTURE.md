# Documentation Structure - DAP Application

**Last Updated**: December 1, 2025  
**Version**: 2.1.1

---

## 📋 Quick Access

| Document | Purpose | Location |
|----------|---------|----------|
| **CONTEXT.md** | Complete application context (START HERE) | `/data/dap/CONTEXT.md` |
| **README.md** | Project overview and introduction | `/data/dap/README.md` |
| **QUICK_START.md** | Quick setup guide | `/data/dap/QUICK_START.md` |
| **CHANGELOG.md** | Version history | `/data/dap/CHANGELOG.md` |

---

## 📁 Root Directory (Essential Docs Only)

```
/data/dap/
├── CONTEXT.md              ← Complete application context (ESSENTIAL)
├── README.md               ← Project overview
├── QUICK_START.md          ← Quick setup guide
├── CHANGELOG.md            ← Version history
├── docs/                   ← All other documentation
└── deploy/                 ← Deployment scripts and guides
```

---

## 📚 Documentation Directory Structure

### `/docs/` - Main Documentation

**Current Implementation Guides:**
- `ADMIN_USER_MANAGEMENT.md` - User and role management
- `APACHE_SUBPATH_DEPLOYMENT.md` - Apache deployment
- `ARCHITECTURE.md` - System architecture
- `AUTH_DESIGN.md` - Authentication design
- `AUTH_IMPLEMENTATION_GUIDE.md` - Auth implementation
- `AUTH_IMPLEMENTATION_SUMMARY.md` - Auth summary
- `BACKUP_RESTORE_SECURITY.md` - Backup security
- `DAP-MANAGEMENT.md` - DAP management guide
- `FEATURES.md` - Feature documentation
- `SECURITY_QUICK_REFERENCE.md` - Security quick ref
- `SESSION_MANAGEMENT.md` - Session management
- `SESSION_SECURITY_IMPLEMENTATION.md` - Session security
- `TECHNICAL-DOCUMENTATION.md` - Technical details
- `README.md` - Documentation index

### `/docs/deployment/` - Deployment Documentation

- `DEPLOYMENT_INDEX.md` - Master deployment navigation
- `DEPLOYMENT_CONSISTENCY_GUIDE.md` - Dev/prod consistency
- `DEPLOYMENT_COMPLETE_GUIDE.md` - Complete deployment guide
- `PRODUCTION_DEPLOYMENT_PACKAGE.md` - Production packaging
- `PRODUCTION_DEPLOYMENT_SUMMARY.md` - Latest deployment status
- `APACHE_DEPLOYMENT_QUICKSTART.md` - Apache quick start

**See also**: `/data/dap/deploy/` for deployment scripts

### `/docs/guides/` - User & Admin Guides

- `ACCESS_GUIDE.md` - Accessing the application
- `BACKUP_AND_RESTORE_GUIDE.md` - Backup & restore operations
- `CLIENT_TROUBLESHOOTING.md` - Troubleshooting guide
- `FIREWALL_COMMANDS.md` - Firewall configuration
- `RECOVERY_GUIDE.md` - System recovery procedures
- `SAMPLE_PRODUCT_GUIDE.md` - Creating sample products
- `TESTING_BACKUP_RESTORE.md` - Testing backup/restore

### `/docs/rbac/` - RBAC & Security

- `PASSWORD_SECURITY_BACKUPS.md` - Password security in backups
- `PATCH_SUMMARY.md` - December 2025 RBAC patch details

### `/docs/releases/` - Release Notes

- `RELEASE_NOTES_DEC2025.md` - December 2025 (v2.1.1) release notes
- `COMPLETION_REPORT.md` - RBAC fixes completion report

### `/docs/archive/` - Historical Documentation

- `fixes-2025/` - Historical bug fixes (integrated into CONTEXT.md)
- `auth-implementation/` - RBAC implementation history
- `systemd/` - Old systemd service documentation
- `rbac-fixes-dec-2025/` - Temporary RBAC fix docs

**Note**: Archives are kept for reference only. Always check main documentation first.

---

## 🚀 Deploy Directory Structure

### `/deploy/` - Deployment Scripts & Docs

**Scripts:**
- `create-release.sh` - Create versioned release package
- `release-to-prod.sh` - Deploy release to production

**Documentation:**
- `RELEASE_PROCESS.md` - Complete release workflow
- `QUICK_DEPLOY_GUIDE.md` - Quick deployment reference
- `testing-checklist.md` - Pre-deployment testing
- `README.md` - Deployment directory index

**Config:**
- `config/` - Environment-specific configurations

---

## 🔍 Finding Information

### By Task

| I want to... | Read This |
|-------------|-----------|
| **Understand the entire system** | `CONTEXT.md` |
| **Set up development** | `QUICK_START.md` |
| **Deploy to production** | `deploy/RELEASE_PROCESS.md` |
| **Troubleshoot issues** | `docs/guides/CLIENT_TROUBLESHOOTING.md` |
| **Understand RBAC** | `CONTEXT.md` (Auth section) |
| **Backup/restore** | `docs/guides/BACKUP_AND_RESTORE_GUIDE.md` |
| **See what changed** | `CHANGELOG.md` |
| **Learn architecture** | `docs/ARCHITECTURE.md` |

### By Role

**Developers:**
1. `CONTEXT.md` - Complete system understanding
2. `QUICK_START.md` - Setup development environment
3. `docs/ARCHITECTURE.md` - System design
4. `docs/TECHNICAL-DOCUMENTATION.md` - Implementation details

**Operators/DevOps:**
1. `deploy/RELEASE_PROCESS.md` - How to deploy
2. `deploy/QUICK_DEPLOY_GUIDE.md` - Quick reference
3. `docs/guides/BACKUP_AND_RESTORE_GUIDE.md` - Backups
4. `docs/guides/RECOVERY_GUIDE.md` - System recovery

**End Users:**
1. `README.md` - What is DAP?
2. `docs/guides/ACCESS_GUIDE.md` - How to access
3. `docs/FEATURES.md` - What can it do?

---

## 📐 Documentation Principles

### 1. Single Source of Truth
**CONTEXT.md** is the master document containing:
- Complete application state
- RBAC details
- Deployment process
- Recent changes
- Known issues

All other documentation supplements or provides detail on specific topics.

### 2. Hierarchical Organization

```
Root Level: Essential docs (CONTEXT, README, QUICK_START, CHANGELOG)
  ↓
docs/ Level: Organized by category (deployment, guides, rbac, releases)
  ↓
archive/ Level: Historical reference only
```

### 3. Update Policy

**Always update when:**
- Making significant changes → Update `CONTEXT.md`
- Adding features → Update `CHANGELOG.md` and relevant guides
- Fixing bugs → Update `CHANGELOG.md` and `CONTEXT.md`
- Changing architecture → Update `ARCHITECTURE.md` and `CONTEXT.md`
- Creating releases → Add to `docs/releases/`

---

## 🗂️ What Was Cleaned Up (December 2025)

### Removed from Root

**Temporary files:**
- `APPLY_PATCH_NOW.txt`
- `DEPLOYMENT_SUMMARY.txt`
- `ACCESSIBLE_URLS.txt`
- `INSTALL_AUTOSTART.txt`
- `DOCUMENTATION_INDEX.md` (replaced by `docs/README.md`)

**Redundant documentation:**
- `EXECUTIVE_PACKAGE.md`
- `EXECUTIVE_SUMMARY.md`
- `EXECUTIVE_PRESENTATION.md`
- `PRESENTATION_GUIDE.md`
- `PRESENTATION_VISUALS.md`
- `ROLE_BASED_MENU_FIX.md` (info in CONTEXT.md)
- `TELEMETRY_DELETION_FIX.md` (info in CONTEXT.md)
- `AUTO_BACKUP_FEATURE.md` (info in CONTEXT.md)
- `THEME_ENHANCEMENTS.md`
- `THEME_SELECTOR.md`
- `SERVICE_README.md`
- `DOCUMENTATION_CLEANUP_SUMMARY.md`

### Archived in docs/archive/

**Historical fix documentation (33 files):**
- All `*_FIX.md` files → `archive/fixes-2025/`
- Auth implementation docs → `archive/auth-implementation/`
- Systemd docs → `archive/systemd/`
- Temporary RBAC docs → `archive/rbac-fixes-dec-2025/`

### Result

**Root directory**: 4 essential markdown files only  
**docs/ directory**: Organized into logical categories  
**Total cleanup**: 50+ files removed or archived

---

## 📝 Contributing

### When Adding New Documentation

1. **Determine category:**
   - Deployment → `docs/deployment/`
   - User guide → `docs/guides/`
   - Security/RBAC → `docs/rbac/`
   - Release notes → `docs/releases/`
   - Core docs → `docs/` root

2. **Update indexes:**
   - Add entry to `docs/README.md`
   - Update this file if structure changes
   - Mention in `CONTEXT.md` if significant

3. **Follow format:**
   - Clear title and date
   - Purpose/overview section
   - Related documents links
   - Next steps/actions

4. **Keep `CONTEXT.md` as master:**
   - Major changes → Update `CONTEXT.md`
   - Specific details → Separate guide
   - Don't duplicate, reference

---

## 🎯 Best Practices

### For AI Assistants

1. **Start with `CONTEXT.md`** - It has everything
2. **Update `CONTEXT.md`** for significant changes
3. **Follow release process** in `deploy/RELEASE_PROCESS.md`
4. **Test all RBAC roles** before deployment
5. **Document in `CHANGELOG.md`**
6. **Don't create temporary docs** in root

### For Developers

1. **Read `CONTEXT.md` first**
2. **Follow `QUICK_START.md` for setup**
3. **Reference `ARCHITECTURE.md` for design**
4. **Test locally before deploying**
5. **Update docs when changing features**

---

## ✅ Documentation Health Check

Run this checklist periodically:

- [ ] `CONTEXT.md` is up to date with current state
- [ ] `CHANGELOG.md` reflects latest version
- [ ] `docs/README.md` index is accurate
- [ ] No temporary files in root directory
- [ ] Release notes created for new versions
- [ ] Archives cleaned of very old content (>1 year)
- [ ] Deployment docs reflect current process
- [ ] All links in docs work

---

**Last Cleanup**: December 1, 2025  
**Next Review**: March 1, 2026  
**Maintainer**: Development Team

