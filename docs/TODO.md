# DAP To-Do Tracker

Master list of feature requests, improvements, and technical debt items.

---

## 🔥 Priority: High

### 🎨 P0: UI/UX & Structural Refinement (Dec 20th)
**Status:** 🟢 Complete (Most tasks done Dec 20)
**Description:** Comprehensive visual and navigation update.

**Dashboard (Getting Started):**
- [ ] Rename Side nav "Dashboard" -> "Getting Started"
- [x] Update Title: "Dynamic Adoption Platform" / Subtitle: "Centralized logic for product and solution adoption." (DONE)
- [x] Update AI Card desc: "Query and navigate adoption data using natural language." (DONE)
- [ ] Update Context Card: "Context-Aware" / Desc: "Plans automatically adjust to current licenses, software versions, and deployment constraints."
- [x] Refactor "About DAP" into smaller cards (DONE)
- [ ] Semantic Color Coding (Orange for Solutions/Dynamic Outcome)
- [ ] Match sidebar icon colors to widget colors (Products=Blue)
- [ ] Use modern SaaS icons (light outline flat)

**Products/Solutions Pages:**
- [ ] Use consistent modern saas icons
- [ ] Add "+" icon in sidebar headers for add functionality
- [ ] Remove "Add" button from main page area
- [ ] Add "Add" option in bottom dropdown (page footer actions?)
- [x] Remove large blue banner (DONE for Products, Solutions, Customers)
- [x] Rename "Dashboard" tab to "Summary" (DONE)
- [x] Make Outcomes list inline editable (DONE)

**Tasks Lists:**
- [ ] Rename Telemetry -> "Validation Criteria"
- [x] Rename Weight -> "Implementation %" (Partial - terminology updated in docs/UI)
- [x] Remove up/down arrows from Weight column (DONE)
- [ ] Remove purple outline box around sequence numbers
- [ ] Move filters inline to the right of "Tasks (N)" tab or into "Add Task" row
- [ ] Left align headers and content perfectly

---

## 🔥 Priority: High

### ✅ P1: Environment Architecture Fix
**Status:** 🟢 Complete  
**Completed:** 2025-12-19  
**Description:** Cleaned up environment architecture with clear, consistent naming.

**Changes Made:**
- [x] Consolidated environment configuration to a single `.env.example` template (`cp .env.example .env`)
- [x] Updated `./dap`, `dap-prod`, `mac-light-deploy.sh`
- [x] Updated `deploy-to-stage.sh`, `deploy-to-production.sh`
- [x] Updated documentation

---

### P2: Solution Management Refinements & UI Fixes
**Status:** 🟡 In Progress  
**Created:** 2025-12-19  
**Description:** Address regressions on Solutions page and enhance solution-level license/release management.

**Tasks:**
- [ ] Fix missing Solution select dropdown and buttons on `SolutionsPage.tsx`
- [ ] Restore missing Licenses tab in `SolutionDialog.tsx`
- [ ] Add solution-level license selection during solution creation
- [ ] Implement mapping/picking of product licenses/releases for solutions
- [ ] Ensure persistence of all solution-level associations

---

### P2: First Login Authentication Issue
**Status:** 🟡 In Progress (Parked)  
**Created:** 2025-12-19  
**Description:** First login after application restart sometimes fails to load data on Products, Solutions, and Customers pages. Subsequent refresh resolves the issue.

**Symptoms:**
- "No token found" error on first navigation
- Empty data in components on initial load
- Works correctly after page refresh

**Root Cause (Suspected):**
- Authentication race condition during initial load
- Token validation timing with Apollo Client hydration
- Context initialization order

**Workaround:**
- Refresh the page after login if data does not load

---

### P3: Persist Adoption Plan Filters
**Status:** 🟢 Complete  
**Completed:** 2025-12-19  
**Description:** Filter selections now persist to the database and are restored on page load.

**Implementation:**
- [x] Added `FilterPreference` table to database schema
- [x] Created GraphQL mutations/queries for filter preferences
- [x] Updated Solution Adoption Plan view to save/restore filters
- [x] Updated Product Adoption Plan view to save/restore filters
- [x] Filters persist across sessions and page reloads

---

### P4: Adoption Plan Tab in Products/Solutions
**Status:** 🔴 Not Started  
**Created:** 2025-12-19  
**Description:** Add a new "Adoption Plan" tab in Products and Solutions that shows all tasks with filtering capabilities for SME users.

**Requirements:**
- New tab in Product detail view
- New tab in Solution detail view
- Show all adoption tasks
- Filtering by: release, outcome, tag, status
- SME-focused view with bulk actions

---

## 🎨 Priority: Medium (UI/UX)

### P5: Replace 3D Icons with Flat Icons (Font Awesome)
**Status:** 🔴 Not Started  
**Created:** 2025-12-19  
**Description:** Replace all 3D style icons with flat Font Awesome icons for a cleaner, more consistent look.

**Tasks:**
- [ ] Audit current icon usage
- [ ] Install/configure Font Awesome
- [ ] Replace icons in navigation
- [ ] Replace icons in cards/buttons
- [ ] Replace icons in dialogs
- [ ] Test all pages for icon consistency

---

### P6: Use Cisco/MacBook Fonts
**Status:** 🔴 Not Started  
**Created:** 2025-12-19  
**Description:** Update typography to use Cisco brand fonts or MacBook system fonts.

**Options:**
- **Cisco Fonts:** CiscoSans, CiscoSansTT
- **Apple System Fonts:** -apple-system, BlinkMacSystemFont, SF Pro
- **Fallback:** Inter, Roboto

**Tasks:**
- [ ] Research Cisco font licensing
- [ ] Configure font stack in CSS
- [ ] Update typography styles
- [ ] Test across browsers

---

### P7: Color Consistency with Themes
**Status:** 🟢 Complete (Dec 20)  
**Created:** 2025-12-19  
**Description:** Ensure all colors are consistent with the theme system. No hardcoded colors.

**Tasks:**
- [ ] Audit hardcoded colors in components
- [ ] Define complete color palette in theme
- [ ] Replace hardcoded colors with theme references
- [ ] Ensure dark mode compatibility
- [ ] Test across all pages

---

## 📋 Backlog

_Items to be prioritized later_

---

## ✅ Completed

### Frontend Loading Fix
**Completed:** 2025-12-19  
**Description:** Fixed frontend not loading on Mac due to VITE_BASE_PATH conflict.

### Development Process Documentation
**Completed:** 2025-12-19  
**Description:** Created DEV_QUICKSTART.md and implementation plan for development workflow.

---

## Notes

### How to Add Items
1. Add new items under appropriate priority section
2. Use status indicators: 🔴 Not Started, 🟡 In Progress, 🟢 Complete
3. Include created date
4. Break down into specific tasks when starting work

### Priority Definitions
- **High:** Blocking issues, frequently requested features
- **Medium:** Important but not urgent, UX improvements
- **Backlog:** Nice to have, future considerations
