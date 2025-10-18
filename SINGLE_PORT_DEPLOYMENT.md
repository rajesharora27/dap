# Single Port Deployment Guide - Production Best Practice

## Overview

This guide shows how to expose **only port 443 (HTTPS)** to the internet while running both frontend and backend behind a reverse proxy.

## Architecture

```
Internet (Port 443) → [Nginx Reverse Proxy]
                              ├→ Frontend (localhost:5173)
                              └→ Backend API (localhost:4000/graphql)
```

**Benefits:**
- ✅ Only one port (443) exposed to internet
- ✅ Single SSL certificate for both frontend and API
- ✅ Better security (backend not directly accessible)
- ✅ Standard production setup
- ✅ No CORS issues

## Step 1: Install Nginx

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 2: Configure Nginx

Create nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/dap
```

Add this configuration:

```nginx
# DAP Application - Single Port Configuration

upstream frontend {
    server localhost:5173;
}

upstream backend {
    server localhost:4000;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # GraphQL API Endpoint
    location /graphql {
        proxy_pass http://backend/graphql;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend Application
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        
        # WebSocket support for HMR (development)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTP to HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}
```

## Step 3: Enable Nginx Configuration

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/dap /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 4: Get SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Certbot will automatically:
# - Get SSL certificate
# - Update nginx config
# - Set up auto-renewal
```

## Step 5: Update Environment Files

### `/data/dap/.env.production`

```bash
NODE_ENV=production

# Frontend Configuration
FRONTEND_HOST=127.0.0.1   # ← Only localhost (not internet accessible)
FRONTEND_PORT=5173
FRONTEND_URL=https://your-domain.com

# Backend Configuration  
BACKEND_HOST=127.0.0.1    # ← Only localhost (not internet accessible)
BACKEND_PORT=4000
BACKEND_URL=https://your-domain.com
GRAPHQL_ENDPOINT=https://your-domain.com/graphql  # ← Note: No port, just /graphql

# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap?schema=public

# CORS Configuration - Allow your domain
ALLOWED_ORIGINS=https://your-domain.com
```

**Key Changes:**
- `FRONTEND_HOST=127.0.0.1` - Frontend only accessible from localhost
- `BACKEND_HOST=127.0.0.1` - Backend only accessible from localhost  
- `GRAPHQL_ENDPOINT=https://your-domain.com/graphql` - No port number!

### `/data/dap/frontend/.env.production`

```bash
# Frontend Environment Variables for Production
VITE_GRAPHQL_ENDPOINT=https://your-domain.com/graphql  # ← No port number!
VITE_FRONTEND_URL=https://your-domain.com
```

## Step 6: Configure Firewall

```bash
# Only allow port 80 (HTTP) and 443 (HTTPS)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# DO NOT allow ports 4000 or 5173 - they should only be accessible from localhost

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

Expected output:
```
Status: active

To                         Action      From
--                         ------      ----
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

## Step 7: Build and Start Application

```bash
cd /data/dap

# Copy production config
cp .env.production .env

# Build backend
cd backend
npm install
npm run build
cd ..

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Start services
NODE_ENV=production ./dap start
```

## Step 8: Verify Setup

### Test from Server (localhost)

```bash
# Backend should be accessible on localhost
curl http://localhost:4000/graphql

# Frontend should be accessible on localhost
curl http://localhost:5173
```

### Test from Internet

```bash
# From another computer or browser:
# Frontend
https://your-domain.com

# GraphQL API
curl -X POST https://your-domain.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__typename}"}'

# Should NOT work (ports not exposed):
https://your-domain.com:4000  # ❌ Should fail
https://your-domain.com:5173  # ❌ Should fail
```

## Production Deployment Checklist

- [ ] Nginx installed and configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Nginx configuration updated with your domain
- [ ] `.env.production` updated with HTTPS URLs and localhost binding
- [ ] `frontend/.env.production` updated
- [ ] Firewall configured (only 80 and 443 open)
- [ ] Application built and started
- [ ] HTTPS redirect working (HTTP → HTTPS)
- [ ] GraphQL accessible at `/graphql` endpoint
- [ ] Frontend accessible at root `/`
- [ ] Ports 4000 and 5173 NOT accessible from internet

## Alternative: Using Port 5173 (If No Nginx)

If you want to expose port 5173 directly without nginx:

### Quick Setup

**`.env.production`:**
```bash
FRONTEND_HOST=0.0.0.0       # ← Accessible from internet
FRONTEND_PORT=5173
FRONTEND_URL=https://your-domain.com:5173
BACKEND_HOST=127.0.0.1      # ← Only localhost
BACKEND_PORT=4000
BACKEND_URL=https://your-domain.com:5173
GRAPHQL_ENDPOINT=https://your-domain.com:5173/api/graphql
```

**Firewall:**
```bash
sudo ufw allow 5173/tcp
```

**However, this is NOT recommended because:**
- ❌ Need to remember :5173 in URL
- ❌ Still need reverse proxy for GraphQL
- ❌ Can't use standard HTTPS port (443)
- ❌ More complex SSL setup

## Troubleshooting

### Issue: CORS Errors

**Solution:**
```bash
# Make sure ALLOWED_ORIGINS in .env.production matches exactly
ALLOWED_ORIGINS=https://your-domain.com

# No trailing slash, include https://
```

### Issue: 502 Bad Gateway

**Solution:**
```bash
# Check if services are running
ps aux | grep node

# Check backend is accessible from localhost
curl http://localhost:4000/graphql

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Issue: SSL Certificate Errors

**Solution:**
```bash
# Renew certificate
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

### Issue: Cannot Access from Internet

**Solution:**
```bash
# Check firewall
sudo ufw status

# Check nginx is running
sudo systemctl status nginx

# Check if port is listening
sudo netstat -tlnp | grep :443
```

## Monitoring & Logs

```bash
# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /data/dap/backend.log
tail -f /data/dap/frontend.log

# Check nginx status
sudo systemctl status nginx
```

## Auto-Start on Boot

```bash
# Create systemd service for DAP
sudo nano /etc/systemd/system/dap.service
```

Add:
```ini
[Unit]
Description=DAP Application
After=network.target postgresql.service

[Service]
Type=simple
User=yourusername
WorkingDirectory=/data/dap
Environment="NODE_ENV=production"
ExecStart=/data/dap/dap start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dap
sudo systemctl start dap
```

## Summary

**Single Port Setup:**
- ✅ Internet sees only port 443 (HTTPS)
- ✅ Nginx reverse proxy routes traffic internally
- ✅ Frontend at `https://your-domain.com/`
- ✅ Backend at `https://your-domain.com/graphql`
- ✅ Ports 4000 and 5173 only accessible from localhost
- ✅ Production-ready and secure

**Security Benefits:**
- Backend not directly exposed to internet
- Single SSL certificate for entire app
- Standard HTTPS port (443)
- Firewall only allows 80/443
- Security headers configured

---

**Recommended Setup:** Use nginx reverse proxy with only port 443 exposed!

For more details, see:
- [PUBLIC_URL_SETUP.md](PUBLIC_URL_SETUP.md) - Full deployment guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - General deployment
- [CONFIG_SYSTEM_GUIDE.md](CONFIG_SYSTEM_GUIDE.md) - Configuration reference
