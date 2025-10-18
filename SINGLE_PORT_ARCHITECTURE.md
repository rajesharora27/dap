# Single Port Architecture - Visual Guide

## Current Setup (Multiple Ports Exposed)
```
┌─────────────────────────────────────────────┐
│              INTERNET                        │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    Port 5173              Port 4000
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   Frontend   │        │   Backend    │
│  (Vite Dev)  │        │  (GraphQL)   │
└──────────────┘        └──────────────┘

❌ Problem: Two ports exposed to internet
❌ Security risk: Backend directly accessible
❌ Need SSL for both ports
```

## Recommended Setup (Single Port with Nginx)
```
┌─────────────────────────────────────────────┐
│              INTERNET                        │
└─────────────────────────────────────────────┘
                    │
                Port 443 (HTTPS only)
                    │
                    ▼
        ┌──────────────────────┐
        │   Nginx Reverse Proxy │
        │   (SSL Termination)   │
        └──────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
  localhost:5173          localhost:4000
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   Frontend   │        │   Backend    │
│  (Vite Dev)  │        │  (GraphQL)   │
└──────────────┘        └──────────────┘

✅ Only port 443 exposed
✅ Backend not directly accessible
✅ Single SSL certificate
✅ Standard production setup
```

## Request Flow

### Frontend Request
```
User Browser
    │
    │ https://your-domain.com/
    │
    ▼
Nginx (Port 443)
    │
    │ Proxy to localhost:5173
    │
    ▼
Frontend (Vite)
    │
    │ Returns HTML/JS/CSS
    │
    ▼
User Browser
```

### API Request
```
User Browser (React App)
    │
    │ POST https://your-domain.com/graphql
    │
    ▼
Nginx (Port 443)
    │
    │ Route /graphql to localhost:4000
    │
    ▼
Backend (GraphQL Server)
    │
    │ Process query, return data
    │
    ▼
User Browser (React App)
```

## URL Mapping

### With Nginx (Recommended)
```
Public URL                           Internal Service
────────────────────────────────────────────────────────
https://your-domain.com/        →   http://localhost:5173/
https://your-domain.com/graphql →   http://localhost:4000/graphql
https://your-domain.com/health  →   nginx health check
```

### Without Nginx (Not Recommended)
```
Public URL                               Internal Service
──────────────────────────────────────────────────────────────
https://your-domain.com:5173/       →   Frontend (directly)
https://your-domain.com:4000/graphql →  Backend (directly)
```

## Port Configuration Comparison

### Development (localhost)
```yaml
Frontend:  http://localhost:5173
Backend:   http://localhost:4000/graphql
Ports:     5173, 4000 (both open on localhost)
SSL:       Not required
```

### Production - Multiple Ports (Not Recommended)
```yaml
Frontend:  https://your-domain.com:5173
Backend:   https://your-domain.com:4000/graphql
Ports:     5173, 4000 (both exposed to internet)
SSL:       Two certificates needed
```

### Production - Single Port (✅ Recommended)
```yaml
Frontend:  https://your-domain.com/
Backend:   https://your-domain.com/graphql
Ports:     443 only (exposed to internet)
           5173, 4000 (localhost only)
SSL:       One certificate for domain
```

## Environment Variables Comparison

### Multiple Ports Setup
```bash
# Backend binds to all interfaces
BACKEND_HOST=0.0.0.0              # ❌ Accessible from internet
BACKEND_PORT=4000
BACKEND_URL=https://domain.com:4000
GRAPHQL_ENDPOINT=https://domain.com:4000/graphql

# Frontend binds to all interfaces  
FRONTEND_HOST=0.0.0.0             # ❌ Accessible from internet
FRONTEND_PORT=5173
FRONTEND_URL=https://domain.com:5173
```

### Single Port with Nginx Setup (✅ Recommended)
```bash
# Backend binds to localhost only
BACKEND_HOST=127.0.0.1            # ✅ Only localhost
BACKEND_PORT=4000
BACKEND_URL=https://domain.com
GRAPHQL_ENDPOINT=https://domain.com/graphql  # No port!

# Frontend binds to localhost only
FRONTEND_HOST=127.0.0.1           # ✅ Only localhost
FRONTEND_PORT=5173
FRONTEND_URL=https://domain.com
```

## Security Comparison

### Multiple Ports Exposed
```
❌ Backend API directly accessible from internet
❌ Two ports to secure and monitor
❌ Potential for port scanning attacks
❌ More firewall rules needed
❌ Complex SSL configuration
```

### Single Port with Nginx
```
✅ Backend only accessible via nginx proxy
✅ One port to secure (443)
✅ Reduced attack surface
✅ Simple firewall rules (80, 443)
✅ Nginx handles SSL/TLS
✅ Can add rate limiting, WAF, etc.
```

## Quick Setup Commands

### Single Port Setup (3 Commands)
```bash
# 1. Run setup script
sudo ./setup-nginx.sh your-domain.com

# 2. Get SSL certificate
sudo certbot --nginx -d your-domain.com

# 3. Start app
cd /data/dap
cp .env.production .env
NODE_ENV=production ./dap start
```

### Verify Setup
```bash
# Check only port 443 is open
sudo netstat -tlnp | grep :443
# Should see nginx listening on :443

sudo netstat -tlnp | grep :4000
# Should see node listening on 127.0.0.1:4000 (not 0.0.0.0)

sudo netstat -tlnp | grep :5173
# Should see node listening on 127.0.0.1:5173 (not 0.0.0.0)

# Check firewall
sudo ufw status
# Should only show 22, 80, 443
```

## Troubleshooting Decision Tree

```
Can't access https://your-domain.com
    │
    ├─ Check: Is nginx running?
    │   └─ sudo systemctl status nginx
    │
    ├─ Check: Is SSL certificate valid?
    │   └─ sudo certbot certificates
    │
    ├─ Check: Are services running on localhost?
    │   ├─ curl http://localhost:5173
    │   └─ curl http://localhost:4000/graphql
    │
    └─ Check: Firewall allows 443?
        └─ sudo ufw status
```

## Summary Table

| Feature | Multiple Ports | Single Port + Nginx |
|---------|---------------|---------------------|
| Ports exposed | 2+ (5173, 4000) | 1 (443 only) |
| Security | Lower | Higher ✅ |
| SSL Setup | Complex | Simple ✅ |
| Production Ready | ❌ No | ✅ Yes |
| URL Format | domain:port | domain/ ✅ |
| CORS Issues | More likely | Less likely ✅ |
| Backend Access | Direct from internet ❌ | Via proxy only ✅ |

## Recommendation

**Use the Single Port + Nginx setup for production!**

See [SINGLE_PORT_DEPLOYMENT.md](SINGLE_PORT_DEPLOYMENT.md) for complete setup guide.
