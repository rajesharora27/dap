#!/bin/bash

# Direct Database Cleanup Script
# Uses the pre-collected task and product IDs

echo "🗑️  DIRECT DATABASE CLEANUP"
echo "=========================="
echo ""

if [ ! -f "/tmp/all_task_ids.txt" ] || [ ! -f "/tmp/all_product_ids.txt" ]; then
    echo "❌ Missing data files. Run the Python data collection first."
    exit 1
fi

task_count=$(wc -l < /tmp/all_task_ids.txt)
product_count=$(wc -l < /tmp/all_product_ids.txt)

echo "Found:"
echo "  📋 $task_count tasks to delete"
echo "  📦 $product_count products to delete"
echo ""
read -p "Continue? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🗑️  Step 1: Deleting tasks..."

deleted_tasks=0
while IFS= read -r task_id; do
    if [ -n "$task_id" ]; then
        # Queue task for soft deletion
        result=$(curl -X POST -s \
                     -H "Content-Type: application/json" \
                     -d "{\"query\":\"mutation { queueTaskSoftDelete(id: \\\"$task_id\\\") }\"}" \
                     http://localhost:4000/graphql)
        
        if echo "$result" | grep -q "true"; then
            ((deleted_tasks++))
        fi
        
        if [ $((deleted_tasks % 10)) -eq 0 ]; then
            echo "  Queued $deleted_tasks/$task_count tasks..."
        fi
    fi
done < /tmp/all_task_ids.txt

echo "  Queued $deleted_tasks tasks for deletion"

# Process the deletion queue
echo "  Processing deletion queue..."
result=$(curl -X POST -s \
             -H "Content-Type: application/json" \
             -d '{"query":"mutation { processDeletionQueue(limit: 1000) }"}' \
             http://localhost:4000/graphql)

processed=$(echo "$result" | grep -o '"processDeletionQueue":[0-9]*' | cut -d':' -f2 || echo "0")
echo "✅ Processed $processed task deletions"

echo ""
echo "🗑️  Step 2: Deleting licenses..."

# Get and delete licenses
python3 << 'EOF'
import subprocess
import json

query = """
query {
  licenses {
    id
    name
  }
}
"""

result = subprocess.run([
    'curl', '-X', 'POST', '-s',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'query': query}),
    'http://localhost:4000/graphql'
], capture_output=True, text=True)

try:
    response = json.loads(result.stdout)
    licenses = response['data']['licenses']
    print(f"Deleting {len(licenses)} licenses...")
    
    deleted = 0
    for license in licenses:
        delete_query = f"""
        mutation {{
          deleteLicense(id: "{license['id']}")
        }}
        """
        
        delete_result = subprocess.run([
            'curl', '-X', 'POST', '-s',
            '-H', 'Content-Type: application/json',
            '-d', json.dumps({'query': delete_query}),
            'http://localhost:4000/graphql'
        ], capture_output=True, text=True)
        
        if 'true' in delete_result.stdout:
            deleted += 1
    
    print(f"✅ Deleted {deleted} licenses")
    
except Exception as e:
    print("Error deleting licenses:", str(e))
EOF

echo ""
echo "🗑️  Step 3: Deleting products..."

deleted_products=0
while IFS= read -r product_id; do
    if [ -n "$product_id" ]; then
        result=$(curl -X POST -s \
                     -H "Content-Type: application/json" \
                     -d "{\"query\":\"mutation { deleteProduct(id: \\\"$product_id\\\") }\"}" \
                     http://localhost:4000/graphql)
        
        if echo "$result" | grep -q '"deleteProduct":true'; then
            ((deleted_products++))
        fi
        
        if [ $((deleted_products % 10)) -eq 0 ] && [ $deleted_products -gt 0 ]; then
            echo "  Deleted $deleted_products/$product_count products..."
        fi
    fi
done < /tmp/all_product_ids.txt

echo "✅ Deleted $deleted_products products"

echo ""
echo "✨ Step 4: Creating 3 clean products..."

products_created=0

# Product 1
echo "  Creating E-Commerce Platform..."
result=$(curl -X POST -s \
             -H "Content-Type: application/json" \
             -d '{"query":"mutation { createProduct(input: { name: \"E-Commerce Platform\", description: \"Complete online shopping solution with payment gateway\" }) { id name } }"}' \
             http://localhost:4000/graphql)

if echo "$result" | grep -q '"createProduct"' && ! echo "$result" | grep -q '"errors"'; then
    ((products_created++))
    echo "    ✅ Created"
else
    echo "    ❌ Failed"
fi

# Product 2  
echo "  Creating Mobile Banking App..."
result=$(curl -X POST -s \
             -H "Content-Type: application/json" \
             -d '{"query":"mutation { createProduct(input: { name: \"Mobile Banking App\", description: \"Secure mobile banking with biometric authentication\" }) { id name } }"}' \
             http://localhost:4000/graphql)

if echo "$result" | grep -q '"createProduct"' && ! echo "$result" | grep -q '"errors"'; then
    ((products_created++))
    echo "    ✅ Created"
else
    echo "    ❌ Failed"
fi

# Product 3
echo "  Creating Healthcare CRM..."
result=$(curl -X POST -s \
             -H "Content-Type: application/json" \
             -d '{"query":"mutation { createProduct(input: { name: \"Healthcare CRM\", description: \"Patient management system with appointment scheduling\" }) { id name } }"}' \
             http://localhost:4000/graphql)

if echo "$result" | grep -q '"createProduct"' && ! echo "$result" | grep -q '"errors"'; then
    ((products_created++))
    echo "    ✅ Created"
else
    echo "    ❌ Failed"
fi

echo ""
echo "🎉 DATABASE CLEANUP COMPLETE!"
echo "============================"
echo "  ✅ Created: $products_created new products"
echo ""
echo "Your database now has clean data:"
echo "  1. E-Commerce Platform"
echo "  2. Mobile Banking App"  
echo "  3. Healthcare CRM"
echo ""
echo "🔄 Refresh your browser (Ctrl+Shift+R) to see the clean data!"

# Clean up temp files
rm -f /tmp/all_task_ids.txt /tmp/all_product_ids.txt