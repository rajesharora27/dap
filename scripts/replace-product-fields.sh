#!/bin/bash

# Replace Product field resolvers with module import

RESOLVER_FILE="backend/src/schema/resolvers/index.ts"

echo "🔄 Replacing Product field resolvers..."

# Create a backup
cp "$RESOLVER_FILE" "$RESOLVER_FILE.fieldresolvers.backup"

# Use awk to replace lines 140-248 with the single line
awk '
NR == 140 {
    print "  Product: ProductFieldResolvers,  // FROM PRODUCT MODULE"
    skip = 1
    next
}
NR == 249 {
    skip = 0
}
!skip {
    print
}
' "$RESOLVER_FILE.fieldresolvers.backup" > "$RESOLVER_FILE"

echo "✅ Product field resolvers replaced!"
echo ""
echo "Backup saved as: $RESOLVER_FILE.fieldresolvers.backup"
