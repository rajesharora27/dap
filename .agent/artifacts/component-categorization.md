# Component Categorization Analysis

**Total Components:** 79 files

---

## SHARED COMPONENTS (Move to `shared/components/`)

### UI Primitives / Common (Already in common/)
- ✅ `common/FAIcon.tsx` → `shared/components/FAIcon.tsx`
- ✅ `common/InlineEditableText.tsx` → `shared/components/InlineEditableText.tsx`

### Layout & Infrastructure
- ✅ `ErrorBoundary.tsx` → `shared/components/ErrorBoundary.tsx`
- ✅ `ThemeSelector.tsx` → `shared/components/ThemeSelector.tsx`
- ✅ `ApolloClientProvider.tsx` → Keep in lib/ or shared/lib/

### Shared Feature Components
- ✅ `shared/AdoptionTaskTable.tsx` → `shared/components/AdoptionTaskTable.tsx`
- ✅ `shared/TaskDetailsDialog.tsx` → `shared/components/TaskDetailsDialog.tsx`
- ✅ `shared/Telemetry ImportResultDialog.tsx` → `shared/components/TelemetryImportResultDialog.tsx`

### Sortable/DnD Components
- ✅ `SortableAttributeItem.tsx` → `shared/components/SortableAttributeItem.tsx`
- ✅ `SortableTaskItem.tsx` → `shared/components/SortableTaskItem.tsx`

**Total Shared: ~10 components**

---

## FEATURE-SPECIFIC COMPONENTS

### PRODUCTS Feature → `features/products/components/`
- `ProductManagement.tsx`
- `ProductsPanel.tsx`
- `dialogs/ProductDialog.tsx`
- `dialogs/ProductPreviewDialog.tsx`
- `dialogs/AssignProductDialog.tsx`

**Total: 5 components**

---

### SOLUTIONS Feature → `features/solutions/components/`
- `SolutionsPanel.tsx`
- `SolutionProductList.tsx`
- `SolutionTaskManagement.tsx`
- `dialogs/SolutionDialog.tsx`
- `dialogs/SolutionPreviewDialog.tsx`
- `dialogs/SolutionReleaseDialog.tsx`
- `dialogs/AssignSolutionDialog.tsx`
- `solution-adoption/ProductAdoptionGroup.tsx`
- `solution-adoption/SolutionAdoptionPlanView.tsx`
- `solution-adoption/SolutionTasksGroup.tsx`

**Total: 10 components**

---

### CUSTOMERS Feature → `features/customers/components/`
- `CustomerDetailView.tsx`
- `CustomerSolutionPanel.tsx`
- `CustomerAdoptionPanelV4.tsx`
- `dialogs/CustomerDialog.tsx`
- `dialogs/CustomerPreviewDialog.tsx`
- `dialogs/CustomerTelemetryDialog.tsx`

**Total: 6 components**

---

### ADOPTION PLANS Feature → `features/adoption-plans/components/`
- `dialogs/AdoptionPlanDialog.tsx`
- (Shared with customers/solutions - might need refactoring)

**Total: 1 component**

---

### LICENSES Feature → `features/licenses/components/`
- `dialogs/LicenseDialog.tsx`
- `dialogs/EditEntitlementsDialog.tsx`
- `dialogs/EditSolutionEntitlementsDialog.tsx`

**Total: 3 components**

---

### RELEASES Feature → `features/releases/components/`
- `dialogs/ReleaseDialog.tsx`

**Total: 1 component**

---

### OUTCOMES Feature → `features/outcomes/components/`
- `dialogs/OutcomeDialog.tsx`

**Total: 1 component**

---

### TASKS Feature → `features/tasks/components/`
- `dialogs/TaskDialog.tsx`
- `dialogs/TaskPreviewDialog.tsx`

**Total: 2 components**

---

### TAGS Feature → `features/tags/components/`
- `dialogs/TagDialog.tsx`

**Total: 1 component**

---

### TELEMETRY Feature → `features/telemetry/components/`
- `TelemetryPanel.tsx`
- `TelemetryDatabasePanel.tsx`
- `telemetry/TelemetryConfiguration.tsx`

**Total: 3 components**

---

### AI ASSISTANT Feature → `features/ai-assistant/components/`
- `AIChat.tsx`
- `ai/DataTable.tsx`
- `ai/QueryResultDisplay.tsx`
- `ai/SuggestionChips.tsx`

**Total: 4 components**

---

### AUTH Feature → `features/auth/components/`
- `LoginPage.tsx`
- `AuthBar.tsx`
- `AuthContext.tsx` (might move to lib/)
- `UserManagement.tsx`
- `RoleManagement.tsx`
- `UserProfileDialog.tsx`

**Total: 6 components**

---

### BACKUPS Feature → `features/backups/components/`
- `BackupManagementPanel.tsx`

**Total: 1 component**

---

### AUDIT Feature → `features/audit/components/`
- `AuditPanel.tsx`
- `ChangeSetsPanel.tsx`

**Total: 2 components**

---

### IMPORT-WIZARD Feature → `features/import-wizard/components/`
- `CsvPanel.tsx` (Product/Solution CSV import)

**Total: 1 component**

---

### DEV TOOLS Feature → `features/dev-tools/components/` (or keep separate?)
- `dev/AdvancedPanels.tsx`
- `dev/APITestingPanel.tsx`
- `dev/BuildDeployPanel.tsx`
- `dev/CodeQualityPanel.tsx`
- `dev/DatabaseManagementPanel.tsx`
- `dev/DevelopmentCICDPanel.tsx`
- `dev/DevelopmentDocsPanel.tsx`
- `dev/DevToolsConnectionTest.tsx`
- `dev/EnhancedAPITestingPanel.tsx`
- `dev/EnhancedBuildDeployPanel.tsx`
- `dev/EnhancedGitPanel.tsx`
- `dev/EnvironmentPanel.tsx`
- `dev/LogsViewerPanel.tsx`
- `dev/TestPanelNew.tsx`

**Total: 14 components** (Keep in dev/ or move?)

---

### MISCELLANEOUS / PAGES
- `AboutPage.tsx` → Move to pages/
- `DataManager.tsx` → Feature or page?
- `DependenciesPanel.tsx` → Feature?
- `EntitySummary.tsx` → Shared?
- `HelpDialog.tsx` → Shared?
- `SampleDataSeeder.tsx` → Dev tools?
- `SearchPanel.tsx` → Shared or Feature?
- `dialogs/CustomAttributeDialog.tsx` → Shared (used by Products & Solutions)

**Total: 8 components** (needs review)

---

## SUMMARY

| Category | Count |
|----------|-------|
| Shared Components | 10 |
| Products | 5 |
| Solutions | 10 |
| Customers | 6 |
| AI Assistant | 4 |
| Auth | 6 |
| Telemetry | 3 |
| Tasks | 2 |
| Licenses | 3 |
| Audit | 2 |
| Backups | 1 |
| Tags | 1 |
| Releases | 1 |
| Outcomes | 1 |
| Adoption Plans | 1 |
| Import Wizard | 1 |
| Dev Tools | 14 |
| Miscellaneous | 8 |
| **TOTAL** | **79** |

---

## MIGRATION PRIORITY

### Phase 1: Shared Components (HIGH)
Move the 10-12 truly shared components first

### Phase 2: Products Feature (TEMPLATE)
Migrate Products completely as template (5 components + hooks + GraphQL)

### Phase 3: Solutions Feature
Second feature (10 components + hooks + GraphQL)

### Phase 4: Customers Feature
Third feature (6 components + hooks + GraphQL)

### Phase 5: Remaining Features
Batch migrate smaller features

### Phase 6: Dev Tools
Decide whether to migrate or keep separate
