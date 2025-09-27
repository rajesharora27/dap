#!/bin/bash

# Database Cleanup Script for DAP Application
# This script will help you clean up the database

echo "🗃️  DATABASE CLEANUP OPTIONS"
echo "=========================="
echo ""
echo "Current database contains 43 products (mostly test data)"
echo ""
echo "Select cleanup option:"
echo ""
echo "1) Delete ALL products (fresh start)"
echo "2) Delete only test products (keep production-like data)"
echo "3) Reset to clean 3-product dataset"
echo "4) Just view current products"
echo "5) Export current data before cleanup"
echo "6) Cancel"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "⚠️  WARNING: This will DELETE ALL PRODUCTS!"
        read -p "Are you sure? Type 'DELETE ALL' to confirm: " confirm
        if [ "$confirm" = "DELETE ALL" ]; then
            echo "Deleting all products..."
            # We'll create a GraphQL mutation to delete all products
            python3 << 'EOF'
import subprocess
import json

# First get all product IDs
query = """
query {
  products {
    edges {
      node {
        id
      }
    }
  }
}
"""

result = subprocess.run([
    'curl', '-X', 'POST',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'query': query}),
    'http://localhost:4000/graphql'
], capture_output=True, text=True)

response = json.loads(result.stdout)
product_ids = [edge['node']['id'] for edge in response['data']['products']['edges']]

print(f"Found {len(product_ids)} products to delete...")

# Delete each product
deleted_count = 0
for product_id in product_ids:
    delete_mutation = f"""
    mutation {{
      deleteProduct(id: "{product_id}")
    }}
    """
    
    delete_result = subprocess.run([
        'curl', '-X', 'POST',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({'query': delete_mutation}),
        'http://localhost:4000/graphql'
    ], capture_output=True, text=True)
    
    delete_response = json.loads(delete_result.stdout)
    if 'errors' not in delete_response:
        deleted_count += 1
        if deleted_count % 10 == 0:
            print(f"Deleted {deleted_count} products...")

print(f"✅ Successfully deleted {deleted_count} products!")
EOF
        else
            echo "Cancelled."
        fi
        ;;
        
    2)
        echo ""
        echo "Deleting test products (names containing 'test', 'Test', or 'TEST')..."
        python3 << 'EOF'
import subprocess
import json

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
    'curl', '-X', 'POST',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'query': query}),
    'http://localhost:4000/graphql'
], capture_output=True, text=True)

response = json.loads(result.stdout)
products = response['data']['products']['edges']

# Find test products
test_products = []
for edge in products:
    name = edge['node']['name'].lower()
    if ('test' in name or 
        'temporary' in name or 
        'temp' in name or 
        'sample' in name or
        'license test' in name or
        edge['node']['id'].startswith('prod-test') or
        'gui test studio' in edge['node']['name'].lower()):
        test_products.append(edge['node'])

print(f"Found {len(test_products)} test products to delete:")
for product in test_products[:5]:  # Show first 5
    print(f"  - {product['name']}")
if len(test_products) > 5:
    print(f"  ... and {len(test_products) - 5} more")

# Delete test products
deleted_count = 0
for product in test_products:
    delete_mutation = f"""
    mutation {{
      deleteProduct(id: "{product['id']}")
    }}
    """
    
    delete_result = subprocess.run([
        'curl', '-X', 'POST',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({'query': delete_mutation}),
        'http://localhost:4000/graphql'
    ], capture_output=True, text=True)
    
    delete_response = json.loads(delete_result.stdout)
    if 'errors' not in delete_response:
        deleted_count += 1

print(f"✅ Deleted {deleted_count} test products!")
print(f"Remaining products: {len(products) - deleted_count}")
EOF
        ;;
        
    3)
        echo ""
        echo "Resetting to clean 3-product dataset..."
        echo "This will delete all products and import our clean 3-product CSV..."
        read -p "Continue? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            # First delete all products
            python3 << 'EOF'
import subprocess
import json

# Get and delete all products
query = """
query {
  products {
    edges {
      node {
        id
      }
    }
  }
}
"""

result = subprocess.run([
    'curl', '-X', 'POST',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'query': query}),
    'http://localhost:4000/graphql'
], capture_output=True, text=True)

response = json.loads(result.stdout)
product_ids = [edge['node']['id'] for edge in response['data']['products']['edges']]

for product_id in product_ids:
    delete_mutation = f"""
    mutation {{
      deleteProduct(id: "{product_id}")
    }}
    """
    subprocess.run([
        'curl', '-X', 'POST',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({'query': delete_mutation}),
        'http://localhost:4000/graphql'
    ], capture_output=True, text=True)

print("All products deleted.")
EOF
            
            # Import clean dataset
            if [ -f "clean-3-products.csv" ]; then
                echo "Importing clean 3-product dataset..."
                node << 'EOF'
const fs = require('fs');

const csvContent = fs.readFileSync('clean-3-products.csv', 'utf8');

const mutation = `
mutation ImportProducts($csv: String!) {
  importProductsCsv(csv: $csv) {
    success
    productsCreated
    productsUpdated
    errors
    warnings
  }
}
`;

const { spawn } = require('child_process');

const curl = spawn('curl', [
  '-X', 'POST',
  '-H', 'Content-Type: application/json',
  '-d', JSON.stringify({
    query: mutation,
    variables: { csv: csvContent }
  }),
  'http://localhost:4000/graphql'
]);

curl.stdout.on('data', (data) => {
  const response = JSON.parse(data.toString());
  const result = response.data.importProductsCsv;
  
  console.log('✅ Import completed:');
  console.log(`  Products created: ${result.productsCreated}`);
  console.log(`  Products updated: ${result.productsUpdated}`);
  if (result.errors.length > 0) {
    console.log('  Errors:', result.errors);
  }
  if (result.warnings.length > 0) {
    console.log('  Warnings:', result.warnings);
  }
});
EOF
            else
                echo "❌ clean-3-products.csv not found. Creating it now..."
                cat > clean-3-products.csv << 'EOF'
name,description,customAttrs
"E-Commerce Platform","Complete online shopping solution with payment gateway","{'version': '1.0', 'features': ['payments', 'inventory', 'shipping'], 'priority': 'high'}"
"Mobile Banking App","Secure mobile banking with biometric authentication","{'security_level': 'maximum', 'compliance': ['PCI-DSS', 'SOX'], 'platform': 'mobile'}"
"Healthcare CRM","Patient management system with appointment scheduling","{'industry': 'healthcare', 'compliance': ['HIPAA'], 'modules': ['patients', 'appointments', 'billing']}"
EOF
                echo "Created clean-3-products.csv. Run this script again to import it."
            fi
        fi
        ;;
        
    4)
        echo ""
        echo "Current products in database:"
        echo "============================="
        python3 << 'EOF'
import subprocess
import json

query = """
query {
  products {
    edges {
      node {
        id
        name
        description
      }
    }
    totalCount
  }
}
"""

result = subprocess.run([
    'curl', '-X', 'POST',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'query': query}),
    'http://localhost:4000/graphql'
], capture_output=True, text=True)

response = json.loads(result.stdout)
products = response['data']['products']

print(f"Total: {products['totalCount']} products\n")

for i, edge in enumerate(products['edges'], 1):
    product = edge['node']
    name = product['name'][:50] + "..." if len(product['name']) > 50 else product['name']
    print(f"{i:2d}. {name}")
    if i >= 20:  # Limit display to first 20
        remaining = products['totalCount'] - 20
        if remaining > 0:
            print(f"    ... and {remaining} more products")
        break
EOF
        ;;
        
    5)
        echo ""
        echo "Exporting current database to CSV..."
        python3 << 'EOF'
import subprocess
import json

query = """
mutation {
  exportProductsCsv
}
"""

result = subprocess.run([
    'curl', '-X', 'POST',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'query': query}),
    'http://localhost:4000/graphql'
], capture_output=True, text=True)

response = json.loads(result.stdout)
csv_content = response['data']['exportProductsCsv']

# Save to file with timestamp
from datetime import datetime
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
filename = f"database_backup_{timestamp}.csv"

with open(filename, 'w') as f:
    f.write(csv_content)

print(f"✅ Database exported to: {filename}")
print(f"Total size: {len(csv_content)} characters")
EOF
        ;;
        
    6)
        echo "Cancelled."
        ;;
        
    *)
        echo "Invalid choice."
        ;;
esac