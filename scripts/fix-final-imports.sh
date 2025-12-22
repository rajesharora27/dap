#!/bin/bash

# Fix useProducts and useProductImportExport
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { useProducts } from \x27../hooks/useProducts\x27|import { useProducts } from \x27@features/products\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { useProducts } from \x27../../hooks/useProducts\x27|import { useProducts } from \x27@features/products\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { useProductImportExport } from \x27../hooks/useProductImportExport\x27|import { useProductImportExport } from \x27@features/products\x27|g'

# Fix excelService
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { ExcelExportService } from \x27../services/excelService\x27|import { ExcelExportService } from \x27@shared/services/excelService\x27|g'
find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|import { ExcelExportService } from \x27../../services/excelService\x27|import { ExcelExportService } from \x27@shared/services/excelService\x27|g'
# Check if internal imports in useProductImportExport need fix
# It likely imported ../services/excelService. Now it is in features/products/hooks.
# So it needs ../../../shared/services/excelService or @shared/services/excelService.
find frontend/src/features/products/hooks -type f -name "*.ts" | xargs sed -i '' 's|import { ExcelExportService } from \x27../../services/excelService\x27|import { ExcelExportService } from \x27@shared/services/excelService\x27|g'
find frontend/src/features/products/hooks -type f -name "*.ts" | xargs sed -i '' 's|import { ExcelExportService } from \x27../../../services/excelService\x27|import { ExcelExportService } from \x27@shared/services/excelService\x27|g'
