#!/bin/bash

# Script to convert all Chip components to outlined variant
# This updates the frontend to use consistent outlined chips

cd /data/dap/frontend/src

# List of files to update
FILES=$(find . -name "*.tsx" -o -name "*.ts")

echo "Converting Chips to outlined variant..."

for file in $FILES; do
  # Skip files that have already been processed
  if [[ "$file" == *"AdoptionTaskTable"* ]]; then
    continue
  fi
  
  # Replace chips with solid backgrounds to outlined variant
  # Pattern 1: Chips with bgcolor but no variant
  sed -i 's/\(<Chip[^>]*\)\(sx={{ [^}]*bgcolor:[^,}]*[,}][^}]*}}\)/\1variant="outlined" \2/g' "$file"
  
  # Pattern 2: Add variant="outlined" to chips without it
  # This is a safer incremental approach
done

echo "Done! Please review changes with git diff"
