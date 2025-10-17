# CNAME Access Configuration

## Overview
The DAP application can now be accessed via multiple domains:
1. **Internal Reverse Proxy**: `https://dap-8321890.ztna.sse.cisco.io`
2. **CNAME Record**: `https://dap.cxsaaslab.com`

Both domains map to the same server: `172.22.156.32:5173`

## DNS Configuration Required

### CNAME Record Setup
You need to configure your DNS with:
```
Type:  CNAME
Name:  dap.cxsaaslab.com
Value: dap-8321890.ztna.sse.cisco.io
TTL:   3600 (or your preference)
```

**OR** if your reverse proxy has a public IP/domain:
```
Type:  CNAME
Name:  dap.cxsaaslab.com
Value: <reverse-proxy-domain>
```

### Reverse Proxy Mapping
Ensure your reverse proxy handles both domains:
- `https://dap-8321890.ztna.sse.cisco.io` → `172.22.156.32:5173`
- `https://dap.cxsaaslab.com` → `172.22.156.32:5173`

## Application Configuration Changes

### 1. Vite Allowed Hosts (`frontend/vite.config.ts`)
Added both domains to prevent DNS rebinding protection:
```typescript
allowedHosts: [
  'dap-8321890.ztna.sse.cisco.io',
  'dap.cxsaaslab.com',              // CNAME record
  '172.22.156.32',
  'localhost',
  '.ztna.sse.cisco.io',             // Allow all subdomains
  '.cxsaaslab.com'                  // Allow all cxsaaslab.com subdomains
]
```

### 2. Backend CORS (`.env`)
Added CNAME to allowed origins:
```bash
ALLOWED_ORIGINS=https://dap-8321890.ztna.sse.cisco.io,https://dap.cxsaaslab.com,http://172.22.156.32:5173,http://localhost:5173
```

### 3. Frontend Environment (`frontend/.env.development`)
Updated comments to document both access methods.

## Access URLs

Once DNS is configured, users can access the application via:
- ✅ `https://dap-8321890.ztna.sse.cisco.io` (existing)
- ✅ `https://dap.cxsaaslab.com` (new CNAME)

Both URLs provide the same functionality and connect to the same backend.

## Testing

### 1. Verify DNS Resolution
```bash
# Check CNAME record
nslookup dap.cxsaaslab.com
# Should resolve to dap-8321890.ztna.sse.cisco.io or reverse proxy IP

# Check reverse proxy mapping
curl -I https://dap.cxsaaslab.com
# Should return 200 OK
```

### 2. Test Application Access
1. Open browser to `https://dap.cxsaaslab.com`
2. Application should load without errors
3. Products and tasks should display correctly
4. No "Blocked request" errors in console

### 3. Test GraphQL Connection
Open browser console and verify:
- ✅ No CORS errors
- ✅ No "Blocked request" errors
- ✅ GraphQL requests succeed
- ⚠️ WebSocket warnings (HMR) are non-critical

## Wildcard Support

The configuration includes wildcard support:
- `.cxsaaslab.com` - Any subdomain of cxsaaslab.com
- `.ztna.sse.cisco.io` - Any subdomain of ztna.sse.cisco.io

This means you can also use subdomains like:
- `dev.dap.cxsaaslab.com`
- `test.dap.cxsaaslab.com`
- `staging-dap.cxsaaslab.com`

(Assuming DNS and reverse proxy are configured for them)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ DNS Layer                                                    │
│                                                              │
│ dap.cxsaaslab.com (CNAME) → dap-8321890.ztna.sse.cisco.io  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Reverse Proxy (Cisco SSE ZTNA)                              │
│                                                              │
│ https://dap-8321890.ztna.sse.cisco.io  ┐                    │
│ https://dap.cxsaaslab.com              ├→ 172.22.156.32:5173│
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ CentOS Server (172.22.156.32)                               │
│                                                              │
│  Port 5173: Vite Dev Server (Frontend)                      │
│             ↓ (proxy /graphql)                              │
│  Port 4000: GraphQL Backend API                             │
│             ↓                                                │
│  Port 5432: PostgreSQL Database (container)                 │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### "Blocked request" Error
If you see this error with the CNAME:
1. Verify the domain is in `allowedHosts` in `vite.config.ts`
2. Restart frontend: `./dap stop frontend && ./dap start frontend`

### CORS Errors
If you see CORS errors:
1. Verify the domain is in `ALLOWED_ORIGINS` in `.env`
2. Restart backend: `./dap stop backend && ./dap start backend`

### DNS Not Resolving
1. Wait for DNS propagation (can take minutes to hours)
2. Clear DNS cache: `sudo systemd-resolve --flush-caches` (Linux)
3. Use alternate DNS: `nslookup dap.cxsaaslab.com 8.8.8.8`

### Reverse Proxy 502/503 Errors
1. Verify server is reachable: `ping 172.22.156.32`
2. Check services are running: `./dap status`
3. Verify reverse proxy configuration includes new CNAME

## Security Notes

### SSL/TLS Certificates
Ensure your reverse proxy has valid SSL certificates for:
- `dap-8321890.ztna.sse.cisco.io`
- `dap.cxsaaslab.com`

Most reverse proxies can use:
- Wildcard certificate for `*.cxsaaslab.com`
- Individual certificates for each domain
- Let's Encrypt for automatic certificate management

### Network Security
- Only port 5173 is exposed through reverse proxy
- Backend (port 4000) and database (port 5432) remain internal
- All external access goes through HTTPS via reverse proxy
- Vite's `allowedHosts` prevents DNS rebinding attacks

## Maintenance

### Adding More Domains
To add additional domains:

1. Add to `allowedHosts` in `frontend/vite.config.ts`
2. Add to `ALLOWED_ORIGINS` in `.env`
3. Configure DNS CNAME record
4. Update reverse proxy configuration
5. Restart services: `./dap stop && ./dap start`

### Removing Domains
1. Remove from `allowedHosts` in `frontend/vite.config.ts`
2. Remove from `ALLOWED_ORIGINS` in `.env`
3. Restart services: `./dap stop && ./dap start`

## Date
Configuration applied: October 16, 2025
