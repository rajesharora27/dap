#!/bin/bash

# Backend Cleanup Script - Phase 1: Update All Imports
# Updates all imports to use new shared/ structure

set -e

echo "🧹 Backend Cleanup - Phase 1: Update Imports"
echo "========================================"
echo ""

# Update all context imports to use shared/graphql/context
echo "📝 Updating context imports..."

# Find all files importing from '../context' or '../../context' etc
find backend/src -name "*.ts" -type f ! -path "*/node_modules/*" ! -name "*.backup*" -exec sed -i.cleanup \
    -e "s|from '../context'|from '../shared/graphql/context'|g" \
    -e "s|from '../../context'|from '../../shared/graphql/context'|g" \
    -e "s|from '../../../context'|from '../../../shared/graphql/context'|g" \
    -e "s|from '../../../../context'|from '../../../../shared/graphql/context'|g" \
    -e "s|'../../../context'|'../../../shared/graphql/context'|g" \
    {} \;

echo "✅ Context imports updated"

# Update lib/auth to shared/auth
echo "📝 Updating lib/auth imports..."
find backend/src -name "*.ts" -type f ! -path "*/node_modules/*" ! -name "*.backup*" -exec sed -i.cleanup2 \
    -e "s|from '../lib/auth'|from '../shared/auth/auth-helpers'|g" \
    -e "s|from '../../lib/auth'|from '../../shared/auth/auth-helpers'|g" \
    -e "s|from '../../../lib/auth'|from '../../../shared/auth/auth-helpers'|g" \
    {} \;

echo "✅ lib/auth imports updated"

# Update service imports
echo "📝 Updating service imports..."
find backend/src -name "*.ts" -type f ! -path "*/node_modules/*" ! -name "*.backup*" -exec sed -i.cleanup3 \
    -e "s|from '../../services/ProductService'|from '../../modules/product'|g" \
    -e "s|from '../../services/SolutionService'|from '../../modules/solution'|g" \
    -e "s|from '../../services/CustomerService'|from '../../modules/customer'|g" \
    -e "s|from '../services/ProductService'|from '../modules/product'|g" \
    -e "s|from '../services/SolutionService'|from '../modules/solution'|g" \
    -e "s|from '../services/CustomerService'|from '../modules/customer'|g" \
    {} \;

echo "✅ Service imports updated"

# Clean up .cleanup files
rm -f $(find backend/src -name "*.cleanup*" -type f)

echo ""
echo "📝 Testing build..."
cd backend && npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    cd ..
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ PHASE 1 COMPLETE!"
echo ""
echo "All imports updated to use new shared/ structure"
echo "Ready for Phase 2: Remove old files"
echo ""
