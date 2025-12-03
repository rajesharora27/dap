#!/bin/bash
# Remove debug console.logs from AssignProductDialog.tsx

FILE="/data/dap/frontend/src/components/dialogs/AssignProductDialog.tsx"

# Remove specific debug patterns
sed -i '/console\.log.*Products data loaded/d' "$FILE"
sed -i '/console\.log.*Products data structure/d' "$FILE"
sed -i '/console\.log.*Products edges:/d' "$FILE"
sed -i '/console\.log.*Edge [0-9]/d' "$FILE"
sed -i '/console\.log.*Has node:/d' "$FILE"
sed -i '/console\.log.*Node id:/d' "$FILE"
sed -i '/console\.log.*Node name:/d' "$FILE"
sed -i '/console\.log.*Processing edges/d' "$FILE"
sed -i '/console\.log.*Mapped products array/d' "$FILE"
sed -i '/console\.log.*Products array length/d' "$FILE"
sed -i '/console\.log.*Product IDs:/d' "$FILE"
sed -i '/console\.log.*Product names:/d' "$FILE"
sed -i '/console\.log.*Rendering product:/d' "$FILE"
sed -i '/console\.log.*Product selected:/d' "$FILE"
sed -i '/console\.log.*Select OPENED/d' "$FILE"
sed -i '/console\.log.*Select CLOSED/d' "$FILE"
sed -i '/console\.log.*Rendering menu item for:/d' "$FILE"
sed -i '/console\.log.*Products array updated/d' "$FILE"

echo "✅ Debug logs removed from $FILE"

