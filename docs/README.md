# DAP Documentation Index

**Last Updated**: December 1, 2025

This directory contains all technical documentation for the DAP (Digital Adoption Platform) application.

---

## 📋 Quick Navigation

| Document | Location | Description |
|----------|----------|-------------|
| **Context** | `../CONTEXT.md` | Complete application context (START HERE) |
| **README** | `../README.md` | Main project readme |
| **Quick Start** | `../QUICK_START.md` | Quick setup guide |
| **Changelog** | `../CHANGELOG.md` | Version history |

---

## 📁 Documentation Structure

### 📦 `/docs/deployment/` - Deployment & Release

| File | Description |
|------|-------------|
| `DEPLOYMENT_INDEX.md` | Master deployment navigation |
| `DEPLOYMENT_CONSISTENCY_GUIDE.md` | Maintaining dev/prod consistency |
| `PRODUCTION_DEPLOYMENT_PACKAGE.md` | Production deployment package guide |
| `PRODUCTION_DEPLOYMENT_SUMMARY.md` | Latest deployment status |
| `APACHE_DEPLOYMENT_QUICKSTART.md` | Apache configuration quick start |

**See also**: `../deploy/` directory for deployment scripts

### 📖 `/docs/guides/` - User & Admin Guides

| File | Description |
|------|-------------|
| `ACCESS_GUIDE.md` | Accessing the application |
| `CLIENT_TROUBLESHOOTING.md` | Troubleshooting guide |
| `FIREWALL_COMMANDS.md` | Firewall configuration |
| `RECOVERY_GUIDE.md` | System recovery procedures |
| `BACKUP_AND_RESTORE_GUIDE.md` | Backup & restore operations |
| `TESTING_BACKUP_RESTORE.md` | Testing backup/restore functionality |
| `SAMPLE_PRODUCT_GUIDE.md` | Creating sample products |

### 🔐 `/docs/rbac/` - RBAC & Security

| File | Description |
|------|-------------|
| `PASSWORD_SECURITY_BACKUPS.md` | Password security in backups |
| `PATCH_SUMMARY.md` | December 2025 RBAC patch details |
| `SECURITY_QUICK_REFERENCE.md` | Security quick reference |
| `SESSION_SECURITY_IMPLEMENTATION.md` | Session security |
| `BACKUP_RESTORE_SECURITY.md` | Backup/restore security |

### 📦 `/docs/releases/` - Release Notes

| File | Description |
|------|-------------|
| `RELEASE_NOTES_DEC2025.md` | December 2025 (v2.1.1) release notes |
| `COMPLETION_REPORT.md` | RBAC fixes completion report |

### 🏗️ `/docs/` - Architecture & Features

| File | Description |
|------|-------------|
| `ARCHITECTURE.md` | System architecture overview |
| `FEATURES.md` | Feature documentation |
| `TECHNICAL-DOCUMENTATION.md` | Technical implementation details |
| `DAP-MANAGEMENT.md` | DAP management guide |

### 🔧 `/docs/archive/` - Historical Documentation

- Old fix documentation
- Superseded guides
- Historical implementation notes

---

## 🚀 Common Tasks

### I want to...

**Deploy to production:**
1. Read: `../deploy/RELEASE_PROCESS.md`
2. Quick ref: `../deploy/QUICK_DEPLOY_GUIDE.md`
3. Or run: `cd /data/dap && ./deploy/release-to-prod.sh`

**Understand RBAC:**
1. Read: `../CONTEXT.md` (Authentication & Authorization section)
2. Security: `rbac/PASSWORD_SECURITY_BACKUPS.md`
3. Latest fixes: `rbac/PATCH_SUMMARY.md`

**Set up development environment:**
1. Read: `../QUICK_START.md`
2. Then: `../CONTEXT.md` (Development Workflow section)

**Troubleshoot issues:**
1. Client issues: `guides/CLIENT_TROUBLESHOOTING.md`
2. Recovery: `guides/RECOVERY_GUIDE.md`
3. System logs: Check `../CONTEXT.md` for log locations

**Backup/restore database:**
1. Guide: `guides/BACKUP_AND_RESTORE_GUIDE.md`
2. Security: `rbac/PASSWORD_SECURITY_BACKUPS.md`
3. Testing: `guides/TESTING_BACKUP_RESTORE.md`

---

## 📖 Documentation Best Practices

### For AI Assistants

1. **Always start with `CONTEXT.md`** - It contains the complete application state
2. **Update `CONTEXT.md`** when making significant changes
3. **Follow the release process** in `deploy/RELEASE_PROCESS.md`
4. **Test with all RBAC roles** before deployment
5. **Document changes in `CHANGELOG.md`**

### For Developers

1. **Read `CONTEXT.md` first** - Understand the system
2. **Follow `QUICK_START.md`** for setup
3. **Check `ARCHITECTURE.md`** for design patterns
4. **Test locally** before pushing to production
5. **Update documentation** when adding features

### For Operators

1. **Deployment**: Use scripts in `deploy/` directory
2. **Monitoring**: See `CONTEXT.md` for log locations
3. **Backup**: Follow `guides/BACKUP_AND_RESTORE_GUIDE.md`
4. **Troubleshooting**: Check `guides/CLIENT_TROUBLESHOOTING.md`

---

## 🔍 Finding Documentation

### By Topic

| Topic | Primary Document |
|-------|------------------|
| **Overview** | `../CONTEXT.md` |
| **Setup** | `../QUICK_START.md` |
| **Architecture** | `ARCHITECTURE.md` |
| **Features** | `FEATURES.md` |
| **RBAC** | `../CONTEXT.md` (Auth section) |
| **Deployment** | `../deploy/RELEASE_PROCESS.md` |
| **Security** | `rbac/PASSWORD_SECURITY_BACKUPS.md` |
| **Troubleshooting** | `guides/CLIENT_TROUBLESHOOTING.md` |

### By Role

**Developers:**
- `../CONTEXT.md` - Complete context
- `ARCHITECTURE.md` - System design
- `TECHNICAL-DOCUMENTATION.md` - Implementation details
- `../QUICK_START.md` - Development setup

**Operators:**
- `../deploy/RELEASE_PROCESS.md` - Deployment
- `guides/BACKUP_AND_RESTORE_GUIDE.md` - Backups
- `guides/RECOVERY_GUIDE.md` - Recovery
- `deployment/PRODUCTION_DEPLOYMENT_SUMMARY.md` - Status

**End Users:**
- `../README.md` - Introduction
- `guides/ACCESS_GUIDE.md` - Accessing the app
- `guides/SAMPLE_PRODUCT_GUIDE.md` - Sample data

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Place it in the right folder:**
   - Deployment topics → `deployment/`
   - How-to guides → `guides/`
   - Security/RBAC → `rbac/`
   - Release notes → `releases/`
   - Architecture/design → root `docs/`

2. **Update this README** to include the new document

3. **Update `../CONTEXT.md`** if it's a significant change

4. **Use clear titles** and include:
   - Date created/updated
   - Purpose/overview
   - Related documents
   - Next steps

5. **Follow markdown conventions:**
   - Use headers (##, ###)
   - Include code blocks with language tags
   - Add links to related docs

---

## 🗂️ Archive Policy

Documents are moved to `archive/` when:
- Superseded by newer documentation
- Feature is removed
- Information is integrated into `CONTEXT.md`
- Historical reference only

Archives are kept for:
- Historical context
- Troubleshooting old issues
- Reference for future work

---

## 📞 Support

**Questions about documentation?**
- Check `../CONTEXT.md` first
- Review relevant guide in `guides/`
- Check `../CHANGELOG.md` for recent changes

**Found an issue?**
- Update the document
- Update this index if structure changes
- Keep `../CONTEXT.md` in sync

---

**Version**: 2.1.1  
**Last Review**: December 1, 2025  
**Status**: Current

