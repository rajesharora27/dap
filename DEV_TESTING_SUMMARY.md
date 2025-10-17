# Development Testing Setup - Summary

## ✅ Configuration Complete!

Your DAP application is now configured for development testing with external access.

## What Was Configured

### Environment Files Created:
- ✅ `.env.development` - Backend binds to `0.0.0.0`
- ✅ `frontend/.env.development` - Frontend configured for `dap.temp.io`

### Network Configuration:
- ✅ Frontend listens on: `0.0.0.0:5173` (accessible externally)
- ✅ Backend listens on: `0.0.0.0:4000` (accessible externally)
- ✅ Firewall allows ports 5173 and 4000

### URL Mapping:
- ✅ `http://dap.temp.io:5173` → Frontend
- ✅ `http://dap.temp.io:4000/graphql` → Backend API
- ✅ CORS configured for `dap.temp.io`

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

## Verify It's Working

### On Server (172.22.156.32):
```bash
# Check services are listening on all interfaces
sudo netstat -tlnp | grep :5173
# Should show: 0.0.0.0:5173

sudo netstat -tlnp | grep :4000
# Should show: 0.0.0.0:4000
```

### From Any Machine (after hosts file update):
```bash
# Test connectivity
ping dap.temp.io
# Should resolve to 172.22.156.32

# Test frontend
curl http://dap.temp.io:5173
# Should return HTML

# Test backend
curl -X POST http://dap.temp.io:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__typename}"}'
# Should return: {"data":{"__typename":"Query"}}
```

## Access URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://dap.temp.io:5173 |
| **GraphQL API** | http://dap.temp.io:4000/graphql |
| **By IP (Frontend)** | http://172.22.156.32:5173 |
| **By IP (Backend)** | http://172.22.156.32:4000/graphql |

## For Your Testers

Send them the **[TESTER_INSTRUCTIONS.md](TESTER_INSTRUCTIONS.md)** file with simple steps:

1. Add `172.22.156.32    dap.temp.io` to their hosts file
2. Open browser to `http://dap.temp.io:5173`
3. Start testing!

## Current Configuration

```bash
# Server IP
172.22.156.32

# Domain mapping
dap.temp.io → 172.22.156.32

# Ports exposed
5173 (Frontend)
4000 (Backend API)

# Protocol
HTTP (not HTTPS)
```

## Quick Commands

```bash
# Start services
./dap start

# Stop services
./dap stop

# Check status
./dap status

# View logs
tail -f backend.log
tail -f frontend.log

# Check what's listening
sudo netstat -tlnp | grep -E ":(5173|4000)"
```

## Troubleshooting

### Services Not Accessible from Remote Machine

**Check 1: Services listening on 0.0.0.0**
```bash
sudo netstat -tlnp | grep :5173
# Must show: 0.0.0.0:5173 (not 127.0.0.1)
```

**Check 2: Firewall allows connections**
```bash
sudo ufw status
# Should show: 5173/tcp ALLOW, 4000/tcp ALLOW
```

**Check 3: Client has correct hosts entry**
```bash
# On client machine
cat /etc/hosts | grep dap.temp.io
# Should show: 172.22.156.32    dap.temp.io
```

### CORS Errors

Already configured in `.env.development`:
```bash
ALLOWED_ORIGINS=http://dap.temp.io:5173,http://172.22.156.32:5173,http://localhost:5173
```

If you need to add more origins:
```bash
nano .env.development
# Add to ALLOWED_ORIGINS (comma-separated)
```

## Files Created/Modified

```
/data/dap/
├── .env.development               (created/updated)
├── frontend/.env.development      (created/updated)
├── setup-dev-testing.sh          (created)
├── DEV_TESTING_SETUP.md          (created)
├── TESTER_INSTRUCTIONS.md        (created)
└── DEV_TESTING_SUMMARY.md        (this file)
```

## Security Notes

⚠️ **For Development/Testing Only!**

This setup:
- Uses HTTP (not encrypted)
- Exposes services on all interfaces
- Allows external connections

**For Production:**
- Use [SINGLE_PORT_DEPLOYMENT.md](SINGLE_PORT_DEPLOYMENT.md)
- Use nginx reverse proxy
- Use HTTPS with SSL certificate
- Bind services to localhost only

## Next Steps

### To Start Testing Now:
1. ✅ Configuration complete
2. Start services: `./dap start`
3. Share [TESTER_INSTRUCTIONS.md](TESTER_INSTRUCTIONS.md) with testers
4. Monitor logs: `tail -f backend.log frontend.log`

### After Testing (For Production):
1. Run production setup: `./setup-nginx.sh your-domain.com`
2. Get SSL certificate: `sudo certbot --nginx -d your-domain.com`
3. Update to production config
4. See [SINGLE_PORT_DEPLOYMENT.md](SINGLE_PORT_DEPLOYMENT.md)

## Documentation

- **Setup Guide**: [DEV_TESTING_SETUP.md](DEV_TESTING_SETUP.md)
- **Tester Instructions**: [TESTER_INSTRUCTIONS.md](TESTER_INSTRUCTIONS.md)
- **Production Deployment**: [SINGLE_PORT_DEPLOYMENT.md](SINGLE_PORT_DEPLOYMENT.md)
- **Public URL Setup**: [PUBLIC_URL_SETUP.md](PUBLIC_URL_SETUP.md)

---

**Status:** ✅ Ready for Testing
**Server:** 172.22.156.32
**Domain:** dap.temp.io
**Ports:** 5173 (Frontend), 4000 (Backend)
**Protocol:** HTTP
**Access:** External (requires hosts file entry)
