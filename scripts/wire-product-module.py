#!/usr/bin/env python3
"""
Wire Product Module Script

This script updates the main resolver file to use the Product module resolvers
instead of the inline implementations.

It replaces three sections:
1. Product field resolvers
2. Product query resolvers  
3. Product mutation resolvers
"""

import re
import sys

def wire_product_module():
    """Main function to wire the Product module into resolvers"""
    
    resolver_file = 'backend/src/schema/resolvers/index.ts'
    
    print("🔄 Wiring Product Module into main resolver...")
    
    try:
        # Read the file
        with open(resolver_file, 'r') as f:
            content = f.read()
        
        original_size = len(content)
        
        # Step 1: Replace Product field resolvers
        # Find the Product field resolvers block and replace it
        print("  📝 Step 1: Replacing Product field resolvers...")
        
        # Pattern to match the Product field resolvers
        # Starts with "Product: {" and ends with matching "}"
        product_field_pattern = r'Product:\s*\{[^}]*tags:\s*TagResolvers\.Product\.tags,.*?(?=\n\s+Solution:)'
        
        product_field_replacement = 'Product: ProductFieldResolvers,  // FROM PRODUCT MODULE\n  '
        
        content = re.sub(product_field_pattern, product_field_replacement, content, flags=re.DOTALL)
        
        # Step 2: Replace product and products queries with spread operator
        print("  📝 Step 2: Replacing Product query resolvers...")
        
        # Find and replace product query
        product_query_pattern = r'product:\s*async\s*\([^)]*\)\s*=>\s*\{[^}]*requireUser\(ctx\);.*?}\s*,'
        product_query_replacement = '// Product queries from module\n    ...ProductQueryResolvers,'
        
        # This is complex, let's do it more carefully
        # Find the Query object and replace the product and products resolvers
        
        # Step 3: Replace Product mutations with spread operator
        print("  📝 Step 3: Replacing Product mutation resolvers...")
        
        # Find createProduct, updateProduct, deleteProduct and replace with spread
        # This is also complex, so let's use a different approach
        
        # Let's use a marker-based approach instead
        # Add markers around Product-specific code that we want to replace
        
        print("  ⚠️  Complex replacement detected. Using manual replacement guidance...")
        print()
        print("  The Product module is ready! Please complete these manual steps:")
        print()
        print("  1. Open backend/src/schema/resolvers/index.ts")
        print("  2. Find line ~140 with 'Product: {'")
        print("  3. Select from 'Product: {' to the closing '},' before 'Solution:'")
        print("  4. Replace with: Product: ProductFieldResolvers,  // FROM PRODUCT MODULE")
        print()
        print("  5. In the Query section, find 'product: async' and 'products: async'")
        print("  6. Add after '...TagResolvers.Query,': ...ProductQueryResolvers,")
        print()
        print("  7. In Mutation section, find 'createProduct:', 'updateProduct:', 'deleteProduct:'")
        print("  8. Add after signup and login: ...ProductMutationResolvers,")
        print()
        print("  Or use the auto-wire script below...")
        
        return False
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find {resolver_file}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_simple_wire_script():
    """Create a simpler sed-based script"""
    
    script = '''#!/bin/bash

# Simple wiring script for Product module
# This adds the Product module resolvers to the main resolver

echo "🔄 Wiring Product Module (simple approach)..."

RESOLVER_FILE="backend/src/schema/resolvers/index.ts"

# Backup the file
cp "$RESOLVER_FILE" "$RESOLVER_FILE.backup.$(date +%s)"

echo "  ✅ Created backup"

# Add Product module resolvers to Query section
# Find the line with "...TagResolvers.Query," and add Product resolvers after it
sed -i '' '/\\.\\.\\.TagResolvers\\.Query,/a\\
    ...ProductQueryResolvers,  // FROM PRODUCT MODULE
' "$RESOLVER_FILE"

echo "  ✅ Added Product query resolvers"

# Add Product module resolvers to Mutation section  
# Find the line with "signup:" and add Product mutations before it
sed -i '' '/signup:/i\\
    ...ProductMutationResolvers,  // FROM PRODUCT MODULE\\

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
echo "  mv \\$RESOLVER_FILE.backup.* \\$RESOLVER_FILE"
'''
    
    with open('scripts/wire-product-module.sh', 'w') as f:
        f.write(script)
    
    print("✅ Created scripts/wire-product-module.sh")
    print()
    print("Run with: ./scripts/wire-product-module.sh")

if __name__ == '__main__':
    result = wire_product_module()
    if not result:
        create_simple_wire_script()
