#!/bin/bash
# Script to switch httpd between dev (proxy to Vite) and production (static files) mode

MODE="${1:-status}"

case "$MODE" in
    dev)
        echo "Switching to DEVELOPMENT mode (proxy to Vite dev server)..."
        sudo sed -i.bak '/# DAP Application at \/dap\/ path/,/<\/Location>/ {
            /# DAP Application/c\    # DAP Application at /dap/ path - PROXIED TO VITE DEV SERVER\n    # To switch back to production build, replace this with:\n    #   Alias /dap /data/dap/frontend/dist\n    #   <Directory /data/dap/frontend/dist> ... </Directory>\n    \n    <Location /dap/>\n        # Proxy to Vite dev server on port 5173\n        ProxyPass http://127.0.0.1:5173/dap/\n        ProxyPassReverse http://127.0.0.1:5173/dap/\n        \n        # WebSocket support for HMR (Hot Module Replacement)\n        RewriteEngine On\n        RewriteCond %{HTTP:Upgrade} websocket [NC]\n        RewriteCond %{HTTP:Connection} upgrade [NC]\n        RewriteRule ^/dap/(.*)$ ws://127.0.0.1:5173/dap/$1 [P,L,QSA]\n        \n        # Proxy headers\n        ProxyPreserveHost On\n        RequestHeader set X-Forwarded-Proto "http"\n        RequestHeader set X-Forwarded-Prefix "/dap"\n    </Location>
        }' /etc/httpd/conf.d/dap.conf
        ;;
    
    prod)
        echo "Switching to PRODUCTION mode (static files)..."
        sudo sed -i.bak '/# DAP Application at \/dap\/ path/,/<\/Location>/ {
            /# DAP Application/c\    # DAP Application at /dap/ path\n    Alias /dap /data/dap/frontend/dist\n    \n    <Directory /data/dap/frontend/dist>\n        Options -Indexes +FollowSymLinks\n        AllowOverride None\n        Require all granted\n        \n        # Enable rewrite for SPA routing\n        RewriteEngine On\n        RewriteBase /dap/\n        \n        # Don'\''t rewrite files that exist\n        RewriteCond %{REQUEST_FILENAME} !-f\n        RewriteCond %{REQUEST_FILENAME} !-d\n        \n        # Don'\''t rewrite API and GraphQL requests\n        RewriteCond %{REQUEST_URI} !^/dap/graphql\n        RewriteCond %{REQUEST_URI} !^/dap/api\n        \n        # Rewrite everything else to index.html\n        RewriteRule ^ /dap/index.html [L]\n    </Directory>
        }' /etc/httpd/conf.d/dap.conf
        ;;
    
    status)
        echo "Current httpd configuration for /dap/:"
        echo "========================================"
        grep -A 15 "# DAP Application at /dap/ path" /etc/httpd/conf.d/dap.conf | head -20
        echo ""
        if grep -q "ProxyPass.*5173" /etc/httpd/conf.d/dap.conf; then
            echo "MODE: DEVELOPMENT (proxying to Vite dev server on port 5173)"
        elif grep -q "Alias /dap /data/dap/frontend/dist" /etc/httpd/conf.d/dap.conf; then
            echo "MODE: PRODUCTION (serving static files from /data/dap/frontend/dist)"
        else
            echo "MODE: UNKNOWN"
        fi
        exit 0
        ;;
    
    *)
        echo "Usage: $0 {dev|prod|status}"
        echo ""
        echo "  dev     - Switch to development mode (proxy to Vite on port 5173)"
        echo "  prod    - Switch to production mode (serve static build files)"
        echo "  status  - Show current configuration"
        exit 1
        ;;
esac

# Test configuration
echo "Testing Apache configuration..."
if sudo apachectl configtest 2>&1 | grep -q "Syntax OK"; then
    echo "✅ Configuration syntax is OK"
    echo "Reloading Apache..."
    sudo systemctl reload httpd
    echo "✅ Apache reloaded successfully"
    echo ""
    echo "You can now access the app at: http://dev.rajarora.csslab/dap/"
else
    echo "❌ Configuration has errors. Not reloading Apache."
    exit 1
fi
