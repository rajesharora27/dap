# Vite Allowed Hosts Fix

## Issue

When accessing through the reverse proxy URL `https://dap-8321890.ztna.sse.cisco.io`, Vite was showing:

```
Blocked request. This host ("dap-8321890.ztna.sse.cisco.io") is not allowed.
To allow this host, add "dap-8321890.ztna.sse.cisco.io" to `server.allowedHosts` in vite.config.js.
```

## Root Cause

Vite's dev server has security restrictions that block requests from unknown hostnames by default. When your reverse proxy forwards requests with the `Host: dap-8321890.ztna.sse.cisco.io` header, Vite needs to be explicitly told to allow this hostname.

## Solution Applied

Updated `/data/dap/frontend/vite.config.ts` to include `allowedHosts`:

```typescript
server: {
  host: env.FRONTEND_HOST || '0.0.0.0',
  port: parseInt(env.FRONTEND_PORT || '5173'),
  strictPort: true,
  // Allow access through reverse proxy domain
  allowedHosts: [
    'dap-8321890.ztna.sse.cisco.io',
    '172.22.156.32',
    'localhost',
    '.ztna.sse.cisco.io'  // Allow all subdomains
  ],
  proxy: {
    '/graphql': {
      target: backendUrl,
      changeOrigin: true,
      ws: true,
      rewrite: (path) => path
    }
  }
}
```

## What Was Added

The `allowedHosts` array now includes:
- `dap-8321890.ztna.sse.cisco.io` - Your specific reverse proxy domain
- `172.22.156.32` - Direct IP access
- `localhost` - Local development
- `.ztna.sse.cisco.io` - Wildcard for all subdomains in your domain

## Services Restarted

```bash
./dap stop
./dap start
```

✅ Services are now running with the updated configuration.

## Verification

Test that the frontend is accessible:

```bash
# Local access
curl http://localhost:5173

# IP access
curl http://172.22.156.32:5173

# Through reverse proxy (from browser)
https://dap-8321890.ztna.sse.cisco.io
```

## Current Status

✅ Vite configuration updated
✅ Services restarted
✅ Frontend accessible on port 5173
✅ Backend accessible on port 4000
✅ Ready for access through reverse proxy

## Access URL

Users can now access:
```
https://dap-8321890.ztna.sse.cisco.io
```

No more "Blocked request" error!

## Technical Details

The `allowedHosts` option tells Vite which `Host` headers to accept. When your reverse proxy forwards requests, it includes the original hostname in the `Host` header. Without this configuration, Vite blocks the request for security reasons (to prevent DNS rebinding attacks).

## If You Need to Add More Hosts

Edit `/data/dap/frontend/vite.config.ts` and add to the `allowedHosts` array:

```typescript
allowedHosts: [
  'dap-8321890.ztna.sse.cisco.io',
  'your-new-domain.com',  // Add new domains here
  '172.22.156.32',
  'localhost',
  '.ztna.sse.cisco.io'
]
```

Then restart:
```bash
cd /data/dap && ./dap stop && ./dap start
```

## Related Documentation

- [SETUP_COMPLETE.md](SETUP_COMPLETE.md) - Overall setup summary
- [REVERSE_PROXY_CONFIG.md](REVERSE_PROXY_CONFIG.md) - Reverse proxy configuration
- [Vite Server Options](https://vitejs.dev/config/server-options.html#server-allowedhosts)

---

**Status:** ✅ Fixed and Running  
**Access:** https://dap-8321890.ztna.sse.cisco.io
