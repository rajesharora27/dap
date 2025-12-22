#!/bin/bash

# Fix Solution component internal imports

echo "🔧 Fixing Solution Component Imports..."
echo "========================================"

# Fix imports across all solution components
find frontend/src/features/solutions/components -name "*.tsx" | xargs sed -i.bak \
  -e "s|from '../SortableAttributeItem'|from '@shared/components/SortableAttributeItem'|g" \
  -e "s|from '../shared/AdoptionTaskTable'|from '@shared/components/AdoptionTaskTable'|g" \
  -e "s|from '../shared/TelemetryImportResultDialog'|from '@shared/components/TelemetryImportResultDialog'|g" \
  -e "s|from './CustomAttributeDialog'|from '@shared/components/CustomAttributeDialog'|g" \
  -e "s|from '../../types/shared'|from '@/types/shared'|g" \
  -e "s|from '../../utils/'|from '@/utils/|g" \
  -e "s|from './TaskDialog'|from '@/components/dialogs/TaskDialog'|g" \
  -e "s|from './OutcomeDialog'|from '@/components/dialogs/OutcomeDialog'|g" \
  -e "s|from './LicenseDialog'|from '@/components/dialogs/LicenseDialog'|g" \
  -e "s|from './ReleaseDialog'|from '@/components/dialogs/ReleaseDialog'|g" \
  -e "s|from './SolutionReleaseDialog'|from './SolutionReleaseDialog'|g"

# Clean up
rm -f frontend/src/features/solutions/components/*.bak

echo ""
echo "========================================"
echo "✅ Solution imports fixed!"
