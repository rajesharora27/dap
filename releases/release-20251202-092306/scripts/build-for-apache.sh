#!/bin/bash
# Build DAP frontend for Apache deployment at /dap/ path

set -e

echo "======================================"
echo "Building DAP Frontend for Apache"
echo "Base Path: /dap/"
echo "======================================"
echo ""

cd /data/dap/frontend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create environment configuration for build
echo "Creating build-time environment configuration..."
cat > .env.production.local << EOF
VITE_GRAPHQL_ENDPOINT=/dap/graphql
VITE_API_ENDPOINT=/dap/api
VITE_BASE_PATH=/dap/
EOF

# Build with base path
echo ""
echo "Building frontend with /dap/ base path..."
npm run build -- --base=/dap/

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✓ Build Complete!"
    echo "======================================"
    echo ""
    echo "Built files location: /data/dap/frontend/dist/"
    echo "Base path: /dap/"
    echo ""
    echo "The frontend is now ready for Apache deployment."
    echo ""
    echo "To deploy, restart Apache:"
    echo "  sudo systemctl restart httpd"
    echo ""
    echo "Access the application at:"
    echo "  http://myapps.cxsaaslab.com/dap/"
    echo "  http://myapps.rajarora.csslab/dap/"
    echo "  http://centos1.rajarora.csslab/dap/"
    echo "  https://myapps-8321890.ztna.sse.cisco.io/dap/"
    echo "  http://172.22.156.33/dap/"
    echo ""
else
    echo ""
    echo "✗ Build failed!"
    exit 1
fi
