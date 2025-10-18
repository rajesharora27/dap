# Configuration for Internal Reverse Proxy Setup

## Your Current Setup

**User Access:**
- External URL: `https://dap-8321890.ztna.sse.cisco.io`
- Your reverse proxy maps this to: `172.22.156.32:5173`

**Server Details:**
- Internal IP: `172.22.156.32`
- Frontend Port: `5173`
- Backend Port: `4000`
- No FQDN, only IP address

## ✅ Configuration Complete

Your environment is now configured for access via the internal reverse proxy.

### Configuration Summary

**Backend & Frontend URLs:**
```
Public URL:  https://dap-8321890.ztna.sse.cisco.io
  ↓ (Your reverse proxy)
Server:      172.22.156.32:5173 (Frontend)
             172.22.156.32:4000 (Backend API)
```

### Important Notes

1. **Your reverse proxy handles:**
   - SSL/TLS termination (HTTPS)
   - Port mapping (443 → 5173)
   - URL routing

2. **Your DAP server handles:**
   - Frontend on `0.0.0.0:5173`
   - Backend on `0.0.0.0:4000`
   - Both accessible from network

3. **API endpoint configuration:**
   - Frontend expects: `https://dap-8321890.ztna.sse.cisco.io/graphql`
   - Your reverse proxy must route `/graphql` to port 4000

## Reverse Proxy Configuration Required

Your reverse proxy needs to route two paths:

### Path 1: Frontend (Root)
```
https://dap-8321890.ztna.sse.cisco.io/
  ↓
http://172.22.156.32:5173/
```

### Path 2: GraphQL API
```
https://dap-8321890.ztna.sse.cisco.io/graphql
  ↓
http://172.22.156.32:4000/graphql
```

### Example Reverse Proxy Config

If your reverse proxy supports path-based routing, configure it like:

```nginx
# Frontend - all requests except /graphql
location / {
    proxy_pass http://172.22.156.32:5173;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Backend API - /graphql requests
location /graphql {
    proxy_pass http://172.22.156.32:4000/graphql;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Current Environment Variables

### `/data/dap/.env`
```bash
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
FRONTEND_URL=https://dap-8321890.ztna.sse.cisco.io

BACKEND_HOST=0.0.0.0
BACKEND_PORT=4000
BACKEND_URL=https://dap-8321890.ztna.sse.cisco.io
GRAPHQL_ENDPOINT=https://dap-8321890.ztna.sse.cisco.io/graphql

ALLOWED_ORIGINS=https://dap-8321890.ztna.sse.cisco.io,http://172.22.156.32:5173,http://localhost:5173
```

### `/data/dap/frontend/.env.development`
```bash
VITE_GRAPHQL_ENDPOINT=https://dap-8321890.ztna.sse.cisco.io/graphql
VITE_FRONTEND_URL=https://dap-8321890.ztna.sse.cisco.io
```

## How to Start

```bash
cd /data/dap
./dap start
```

Or manually:
```bash
# Terminal 1 - Backend
cd /data/dap/backend
npm run dev

# Terminal 2 - Frontend
cd /data/dap/frontend
npm run dev
```

## Verification Steps

### 1. Check Services are Running
```bash
# Backend should be on 0.0.0.0:4000
sudo netstat -tlnp | grep :4000
# Expected: tcp 0 0 0.0.0.0:4000 ... LISTEN

# Frontend should be on 0.0.0.0:5173
sudo netstat -tlnp | grep :5173
# Expected: tcp 0 0 0.0.0.0:5173 ... LISTEN
```

### 2. Test Direct Access (from server)
```bash
# Test backend locally
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__typename}"}'
# Expected: {"data":{"__typename":"Query"}}

# Test frontend locally
curl http://localhost:5173
# Expected: HTML response
```

### 3. Test Direct IP Access (from any machine on network)
```bash
# Test backend via IP
curl http://172.22.156.32:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__typename}"}'

# Test frontend via IP
curl http://172.22.156.32:5173
```

### 4. Test Via Reverse Proxy (final test)
```bash
# Test through your proxy URL
curl https://dap-8321890.ztna.sse.cisco.io

# Test GraphQL through proxy
curl -X POST https://dap-8321890.ztna.sse.cisco.io/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__typename}"}'
```

### 5. Browser Test
Open browser to:
```
https://dap-8321890.ztna.sse.cisco.io
```

Check browser console (F12) for any errors.

## Troubleshooting

### Issue: CORS Errors in Browser

**Error:** `Access to fetch at 'https://dap-8321890...' has been blocked by CORS`

**Check:**
```bash
# Verify ALLOWED_ORIGINS includes your proxy URL
cat .env | grep ALLOWED_ORIGINS
# Should show: ALLOWED_ORIGINS=https://dap-8321890.ztna.sse.cisco.io,...
```

**Fix:**
Restart backend after changing CORS settings:
```bash
cd /data/dap
./dap stop
./dap start
```

### Issue: GraphQL API Not Found (404)

**Problem:** Reverse proxy not routing `/graphql` to port 4000

**Check:**
```bash
# Test direct access works
curl http://172.22.156.32:4000/graphql

# If this works, reverse proxy routing issue
```

**Fix:** Update reverse proxy to route `/graphql` to `172.22.156.32:4000`

### Issue: Frontend Loads but API Calls Fail

**Check frontend config:**
```bash
cat frontend/.env.development | grep VITE_GRAPHQL_ENDPOINT
# Should show: VITE_GRAPHQL_ENDPOINT=https://dap-8321890.ztna.sse.cisco.io/graphql
```

**Rebuild frontend if changed:**
```bash
cd frontend
npm run dev
# Frontend will reload with new config
```

### Issue: "Invalid Host Header" from Vite

**Already Fixed:** Vite is configured to accept connections from any host (`host: '0.0.0.0'`)

If you still see this, the Vite config might need updating.

## Network Flow Diagram

```
User Browser
    │
    │ https://dap-8321890.ztna.sse.cisco.io/
    │
    ▼
Internal Reverse Proxy (Your Infrastructure)
    │
    ├─ Route: /            → http://172.22.156.32:5173  (Frontend)
    │
    └─ Route: /graphql     → http://172.22.156.32:4000  (Backend)
         │                        │
         ▼                        ▼
    DAP Frontend             DAP Backend
    (Vite Dev Server)        (GraphQL Server)
    0.0.0.0:5173            0.0.0.0:4000
```

## User Access Instructions

Users simply need to:
1. Open browser to: `https://dap-8321890.ztna.sse.cisco.io`
2. No hosts file changes needed (reverse proxy handles routing)
3. Application should load automatically

## Firewall Requirements

On server `172.22.156.32`:
```bash
# Allow frontend port (from reverse proxy)
sudo ufw allow from <reverse-proxy-ip> to any port 5173

# Allow backend port (from reverse proxy)
sudo ufw allow from <reverse-proxy-ip> to any port 4000

# Or if reverse proxy on same network, allow from subnet:
sudo ufw allow from 172.22.0.0/16 to any port 5173
sudo ufw allow from 172.22.0.0/16 to any port 4000
```

If your reverse proxy needs to reach these ports, make sure they're accessible.

## Summary

✅ **What's Configured:**
- Frontend URL: `https://dap-8321890.ztna.sse.cisco.io`
- GraphQL API: `https://dap-8321890.ztna.sse.cisco.io/graphql`
- CORS: Allows access from proxy URL
- Servers bind to `0.0.0.0` (network accessible)

✅ **What Users Access:**
- Single URL: `https://dap-8321890.ztna.sse.cisco.io`
- No port numbers needed
- HTTPS (secure)
- No hosts file changes needed

✅ **What Reverse Proxy Needs to Do:**
- Route `/` to `172.22.156.32:5173`
- Route `/graphql` to `172.22.156.32:4000/graphql`
- Pass through headers (X-Forwarded-For, etc.)

## Quick Start Command

```bash
# Start everything
cd /data/dap && ./dap start

# Check it's working
curl https://dap-8321890.ztna.sse.cisco.io
```

---

**Access URL:** https://dap-8321890.ztna.sse.cisco.io  
**No special client setup needed!**
