#!/bin/bash

# Corrected Complete Module Wiring Script

set -e

RESOLVER_FILE="backend/src/schema/resolvers/index.ts"

echo "🚀 Complete Module Wiring (Corrected)"
echo "========================================"
echo ""

# Backup
cp "$RESOLVER_FILE" "$RESOLVER_FILE.final2.backup"
echo "✅ Created backup"

# Step 1: Add imports (same as before - this worked)
echo "📝 Adding module imports..."

PRODUCT_IMPORT_LINE=$(grep -n "from '../../modules/product'" "$RESOLVER_FILE" | cut -d: -f1)
INSERT_LINE=$((PRODUCT_IMPORT_LINE + 1))

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

sed -i.bak "${INSERT_LINE}r /tmp/module_imports.txt" "$RESOLVER_FILE"
rm "$RESOLVER_FILE.bak"

echo "✅ Module imports added"

# Step 2: Add to Query section
echo "📝 Adding query resolvers..."

# Find the exact line with ProductQueryResolvers and add after it
sed -i.bak '/\.\.\.ProductQueryResolvers,  \/\/ FROM PRODUCT MODULE/a\
    ...LicenseQueryResolvers,\
    ...SolutionQueryResolvers,\
    ...CustomerQueryResolvers,\
    ...ReleaseQueryResolvers,\
    ...OutcomeQueryResolvers,
' "$RESOLVER_FILE"
rm "$RESOLVER_FILE.bak"

echo "✅ Query resolvers added"

# Step 3: Add to Mutation section
echo "📝 Adding mutation resolvers..."

# Find ProductMutationResolvers and add after it
sed -i.bak '/\.\.\.ProductMutationResolvers,  \/\/ FROM PRODUCT MODULE/a\
    ...LicenseMutationResolvers,\
    ...SolutionMutationResolvers,\
    ...CustomerMutationResolvers,\
    ...ReleaseMutationResolvers,\
    ...OutcomeMutationResolvers,
' "$RESOLVER_FILE"
rm "$RESOLVER_FILE.bak"

echo "✅ Mutation resolvers added"

echo ""
echo "========================================"
echo "✅ Query and Mutation wiring complete!"
echo ""
echo "Next: Replace field resolvers"
echo "  ./scripts/replace-field-resolvers.sh"
echo ""
