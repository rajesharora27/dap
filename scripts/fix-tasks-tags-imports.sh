#!/bin/bash

# Script to fix imports for Tasks and Tags features

echo "Fixing imports in Tasks and Tags features..."

# Fix Tasks feature
TARGET="frontend/src/features/tasks/components"
find "$TARGET" -type f -name "*.tsx" | xargs sed -i.bak "s|import { Release } from '../../types/shared'|import { Release } from '@/types/shared'|g"
find "$TARGET" -type f -name "*.tsx" | xargs sed -i.bak "s|import TelemetryConfiguration from '../telemetry/TelemetryConfiguration'|import TelemetryConfiguration from '@/components/telemetry/TelemetryConfiguration'|g"
find "$TARGET" -type f -name "*.tsx" | xargs sed -i.bak "s|import { ProductTag } from './TagDialog'|import { ProductTag } from '@features/tags'|g"
find "$TARGET" -type f -name "*.tsx" | xargs sed -i.bak "s|from '\.\./\.\./graphql/queries'|from '../graphql'|g"
find "$TARGET" -type f -name "*.tsx" | xargs sed -i.bak "s|from '\.\./\.\./graphql/mutations'|from '../graphql'|g"

# Fix Tags feature
TARGET="frontend/src/features/tags/components"
# No specific external dependencies yet but let's be safe
find "$TARGET" -type f -name "*.tsx" | xargs sed -i.bak "s|from '\.\./\.\./graphql/queries'|from '../graphql'|g"
find "$TARGET" -type f -name "*.tsx" | xargs sed -i.bak "s|from '\.\./\.\./graphql/mutations'|from '../graphql'|g"

# Cleanup backups
find frontend/src/features/tasks -name "*.bak" -delete
find frontend/src/features/tags -name "*.bak" -delete

echo "Done!"
