#!/bin/bash

# Script to fix imports for the Customers feature
# Target directory: frontend/src/features/customers

TARGET_DIR="frontend/src/features/customers"

echo "Fixing imports in $TARGET_DIR..."

# 1. Update relative imports to @shared/components
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|import { \(.*\) } from '\.\./shared/\(.*\)'|import { \1 } from '@shared/components/\2'|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|import { \(.*\) } from '\.\./\.\./shared/\(.*\)'|import { \1 } from '@shared/components/\2'|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./shared/components'|from '@shared/components'|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./\.\./shared/components'|from '@shared/components'|g"

# 2. Update imports to @features/products
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./dialogs/AssignProductDialog'|from '@features/products'|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./\.\./dialogs/AssignProductDialog'|from '@features/products'|g"

# 3. Update internal imports (e.g., dialogs moved to the same level)
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|rom '\./TaskDialog'|rom '@/components/dialogs/TaskDialog'|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|rom '\./dialogs/TaskDialog'|rom '@/components/dialogs/TaskDialog'|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\./dialogs/|from './|g"

# 4. Update imports to @/utils and @/types
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./utils/|from '@/utils/|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./\.\./utils/|from '@/utils/|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./types/|from '@/types/|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./\.\./types/|from '@/types/|g"

# 5. Fix config import
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./config/|from '@/config/|g"
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./\.\./config/|from '@/config/|g"

# 6. Update GraphQL and Types to use internal feature paths or @features/customers
# Since they are moved to graphql/ and types.ts within the feature
# For now, let's point components to the feature barrel or internal paths
# CustomerAdoptionPanelV4 is now CustomersPanel in components/
# CustomersPanel.tsx:
# import { CustomerDialog } from './dialogs/CustomerDialog'; -> import { CustomerDialog } from './CustomerDialog'; (handled by rule 3)

# 7. Update AuthContext
find "$TARGET_DIR" -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i.bak "s|from '\.\./AuthContext'|from '@/components/AuthContext'|g"

# 8. Update SolutionAdoptionPlanView imports
# In CustomerSolutionPanel.tsx:
# import { SolutionAdoptionPlanView } from './solution-adoption/SolutionAdoptionPlanView'; -> (should be fine as it's still relative)

# Remove backups
find "$TARGET_DIR" -name "*.bak" -delete

echo "Done!"
