# Reverse Proxy Configuration Summary

## ✅ Application is Now Reverse Proxy Ready

The DAP application has been configured to work seamlessly behind a reverse proxy with a single exposed port.

## Key Changes Made

### 1. **Relative URL Configuration** ✅

All environments now use relative paths instead of absolute URLs:

**Before (❌ Would break with reverse proxy):**
```
VITE_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
VITE_GRAPHQL_ENDPOINT=https://api.your-domain.com/graphql
```

**After (✅ Works with reverse proxy):**
```
VITE_GRAPHQL_ENDPOINT=/graphql
```

### 2. **Vite Proxy Configuration** ✅

Development environment (`frontend/vite.config.ts`):
```typescript
proxy: {
  '/graphql': { target: 'http://localhost:4000', ... },
  '/api': { target: 'http://localhost:4000', ... }
}
```

This allows frontend (port 5173) to access backend (port 4000) through the same origin.

### 3. **Simplified Download Logic** ✅

Frontend now uses relative URLs directly:

**Before (❌ Complex origin derivation):**
```typescript
const apiConfigUrl = getApiUrl();
const parsed = new URL(apiConfigUrl, window.location.origin);
const baseOrigin = `${parsed.protocol}//${parsed.host}`;
const fileUrl = new URL(url, baseOrigin);
```

**After (✅ Simple relative path):**
```typescript
const fileUrl = url; // Already relative: /api/downloads/...
fetch(fileUrl, { credentials: 'include' });
```

### 4. **Backend Trust Proxy** ✅

Backend now trusts reverse proxy headers:
```typescript
if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

### 5. **Optional Frontend Serving** ✅

Backend can optionally serve frontend static files (single-server deployment):
```typescript
if (process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => res.sendFile('index.html'));
}
```

## Architecture

### Development (Current)
```
Browser → Vite (5173) → Proxy → Backend (4000) → Database (5432)
          ├─ /         → Static files (Vite HMR)
          ├─ /graphql  → Proxied to :4000/graphql
          └─ /api/*    → Proxied to :4000/api/*
```

### Production with Nginx (Recommended)
```
Internet → Nginx (:443) → Backend (:4000) → Database (:5432)
           ├─ /         → Frontend static files (from dist/)
           ├─ /graphql  → Proxied to :4000/graphql
           └─ /api/*    → Proxied to :4000/api/*

Exposed:   Only port 443 (HTTPS)
Hidden:    Ports 4000, 5432
```

### Production Single-Server (Alternative)
```
Internet → Nginx (:443) → Backend (:4000) → Database (:5432)
                          ├─ /         → Serves frontend from backend
                          ├─ /graphql  → GraphQL API
                          └─ /api/*    → REST API

Backend serves everything (set SERVE_FRONTEND=true)
```

## Environment Variables

### Development
```bash
# frontend/.env.development
VITE_GRAPHQL_ENDPOINT=/graphql
VITE_FRONTEND_URL=https://dap-8321890.ztna.sse.cisco.io

# backend/.env
NODE_ENV=development
PORT=4000
CORS_ORIGIN=* # Allow all in dev
```

### Production
```bash
# frontend/.env.production
VITE_GRAPHQL_ENDPOINT=/graphql
VITE_FRONTEND_URL=https://your-domain.com

# backend environment
NODE_ENV=production
PORT=4000
TRUST_PROXY=true
CORS_ORIGIN=https://your-domain.com
SERVE_FRONTEND=false  # true if backend serves frontend
```

## Testing

### Development (Already Working)
```bash
# Start services
./dap restart

# Access via:
# - http://localhost:5173 (Vite dev server)
# - https://dap-8321890.ztna.sse.cisco.io (reverse proxy)

# Test export download
# Click "Export Template" → File downloads successfully ✅
```

### Production Deployment

See `PRODUCTION_DEPLOYMENT.md` for:
- ✅ Complete nginx configuration
- ✅ Apache configuration (alternative)
- ✅ SSL/TLS setup
- ✅ PM2 process management
- ✅ systemd service configuration
- ✅ Security headers
- ✅ Monitoring setup
- ✅ Troubleshooting guide

## Benefits

### ✅ Single Port Exposure
- Only 443 (HTTPS) needs to be exposed
- Backend (4000) and database (5432) remain internal
- Improved security posture

### ✅ No CORS Issues
- All requests go through same origin
- No need for complex CORS configuration
- credentials: 'include' works seamlessly

### ✅ Flexible Deployment
- Works with nginx, Apache, Traefik, etc.
- Can run behind corporate proxies
- Supports SSL termination at proxy

### ✅ Easy Configuration
- Simple relative paths
- No hardcoded URLs
- Environment-based configuration

### ✅ Production Ready
- Trust proxy headers for real IP
- Optional static file serving
- Cache control for assets
- WebSocket support maintained

## Files Modified

1. ✅ `frontend/.env.production` - Relative GraphQL endpoint
2. ✅ `frontend/src/config/frontend.config.ts` - Relative URLs for all environments
3. ✅ `frontend/src/components/CustomerAdoptionPanelV4.tsx` - Simplified download logic
4. ✅ `frontend/vite.config.ts` - Added /api proxy
5. ✅ `backend/src/server.ts` - Trust proxy, optional frontend serving
6. ✅ `PRODUCTION_DEPLOYMENT.md` - Complete production guide
7. ✅ `REVERSE_PROXY_SUMMARY.md` - This document

## Next Steps

### For Production Deployment

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Configure Nginx** (see PRODUCTION_DEPLOYMENT.md)
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/dap
   sudo ln -s /etc/nginx/sites-available/dap /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Set Environment Variables**
   ```bash
   export NODE_ENV=production
   export TRUST_PROXY=true
   export CORS_ORIGIN=https://your-domain.com
   ```

4. **Start Backend**
   ```bash
   cd backend
   pm2 start npm --name dap-backend -- start
   ```

5. **Test**
   ```bash
   curl https://your-domain.com/health
   curl -X POST https://your-domain.com/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ __typename }"}'
   ```

## Verification

### ✅ Development Environment
- [x] Vite proxy forwards /graphql to backend
- [x] Vite proxy forwards /api/* to backend
- [x] GraphQL queries work
- [x] File downloads work (telemetry export)
- [x] No CORS errors

### 📋 Production Environment (When Deployed)
- [ ] Nginx serves frontend static files
- [ ] Nginx proxies /graphql to backend
- [ ] Nginx proxies /api/* to backend
- [ ] SSL/TLS configured
- [ ] Security headers present
- [ ] File downloads work
- [ ] WebSocket subscriptions work
- [ ] Only port 443 exposed

## Status: ✅ COMPLETE

The application is now fully configured for reverse proxy deployment with single port exposure.
