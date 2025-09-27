#!/bin/bash

API_URL="http://localhost:4000/graphql"

echo "🌱 Creating additional sample data without admin requirements..."

# Add some tasks to the existing "this is a test" product
echo "Adding tasks to existing products..."

# Get the product ID for "this is a test"
TEST_PRODUCT_ID="cmfen2z3r0000glu5ut8wpatd"
SAMPLE_PRODUCT_ID="sample-product-singleton"

echo "Creating tasks for test product: $TEST_PRODUCT_ID"

# Create tasks for the test product (which appears to have no tasks currently)
curl -s -X POST -H 'Content-Type: application/json' --data "{\"query\":\"mutation{createTask(input:{productId:\\\"$TEST_PRODUCT_ID\\\", name:\\\"User Registration System\\\", description:\\\"Build comprehensive user registration with email verification\\\", estMinutes:480, weight:20, licenseLevel:ESSENTIAL, priority:\\\"High\\\"}){id name description}}\"}" $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data "{\"query\":\"mutation{createTask(input:{productId:\\\"$TEST_PRODUCT_ID\\\", name:\\\"Dashboard Implementation\\\", description:\\\"Create main dashboard with widgets and analytics\\\", estMinutes:720, weight:25, licenseLevel:ESSENTIAL, priority:\\\"Medium\\\"}){id name description}}\"}" $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data "{\"query\":\"mutation{createTask(input:{productId:\\\"$TEST_PRODUCT_ID\\\", name:\\\"API Integration\\\", description:\\\"Integrate with third-party APIs for data sync\\\", estMinutes:360, weight:15, licenseLevel:ADVANTAGE, priority:\\\"Medium\\\"}){id name description}}\"}" $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data "{\"query\":\"mutation{createTask(input:{productId:\\\"$TEST_PRODUCT_ID\\\", name:\\\"Security Hardening\\\", description:\\\"Implement advanced security measures and audit logging\\\", estMinutes:600, weight:20, licenseLevel:PREMIER, priority:\\\"High\\\"}){id name description}}\"}" $API_URL

curl -s -X POST -H 'Content-Type: application/json' --data "{\"query\":\"mutation{createTask(input:{productId:\\\"$TEST_PRODUCT_ID\\\", name:\\\"Performance Optimization\\\", description:\\\"Optimize database queries and implement caching\\\", estMinutes:480, weight:20, licenseLevel:ADVANTAGE, priority:\\\"Low\\\"}){id name description}}\"}" $API_URL

echo ""
echo "✅ Additional sample tasks created!"
echo "📊 Added 5 new tasks to the test product"
echo "🌐 Check the application at http://localhost:5173"
