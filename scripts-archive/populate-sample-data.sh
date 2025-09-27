#!/bin/bash

API_URL="http://127.0.0.1:4000/graphql"

echo "🌱 Populating sample data..."

# Create Products
echo "Creating products..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"E-Commerce Platform\", description:\"Complete online shopping platform with payment integration\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"Mobile Banking App\", description:\"Secure mobile banking application with biometric authentication\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"CRM System\", description:\"Customer relationship management system for sales teams\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"Analytics Dashboard\", description:\"Real-time analytics and reporting dashboard\"}){id name}}"}' $API_URL

# Create Solutions
echo "Creating solutions..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createSolution(input:{name:\"Digital Transformation Suite\", description:\"Complete digital transformation solution for enterprises\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createSolution(input:{name:\"Financial Services Package\", description:\"Comprehensive financial services solution\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createSolution(input:{name:\"Retail Modernization\", description:\"Modern retail and e-commerce solution\"}){id name}}"}' $API_URL

# Create Customers
echo "Creating customers..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"TechCorp Industries\", description:\"Technology company specializing in enterprise solutions\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"Global Bank Ltd\", description:\"International banking and financial services provider\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"Retail Giants Inc\", description:\"Multi-national retail corporation\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"StartUp Innovations\", description:\"Technology startup focused on innovative solutions\"}){id name}}"}' $API_URL

echo "✅ Sample data population completed!"
echo "📊 Check the application at http://localhost:5173"
