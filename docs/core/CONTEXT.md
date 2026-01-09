# DAP Application Context

## Recent Changes (January 8, 2026)

### Session Summary: My Products Adoption Progress & UI Consistency (v3.10.0)
This session focused on aligning the "My Products" personal sandbox experience with customer adoption plans, ensuring visual and functional consistency across telemetry operations, and deploying all changes to production.

### Key Changes

#### 1. My Products: Adoption Progress Card (Identical to Adoption Plans)
**Goal:** Unify the progress display between "My Products" and customer adoption plans.

**Changes:**
- Renamed "Implementation Progress" to "Adoption Progress" in My Products
- Added `AdoptionPlanProgressCard` component above the tabs (below product dropdown)
- Progress calculation now uses weight-based formula identical to adoption plans:
  - Excludes `NOT_APPLICABLE` tasks from calculation
  - Uses task weights for weighted completion percentage
  - Falls back to simple count-based % if no weights defined
- Displays task counts (Completed / Total) identical to adoption plans

**Files Modified:**
- `frontend/src/features/my-diary/components/PersonalProductsTab.tsx`
- `frontend/src/features/my-diary/components/PersonalProductTasksTab.tsx`
- `frontend/src/features/tasks/components/TasksTabContent.tsx`

#### 2. Manual Status Update Tracking
**Goal:** Track when task status is changed manually vs. via telemetry import.

**Changes:**
- When a task status is updated manually (via UI), `statusUpdateSource` is set to `'MANUAL'`
- Previously, manual updates didn't set this field, making it unclear how the status changed

**Files Modified:**
- `backend/src/modules/personal-product/personal-product.service.ts`

#### 3. Telemetry Button Styling (Green Outlined Border)
**Goal:** Visually distinguish telemetry import/export buttons with consistent styling.

**Changes:**
- All telemetry import/export `IconButton` components now use green outlined border (unfilled)
- Styling: `border: '1px solid'`, `borderColor: 'success.main'`, `color: 'success.main'`
- Applied consistently across:
  - My Products
  - Customer Products Assigned
  - Customer Solutions Assigned
  - Product Adoption Groups
  - Solution Tasks Groups

**Files Modified:**
- `frontend/src/features/my-diary/components/PersonalProductsTab.tsx`
- `frontend/src/features/customers/components/CustomerProductsTab.tsx`
- `frontend/src/features/adoption-plans/components/ProductAdoptionGroup.tsx`
- `frontend/src/features/adoption-plans/components/SolutionTasksGroup.tsx`

#### 4. Telemetry Status Chip Styling (Green Outlined)
**Goal:** Make "TELEMETRY" status indicator visually consistent with Adoption Tasks.

**Changes:**
- Updated `getUpdateSourceChipColor()` to return appropriate colors:
  - `'TELEMETRY'` → `'success'` (green outlined)
  - `'MANUAL'` → `'primary'` (blue outlined)
  - `'IMPORT'` → `'info'` (info blue outlined)
- `SortableTaskItem` now uses `variant="outlined"` for the status chip

**Files Modified:**
- `frontend/src/shared/theme/statusStyles.ts`
- `frontend/src/features/tasks/components/SortableTaskItem.tsx`

#### 5. Unique Product Naming on Catalog Copy
**Goal:** Prevent name collisions when copying products from catalog to personal sandbox.

**Changes:**
- `copyGlobalProductToPersonal` now auto-generates unique names
- If "Product Name" exists, creates "Product Name (2)", "Product Name (3)", etc.
- The newly copied product is automatically selected in the UI

**Files Modified:**
- `backend/src/modules/personal-product/personal-product.service.ts`
- `frontend/src/features/my-diary/components/PersonalProductsTab.tsx`
- `frontend/src/features/my-diary/components/AssignFromCatalogDialog.tsx`

#### 6. Production Deployment
All changes successfully deployed to production (dapoc.cisco.com) using `./deploy-to-production.sh`.

---

### Previous Session: RBAC Strict Mode & Default Settings Optimization
This session focused on validating RBAC enforcement for custom roles and optimizing default application settings for production use.

### Key Changes

#### 1. Default Settings Changed for Production-Ready Defaults
**Goal:** Ensure sensible defaults that prioritize security and functionality out-of-the-box.

**Changes:**
| Setting | Old Default | New Default | Rationale |
|---------|-------------|-------------|-----------|
| `rbac.default.user.read.all` | `true` | `false` | Strict RBAC by default - users only see what their roles grant |
| `ai.enabled` | `false` | `true` | AI features enabled by default |
| `rate.limit.enabled` | `true` | `false` | Rate limiting disabled for development convenience |

**Files Modified:**
- `backend/src/modules/settings/settings.service.ts` - Updated `INITIAL_SETTINGS` defaults
- `backend/src/config/env.ts` - Updated environment config fallbacks

#### 2. RBAC Validation for Custom Roles
**Issue:** User reported SME role (configured for Products and Solutions only) was also seeing Customers.

**Root Cause:** The `rbac.default.user.read.all` setting was `true`, which grants READ access to all Products, Solutions, AND Customers regardless of role permissions.

**Resolution:** Setting `rbac.default.user.read.all` to `false` enforces strict RBAC where users only see resources explicitly granted by their roles.

**How RBAC Works:**
- When `rbac.default.user.read.all = true`: All users get READ access to everything (convenience mode)
- When `rbac.default.user.read.all = false`: Users only see resources their roles explicitly grant (strict mode)
- WRITE/ADMIN permissions always require explicit role grants regardless of this setting

---

## Previous Changes (January 6, 2026)

### Session Summary - Part 3: Task Creation Reliability, Test Determinism, and Customer Overview UX
This session focused on eliminating a task creation failure affecting both Products and Solutions, making the backend test environment deterministic, improving the Customers → Overview UI to visually distinguish solution-derived product assignments, and documenting a common MacBook “blank screen” root cause.

### Session Summary - Part 5: User Activity Detail Refinement & Comprehensive Auditing (v3.9.0)
This session focused on refining the detail display in the User Activity module and ensuring comprehensive auditing across all shared business entities. Key achievements include the implementation of detailed user login lists in the Login Statistics tab, robust entity name resolution for change logs, and the expansion of audit logging to include Tag management and other critical service operations.

### Session Summary - Part 4: Restoring Activity, Sessions, and RBAC Baseline (v3.8.0)
This session focused on restoring the User Activity Tracking and Session Inactivity features that were recently reverted, hardening the RBAC model with a "default read-all" flag, and standardizing action icon colors based on product source. This culminates in the **v3.8.0** minor release.

### Key Changes

#### 1. Task Creation: Support `licenseId` + Partial Inputs (Products & Solutions)
**Problem:** Creating a task from the UI could fail with Prisma errors such as:
- `Unknown argument productId. Did you mean product?`
- `Unknown argument licenseId`

**Root Cause:**
- In Prisma, `Task` does **not** store a `licenseId` foreign key. The `license` field is derived from `(productId | solutionId) + licenseLevel`.
- Some code paths were still using scalar FK-style writes instead of relation `connect`.
- Task creation also required `sequenceNumber`, but the UI does not always send it (backend should default it).

**Solution:**
- Backend now maps `licenseId → licenseLevel` at task creation time and validates the license belongs to the task’s product/solution.
- If `sequenceNumber` is not provided, backend assigns the next available sequence number automatically.
- Test factory task creation uses Prisma relation connect for product binding to match current schema.

**Files Modified:**
- `backend/src/modules/task/task.service.ts`
- `backend/src/__tests__/factories/TestFactory.ts`

**New Tests:**
- `backend/src/__tests__/integration/graphql-tasks-create.test.ts` (creates Product + Solution tasks with `licenseId`)

#### 2. Jest Test Determinism (No More Env Drift)
**Problem:** Some test runs depended on the caller’s shell env (e.g., missing/short `JWT_SECRET`) and Prisma could log *after* Jest finished due to background `$connect()` promises.

**Solution:**
- `backend/src/__tests__/setup.ts` now ensures:
  - Tests default to the isolated `dap_test` DB (and refuse non-test DBs).
  - `JWT_SECRET` is always present and valid length (generated in-process, no hardcoded credentials).
- Prisma “auto connect + console log” is disabled during Jest runs to avoid “Cannot log after tests are done” warnings.

**Files Modified:**
- `backend/src/__tests__/setup.ts`
- `backend/src/shared/graphql/context.ts`

#### 3. Customers → Overview: Make Solution-Derived Products Blue
**Problem:** In Customers → Overview, product assignments that originate from a solution were not visually distinct from direct product assignments.

**Solution:**
- In `CustomerAssignmentsTable`, product rows with `source === 'solution'` now render with the blue theme (matching solutions) so users can instantly tell “assigned via solution” vs “direct”.

**Files Modified:**
- `frontend/src/features/customers/components/CustomerAssignmentsTable.tsx`

#### 4. MacBook “Blank Screen” After Rebuild: Asset 404 Root Cause
**Symptom:** Browser console shows 404s for hashed bundles like:
- `index-<hash>.js`, `vendor-<hash>.js`

**Common Root Causes:**
- **Stale cached `index.html`** pointing to older hashed bundles that no longer exist.
- **Base-path mismatch**: serving the SPA under `/dap/` while the HTML references `/assets/...` at the origin root.

**Recommended Fixes:**
- Hard refresh with cache disabled in DevTools.
- Ensure `VITE_BASE_PATH` is correct for the way the app is served (root vs `/dap/`).

#### 5. Production Deployment Note (dapoc)
Latest patches were deployed to production (`dapoc`) using `./deploy-to-production.sh` and verified via post-deploy smoke checks (GraphQL + frontend bundle served).

#### 6. Admin User Management: Fix CreateUser Contract Drift + VIEWER Visibility
**Problem:** The “Add User” dialog and frontend mutation payload drifted from the backend GraphQL schema, causing a 400 error:
- `Field "password" of required type "String!" was not provided`
- `Field "isAdmin" is not defined by type "CreateUserInput"`

**Solution:**
- Frontend “Add User” now sends `password` and `role` (instead of `isAdmin`) to match `CreateUserInput`.
- Backend `createUser` derives `isAdmin` from `role`, removes password length restrictions, and defaults `mustChangePassword=false` for admin-created accounts.
- VIEWER role navigation visibility was fixed so `VIEWER` users can see Products/Solutions/Customers (read-only).

**Important Security Note (No Hardcoded Credentials):**
- The default password shown/used by the UI is now **environment-configured** (e.g. `VITE_DEFAULT_USER_PASSWORD` for frontend, `DEFAULT_USER_PASSWORD` for backend resets) and **must not be committed** to source.

**Files Modified:**
- `frontend/src/features/admin/components/UserManagement.tsx`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.resolver.ts`
- `frontend/src/pages/App.tsx`
- `backend/src/config/env.ts`

#### 7. Users Page Crash: Non-Nullable Role Guard
**Problem:** Legacy DB rows had `user.role = null`, but GraphQL defined `UserExtended.role` as non-nullable, causing:
- `Cannot return null for non-nullable field UserExtended.role`

**Solution:**
- Backend coalesces missing roles to `ADMIN` (if `isAdmin`) or `USER` to satisfy GraphQL constraints and keep the Users page stable.

**Files Modified:**
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.resolver.ts`

#### 8. GraphQL Contract Gate (Prevent Frontend Codegen Drift)
**Problem:** Frontend queries/mutations can drift from backend schema without a hard gate, leading to runtime 400s.

**Solution:**
- Added a GraphQL contract script that runs frontend codegen and fails if `frontend/src/generated/graphql.ts` changes.
- This prevents schema drift from merging unnoticed.

**Files Added/Modified:**
- `scripts/check-graphql-contract.sh`
- `package.json` (root) `check:graphql` / `check:all` integration
- `frontend/codegen.yml`

#### 9. Session Inactivity Timeout: Sliding Window Restoration
**Goal:** Restore the 30-minute inactivity timeout (heartbeat) and automated cleanup.
**Solution:**
- Re-implemented the heartbeat extension in `createContext` (`context.ts`).
- Updated `SessionManager.clearExpiredSessions` to delete based on `expiresAt < now`.
- Confirmed use of `SESSION_INACTIVITY_TIMEOUT_MS` for session length.

#### 10. User Activity Tracking: Full Feature Restoration
**Goal:** Restore the deleted User Activity module and ensure only admins can access it.
**Solution:**
- Re-implemented `user-activity` backend module (resolvers, typeDefs, service).
- Restored `UserActivityPanel.tsx` in the frontend and re-activated its route.
- Wired schema registrations back into the main application.

#### 11. UI: Standardized Action Icon Colors
**Goal:** Ensure all action icons (Sync, Edit) follow the same color theme as their parent category (Direct = Green, Solution = Blue).
**Solution:**
- Updated `CustomerAssignmentsTable.tsx` and `CustomerProductsTab.tsx` to dynamically select icon colors based on the assignment source.

---

## Recent Changes (January 7, 2026)

### Session Summary: REST to GraphQL Migration (File Uploads & Progress)
This session focused on eliminating hybrid REST/GraphQL patterns by migrating legacy file upload endpoints (Telemetry Import, Backup Restore) and real-time progress updates (Import Progress) to native GraphQL operations. This enforces the "GraphQL First" architecture for all data management features.

### Key Changes

#### 1. GraphQL File Uploads (Scalar Upload)
**Goal:** Remove `multipart/form-data` REST endpoints and use GraphQL Mutations for file handling.

**Solution:**
- Implemented `Upload` scalar for backup restore and telemetry imports.
- Created `restoreBackupFromFile` mutation replacing `/api/backup/restore-from-file`.
- Created telemetry import mutations replacing `/api/telemetry/import/*`.
- Removed `multer` middleware and 4 legacy REST endpoints from `server.ts`.

**Files Modified:**
- `backend/src/modules/backup/backup.resolver.ts`
- `backend/src/modules/telemetry/telemetry.resolver.ts`
- `frontend/src/features/backups/components/BackupManagementPanel.tsx`
- `frontend/src/features/telemetry/graphql/telemetry.mutations.ts`

#### 2. Real-Time GraphQL Subscriptions
**Goal:** Replace Server-Sent Events (SSE) with standard GraphQL Subscriptions for progress tracking.

**Solution:**
- Implemented `PubSub` infrastructure in `shared/graphql/pubsub.ts`.
- Added `importProgress` subscription to `import.typeDefs.ts`.
- Refactored `ProgressService` to publish to PubSub system.
- Updated frontend `useImportProgress` hook to use `useSubscription`.

**Files Modified:**
- `backend/src/modules/import/progress/ProgressService.ts`
- `backend/src/modules/import/import.resolver.ts`
- `frontend/src/features/data-management/hooks/useImportProgress.ts`

#### 3. Test Suite Integrity
**Goal:** Fix regressions in backend integration tests caused by PubSub type definitions.

**Solution:**
- Fixed TypeScript error `Property 'asyncIterator' does not exist on type 'PubSub'` in `import.resolver.ts` by correctly casting the PubSub instance.
- Verified `graphql-customers.test.ts` and full test suite pass.

---

### Session Summary: Personal Sandbox Feature Implementation
This session focused on implementing the "Personal Products & Assignments Sandbox" feature, allowing users to create personal simulation environments within "My Diary". Users can now create personal products with tasks, outcomes, and releases, then start assignments to practice adoption workflows with progress tracking.

### Key Changes

#### 1. Personal Sandbox Database Models (10 New Models)
**Goal:** Create a personal sandbox for users to practice adoption plans without affecting production data.

**New Prisma Models:**
- `PersonalProduct` - User's personal product copy with tasks, outcomes, releases
- `PersonalTask` - Tasks within personal products
- `PersonalOutcome` - Outcomes for filtering
- `PersonalRelease` - Releases for filtering  
- `PersonalTaskOutcome` / `PersonalTaskRelease` - Junction tables
- `PersonalAssignment` - Simulated adoption plan instance
- `PersonalAssignmentTask` - Task status tracking with notes

**Files Modified:**
- `backend/prisma/schema.prisma`

#### 2. Personal Product Backend Module
**Goal:** CRUD operations for personal products with import/export functionality.

**Features:**
- Create up to 10 personal products per user
- Add/edit/delete tasks, outcomes, releases
- Import products from DAP JSON export format
- Reorder tasks within products

**Files Created:**
- `backend/src/modules/personal-product/personal-product.service.ts`
- `backend/src/modules/personal-product/personal-product.resolver.ts`
- `backend/src/modules/personal-product/personal-product.typeDefs.ts`
- `backend/src/modules/personal-product/index.ts`

#### 3. Personal Assignment Backend Module
**Goal:** Simulated adoption plans with progress tracking.

**Features:**
- Create assignments from personal products
- Sync tasks when product changes
- Update task status with notes
- Calculate progress percentage

**Files Created:**
- `backend/src/modules/personal-assignment/personal-assignment.service.ts`
- `backend/src/modules/personal-assignment/personal-assignment.resolver.ts`
- `backend/src/modules/personal-assignment/personal-assignment.typeDefs.ts`
- `backend/src/modules/personal-assignment/index.ts`

#### 4. My Products Tab (Frontend)
**Goal:** UI for managing personal products within My Diary.

**Components:**
- `PersonalProductsTab` - Product grid with cards showing task counts
- `PersonalProductDialog` - Multi-tab dialog for editing products
- `ProductImportDialog` - Drag & drop JSON import

**Files Created:**
- `frontend/src/features/my-diary/components/PersonalProductsTab.tsx`
- `frontend/src/features/my-diary/components/PersonalProductDialog.tsx`
- `frontend/src/features/my-diary/components/ProductImportDialog.tsx`
- `frontend/src/features/my-diary/graphql/personal-sandbox.ts`

#### 5. My Assignments Tab (Frontend)
**Goal:** UI for tracking assignment progress.

**Components:**
- `PersonalAssignmentsTab` - Assignment cards with progress bars
- `PersonalTaskTable` - Inline status editing with notes

**Files Created:**
- `frontend/src/features/my-diary/components/PersonalAssignmentsTab.tsx`
- `frontend/src/features/my-diary/components/PersonalTaskTable.tsx`

**Files Modified:**
- `frontend/src/features/my-diary/components/DiaryPage.tsx` (added 2 new tabs)


### Session Summary - Part 2: Personal Product Refinements & Test Fixes
This session focused on aligning "My Products" functionality with the core "Catalogue Products" to ensure a unified user experience. Key achievements include enabling full Excel Import/Export parity for Personal Products, unifying the UI for product editing (removing discrepancies like "Description" field in My Products), adding dynamic tab counts, fixing backend test suites by mocking ESM dependencies, and ensuring consistent font usage.

### Key Changes

#### 1. Excel Import/Export Parity for Personal Products
**Goal:** Replace legacy JSON import with robust Excel wizard.
**Solution:**
- Updated `ExcelExportService` to support all Personal Product fields (Tags, Attributes, Telemetry).
- Updated `ImportExecutor` to handle Personal Product entities.
- Switched frontend to use shared `BulkImportDialog`.

#### 2. UI Unification: Product Dialog & Tabs
**Goal:** Ensure "My Products" and "Catalogue Products" feel identical.
**Solution:**
- Removed "Description" field from `PersonalProductDialog` to match Global Product dialog.
- Added dynamic item counts to main Product tabs (Tags, Outcomes, Releases, Licenses) to match "My Products" style.
- Standardized fonts using MUI typography.

#### 3. Test Suite Integrity
**Goal:** Fix failing backend tests caused by ESM module (`graphql-upload`).
**Solution:**
- Created `graphql-upload-mock.js` to bypass ESM transformation issues in Jest.
- Updated `jest.config.js` to map `graphql-upload` to the mock.
- Verified all 32 test suites pass.

---

## Recent Changes (January 7, 2026)

### Session Summary: RBAC Hardening, Unified Test Runners, and MacBook Chunk-Load Resilience
This session focused on (1) simplifying “system roles” to `ADMIN` vs `USER` while keeping granular access governed by RBAC roles, (2) ensuring `USER` has safe read-only visibility by default without granting write privileges, (3) adding real RBAC tests that exercise the actual GraphQL resolver path, (4) making both `npm test` and `./dap-test all` run the full test suite, and (5) eliminating recurring MacBook “lazy chunk 404” issues by hardening cache behavior and adding a self-healing reload path.

### Key Changes

#### 1. RBAC Policy: Configurable Default Read Access
**Goal:** Provide flexible baseline visibility for `USER` accounts.

**Solution:**
- Added feature flag `RBAC_DEFAULT_USER_READ_ALL` to control baseline visibility.
- When `true`: `SystemRole.USER` has **global READ** access to `PRODUCT`, `SOLUTION`, and `CUSTOMER`.
- When `false` (default as of v3.9.1): Users only see resources explicitly granted by RBAC roles.
- WRITE / ADMIN actions remain **RBAC-gated** (RolePermissions / direct permissions) regardless of this setting.

**Files Modified:**
- `backend/src/shared/auth/permissions.ts`
- `backend/src/config/env.ts`

#### 2. System Roles Simplified in UI (Admin Users): `USER` / `ADMIN` Only
**Goal:** Treat “system role” as platform-level capability (admin vs non-admin) and move all business permissions into RBAC roles.

**Solution:**
- “Add User” and “Edit User” dialogs now only allow selecting **`USER`** or **`ADMIN`**.
- Any legacy system roles (`SME`/`CSS`/`VIEWER`) are rendered as `USER` in the admin UI; granular permissions are handled via RBAC role assignments.

**Files Modified:**
- `frontend/src/features/admin/components/UserManagement.tsx`

#### 3. Bulletproof RBAC Tests (Real Resolver Path)
**Goal:** Prevent RBAC regressions by testing the real GraphQL schema + resolvers end-to-end.

**New Tests:**
- `backend/src/__tests__/integration/graphql-rbac-enforcement.test.ts`
  - USER can read all Products by default
  - USER cannot `createProduct` without PRODUCT WRITE (type-level)
  - RolePermission `PRODUCT WRITE` (resourceId=null) enables create
- `backend/src/__tests__/shared/auth/permissions.default-user-readall-toggle.test.ts`
  - `RBAC_DEFAULT_USER_READ_ALL=false` disables the default read-all behavior
- `backend/src/__tests__/shared/auth/permissions.system-role-shortcuts.test.ts`
  - `RBAC_ENABLE_SYSTEM_ROLE_SHORTCUTS=false` disables legacy SME/CSS/VIEWER bypass behavior

**Factory Enhancements:**
- `backend/src/__tests__/factories/TestFactory.ts` now includes helpers to create roles, grant role permissions, and assign roles.

#### 4. Unified Test Runners: `npm test` and `./dap-test all` Run Everything
**Goal:** Eliminate gaps where “all tests” didn’t actually run all suites.

**Solution:**
- `npm test` (root) continues to run backend Jest + frontend Jest.
- `./dap-test all` now runs:
  - backend Jest (all)
  - frontend Jest (all)
- Added convenient per-suite commands (unit/integration/e2e/export/import/frontend).

**Files Modified:**
- `dap-test`
- `package.json` (root)

#### 5. MacBook Route Chunk Load Failures: Self-Healing + No-Cache Preview
**Problem:** Users could hit route-level errors like “Failed to fetch dynamically imported module …/assets/<Chunk>.js” after rebuilds, due to stale cached entry bundles pointing to older hashed chunks.

**Solution:**
- `RouteErrorBoundary` detects chunk-load errors and forces a full reload (“Reload App”) to refresh `index.html` and asset hashes.
- Vite `preview` sets `Cache-Control: no-store` to prevent stale `index.html` caching.

**Files Modified:**
- `frontend/src/shared/components/RouteErrorBoundary.tsx`
- `frontend/vite.config.ts`

#### 6. Dynamic Admin Settings Panel
**Goal:** Allow admins to configure system behavior (RBAC defaults, AI settings, Rate Limits) at runtime without deployments.

**Solution:**
- Created `AdminSettingsPanel` in frontend with tabs for Security, AI, and System.
- Backend `SettingsService` persists typed settings to database (`AppSetting` table).
- Dynamic configuration for:
  - `rbac.default.user.read.all`: Toggle baseline visibility (default: `false` for strict RBAC).
  - `ai.enabled`: Enable/disable AI features (default: `true`).
  - `ai.provider` / `ai.model`: Switch LLM backends.
  - `rate.limit.enabled`: Toggle rate limiting (default: `false`).
  - `rate.limit.*`: Adjust API throttle limits.

**Files Added:**
- `frontend/src/features/admin/components/AdminSettingsPanel.tsx`
- `backend/src/modules/settings/` (Service, Resolver, Schema)

#### 7. Legacy Cleanup: Removed System Role Shortcuts
**Goal:** Eliminate "magic" hardcoded permissions for legacy system roles (SME, CSS) to enforce strict RBAC.

**Solution:**
- Removed `rbac.enable.system.role.shortcuts` setting and all associated logic in `permissions.ts`.
- Removed legacy tests that verified these shortcuts.
- Force-deleted the persistent database setting to prevent UI confusion.
- All non-admin users are now treated as standard `USER`s, with access strictly controlled by the 'Default Read-All' setting or specific RBAC grants.

---

## Previous Changes (January 5, 2026)

### Session Summary - Part 2: UX & Resilience
This session focused on implementing advanced UX patterns for application resilience.

### Key Changes

#### 1. Optimistic Delete Mutations
**Problem:** Delete operations waited for server response before updating UI, creating sluggish "click → wait → update" experience.

**Solution:**
- Implemented Apollo Client optimistic response pattern
- Item instantly removed from cache/table upon click
- Automatic rollback if server request fails
- Toast notifications for success/error feedback

**Files Modified:**
- `frontend/src/features/products/components/ProductsPanel.tsx`

**Code Pattern:**
```typescript
const [deleteProduct] = useMutation(DELETE_PRODUCT, {
  update(cache, _, { variables }) {
    // Instantly remove from cache
    const existingData = cache.readQuery({ query: PRODUCTS, variables: args });
    const newEdges = existingData.products.edges.filter(e => e.node.id !== variables.id);
    cache.writeQuery({ query: PRODUCTS, variables: args, data: { products: { ...existingData.products, edges: newEdges }}});
  },
  optimisticResponse: ({ id }) => ({ deleteProduct: true }),
  onError: (error) => showToast(`Delete failed: ${error.message}. Item restored.`, 'error'),
  onCompleted: () => showToast('Product deleted successfully', 'success')
});
```

#### 2. Granular Route Error Boundaries
**Problem:** A crash in one page (e.g., Products) would crash the entire app, including navigation.

**Solution:**
- Created `RouteErrorBoundary` component for per-route fault isolation
- Each main route wrapped in combined Suspense + ErrorBoundary
- Users can still navigate via sidebar when a route crashes
- Includes retry functionality and expandable technical details

**Files Created:**
- `frontend/src/shared/components/RouteErrorBoundary.tsx`

**Files Modified:**
- `frontend/src/routes/AppRoutes.tsx`
- `frontend/src/shared/components/index.ts`

**Code Pattern:**
```tsx
const ProtectedRoute: React.FC<{ children: React.ReactNode; routeName: string; fallback?: React.ReactNode }> = 
  ({ children, routeName, fallback }) => (
    <RouteErrorBoundary routeName={routeName}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </RouteErrorBoundary>
  );

// Usage
<Route path="/products" element={<ProtectedRoute routeName="Products"><ProductsPage /></ProtectedRoute>} />
```

#### 3. Focus Management on Pagination (a11y)
**Problem:** Keyboard users lost focus after pagination, forcing them to tab through entire navigation again.

**Solution:**
- Table container is now focusable (`tabIndex={-1}`)
- After "Next Page": focus moves to "Previous" button
- After "Previous Page": focus moves to top of table
- Added aria-labels to pagination buttons

**Files Modified:**
- `frontend/src/features/products/components/ProductsPanel.tsx`

**Code Pattern:**
```typescript
const [pendingFocus, setPendingFocus] = useState<'table' | 'prev' | null>(null);

useEffect(() => {
  if (!loading && pendingFocus) {
    setTimeout(() => {
      if (pendingFocus === 'table') tableContainerRef.current?.focus();
      else if (pendingFocus === 'prev') prevButtonRef.current?.focus();
      setPendingFocus(null);
    }, 100);
  }
}, [loading, pendingFocus]);

const loadNext = () => { setArgs(...); setPendingFocus('prev'); };
const loadPrev = () => { setArgs(...); setPendingFocus('table'); };
```

---

### Previous Session Summary - Part 1: Security Review
This session focused on Red Team security review of the authentication and logging modules.

### Key Changes

#### 1. Log Sanitization (Security)
**Problem:** Passwords and secrets could leak into audit logs and console output.

**Findings:**
- Default password was logged in plaintext during user creation and password reset
- Error messages could contain connection strings or tokens
- No defense-in-depth for accidental secret exposure

**Solution:**
- Removed password values from all audit log entries
- Created `logSanitizer.ts` utility with automatic secret redaction
- Integrated sanitizer into `AuditLogger` for defense-in-depth
- Added 12 security tests for secret pattern detection

**Files Modified:**
- `backend/src/modules/auth/auth.service.ts` - Removed password logging
- `backend/src/modules/ai/AuditLogger.ts` - Added log sanitization
- `backend/src/shared/utils/logSanitizer.ts` - New utility
- `backend/src/__tests__/security/log-sanitization.test.ts` - New tests

#### 2. User Enumeration Prevention (Security)
**Problem:** Different error messages revealed whether a username existed:
- "Account is disabled" → User exists but inactive
- "Invalid username or password" → User doesn't exist

**Solution:**
- All auth errors now return unified `"Invalid credentials"` message
- Console warnings no longer log usernames
- Prevents attackers from enumerating valid accounts

**Files Modified:**
- `backend/src/modules/auth/auth.service.ts`

#### 3. Type Safety Verification (Security)
**Status:** ✅ Verified Secure

The `env.ts` correctly validates JWT_SECRET at runtime:
- Minimum 32 characters enforced in production
- Dangerous patterns detected (dev-secret, changeme, test, etc.)
- App crashes immediately if validation fails

### Security Test Results
- 12 log sanitization tests passed
- 33 auth tests passed
- TypeScript compilation successful

---

## Previous Changes (January 3, 2026)

### Session Summary
This session focused on three major improvements: server-side sorting, security hardening, and routing architecture refactoring.

### Key Changes

#### 1. Server-Side Sorting for Products
**Problem:** Client-side sorting with `React.useMemo` only sorted the visible page (25 items), not the entire dataset.

**Solution:**
- Added `ProductSortField` enum (NAME, CREATED_AT, UPDATED_AT) to GraphQL schema
- Added `SortDirection` enum (ASC, DESC) and `ProductOrderByInput` type
- Updated `fetchProductsPaginated()` in `pagination.ts` to accept `orderBy` parameter
- Updated `ProductsPanel.tsx` to trigger network request on sort change
- Default sort: `UPDATED_AT DESC` (most recently modified first)

**Files Modified:**
- `backend/src/modules/product/product.schema.graphql`
- `backend/src/shared/utils/pagination.ts`
- `backend/src/modules/product/product.resolver.ts`
- `frontend/src/features/products/components/ProductsPanel.tsx`

#### 2. Security Hardening - Authentication Configuration
**Problem:** Hardcoded fallback secrets posed security risks if environment variables were missing in production.

**Solution:**
- Added `validateCriticalSecrets()` function that runs at startup
- App crashes immediately if `JWT_SECRET` or `DATABASE_URL` missing in production
- Detects dangerous patterns (dev-secret, changeme, test, etc.)
- Enforces minimum 32-character `JWT_SECRET` length
- Removed all hardcoded fallbacks from `auth.service.ts`
- All secrets now imported from centralized `envConfig`

**Critical Secrets (Required in Production):**
- `JWT_SECRET` - Must be 32+ characters, no dev patterns
- `DATABASE_URL` - PostgreSQL connection string

**Files Modified:**
- `backend/src/config/env.ts` - Added production validation
- `backend/src/modules/auth/auth.service.ts` - Uses centralized config

#### 3. Routing Architecture Refactoring
**Problem:** Nested `<Routes>` inside conditionals was an anti-pattern that could cause routing issues.

**Solution:**
- Refactored to flat route structure with guard wrappers
- Added `AdminRoute` component - redirects non-admin users
- Added `DevRoute` component - checks dev mode AND admin status
- Added default redirects: `/admin` → `/admin/users`, `/dev` → `/dev/tests`
- Improved 404 page with descriptive message

**Route Structure:**
```
/                  → Redirects to /dashboard
/dashboard         → Getting Started page
/products          → Products management
/solutions         → Solutions management
/customers         → Customers management
/diary             → Personal diary
/admin/*           → Admin routes (protected by AdminRoute)
/dev/*             → Dev tools (protected by DevRoute)
```

**Files Modified:**
- `frontend/src/routes/AppRoutes.tsx`

---

## Previous Changes (January 1, 2026)

### Session Summary
This session focused on improving adoption plan functionality, consistency, and user experience.

### Key Changes for v3.6.0

#### 1. Task Count Display in Metadata Tables
- Added "Tasks" column to OutcomesTable, ReleasesTable, LicensesTable, and TagsTable
- Implemented inclusive counting logic:
  - Tasks with empty outcomes/releases apply to ALL outcomes/releases
  - License counts are cumulative (higher tier includes lower tier tasks)

#### 2. Solution Task License Fix
- Fixed license field resolver in `task.resolver.ts` to handle solution tasks
- Previously only checked `productId`, now also checks `solutionId`

#### 3. Adoption Plan Filter Consistency
- Updated `ProductAdoptionPlanView.tsx` and `ProductAdoptionGroup.tsx`
- Filters now include tasks with empty releases/outcomes (applies to all)
- Consistent with Products and Solutions page filtering

#### 4. Recursive Progress Bar Updates
- Added refetch queries to `updateTaskStatus` mutation
- Progress bars now update on Overview tab when task status changes

#### 5. Solution Adoption Plan Full Sync
- Added `selectedOutcomes` and `selectedReleases` to product adoption plan query
- Filter dropdowns now show ALL product outcomes/releases, not just those with tasks
- Added `planOutcomes` and `planReleases` props to `ProductAdoptionGroup`

#### 6. Consistent Icon Colors
- Solution-related icons: Blue (#3B82F6)
- Product-related icons: Green (#10B981)
- Added `isPartOfSolution` prop to `ProductAdoptionGroup`
- Updated `CustomerAssignmentsTable` icon colors based on item type

### Testing
- All backend tests pass (364 passed)
- All frontend builds pass
- Import/Export tests pass
