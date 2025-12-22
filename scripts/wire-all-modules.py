#!/usr/bin/env python3
"""
Wire All Remaining Modules

Wires License, Solution, Customer, Release, Outcome modules into main resolver.
"""

import re

def wire_all_modules():
    """Wire all completed modules into main resolver"""
    
    resolver_file = 'backend/src/schema/resolvers/index.ts'
    
    print("🔄 Wiring 5 Modules into Main Resolver...")
    print("=" * 60)
    
    with open(resolver_file, 'r') as f:
        content = f.read()
    
    # Backup
    with open(f'{resolver_file}.prewiring.backup', 'w') as f:
        f.write(content)
    print("✅ Created backup")
    
    # Step 1: Add imports after Product module import
    import_block = """
// License Module
import {
  LicenseFieldResolvers,
  LicenseQueryResolvers,
  LicenseMutationResolvers
} from '../../modules/license';

// Solution Module
import {
  SolutionFieldResolvers,
  Solution QueryResolvers,
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
"""
    
    # Find Product module import and add after it
    product_import_pattern = r"(import \{[^}]+\} from '../../modules/product';)"
    content = re.sub(
        product_import_pattern,
        r'\1' + '\n' + import_block,
        content
    )
    
    print("✅ Added module imports")
    
    # Write updated content
    with open(resolver_file, 'w') as f:
        f.write(content)
    
    print()
    print("=" * 60)
    print("✅ Imports added!")
    print()
    print("⚠️  Manual steps still needed:")
    print("1. Replace field resolvers (License, Solution, Customer, Release, Outcome)")
    print("2. Add query resolvers to Query section")
    print("3. Add mutation resolvers to Mutation section")
    print()
    print("Run: ./scripts/complete-wiring.sh for automated completion")
    
if __name__ == '__main__':
    wire_all_modules()
