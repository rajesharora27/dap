# DAP Application - Deployment Status

## ✅ DEPLOYMENT COMPLETE

Date: November 13, 2025  
Configuration: Apache at `/dap/` subpath with ZTNA proxy SSL termination

---

## 🌐 Accessible URLs

### Primary Access (ZTNA Proxy with SSL)

Users should access the application via these URLs:

✅ **https://myapps.cxsaaslab.com/dap/**  
   - CNAME to ZTNA proxy
   - SSL handled by ZTNA proxy
   - **Recommended for external users**

✅ **https://myapps-8321890.ztna.sse.cisco.io/dap/**  
   - Direct ZTNA proxy URL
   - SSL handled by ZTNA proxy

### Direct Access (HTTP - Internal/Testing)

✅ **http://myapps.rajarora.csslab/dap/**  
✅ **http://centos1.rajarora.csslab/dap/**  
✅ **http://172.22.156.32/dap/**  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  End Users (Browsers)                                   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────┐
│  ZTNA Proxy                                             │
│  - myapps.cxsaaslab.com (CNAME)                        │
│  - myapps-8321890.ztna.sse.cisco.io                   │
│  - SSL/TLS Termination                                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Apache (httpd) - Port 80                               │
│  Server: centos1.rajarora.csslab (172.22.156.32)       │
│  Config: /etc/httpd/conf.d/dap.conf                     │
│                                                          │
│  Routes:                                                 │
│  • /dap/         → Static files (frontend)              │
│  • /dap/graphql  → Proxy to localhost:4000              │
│  • /dap/api/*    → Proxy to localhost:4000              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
        ↓                           ↓
┌──────────────────┐      ┌──────────────────┐
│  Frontend        │      │  Backend         │
│  Static Files    │      │  Node.js/GraphQL │
│  /data/dap/      │      │  localhost:4000  │
│  frontend/dist/  │      │                  │
└──────────────────┘      └────────┬─────────┘
                                   │
                                   ↓
                          ┌──────────────────┐
                          │  PostgreSQL      │
                          │  localhost:5432  │
                          └──────────────────┘
```

---

## 📦 What's Deployed

### 1. Apache Configuration
- **File:** `/etc/httpd/conf.d/dap.conf`
- **Status:** ✅ Active
- **Features:**
  - Multi-domain support (ServerAlias)
  - SPA routing for React app
  - GraphQL proxy with WebSocket support
  - API proxy for file uploads/downloads
  - Security headers

### 2. Frontend
- **Location:** `/data/dap/frontend/dist/`
- **Built:** ✅ Yes (with `/dap/` base path)
- **Build Command:** `npx vite build --base=/dap/`
- **Configuration:**
  - GraphQL Endpoint: `/dap/graphql` (relative)
  - API Endpoint: `/dap/api` (relative)
  - Base Path: `/dap/`

### 3. Backend
- **Status:** ✅ Running
- **Port:** 4000 (localhost only)
- **Health:** http://localhost:4000/health
- **GraphQL:** http://localhost:4000/graphql
- **Exposed via:** Apache reverse proxy only

### 4. Services Status

```bash
✅ Apache (httpd):     systemctl status httpd
✅ Backend:            curl http://localhost:4000/health
✅ Frontend:           Built at /data/dap/frontend/dist/
✅ GraphQL Proxy:      Tested and working
```

---

## 🔐 Security Configuration

### SSL/TLS
- ✅ Handled by ZTNA proxy (not Apache)
- ✅ SSL termination at proxy layer
- ✅ Apache receives HTTP traffic from proxy

### Headers
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: enabled

### CORS
- ✅ Configured in backend for all domains
- ✅ Relative URLs eliminate CORS issues

### Firewall
- Port 80: Open (for ZTNA proxy)
- Port 4000: Closed (localhost only)
- Port 5432: Closed (localhost only)

---

## 🧪 Testing & Verification

### Test from External Users

Users should access:
```
https://myapps.cxsaaslab.com/dap/
```

Expected: DAP login page loads

### Test GraphQL API

```bash
curl -X POST https://myapps.cxsaaslab.com/dap/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

Expected: `{"data":{"__typename":"Query"}}`

### Test from Server (Direct)

```bash
# Frontend
curl http://localhost/dap/

# GraphQL
curl -X POST http://localhost/dap/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

---

## 📝 Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `/etc/httpd/conf.d/dap.conf` | Apache VirtualHost config | ✅ Active |
| `/data/dap/frontend/dist/` | Built frontend files | ✅ Built |
| `/data/dap/config/apache-dap-subpath.conf` | Config template | ✅ Source |
| `/data/dap/frontend/.env.production.local` | Frontend build env | ✅ Configured |
| `/data/dap/backend/.env` | Backend environment | ✅ Configured |

---

## 🔧 Maintenance Commands

### Restart Services

```bash
# Restart Apache
sudo systemctl restart httpd

# Check Apache status
sudo systemctl status httpd

# Check backend
curl http://localhost:4000/health
```

### Rebuild Frontend

```bash
cd /data/dap/frontend
npx vite build --base=/dap/
sudo systemctl restart httpd  # Not required, but ensures clean state
```

### View Logs

```bash
# Apache logs
sudo tail -f /var/log/httpd/dap-error.log
sudo tail -f /var/log/httpd/dap-access.log

# Backend logs
tail -f /data/dap/backend/backend.log
```

### Update Configuration

```bash
# Edit Apache config
sudo nano /etc/httpd/conf.d/dap.conf

# Test configuration
sudo apachectl configtest

# Apply changes
sudo systemctl restart httpd
```

---

## 🎯 User Access Instructions

### For End Users

1. Open your web browser
2. Navigate to: **https://myapps.cxsaaslab.com/dap/**
3. You will see the DAP login page
4. Enter your credentials to access the application

### Default Login

- Username: `admin`
- Password: `DAP123` (must be changed on first login)

---

## ✅ Deployment Checklist

- [x] Apache installed and configured
- [x] Configuration file installed (`/etc/httpd/conf.d/dap.conf`)
- [x] Frontend built with `/dap/` base path
- [x] Backend running on localhost:4000
- [x] Apache proxying GraphQL and API requests
- [x] All requested domains configured (ServerAlias)
- [x] HTTP access working (tested)
- [x] ZTNA proxy SSL termination (configured)
- [x] SPA routing working
- [x] WebSocket support enabled
- [x] Security headers configured

---

## 📚 Documentation

- **Quick Start:** `APACHE_DEPLOYMENT_QUICKSTART.md`
- **Full Guide:** `docs/APACHE_SUBPATH_DEPLOYMENT.md`
- **Setup Summary:** `APACHE_SETUP_SUMMARY.md`
- **URL List:** `ACCESSIBLE_URLS.txt`
- **This File:** `DEPLOYMENT_STATUS.md`

---

## 🆘 Troubleshooting

### Issue: Page not loading

**Check:**
1. Is Apache running? `sudo systemctl status httpd`
2. Is backend running? `curl http://localhost:4000/health`
3. Check Apache logs: `sudo tail -f /var/log/httpd/dap-error.log`

### Issue: GraphQL errors

**Check:**
1. Backend health: `curl http://localhost:4000/health`
2. Test direct: `curl -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query": "{ __typename }"}'`
3. Check CORS settings in backend `.env`

### Issue: 404 errors for assets

**Solution:**
```bash
cd /data/dap/frontend
npx vite build --base=/dap/
```

### Issue: WebSocket connection failed

**Check:**
- mod_proxy_wstunnel enabled: `apachectl -M | grep proxy_wstunnel`
- WebSocket rewrite rules in config

---

## 📊 Summary

**Status:** ✅ **FULLY OPERATIONAL**

The DAP application is successfully deployed and accessible at:
- **https://myapps.cxsaaslab.com/dap/** (Primary, via ZTNA proxy)
- **https://myapps-8321890.ztna.sse.cisco.io/dap/** (ZTNA direct)
- Plus direct HTTP access via hostname and IP

All components are running correctly:
- ✅ Frontend served with correct base path
- ✅ Backend API accessible via proxy
- ✅ GraphQL endpoint working
- ✅ WebSocket support enabled
- ✅ Multi-domain access configured

**The application is ready for production use!**

---

*Last Updated: November 13, 2025*  
*Deployed By: Apache Configuration Assistant*  
*Server: centos1.rajarora.csslab (172.22.156.32)*

