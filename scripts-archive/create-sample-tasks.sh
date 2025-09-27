#!/bin/bash

API_URL="http://127.0.0.1:4000/graphql"

echo "🌱 Creating sample tasks..."

# E-Commerce Platform (p-1005) tasks
echo "Creating tasks for E-Commerce Platform..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1005\", name:\"User Authentication System\", description:\"Implement secure user login and registration\", estMinutes:480, weight:8, statusId:\"1\", notes:\"High priority security feature\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1005\", name:\"Product Catalog\", description:\"Build product browsing and search functionality\", estMinutes:720, weight:12, statusId:\"1\", notes:\"Core catalog functionality\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1005\", name:\"Shopping Cart\", description:\"Implement shopping cart and checkout process\", estMinutes:360, weight:6, statusId:\"1\", notes:\"Essential e-commerce feature\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1005\", name:\"Payment Integration\", description:\"Integrate payment gateway (Stripe/PayPal)\", estMinutes:480, weight:8, statusId:\"1\", notes:\"Payment processing\"}){id name}}"}' $API_URL

# Mobile Banking App (p-1006) tasks  
echo "Creating tasks for Mobile Banking App..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1006\", name:\"Biometric Authentication\", description:\"Implement fingerprint and face recognition\", estMinutes:960, weight:16, statusId:\"1\", notes:\"Advanced security feature\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1006\", name:\"Account Dashboard\", description:\"Create main account overview screen\", estMinutes:480, weight:8, statusId:\"1\", notes:\"Primary user interface\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1006\", name:\"Transfer Functionality\", description:\"Implement money transfer between accounts\", estMinutes:720, weight:12, statusId:\"1\", notes:\"Core banking feature\"}){id name}}"}' $API_URL

# CRM System (p-1007) tasks
echo "Creating tasks for CRM System..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1007\", name:\"Contact Management\", description:\"Build contact database and management\", estMinutes:480, weight:8, statusId:\"1\", notes:\"Customer data management\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1007\", name:\"Lead Tracking\", description:\"Implement lead scoring and tracking system\", estMinutes:600, weight:10, statusId:\"1\", notes:\"Sales process automation\"}){id name}}"}' $API_URL

# Analytics Dashboard (p-1008) tasks
echo "Creating tasks for Analytics Dashboard..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1008\", name:\"Data Connectors\", description:\"Build connectors to various data sources\", estMinutes:720, weight:12, statusId:\"1\", notes:\"Data integration layer\"}){id name}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1008\", name:\"Visualization Engine\", description:\"Implement charts and graphs engine\", estMinutes:600, weight:10, statusId:\"1\", notes:\"Data visualization\"}){id name}}"}' $API_URL

echo "✅ Sample tasks created!"
echo "📊 Check the application at http://localhost:5173"
