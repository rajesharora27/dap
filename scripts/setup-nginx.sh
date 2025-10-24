#!/bin/bash
# Single Port Nginx Setup Script for DAP
# Usage: sudo ./setup-nginx.sh your-domain.com

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check domain argument
if [ -z "$1" ]; then
    echo "Usage: sudo ./setup-nginx.sh your-domain.com"
    exit 1
fi

DOMAIN=$1
echo "Setting up DAP with nginx reverse proxy for domain: $DOMAIN"

# Install nginx
echo "Installing nginx..."
apt-get update
apt-get install -y nginx

# Install certbot for SSL
echo "Installing certbot..."
apt-get install -y certbot python3-certbot-nginx

# Create nginx configuration
echo "Creating nginx configuration..."
cat > /etc/nginx/sites-available/dap << EOF
# DAP Application - Single Port Configuration

upstream frontend {
    server 127.0.0.1:5173;
}

upstream backend {
    server 127.0.0.1:4000;
}

# HTTPS Server (will be configured by certbot)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # GraphQL API Endpoint
    location /graphql {
        proxy_pass http://backend/graphql;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend Application
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
echo "Enabling nginx site..."
ln -sf /etc/nginx/sites-available/dap /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

# Update environment files
echo "Updating environment files..."
cd /data/dap

# Update .env.production
cat > .env.production << EOF
NODE_ENV=production

# Frontend Configuration
FRONTEND_HOST=127.0.0.1
FRONTEND_PORT=5173
FRONTEND_URL=https://$DOMAIN

# Backend Configuration  
BACKEND_HOST=127.0.0.1
BACKEND_PORT=4000
BACKEND_URL=https://$DOMAIN
GRAPHQL_ENDPOINT=https://$DOMAIN/graphql

# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap?schema=public

# CORS Configuration
ALLOWED_ORIGINS=https://$DOMAIN
EOF

# Update frontend .env.production
cat > frontend/.env.production << EOF
# Frontend Environment Variables for Production
VITE_GRAPHQL_ENDPOINT=https://$DOMAIN/graphql
VITE_FRONTEND_URL=https://$DOMAIN
EOF

# Configure firewall
echo "Configuring firewall..."
ufw --force enable
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # Keep SSH open!

echo ""
echo "✅ Nginx configuration complete!"
echo ""
echo "Next steps:"
echo "1. Get SSL certificate:"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "2. Build and start DAP:"
echo "   cd /data/dap"
echo "   cp .env.production .env"
echo "   cd backend && npm install && npm run build && cd .."
echo "   cd frontend && npm install && npm run build && cd .."
echo "   NODE_ENV=production ./dap start"
echo ""
echo "3. Access your app at:"
echo "   https://$DOMAIN"
echo ""
echo "Only port 443 will be exposed to the internet!"
echo "Backend (port 4000) and frontend (port 5173) will only be accessible from localhost."
