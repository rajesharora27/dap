# DAP Deployment - Complete Guide

**Version:** 2.1.0  
**Last Updated:** November 30, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Development Deployment](#development-deployment)
3. [Production Deployment](#production-deployment)
4. [Apache Subpath Configuration](#apache-subpath-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Health Checks & Verification](#health-checks--verification)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Overview

DAP can be deployed in two configurations:

### Development (centos1 - 172.22.156.32)
- **Purpose:** Development and testing
- **Web Server:** Apache at `/dap/` subpath
- **URLs:** 
  - http://myapps.cxsaaslab.com/dap/
  - http://myapps.rajarora.csslab/dap/
  - http://centos1.rajarora.csslab/dap/
  - https://myapps-8321890.ztna.sse.cisco.io/dap/
  - http://172.22.156.32/dap/
- **Services:** Manual npm start, Apache proxy

### Production (centos2 - 172.22.156.33)
- **Purpose:** Production deployment
- **Web Server:** Nginx with PM2 process management
- **URLs:**
  - http://prod.rajarora.csslab/dap/
  - http://172.22.156.33/dap/
  - http://centos2.rajarora.csslab/dap/
- **Services:** PM2 cluster mode, systemd services

---

## Development Deployment

### Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Podman container)
- Apache httpd installed

### Quick Start

```bash
cd /data/dap

# 1. Setup Apache (one-time)
sudo ./scripts/setup-apache-subpath.sh

# 2. Build frontend for Apache
./scripts/build-for-apache.sh

# 3. Start database (if using Podman)
podman run --name dap_db \
  -e POSTGRES_DB=dap \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 \
  -d postgres:16

# 4. Setup backend
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run seed  # Optional: sample data
npm start

# 5. Access application
# Open: http://myapps.cxsaaslab.com/dap/
```

### Apache Configuration

**File:** `/etc/httpd/conf.d/dap.conf`

The setup script automatically:
- Installs Apache if needed
- Configures reverse proxy for GraphQL/API
- Sets up SPA routing
- Configures CORS and security headers
- Enables required modules

**Manual verification:**
```bash
# Check Apache config
sudo apachectl configtest

# Restart Apache
sudo systemctl restart httpd

# Check status
sudo systemctl status httpd
```

### Backend Environment (.env)

```env
NODE_ENV=development
PORT=4000
HOST=127.0.0.1
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/dap?schema=public
TRUST_PROXY=true
ALLOWED_ORIGINS=http://myapps.cxsaaslab.com,http://myapps.rajarora.csslab,http://centos1.rajarora.csslab,https://myapps-8321890.ztna.sse.cisco.io,http://172.22.156.32
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=24h
```

---

## Production Deployment

### First-Time Setup

#### 1. Server Preparation (Run on centos2)

```bash
# Copy setup script to production server
scp /data/dap/deploy/scripts/01-setup-server.sh rajarora@172.22.156.33:/tmp/

# SSH to production and run setup
ssh rajarora@172.22.156.33
chmod +x /tmp/01-setup-server.sh
sudo /tmp/01-setup-server.sh

# This installs:
# - Node.js 20
# - PM2 process manager
# - PostgreSQL 16
# - Nginx
# - Creates 'dap' user
# - Configures firewall
```

#### 2. (Optional) Security Hardening

```bash
# Copy hardening script
scp /data/dap/deploy/scripts/02-harden-server.sh rajarora@172.22.156.33:/tmp/

# Run hardening
ssh rajarora@172.22.156.33
chmod +x /tmp/02-harden-server.sh
sudo /tmp/02-harden-server.sh

# This installs:
# - Fail2Ban
# - AIDE
# - Auditd
# - SSH hardening
```

### Regular Deployment (Run from centos1)

#### Full Deployment

```bash
/data/dap/deploy/scripts/deploy-app.sh
```

**This script:**
1. Verifies SSH connectivity
2. Builds backend and frontend
3. Creates deployment package
4. Backs up current deployment
5. Stops application
6. Transfers files
7. Installs dependencies
8. Runs database migrations
9. Starts application with PM2
10. Runs health checks

#### Quick Production Commands

```bash
# Check status
/data/dap/deploy/scripts/prod.sh status

# View logs (follow mode)
/data/dap/deploy/scripts/prod.sh logs

# Restart application
/data/dap/deploy/scripts/prod.sh restart

# Health check
/data/dap/deploy/scripts/prod.sh health

# SSH to production
/data/dap/deploy/scripts/prod.sh ssh

# Database access
/data/dap/deploy/scripts/prod.sh db
```

### PM2 Process Management

**Configuration:** `/data/dap/app/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'dap-backend',
      script: 'dist/server.js',
      instances: 'max',        // Uses all CPU cores
      exec_mode: 'cluster',    // Load balancing
      max_memory_restart: '1G',
      autorestart: true,
      error_file: '/data/dap/logs/backend-error.log',
      out_file: '/data/dap/logs/backend-out.log'
    },
    {
      name: 'dap-frontend',
      script: '/usr/bin/serve',
      args: '-s dist -l 3000',
      max_memory_restart: '512M',
      autorestart: true
    }
  ]
};
```

**Manual PM2 Commands (on production):**
```bash
# Status
sudo -u dap pm2 status

# Logs
sudo -u dap pm2 logs

# Restart
sudo -u dap pm2 restart all

# Monitor
sudo -u dap pm2 monit
```

### Nginx Configuration

**File:** `/etc/nginx/conf.d/dap.conf`

```nginx
server {
    listen 80;
    server_name prod.rajarora.csslab 172.22.156.33 centos2.rajarora.csslab;

    # Frontend
    location /dap/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /dap/graphql {
        proxy_pass http://localhost:4000/graphql;
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /dap/api/ {
        proxy_pass http://localhost:4000/api/;
    }
}
```

---

## Apache Subpath Configuration

### Overview

The development environment uses Apache to serve DAP at `/dap/` subpath.

### Configuration File

**Location:** `/etc/httpd/conf.d/dap.conf`  
**Source:** `/data/dap/config/apache-dap-subpath.conf`

### Key Features

1. **Multi-Domain Support**
   - ServerAlias for all required domains
   - Supports IP address access

2. **SPA Routing**
   - RewriteEngine for client-side routing
   - All non-file requests route to index.html

3. **GraphQL Proxy**
   - `/dap/graphql` → `http://localhost:4000/graphql`
   - WebSocket support enabled

4. **API Proxy**
   - `/dap/api/*` → `http://localhost:4000/api/*`
   - File upload support

5. **Security Headers**
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block

### Build for Apache

```bash
# Build frontend with /dap/ base path
cd /data/dap
./scripts/build-for-apache.sh

# This sets:
# - VITE_BASE_PATH=/dap/
# - VITE_GRAPHQL_ENDPOINT=/dap/graphql
# - VITE_API_ENDPOINT=/dap/api
# - Builds to frontend/dist/
```

### Restart Apache

```bash
sudo systemctl restart httpd
```

---

## Environment Configuration

### Development Backend (.env)

```env
NODE_ENV=development
PORT=4000
HOST=127.0.0.1
DATABASE_URL=postgresql://postgres:password@localhost:5432/dap?schema=public
TRUST_PROXY=true
ALLOWED_ORIGINS=http://myapps.cxsaaslab.com,http://myapps.rajarora.csslab,http://centos1.rajarora.csslab,https://myapps-8321890.ztna.sse.cisco.io,http://172.22.156.32
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=24h
```

### Production Backend (.env)

```env
NODE_ENV=production
PORT=4000
HOST=127.0.0.1
DATABASE_URL=postgresql://dap:dap_prod_secure_2024!@localhost:5432/dap?schema=public
TRUST_PROXY=true
ALLOWED_ORIGINS=http://prod.rajarora.csslab,http://172.22.156.33,http://centos2.rajarora.csslab
JWT_SECRET=<secure-random-secret-here>
JWT_EXPIRES_IN=24h
```

### Frontend Build Configuration

**Development (Apache):**
```bash
VITE_BASE_PATH=/dap/ npm run build
```

**Production (PM2/Nginx):**
```bash
VITE_BASE_PATH=/dap/ npm run build
```

---

## Health Checks & Verification

### Development

```bash
# Backend health
curl http://localhost:4000/health

# GraphQL endpoint
curl -X POST http://localhost/dap/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# Frontend
curl http://localhost/dap/

# Apache status
sudo systemctl status httpd
```

### Production

```bash
# Quick health check
/data/dap/deploy/scripts/prod.sh health

# Manual checks
ssh rajarora@172.22.156.33

# Backend
curl http://localhost:4000/health

# Frontend
curl http://localhost:3000

# Via Nginx
curl http://localhost/dap/
curl http://localhost/dap/graphql

# PM2 status
sudo -u dap pm2 status
```

### Expected Results

| Endpoint | Expected | HTTP Code |
|----------|----------|-----------|
| Backend /health | JSON response | 200 |
| GraphQL | "errors" (needs POST body) | 400 |
| Frontend / | HTML | 200 |
| Frontend /dap/ | HTML | 200 |

---

## Troubleshooting

### Development Issues

#### 1. Frontend 404 Errors

**Problem:** Assets not loading, 404 errors

**Solution:**
```bash
# Rebuild with correct base path
cd /data/dap
./scripts/build-for-apache.sh

# Restart Apache
sudo systemctl restart httpd
```

#### 2. Backend Not Accessible

**Problem:** Cannot connect to GraphQL

**Solution:**
```bash
# Check if backend running
curl http://localhost:4000/health

# If not running
cd /data/dap/backend
npm start

# Check backend logs
tail -f /data/dap/backend.log
```

#### 3. Apache Errors

**Problem:** Apache not serving DAP

**Solution:**
```bash
# Check Apache config
sudo apachectl configtest

# Check Apache logs
sudo tail -f /var/log/httpd/dap-error.log

# Restart Apache
sudo systemctl restart httpd
```

#### 4. SELinux Issues

**Problem:** Permission denied errors

**Solution:**
```bash
# Set SELinux boolean
sudo setsebool -P httpd_can_network_connect 1

# Fix file contexts
sudo restorecon -Rv /data/dap/frontend/dist

# Check SELinux denials
sudo ausearch -m avc -ts recent
```

### Production Issues

#### 1. Application Not Starting

**Problem:** PM2 processes not online

**Solution:**
```bash
ssh rajarora@172.22.156.33

# Check PM2 status
sudo -u dap pm2 status

# View logs
sudo -u dap pm2 logs

# Restart
sudo -u dap pm2 restart all

# If still failing, check database
sudo systemctl status postgresql-16
```

#### 2. Database Connection Errors

**Problem:** Backend cannot connect to database

**Solution:**
```bash
# Check PostgreSQL running
sudo systemctl status postgresql-16

# Test connection
sudo -u dap psql -U dap -h localhost -d dap -c "SELECT version();"

# Check DATABASE_URL in .env
cat /data/dap/app/backend/.env

# Restart backend
sudo -u dap pm2 restart dap-backend
```

#### 3. Nginx 502 Bad Gateway

**Problem:** Nginx cannot reach backend

**Solution:**
```bash
# Check backend running
curl http://localhost:4000/health

# Check PM2
sudo -u dap pm2 status

# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. Slow Performance

**Problem:** Application running slowly

**Solution:**
```bash
# Check system resources
htop

# Check PM2 memory
sudo -u dap pm2 monit

# Check database
sudo -u dap psql -U dap -h localhost -d dap -c "SELECT count(*) FROM pg_stat_activity;"

# Vacuum database
sudo -u dap psql -U dap -h localhost -d dap -c "VACUUM ANALYZE;"
```

---

## Rollback Procedures

### Production Rollback

#### Automatic Rollback

```bash
# Rollback to previous deployment
/data/dap/deploy/scripts/release.sh rollback
```

#### Manual Rollback

```bash
ssh rajarora@172.22.156.33

# Find backup
ls -lt /data/dap/backups/deploy_* | head -1

# Stop application
sudo -u dap pm2 stop all

# Restore backup (example timestamp)
sudo cp -r /data/dap/backups/deploy_20251130_190220/* /data/dap/app/

# Restart
sudo -u dap pm2 restart all

# Verify
sudo -u dap pm2 status
curl http://localhost/dap/
```

### Database Rollback

```bash
# Restore database backup
ssh rajarora@172.22.156.33

# List backups
ls -lh /data/dap/backups/*.sql.gz

# Restore (example)
gunzip -c /data/dap/backups/dap_20251130.sql.gz | \
  sudo -u dap psql -U dap -h localhost -d dap

# Restart backend
sudo -u dap pm2 restart dap-backend
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All code committed and tested
- [ ] Database migrations tested
- [ ] Build succeeds locally
- [ ] Environment variables configured
- [ ] Backup plan in place

### During Deployment

- [ ] Backup created automatically
- [ ] Old services stopped
- [ ] Files transferred successfully
- [ ] Dependencies installed
- [ ] Database migrations applied
- [ ] Services started
- [ ] Health checks pass

### Post-Deployment

- [ ] Verify application accessible
- [ ] Test login functionality
- [ ] Check GraphQL API
- [ ] Verify database connectivity
- [ ] Monitor logs for errors
- [ ] Update documentation
- [ ] Notify stakeholders

---

## Quick Reference

### Development URLs

- Frontend: http://myapps.cxsaaslab.com/dap/
- Backend: http://localhost:4000/graphql
- Database: localhost:5432

### Production URLs

- Application: http://prod.rajarora.csslab/dap/
- Alternative: http://172.22.156.33/dap/

### Key Commands

```bash
# Development
./scripts/build-for-apache.sh       # Build frontend
sudo systemctl restart httpd        # Restart Apache
cd backend && npm start              # Start backend

# Production
/data/dap/deploy/scripts/deploy-app.sh  # Deploy
/data/dap/deploy/scripts/prod.sh status # Status
/data/dap/deploy/scripts/prod.sh logs   # Logs
/data/dap/deploy/scripts/prod.sh restart # Restart
```

### Important Files

```
Development:
/etc/httpd/conf.d/dap.conf          # Apache config
/data/dap/frontend/dist/            # Built frontend
/data/dap/backend/.env              # Backend environment

Production:
/etc/nginx/conf.d/dap.conf          # Nginx config
/data/dap/app/ecosystem.config.js   # PM2 config
/data/dap/app/backend/.env          # Backend environment
/data/dap/logs/                     # Application logs
/data/dap/backups/                  # Backup files
```

---

## Support

For deployment issues:

1. **Check Logs:** Application and system logs
2. **Run Health Checks:** Verify all components
3. **Review This Guide:** Follow troubleshooting steps
4. **Check CONTEXT.md:** For application details

---

**Last Updated:** November 30, 2025  
**Version:** 2.1.0

*This guide covers all deployment scenarios for the DAP application.*


