# DAP Deployment Guide

## Environment Configuration

The DAP application now supports environment-based configuration for seamless deployment across different environments.

### Configuration Files

#### Backend Configuration
- `.env.development` - Development environment (localhost)
- `.env.staging` - Staging environment 
- `.env.production` - Production environment

#### Frontend Configuration
- `frontend/.env.development` - Frontend development config
- `frontend/.env.production` - Frontend production config

### Deployment Steps

#### 1. Development Environment
```bash
# Uses .env.development by default
./dap start
```

#### 2. Staging Environment
```bash
# Copy staging configuration
cp .env.staging .env

# Update frontend configuration
cp frontend/.env.staging frontend/.env.local

# Deploy with staging config
./dap start
```

#### 3. Production Environment
```bash
# Copy production configuration
cp .env.production .env

# Update frontend configuration  
cp frontend/.env.production frontend/.env.local

# Deploy with production config
./dap start
```

### Configuration Variables

#### Backend (.env files)
```bash
DATABASE_URL=postgresql://user:password@host:port/database
PORT=4000
GRAPHQL_ENDPOINT=http://host:port/graphql
NODE_ENV=production
```

#### Frontend (.env files)
```bash
VITE_GRAPHQL_ENDPOINT=http://host:port/graphql
VITE_GRAPHQL_WS_ENDPOINT=ws://host:port/graphql
```

### Key Benefits

- ✅ **No Hardcoded Addresses**: All endpoints configurable
- ✅ **Environment Isolation**: Separate configs for each environment
- ✅ **Easy Deployment**: Simple file copy for environment switching
- ✅ **Development Workflow**: Default development configuration included
- ✅ **Production Ready**: Secure configuration management

### Sample Data Management

#### Add Sample Data
```bash
./dap add-sample
```

#### Reset Sample Data (keeps real data)
```bash
./dap reset-sample
```

#### Full Clean Restart (drops all data then seeds sample set)
```bash
./dap clean-restart
```

### Verification

After deployment, verify the application:

1. **Access Frontend**: Check configured frontend URL
2. **Test GraphQL**: Verify GraphQL endpoint connectivity
3. **Database Connection**: Ensure database migrations applied
4. **Sample Data**: Use `./dap add-sample` for testing
5. **Telemetry**: Verify telemetry system functionality

### Troubleshooting

#### Configuration Issues
- Verify environment file syntax
- Check database connectivity
- Ensure all required variables are set

#### Service Issues
```bash
./dap status    # Check service status and record counts
./dap restart   # Restart all services
```

#### Database Issues
```bash
# Check database connection
docker compose exec backend npx prisma db pull

# Apply migrations
docker compose exec backend npx prisma migrate deploy

# Reset if needed (destructive)
./dap db-reset
```# Production Deployment with Reverse Proxy

This guide explains how to deploy the DAP application behind a reverse proxy with a single exposed port.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Reverse Proxy (nginx/Apache) - Port 443/80            │
│  https://your-domain.com                                 │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─→ / (root)              → Frontend Static Files (Vite build)
               ├─→ /graphql             → Backend GraphQL API (port 4000)
               ├─→ /api/*               → Backend REST API (port 4000)
               └─→ /ws                  → WebSocket (GraphQL subscriptions)
                   
Internal Services (not exposed):
  - Frontend: Static files (served by nginx or backend)
  - Backend:  Node.js/Express on port 4000
  - Database: PostgreSQL on port 5432
```

## Configuration Strategy

### Relative Paths for Reverse Proxy Compatibility

All environments use **relative paths** to ensure compatibility with reverse proxies:

- **GraphQL Endpoint**: `/graphql` (not `http://backend:4000/graphql`)
- **API Endpoints**: `/api/*` (not `http://backend:4000/api/*`)
- **File Downloads**: `/api/downloads/*`

This ensures:
1. ✅ No CORS issues (same origin)
2. ✅ Works with any reverse proxy configuration
3. ✅ Single port exposure
4. ✅ SSL termination at reverse proxy
5. ✅ Easy to change backend location without frontend changes

## Nginx Configuration

### Option 1: Nginx Serves Frontend + Proxies Backend

```nginx
# /etc/nginx/sites-available/dap

upstream dap_backend {
    server localhost:4000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend Static Files (Vite build output)
    root /var/www/dap/frontend/dist;
    index index.html;

    # Serve static frontend files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # GraphQL API
    location /graphql {
        proxy_pass http://dap_backend;
        proxy_http_version 1.1;
        
        # WebSocket support for GraphQL subscriptions
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # REST API and file downloads
    location /api/ {
        proxy_pass http://dap_backend;
        proxy_http_version 1.1;
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # For file uploads (telemetry import)
        client_max_body_size 10M;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://dap_backend;
        access_log off;
    }

    # Security: Block access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### Option 2: Backend Serves Frontend (Simpler)

If you want to keep it simple, you can have the backend serve the frontend static files:

```nginx
# /etc/nginx/sites-available/dap-simple

upstream dap_app {
    server localhost:4000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Proxy everything to backend
    location / {
        proxy_pass http://dap_app;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload size
        client_max_body_size 10M;
    }
}
```

For this option, update `backend/src/server.ts` to serve frontend static files:

```typescript
// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(process.cwd(), '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  
  // Handle client-side routing (SPA)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/graphql') || req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}
```

## Apache Configuration (Alternative)

```apache
<VirtualHost *:443>
    ServerName your-domain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # Frontend Static Files
    DocumentRoot /var/www/dap/frontend/dist
    
    <Directory /var/www/dap/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
        
        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/(graphql|api)
        RewriteRule . /index.html [L]
    </Directory>
    
    # GraphQL API
    ProxyPass /graphql http://localhost:4000/graphql
    ProxyPassReverse /graphql http://localhost:4000/graphql
    
    # REST API
    ProxyPass /api http://localhost:4000/api
    ProxyPassReverse /api http://localhost:4000/api
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:4000/$1" [P,L]
</VirtualHost>
```

## Environment Configuration

### Frontend (.env.production)

```bash
# Use relative paths for reverse proxy compatibility
VITE_GRAPHQL_ENDPOINT=/graphql
VITE_FRONTEND_URL=https://your-domain.com
```

### Backend (.env or environment variables)

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/dap
CORS_ORIGIN=https://your-domain.com
TRUST_PROXY=true
```

### Backend CORS Configuration

Update `backend/src/server.ts` to trust the reverse proxy:

```typescript
// Trust reverse proxy
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));
```

## Build and Deploy

### 1. Build Frontend

```bash
cd frontend
npm install
npm run build  # Creates frontend/dist/
```

### 2. Setup Backend

```bash
cd backend
npm install
npx prisma migrate deploy  # Run migrations
npm run build  # If using TypeScript build
```

### 3. Deploy with PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd /var/www/dap/backend
pm2 start npm --name "dap-backend" -- start

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

### 4. Deploy with systemd (Alternative)

Create `/etc/systemd/system/dap-backend.service`:

```ini
[Unit]
Description=DAP Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/dap/backend
Environment=NODE_ENV=production
Environment=PORT=4000
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable dap-backend
sudo systemctl start dap-backend
sudo systemctl status dap-backend
```

## Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] HTTPS redirect enabled
- [ ] Security headers added (HSTS, X-Frame-Options, etc.)
- [ ] File upload size limits set
- [ ] Database credentials secured (not in code)
- [ ] CORS origin restricted to your domain
- [ ] Reverse proxy headers configured
- [ ] Firewall rules: Only 80/443 exposed, block 4000/5432
- [ ] Rate limiting configured (nginx `limit_req` or backend middleware)
- [ ] Regular security updates scheduled

## Testing Production Setup

### 1. Test GraphQL Endpoint

```bash
curl -X POST https://your-domain.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

### 2. Test File Download

```bash
# Export a file through GraphQL
# Then test download URL
curl -I https://your-domain.com/api/downloads/telemetry-exports/...
```

### 3. Test Frontend

```bash
# Should return index.html
curl https://your-domain.com/

# Should return 200 for SPA routes
curl https://your-domain.com/customers
```

## Monitoring

### Logs

```bash
# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Backend logs (PM2)
pm2 logs dap-backend

# Backend logs (systemd)
journalctl -u dap-backend -f
```

### Health Checks

```bash
# Backend health
curl https://your-domain.com/health

# Should return: {"status":"ok","uptime":123,...}
```

## Troubleshooting

### Issue: 502 Bad Gateway

- Check backend is running: `curl http://localhost:4000/health`
- Check nginx upstream: `nginx -t && systemctl status nginx`
- Check logs: `tail -f /var/log/nginx/error.log`

### Issue: CORS Errors

- Verify `CORS_ORIGIN` matches your domain
- Check nginx proxy headers are set
- Ensure `credentials: true` in backend CORS config

### Issue: WebSocket Connection Failed

- Verify `Upgrade` and `Connection` headers in nginx config
- Check firewall allows WebSocket upgrades
- Test WS endpoint: `wscat -c wss://your-domain.com/graphql`

### Issue: File Downloads Fail

- Check `/api` proxy is configured in nginx
- Verify static file serving in backend
- Check file permissions in `backend/temp/telemetry-exports/`
- Test direct backend URL: `curl http://localhost:4000/api/downloads/...`

## Summary

This setup ensures:
- ✅ Single port exposure (443/80)
- ✅ All traffic through reverse proxy
- ✅ Relative URLs for frontend (no hardcoded backend URLs)
- ✅ Automatic proxying in development (Vite) and production (nginx)
- ✅ SSL termination at reverse proxy
- ✅ No CORS issues (same origin)
- ✅ WebSocket support for GraphQL subscriptions
- ✅ Static file serving with proper caching
- ✅ Security headers and rate limiting
