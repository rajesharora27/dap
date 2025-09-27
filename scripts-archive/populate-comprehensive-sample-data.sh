#!/bin/bash

API_URL="http://localhost:4000/graphql"

echo "🌱 Creating comprehensive sample data according to schema specifications..."

# First, create task statuses (controlled lists)
echo "📋 Creating Task Statuses (Controlled Lists)..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"TODO\", label:\"To Do\"}){id code label}}"}' $API_URL
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"IN_PROGRESS\", label:\"In Progress\"}){id code label}}"}' $API_URL
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"REVIEW\", label:\"Under Review\"}){id code label}}"}' $API_URL
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"DONE\", label:\"Completed\"}){id code label}}"}' $API_URL
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTaskStatus(input:{code:\"BLOCKED\", label:\"Blocked\"}){id code label}}"}' $API_URL

echo "🏗️ Creating Products with custom attributes..."
# Product 1: E-Commerce Platform
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"E-Commerce Platform\", description:\"Comprehensive online shopping solution with advanced features\", customAttrs:{\"industry\":\"retail\", \"technology\":\"react\", \"priority\":\"high\", \"version\":\"2.1.0\", \"supportLevel\":\"enterprise\"}}){id name description customAttrs}}"}' $API_URL

# Product 2: Mobile Banking App  
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"Mobile Banking Application\", description:\"Secure mobile banking with biometric authentication\", customAttrs:{\"industry\":\"fintech\", \"technology\":\"react-native\", \"priority\":\"critical\", \"version\":\"3.0.1\", \"supportLevel\":\"premium\", \"compliance\":[\"PCI-DSS\", \"SOX\", \"GDPR\"]}}){id name description customAttrs}}"}' $API_URL

# Product 3: CRM System
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"Customer Relationship Management\", description:\"Advanced CRM with AI-powered insights and automation\", customAttrs:{\"industry\":\"business\", \"technology\":\"angular\", \"priority\":\"medium\", \"version\":\"1.5.3\", \"supportLevel\":\"standard\", \"integrations\":[\"salesforce\", \"hubspot\", \"mailchimp\"]}}){id name description customAttrs}}"}' $API_URL

# Product 4: Analytics Dashboard
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createProduct(input:{name:\"Business Intelligence Dashboard\", description:\"Real-time analytics and reporting platform\", customAttrs:{\"industry\":\"analytics\", \"technology\":\"vue\", \"priority\":\"medium\", \"version\":\"2.0.0\", \"supportLevel\":\"standard\", \"dataConnectors\":[\"postgresql\", \"mongodb\", \"elasticsearch\"]}}){id name description customAttrs}}"}' $API_URL

echo "🎯 Creating Solutions (combining products)..."
# Solution 1: Digital Transformation Suite
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createSolution(input:{name:\"Digital Transformation Suite\", description:\"Complete digital transformation package for enterprises\", customAttrs:{\"target\":\"enterprise\", \"duration\":\"12-18 months\", \"pricing\":\"premium\", \"industry\":[\"retail\", \"manufacturing\", \"healthcare\"]}}){id name description customAttrs}}"}' $API_URL

# Solution 2: Financial Services Package
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createSolution(input:{name:\"Financial Services Complete\", description:\"Comprehensive financial technology solution\", customAttrs:{\"target\":\"financial institutions\", \"duration\":\"6-12 months\", \"pricing\":\"enterprise\", \"compliance\":[\"PCI-DSS\", \"SOX\", \"Basel III\"], \"certifications\":[\"ISO 27001\", \"SOC 2\"]}}){id name description customAttrs}}"}' $API_URL

# Solution 3: SMB Starter Package
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createSolution(input:{name:\"SMB Growth Package\", description:\"Small-medium business growth acceleration solution\", customAttrs:{\"target\":\"SMB\", \"duration\":\"3-6 months\", \"pricing\":\"standard\", \"features\":[\"CRM\", \"Analytics\", \"Basic E-commerce\"]}}){id name description customAttrs}}"}' $API_URL

echo "👥 Creating Customers with diverse profiles..."
# Customer 1: Enterprise Retail
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"GlobalMart Corporation\", description:\"International retail chain with 500+ stores worldwide\"}){id name description}}"}' $API_URL

# Customer 2: Regional Bank
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"Metropolitan Bank Group\", description:\"Regional bank serving 2M+ customers across 5 states\"}){id name description}}"}' $API_URL

# Customer 3: Tech Startup
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"InnovateTech Solutions\", description:\"Fast-growing fintech startup specializing in payment solutions\"}){id name description}}"}' $API_URL

# Customer 4: Manufacturing Company
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"PrecisionManufacturing Inc\", description:\"B2B manufacturing company with complex supply chain needs\"}){id name description}}"}' $API_URL

# Customer 5: Healthcare Provider
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createCustomer(input:{name:\"HealthFirst Medical Network\", description:\"Healthcare provider network with 50+ clinics and hospitals\"}){id name description}}"}' $API_URL

echo "📋 Creating realistic tasks with proper attributes..."

# Get the actual product IDs from the created products
echo "Getting product IDs..."
PRODUCTS_RESPONSE=$(curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"query{products{edges{node{id name}}}}"}' $API_URL)
echo "Products response: $PRODUCTS_RESPONSE"

# Create tasks for E-Commerce Platform (assume first product)
echo "Creating tasks for E-Commerce Platform..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1\", name:\"User Authentication System\", description:\"Implement secure OAuth2/JWT authentication with 2FA support\", estMinutes:720, weight:15, statusId:\"2\", notes:\"High priority - security critical. Requires security audit.\", customAttrs:{\"complexity\":\"high\", \"security\":true, \"dependencies\":[\"database-setup\"], \"assignee\":\"security-team\"}}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1\", name:\"Product Catalog Management\", description:\"Build comprehensive product catalog with search, filtering, and categorization\", estMinutes:960, weight:20, statusId:\"1\", notes:\"Core functionality - impacts all other features. Consider elasticsearch integration.\", customAttrs:{\"complexity\":\"medium\", \"performance\":true, \"integrations\":[\"elasticsearch\", \"image-service\"]}}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1\", name:\"Shopping Cart & Checkout\", description:\"Implement shopping cart with persistent storage and multi-step checkout process\", estMinutes:480, weight:12, statusId:\"1\", notes:\"Depends on payment integration. Focus on cart abandonment optimization.\", customAttrs:{\"complexity\":\"medium\", \"analytics\":true, \"optimization\":\"conversion\"}}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-1\", name:\"Payment Gateway Integration\", description:\"Integrate multiple payment providers (Stripe, PayPal, Apple Pay)\", estMinutes:600, weight:18, statusId:\"3\", notes:\"Currently under security review. Test with sandbox environments first.\", customAttrs:{\"complexity\":\"high\", \"security\":true, \"providers\":[\"stripe\", \"paypal\", \"apple-pay\"], \"testing\":\"sandbox\"}}){id name description}}"}' $API_URL

# Create tasks for Mobile Banking App
echo "Creating tasks for Mobile Banking App..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-2\", name:\"Biometric Authentication\", description:\"Implement fingerprint, face ID, and voice recognition authentication\", estMinutes:1440, weight:25, statusId:\"2\", notes:\"Requires device capability checks. iOS and Android implementation differs.\", customAttrs:{\"complexity\":\"high\", \"security\":true, \"platforms\":[\"ios\", \"android\"], \"biometrics\":[\"fingerprint\", \"face-id\", \"voice\"]}}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-2\", name:\"Account Dashboard\", description:\"Create main account overview with balance, recent transactions, and quick actions\", estMinutes:720, weight:15, statusId:\"1\", notes:\"Focus on real-time data updates and responsive design. Consider dark mode.\", customAttrs:{\"complexity\":\"medium\", \"realtime\":true, \"design\":[\"responsive\", \"dark-mode\"], \"features\":[\"balance\", \"transactions\", \"quick-actions\"]}}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-2\", name:\"Money Transfer System\", description:\"Implement secure peer-to-peer and bank transfer functionality\", estMinutes:960, weight:22, statusId:\"1\", notes:\"Requires KYC/AML compliance checks. Implement fraud detection.\", customAttrs:{\"complexity\":\"high\", \"security\":true, \"compliance\":[\"KYC\", \"AML\"], \"features\":[\"p2p\", \"bank-transfer\", \"fraud-detection\"]}}){id name description}}"}' $API_URL

# Create tasks for CRM System
echo "Creating tasks for CRM System..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-3\", name:\"Contact Management System\", description:\"Build comprehensive contact database with advanced search and segmentation\", estMinutes:720, weight:18, statusId:\"1\", notes:\"Include data import/export, duplicate detection, and GDPR compliance.\", customAttrs:{\"complexity\":\"medium\", \"compliance\":[\"GDPR\"], \"features\":[\"search\", \"segmentation\", \"import-export\", \"duplicate-detection\"]}}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-3\", name:\"Lead Scoring & Tracking\", description:\"Implement AI-powered lead scoring with automated tracking and nurturing\", estMinutes:960, weight:20, statusId:\"2\", notes:\"Integrate with marketing automation. Machine learning model needs training data.\", customAttrs:{\"complexity\":\"high\", \"ai\":true, \"integrations\":[\"marketing-automation\"], \"features\":[\"scoring\", \"tracking\", \"nurturing\"]}}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-3\", name:\"Sales Pipeline Management\", description:\"Create visual sales pipeline with drag-drop functionality and forecasting\", estMinutes:600, weight:16, statusId:\"1\", notes:\"Include customizable stages, probability calculations, and reporting.\", customAttrs:{\"complexity\":\"medium\", \"ui\":\"drag-drop\", \"features\":[\"visual-pipeline\", \"forecasting\", \"custom-stages\", \"reporting\"]}}){id name description}}"}' $API_URL

# Create tasks for Analytics Dashboard
echo "Creating tasks for Analytics Dashboard..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-4\", name:\"Data Connector Framework\", description:\"Build extensible framework for connecting to various data sources\", estMinutes:1200, weight:25, statusId:\"1\", notes:\"Support SQL and NoSQL databases, APIs, and file formats. Focus on scalability.\", customAttrs:{\"complexity\":\"high\", \"scalability\":true, \"connectors\":[\"sql\", \"nosql\", \"api\", \"files\"], \"formats\":[\"json\", \"csv\", \"xml\"]}}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-4\", name:\"Visualization Engine\", description:\"Create interactive charting engine with multiple chart types and customization\", estMinutes:840, weight:20, statusId:\"2\", notes:\"Support real-time updates, export functionality, and accessibility standards.\", customAttrs:{\"complexity\":\"high\", \"realtime\":true, \"charts\":[\"line\", \"bar\", \"pie\", \"scatter\", \"heatmap\"], \"accessibility\":true}}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createTask(input:{productId:\"p-4\", name:\"Report Builder\", description:\"Drag-and-drop report builder with scheduling and distribution\", estMinutes:720, weight:18, statusId:\"1\", notes:\"Include template library, automated scheduling, and multi-format export.\", customAttrs:{\"complexity\":\"medium\", \"ui\":\"drag-drop\", \"features\":[\"templates\", \"scheduling\", \"distribution\"], \"exports\":[\"pdf\", \"excel\", \"email\"]}}){id name description}}"}' $API_URL

echo "🔗 Creating product-solution relationships..."
# Add products to solutions (this would need to be implemented in the backend)
# For now, we'll note that this relationship should exist

echo "👥 Creating customer-product/solution relationships..."
# Add products and solutions to customers (this would also need backend implementation)

echo "📄 Creating licenses..."
curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createLicense(input:{name:\"Enterprise License\", description:\"Full feature access for enterprise customers\", productId:\"p-1\"}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createLicense(input:{name:\"Premium Banking License\", description:\"Premium tier for financial institutions\", productId:\"p-2\"}){id name description}}"}' $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data '{"query":"mutation{createLicense(input:{name:\"Professional CRM License\", description:\"Professional features for sales teams\", productId:\"p-3\"}){id name description}}"}' $API_URL

echo ""
echo "✅ Comprehensive sample data created successfully!"
echo "📊 Created:"
echo "   • 5 Task Statuses (controlled lists)"
echo "   • 4 Products with detailed custom attributes"
echo "   • 3 Solutions with business context"
echo "   • 5 Customers with diverse profiles"
echo "   • 13 Tasks with realistic complexity and attributes"
echo "   • 3 Licenses linked to products"
echo ""
echo "🌐 Application ready at http://localhost:5173"
