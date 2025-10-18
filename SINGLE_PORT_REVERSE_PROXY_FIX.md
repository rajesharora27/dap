# Single Port Reverse Proxy - GraphQL Routing Fix

## Problem
Your reverse proxy maps **one domain to one port**:
- `https://dap-8321890.ztna.sse.cisco.io` → `172.22.156.32:5173` (Frontend only)

The application has **two services**:
- **Frontend**: Port 5173 (React/Vite dev server)
- **Backend**: Port 4000 (GraphQL API)

When the browser tried to fetch from `https://dap-8321890.ztna.sse.cisco.io/graphql`, the reverse proxy sent it to port 5173, but there's no GraphQL server there → **503 Service Unavailable**.

## Solution
Use **Vite's built-in proxy** to route GraphQL requests internally:

```
Browser Request Flow:
┌─────────────────────────────────────────────────────────────────┐
│ Browser → https://dap-8321890.ztna.sse.cisco.io/graphql         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Reverse Proxy Routes To
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 172.22.156.32:5173 (Vite Dev Server)                            │
│                                                                  │
│  Vite Proxy Configuration:                                      │
│  '/graphql' → http://localhost:4000/graphql                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Vite Proxies Internally
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ 172.22.156.32:4000 (GraphQL Backend)                            │
│                                                                  │
│  ✅ Request reaches backend successfully                         │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Changes

### 1. Vite Config (`frontend/vite.config.ts`)
Proxy configuration with **hardcoded backend URL**:
```typescript
server: {
  host: '0.0.0.0',
  port: 5173,
  allowedHosts: [
    'dap-8321890.ztna.sse.cisco.io',
    '172.22.156.32',
    'localhost',
    '.ztna.sse.cisco.io'
  ],
  proxy: {
    '/graphql': {
      target: 'http://localhost:4000',  // Backend server (hardcoded)
      changeOrigin: true,
      ws: true,  // Support WebSocket for subscriptions
      secure: false
    }
  }
}
```

**Important**: The `target` must be hardcoded to `http://localhost:4000` because the frontend environment variable `VITE_GRAPHQL_ENDPOINT` is now a relative path (`/graphql`).

### 2. Environment File (`frontend/.env.development`)
**Changed GraphQL endpoint from absolute URL to relative path:**

**Before:**
```bash
VITE_GRAPHQL_ENDPOINT=https://dap-8321890.ztna.sse.cisco.io/graphql
```

**After:**
```bash
VITE_GRAPHQL_ENDPOINT=/graphql  # Relative path → Vite proxy handles it
```

### 3. Backend CORS (`backend/.env`)
Ensure backend allows requests from the frontend:
```bash
ALLOWED_ORIGINS=https://dap-8321890.ztna.sse.cisco.io,http://localhost:5173
```

## How It Works

1. **Browser makes request**: `POST https://dap-8321890.ztna.sse.cisco.io/graphql`
2. **Reverse proxy routes**: Request goes to `172.22.156.32:5173` (Vite server)
3. **Vite sees `/graphql`**: Matches proxy rule, forwards to `localhost:4000`
4. **Backend responds**: Data flows back through Vite → Reverse Proxy → Browser

## Key Benefits

✅ **Only one port exposed** (5173) through reverse proxy
✅ **Backend stays internal** (port 4000 not exposed)
✅ **No CORS issues** (all requests appear to come from same origin)
✅ **WebSocket support** for GraphQL subscriptions
✅ **Simple configuration** - no nginx/Apache needed on server

## Testing

Access the application at: **https://dap-8321890.ztna.sse.cisco.io**

Expected behavior:
- ✅ Page loads without "Blocked request" error
- ✅ Products and tasks load successfully
- ✅ No 503 errors in browser console
- ⚠️ WebSocket warnings (HMR) may appear (non-critical)

## Troubleshooting

### Still getting 503 errors?
1. Check both services are running: `./dap status`
2. Verify backend is on port 4000: `curl http://localhost:4000/graphql`
3. Check Vite logs: `tail -20 frontend.log`

### CORS errors?
Ensure `ALLOWED_ORIGINS` in `backend/.env` includes the reverse proxy domain.

### Frontend can't reach backend?
Verify Vite proxy config in `frontend/vite.config.ts` points to correct backend URL.

## Architecture Note

This is a **development/testing setup**. For production:
- Build frontend with `npm run build`
- Serve static files with nginx/Apache
- Configure nginx to proxy `/graphql` to backend
- Use PM2 or systemd for backend process management
- See `SINGLE_PORT_DEPLOYMENT.md` for production guide

## Date
Configuration applied: October 16, 2025
