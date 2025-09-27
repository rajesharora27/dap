#!/bin/bash

# Comprehensive Database Reset Script
# Handles all dependencies: tasks, licenses, then products

echo "🗃️  COMPREHENSIVE DATABASE RESET"
echo "================================"
echo ""
echo "This will:"
echo "1. Delete ALL tasks from all products"
echo "2. Delete ALL licenses" 
echo "3. Delete ALL products"
echo "4. Create 3 clean products (no tasks/licenses)"
echo ""
echo "⚠️  WARNING: This will delete EVERYTHING in the database!"
echo ""
read -p "Continue? Type 'YES' to confirm: " confirm

if [ "$confirm" != "YES" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🔍 Step 1: Getting all tasks, licenses, and products..."

# Get all data we need to delete
python3 << 'EOF'
import subprocess
import json

print("Fetching all tasks...")

# Get all tasks
query = """
query {
  tasks {
    edges {
      node {
        id
        name
      }
    }
    totalCount
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
    if 'data' in response:
        tasks = response['data']['tasks']['edges']
        print(f"Found {len(tasks)} tasks")
        
        with open('/tmp/task_ids.txt', 'w') as f:
            for edge in tasks:
                f.write(edge['node']['id'] + '\n')
    else:
        print("Error fetching tasks:", response)
        exit(1)
except Exception as e:
    print("Error:", str(e))
    print("Response:", result.stdout)
    exit(1)

print("Fetching all licenses...")

# Get all licenses  
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
    if 'data' in response:
        licenses = response['data']['licenses']
        print(f"Found {len(licenses)} licenses")
        
        with open('/tmp/license_ids.txt', 'w') as f:
            for license in licenses:
                f.write(license['id'] + '\n')
    else:
        print("Error fetching licenses:", response)
except Exception as e:
    print("Error:", str(e))

print("Fetching all products...")

# Get all products
query = """
query {
  products {
    edges {
      node {
        id
        name
      }
    }
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
    if 'data' in response:
        products = response['data']['products']['edges']
        print(f"Found {len(products)} products")
        
        with open('/tmp/product_ids.txt', 'w') as f:
            for edge in products:
                f.write(edge['node']['id'] + '\n')
    else:
        print("Error fetching products:", response)
except Exception as e:
    print("Error:", str(e))

print("Data collection complete!")
EOF

if [ $? -ne 0 ]; then
    echo "❌ Failed to collect data"
    exit 1
fi

echo ""
echo "🗑️  Step 2: Deleting all tasks..."

if [ -f "/tmp/task_ids.txt" ] && [ -s "/tmp/task_ids.txt" ]; then
    task_count=$(wc -l < /tmp/task_ids.txt)
    deleted_tasks=0
    
    while IFS= read -r task_id; do
        if [ -n "$task_id" ]; then
            # Try soft delete first (if available), then hard delete
            curl -X POST -s \
                 -H "Content-Type: application/json" \
                 -d "{\"query\":\"mutation { queueTaskSoftDelete(id: \\\"$task_id\\\") }\"}" \
                 http://localhost:4000/graphql > /dev/null
            
            ((deleted_tasks++))
            if [ $((deleted_tasks % 10)) -eq 0 ]; then
                echo "  Processed $deleted_tasks/$task_count tasks..."
            fi
        fi
    done < /tmp/task_ids.txt
    
    echo "  Queued $deleted_tasks tasks for deletion"
    
    # Process the deletion queue
    echo "  Processing deletion queue..."
    curl -X POST -s \
         -H "Content-Type: application/json" \
         -d '{"query":"mutation { processDeletionQueue(limit: 1000) }"}' \
         http://localhost:4000/graphql > /dev/null
         
    echo "✅ Tasks deleted"
else
    echo "  No tasks to delete"
fi

echo ""
echo "🗑️  Step 3: Deleting all licenses..."

if [ -f "/tmp/license_ids.txt" ] && [ -s "/tmp/license_ids.txt" ]; then
    deleted_licenses=0
    
    while IFS= read -r license_id; do
        if [ -n "$license_id" ]; then
            curl -X POST -s \
                 -H "Content-Type: application/json" \
                 -d "{\"query\":\"mutation { deleteLicense(id: \\\"$license_id\\\") }\"}" \
                 http://localhost:4000/graphql > /dev/null
            
            ((deleted_licenses++))
        fi
    done < /tmp/license_ids.txt
    
    echo "✅ Deleted $deleted_licenses licenses"
else
    echo "  No licenses to delete"
fi

echo ""
echo "🗑️  Step 4: Deleting all products..."

if [ -f "/tmp/product_ids.txt" ] && [ -s "/tmp/product_ids.txt" ]; then
    product_count=$(wc -l < /tmp/product_ids.txt)
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
        fi
    done < /tmp/product_ids.txt
    
    echo "✅ Deleted $deleted_products/$product_count products"
else
    echo "  No products to delete"
fi

echo ""
echo "✨ Step 5: Creating 3 clean products..."

# Create simple products without complex JSON attributes initially
products_created=0

echo "  Creating E-Commerce Platform..."
result=$(curl -X POST -s \
             -H "Content-Type: application/json" \
             -d '{"query":"mutation { createProduct(input: { name: \"E-Commerce Platform\", description: \"Complete online shopping solution with payment gateway\" }) { id name } }"}' \
             http://localhost:4000/graphql)

if echo "$result" | grep -q '"createProduct"' && ! echo "$result" | grep -q '"errors"'; then
    ((products_created++))
    echo "    ✅ Created"
else
    echo "    ❌ Failed: $result"
fi

echo "  Creating Mobile Banking App..."
result=$(curl -X POST -s \
             -H "Content-Type: application/json" \
             -d '{"query":"mutation { createProduct(input: { name: \"Mobile Banking App\", description: \"Secure mobile banking with biometric authentication\" }) { id name } }"}' \
             http://localhost:4000/graphql)

if echo "$result" | grep -q '"createProduct"' && ! echo "$result" | grep -q '"errors"'; then
    ((products_created++))
    echo "    ✅ Created"
else
    echo "    ❌ Failed: $result"
fi

echo "  Creating Healthcare CRM..."
result=$(curl -X POST -s \
             -H "Content-Type: application/json" \
             -d '{"query":"mutation { createProduct(input: { name: \"Healthcare CRM\", description: \"Patient management system with appointment scheduling\" }) { id name } }"}' \
             http://localhost:4000/graphql)

if echo "$result" | grep -q '"createProduct"' && ! echo "$result" | grep -q '"errors"'; then
    ((products_created++))
    echo "    ✅ Created"
else
    echo "    ❌ Failed: $result"
fi

echo ""
echo "🎉 DATABASE RESET COMPLETE!"
echo "=========================="
echo "  Created: $products_created new products"
echo ""
echo "Your database now has clean data:"
echo "  1. E-Commerce Platform"
echo "  2. Mobile Banking App"
echo "  3. Healthcare CRM"
echo ""
echo "🔄 Refresh your browser (Ctrl+Shift+R) to see the clean data!"
echo ""

# Final verification
echo "📊 Final verification:"
result=$(curl -X POST -s \
             -H "Content-Type: application/json" \
             -d '{"query":"query { products { totalCount } tasks { totalCount } licenses { id } }"}' \
             http://localhost:4000/graphql)

echo "Current database status: $result"

# Cleanup temp files
rm -f /tmp/task_ids.txt /tmp/license_ids.txt /tmp/product_ids.txt