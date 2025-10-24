#!/bin/bash
# Development Testing Setup - Expose Port 5173
# Usage: ./setup-dev-testing.sh

set -e

DOMAIN="dap.temp.io"
IP="172.22.156.32"

echo "================================================"
echo "DAP Development Testing Setup"
echo "================================================"
echo "Domain: $DOMAIN"
echo "Server IP: $IP"
echo "Ports: 5173 (Frontend), 4000 (Backend)"
echo ""

# Update .env.development
echo "Creating .env.development..."
cat > /data/dap/.env.development << EOF
NODE_ENV=development

# Frontend Configuration - Bind to all interfaces
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
FRONTEND_URL=http://$DOMAIN:5173

# Backend Configuration - Bind to all interfaces
BACKEND_HOST=0.0.0.0
BACKEND_PORT=4000
BACKEND_URL=http://$DOMAIN:4000
GRAPHQL_ENDPOINT=http://$DOMAIN:4000/graphql

# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap?schema=public

# CORS Configuration - Allow your domain and IP
ALLOWED_ORIGINS=http://$DOMAIN:5173,http://$IP:5173,http://localhost:5173
EOF

# Update frontend .env.development
echo "Creating frontend/.env.development..."
cat > /data/dap/frontend/.env.development << EOF
# Frontend Environment Variables for Development Testing
VITE_GRAPHQL_ENDPOINT=http://$DOMAIN:4000/graphql
VITE_FRONTEND_URL=http://$DOMAIN:5173
EOF

# Copy to active config
echo "Copying to active .env file..."
cp /data/dap/.env.development /data/dap/.env

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 5173/tcp 2>/dev/null || true
sudo ufw allow 4000/tcp 2>/dev/null || true
sudo ufw allow 22/tcp 2>/dev/null || true

echo ""
echo "✅ Development testing setup complete!"
echo ""
echo "================================================"
echo "NEXT STEPS"
echo "================================================"
echo ""
echo "1. On each client/tester machine, add to /etc/hosts:"
echo "   --------------------------------------------------"
echo "   Linux/Mac:"
echo "     sudo nano /etc/hosts"
echo "     Add this line:"
echo "     $IP    $DOMAIN"
echo ""
echo "   Windows:"
echo "     Run Notepad as Administrator"
echo "     Open: C:\\Windows\\System32\\drivers\\etc\\hosts"
echo "     Add this line:"
echo "     $IP    $DOMAIN"
echo ""
echo "2. Start DAP services:"
echo "   --------------------------------------------------"
echo "   cd /data/dap"
echo "   ./dap start"
echo ""
echo "3. Verify services are running:"
echo "   --------------------------------------------------"
echo "   sudo netstat -tlnp | grep :5173"
echo "   sudo netstat -tlnp | grep :4000"
echo "   # Should show 0.0.0.0:5173 and 0.0.0.0:4000"
echo ""
echo "4. Access the application:"
echo "   --------------------------------------------------"
echo "   Frontend:   http://$DOMAIN:5173"
echo "   Backend:    http://$DOMAIN:4000/graphql"
echo ""
echo "================================================"
echo "TESTING FROM CLIENT MACHINE"
echo "================================================"
echo ""
echo "Test connectivity:"
echo "  ping $DOMAIN"
echo "  curl http://$DOMAIN:5173"
echo "  curl http://$DOMAIN:4000/graphql"
echo ""
echo "Open in browser:"
echo "  http://$DOMAIN:5173"
echo ""
echo "================================================"
echo ""
echo "⚠️  This is for DEVELOPMENT/TESTING only!"
echo "    Uses HTTP (not HTTPS) and exposes services"
echo "    For production, use nginx single-port setup"
echo ""
