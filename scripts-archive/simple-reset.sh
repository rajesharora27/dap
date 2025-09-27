#!/bin/bash

# Simple Database Reset Script
# This will delete all products and create 3 clean ones

echo "🗃️  SIMPLE DATABASE RESET"
echo "========================"
echo ""
echo "This will:"
echo "1. Delete ALL products in the database"
echo "2. Create 3 clean products for testing"
echo ""
read -p "Continue? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Getting list of all products..."

# Create a simple script to get product IDs
cat > /tmp/get_products.js << 'EOF'
const query = `
query {
  products {
    edges {
      node {
        id
        name
      }
    }
    totalCount
  }
}
`;

const { spawn } = require('child_process');
const curl = spawn('curl', [
  '-X', 'POST',
  '-H', 'Content-Type: application/json',
  '-d', JSON.stringify({ query }),
  'http://localhost:4000/graphql'
]);

let output = '';
curl.stdout.on('data', (data) => {
  output += data.toString();
});

curl.on('close', (code) => {
  try {
    const response = JSON.parse(output);
    if (response.data && response.data.products) {
      const products = response.data.products.edges;
      console.log(`Found ${products.length} products to delete`);
      
      // Write product IDs to file
      const fs = require('fs');
      const ids = products.map(edge => edge.node.id);
      fs.writeFileSync('/tmp/product_ids.txt', ids.join('\n'));
      
      // Show first few products
      console.log('Products to delete:');
      products.slice(0, 5).forEach((edge, i) => {
        const name = edge.node.name.length > 50 ? 
                     edge.node.name.substring(0, 47) + '...' : 
                     edge.node.name;
        console.log(`  ${i+1}. ${name}`);
      });
      if (products.length > 5) {
        console.log(`  ... and ${products.length - 5} more`);
      }
    } else {
      console.error('Error fetching products:', response);
      process.exit(1);
    }
  } catch (e) {
    console.error('Error parsing response:', e.message);
    console.error('Raw output:', output);
    process.exit(1);
  }
});

curl.on('error', (err) => {
  console.error('Curl error:', err);
  process.exit(1);
});
EOF

# Run the script
node /tmp/get_products.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to get products list"
    exit 1
fi

if [ ! -f "/tmp/product_ids.txt" ]; then
    echo "❌ No product IDs file created"
    exit 1
fi

echo ""
echo "Step 2: Deleting all products..."

# Read product IDs and delete them one by one
deleted_count=0
total_count=$(wc -l < /tmp/product_ids.txt)

while IFS= read -r product_id; do
    if [ -n "$product_id" ]; then
        # Delete this product
        curl -X POST \
             -H "Content-Type: application/json" \
             -d "{\"query\":\"mutation { deleteProduct(id: \\\"$product_id\\\") }\"}" \
             http://localhost:4000/graphql \
             -s > /tmp/delete_result.json
        
        # Check if deletion was successful
        if grep -q '"deleteProduct":true' /tmp/delete_result.json; then
            ((deleted_count++))
            if [ $((deleted_count % 10)) -eq 0 ]; then
                echo "  Deleted $deleted_count/$total_count products..."
            fi
        else
            echo "  Warning: Failed to delete product $product_id"
        fi
    fi
done < /tmp/product_ids.txt

echo "✅ Deleted $deleted_count products"

echo ""
echo "Step 3: Creating 3 clean products..."

# Create clean products
products_created=0

# Product 1
echo "  Creating E-Commerce Platform..."
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"query":"mutation { createProduct(input: { name: \"E-Commerce Platform\", description: \"Complete online shopping solution with payment gateway\", customAttrs: {\"version\": \"1.0\", \"features\": [\"payments\", \"inventory\", \"shipping\"], \"priority\": \"high\"} }) { id name } }"}' \
     http://localhost:4000/graphql \
     -s > /tmp/create_result.json

if grep -q '"createProduct"' /tmp/create_result.json && ! grep -q '"errors"' /tmp/create_result.json; then
    ((products_created++))
    echo "    ✅ Created"
else
    echo "    ❌ Failed"
    echo "    Response: $(cat /tmp/create_result.json)"
fi

# Product 2
echo "  Creating Mobile Banking App..."
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"query":"mutation { createProduct(input: { name: \"Mobile Banking App\", description: \"Secure mobile banking with biometric authentication\", customAttrs: {\"security_level\": \"maximum\", \"compliance\": [\"PCI-DSS\", \"SOX\"], \"platform\": \"mobile\"} }) { id name } }"}' \
     http://localhost:4000/graphql \
     -s > /tmp/create_result.json

if grep -q '"createProduct"' /tmp/create_result.json && ! grep -q '"errors"' /tmp/create_result.json; then
    ((products_created++))
    echo "    ✅ Created"
else
    echo "    ❌ Failed"
    echo "    Response: $(cat /tmp/create_result.json)"
fi

# Product 3
echo "  Creating Healthcare CRM..."
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"query":"mutation { createProduct(input: { name: \"Healthcare CRM\", description: \"Patient management system with appointment scheduling\", customAttrs: {\"industry\": \"healthcare\", \"compliance\": [\"HIPAA\"], \"modules\": [\"patients\", \"appointments\", \"billing\"]} }) { id name } }"}' \
     http://localhost:4000/graphql \
     -s > /tmp/create_result.json

if grep -q '"createProduct"' /tmp/create_result.json && ! grep -q '"errors"' /tmp/create_result.json; then
    ((products_created++))
    echo "    ✅ Created"
else
    echo "    ❌ Failed"
    echo "    Response: $(cat /tmp/create_result.json)"
fi

echo ""
echo "🎉 DATABASE RESET COMPLETE!"
echo "=========================="
echo "  Deleted: $deleted_count old products"
echo "  Created: $products_created new products"
echo ""
echo "Your database now has 3 clean products:"
echo "  1. E-Commerce Platform"
echo "  2. Mobile Banking App" 
echo "  3. Healthcare CRM"
echo ""
echo "Refresh your browser (Ctrl+Shift+R) to see the clean data!"

# Cleanup temp files
rm -f /tmp/get_products.js /tmp/product_ids.txt /tmp/delete_result.json /tmp/create_result.json