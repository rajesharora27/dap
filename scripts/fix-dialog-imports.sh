#!/bin/bash

# Script to fix remaining imports after moving Tasks, Tags, and Product Dialogs

echo "Fixing remaining imports..."

# 1. ALL_OUTCOMES_ID / ALL_RELEASES_ID
find frontend/src/features -type f -name "*.tsx" | xargs sed -i.bak "s|from '@/components/dialogs/TaskDialog'|from '@features/tasks'|g"
find frontend/src/features -type f -name "*.tsx" | xargs sed -i.bak "s|from '\.\./dialogs/TaskDialog'|from '@features/tasks'|g"
find frontend/src/features -type f -name "*.tsx" | xargs sed -i.bak "s|from '\.\./\.\./components/dialogs/TaskDialog'|from '@features/tasks'|g"

# 2. Product Dialogs (in same feature)
find frontend/src/features/products/components -type f -name "*.tsx" | xargs sed -i.bak "s|from '@/components/dialogs/LicenseDialog'|from './LicenseDialog'|g"
find frontend/src/features/products/components -type f -name "*.tsx" | xargs sed -i.bak "s|from '@/components/dialogs/OutcomeDialog'|from './OutcomeDialog'|g"
find frontend/src/features/products/components -type f -name "*.tsx" | xargs sed -i.bak "s|from '@/components/dialogs/ReleaseDialog'|from './ReleaseDialog'|g"

# 3. Product Dialogs (external)
find frontend/src/features/solutions/components -type f -name "*.tsx" | xargs sed -i.bak "s|from '@/components/dialogs/OutcomeDialog'|from '@features/products'|g"
find frontend/src/features/solutions/components -type f -name "*.tsx" | xargs sed -i.bak "s|from '@/components/dialogs/LicenseDialog'|from '@features/products'|g"

# Cleanup backups
find frontend/src/features -name "*.bak" -delete

echo "Done!"
