# DAP Documentation

**Last Updated**: December 6, 2025  
**Version**: 2.1.2

This directory contains all technical documentation for the DAP (Digital Adoption Platform) application. All documentation has been consolidated here for easier navigation and maintenance.

---

## 📋 Quick Navigation

| Document | Description |
|----------|-------------|
| [**DOCUMENTATION_INDEX.md**](./DOCUMENTATION_INDEX.md) | Complete documentation index with all links |
| [**CONTEXT.md**](/CONTEXT.md) | Complete application context (START HERE) |
| [**README.md**](/README.md) | Main project readme |
| [**QUICK_START.md**](/QUICK_START.md) | Quick setup guide |
| [**CHANGELOG.md**](/CHANGELOG.md) | Version history |

---

## 📁 Documentation Structure

```
/docs
├── DOCUMENTATION_INDEX.md       # ⭐ Complete navigation index
├── README.md                    # This file
│
├── /archive                     # Historical/deprecated documentation
├── /deployment                  # Deployment configuration guides
├── /deployment-history          # Historical deployment records
├── /development                 # Development toolkit & menu docs
├── /guides                      # User and admin guides
├── /phases                      # Implementation phase reports
├── /rbac                        # Role-based access control
├── /releases-docs               # Release notes and delivery packages
├── /status-reports              # Analysis and recommendations
└── /testing                     # Test coverage documentation
```

---

## 📦 Subdirectories

### `/deployment` - Deployment Configuration
Guides for setting up and configuring deployment environments.
- Apache configuration
- Production deployment packages
- Deployment consistency guides

### `/deployment-history` - Historical Deployments
Records of past production deployments for reference.

### `/development` - Development Toolkit
Documentation for the development menu and toolkit.
- Development menu guide
- Dev panels documentation
- Future enhancement plans

### `/guides` - User & Admin Guides
How-to guides for users and administrators.
- Access and authentication
- Backup and restore procedures
- Troubleshooting guides
- Recovery procedures

### `/phases` - Implementation Phases
Documentation of implementation phases and milestones.
- Phase 2: Error Tracking (Sentry)
- Phase 4: Performance (DataLoader)
- Phase 5: CI/CD Pipeline

### `/rbac` - Security & RBAC
Role-based access control and security documentation.
- Password security
- RBAC patches

### `/releases-docs` - Release Documentation
Version-specific release documentation.
- Release notes
- Delivery packages
- Deployment checklists

### `/status-reports` - Analysis & Reports
Project analysis and status reports.
- Comprehensive analysis
- Improvement recommendations
- Security verifications

### `/testing` - Testing Documentation
Test coverage and testing guides.
- Test coverage reports
- Test plans
- Test results

### `/archive` - Historical Documentation
Old and superseded documentation kept for reference.

---

## 🚀 Common Tasks

### I want to...

**Deploy to production:**
1. Read: [deploy/README.md](/deploy/README.md)
2. Check: [deployment/DEPLOYMENT_INDEX.md](./deployment/DEPLOYMENT_INDEX.md)
3. Or run: `cd /data/dap && ./deploy-to-production.sh`

**Understand RBAC:**
1. Read: [/CONTEXT.md](/CONTEXT.md) (Authentication & Authorization section)
2. Security: [rbac/PASSWORD_SECURITY_BACKUPS.md](./rbac/PASSWORD_SECURITY_BACKUPS.md)
3. Latest fixes: [rbac/PATCH_SUMMARY.md](./rbac/PATCH_SUMMARY.md)

**Set up development environment:**
1. Read: [/QUICK_START.md](/QUICK_START.md)
2. Then: [/CONTEXT.md](/CONTEXT.md) (Development Workflow section)
3. Toolkit: [development/COMPLETE_DEV_TOOLKIT_GUIDE.md](./development/COMPLETE_DEV_TOOLKIT_GUIDE.md)

**Troubleshoot issues:**
1. Client issues: [guides/CLIENT_TROUBLESHOOTING.md](./guides/CLIENT_TROUBLESHOOTING.md)
2. Recovery: [guides/RECOVERY_GUIDE.md](./guides/RECOVERY_GUIDE.md)
3. System logs: Check [/CONTEXT.md](/CONTEXT.md) for log locations

**Backup/restore database:**
1. Guide: [guides/BACKUP_AND_RESTORE_GUIDE.md](./guides/BACKUP_AND_RESTORE_GUIDE.md)
2. Security: [BACKUP_RESTORE_SECURITY.md](./BACKUP_RESTORE_SECURITY.md)
3. Testing: [guides/TESTING_BACKUP_RESTORE.md](./guides/TESTING_BACKUP_RESTORE.md)

---

## 📖 Documentation Best Practices

### For AI Assistants

1. **Always start with `CONTEXT.md`** - It contains the complete application state
2. **Use `DOCUMENTATION_INDEX.md`** for full navigation
3. **Update documentation** when making significant changes
4. **Follow the release process** in `deploy/` directory
5. **Test with all RBAC roles** before deployment

### For Developers

1. **Read `CONTEXT.md` first** - Understand the system
2. **Follow `QUICK_START.md`** for setup
3. **Check `ARCHITECTURE.md`** for design patterns
4. **Use development toolkit** for efficient workflow
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
| **Overview** | [/CONTEXT.md](/CONTEXT.md) |
| **Setup** | [/QUICK_START.md](/QUICK_START.md) |
| **Architecture** | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Features** | [FEATURES.md](./FEATURES.md) |
| **RBAC** | [/CONTEXT.md](/CONTEXT.md) (Auth section) |
| **Deployment** | [deployment/](./deployment/) |
| **Security** | [rbac/](./rbac/) |
| **Troubleshooting** | [guides/CLIENT_TROUBLESHOOTING.md](./guides/CLIENT_TROUBLESHOOTING.md) |
| **Testing** | [testing/](./testing/) |
| **Development Toolkit** | [development/](./development/) |

### By Role

**Developers:**
- [/CONTEXT.md](/CONTEXT.md) - Complete context
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md) - Getting started
- [development/](./development/) - Development toolkit

**Operators:**
- [deployment/](./deployment/) - Deployment guides
- [guides/BACKUP_AND_RESTORE_GUIDE.md](./guides/BACKUP_AND_RESTORE_GUIDE.md) - Backups
- [guides/RECOVERY_GUIDE.md](./guides/RECOVERY_GUIDE.md) - Recovery

**End Users:**
- [/README.md](/README.md) - Introduction
- [guides/ACCESS_GUIDE.md](./guides/ACCESS_GUIDE.md) - Accessing the app
- [guides/SAMPLE_PRODUCT_GUIDE.md](./guides/SAMPLE_PRODUCT_GUIDE.md) - Sample data

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Place it in the right folder:**
   - Deployment topics → `deployment/`
   - How-to guides → `guides/`
   - Security/RBAC → `rbac/`
   - Release notes → `releases-docs/`
   - Testing → `testing/`
   - Development → `development/`
   - Architecture/features → root `docs/`

2. **Update `DOCUMENTATION_INDEX.md`** to include the new document

3. **Update `/CONTEXT.md`** if it's a significant change

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
- Check [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) for complete navigation
- Review [/CONTEXT.md](/CONTEXT.md) for system overview
- Check [/CHANGELOG.md](/CHANGELOG.md) for recent changes

**Found an issue?**
- Update the document
- Update `DOCUMENTATION_INDEX.md` if structure changes
- Keep `/CONTEXT.md` in sync

---

**Version**: 2.1.2  
**Last Review**: December 6, 2025  
**Status**: Current
