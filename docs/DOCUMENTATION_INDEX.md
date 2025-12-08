# DAP Documentation Index

**Last Updated:** December 6, 2025

This document serves as the central index for all DAP (Digital Adoption Platform) documentation. All documentation is now consolidated in the `/docs` folder for easier navigation and maintenance.

## 📖 Quick Navigation

- [**Getting Started**](#getting-started) - New to DAP? Start here
- [**User Guides**](#user-guides) - How to use DAP features
- [**Technical Documentation**](#technical-documentation) - Architecture, API, and implementation details
- [**Deployment**](#deployment) - Installation, configuration, and deployment guides
- [**Development**](#development) - Contributing and development workflow
- [**Testing**](#testing) - Test coverage and test documentation
- [**Operations**](#operations) - Administration, backup, and troubleshooting
- [**Status Reports & Analysis**](#status-reports--analysis) - Project analysis and recommendations
- [**Phases & Progress**](#phases--progress) - Implementation phases and milestones
- [**Releases**](#releases) - Release notes and delivery packages
- [**Archive**](#archive) - Historical documentation and old guides

---

## 📁 Documentation Structure

```
/docs
├── DOCUMENTATION_INDEX.md       # This file - Central navigation
├── README.md                    # Documentation overview
│
├── /deployment                  # Deployment guides
├── /deployment-history          # Historical deployment records
├── /development                 # Development toolkit docs
├── /guides                      # User and admin guides
├── /phases                      # Implementation phase reports
├── /rbac                        # Role-based access control
├── /releases-docs               # Release notes and packages
├── /status-reports              # Analysis and recommendations
├── /testing                     # Test coverage documentation
└── /archive                     # Historical/deprecated docs
```

---

## Getting Started

Perfect for new users and team members getting familiar with DAP.

| Document | Description | Location |
|----------|-------------|----------|
| **README** | Project overview, quick start, and basic commands | [/README.md](/README.md) |
| **Quick Start Guide** | Get DAP running in minutes | [/QUICK_START.md](/QUICK_START.md) |
| **Features Overview** | Complete list of DAP capabilities | [FEATURES.md](./FEATURES.md) |
| **Context Document** | Comprehensive application overview for AI assistants and developers | [/CONTEXT.md](/CONTEXT.md) |

---

## User Guides

Learn how to use specific DAP features effectively.

### Core Features

| Document | Description | Location |
|----------|-------------|----------|
| **Products Management** | Creating and managing products | See main [README](/README.md#key-concepts) |
| **Solutions Management** | Bundling products into solutions | See main [README](/README.md#solutions) |
| **Customer Adoption** | Tracking customer adoption plans | See main [README](/README.md#adoption-plans) |
| **Telemetry Tracking** | Setting up and using telemetry features | See main [README](/README.md#telemetry) |

### Guides

| Document | Description | Location |
|----------|-------------|----------|
| **Access Guide** | System access guide | [guides/ACCESS_GUIDE.md](./guides/ACCESS_GUIDE.md) |
| **Backup & Restore Guide** | Complete backup/restore procedures | [guides/BACKUP_AND_RESTORE_GUIDE.md](./guides/BACKUP_AND_RESTORE_GUIDE.md) |
| **Sample Product Guide** | How to use sample products | [guides/SAMPLE_PRODUCT_GUIDE.md](./guides/SAMPLE_PRODUCT_GUIDE.md) |
| **Quick Reference** | Quick reference for critical operations | [/QUICK_REFERENCE.md](/QUICK_REFERENCE.md) |

---

## Technical Documentation

In-depth technical information for developers and architects.

### Architecture & Design

| Document | Description | Location |
|----------|-------------|----------|
| **Architecture Overview** | System design and component architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Technical Documentation** | Complete API documentation and technical details | [TECHNICAL-DOCUMENTATION.md](./TECHNICAL-DOCUMENTATION.md) |
| **Context Document** | Comprehensive domain model and design decisions | [/CONTEXT.md](/CONTEXT.md) |

### Security & Authentication

| Document | Description | Location |
|----------|-------------|----------|
| **Auth Design** | Authentication system design and architecture | [AUTH_DESIGN.md](./AUTH_DESIGN.md) |
| **Auth Implementation Guide** | Detailed authentication implementation | [AUTH_IMPLEMENTATION_GUIDE.md](./AUTH_IMPLEMENTATION_GUIDE.md) |
| **Auth Implementation Summary** | Quick overview of auth system | [AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md) |
| **Session Management** | Session handling and security | [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) |
| **Session Security Implementation** | Session security implementation details | [SESSION_SECURITY_IMPLEMENTATION.md](./SESSION_SECURITY_IMPLEMENTATION.md) |
| **Security Quick Reference** | Quick security best practices | [SECURITY_QUICK_REFERENCE.md](./SECURITY_QUICK_REFERENCE.md) |
| **Backup & Restore Security** | Security considerations for backups | [BACKUP_RESTORE_SECURITY.md](./BACKUP_RESTORE_SECURITY.md) |

### RBAC (Role-Based Access Control)

| Document | Description | Location |
|----------|-------------|----------|
| **Password Security Backups** | RBAC password security | [rbac/PASSWORD_SECURITY_BACKUPS.md](./rbac/PASSWORD_SECURITY_BACKUPS.md) |
| **RBAC Patch Summary** | RBAC patch documentation | [rbac/PATCH_SUMMARY.md](./rbac/PATCH_SUMMARY.md) |

### AI Agent Integration

| Document | Description | Location |
|----------|-------------|----------|
| **AI Agent Feature** | AI agent feature documentation | [AI_AGENT_FEATURE.md](./AI_AGENT_FEATURE.md) |
| **AI Agent Quick Start** | Quick start for AI agents | [AI_AGENT_QUICK_START.md](./AI_AGENT_QUICK_START.md) |
| **AI Agent Implementation Tracker** | AI agent implementation tracking | [AI_AGENT_IMPLEMENTATION_TRACKER.md](./AI_AGENT_IMPLEMENTATION_TRACKER.md) |

---

## Deployment

Everything you need to deploy and configure DAP.

### Installation & Setup

| Document | Description | Location |
|----------|-------------|----------|
| **Production Deployment** | Complete production deployment guide | [/deploy/README.md](/deploy/README.md) |
| **Apache Subpath Deployment** | Deploying behind Apache with subpath | [APACHE_SUBPATH_DEPLOYMENT.md](./APACHE_SUBPATH_DEPLOYMENT.md) |
| **DAP Management Script** | Using the `./dap` management script | [DAP-MANAGEMENT.md](./DAP-MANAGEMENT.md) |
| **Environment Management** | Managing development/production environments | [ENVIRONMENT_MANAGEMENT.md](./ENVIRONMENT_MANAGEMENT.md) |

### Deployment Guides

| Document | Description | Location |
|----------|-------------|----------|
| **Deployment Index** | Deployment documentation overview | [deployment/DEPLOYMENT_INDEX.md](./deployment/DEPLOYMENT_INDEX.md) |
| **Complete Deployment Guide** | Comprehensive deployment guide | [deployment/DEPLOYMENT_COMPLETE_GUIDE.md](./deployment/DEPLOYMENT_COMPLETE_GUIDE.md) |
| **Apache Quickstart** | Quick Apache deployment setup | [deployment/APACHE_DEPLOYMENT_QUICKSTART.md](./deployment/APACHE_DEPLOYMENT_QUICKSTART.md) |
| **Deployment Consistency Guide** | Ensuring deployment consistency | [deployment/DEPLOYMENT_CONSISTENCY_GUIDE.md](./deployment/DEPLOYMENT_CONSISTENCY_GUIDE.md) |
| **Production Deployment Package** | Production deployment package | [deployment/PRODUCTION_DEPLOYMENT_PACKAGE.md](./deployment/PRODUCTION_DEPLOYMENT_PACKAGE.md) |
| **Production Deployment Summary** | Production deployment summary | [deployment/PRODUCTION_DEPLOYMENT_SUMMARY.md](./deployment/PRODUCTION_DEPLOYMENT_SUMMARY.md) |

### Deployment History

| Document | Description | Location |
|----------|-------------|----------|
| **Production Deployment (Dec 2025)** | Latest production deployment summary | [deployment-history/PRODUCTION_DEPLOYMENT_20251202.md](./deployment-history/PRODUCTION_DEPLOYMENT_20251202.md) |
| **Deployment Success** | Recent deployment success summary | [deployment-history/DEPLOYMENT_SUCCESS.txt](./deployment-history/DEPLOYMENT_SUCCESS.txt) |
| **Deployment Complete (Dec 2025)** | Complete deployment details | [deployment-history/DEPLOYMENT_COMPLETE_DEC2025.txt](./deployment-history/DEPLOYMENT_COMPLETE_DEC2025.txt) |

---

## Development

Resources for developers contributing to DAP.

### Getting Started with Development

| Document | Description | Location |
|----------|-------------|----------|
| **Developer Onboarding** | Quick start for new developers | [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md) |
| **Contributing Guide** | Contribution guidelines and workflow | [/CONTRIBUTING.md](/CONTRIBUTING.md) |
| **Development Speed Optimization** | Development workflow optimizations | [DEV_SPEED_OPTIMIZATION.md](./DEV_SPEED_OPTIMIZATION.md) |

### Development Toolkit

| Document | Description | Location |
|----------|-------------|----------|
| **Complete Dev Toolkit Guide** | Complete development toolkit documentation | [development/COMPLETE_DEV_TOOLKIT_GUIDE.md](./development/COMPLETE_DEV_TOOLKIT_GUIDE.md) |
| **Development Menu Guide** | Using the development menu | [development/DEVELOPMENT_MENU_GUIDE.md](./development/DEVELOPMENT_MENU_GUIDE.md) |
| **Development Menu Integration** | Development menu integration details | [development/DEVELOPMENT_MENU_INTEGRATION.md](./development/DEVELOPMENT_MENU_INTEGRATION.md) |
| **Dev Toolkit Ready** | Development toolkit readiness summary | [development/DEV_TOOLKIT_READY.md](./development/DEV_TOOLKIT_READY.md) |
| **Ultimate Dev Toolkit** | Ultimate developer toolkit guide | [development/ULTIMATE_DEV_TOOLKIT.md](./development/ULTIMATE_DEV_TOOLKIT.md) |
| **Dev Menu Complete Summary** | Dev menu complete implementation | [development/DEV_MENU_COMPLETE_SUMMARY.md](./development/DEV_MENU_COMPLETE_SUMMARY.md) |
| **Dev Panels Verification** | Development panels verification | [development/DEV_PANELS_VERIFICATION.md](./development/DEV_PANELS_VERIFICATION.md) |
| **Future Git Panel Enhancement** | Future git panel enhancement plans | [development/FUTURE_GIT_PANEL_ENHANCEMENT.md](./development/FUTURE_GIT_PANEL_ENHANCEMENT.md) |

### Refactoring & Code Quality

| Document | Description | Location |
|----------|-------------|----------|
| **Refactoring Summary** | Recent refactoring work summary | [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) |
| **Refactoring Strategy** | Refactoring approach and strategy | [REFACTORING_STRATEGY.md](./REFACTORING_STRATEGY.md) |
| **Refactoring Walkthrough: Products** | Products refactoring walkthrough | [REFACTORING_WALKTHROUGH_PRODUCTS.md](./REFACTORING_WALKTHROUGH_PRODUCTS.md) |

---

## Testing

Test coverage and testing documentation.

| Document | Description | Location |
|----------|-------------|----------|
| **Test Coverage Complete** | 70% test coverage achievement | [testing/TEST_COVERAGE_COMPLETE.md](./testing/TEST_COVERAGE_COMPLETE.md) |
| **Final Test Coverage** | Final test coverage summary | [testing/FINAL_TEST_COVERAGE.md](./testing/FINAL_TEST_COVERAGE.md) |
| **Comprehensive Test Summary** | Complete test suite documentation | [testing/COMPREHENSIVE_TEST_SUMMARY.md](./testing/COMPREHENSIVE_TEST_SUMMARY.md) |
| **Test Coverage Plan** | Test coverage implementation plan | [testing/TEST_COVERAGE_PLAN.md](./testing/TEST_COVERAGE_PLAN.md) |
| **Test Results v2.1.2** | Version 2.1.2 test results | [testing/TEST_RESULTS_v2.1.2.md](./testing/TEST_RESULTS_v2.1.2.md) |
| **Testing Backup Restore** | Backup/restore testing guide | [guides/TESTING_BACKUP_RESTORE.md](./guides/TESTING_BACKUP_RESTORE.md) |

---

## Operations

Administration, maintenance, and troubleshooting.

### Administration

| Document | Description | Location |
|----------|-------------|----------|
| **Admin User Management** | User and role management guide | [ADMIN_USER_MANAGEMENT.md](./ADMIN_USER_MANAGEMENT.md) |
| **Backup & Restore Guide** | Complete backup and restore procedures | [guides/BACKUP_AND_RESTORE_GUIDE.md](./guides/BACKUP_AND_RESTORE_GUIDE.md) |

### Troubleshooting & Support

| Document | Description | Location |
|----------|-------------|----------|
| **Troubleshooting Runbook** | Common issues and solutions | [TROUBLESHOOTING_RUNBOOK.md](./TROUBLESHOOTING_RUNBOOK.md) |
| **Client Troubleshooting** | Client-side troubleshooting guide | [guides/CLIENT_TROUBLESHOOTING.md](./guides/CLIENT_TROUBLESHOOTING.md) |
| **Recovery Guide** | Disaster recovery procedures | [guides/RECOVERY_GUIDE.md](./guides/RECOVERY_GUIDE.md) |
| **Firewall Commands** | Firewall command reference | [guides/FIREWALL_COMMANDS.md](./guides/FIREWALL_COMMANDS.md) |

### Bug Fixes & Improvements

| Document | Description | Location |
|----------|-------------|----------|
| **PM2 Restart Fix** | PM2 restart issue resolution | [PM2_RESTART_FIX.md](./PM2_RESTART_FIX.md) |
| **PM2 User Context Fix** | PM2 user context issue resolution | [PM2_USER_CONTEXT_FIX.md](./PM2_USER_CONTEXT_FIX.md) |
| **Solution Adoption Fix** | Solution adoption tracking fix | [SOLUTION_ADOPTION_FIX.md](./SOLUTION_ADOPTION_FIX.md) |
| **Data Fix: SASE (Dec 2, 2025)** | SASE data fix details | [DATA_FIX_SASE_20251202.md](./DATA_FIX_SASE_20251202.md) |
| **Restart Verification (Dec 2, 2025)** | Service restart verification | [RESTART_VERIFICATION_20251202.md](./RESTART_VERIFICATION_20251202.md) |

---

## Status Reports & Analysis

Project analysis, recommendations, and verification reports.

| Document | Description | Location |
|----------|-------------|----------|
| **Comprehensive Analysis** | Complete codebase analysis with recommendations | [status-reports/COMPREHENSIVE_ANALYSIS.md](./status-reports/COMPREHENSIVE_ANALYSIS.md) |
| **Executive Summary** | High-level improvements overview | [status-reports/EXECUTIVE_SUMMARY.md](./status-reports/EXECUTIVE_SUMMARY.md) |
| **Improvement Recommendations** | Detailed improvement recommendations | [status-reports/IMPROVEMENT_RECOMMENDATIONS.md](./status-reports/IMPROVEMENT_RECOMMENDATIONS.md) |
| **Critical Improvements Plan** | Critical improvements plan | [status-reports/CRITICAL_IMPROVEMENTS_PLAN.md](./status-reports/CRITICAL_IMPROVEMENTS_PLAN.md) |
| **Documentation Structure** | Documentation structure overview | [status-reports/DOCUMENTATION_STRUCTURE.md](./status-reports/DOCUMENTATION_STRUCTURE.md) |
| **Session Security Verification** | Session security verification | [status-reports/SESSION_SECURITY_VERIFICATION.md](./status-reports/SESSION_SECURITY_VERIFICATION.md) |
| **Build Issue and Solution** | Build issue documentation | [status-reports/BUILD_ISSUE_AND_SOLUTION.md](./status-reports/BUILD_ISSUE_AND_SOLUTION.md) |

---

## Phases & Progress

Implementation phases and milestone documentation.

| Document | Description | Location |
|----------|-------------|----------|
| **Phase 2: Error Tracking** | Sentry error tracking implementation | [phases/PHASE2_SUMMARY.md](./phases/PHASE2_SUMMARY.md) |
| **Phase 4: Performance** | Performance optimization with DataLoader | [phases/PHASE4_SUMMARY.md](./phases/PHASE4_SUMMARY.md) |
| **Phase 5: CI/CD** | GitHub Actions CI/CD pipeline | [phases/PHASE5_SUMMARY.md](./phases/PHASE5_SUMMARY.md) |
| **Implementation Progress** | Overall implementation progress | [phases/IMPLEMENTATION_PROGRESS.md](./phases/IMPLEMENTATION_PROGRESS.md) |
| **100% Complete** | 100% completion milestone | [phases/100_PERCENT_COMPLETE.md](./phases/100_PERCENT_COMPLETE.md) |
| **Final Summary** | Final implementation summary | [phases/FINAL_SUMMARY.md](./phases/FINAL_SUMMARY.md) |
| **Option B Completion Summary** | Option B completion summary | [phases/OPTION_B_COMPLETION_SUMMARY.md](./phases/OPTION_B_COMPLETION_SUMMARY.md) |

---

## Releases

Release notes, delivery packages, and version documentation.

| Document | Description | Location |
|----------|-------------|----------|
| **Changelog** | Complete version history and changes | [/CHANGELOG.md](/CHANGELOG.md) |
| **Release Notes v2.1.2** | Version 2.1.2 release notes | [releases-docs/RELEASE_NOTES_v2.1.2.md](./releases-docs/RELEASE_NOTES_v2.1.2.md) |
| **Delivery Package v2.1.2** | Version 2.1.2 delivery package | [releases-docs/DELIVERY_PACKAGE_v2.1.2.md](./releases-docs/DELIVERY_PACKAGE_v2.1.2.md) |
| **Deployment Checklist v2.1.2** | Version 2.1.2 deployment checklist | [releases-docs/DEPLOYMENT_CHECKLIST_v2.1.2.md](./releases-docs/DEPLOYMENT_CHECKLIST_v2.1.2.md) |
| **Issue Fixes v2.1.2** | Version 2.1.2 issue fixes | [releases-docs/ISSUE_FIXES_v2.1.2.md](./releases-docs/ISSUE_FIXES_v2.1.2.md) |
| **Release System Test Results** | Release system test results | [releases-docs/RELEASE_SYSTEM_TEST_RESULTS.md](./releases-docs/RELEASE_SYSTEM_TEST_RESULTS.md) |
| **Robust Release Complete** | Robust release system completion | [releases-docs/ROBUST_RELEASE_COMPLETE.md](./releases-docs/ROBUST_RELEASE_COMPLETE.md) |

---

## Archive

Historical and deprecated documentation.

| Document | Description | Location |
|----------|-------------|----------|
| **Archive Directory** | Old documentation and historical files | [archive/](./archive/) |
| **Archive README** | Archive overview | [archive/README.md](./archive/README.md) |

---

## 🎯 Most Common Documentation Paths

### For New Users
1. Start with [README.md](/README.md)
2. Follow [QUICK_START.md](/QUICK_START.md)
3. Review [FEATURES.md](./FEATURES.md)

### For Developers
1. Read [CONTEXT.md](/CONTEXT.md)
2. Follow [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)
3. Review [CONTRIBUTING.md](/CONTRIBUTING.md)
4. Check [ARCHITECTURE.md](./ARCHITECTURE.md)

### For DevOps/Deployment
1. Start with [deploy/README.md](/deploy/README.md)
2. Review deployment guides in [deployment/](./deployment/)
3. Check [APACHE_SUBPATH_DEPLOYMENT.md](./APACHE_SUBPATH_DEPLOYMENT.md) if using Apache

### For Troubleshooting
1. Check [TROUBLESHOOTING_RUNBOOK.md](./TROUBLESHOOTING_RUNBOOK.md)
2. Review [guides/CLIENT_TROUBLESHOOTING.md](./guides/CLIENT_TROUBLESHOOTING.md)
3. Consult [guides/RECOVERY_GUIDE.md](./guides/RECOVERY_GUIDE.md) for critical issues

---

## 📝 Documentation Standards

All DAP documentation follows these standards:

- **Markdown Format**: All documentation uses GitHub-flavored Markdown
- **Consolidated Location**: All documentation should be in `/docs` (except essential root files)
- **Clear Headers**: Use descriptive headers with emoji where appropriate
- **Table of Contents**: Include TOC for documents > 200 lines
- **Code Examples**: Provide working code examples with syntax highlighting
- **Last Updated**: Include last updated date at the top
- **Cross-References**: Link to related documentation

---

## 🔄 Keeping Documentation Updated

To update this index:

1. Add new documentation to the appropriate section
2. Update the "Last Updated" date at the top
3. Follow the existing format for consistency
4. Test all links to ensure they work
5. Keep descriptions concise but informative

---

**Questions or Missing Documentation?** Please open an issue or contact the development team.
