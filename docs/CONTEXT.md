# DAP Application Context

## Recent Changes (January 1, 2026)

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

### Files Modified
- Backend: `task.resolver.ts`, `solution-adoption.resolver.ts`
- Frontend: Multiple adoption-plan, customer, product, and solution components
- Scripts: `deploy-to-production.sh`

### Testing
- All backend tests pass (364 passed)
- All frontend builds pass
- Import/Export tests pass
