#!/bin/bash

# Script to update import paths for Phase 1 refactoring
# This updates all imports from old lib/ and context locations to new shared/ structure

echo "🔄 Updating import paths for Phase 1 refactoring..."

# Update services (one level deep: ../lib -> ../shared)
echo "📁 Updating services..."
find backend/src/services -name "*.ts" -type f -exec sed -i '' \
  -e "s|from '../lib/audit'|from '../shared/utils/audit'|g" \
  -e "s|from '../lib/changes'|from '../shared/utils/changes'|g" \
  backend/src/services/ProductService.ts \
  backend/src/services/SolutionService.ts \
  backend/src/services/CustomerService.ts 2>/dev/null

# Update schema/resolvers (two levels deep: ../../lib -> ../../shared)
echo "📁 Updating schema/resolvers..."
sed -i '' \
  -e "s|from '../../lib/|from '../../shared/utils/|g" \
  -e "s|from '../../lib/auth'|from '../../shared/auth/auth-helpers'|g" \
  -e "s|from '../../lib/permissions'|from '../../shared/auth/permissions'|g" \
  -e "s|from '../../lib/pubsub'|from '../../shared/pubsub/pubsub'|g" \
  -e "s|from '../../lib/pagination'|from '../../shared/utils/pagination'|g" \
  -e "s|from '../../lib/dataloaders'|from '../../shared/database/dataloaders'|g" \
  backend/src/schema/resolvers/index.ts \
  backend/src/schema/resolvers/solutionAdoption.ts \
  backend/src/schema/resolvers/customerAdoption.ts \
  backend/src/schema/resolvers/tags.ts \
  backend/src/schema/resolvers/backup.ts 2>/dev/null

# Update AI services
echo "📁 Updating AI services..."
sed -i '' \
  -e "s|from '../../lib/permissions'|from '../../shared/auth/permissions'|g" \
  backend/src/services/ai/RBACFilter.ts 2>/dev/null

# Update telemetry service
echo "📁 Updating telemetry service..."
sed -i '' \
  -e "s|from '../../lib/audit'|from '../../shared/utils/audit'|g" \
  backend/src/services/telemetry/telemetryService.ts 2>/dev/null

# Update root files (./context -> ./shared/graphql/context)
echo "📁 Updating root files..."
sed -i '' \
  -e "s|from './context'|from './shared/graphql/context'|g" \
  backend/src/server.ts \
  backend/src/seed.ts \
  backend/src/seed-solutions.ts \
  backend/src/inspect_task.ts \
  backend/src/reproduce_solution_sync.ts \
  backend/src/reproduce_sync_issue.ts 2>/dev/null

# Fix old lib/pagination.ts (should reference ./fallbackStore not ../lib/fallbackStore)
echo "📁 Fixing old lib/pagination.ts..."
sed -i '' \
  -e "s|from '../lib/fallbackStore'|from './fallbackStore'|g" \
  backend/src/lib/pagination.ts 2>/dev/null

echo "✅ Import path updates complete!"
echo ""
echo "Next steps:"
echo "1. Run 'cd backend && npm run build' to test compilation"
echo "2. Fix any remaining import errors manually"
echo "3. Test the application"
