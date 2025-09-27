#!/bin/bash

API_URL="http://localhost:4000/graphql"

echo "🌱 Creating comprehensive sample data according to your schema specifications..."

# Create task statuses (controlled lists) - ADMIN required
echo "📋 Creating Task Statuses (Controlled Lists)..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"TODO\", label:\"To Do\"}){id code label}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"IN_PROGRESS\", label:\"In Progress\"}){id code label}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"REVIEW\", label:\"Under Review\"}){id code label}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"DONE\", label:\"Completed\"}){id code label}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"BLOCKED\", label:\"Blocked\"}){id code label}}"}' $API_URL | jq -c '.'

echo ""
echo "🏗️ Creating Products with custom attributes..."

# Create Products with proper JSON custom attributes
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"E-Commerce Platform\", description:\"Comprehensive online shopping solution with advanced features\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"Mobile Banking Application\", description:\"Secure mobile banking with biometric authentication\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"Customer Relationship Management\", description:\"Advanced CRM with AI-powered insights and automation\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"Business Intelligence Dashboard\", description:\"Real-time analytics and reporting platform\"}){id name description}}"}' $API_URL | jq -c '.'

echo ""
echo "🎯 Creating Solutions..."

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createSolution(input:{name:\"Digital Transformation Suite\", description:\"Complete digital transformation package for enterprises\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createSolution(input:{name:\"Financial Services Complete\", description:\"Comprehensive financial technology solution\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createSolution(input:{name:\"SMB Growth Package\", description:\"Small-medium business growth acceleration solution\"}){id name description}}"}' $API_URL | jq -c '.'

echo ""
echo "👥 Creating Customers..."

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"GlobalMart Corporation\", description:\"International retail chain with 500+ stores worldwide\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"Metropolitan Bank Group\", description:\"Regional bank serving 2M+ customers across 5 states\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"InnovateTech Solutions\", description:\"Fast-growing fintech startup specializing in payment solutions\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"PrecisionManufacturing Inc\", description:\"B2B manufacturing company with complex supply chain needs\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"HealthFirst Medical Network\", description:\"Healthcare provider network with 50+ clinics and hospitals\"}){id name description}}"}' $API_URL | jq -c '.'

echo ""
echo "📋 Creating realistic tasks..."

# Get actual product IDs
echo "Getting current product IDs..."
PRODUCTS=$(curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"query{products{edges{node{id name}}}}"}' $API_URL)
echo "Products: $PRODUCTS"

# Extract product IDs for tasks (using existing products for compatibility)
echo ""
echo "Creating tasks for each product..."

# Tasks for first product (E-Commerce Platform)
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1\", name:\"User Authentication System\", description:\"Implement secure OAuth2/JWT authentication with 2FA support\", estMinutes:720, weight:15, statusId:2, notes:\"High priority - security critical. Requires security audit.\"}){id name description weight}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1\", name:\"Product Catalog Management\", description:\"Build comprehensive product catalog with search and filtering\", estMinutes:960, weight:20, statusId:1, notes:\"Core functionality - impacts all other features.\"}){id name description weight}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1\", name:\"Shopping Cart & Checkout\", description:\"Implement shopping cart with persistent storage and checkout\", estMinutes:480, weight:12, statusId:1, notes:\"Depends on payment integration.\"}){id name description weight}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1\", name:\"Payment Gateway Integration\", description:\"Integrate multiple payment providers (Stripe, PayPal, Apple Pay)\", estMinutes:600, weight:18, statusId:3, notes:\"Currently under security review.\"}){id name description weight}}"}' $API_URL | jq -c '.'

# Tasks for second product (Mobile Banking)
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-2\", name:\"Biometric Authentication\", description:\"Implement fingerprint, face ID, and voice recognition\", estMinutes:1440, weight:25, statusId:2, notes:\"Requires device capability checks for iOS and Android.\"}){id name description weight}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-2\", name:\"Account Dashboard\", description:\"Create main account overview with balance and transactions\", estMinutes:720, weight:15, statusId:1, notes:\"Focus on real-time data updates.\"}){id name description weight}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-2\", name:\"Money Transfer System\", description:\"Implement secure peer-to-peer and bank transfers\", estMinutes:960, weight:22, statusId:1, notes:\"Requires KYC/AML compliance checks.\"}){id name description weight}}"}' $API_URL | jq -c '.'

# Tasks for third product (CRM)
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-3\", name:\"Contact Management System\", description:\"Build comprehensive contact database with search\", estMinutes:720, weight:18, statusId:1, notes:\"Include data import/export and GDPR compliance.\"}){id name description weight}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-3\", name:\"Lead Scoring & Tracking\", description:\"Implement AI-powered lead scoring with automation\", estMinutes:960, weight:20, statusId:2, notes:\"Integrate with marketing automation tools.\"}){id name description weight}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-3\", name:\"Sales Pipeline Management\", description:\"Create visual sales pipeline with drag-drop functionality\", estMinutes:600, weight:16, statusId:1, notes:\"Include customizable stages and forecasting.\"}){id name description weight}}"}' $API_URL | jq -c '.'

echo ""
echo "📄 Creating licenses..."

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createLicense(input:{name:\"Enterprise License\", description:\"Full feature access for enterprise customers\", productId:\"p-1\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createLicense(input:{name:\"Premium Banking License\", description:\"Premium tier for financial institutions\", productId:\"p-2\"}){id name description}}"}' $API_URL | jq -c '.'

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createLicense(input:{name:\"Professional CRM License\", description:\"Professional features for sales teams\", productId:\"p-3\"}){id name description}}"}' $API_URL | jq -c '.'

echo ""
echo "🔍 Verifying created data..."
echo "Task Statuses:"
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"query{taskStatuses{id code label}}"}' $API_URL | jq -c '.data.taskStatuses'

echo ""
echo "Products with task counts:"
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"query{products{edges{node{id name tasks{totalCount}}}}}"}' $API_URL | jq -c '.data.products.edges'

echo ""
echo "✅ Comprehensive sample data created successfully!"
echo "📊 Summary:"
echo "   • Task Statuses: 5 controlled list items"
echo "   • Products: 4 with detailed descriptions"
echo "   • Solutions: 3 business packages"
echo "   • Customers: 5 diverse profiles"
echo "   • Tasks: 10+ with realistic complexity"
echo "   • Licenses: 3 linked to products"
echo ""
echo "🌐 Application ready at http://localhost:5173"
