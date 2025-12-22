#!/bin/bash

# Fix useProductImportExport imports
sed -i '' 's|import { importProductData, ImportStats } from \x27../utils/productImport\x27|import { importProductData, ImportStats } from \x27@/utils/productImport\x27|g' frontend/src/features/products/hooks/useProductImportExport.ts

# Fix implicit any
sed -i '' 's|stats.warnings.forEach(w =>|stats.warnings.forEach((w: string) =>|g' frontend/src/features/products/hooks/useProductImportExport.ts
