# DAP Refactoring Strategy

**Date:** December 2, 2025
**Objective:** Transform the application from a monolithic prototype into a scalable, maintainable production system.

## 1. Deconstruct the Frontend Monolith (`App.tsx`)
**Current State:** `App.tsx` is ~7,400 lines, containing routing, data fetching, and UI layout.
**Strategy:**
- **Extract Pages:** Create `src/pages/` directory.
  - `ProductsPage.tsx`
  - `SolutionsPage.tsx`
  - `CustomersPage.tsx`
  - `SettingsPage.tsx`
- **Implement Routing:** Replace conditional rendering with `react-router-dom`.
- **Goal:** Reduce `App.tsx` to < 200 lines (Providers + Router).

## 2. Backend Architecture: "Thin Resolvers, Fat Services"
**Current State:** Resolvers (e.g., `solutionAdoption.ts`) are massive (2,500+ lines) and contain mixed concerns.
**Strategy:**
- **Create Domain Services:** Move business logic to `backend/src/services/`.
  - `ProductService.ts`
  - `SolutionService.ts`
  - `CustomerService.ts`
  - `AdoptionService.ts`
- **Refactor Resolvers:** Resolvers should only handle:
  1. Input Validation (Zod)
  2. Permission Checks
  3. Service Calls
  4. Response Formatting

## 3. Decentralize Frontend Data Fetching
**Current State:** `App.tsx` fetches all data at the top level, causing performance issues.
**Strategy:**
- **Colocate Queries:** Move GraphQL queries into the specific Page or Component that needs them.
- **Use Fragments:** Define data requirements at the component level.

## 4. Standardize Form Management
**Current State:** Manual input handling (`defaultValue`, `onBlur`) is error-prone.
**Strategy:**
- **Adopt `react-hook-form`:** Standardize form state management.
- **Integrate `zod`:** Share validation schemas between frontend and backend.

## 5. Global Error Handling
**Current State:** Application crashes on unhandled errors.
**Strategy:**
- **Error Boundaries:** Wrap main content areas in React Error Boundaries.
- **Fallback UI:** Display friendly error messages instead of white screens.

## 6. Component Isolation (Storybook)
**Current State:** UI components are tightly coupled to logic.
**Strategy:**
- **Install Storybook:** Develop "dumb" UI components in isolation.
- **Library:** Build a reusable component library (Buttons, Cards, Dialogs).

---

## Implementation Plan (Phase 1)

We will start with **Item 2: Backend Architecture**, specifically refactoring **Product Management** to demonstrate the "Thin Resolver, Fat Service" pattern.

1.  **Create `ProductService.ts`**: Encapsulate CRUD logic for Products.
2.  **Refactor `createProduct` / `updateProduct`**: Move logic from resolver to service.
3.  **Verify**: Ensure functionality remains unchanged.
