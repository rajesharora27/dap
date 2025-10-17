# WebSocket Support for Reverse Proxy

## Issue

Vite's Hot Module Replacement (HMR) uses WebSocket connections for live reload. When accessing through a reverse proxy, WebSocket connections fail:

```
WebSocket connection to 'wss://dap-8321890.ztna.sse.cisco.io/?token=...' failed
```

## Solution

Your reverse proxy needs to support WebSocket upgrade requests.

## Reverse Proxy WebSocket Configuration

### For Nginx

Add WebSocket upgrade headers to your reverse proxy configuration:

```nginx
# Frontend - with WebSocket support
location / {
    proxy_pass http://172.22.156.32:5173;
    
    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support for Vite HMR
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}

# Backend GraphQL - with WebSocket support
location /graphql {
    proxy_pass http://172.22.156.32:4000/graphql;
    
    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support for GraphQL subscriptions
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
}
```

### For Apache

Enable required modules:
```bash
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod rewrite
```

Configuration:
```apache
<VirtualHost *:443>
    ServerName dap-8321890.ztna.sse.cisco.io
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # Frontend with WebSocket
    ProxyPreserveHost On
    RewriteEngine On
    
    # WebSocket upgrade
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://172.22.156.32:5173/$1 [P,L]
    
    # Regular HTTP
    ProxyPass / http://172.22.156.32:5173/
    ProxyPassReverse / http://172.22.156.32:5173/
    
    # GraphQL API with WebSocket
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /graphql ws://172.22.156.32:4000/graphql [P,L]
    
    ProxyPass /graphql http://172.22.156.32:4000/graphql
    ProxyPassReverse /graphql http://172.22.156.32:4000/graphql
</VirtualHost>
```

### For HAProxy

```haproxy
frontend https_frontend
    bind *:443 ssl crt /path/to/cert.pem
    mode http
    
    # Detect WebSocket upgrade
    acl is_websocket hdr(Upgrade) -i WebSocket
    acl is_websocket hdr_beg(Host) -i ws
    
    # Route to backend
    use_backend dap_backend if is_websocket
    default_backend dap_backend

backend dap_backend
    mode http
    
    # WebSocket support
    option http-server-close
    option forwardfor
    
    server dap1 172.22.156.32:5173 check
```

### For Cloud/Enterprise Reverse Proxies

If you're using a cloud or enterprise reverse proxy solution (like Cisco SSE, Cloudflare, AWS ALB, etc.), look for these settings:

1. **Enable WebSocket Support**
   - Look for "WebSocket" or "Protocol Upgrade" settings
   - Enable HTTP/1.1 protocol
   - Enable "Connection Upgrade" header

2. **Timeout Settings**
   - Set WebSocket timeout to at least 60 seconds (or higher)
   - Set idle timeout appropriately

3. **Header Forwarding**
   - Ensure `Upgrade` header is forwarded
   - Ensure `Connection` header is forwarded
   - Forward `X-Forwarded-*` headers

## Key Requirements

Your reverse proxy MUST:

1. ✅ Support HTTP/1.1 protocol
2. ✅ Forward the `Upgrade: websocket` header
3. ✅ Forward the `Connection: upgrade` header
4. ✅ Not timeout WebSocket connections too quickly (60+ seconds)
5. ✅ Support both `ws://` and `wss://` protocols

## Testing WebSocket Connection

### Test 1: Check Headers
```bash
# Test that upgrade headers are passed through
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://dap-8321890.ztna.sse.cisco.io/
```

Expected: Should see `101 Switching Protocols` response

### Test 2: Browser DevTools
1. Open https://dap-8321890.ztna.sse.cisco.io in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Filter by "WS" (WebSocket)
5. Look for WebSocket connections - should show as "connected"

### Test 3: wscat Tool
```bash
# Install wscat
npm install -g wscat

# Test WebSocket connection
wscat -c wss://dap-8321890.ztna.sse.cisco.io
```

## Alternative: Disable HMR (Not Recommended)

If you can't enable WebSocket on the reverse proxy, you can disable HMR in Vite:

**Not recommended because:**
- You lose hot module replacement (live reload)
- You lose fast refresh
- Development experience is degraded

**Only use this as last resort:**

Edit `/data/dap/frontend/vite.config.ts`:
```typescript
server: {
  host: env.FRONTEND_HOST || '0.0.0.0',
  port: parseInt(env.FRONTEND_PORT || '5173'),
  strictPort: true,
  hmr: false,  // Disable HMR completely
  proxy: { ... }
}
```

## Current Status

✅ Vite configuration reverted to simple setup
✅ Backend and frontend running normally
⚠️ WebSocket support needs to be enabled on reverse proxy

## What to Configure on Reverse Proxy

Tell your reverse proxy administrator to:

1. Enable WebSocket support for `https://dap-8321890.ztna.sse.cisco.io`
2. Ensure these headers are forwarded:
   - `Upgrade: websocket`
   - `Connection: upgrade`
3. Set WebSocket timeout to at least 60 seconds
4. Ensure both HTTP and WebSocket traffic can reach:
   - `172.22.156.32:5173` (Frontend)
   - `172.22.156.32:4000` (Backend API)

## After WebSocket is Enabled

Once WebSocket support is enabled on your reverse proxy:

1. Restart DAP services:
   ```bash
   cd /data/dap
   ./dap stop
   ./dap start
   ```

2. Clear browser cache and reload:
   ```
   Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   ```

3. Check browser console - WebSocket errors should be gone

## Documentation

- **Vite HMR**: https://vitejs.dev/config/server-options.html#server-hmr
- **WebSocket Protocol**: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API

---

**Status:** ✅ Vite Config Reverted  
**Next Step:** Enable WebSocket on reverse proxy  
**Test:** https://dap-8321890.ztna.sse.cisco.io
