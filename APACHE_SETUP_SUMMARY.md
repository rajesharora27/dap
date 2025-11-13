# Apache Subpath Deployment - Setup Summary

## ✅ What Has Been Configured

I've configured the DAP application to be accessible via Apache web server at the `/dap/` subpath for all the requested URLs.

### 📍 Accessible URLs

Your application will be available at:

1. `http://myapps.cxsaaslab.com/dap/`
2. `http://myapps.rajarora.csslab/dap/`
3. `http://centos1.rajarora.csslab/dap/`
4. `https://myapps-8321890.ztna.sse.cisco.io/dap/`
5. `http://172.22.156.32/dap/`

## 📁 Files Created/Modified

### 1. Apache Configuration
- **File:** `/data/dap/config/apache-dap-subpath.conf`
- **Purpose:** Apache VirtualHost configuration for all domains
- **Features:**
  - HTTP (port 80) and HTTPS (port 443) support
  - ServerAlias for all requested domains
  - Proxy configuration for GraphQL and API endpoints
  - WebSocket support for GraphQL subscriptions
  - SPA routing support
  - Security headers

### 2. Setup Script
- **File:** `/data/dap/scripts/setup-apache-subpath.sh`
- **Purpose:** Automated setup for Apache deployment
- **Executable:** ✓ Yes
- **Features:**
  - OS detection (RHEL/CentOS or Debian/Ubuntu)
  - Apache installation and configuration
  - Module enablement
  - SELinux configuration
  - Firewall configuration
  - Configuration file installation

### 3. Build Script
- **File:** `/data/dap/scripts/build-for-apache.sh`
- **Purpose:** Build frontend with `/dap/` base path
- **Executable:** ✓ Yes
- **Features:**
  - Automatic dependency installation
  - Environment configuration
  - Base path compilation
  - Success/failure reporting

### 4. Configuration References
- **File:** `/data/dap/config/backend-env-apache.txt`
- **Purpose:** Backend environment variables reference
- **Contains:** CORS origins, database URL, JWT config, etc.

### 5. Vite Configuration Update
- **File:** `/data/dap/frontend/vite.config.ts`
- **Change:** Added base path support via `VITE_BASE_PATH` environment variable
- **Impact:** Allows building frontend for any base path

### 6. Documentation
- **File:** `/data/dap/APACHE_DEPLOYMENT_QUICKSTART.md`
- **Purpose:** Quick start guide with step-by-step instructions
- **File:** `/data/dap/docs/APACHE_SUBPATH_DEPLOYMENT.md`
- **Purpose:** Comprehensive deployment guide with troubleshooting

## 🚀 Deployment Steps

### Option 1: Automated Setup (Recommended)

```bash
# Step 1: Run setup script
cd /data/dap
sudo ./scripts/setup-apache-subpath.sh

# Step 2: Build frontend
./scripts/build-for-apache.sh

# Step 3: Configure backend
cd backend
cp /data/dap/config/backend-env-apache.txt .env
# Edit .env to set your database password and JWT secret
nano .env

# Step 4: Start backend
npm start
```

### Option 2: Manual Setup

See detailed instructions in `/data/dap/APACHE_DEPLOYMENT_QUICKSTART.md`

## 🔍 Verification

After deployment, verify everything works:

```bash
# 1. Check Apache is running
sudo systemctl status httpd

# 2. Check backend is running
curl http://localhost:4000/health

# 3. Test GraphQL endpoint
curl -X POST http://myapps.cxsaaslab.com/dap/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# 4. Open in browser
# Navigate to: http://myapps.cxsaaslab.com/dap/
```

## 📋 Architecture Overview

```
Internet
   │
   ├── myapps.cxsaaslab.com
   ├── myapps.rajarora.csslab
   ├── centos1.rajarora.csslab
   ├── myapps-8321890.ztna.sse.cisco.io
   └── 172.22.156.32
   │
   ▼
┌──────────────────────────────┐
│ Apache (httpd)               │
│ Ports: 80 (HTTP), 443 (HTTPS)│
└──────────┬───────────────────┘
           │
           ├─ /dap/ → Frontend static files
           │           (/data/dap/frontend/dist)
           │
           ├─ /dap/graphql → Backend proxy
           │                  (localhost:4000)
           │
           └─ /dap/api/* → Backend API proxy
                           (localhost:4000)

Internal Services (not exposed):
  - Backend:  localhost:4000
  - Database: localhost:5432
```

## 🔧 Configuration Details

### Apache Configuration Features

1. **Multiple Domain Support**
   - Primary: myapps.cxsaaslab.com
   - ServerAlias for all other domains
   - IP address support: 172.22.156.32

2. **Path Mapping**
   - `/dap/` → Frontend static files
   - `/dap/graphql` → Backend GraphQL API
   - `/dap/api/*` → Backend REST API

3. **WebSocket Support**
   - GraphQL subscriptions enabled
   - Upgrade headers configured
   - Proxy rewrite rules in place

4. **Security**
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: enabled
   - HSTS for HTTPS connections

5. **SPA Routing**
   - RewriteEngine enabled
   - Client-side routing preserved
   - Fallback to index.html

### Backend Configuration

- **CORS Origins:** All requested domains configured
- **Proxy Trust:** Enabled for Apache headers
- **Endpoints:** Accessible via relative paths through Apache

### Frontend Configuration

- **Base Path:** `/dap/`
- **GraphQL Endpoint:** `/dap/graphql` (relative)
- **API Endpoint:** `/dap/api` (relative)
- **Routing:** Configured for subpath

## 🛡️ Security Considerations

### Configured

✅ Security headers (X-Frame-Options, etc.)  
✅ CORS restricted to specific origins  
✅ Proxy trust enabled  
✅ File upload limits (10MB)  
✅ SELinux support (RHEL/CentOS)  

### Recommended Next Steps

1. **SSL/TLS:** Configure HTTPS certificates
2. **JWT Secret:** Change default in backend .env
3. **Database Password:** Use strong password
4. **Firewall:** Ensure only 80/443 exposed
5. **Process Manager:** Use systemd for backend
6. **Log Rotation:** Configure for Apache and backend logs

## 📊 What Happens When You Access the App

1. User navigates to `http://myapps.cxsaaslab.com/dap/`
2. Apache receives request on port 80
3. Apache serves `/data/dap/frontend/dist/index.html`
4. Frontend loads with base path `/dap/`
5. Frontend makes GraphQL request to `/dap/graphql`
6. Apache proxies to `http://localhost:4000/graphql`
7. Backend processes and returns response
8. Frontend renders the application

## 🆘 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| 404 Not Found | Run `./scripts/build-for-apache.sh` |
| 502 Bad Gateway | Start backend: `cd backend && npm start` |
| Permission Denied | Fix SELinux: `sudo setsebool -P httpd_can_network_connect 1` |
| CORS Error | Check `ALLOWED_ORIGINS` in backend `.env` |
| WebSocket Failed | Verify `mod_proxy_wstunnel` is loaded |

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `APACHE_DEPLOYMENT_QUICKSTART.md` | Quick start guide |
| `docs/APACHE_SUBPATH_DEPLOYMENT.md` | Comprehensive guide |
| `config/apache-dap-subpath.conf` | Apache configuration |
| `config/backend-env-apache.txt` | Backend env reference |
| `scripts/setup-apache-subpath.sh` | Setup automation |
| `scripts/build-for-apache.sh` | Frontend build script |

## ✨ Key Features

✅ **Multi-Domain Support:** Single config for all requested URLs  
✅ **Subpath Deployment:** App runs at `/dap/` not root  
✅ **WebSocket Support:** GraphQL subscriptions work  
✅ **SPA Routing:** Client-side routes preserved  
✅ **Production Ready:** Security headers, CORS, proxying  
✅ **Easy Deployment:** Automated scripts provided  
✅ **Comprehensive Docs:** Multiple guides and references  

## 🎯 Next Steps

1. **Run the setup script:**
   ```bash
   sudo /data/dap/scripts/setup-apache-subpath.sh
   ```

2. **Build the frontend:**
   ```bash
   /data/dap/scripts/build-for-apache.sh
   ```

3. **Configure and start backend:**
   ```bash
   cd /data/dap/backend
   cp /data/dap/config/backend-env-apache.txt .env
   # Edit .env with your settings
   npm start
   ```

4. **Access your application:**
   - Open browser: `http://myapps.cxsaaslab.com/dap/`
   - Or any of the other configured URLs

## 📞 Support

If you encounter issues:
1. Check logs: `sudo tail -f /var/log/httpd/dap-error.log`
2. Verify backend: `curl http://localhost:4000/health`
3. Test Apache config: `sudo apachectl configtest`
4. Review documentation in `/data/dap/docs/`

---

**Status:** Configuration complete, ready for deployment  
**Date:** November 13, 2025  
**Apache Config:** `/etc/httpd/conf.d/dap.conf` (after setup)  
**Frontend Build:** Run `/data/dap/scripts/build-for-apache.sh`  
**Backend Config:** `/data/dap/backend/.env` (to be created)  

