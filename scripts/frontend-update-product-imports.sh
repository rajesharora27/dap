#!/bin/bash

# Update imports for Products feature migration

echo "🔄 Updating Product Feature Imports..."
echo "=========================================="

# Step 1: Update imports WITHIN product components/hooks to use new structure
echo "📝 Step 1: Updating internal Product feature imports..."

# Update GraphQL imports in product files
find frontend/src/features/products -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]../../graphql/mutations|from '@features/products/graphql|g" \
  -e "s|from ['\"]../../graphql/queries|from '@features/products/graphql|g" \
  -e "s|from ['\"]../../../graphql/mutations|from '@features/products/graphql|g" \
  -e "s|from ['\"]../../../graphql/queries|from '@features/products/graphql|g" \
  -e "s|from '@/graphql/mutations|from '@features/products/graphql|g" \
  -e "s|from '@/graphql/queries|from '@features/products/graphql|g"

# Update hooks imports in product components
find frontend/src/features/products/components -name "*.tsx" | xargs sed -i.bak \
  -e "s|from ['\"]../../hooks/useProducts|from '@features/products/hooks/useProducts|g" \
  -e "s|from ['\"]../../../hooks/useProducts|from '@features/products/hooks/useProducts|g" \
  -e "s|from ['\"]../../hooks/useProductImportExport|from '@features/products/hooks/useProductImportExport|g" \
  -e "s|from ['\"]../../../hooks/useProductImportExport|from '@features/products/hooks/useProductImportExport|g"

# Update shared component imports
find frontend/src/features/products -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]../../../components/shared/|from '@shared/components/|g" \
  -e "s|from ['\"]../../components/shared/|from '@shared/components/|g" \
  -e "s|from ['\"]../components/shared/|from '@shared/components/|g" \
  -e "s|from ['\"]../../../components/common/|from '@shared/components/|g" \
  -e "s|from ['\"]../../components/common/|from '@shared/components/|g"

echo "✅ Internal imports updated"

# Step 2: Update EXTERNAL files that import Product components
echo ""
echo "📝 Step 2: Updating external imports to Product components..."

# Update ProductsPage
if [ -f "frontend/src/pages/ProductsPage.tsx" ]; then
  sed -i.bak \
    -e "s|from ['\"]../components/ProductsPanel|from '@features/products|g" \
    -e "s|from ['\"]../components/ProductManagement|from '@features/products|g" \
    frontend/src/pages/ProductsPage.tsx
  echo "✅ Updated ProductsPage.tsx"
fi

# Update any dialogs that import product components
find frontend/src/components -name "*.tsx" | xargs sed -i.bak \
  -e "s|from ['\"]./dialogs/ProductDialog|from '@features/products|g" \
  -e "s|from ['\"]../dialogs/ProductDialog|from '@features/products|g" \
  -e "s|from ['\"]./dialogs/ProductPreviewDialog|from '@features/products|g" \
  -e "s|from ['\"]../dialogs/ProductPreviewDialog|from '@features/products|g" \
  -e "s|from ['\"]./dialogs/AssignProductDialog|from '@features/products|g" \
  -e "s|from ['\"]../dialogs/AssignProductDialog|from '@features/products|g" \
  -e "s|from ['\"]./ProductsPanel|from '@features/products|g" \
  -e "s|from ['\"]../ProductsPanel|from '@features/products|g" \
  -e "s|from ['\"]./ProductManagement|from '@features/products|g" \
  -e "s|from ['\"]../ProductManagement|from '@features/products|g"

echo "✅ External imports updated"

# Step 3: Clean up backup files
echo ""
echo "🧹 Cleaning up backup files..."
find frontend/src -name "*.bak" -delete

echo ""
echo "=========================================="
echo "✅ Product Feature Import Updates Complete!"
echo ""
echo "Next: Test build"
echo "  cd frontend && npm run build"
echo ""
