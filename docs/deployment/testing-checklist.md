# Testing Checklist - Before Production Release

## Pre-Deployment Testing (DEV Environment)

### Backend Testing

- [ ] **Build succeeds**
  ```bash
  cd /data/dap/backend
  npm run build
  # No TypeScript errors
  ```

- [ ] **Backend starts without errors**
  ```bash
  cd /data/dap
  ./dap restart
  tail -20 backend.log
  # No errors in logs
  ```

- [ ] **GraphQL endpoint responsive**
  ```bash
  curl -X POST http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}'
  # Returns: {"data":{"__typename":"Query"}}
  ```

- [ ] **Products query works**
  ```bash
  curl -X POST http://localhost:4000/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ products { totalCount } }"}'
  # Returns products count
  ```

### Frontend Testing

- [ ] **Build succeeds**
  ```bash
  cd /data/dap/frontend
  npm run build
  # Vite builds successfully
  ```

- [ ] **No console errors**
  - Open http://dev.rajarora.csslab/dap/
  - Press F12 → Console tab
  - No red errors

- [ ] **All pages load**
  - Login page ✅
  - Products page ✅
  - Solutions page ✅
  - Customers page ✅
  - Backup & Restore page ✅

### RBAC Testing

#### Admin User (`admin` / `admin`)

- [ ] Can access all menus
- [ ] Can create/edit/delete products
- [ ] Can create/edit/delete solutions
- [ ] Can create/edit/delete customers
- [ ] Can create/edit/delete tasks
- [ ] Can access Backup & Restore
- [ ] Can manage users and roles

#### SME User (`smeuser` / `smeuser`)

- [ ] Can access Products menu ✅
- [ ] Can create/edit/delete products ✅
- [ ] Can create/edit/delete solutions ✅
- [ ] Can create/edit/delete tasks ✅
- [ ] **Can delete tasks** (queue for deletion) ✅
- [ ] CANNOT access Customers menu ❌
- [ ] CANNOT access Backup & Restore ❌

#### CSS User (`cssuser` / `cssuser`)

- [ ] Can access Customers menu ✅
- [ ] Can create/edit/delete customers ✅
- [ ] **Can see products in dropdown** ✅
- [ ] **Can see solutions in dropdown** ✅
- [ ] Can assign products to customers ✅
- [ ] Can assign solutions to customers ✅
- [ ] CANNOT create/edit/delete products ❌
- [ ] CANNOT create/edit/delete solutions ❌
- [ ] CANNOT access Products menu ❌

### UI/UX Testing

#### Dialog Functionality

- [ ] **Assign Product Dialog**
  - Opens correctly ✅
  - Product dropdown shows all products ✅
  - Can select product ✅
  - OK/Cancel buttons always visible ✅
  - Can navigate through all steps ✅
  - Assignment completes successfully ✅

- [ ] **Assign Solution Dialog**
  - Opens correctly ✅
  - Solution dropdown shows all solutions ✅
  - Can select solution ✅
  - OK/Cancel buttons always visible ✅
  - Assignment completes successfully ✅

- [ ] **Task Dialog**
  - Opens correctly ✅
  - All fields editable ✅
  - Dropdowns work ✅
  - Buttons visible ✅

#### Dropdown Testing

- [ ] Product dropdown in assignment dialog
- [ ] Solution dropdown in assignment dialog
- [ ] Outcome dropdown
- [ ] Release dropdown
- [ ] License dropdown
- [ ] All dropdowns scrollable if many items

### Performance Testing

- [ ] **Page load time** < 3 seconds
- [ ] **GraphQL query response** < 500ms
- [ ] **No memory leaks** (check after 1 hour of use)
- [ ] **No console warnings** in production build

### Cross-Browser Testing

- [ ] **Chrome** - Latest version
- [ ] **Firefox** - Latest version
- [ ] **Safari** - Latest version
- [ ] **Edge** - Latest version
- [ ] **Mobile browsers** (if applicable)

### Data Integrity Testing

- [ ] Creating records works
- [ ] Updating records works
- [ ] Deleting records works (soft delete)
- [ ] Relationships maintained
- [ ] Cascading deletes work correctly

### Security Testing

- [ ] Login required for protected routes
- [ ] Invalid tokens rejected
- [ ] Role permissions enforced
- [ ] No sensitive data in console
- [ ] No passwords in backup files
- [ ] XSS protection working

## Post-Deployment Testing (PROD Environment)

### Smoke Tests (< 5 minutes)

- [ ] **Production URL accessible**
  - https://myapps.cxsaaslab.com/dap/

- [ ] **Backend health check**
  ```bash
  ssh rajarora@centos2.rajarora.csslab
  curl -s http://localhost:4000/graphql -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}'
  ```

- [ ] **Frontend loads**
  - Visit https://myapps.cxsaaslab.com/dap/
  - Page loads without errors

- [ ] **Login works**
  - Login with admin credentials
  - Redirects to dashboard

### Full Regression Testing (< 30 minutes)

Repeat all RBAC testing steps from above with production users.

### Monitoring (First 30 minutes)

- [ ] Backend logs clean
  ```bash
  tail -f /data/dap/backend.log | grep -i error
  ```

- [ ] Apache logs clean
  ```bash
  sudo tail -f /var/log/httpd/error_log
  ```

- [ ] No user-reported issues

## Test Data

### Sample Users for Testing

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| admin | admin | ADMIN | Full system access |
| smeuser | smeuser | SME | Product/Solution management |
| cssuser | cssuser | CSS | Customer management |

### Sample Data for Testing

Ensure these exist before testing:
- At least 3 products
- At least 2 solutions
- At least 2 customers
- At least 5 tasks

## Acceptance Criteria

All checkboxes above must be checked (✅) before:
1. Creating release package
2. Deploying to production
3. Announcing deployment to users

## Failed Test Handling

If ANY test fails:

1. **Stop deployment immediately**
2. **Document the failure**
3. **Fix the issue in DEV**
4. **Restart testing from beginning**
5. **Do NOT proceed to production**

## Notes Section

Use this space to document any issues found during testing:

```
Date: _____________
Tester: _____________

Issues Found:
-
-
-

Resolution:
-
-
-
```

---

**Last Updated**: December 1, 2025  
**Version**: 1.0

