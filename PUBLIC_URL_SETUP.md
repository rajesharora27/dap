# Public URL Deployment Guide

## Quick Setup for Public URL

To run DAP on a public URL, you need to configure both the backend and frontend to use your public domain instead of localhost.

## Configuration Changes Required

### Option 1: Using Environment Variables (Recommended)

#### 1. Update Root `.env.production`

```bash
# Production Environment Configuration
NODE_ENV=production

# Frontend Configuration
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
FRONTEND_URL=https://your-public-domain.com

# Backend Configuration  
BACKEND_HOST=0.0.0.0
BACKEND_PORT=4000
BACKEND_URL=https://your-public-domain.com:4000
GRAPHQL_ENDPOINT=https://your-public-domain.com:4000/graphql

# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap?schema=public

# CORS Configuration (comma-separated)
ALLOWED_ORIGINS=https://your-public-domain.com
```

**Replace `your-public-domain.com` with your actual domain!**

#### 2. Update `frontend/.env.production`

```bash
# Frontend Environment Variables for Production
VITE_GRAPHQL_ENDPOINT=https://your-public-domain.com:4000/graphql
VITE_FRONTEND_URL=https://your-public-domain.com
```

#### 3. Start with Environment

```bash
# Copy production config
cp .env.production .env

# Start services
NODE_ENV=production ./dap start
```

### Option 2: Using a Reverse Proxy (Production Best Practice)

If you're using a reverse proxy (nginx/Apache), you can run both services behind it:

#### Architecture
```
Internet → [Reverse Proxy :443] → Frontend :5173
                               → Backend :4000/graphql
```

#### Example nginx Configuration

```nginx
# /etc/nginx/sites-available/dap

# Frontend
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # GraphQL API
    location /graphql {
        proxy_pass http://localhost:4000/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Update Environment Files for Reverse Proxy

**Root `.env.production`:**
```bash
NODE_ENV=production
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
FRONTEND_URL=https://your-domain.com
BACKEND_HOST=0.0.0.0
BACKEND_PORT=4000
BACKEND_URL=https://your-domain.com
GRAPHQL_ENDPOINT=https://your-domain.com/graphql
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap?schema=public
ALLOWED_ORIGINS=https://your-domain.com
```

**`frontend/.env.production`:**
```bash
VITE_GRAPHQL_ENDPOINT=https://your-domain.com/graphql
VITE_FRONTEND_URL=https://your-domain.com
```

### Option 3: Cloud Platform Deployment

#### Deploying to Cloud (AWS, Azure, GCP)

**Root `.env.production`:**
```bash
NODE_ENV=production
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=80
FRONTEND_URL=https://your-app.cloud-platform.com
BACKEND_HOST=0.0.0.0
BACKEND_PORT=4000
BACKEND_URL=https://api.your-app.cloud-platform.com
GRAPHQL_ENDPOINT=https://api.your-app.cloud-platform.com/graphql
DATABASE_URL=postgres://user:pass@your-db-instance:5432/dap?schema=public
ALLOWED_ORIGINS=https://your-app.cloud-platform.com
```

**`frontend/.env.production`:**
```bash
VITE_GRAPHQL_ENDPOINT=https://api.your-app.cloud-platform.com/graphql
VITE_FRONTEND_URL=https://your-app.cloud-platform.com
```

## Step-by-Step Deployment

### 1. Prepare Your Server

```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql docker.io

# Clone repository
cd /data
git clone <your-repo> dap
cd dap
```

### 2. Configure Environment

```bash
# Edit production environment file
nano .env.production

# Update these values:
# - FRONTEND_URL: Your public domain
# - BACKEND_URL: Your public domain + port or API subdomain
# - GRAPHQL_ENDPOINT: GraphQL endpoint URL
# - ALLOWED_ORIGINS: Your public domain
# - DATABASE_URL: Your database connection string

# Also update frontend config
nano frontend/.env.production
# - VITE_GRAPHQL_ENDPOINT: Your GraphQL endpoint
# - VITE_FRONTEND_URL: Your public domain
```

### 3. Set Up SSL/TLS (HTTPS)

#### Using Let's Encrypt (Free SSL)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### 4. Build and Start

```bash
# Copy production config to active config
cp .env.production .env

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Build for production
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# Start with production environment
NODE_ENV=production ./dap start
```

### 5. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If running backend on separate port
sudo ufw allow 4000/tcp

# Enable firewall
sudo ufw enable
```

## Docker Deployment

### Using Docker Compose with Public URL

Update `docker-compose.yml`:

```yaml
version: '3.8'

services:
  database:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: dap
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      BACKEND_HOST: 0.0.0.0
      BACKEND_PORT: 4000
      BACKEND_URL: ${BACKEND_URL}
      GRAPHQL_ENDPOINT: ${GRAPHQL_ENDPOINT}
      DATABASE_URL: ${DATABASE_URL}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    ports:
      - "4000:4000"
    depends_on:
      - database

  frontend:
    build: 
      context: ./frontend
      args:
        VITE_GRAPHQL_ENDPOINT: ${VITE_GRAPHQL_ENDPOINT}
        VITE_FRONTEND_URL: ${VITE_FRONTEND_URL}
    environment:
      NODE_ENV: production
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  postgres-data:
```

Then run:
```bash
docker-compose --env-file .env.production up -d
```

## Verification

### 1. Test Backend

```bash
# Test GraphQL endpoint
curl -X POST https://your-domain.com:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__typename}"}'

# Should return: {"data":{"__typename":"Query"}}
```

### 2. Test Frontend

```bash
# Open in browser
https://your-domain.com

# Check browser console for errors
# Verify API calls go to correct endpoint
```

### 3. Check CORS

```bash
# Test CORS headers
curl -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://your-domain.com:4000/graphql -v

# Should see Access-Control-Allow-Origin header
```

## Common Issues & Solutions

### Issue 1: CORS Errors

**Error:** `Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy`

**Solution:**
```bash
# Add your domain to ALLOWED_ORIGINS in .env.production
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Issue 2: Mixed Content Warning

**Error:** `Mixed Content: The page was loaded over HTTPS, but requested an insecure resource`

**Solution:**
- Ensure ALL URLs use `https://` not `http://`
- Check VITE_GRAPHQL_ENDPOINT uses HTTPS
- Check BACKEND_URL uses HTTPS

### Issue 3: WebSocket Connection Failed

**Error:** `WebSocket connection to 'wss://...' failed`

**Solution:**
- Configure nginx to support WebSocket upgrades (see nginx config above)
- Ensure backend supports WebSocket connections
- Check firewall allows WebSocket connections

### Issue 4: Cannot Connect to Backend

**Error:** `Failed to fetch` or `Network error`

**Solution:**
```bash
# Verify backend is running
curl https://your-domain.com:4000/graphql

# Check backend logs
tail -f backend.log

# Verify port is open
sudo netstat -tlnp | grep 4000
```

## Production Checklist

- [ ] Updated `.env.production` with public URL
- [ ] Updated `frontend/.env.production` with public URL
- [ ] SSL/TLS certificate installed
- [ ] Firewall configured
- [ ] CORS origins configured correctly
- [ ] Database secured with strong password
- [ ] Environment variables set for production
- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] GraphQL endpoint accessible
- [ ] Frontend loads without errors
- [ ] API calls work from frontend
- [ ] WebSocket connections work (if used)
- [ ] Monitoring/logging set up
- [ ] Backup strategy in place

## Security Recommendations

1. **Use HTTPS everywhere** - Never use HTTP in production
2. **Strong database password** - Use a secure random password
3. **Restrict CORS** - Only allow your specific domains
4. **Environment variables** - Never commit secrets to git
5. **Firewall rules** - Only open necessary ports
6. **Regular updates** - Keep dependencies updated
7. **Rate limiting** - Implement API rate limiting
8. **Authentication** - Use proper JWT authentication

## Quick Start Commands

```bash
# 1. Update environment files with your domain
sed -i 's/your-domain.com/actual-domain.com/g' .env.production
sed -i 's/your-domain.com/actual-domain.com/g' frontend/.env.production

# 2. Copy to active config
cp .env.production .env

# 3. Build and start
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
NODE_ENV=production ./dap start

# 4. Verify
curl https://actual-domain.com:4000/graphql
```

## Need Help?

- Check logs: `tail -f backend.log` and `tail -f frontend.log`
- Verify config: See [CONFIG_SYSTEM_GUIDE.md](CONFIG_SYSTEM_GUIDE.md)
- Deployment guide: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Architecture: See [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Version:** 1.2.0  
**Last Updated:** October 16, 2025
