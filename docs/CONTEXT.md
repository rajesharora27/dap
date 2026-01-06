# DAP Application Context

## Recent Changes (January 6, 2026)

### Session Summary - Part 3: Task Creation Reliability, Test Determinism, and Customer Overview UX
This session focused on eliminating a task creation failure affecting both Products and Solutions, making the backend test environment deterministic, improving the Customers → Overview UI to visually distinguish solution-derived product assignments, and documenting a common MacBook “blank screen” root cause.

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
