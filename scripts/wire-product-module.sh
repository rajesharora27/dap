#!/bin/bash

# Simple wiring script for Product module
# This adds the Product module resolvers to the main resolver

echo "🔄 Wiring Product Module (simple approach)..."

RESOLVER_FILE="backend/src/schema/resolvers/index.ts"

# Backup the file
cp "$RESOLVER_FILE" "$RESOLVER_FILE.backup.$(date +%s)"

echo "  ✅ Created backup"

# Add Product module resolvers to Query section
# Find the line with "...TagResolvers.Query," and add Product resolvers after it
sed -i '' '/\.\.\.TagResolvers\.Query,/a\
    ...ProductQueryResolvers,  // FROM PRODUCT MODULE
' "$RESOLVER_FILE"

echo "  ✅ Added Product query resolvers"

# Add Product module resolvers to Mutation section  
# Find the line with "signup:" and add Product mutations before it
sed -i '' '/signup:/i\
    ...ProductMutationResolvers,  // FROM PRODUCT MODULE\

' "$RESOLVER_FILE"

echo "  ✅ Added Product mutation resolvers"

# For field resolvers, we need to comment out the old one and add the new one
# Find "Product: {" and replace the entire block

echo "  ⚠️  Product field resolvers need manual replacement"
echo "  Please replace the 'Product: { ... }' block (line ~140) with:"
echo "  Product: ProductFieldResolvers,  // FROM PRODUCT MODULE"

echo ""
echo "✅ Partial wiring complete!"
echo "📝 Manual step required: Replace Product field resolvers block"
echo ""
echo "To restore backup if needed:"
echo "  mv \$RESOLVER_FILE.backup.* \$RESOLVER_FILE"
