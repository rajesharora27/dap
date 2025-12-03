#!/bin/bash
# Apache Setup Script for DAP at /dap/ subpath
# Usage: sudo ./setup-apache-subpath.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DAP Apache Subpath Configuration Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/redhat-release ]; then
    OS="rhel"
    APACHE_SERVICE="httpd"
    APACHE_CONF_DIR="/etc/httpd/conf.d"
    APACHE_LOG_DIR="/var/log/httpd"
    echo -e "${GREEN}Detected RHEL/CentOS/Rocky Linux${NC}"
elif [ -f /etc/debian_version ]; then
    OS="debian"
    APACHE_SERVICE="apache2"
    APACHE_CONF_DIR="/etc/apache2/sites-available"
    APACHE_ENABLED_DIR="/etc/apache2/sites-enabled"
    APACHE_LOG_DIR="/var/log/apache2"
    echo -e "${GREEN}Detected Debian/Ubuntu${NC}"
else
    echo -e "${RED}Unsupported OS${NC}"
    exit 1
fi

# Check if Apache is installed
if ! command -v httpd &> /dev/null && ! command -v apache2 &> /dev/null; then
    echo -e "${YELLOW}Apache is not installed. Installing...${NC}"
    if [ "$OS" = "rhel" ]; then
        dnf install -y httpd mod_ssl
    else
        apt-get update
        apt-get install -y apache2
    fi
fi

# Enable required Apache modules
echo -e "${GREEN}Enabling required Apache modules...${NC}"
if [ "$OS" = "rhel" ]; then
    # RHEL modules are typically compiled in or loaded by default
    # Verify they exist in the modules directory
    if [ ! -f /etc/httpd/modules/mod_proxy.so ]; then
        echo -e "${RED}mod_proxy not found. Please install httpd-devel${NC}"
        exit 1
    fi
else
    # Debian/Ubuntu
    a2enmod proxy
    a2enmod proxy_http
    a2enmod proxy_wstunnel
    a2enmod rewrite
    a2enmod headers
fi

# Copy configuration file
echo -e "${GREEN}Installing Apache configuration...${NC}"
if [ "$OS" = "rhel" ]; then
    cp /data/dap/config/apache-dap-subpath.conf "$APACHE_CONF_DIR/dap.conf"
    echo -e "${GREEN}Configuration installed to $APACHE_CONF_DIR/dap.conf${NC}"
else
    cp /data/dap/config/apache-dap-subpath.conf "$APACHE_CONF_DIR/dap.conf"
    ln -sf "$APACHE_CONF_DIR/dap.conf" "$APACHE_ENABLED_DIR/dap.conf"
    echo -e "${GREEN}Configuration installed and enabled${NC}"
fi

# Update SELinux context if on RHEL
if [ "$OS" = "rhel" ]; then
    if command -v getenforce &> /dev/null && [ "$(getenforce)" != "Disabled" ]; then
        echo -e "${GREEN}Configuring SELinux...${NC}"
        
        # Allow Apache to connect to backend
        setsebool -P httpd_can_network_connect 1
        
        # Set correct context for frontend files
        semanage fcontext -a -t httpd_sys_content_t "/data/dap/frontend/dist(/.*)?" || true
        restorecon -Rv /data/dap/frontend/dist || true
        
        echo -e "${GREEN}SELinux configured${NC}"
    fi
fi

# Configure firewall
echo -e "${GREEN}Configuring firewall...${NC}"
if command -v firewall-cmd &> /dev/null; then
    # RHEL/CentOS with firewalld
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    echo -e "${GREEN}Firewall rules added (firewalld)${NC}"
elif command -v ufw &> /dev/null; then
    # Ubuntu with ufw
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo -e "${GREEN}Firewall rules added (ufw)${NC}"
fi

# Test Apache configuration
echo -e "${GREEN}Testing Apache configuration...${NC}"
if [ "$OS" = "rhel" ]; then
    httpd -t
else
    apache2ctl -t
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Apache configuration is valid${NC}"
else
    echo -e "${RED}✗ Apache configuration has errors${NC}"
    exit 1
fi

# Update Vite configuration for base path
echo -e "${GREEN}Updating Vite configuration for /dap/ base path...${NC}"
cd /data/dap

# Create or update vite.config.ts with base path
if grep -q "base:" /data/dap/frontend/vite.config.ts; then
    echo -e "${YELLOW}Base path already configured in vite.config.ts${NC}"
else
    # Backup original
    cp /data/dap/frontend/vite.config.ts /data/dap/frontend/vite.config.ts.backup
    echo -e "${YELLOW}Original vite.config.ts backed up${NC}"
fi

# Update frontend environment for production
echo -e "${GREEN}Updating frontend environment...${NC}"
cat > /data/dap/frontend/.env.production.dap << 'EOF'
# Frontend Environment Variables for Production with /dap/ base path
VITE_GRAPHQL_ENDPOINT=/dap/graphql
VITE_API_ENDPOINT=/dap/api
VITE_BASE_PATH=/dap/
EOF

echo -e "${GREEN}Created frontend/.env.production.dap${NC}"

# Create build script
cat > /data/dap/scripts/build-for-apache.sh << 'EOF'
#!/bin/bash
# Build DAP frontend for Apache deployment at /dap/ path

set -e

echo "Building DAP frontend for /dap/ deployment..."

cd /data/dap/frontend

# Use the /dap/ base path environment
export VITE_GRAPHQL_ENDPOINT=/dap/graphql
export VITE_API_ENDPOINT=/dap/api

# Build with base path
npm run build -- --base=/dap/

echo "✓ Build complete: frontend/dist/"
echo ""
echo "Frontend built with base path: /dap/"
echo "Deploy by restarting Apache:"
echo "  sudo systemctl restart httpd"
EOF

chmod +x /data/dap/scripts/build-for-apache.sh
echo -e "${GREEN}Created build script: scripts/build-for-apache.sh${NC}"

# Enable and start Apache
echo -e "${GREEN}Starting Apache...${NC}"
systemctl enable $APACHE_SERVICE
systemctl restart $APACHE_SERVICE

# Check Apache status
if systemctl is-active --quiet $APACHE_SERVICE; then
    echo -e "${GREEN}✓ Apache is running${NC}"
else
    echo -e "${RED}✗ Apache failed to start${NC}"
    systemctl status $APACHE_SERVICE
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Apache Configuration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Build the frontend with /dap/ base path:"
echo -e "   ${GREEN}cd /data/dap${NC}"
echo -e "   ${GREEN}./scripts/build-for-apache.sh${NC}"
echo ""
echo "2. Ensure backend is running on port 4000:"
echo -e "   ${GREEN}cd /data/dap/backend${NC}"
echo -e "   ${GREEN}npm start${NC}"
echo ""
echo "3. Access the application at:"
echo -e "   ${GREEN}http://myapps.cxsaaslab.com/dap/${NC}"
echo -e "   ${GREEN}http://myapps.rajarora.csslab/dap/${NC}"
echo ""
echo "4. Check Apache logs if issues occur:"
echo -e "   ${GREEN}tail -f $APACHE_LOG_DIR/dap-error.log${NC}"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo "- Backend must be running on localhost:4000"
echo "- Frontend assets will be served from /data/dap/frontend/dist"
echo "- GraphQL endpoint: /dap/graphql"
echo "- API endpoint: /dap/api/*"
echo ""

