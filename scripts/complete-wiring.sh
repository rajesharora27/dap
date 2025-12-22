#!/bin/bash

# Complete Module Wiring Script
# Wires License, Solution, Customer, Release, Outcome modules

set -e

RESOLVER_FILE="backend/src/schema/resolvers/index.ts"

echo "🚀 Complete Module Wiring"
echo "========================================"
echo ""

# Backup
cp "$RESOLVER_FILE" "$RESOLVER_FILE.final.backup"
echo "✅ Created final backup"

# Step 1: Add imports (after Product module import - around line 63)
echo "📝 Adding module imports..."

# Find the line number where Product module is imported
PRODUCT_IMPORT_LINE=$(grep -n "from '../../modules/product'" "$RESOLVER_FILE" | cut -d: -f1)

if [ -z "$PRODUCT_IMPORT_LINE" ]; then
    echo "❌ Error: Could not find Product module import"
    exit 1
fi

# Calculate insertion point (after Product import)
INSERT_LINE=$((PRODUCT_IMPORT_LINE + 1))

# Create import block
cat > /tmp/module_imports.txt << 'EOF'

// License Module
import {
  LicenseFieldResolvers,
  LicenseQueryResolvers,
  LicenseMutationResolvers
} from '../../modules/license';

// Solution Module
import {
  SolutionFieldResolvers,
  SolutionQueryResolvers,
  SolutionMutationResolvers
} from '../../modules/solution';

// Customer Module
import {
  CustomerFieldResolvers,
  CustomerQueryResolvers,
  CustomerMutationResolvers
} from '../../modules/customer';

// Release Module
import {
  ReleaseFieldResolvers,
  ReleaseQueryResolvers,
  ReleaseMutationResolvers
} from '../../modules/release';

// Outcome Module
import {
  OutcomeFieldResolvers,
  OutcomeQueryResolvers,
  OutcomeMutationResolvers
} from '../../modules/outcome';
EOF

# Insert imports
sed -i.bak "${INSERT_LINE}r /tmp/module_imports.txt" "$RESOLVER_FILE"
rm "$RESOLVER_FILE.bak"

echo "✅ Module imports added"

# Step 2: Add to Query section (after ProductQueryResolvers spread)
echo "📝 Adding query resolvers..."

sed -i.bak '/\.\.\.ProductQueryResolvers,/a\
    ...LicenseQueryResolvers,  \/\/ FROM LICENSE MODULE\
    ...SolutionQueryResolvers,  \/\/ FROM SOLUTION MODULE\
    ...CustomerQueryResolvers,  \/\/ FROM CUSTOMER MODULE\
    ...ReleaseQueryResolvers,  \/\/ FROM RELEASE MODULE\
    ...OutcomeQueryResolvers,  \/\/ FROM OUTCOME MODULE
' "$RESOLVER_FILE"
rm "$RESOLVER_FILE.bak"

echo "✅ Query resolvers added"

# Step 3: Add to Mutation section (after ProductMutationResolvers spread)
echo "📝 Adding mutation resolvers..."

sed -i.bak '/\.\.\.ProductMutationResolvers,/a\
    ...LicenseMutationResolvers,  \/\/ FROM LICENSE MODULE\
    ...SolutionMutationResolvers,  \/\/ FROM SOLUTION MODULE\
    ...CustomerMutationResolvers,  \/\/ FROM CUSTOMER MODULE\
    ...ReleaseMutationResolvers,  \/\/ FROM RELEASE MODULE\
    ...OutcomeMutationResolvers,  \/\/ FROM OUTCOME MODULE
' "$RESOLVER_FILE"
rm "$RESOLVER_FILE.bak"

echo "✅ Mutation resolvers added"

echo ""
echo "========================================"
echo "✅ Module wiring complete!"
echo ""
echo "⚠️  Field resolvers still need replacement:"
echo "  - License: { ... } → License: LicenseFieldResolvers,"
echo "  - Solution: { ... } → Solution: SolutionFieldResolvers,"
echo "  - Customer: { ... } → Customer: CustomerFieldResolvers,"
echo "  - Release: { ... } → Release: ReleaseFieldResolvers,"
echo "  - Outcome: { ... } → Outcome: OutcomeFieldResolvers,"
echo ""
echo "Run: ./scripts/replace-field-resolvers.sh"
echo ""
