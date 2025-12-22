#!/bin/bash

# Update imports for shared components moved to shared/components/

echo "🔄 Updating imports for shared components..."
echo "=============================================="

# Update FAIcon imports
echo "📝 Updating FAIcon imports..."
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]../components/common/FAIcon|from '@shared/components/FAIcon|g" \
  -e "s|from ['\"]../../components/common/FAIcon|from '@shared/components/FAIcon|g" \
  -e "s|from ['\"]../../../components/common/FAIcon|from '@shared/components/FAIcon|g" \
  -e "s|from ['\"]@/components/common/FAIcon|from '@shared/components/FAIcon|g"

# Update InlineEditableText imports
echo "📝 Updating InlineEditableText imports..."
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]../components/common/InlineEditableText|from '@shared/components/InlineEditableText|g" \
  -e "s|from ['\"]../../components/common/InlineEditableText|from '@shared/components/InlineEditableText|g" \
  -e "s|from ['\"]../../../components/common/InlineEditableText|from '@shared/components/InlineEditableText|g"

# Update ErrorBoundary imports
echo "📝 Updating ErrorBoundary imports..."
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]./components/ErrorBoundary|from '@shared/components/ErrorBoundary|g" \
  -e "s|from ['\"]../components/ErrorBoundary|from '@shared/components/ErrorBoundary|g" \
  -e "s|from ['\"]../../components/ErrorBoundary|from '@shared/components/ErrorBoundary|g"

# Update ThemeSelector imports
echo "📝 Updating ThemeSelector imports..."
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]./components/ThemeSelector|from '@shared/components/ThemeSelector|g" \
  -e "s|from ['\"]../components/ThemeSelector|from '@shared/components/ThemeSelector|g" \
  -e "s|from ['\"]../../components/ThemeSelector|from '@shared/components/ThemeSelector|g"

# Update Sortable components
echo "📝 Updating Sortable component imports..."
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]./components/SortableAttributeItem|from '@shared/components/SortableAttributeItem|g" \
  -e "s|from ['\"]../components/SortableAttributeItem|from '@shared/components/SortableAttributeItem|g" \
  -e "s|from ['\"]./components/SortableTaskItem|from '@shared/components/SortableTaskItem|g" \
  -e "s|from ['\"]../components/SortableTaskItem|from '@shared/components/SortableTaskItem|g"

# Update shared folder components
echo "📝 Updating shared folder component imports..."
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]./components/shared/AdoptionTaskTable|from '@shared/components/AdoptionTaskTable|g" \
  -e "s|from ['\"]../components/shared/AdoptionTaskTable|from '@shared/components/AdoptionTaskTable|g" \
  -e "s|from ['\"]../../components/shared/AdoptionTaskTable|from '@shared/components/AdoptionTaskTable|g" \
  -e "s|from ['\"]./components/shared/TaskDetailsDialog|from '@shared/components/TaskDetailsDialog|g" \
  -e "s|from ['\"]../components/shared/TaskDetailsDialog|from '@shared/components/TaskDetailsDialog|g" \
  -e "s|from ['\"]../../components/shared/TaskDetailsDialog|from '@shared/components/TaskDetailsDialog|g" \
  -e "s|from ['\"]./components/shared/TelemetryImportResultDialog|from '@shared/components/TelemetryImportResultDialog|g" \
  -e "s|from ['\"]../components/shared/TelemetryImportResultDialog|from '@shared/components/TelemetryImportResultDialog|g" \
  -e "s|from ['\"]../../components/shared/TelemetryImportResultDialog|from '@shared/components/TelemetryImportResultDialog|g"

# Update CustomAttributeDialog
echo "📝 Updating CustomAttributeDialog imports..."
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak \
  -e "s|from ['\"]./components/dialogs/CustomAttributeDialog|from '@shared/components/CustomAttributeDialog|g" \
  -e "s|from ['\"]../components/dialogs/CustomAttributeDialog|from '@shared/components/CustomAttributeDialog|g" \
  -e "s|from ['\"]../../components/dialogs/CustomAttributeDialog|from '@shared/components/CustomAttributeDialog|g" \
  -e "s|from ['\"]./dialogs/CustomAttributeDialog|from '@shared/components/CustomAttributeDialog|g" \
  -e "s|from ['\"]../dialogs/CustomAttributeDialog|from '@shared/components/CustomAttributeDialog|g"

# Clean up backup files
echo "🧹 Cleaning up backup files..."
find frontend/src -name "*.bak" -delete

echo ""
echo "=============================================="
echo "✅ Import updates complete!"
echo ""
echo "Next: Test the build"
echo "  cd frontend && npm run build"
echo ""
