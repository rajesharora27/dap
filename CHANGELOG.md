# Changelog

All notable changes to the DAP (Demo Application Platform) project are documented in this file.

## [1.2.0] - 2025-10-16

### Customer Adoption Plan Enhancements

#### 🔄 Sync Improvements
- **ENHANCED**: Sync automatically includes ALL product outcomes and releases
- **FIXED**: Sync button now properly updates customer adoption plans with latest product changes
- **IMPROVED**: Backend auto-includes related entities without manual selection

#### 🔢 Sequence Number Management
- **FIXED**: Task deletion now properly renumbers remaining tasks
- **ADDED**: Inline sequence number editing in task list view
- **IMPLEMENTED**: Two-phase update approach to prevent unique constraint violations
- **ENHANCED**: Transaction-safe sequence reordering using temporary negative values

#### 📚 HowTo Documentation Features
- **ADDED**: `howToDoc` field for documentation links
- **ADDED**: `howToVideo` field for video tutorial links
- **IMPLEMENTED**: Clickable Material-UI icons (Article, OndemandVideo)
- **ENHANCED**: Professional icon buttons with tooltips in task list and details dialog

#### 🎨 UX Improvements
- **IMPROVED**: Task list view with progressive disclosure (description on hover only)
- **REMOVED**: Unnecessary chips and badges for cleaner interface
- **FIXED**: Product menu now auto-expands on click
- **ENHANCED**: Hover effects showing task descriptions

#### 🔄 Outcome Synchronization
- **FIXED**: Outcome mutations now properly refetch across all components
- **ADDED**: 'Outcomes' to refetchQueries in shared handlers
- **ENHANCED**: Cache consistency across ProductDetailPage and DataManager
- **IMPROVED**: Real-time outcome updates visible everywhere

### Technical Improvements

#### 🐛 Bug Fixes
- **FIXED**: GraphQL 400 errors by adding subfields to queries
- **FIXED**: Unique constraint violations during sequence editing
- **FIXED**: Task deletion not updating GUI immediately
- **FIXED**: Outcome changes not syncing to adoption plans
- **FIXED**: Product menu requiring double-click to expand

#### 🏗️ Architecture Enhancements
- **REFACTORED**: Sequence management with two-phase approach
- **IMPLEMENTED**: Apollo cache eviction and garbage collection
- **ENHANCED**: Coordinated refetchQueries across components
- **IMPROVED**: Transaction safety in sequence updates

#### 🧹 Code Quality
- **REMOVED**: 28+ test/debug scripts from root directory
- **ORGANIZED**: Moved all test files to `/tests` directory
- **CLEANED**: Log files moved to appropriate locations
- **CONSOLIDATED**: 100+ documentation files into comprehensive guides
- **VERIFIED**: 0 TypeScript errors across all modified files

#### 📚 Documentation
- **CREATED**: Comprehensive FEATURES.md documenting all capabilities
- **UPDATED**: CHANGELOG.md with detailed change history
- **IMPROVED**: README.md with production-ready overview
- **ORGANIZED**: Documentation into clear, maintainable structure

### Files Modified

#### Backend
- `backend/src/schema/resolvers/customerAdoption.ts` - Enhanced sync functionality
- `backend/src/schema/resolvers/index.ts` - Sequence management and deletion queue

#### Frontend
- `frontend/src/components/CustomerAdoptionPanelV4.tsx` - HowTo features, icons, UX improvements
- `frontend/src/utils/sharedHandlers.ts` - Outcome refetch coordination
- `frontend/src/components/ProductDetailPage.tsx` - Outcome sync fixes
- `frontend/src/pages/App.tsx` - Product menu, sequence editing, cache management

### Migration Notes

#### Upgrading from 1.1.0 to 1.2.0

1. **Database**: No schema changes required - all changes are code-only
2. **GraphQL**: No API breaking changes - only enhancements
3. **Dependencies**: Run `npm install` in both frontend and backend to ensure latest packages
4. **Cache**: Clear browser cache to see UI improvements

#### New Features Available
- HowTo documentation links in task dialogs
- Inline sequence number editing in task lists
- Improved sync behavior for adoption plans
- Professional Material-UI icons throughout

## [1.1.0] - 2025-10-07

### Documentation & Release Packaging

- 🧹 Removed 70+ legacy ad-hoc testing scripts, archived shell utilities, and exported spreadsheet artifacts
- 🗂️ Deleted committed build outputs (`backend/dist`, `frontend/dist`) and expanded `.gitignore` to block regenerated assets
- 📄 Pruned stale documentation in favor of a concise documentation index in `README.md`
- 🧭 Updated `DAP-MANAGEMENT.md` to reflect the single `./dap` entrypoint
- 📝 Refreshed README project structure section with current layout and documentation links
- 📘 Added `ARCHITECTURE.md` capturing tier responsibilities, data flows, and schema snapshot
- 🏷️ Bumped frontend and backend package versions to `1.1.0`

## [1.0.0] - 2025-09-27

### Release Highlights

- 🎯 Completed the TestStudio sunset and refocused navigation around core task workflows
- 🪪 Introduced the three-tier licensing model with updated validations and sample data
- 🪟 Adopted dedicated dialogs for license and outcome management to streamline editing
- � Expanded developer documentation and migration guidance for the new architecture

### Major Changes

#### 🗑️ TestStudio Removal
- **REMOVED**: Complete TestStudio functionality and UI components
- **REMOVED**: All TestStudio React components and backup files
- **REMOVED**: TestStudio navigation menu item and routing
- **REMOVED**: Test scripts and CSV files created by GUI TestStudio
- **UPDATED**: Documentation to remove TestStudio references
- **IMPACT**: Streamlined application focusing on core business functionality

#### 🏷️ License System Overhaul
- **CHANGED**: License levels from 5 tiers to 3-tier system
- **NEW LEVELS**: 
  - Level 1: Essential (previously Basic)
  - Level 2: Advantage (previously Standard) 
  - Level 3: Signature (previously Premium)
- **REMOVED**: Enterprise and Ultimate license levels
- **UPDATED**: Validation to only allow levels 1-3
- **UPDATED**: All test files and sample data to use new license names

#### 🎯 Task-Centric Navigation
- **CHANGED**: Tasks is now the first submenu under Products (previously 5th)
- **NEW ORDER**: Tasks → Main → Licenses → Outcomes → Custom Attributes
- **CHANGED**: Default view when selecting products now shows Tasks instead of Main
- **UPDATED**: All product selection handlers to default to Tasks submenu
- **UPDATED**: Breadcrumb logic to prioritize Tasks in conditional rendering

#### 🪟 Separate Dialog Architecture
- **REFACTORED**: ProductDialog to use separate windows for license/outcome management
- **REMOVED**: Inline license/outcome creation forms from ProductDialog
- **ADDED**: Dedicated LicenseDialog and OutcomeDialog for add/edit operations
- **REMOVED**: Required license level functionality (no longer needed)
- **IMPROVED**: Consistent UI pattern matching custom attributes design
- **ENHANCED**: Click-to-edit functionality for existing licenses and outcomes

### Technical Improvements

#### 🧹 Code Cleanup
- **REMOVED**: 50+ unused test and debug script files
- **REMOVED**: Backup files (.backup, .bak, .old extensions)
- **REMOVED**: Log files and temporary files from repository
- **REMOVED**: Unused CSV test data files
- **CLEANED**: Project structure for better maintainability

#### 📚 Documentation Updates
- **UPDATED**: README.md with current architecture and features
- **ADDED**: Comprehensive API examples and usage patterns
- **UPDATED**: License level documentation throughout project
- **ADDED**: Development setup and project structure information
- **CREATED**: This CHANGELOG.md for version tracking

#### 🏗️ Architecture Enhancements
- **IMPROVED**: Modular dialog component architecture
- **ENHANCED**: Separation of concerns between components
- **OPTIMIZED**: Bundle size by removing unused TestStudio components
- **STREAMLINED**: Navigation flow for better user experience

### Migration & Compatibility

#### ✅ Backward Compatibility
- **MAINTAINED**: All existing database schemas and data
- **PRESERVED**: GraphQL API endpoints and functionality
- **KEPT**: Sample data using Essential/Advantage/Signature naming
- **ENSURED**: Existing license level data remains valid (levels 1-3)

#### 🚀 Storage Optimization
- **COMPLETED**: Migration to /data partition (documented in STORAGE_MIGRATION_DOCUMENTATION.md)
- **ACHIEVED**: 6% reduction in root partition usage
- **OPTIMIZED**: Container storage and NPM cache relocated
- **IMPROVED**: System resource utilization

### Developer Experience

#### 🛠️ Enhanced Development Workflow
- **SIMPLIFIED**: Project structure with fewer files to maintain
- **IMPROVED**: Build times by removing unused components
- **ENHANCED**: Code readability with better component separation
- **STREAMLINED**: Testing by removing redundant test files

#### 📦 Build & Deployment
- **VERIFIED**: All changes build successfully without TypeScript errors
- **TESTED**: Application starts and runs correctly after all modifications
- **VALIDATED**: Core functionality remains intact after major refactoring
- **CONFIRMED**: No broken imports or missing component references

## Previous Versions

### [1.x.x] - Pre-September 2025
- Initial DAP application development
- TestStudio implementation and testing
- 5-tier license system implementation
- Storage migration to /data partition
- Core product/task management functionality

---

## Migration Guide

### Upgrading from 1.0.0 to 1.1.0

1. **Clean Local Artifacts**: Remove deleted scripts, spreadsheets, and generated `dist` folders from local clones to match the repository cleanup.
2. **Adopt Unified Entrypoint**: Update internal runbooks and automation to use the consolidated `./dap` command documented in `DAP-MANAGEMENT.md`.
3. **Refresh Tooling**: Reinstall dependencies if you pin package versions so tooling captures the `1.1.0` metadata bump.

#### Compatibility Notes for 1.1.0
- No database schema, GraphQL API, or environment variable changes were introduced.
- Runtime behavior remains unchanged; the release focuses on documentation and repository hygiene.

### Upgrading from pre-1.0 to 1.0.0

1. **License Levels**: If you have custom code referencing license levels 4-5, update to use levels 1-3
2. **TestStudio**: Remove any external references to TestStudio components or endpoints
3. **Navigation**: Update any hardcoded navigation logic expecting 'main' as default to use 'tasks'
4. **Dialogs**: If extending ProductDialog, note the new separate dialog architecture

### Breaking Changes in 1.0.0
- TestStudio components and routes no longer available
- License levels 4 and 5 no longer supported in validation
- Default product submenu changed from 'main' to 'tasks'
- ProductDialog no longer includes inline license/outcome forms

### Non-Breaking Changes in 1.0.0
- All GraphQL APIs remain compatible
- Database schemas unchanged
- Existing data remains valid
- Core functionality preserved