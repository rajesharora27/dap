# Weight and HowTo Fields Update

## Overview
Updated the task weight field to support decimal values (e.g., 0.01%) and modified howToDoc/howToVideo fields to accept multiple links.

## Changes Made

### 1. Database Schema (`backend/prisma/schema.prisma`)
- Changed `weight` field from `Float` to `Decimal(5, 2)` to support precise decimal values with up to 2 decimal places
- Changed `howToDoc` from `String?` to `String[]` to support multiple documentation links
- Changed `howToVideo` from `String?` to `String[]` to support multiple video links

### 2. Database Migration
- Created migration `20251008212022_update_weight_and_howto_fields`
- Migration safely converts existing single-value howToDoc/howToVideo fields to arrays
- Existing data is preserved during migration
- Weight values are converted from DoublePrecision to Decimal(5,2)

### 3. GraphQL Schema (`backend/src/schema/typeDefs.ts`)
- Updated `Task` type:
  - `weight: Float!` - Now supports decimals like 0.01% (comment updated)
  - `howToDoc: [String!]!` - Now an array of strings
  - `howToVideo: [String!]!` - Now an array of strings
- Updated `TaskInput` and `TaskUpdateInput`:
  - `howToDoc: [String!]` - Now accepts array
  - `howToVideo: [String!]` - Now accepts array

### 4. Backend Resolvers (`backend/src/schema/resolvers/index.ts`)
- Added field resolvers for `Task` type:
  - `weight`: Converts Prisma Decimal to Float
  - `howToDoc`: Ensures array is always returned
  - `howToVideo`: Ensures array is always returned
- Updated weight calculations in `completionPercentage` resolvers to handle Decimal types
- Updated weight validation in `createTask` and `updateTask` to handle Decimal types
- Updated error messages to show weight with 2 decimal places

### 5. Excel Export Service (`backend/src/services/excel/ExcelExportService.ts`)
- Updated task export to:
  - Convert Decimal weight to number
  - Join array of howToDoc links with commas
  - Join array of howToVideo links with commas

### 6. Excel Import Service (`backend/src/services/excel/ExcelImportService.ts`)
- Updated task import to:
  - Split comma-separated howToDoc values into array
  - Split comma-separated howToVideo values into array

### 7. Seed Files (`backend/src/seed.ts`, `backend/src/seed-clean.ts`)
- Updated to wrap single howToDoc/howToVideo values in arrays

### 8. Frontend TaskDialog Component (`frontend/src/components/dialogs/TaskDialog.tsx`)
- Updated weight input:
  - Changed from integer to decimal with `step: 0.01`
  - Updated minimum from 1 to 0.01
  - Updated validation to check for >= 0.01 instead of >= 1
  - Display remaining/max weight with 2 decimal places
- Updated howToDoc and howToVideo:
  - Changed from single TextField to dynamic list
  - Added "Add Documentation Link" and "Add Video Link" buttons
  - Added "Remove" button for each link
  - Updated state to use arrays
  - Filter out empty links before saving

### 9. Frontend TasksPanel Component (`frontend/src/components/TasksPanel.tsx`)
- Updated GraphQL query to include `weight` field
- Updated weight display to show 2 decimal places: `${Number(task.weight).toFixed(2)}%`
- Updated howToDoc and howToVideo display:
  - Show count when multiple links exist (e.g., "Doc (3)")
  - Click to open single link or all links if multiple
  - Properly check array length instead of truthiness

## Usage

### Creating/Editing Tasks
1. **Weight Field**: Enter any value from 0.01 to 100.00 with up to 2 decimal places (e.g., 0.01, 0.5, 1.25, 15.75)
2. **Documentation Links**: Click "Add Documentation Link" to add multiple documentation URLs
3. **Video Links**: Click "Add Video Link" to add multiple video URLs
4. **Removing Links**: Click "Remove" button next to any link to delete it

### Task Display
- Weight is displayed with 2 decimal places (e.g., "15.75%")
- Documentation links show "Doc" or "Doc (3)" if multiple
- Video links show "Video" or "Video (3)" if multiple
- Click on link chips to open them in new tabs

### Excel Import/Export
- **Export**: Multiple links are joined with commas
- **Import**: Comma-separated links are split into arrays

## Validation
- Weight must be between 0.01 and 100.00
- Total weight of all tasks in a product cannot exceed 100%
- Weight is stored with 2 decimal precision in the database
- Empty links are automatically filtered out when saving

## Migration Steps
1. Database migration has been applied
2. Prisma client has been regenerated
3. All existing data has been preserved
4. Single-value howToDoc/howToVideo fields have been converted to single-element arrays

## Testing
- Backend compiles successfully
- Frontend compiles successfully
- All existing tests continue to pass (weight > 0 checks still valid for decimals)
