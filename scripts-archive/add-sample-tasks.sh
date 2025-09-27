#!/bin/bash

# Add Sample Tasks to Products
# Creates meaningful tasks for each of the 3 clean products

echo "📋 ADDING SAMPLE TASKS TO PRODUCTS"
echo "=================================="
echo ""
echo "This will add sample tasks to:"
echo "  1. E-Commerce Platform (5 tasks)"
echo "  2. Mobile Banking App (5 tasks)"  
echo "  3. Healthcare CRM (5 tasks)"
echo ""
read -p "Continue? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "📋 Adding tasks to E-Commerce Platform..."

# E-Commerce Platform Tasks
docker exec dap_db_1 psql -U postgres -d dap -c "
INSERT INTO \"Task\" (id, \"productId\", name, description, \"estMinutes\", weight, \"sequenceNumber\", \"licenseLevel\", priority, \"updatedAt\") VALUES
('task-ecom-1', 'prod-ecommerce-1', 'User Authentication System', 'Implement secure user registration, login, and password reset functionality', 480, 20.0, 1, 'ESSENTIAL', 'High', CURRENT_TIMESTAMP),
('task-ecom-2', 'prod-ecommerce-1', 'Product Catalog Management', 'Build product listing, search, filtering, and categorization features', 720, 25.0, 2, 'ESSENTIAL', 'High', CURRENT_TIMESTAMP),
('task-ecom-3', 'prod-ecommerce-1', 'Shopping Cart & Checkout', 'Develop shopping cart functionality and secure checkout process', 600, 20.0, 3, 'ADVANTAGE', 'High', CURRENT_TIMESTAMP),
('task-ecom-4', 'prod-ecommerce-1', 'Payment Gateway Integration', 'Integrate multiple payment methods (credit cards, PayPal, etc.)', 480, 15.0, 4, 'ADVANTAGE', 'Medium', CURRENT_TIMESTAMP),
('task-ecom-5', 'prod-ecommerce-1', 'Order Management System', 'Create order tracking, fulfillment, and customer communication system', 540, 20.0, 5, 'SIGNATURE', 'Medium', CURRENT_TIMESTAMP);
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "  ✅ Added 5 tasks to E-Commerce Platform"
else
    echo "  ❌ Failed to add tasks to E-Commerce Platform"
fi

echo ""
echo "📋 Adding tasks to Mobile Banking App..."

# Mobile Banking App Tasks
docker exec dap_db_1 psql -U postgres -d dap -c "
INSERT INTO \"Task\" (id, \"productId\", name, description, \"estMinutes\", weight, \"sequenceNumber\", \"licenseLevel\", priority, \"updatedAt\") VALUES
('task-bank-1', 'prod-banking-1', 'Biometric Authentication', 'Implement fingerprint and facial recognition login systems', 600, 25.0, 1, 'SIGNATURE', 'Critical', CURRENT_TIMESTAMP),
('task-bank-2', 'prod-banking-1', 'Account Balance & Transactions', 'Display real-time account balances and transaction history', 480, 20.0, 2, 'ESSENTIAL', 'High', CURRENT_TIMESTAMP),
('task-bank-3', 'prod-banking-1', 'Money Transfer System', 'Enable secure peer-to-peer and bank transfers with multi-factor auth', 720, 25.0, 3, 'ADVANTAGE', 'Critical', CURRENT_TIMESTAMP),
('task-bank-4', 'prod-banking-1', 'Bill Payment Integration', 'Allow users to pay bills, utilities, and set up recurring payments', 540, 15.0, 4, 'ADVANTAGE', 'Medium', CURRENT_TIMESTAMP),
('task-bank-5', 'prod-banking-1', 'Fraud Detection System', 'Implement real-time fraud monitoring and alert systems', 600, 15.0, 5, 'SIGNATURE', 'Critical', CURRENT_TIMESTAMP);
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "  ✅ Added 5 tasks to Mobile Banking App"
else
    echo "  ❌ Failed to add tasks to Mobile Banking App"
fi

echo ""
echo "📋 Adding tasks to Healthcare CRM..."

# Healthcare CRM Tasks  
docker exec dap_db_1 psql -U postgres -d dap -c "
INSERT INTO \"Task\" (id, \"productId\", name, description, \"estMinutes\", weight, \"sequenceNumber\", \"licenseLevel\", priority, \"updatedAt\") VALUES
('task-health-1', 'prod-healthcare-1', 'Patient Records Management', 'Create secure patient profile system with medical history tracking', 600, 25.0, 1, 'ESSENTIAL', 'Critical', CURRENT_TIMESTAMP),
('task-health-2', 'prod-healthcare-1', 'Appointment Scheduling', 'Build calendar system for booking, rescheduling, and managing appointments', 480, 20.0, 2, 'ESSENTIAL', 'High', CURRENT_TIMESTAMP),
('task-health-3', 'prod-healthcare-1', 'HIPAA Compliance Module', 'Implement data encryption, audit trails, and privacy controls', 720, 20.0, 3, 'SIGNATURE', 'Critical', CURRENT_TIMESTAMP),
('task-health-4', 'prod-healthcare-1', 'Billing & Insurance Integration', 'Connect with insurance providers and automate claim processing', 660, 15.0, 4, 'ADVANTAGE', 'Medium', CURRENT_TIMESTAMP),
('task-health-5', 'prod-healthcare-1', 'Telemedicine Platform', 'Enable video consultations and remote patient monitoring', 540, 20.0, 5, 'SIGNATURE', 'Low', CURRENT_TIMESTAMP);
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "  ✅ Added 5 tasks to Healthcare CRM"
else
    echo "  ❌ Failed to add tasks to Healthcare CRM"
fi

echo ""
echo "📊 Verification: Checking task counts..."

# Verify tasks were created
docker exec dap_db_1 psql -U postgres -d dap -c "
SELECT 
    p.name as product_name,
    COUNT(t.id) as task_count,
    ROUND(AVG(t.\"estMinutes\")::numeric, 0) as avg_minutes,
    ROUND(SUM(t.weight)::numeric, 1) as total_weight
FROM \"Product\" p
LEFT JOIN \"Task\" t ON p.id = t.\"productId\"
GROUP BY p.id, p.name
ORDER BY p.name;
" 2>/dev/null

echo ""
echo "📋 Sample tasks by product:"

docker exec dap_db_1 psql -U postgres -d dap -c "
SELECT 
    p.name as product,
    t.\"sequenceNumber\" as seq,
    t.name as task_name,
    t.\"estMinutes\" as minutes,
    t.\"licenseLevel\" as license,
    t.priority
FROM \"Product\" p
JOIN \"Task\" t ON p.id = t.\"productId\"
ORDER BY p.name, t.\"sequenceNumber\";
" 2>/dev/null

echo ""
echo "🎉 TASKS ADDED SUCCESSFULLY!"
echo "=========================="
echo ""
echo "Each product now has 5 meaningful tasks:"
echo ""
echo "🛒 E-Commerce Platform:"
echo "   • User Authentication System"
echo "   • Product Catalog Management" 
echo "   • Shopping Cart & Checkout"
echo "   • Payment Gateway Integration"
echo "   • Order Management System"
echo ""
echo "🏦 Mobile Banking App:"
echo "   • Biometric Authentication"
echo "   • Account Balance & Transactions"
echo "   • Money Transfer System"
echo "   • Bill Payment Integration" 
echo "   • Fraud Detection System"
echo ""
echo "🏥 Healthcare CRM:"
echo "   • Patient Records Management"
echo "   • Appointment Scheduling"
echo "   • HIPAA Compliance Module"
echo "   • Billing & Insurance Integration"
echo "   • Telemedicine Platform"
echo ""
echo "🔄 Refresh your browser to see the tasks!"
echo "   Each product should show progress bars and task lists."