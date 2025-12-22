#!/bin/bash

# Replace all field resolvers with module imports

set -e

RESOLVER_FILE="backend/src/schema/resolvers/index.ts"

echo "🔄 Replacing Field Resolvers..."
echo "========================================"

# Backup
cp "$RESOLVER_FILE" "$RESOLVER_FILE.fields.backup"

# Use awk to replace each field resolver block

# Solution: 176-241 → single line
# Customer: 242-271 → single line  
# Outcome: 430-447 → single line
# License: 448-456 → single line
# Release: 457-527 → single line

awk '
NR == 176 {
    print "  Solution: SolutionFieldResolvers,  // FROM SOLUTION MODULE"
    skip = 1
    next
}
NR == 242 {
    skip = 0
    print "  Customer: CustomerFieldResolvers,  // FROM CUSTOMER MODULE"
    skip = 1
    next
}
NR == 272 {
    skip = 0
}
NR == 430 {
    print "  Outcome: OutcomeFieldResolvers,  // FROM OUTCOME MODULE"
    skip = 1
    next
}
NR == 448 {
    skip = 0
    print "  License: LicenseFieldResolvers,  // FROM LICENSE MODULE"
    skip = 1
    next
}
NR == 457 {
    skip = 0
    print "  Release: ReleaseFieldResolvers,  // FROM RELEASE MODULE"
    skip = 1
    next
}
NR == 528 {
    skip = 0
}
!skip {
    print
}
' "$RESOLVER_FILE.fields.backup" > "$RESOLVER_FILE"

echo "✅ All field resolvers replaced!"
echo ""
echo "Summary of replacements:"
echo "  ✅ Solution field resolvers"
echo "  ✅ Customer field resolvers"
echo "  ✅ Outcome field resolvers"
echo "  ✅ License field resolvers"
echo "  ✅ Release field resolvers"
echo ""
echo "========================================"
echo "🎉 WIRING COMPLETE!"
echo ""
echo "Next: Test the build"
echo "  cd backend && npm run build"
echo ""
