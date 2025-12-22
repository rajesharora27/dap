#!/bin/bash

# Update imports for Solutions feature migration

echo "🔄 Updating Solution Feature Imports..."
echo "=========================================="

# Step 1: Update imports WITHIN solution components to use new structure
echo "📝 Step 1: Updating internal Solution feature imports..."

# Update GraphQL imports in solution files
find frontend/src/features/solutions -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]../../graphql/mutations|from '@features/solutions/graphql|g" \
  -e "s|from ['\"]../../graphql/queries|from '@features/solutions/graphql|g" \
  -e "s|from ['\"]../../../graphql/mutations|from '@features/solutions/graphql|g" \
  -e "s|from ['\"]../../../graphql/queries|from '@features/solutions/graphql|g" \
  -e "s|from '@/graphql/mutations|from '@features/solutions/graphql|g" \
  -e "s|from '@/graphql/queries|from '@features/solutions/graphql|g"

# Update shared component imports
find frontend/src/features/solutions -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]../../../components/shared/|from '@shared/components/|g" \
  -e "s|from ['\"]../../components/shared/|from '@shared/components/|g" \
  -e "s|from ['\"]../components/shared/|from '@shared/components/|g" \
  -e "s|from ['\"]../../../components/common/|from '@shared/components/|g" \
  -e "s|from ['\"]../../components/common/|from '@shared/components/|g"

# Fix cross-component imports within the same feature
find frontend/src/features/solutions/components -name "*.tsx" | xargs sed -i.bak \
  -e "s|from ['\"]./dialogs/SolutionDialog|from './SolutionDialog|g" \
  -e "s|from ['\"]../dialogs/SolutionDialog|from './SolutionDialog|g" \
  -e "s|from ['\"]./dialogs/SolutionPreviewDialog|from './SolutionPreviewDialog|g" \
  -e "s|from ['\"]../dialogs/SolutionPreviewDialog|from './SolutionPreviewDialog|g" \
  -e "s|from ['\"]./dialogs/SolutionReleaseDialog|from './SolutionReleaseDialog|g" \
  -e "s|from ['\"]../dialogs/SolutionReleaseDialog|from './SolutionReleaseDialog|g" \
  -e "s|from ['\"]./dialogs/AssignSolutionDialog|from './AssignSolutionDialog|g" \
  -e "s|from ['\"]../dialogs/AssignSolutionDialog|from './AssignSolutionDialog|g" \
  -e "s|from ['\"]../solution-adoption/|from './|g"

# Step 2: Update EXTERNAL files that import Solution components
echo ""
echo "📝 Step 2: Updating external imports to Solution components..."

# Update SolutionsPage
if [ -f "frontend/src/pages/SolutionsPage.tsx" ]; then
  sed -i.bak \
    -e "s|from ['\"]../components/SolutionsPanel|from '@features/solutions|g" \
    frontend/src/pages/SolutionsPage.tsx
  echo "✅ Updated SolutionsPage.tsx"
fi

# Update any components that import solution dialogs/panels
find frontend/src -name "*.tsx" ! -path "*/features/solutions/*" | xargs sed -i.bak \
  -e "s|from ['\"]./dialogs/SolutionDialog|from '@features/solutions|g" \
  -e "s|from ['\"]../dialogs/SolutionDialog|from '@features/solutions|g" \
  -e "s|from ['\"]./dialogs/SolutionPreviewDialog|from '@features/solutions|g" \
  -e "s|from ['\"]../dialogs/SolutionPreviewDialog|from '@features/solutions|g" \
  -e "s|from ['\"]./SolutionsPanel|from '@features/solutions|g" \
  -e "s|from ['\"]../SolutionsPanel|from '@features/solutions|g"

echo "✅ External imports updated"

# Step 3: Clean up backup files
echo ""
echo "🧹 Cleaning up backup files..."
find frontend/src -name "*.bak" -delete

echo ""
echo "=========================================="
echo "✅ Solution Feature Import Updates Complete!"
echo ""
echo "Next: Test build"
echo "  cd frontend && npm run build"
echo ""
