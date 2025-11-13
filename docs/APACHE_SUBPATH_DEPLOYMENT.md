# Apache Subpath Deployment Guide

This guide explains how to deploy the DAP application at the `/dap/` subpath using Apache (httpd) web server.

## Supported URLs

The application will be accessible via the following URLs:

- `http://myapps.cxsaaslab.com/dap/`
- `http://myapps.rajarora.csslab/dap/`
- `http://centos1.rajarora.csslab/dap/`
- `https://myapps-8321890.ztna.sse.cisco.io/dap/`
- `http://172.22.156.32/dap/`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Apache (httpd) - Ports 80/443                          │
│  Multiple domains via ServerAlias                        │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─→ /dap/                → Frontend (from /data/dap/frontend/dist)
               ├─→ /dap/graphql         → Backend GraphQL (localhost:4000)
               ├─→ /dap/api/*           → Backend REST API (localhost:4000)
               └─→ WebSocket support    → GraphQL subscriptions
                   
Internal Services:
  - Backend:  Node.js/Express on localhost:4000
  - Database: PostgreSQL on localhost:5432
```

## Quick Setup

### 1. Run the Setup Script

```bash
sudo /data/dap/scripts/setup-apache-subpath.sh
```

This script will:
- Detect your OS (RHEL/CentOS or Debian/Ubuntu)
- Install Apache if not present
- Enable required Apache modules
- Configure SELinux (if applicable)
- Configure firewall rules
- Install the Apache configuration
- Create a build script for the frontend

### 2. Build the Frontend

```bash
cd /data/dap
./scripts/build-for-apache.sh
```

This will build the frontend with the correct `/dap/` base path.

### 3. Start the Backend

```bash
cd /data/dap/backend
npm start
```

The backend must be running on `localhost:4000` for Apache to proxy requests.

### 4. Access the Application

Open your browser and navigate to any of the supported URLs:
- `http://myapps.cxsaaslab.com/dap/`
- `http://centos1.rajarora.csslab/dap/`
- `https://myapps-8321890.ztna.sse.cisco.io/dap/`

## Manual Setup

If you prefer to configure manually, follow these steps:

### 1. Install Required Packages

**RHEL/CentOS/Rocky Linux:**
```bash
sudo dnf install -y httpd mod_ssl
```

**Debian/Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install -y apache2
```

### 2. Enable Apache Modules

**RHEL/CentOS:**
Modules are typically compiled in or loaded by default. Verify they exist:
```bash
ls /etc/httpd/modules/mod_proxy*.so
```

**Debian/Ubuntu:**
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod ssl
```

### 3. Install Configuration

**RHEL/CentOS:**
```bash
sudo cp /data/dap/config/apache-dap-subpath.conf /etc/httpd/conf.d/dap.conf
```

**Debian/Ubuntu:**
```bash
sudo cp /data/dap/config/apache-dap-subpath.conf /etc/apache2/sites-available/dap.conf
sudo a2ensite dap
```

### 4. Configure SELinux (RHEL/CentOS only)

```bash
# Allow Apache to connect to backend
sudo setsebool -P httpd_can_network_connect 1

# Set correct context for frontend files
sudo semanage fcontext -a -t httpd_sys_content_t "/data/dap/frontend/dist(/.*)?"
sudo restorecon -Rv /data/dap/frontend/dist
```

### 5. Configure Firewall

**firewalld (RHEL/CentOS):**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**ufw (Ubuntu):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 6. Test and Restart Apache

```bash
# Test configuration
sudo apachectl configtest

# Restart Apache
sudo systemctl restart httpd  # RHEL/CentOS
# OR
sudo systemctl restart apache2  # Debian/Ubuntu
```

## Building the Frontend

The frontend must be built with the `/dap/` base path. There are two methods:

### Method 1: Using the Build Script (Recommended)

```bash
cd /data/dap
./scripts/build-for-apache.sh
```

### Method 2: Manual Build

```bash
cd /data/dap/frontend

# Set environment variables
export VITE_GRAPHQL_ENDPOINT=/dap/graphql
export VITE_API_ENDPOINT=/dap/api
export VITE_BASE_PATH=/dap/

# Build
npm run build -- --base=/dap/
```

The built files will be in `/data/dap/frontend/dist/` and Apache will serve them from the `/dap/` path.

## Backend Configuration

The backend runs on `localhost:4000` and doesn't need special configuration for the subpath deployment, as Apache handles the path rewriting.

Ensure your backend `.env` or environment includes:

```bash
PORT=4000
HOST=127.0.0.1
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/dap
```

## SSL/TLS Configuration

For HTTPS access (especially for the ZTNA URL), you need SSL certificates.

### Using Let's Encrypt (Recommended)

**RHEL/CentOS:**
```bash
sudo dnf install -y certbot python3-certbot-apache
sudo certbot --apache -d myapps.cxsaaslab.com
```

**Debian/Ubuntu:**
```bash
sudo apt-get install -y certbot python3-certbot-apache
sudo certbot --apache -d myapps.cxsaaslab.com
```

### Using Existing Certificates

Edit `/etc/httpd/conf.d/dap.conf` (or `/etc/apache2/sites-available/dap.conf`) and update the SSL section:

```apache
<VirtualHost *:443>
    ServerName myapps-8321890.ztna.sse.cisco.io
    
    SSLEngine on
    SSLCertificateFile /path/to/your/cert.pem
    SSLCertificateKeyFile /path/to/your/key.pem
    SSLCertificateChainFile /path/to/chain.pem
    
    # ... rest of configuration ...
</VirtualHost>
```

## Verification

### 1. Check Apache Status

```bash
sudo systemctl status httpd  # RHEL/CentOS
# OR
sudo systemctl status apache2  # Debian/Ubuntu
```

### 2. Check Apache Configuration

```bash
sudo apachectl configtest
```

### 3. Check Backend

```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","uptime":...}
```

### 4. Test GraphQL Endpoint

```bash
curl -X POST http://myapps.cxsaaslab.com/dap/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

### 5. Access Frontend

Open a browser and navigate to:
- `http://myapps.cxsaaslab.com/dap/`

You should see the DAP application login page.

## Troubleshooting

### Issue: 404 Not Found on /dap/

**Cause:** Frontend not built or files missing.

**Solution:**
```bash
cd /data/dap
./scripts/build-for-apache.sh
sudo systemctl restart httpd
```

### Issue: 502 Bad Gateway on /dap/graphql

**Cause:** Backend not running.

**Solution:**
```bash
cd /data/dap/backend
npm start
```

### Issue: Permission Denied

**Cause:** SELinux blocking Apache access to files.

**Solution:**
```bash
sudo setsebool -P httpd_can_network_connect 1
sudo restorecon -Rv /data/dap/frontend/dist
```

### Issue: WebSocket Connection Failed

**Cause:** `mod_proxy_wstunnel` not enabled or configured.

**Solution:**
```bash
# Check if module is loaded
apachectl -M | grep proxy_wstunnel

# Ensure WebSocket rewrite rules are in config
# See /data/dap/config/apache-dap-subpath.conf
```

### Issue: Blank Page or Routing Issues

**Cause:** Frontend not built with correct base path.

**Solution:**
```bash
cd /data/dap/frontend
npm run build -- --base=/dap/
sudo systemctl restart httpd
```

## Logs

### Apache Logs

**RHEL/CentOS:**
```bash
# Access logs
tail -f /var/log/httpd/dap-access.log
tail -f /var/log/httpd/dap-ssl-access.log

# Error logs
tail -f /var/log/httpd/dap-error.log
tail -f /var/log/httpd/dap-ssl-error.log
```

**Debian/Ubuntu:**
```bash
tail -f /var/log/apache2/dap-access.log
tail -f /var/log/apache2/dap-error.log
```

### Backend Logs

```bash
cd /data/dap/backend
tail -f backend.log
```

## Production Considerations

### 1. Process Management

Use a process manager for the backend to ensure it stays running:

**Using systemd:**
```bash
sudo cp /data/dap/dap.service /etc/systemd/system/dap-backend.service
sudo systemctl enable dap-backend
sudo systemctl start dap-backend
```

**Using PM2:**
```bash
npm install -g pm2
cd /data/dap/backend
pm2 start npm --name "dap-backend" -- start
pm2 startup
pm2 save
```

### 2. Security Hardening

- ✅ Use HTTPS for all production access
- ✅ Configure firewall to only allow ports 80/443
- ✅ Keep Apache and packages updated
- ✅ Use strong SSL/TLS configuration
- ✅ Enable SELinux (RHEL/CentOS)
- ✅ Regular security audits

### 3. Performance Optimization

Add caching for static assets in the Apache config:

```apache
<Directory /data/dap/frontend/dist>
    # Cache static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>
</Directory>
```

### 4. Monitoring

Set up monitoring for:
- Apache service status
- Backend service status
- Database connectivity
- Disk space usage
- Log rotation

## Summary

After completing this setup:

✅ DAP application accessible at `/dap/` path  
✅ Multiple domain names supported  
✅ HTTP and HTTPS access configured  
✅ WebSocket support for GraphQL subscriptions  
✅ SPA routing working correctly  
✅ Backend API proxied through Apache  
✅ Static assets cached appropriately  
✅ SELinux and firewall configured  

## Quick Reference Commands

```bash
# Restart Apache
sudo systemctl restart httpd  # RHEL/CentOS

# View Apache logs
tail -f /var/log/httpd/dap-error.log

# Test Apache config
sudo apachectl configtest

# Rebuild frontend
./scripts/build-for-apache.sh

# Start backend
cd /data/dap/backend && npm start

# Check services
sudo systemctl status httpd
curl http://localhost:4000/health
```

