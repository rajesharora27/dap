# DAP Application Context

## Recent Changes (January 5, 2026)

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
