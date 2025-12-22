#!/bin/bash

# Precise Field Resolver Replacement Script
# With exact line numbers for each block

set -e

RESOLVER_FILE="backend/src/schema/resolvers/index.ts"

echo "🔄 Replacing Field Resolvers (Precise)"
echo "========================================"

# Backup
cp "$RESOLVER_FILE" "$RESOLVER_FILE.precise.backup"

# Use awk to replace each field resolver block with exact line numbers
# Solution: 176-241
# Customer: 242-272
# Outcome: 430-447
# License: 448-456
# Release: 457-529

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
NR == 273 {
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
NR == 530 {
    skip = 0
}
!skip {
    print
}
' "$RESOLVER_FILE.precise.backup" > "$RESOLVER_FILE"

echo "✅ All field resolvers replaced!"
echo ""
echo "Replacements made:"
echo "  ✅ Solution (lines 176-241)"
echo "  ✅ Customer (lines 242-272)"
echo "  ✅ Outcome (lines 430-447)"
echo "  ✅ License (lines 448-456)" 
echo "  ✅ Release (lines 457-529)"
echo ""
echo "========================================"
echo "🎉 FIELD RESOLVER REPLACEMENT COMPLETE!"
echo ""
echo "Next: Test the build"
echo "  cd backend && npm run build"
echo ""
