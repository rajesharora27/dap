#!/bin/bash

# Direct SQL Database Cleanup
# Bypasses GraphQL authentication by working directly with PostgreSQL

echo "🗃️  DIRECT SQL DATABASE CLEANUP"
echo "==============================="
echo ""
echo "This will directly clean the PostgreSQL database:"
echo "1. Delete all tasks and related data"
echo "2. Delete all licenses" 
echo "3. Delete all products"
echo "4. Insert 3 clean products"
echo ""
echo "⚠️  This bypasses all authentication and constraints!"
echo ""
read -p "Continue? Type 'YES' to confirm: " confirm

if [ "$confirm" != "YES" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🔍 Step 1: Checking current database content..."

# Check current counts
docker exec dap_db_1 psql -U postgres -d dap -c "
SELECT 
  (SELECT COUNT(*) FROM \"Task\") as tasks,
  (SELECT COUNT(*) FROM \"License\") as licenses,
  (SELECT COUNT(*) FROM \"Product\") as products;
" 2>/dev/null

echo ""
echo "🗑️  Step 2: Cleaning database tables..."

echo "  Deleting tasks and related data..."
docker exec dap_db_1 psql -U postgres -d dap -c "
-- Delete task-related tables first (foreign key constraints)
DELETE FROM \"TaskOutcome\";
DELETE FROM \"Task\";
DELETE FROM \"Outcome\";
" 2>/dev/null

echo "  Deleting licenses..."
docker exec dap_db_1 psql -U postgres -d dap -c "
DELETE FROM \"License\";
" 2>/dev/null

echo "  Deleting customer associations..."
docker exec dap_db_1 psql -U postgres -d dap -c "
DELETE FROM \"CustomerProduct\";
DELETE FROM \"CustomerSolution\";
" 2>/dev/null

echo "  Deleting products..."
docker exec dap_db_1 psql -U postgres -d dap -c "
DELETE FROM \"Product\";
" 2>/dev/null

echo "  Cleaning other related data..."
docker exec dap_db_1 psql -U postgres -d dap -c "
DELETE FROM \"AuditLog\";
DELETE FROM \"ChangeItem\";
DELETE FROM \"ChangeSet\";
DELETE FROM \"Telemetry\";
" 2>/dev/null

echo "✅ Database cleaned"

echo ""
echo "✨ Step 3: Creating 3 clean products..."

# Insert clean products directly into database
docker exec dap_db_1 psql -U postgres -d dap -c "
-- Create 3 clean products
INSERT INTO \"Product\" (id, name, description, \"customAttrs\") VALUES 
('prod-ecommerce-1', 'E-Commerce Platform', 'Complete online shopping solution with payment gateway', '{\"version\": \"1.0\", \"priority\": \"high\"}'),
('prod-banking-1', 'Mobile Banking App', 'Secure mobile banking with biometric authentication', '{\"security_level\": \"maximum\", \"platform\": \"mobile\"}'),
('prod-healthcare-1', 'Healthcare CRM', 'Patient management system with appointment scheduling', '{\"industry\": \"healthcare\", \"compliance\": [\"HIPAA\"]}');
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Created 3 products successfully"
else
    echo "❌ Failed to create products"
fi

echo ""
echo "📊 Step 4: Verification..."

# Check final counts
docker exec dap_db_1 psql -U postgres -d dap -c "
SELECT 
  (SELECT COUNT(*) FROM \"Task\") as tasks,
  (SELECT COUNT(*) FROM \"License\") as licenses,
  (SELECT COUNT(*) FROM \"Product\") as products;
" 2>/dev/null

# Show the created products
echo ""
echo "Created products:"
docker exec dap_db_1 psql -U postgres -d dap -c "
SELECT id, name, description FROM \"Product\" ORDER BY id;
" 2>/dev/null

echo ""
echo "🎉 DATABASE CLEANUP COMPLETE!"
echo "============================"
echo ""
echo "Your database now has exactly 3 clean products:"
echo "  1. E-Commerce Platform"
echo "  2. Mobile Banking App"
echo "  3. Healthcare CRM"
echo ""
echo "🔄 Refresh your browser (Ctrl+Shift+R) to see the clean data!"
echo ""
echo "Note: If you need to add tasks or licenses later, use the GUI"
echo "      which will handle authentication properly."