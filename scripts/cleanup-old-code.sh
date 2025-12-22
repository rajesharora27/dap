#!/bin/bash

# Backend Cleanup Script
# Removes old files after modular refactoring

set -e

echo "🧹 Backend Cleanup - Removing Old Code"
echo "========================================"
echo ""

# Step 1: Update remaining imports in old service files (they still reference lib/)
echo "📝 Step 1: Updating imports in old service files..."

# These files will be deleted anyway, but let's update them for completeness
sed -i.cleanup "s|from '../lib/audit'|from '../shared/utils/audit'|g" backend/src/services/ProductService.ts 2>/dev/null || true
sed -i.cleanup "s|from '../lib/changes'|from '../shared/utils/changes'|g" backend/src/services/ProductService.ts 2>/dev/null || true
sed -i.cleanup "s|from '../lib/audit'|from '../shared/utils/audit'|g" backend/src/services/SolutionService.ts 2>/dev/null || true
sed -i.cleanup "s|from '../lib/changes'|from '../shared/utils/changes'|g" backend/src/services/SolutionService.ts 2>/dev/null || true
sed -i.cleanup "s|from '../lib/audit'|from '../shared/utils/audit'|g" backend/src/services/CustomerService.ts 2>/dev/null || true
sed -i.cleanup "s|from '../lib/changes'|from '../shared/utils/changes'|g" backend/src/services/CustomerService.ts 2>/dev/null || true

echo "✅ Imports updated"

# Step 2: Update context.ts to use new shared location
echo "📝 Step 2: Updating context.ts..."

if [ -f "backend/src/context.ts" ]; then
    sed -i.cleanup "s|from './lib/dataloaders'|from './shared/database/dataloaders'|g" backend/src/context.ts
    echo "✅ context.ts updated"
fi

# Step 3: Update server.ts to use new shared location  
echo "📝 Step 3: Updating server.ts..."

if [ -f "backend/src/server.ts" ]; then
    sed -i.cleanup "s|from './lib/sentry'|from './shared/monitoring/sentry'|g" backend/src/server.ts
    echo "✅ server.ts updated"
fi

# Step 4: Update test file
echo "📝 Step 4: Updating test imports..."

if [ -f "backend/src/__tests__/services/customer-service.test.ts" ]; then
    sed -i.cleanup "s|from '../../services/CustomerService'|from '../../modules/customer'|g" backend/src/__tests__/services/customer-service.test.ts
    echo "✅ Test imports updated"
fi

# Step 5: Update main resolver to use module services
echo "📝 Step 5: Updating main resolver service imports..."

sed -i.cleanup "s|from '../../services/ProductService'|from '../../modules/product'|g" backend/src/schema/resolvers/index.ts
sed -i.cleanup "s|from '../../services/SolutionService'|from '../../modules/solution'|g" backend/src/schema/resolvers/index.ts
sed -i.cleanup "s|from '../../services/CustomerService'|from '../../modules/customer'|g" backend/src/schema/resolvers/index.ts

echo "✅ Resolver imports updated"

# Step 6: Build to verify everything still works
echo ""
echo "📝 Step 6: Testing build..."
cd backend && npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Restoring from backups..."
    # Restore if build fails
    find ../backend/src -name "*.cleanup" -exec bash -c 'mv "$1" "${1%.cleanup}"' _ {} \;
    exit 1
fi
cd ..

# Step 7: Remove old files (only if build succeeded)
echo ""
echo "📝 Step 7: Removing old files..."

# Remove old service files (now in modules/)
rm -f backend/src/services/ProductService.ts
rm -f backend/src/services/SolutionService.ts  
rm -f backend/src/services/CustomerService.ts
echo "✅ Removed old service files"

# Remove old lib directory (now in shared/)
rm -rf backend/src/lib/
echo "✅ Removed old lib/ directory"

# Remove old context.ts (now in shared/graphql/)
rm -f backend/src/context.ts
echo "✅ Removed old context.ts"

# Step 8: Remove all backup files
echo ""
echo "📝 Step 8: Removing backup files..."

find backend/src -name "*.backup*" -type f -delete
find backend/src -name "*.cleanup" -type f -delete
echo "✅ Removed all backup files"

# Step 9: Final build test
echo ""
echo "📝 Step 9: Final build test..."
cd backend && npm run build
if [ $? -eq 0 ]; then
    echo "✅ Final build successful!"
else
    echo "❌ Final build failed!"
    exit 1
fi
cd ..

echo ""
echo "========================================"
echo "✅ CLEANUP COMPLETE!"
echo ""
echo "Removed:"
echo "  - Old service files (3 files)"
echo "  - Old lib/ directory (13 files)"
echo "  - Old context.ts"
echo "  - All backup files (6+ files)"
echo ""
echo "Your backend is now clean and modular! 🎉"
echo ""
