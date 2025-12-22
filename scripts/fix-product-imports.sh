#!/bin/bash

# Fix Product component internal imports

echo "🔧 Fixing Product Component Imports..."
echo "========================================"

# Fix imports in ProductDialog.tsx
echo "📝 Fixing ProductDialog.tsx..."
sed -i.bak \
  -e "s|from '../SortableAttributeItem'|from '@shared/components/SortableAttributeItem'|g" \
  -e "s|from '../../types/shared'|from '@/types/shared'|g" \
  -e "s|from '../../utils/sharedHandlers'|from '@/utils/sharedHandlers'|g" \
  -e "s|from './CustomAttributeDialog'|from '@shared/components/CustomAttributeDialog'|g" \
  -e "s|from './LicenseDialog'|from '@/components/dialogs/LicenseDialog'|g" \
  -e "s|from './OutcomeDialog'|from '@/components/dialogs/OutcomeDialog'|g" \
  -e "s|from './ReleaseDialog'|from '@/components/dialogs/ReleaseDialog'|g" \
  frontend/src/features/products/components/ProductDialog.tsx

# Fix imports in AssignProductDialog.tsx
echo "📝 Fixing AssignProductDialog.tsx..."
sed -i.bak \
  -e "s|from './TaskDialog'|from '@/components/dialogs/TaskDialog'|g" \
  frontend/src/features/products/components/AssignProductDialog.tsx

# Fix imports in ProductManagement.tsx
echo "📝 Fixing ProductManagement.tsx..."
sed -i.bak \
  -e "s|from './dialogs/ProductDialog'|from './ProductDialog'|g" \
  frontend/src/features/products/components/ProductManagement.tsx

# Fix imports in ProductsPanel.tsx
echo "📝 Fixing ProductsPanel.tsx..."
sed -i.bak \
  -e "s|from './dialogs/ProductDialog'|from './ProductDialog'|g" \
  frontend/src/features/products/components/ProductsPanel.tsx

# Fix hook imports
echo "📝 Fixing useProductImportExport.ts..."
sed -i.bak \
  -e "s|from '../utils/productImport'|from '@/utils/productImport'|g" \
  frontend/src/features/products/hooks/useProductImportExport.ts

# Add missing EXPORT query if needed
if ! grep -q "EXPORT_PRODUCT_TO_EXCEL" frontend/src/features/products/graphql/queries.ts; then
  echo "📝 Adding EXPORT_PRODUCT_TO_EXCEL query..."
  cat >> frontend/src/features/products/graphql/queries.ts << 'EOF'

export const EXPORT_PRODUCT_TO_EXCEL = gql`
  query ExportProductToExcel($productId: ID!) {
    exportProductToExcel(productId: $productId)
  }
`;
EOF
fi

# Clean up
rm -f frontend/src/features/products/components/*.bak
rm -f frontend/src/features/products/hooks/*.bak

echo ""
echo "========================================"
echo "✅ Product imports fixed!"
echo ""
echo "Next: Test TypeScript"
echo "  cd frontend && npx tsc --noEmit"
echo ""
