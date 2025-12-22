#!/bin/bash

# Automated Module Migration Script
# This script creates the structure for multiple backend modules

set -e  # Exit on error

echo "🚀 Starting Automated Module Migration"
echo "======================================"
echo ""

# Function to create a module structure
create_module() {
    local MODULE_NAME=$1
    local MODULE_DIR="backend/src/modules/$MODULE_NAME"
    
    echo "📦 Creating module: $MODULE_NAME"
    
    # Create directories
    mkdir -p "$MODULE_DIR/__tests__"
    
    # Create placeholder files
    touch "$MODULE_DIR/${MODULE_NAME}.types.ts"
    touch "$MODULE_DIR/${MODULE_NAME}.schema.graphql"
    touch "$MODULE_DIR/${MODULE_NAME}.service.ts"
    touch "$MODULE_DIR/${MODULE_NAME}.resolver.ts"
    touch "$MODULE_DIR/index.ts"
    
    echo "  ✅ Created directory structure for $MODULE_NAME"
}

# Create modules in order
MODULES=(
    "solution"
    "customer"
    "license"
    "release"
    "outcome"
    "task"
)

for module in "${MODULES[@]}"; do
    create_module "$module"
    echo ""
done

echo "======================================"
echo "✅ All module structures created!"
echo ""
echo "Next steps:"
echo "1. Populate each module with extracted code"
echo "2. Wire modules into main resolver"
echo "3. Test each module"
echo ""
