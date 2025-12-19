#!/bin/bash
# Auto-create admin user after restart if missing
# This prevents the "invalid credentials" issue

BACKEND_DIR="/data/dap/backend"

echo "🔍 Checking for existing admin user..."

# Check if any users exist
USER_COUNT=$(docker exec dap_db_1 psql -U postgres -d dap -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' ')

if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" -eq "0" ]; then
    echo "⚠️  No users found in database. Creating admin user..."
    
    cd "$BACKEND_DIR"
    
    # Run the fix script - use npx ts-node with explicit options
    if npx ts-node scripts/fix_user_auth.ts admin "DAP123!!!" --admin 2>&1; then
        echo ""
        echo "✅ Admin user created successfully!"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  Login Credentials:"
        echo "  Username: admin"
        echo "  Password: DAP123!!!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
    else
        echo "❌ Failed to create admin user"
        # Don't exit with error - the app might still work with existing users
    fi
else
    echo "✅ Found $USER_COUNT user(s) in database"
    docker exec dap_db_1 psql -U postgres -d dap -c "SELECT username, email, \"isAdmin\", \"isActive\" FROM \"User\";" 2>/dev/null
fi
