# Deployment Checklist - Version 2.1.2

**Version:** 2.1.2  
**Deployment Date:** ___________________  
**Deployed By:** ___________________  
**Environment:** [ ] DEV → PROD

---

## 📋 Pre-Deployment Checklist

### 1. Code Review & Testing (DEV Environment)

- [ ] **All code changes reviewed**
  - Backend: `backend/src/api/devTools.ts`
  - Frontend: 11 panel component files
  - Documentation: Multiple .md files

- [ ] **Backend tests pass**
  ```bash
  cd backend && npm test
  ```
  Expected: All tests pass

- [ ] **Backend builds successfully**
  ```bash
  cd backend && npm run build
  ```
  Expected: No errors, dist/ folder created

- [ ] **Frontend builds successfully**
  ```bash
  cd frontend && npm run build
  ```
  Expected: No errors, dist/ folder created

- [ ] **Linting passes** (ignore known Grid warnings)
  ```bash
  cd backend && npm run lint
  cd frontend && npm run lint
  ```
  Expected: Only pre-existing Material-UI Grid warnings

### 2. Functionality Testing (DEV Environment)

#### Development Menu
- [ ] **All 12 menu items visible** (admin user)
- [ ] **All menu item tooltips display** on hover
  - Database, Logs, Tests, Build & Deploy
  - CI/CD, Environment, API Testing, Docs
  - Quality, Performance, Git, Tasks

#### Development Panels - Core
- [ ] **Tests Panel**
  - Overview section displays
  - "Run All Tests" tooltip shows
  - Individual "Run" button tooltips show
  - Tests execute successfully

- [ ] **Database Panel**
  - Overview section displays
  - All 5 button tooltips show (Refresh, Run Migrations, Seed, Generate, Reset)
  - Database status loads
  - Migration history displays

- [ ] **Logs Viewer Panel**
  - Overview section displays
  - All 4 button tooltips show (Pause/Resume, Refresh, Export, Clear)
  - Logs load and auto-refresh
  - Filter functionality works

- [ ] **Build & Deploy Panel**
  - Overview section displays
  - All 3 button tooltips show (Build Frontend, Build Backend, Deploy)
  - Build buttons functional
  - Output displays correctly

- [ ] **API Testing Panel**
  - Overview section displays
  - Execute and Clear button tooltips show
  - Default query loads
  - Query execution works

- [ ] **Environment Panel**
  - Overview section displays
  - Refresh button tooltip shows
  - Variables load from .env
  - Secret toggle works

- [ ] **CI/CD Panel**
  - Overview section displays
  - Refresh and Trigger button tooltips show
  - Workflows list displays
  - Instructions clear

- [ ] **Docs Panel** (CRITICAL - was broken)
  - Overview section displays
  - Panel loads without errors
  - Documentation files display
  - Search functionality works
  - Categories organized correctly

#### Development Panels - Advanced
- [ ] **Code Quality Panel**
  - Overview section displays
  - Coverage metrics load (or shows helpful error)
  - Color coding correct (green/yellow/red)

- [ ] **Performance Panel**
  - Overview section displays
  - System metrics load
  - Auto-refresh works (every 2s)
  - Memory stats display

- [ ] **Git Integration Panel**
  - Overview section displays
  - Branch name shows
  - Commit hash displays
  - Git status loads

- [ ] **Task Runner Panel**
  - Overview section displays
  - All Run button tooltips show
  - Scripts list from package.json
  - Script execution works
  - Output displays

### 3. Documentation
- [ ] **DOCUMENTATION_INDEX.md accessible**
- [ ] **All links in index work**
- [ ] **README.md updated correctly**
- [ ] **CONTEXT.md shows version 2.1.2**
- [ ] **Release notes created**

### 4. Browser Compatibility (Test in DEV)
- [ ] **Chrome** - All panels work
- [ ] **Firefox** - All panels work
- [ ] **Edge** - All panels work
- [ ] **Safari** (if available) - All panels work

### 5. User Role Testing (DEV)
- [ ] **Admin user** - All Development tools visible
- [ ] **SME user** - Development menu hidden (unless dev mode)
- [ ] **CSS user** - Development menu  hidden (unless dev mode)
- [ ] **Regular user** - Development menu hidden

---

## 🗄️ Backup (PRODUCTION)

### Before Deployment

- [ ] **Database backup created**
  ```bash
  # On production server
  cd /data/dap
  ./scripts/backup-database.sh
  ```
  Backup file: ___________________

- [ ] **Code backup created**
  ```bash
  # On production server
  cd /data/dap
  tar -czf ~/dap-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
  ```
  Backup file: ___________________

- [ ] **Backup files verified** (can extract/restore)

- [ ] **.env file backed up separately**
  ```bash
  cp /data/dap/backend/.env ~/dap-env-backup-$(date +%Y%m%d-%H%M%S).env
  ```

---

## 📦 Deployment Steps (PRODUCTION)

### 1. Stop Services

- [ ] **Stop application**
  ```bash
  cd /data/dap
  ./dap stop
  ```
  Expected: All services stopped cleanly

### 2. Deploy Code

- [ ] **Pull latest code** (if using Git)
  ```bash
  git fetch origin
  git checkout main
  git pull origin main
  ```
  Expected: Code updated to version 2.1.2

  OR

- [ ] **Upload release package** (if using tarball)
  ```bash
  # From dev server
  scp releases/release-YYYYMMDD-HHMMSS.tar.gz user@prod:/tmp/
  
  # On prod server
  cd /data/dap
  tar -xzf /tmp/release-YYYYMMDD-HHMMSS.tar.gz
  ```

### 3. Install Dependencies & Build

- [ ] **Backend dependencies** (if needed)
  ```bash
  cd /data/dap/backend
  npm install
  ```
  Expected: No new dependencies (but ensures consistency)

- [ ] **Backend build**
  ```bash
  cd /data/dap/backend
  npm run build
  ```
  Expected: Successful build, dist/ directory updated

- [ ] **Frontend dependencies** (if needed)
  ```bash
  cd /data/dap/frontend
  npm install
  ```

- [ ] **Frontend build**
  ```bash
  cd /data/dap/frontend
  npm run build
  ```
  Expected: Successful build, dist/ directory created/updated

### 4. Database Migrations

- [ ] **Check for migrations** (None in 2.1.2)
  ```bash
  cd /data/dap/backend
  npx prisma migrate status
  ```
  Expected: "No pending migrations"

### 5. Start Services

- [ ] **Start application**
  ```bash
  cd /data/dap
  ./dap start
  ```
  Expected: All services start successfully

- [ ] **Verify services running**
  ```bash
  # Backend
  curl http://localhost:4000/graphql \
    -d '{"query":"{ __typename }"}' \
    -H "Content-Type: application/json"
  
  # Frontend
  curl http://localhost/dap/
  ```
  Expected: Both respond successfully

---

## ✅ Post-Deployment Verification (PRODUCTION)

### 1. Smoke Tests

- [ ] **Application loads** at production URL
- [ ] **Can login** with admin credentials
- [ ] **Dashboard displays** correctly
- [ ] **No console errors** (F12 Developer Tools)

### 2. Development Menu Verification

- [ ] **Development menu visible** (admin user)
- [ ] **All 12 menu items present**
- [ ] **Menu item tooltips work**

### 3. Critical Panel Tests

- [ ] **Docs panel loads** (was broken before)
- [ ] **Docs panel displays files**
- [ ] **Tests panel works**
- [ ] **Database panel works**
- [ ] **Logs panel shows recent logs**

### 4. Quick Functionality Test

- [ ] **Create/edit a product** - works
- [ ] **View a customer** - works
- [ ] **Run a test** from Tests panel - works
- [ ] **View documentation** from Docs panel - works

### 5. Performance Check

- [ ] **Page load time acceptable** (< 3 seconds)
- [ ] **No memory leaks** (check Performance panel)
- [ ] **No excessive errors** in logs

---

## 🔄 Rollback Plan (If Issues Arise)

### If Deployment Fails

1. **Stop application**
   ```bash
   ./dap stop
   ```

2. **Restore code** from backup
   ```bash
   cd /data/dap
   git checkout <previous-version-tag>
   # OR restore from tarball
   tar -xzf ~/dap-backup-TIMESTAMP.tar.gz
   ```

3. **Rebuild** (if needed)
   ```bash
   cd backend && npm run build
   cd ../frontend && npm run build
   ```

4. **Restart application**
   ```bash
   cd /data/dap
   ./dap start
   ```

5. **Verify rollback successful**

6. **Document issue** for investigation

---

## 📝 Post-Deployment Tasks

### Documentation

- [ ] **Update deployment log** with timestamp and deployer
- [ ] **Document any issues** encountered
- [ ] **Update production wiki** (if applicable)
- [ ] **Notify team** of successful deployment

### Monitoring

- [ ] **Monitor logs** for 1 hour post-deployment
  ```bash
  tail -f /data/dap/backend.log
  ```

- [ ] **Check error rates** (if monitoring tool available)

- [ ] **Monitor user feedback** (first 24 hours)

### User Communication

- [ ] **Notify users** of new features (if needed)
- [ ] **Send release notes** to stakeholders
- [ ] **Update help documentation** links (if external docs exist)

---

## 🎯 Success Criteria

Deployment is successful if:

- ✅ All services running without errors
- ✅ Application accessible at production URL
- ✅ All 12 Development panels load
- ✅ Docs panel works (critical fix)
- ✅ No new errors in logs (first hour)
- ✅ All menu tooltips display
- ✅ Performance acceptable
- ✅ Basic CRUD operations work

---

## 📞 Emergency Contacts

**If issues arise:**

- **Technical Lead:** ___________________
- **Database Admin:** ___________________
- **DevOps:** ___________________
- **On-Call:** ___________________

---

## 📊 Deployment Record

**Deployment Details:**
- Start Time: ___________________
- End Time: ___________________
- Duration: ___________________
- Issues Encountered: ___________________
- Resolution: ___________________

**Sign-Off:**
- Deployed By: ___________________ Date: ___________
- Verified By: ___________________ Date: ___________
- Approved By: ___________________ Date: ___________

---

## 📎 Attachments

- [ ] Pre-deployment backup location documented
- [ ] Post-deployment screenshots taken
- [ ] Error logs (if any) saved
- [ ] Performance metrics recorded

---

**Deployment Status:** [ ] Success [ ] Partial [ ] Failed [ ] Rolled Back

**Notes:**
_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________

---

**This checklist ensures a smooth, safe deployment of DAP v2.1.2 to production.**
