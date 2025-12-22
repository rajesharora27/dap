#!/bin/bash

# Backend Cleanup Script - Phase 2: Remove Old Files
# Safely removes unused files after imports are updated

set -e

echo "🧹 Backend Cleanup - Phase 2: Remove Old Files"
echo "========================================"
echo ""

# Show what will be removed
echo "📋 Files to be removed:"
echo ""
echo "Old Services:"
ls -lh backend/src/services/{ProductService,SolutionService,CustomerService}.ts 2>/dev/null || echo "  (none found)"
echo ""
echo "Old lib/ directory:"
ls -lh backend/src/lib/ 2>/dev/null | tail -n +2 || echo "  (none found)"
echo ""
echo "Old context.ts:"
ls -lh backend/src/context.ts 2>/dev/null || echo "  (none found)"
echo ""
echo "Backup files:"
find backend/src -name "*.backup*" -type f | wc -l | xargs echo "  Count:"
echo ""

read -p "Continue with removal? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo "📝 Removing files..."
echo ""

# Remove old service files
if [ -f "backend/src/services/ProductService.ts" ]; then
    rm -f backend/src/services/ProductService.ts
    echo "✅ Removed ProductService.ts"
fi

if [ -f "backend/src/services/SolutionService.ts" ]; then
    rm -f backend/src/services/SolutionService.ts
    echo "✅ Removed SolutionService.ts"
fi

if [ -f "backend/src/services/CustomerService.ts" ]; then
    rm -f backend/src/services/CustomerService.ts
    echo "✅ Removed CustomerService.ts"
fi

# Remove old lib directory
if [ -d "backend/src/lib" ]; then
    FILE_COUNT=$(find backend/src/lib -type f | wc -l)
    rm -rf backend/src/lib/
    echo "✅ Removed lib/ directory ($FILE_COUNT files)"
fi

# Remove old context.ts
if [ -f "backend/src/context.ts" ]; then
    rm -f backend/src/context.ts
    echo "✅ Removed context.ts"
fi

# Remove backup files
BACKUP_COUNT=$(find backend/src -name "*.backup*" -type f | wc -l)
if [ "$BACKUP_COUNT" -gt 0 ]; then
    find backend/src -name "*.backup*" -type f -delete
    echo "✅ Removed $BACKUP_COUNT backup files"
fi

echo ""
echo "📝 Final build test..."
cd backend && npm run build
if [ $? -eq 0 ]; then
    echo "✅ Final build successful!"
else
    echo "❌ Build failed! This shouldn't happen after Phase 1."
    exit 1
fi
cd ..

echo ""
echo "========================================"
echo "✅ CLEANUP COMPLETE!"
echo ""
echo "Removed:"
echo "  - 3 old service files"
echo "  - lib/ directory with ~13 files"
echo "  - old context.ts"
echo "  - $BACKUP_COUNT backup files"
echo ""
echo "🎉 Your backend is now clean and fully modular!"
echo ""
