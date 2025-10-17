# Development Testing Setup - Expose Port 5173

## Quick Setup for Testing (No Reverse Proxy)

This guide shows how to expose port 5173 directly for development testing without nginx.

## Your Setup
- **Internal IP**: `172.22.156.32`
- **Port**: `5173`
- **Domain Mapping**: `dap.temp.io` → `172.22.156.32:5173`

## Step 1: Update Environment Files

### `/data/dap/.env.development` (or create it)

```bash
NODE_ENV=development

# Frontend Configuration - Bind to all interfaces
FRONTEND_HOST=0.0.0.0           # ← Allow external connections
FRONTEND_PORT=5173
FRONTEND_URL=http://dap.temp.io:5173

# Backend Configuration - Bind to all interfaces
BACKEND_HOST=0.0.0.0            # ← Allow external connections
BACKEND_PORT=4000
BACKEND_URL=http://dap.temp.io:4000
GRAPHQL_ENDPOINT=http://dap.temp.io:4000/graphql

# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap?schema=public

# CORS Configuration - Allow your domain
ALLOWED_ORIGINS=http://dap.temp.io:5173,http://172.22.156.32:5173
```

### `/data/dap/frontend/.env.development`

```bash
# Frontend Environment Variables for Development
VITE_GRAPHQL_ENDPOINT=http://dap.temp.io:4000/graphql
VITE_FRONTEND_URL=http://dap.temp.io:5173
```

## Step 2: Update Vite Configuration

Edit `/data/dap/frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',        // ← Listen on all interfaces
    port: 5173,
    strictPort: true,
    cors: true,
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
})
```

## Step 3: Update Backend CORS

The backend already has CORS configuration in `/data/dap/backend/src/server.ts`. Make sure it includes your domain:

```typescript
// CORS configuration will read from ALLOWED_ORIGINS in .env.development
// No code changes needed if you updated .env.development correctly
```

## Step 4: Configure Firewall

```bash
# Allow port 5173 (Frontend)
sudo ufw allow 5173/tcp

# Allow port 4000 (Backend GraphQL)
sudo ufw allow 4000/tcp

# Check status
sudo ufw status
```

Expected output:
```
To                         Action      From
--                         ------      ----
5173/tcp                   ALLOW       Anywhere
4000/tcp                   ALLOW       Anywhere
```

## Step 5: DNS/Hosts Configuration

### Option A: Update /etc/hosts on Client Machines

On each testing machine, add to `/etc/hosts`:

```bash
# Linux/Mac: sudo nano /etc/hosts
# Windows: C:\Windows\System32\drivers\etc\hosts

172.22.156.32    dap.temp.io
```

### Option B: DNS Server Configuration

If you have a DNS server, add an A record:
```
dap.temp.io  A  172.22.156.32
```

## Step 6: Start Application

```bash
cd /data/dap

# Copy development config
cp .env.development .env

# Start services (they will bind to 0.0.0.0)
./dap start
```

Or start manually:

```bash
# Backend
cd /data/dap/backend
npm install
npm run dev
# Will listen on 0.0.0.0:4000

# Frontend (in another terminal)
cd /data/dap/frontend
npm install
npm run dev
# Will listen on 0.0.0.0:5173
```

## Step 7: Verify Setup

### From Server (172.22.156.32)

```bash
# Check services are listening on all interfaces
sudo netstat -tlnp | grep :5173
# Should show: 0.0.0.0:5173

sudo netstat -tlnp | grep :4000
# Should show: 0.0.0.0:4000
```

### From Client Machine

```bash
# Test frontend
curl http://dap.temp.io:5173
# Should return HTML

# Test backend
curl -X POST http://dap.temp.io:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__typename}"}'
# Should return: {"data":{"__typename":"Query"}}

# Open in browser
http://dap.temp.io:5173
```

## Complete Configuration Files

### `/data/dap/.env.development`
```bash
NODE_ENV=development
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
FRONTEND_URL=http://dap.temp.io:5173
BACKEND_HOST=0.0.0.0
BACKEND_PORT=4000
BACKEND_URL=http://dap.temp.io:4000
GRAPHQL_ENDPOINT=http://dap.temp.io:4000/graphql
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap?schema=public
ALLOWED_ORIGINS=http://dap.temp.io:5173,http://172.22.156.32:5173,http://localhost:5173
```

### `/data/dap/frontend/.env.development`
```bash
VITE_GRAPHQL_ENDPOINT=http://dap.temp.io:4000/graphql
VITE_FRONTEND_URL=http://dap.temp.io:5173
```

## Quick Setup Script

Create `/data/dap/setup-dev-testing.sh`:

```bash
#!/bin/bash
# Development Testing Setup - Expose Port 5173

DOMAIN="dap.temp.io"
IP="172.22.156.32"

echo "Setting up development testing environment..."

# Update .env.development
cat > /data/dap/.env.development << EOF
NODE_ENV=development
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
FRONTEND_URL=http://$DOMAIN:5173
BACKEND_HOST=0.0.0.0
BACKEND_PORT=4000
BACKEND_URL=http://$DOMAIN:4000
GRAPHQL_ENDPOINT=http://$DOMAIN:4000/graphql
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap?schema=public
ALLOWED_ORIGINS=http://$DOMAIN:5173,http://$IP:5173,http://localhost:5173
EOF

# Update frontend .env.development
cat > /data/dap/frontend/.env.development << EOF
VITE_GRAPHQL_ENDPOINT=http://$DOMAIN:4000/graphql
VITE_FRONTEND_URL=http://$DOMAIN:5173
EOF

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 5173/tcp
sudo ufw allow 4000/tcp

echo ""
echo "✅ Development testing setup complete!"
echo ""
echo "Next steps:"
echo "1. On each client machine, add to /etc/hosts:"
echo "   $IP    $DOMAIN"
echo ""
echo "2. Start DAP:"
echo "   cd /data/dap && ./dap start"
echo ""
echo "3. Access application:"
echo "   http://$DOMAIN:5173"
echo ""
echo "Services will be accessible from:"
echo "  - http://$DOMAIN:5173 (Frontend)"
echo "  - http://$DOMAIN:4000/graphql (Backend API)"
```

Save and run:
```bash
chmod +x /data/dap/setup-dev-testing.sh
./setup-dev-testing.sh
```

## Troubleshooting

### Issue: Can't Access from Remote Machine

**Check 1: Firewall**
```bash
sudo ufw status
# Should show 5173 and 4000 allowed
```

**Check 2: Services Listening**
```bash
sudo netstat -tlnp | grep :5173
# Should show: 0.0.0.0:5173 (not 127.0.0.1)
```

**Check 3: /etc/hosts on Client**
```bash
# On client machine
ping dap.temp.io
# Should resolve to 172.22.156.32
```

### Issue: CORS Errors

**Solution:**
```bash
# Add the origin to ALLOWED_ORIGINS in .env.development
ALLOWED_ORIGINS=http://dap.temp.io:5173,http://172.22.156.32:5173
```

### Issue: Connection Refused

**Check Backend:**
```bash
curl http://localhost:4000/graphql
# If this works, check firewall

curl http://172.22.156.32:4000/graphql
# If this fails, backend not binding to 0.0.0.0
```

**Check Frontend:**
```bash
curl http://localhost:5173
# If this works, check firewall

curl http://172.22.156.32:5173
# If this fails, frontend not binding to 0.0.0.0
```

### Issue: "Invalid Host Header" from Vite

**Solution:** Already configured in vite.config.ts with `host: '0.0.0.0'`

If you still see this, update Vite config:
```typescript
server: {
  host: '0.0.0.0',
  allowedHosts: ['dap.temp.io', '172.22.156.32']
}
```

## Security Notes for Testing

⚠️ **This is for development/testing only!**

- Uses HTTP (not HTTPS)
- Services exposed on all interfaces
- For production, use the nginx single-port setup

## Client Setup Instructions for Testers

Send this to your testers:

```
To access the DAP testing environment:

1. Add this line to your /etc/hosts file:
   
   Linux/Mac:
   sudo nano /etc/hosts
   Add: 172.22.156.32    dap.temp.io
   
   Windows:
   Open C:\Windows\System32\drivers\etc\hosts as Administrator
   Add: 172.22.156.32    dap.temp.io

2. Open your browser and go to:
   http://dap.temp.io:5173

3. The application should load!

If you have issues, contact the admin.
```

## Verification Checklist

- [ ] `.env.development` updated with `0.0.0.0` hosts
- [ ] `frontend/.env.development` updated with correct URLs
- [ ] Firewall allows ports 5173 and 4000
- [ ] Services listening on `0.0.0.0` (not `127.0.0.1`)
- [ ] Client machines have `/etc/hosts` entry
- [ ] Can access `http://dap.temp.io:5173` from client
- [ ] Can access `http://dap.temp.io:4000/graphql` from client
- [ ] No CORS errors in browser console

## Quick Commands Summary

```bash
# Setup environment
./setup-dev-testing.sh

# Start services
cd /data/dap && ./dap start

# Check services are running
sudo netstat -tlnp | grep -E ":(5173|4000)"

# Test from server
curl http://localhost:5173
curl http://localhost:4000/graphql

# Test from external (on client machine)
curl http://dap.temp.io:5173
curl http://dap.temp.io:4000/graphql
```

---

**Access URLs:**
- Frontend: `http://dap.temp.io:5173`
- GraphQL API: `http://dap.temp.io:4000/graphql`

For production deployment, see [SINGLE_PORT_DEPLOYMENT.md](SINGLE_PORT_DEPLOYMENT.md)
