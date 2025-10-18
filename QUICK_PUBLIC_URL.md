# Quick Public URL Setup - Simple Steps

## What You Need
- Your public domain name (e.g., `dap.mycompany.com`)
- Server with ports 80, 443, and 4000 accessible
- SSL certificate (use Let's Encrypt for free)

## Simple 5-Step Setup

### Step 1: Update Backend Environment

Edit `/data/dap/.env.production`:

```bash
NODE_ENV=production
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
FRONTEND_URL=https://YOUR-DOMAIN.com              # ← CHANGE THIS
BACKEND_HOST=0.0.0.0
BACKEND_PORT=4000
BACKEND_URL=https://YOUR-DOMAIN.com:4000          # ← CHANGE THIS
GRAPHQL_ENDPOINT=https://YOUR-DOMAIN.com:4000/graphql  # ← CHANGE THIS
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap?schema=public
ALLOWED_ORIGINS=https://YOUR-DOMAIN.com           # ← CHANGE THIS
```

### Step 2: Update Frontend Environment

Edit `/data/dap/frontend/.env.production`:

```bash
VITE_GRAPHQL_ENDPOINT=https://YOUR-DOMAIN.com:4000/graphql  # ← CHANGE THIS
VITE_FRONTEND_URL=https://YOUR-DOMAIN.com                   # ← CHANGE THIS
```

### Step 3: Copy Config and Build

```bash
cd /data/dap

# Copy production config
cp .env.production .env

# Build backend
cd backend
npm install
npm run build
cd ..

# Build frontend  
cd frontend
npm install
npm run build
cd ..
```

### Step 4: Start Services

```bash
# Start with production environment
NODE_ENV=production ./dap start
```

### Step 5: Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4000/tcp

# Enable firewall
sudo ufw enable
```

## That's It!

Access your app at: `https://YOUR-DOMAIN.com`

## Example with Real Domain

If your domain is `dap.example.com`:

**`.env.production`:**
```bash
FRONTEND_URL=https://dap.example.com
BACKEND_URL=https://dap.example.com:4000
GRAPHQL_ENDPOINT=https://dap.example.com:4000/graphql
ALLOWED_ORIGINS=https://dap.example.com
```

**`frontend/.env.production`:**
```bash
VITE_GRAPHQL_ENDPOINT=https://dap.example.com:4000/graphql
VITE_FRONTEND_URL=https://dap.example.com
```

## Quick Find & Replace

```bash
cd /data/dap

# Replace placeholder with your domain
DOMAIN="dap.example.com"

# Update root env
sed -i "s|https://your-domain.com|https://$DOMAIN|g" .env.production
sed -i "s|https://your-public-domain.com|https://$DOMAIN|g" .env.production

# Update frontend env
sed -i "s|https://your-domain.com|https://$DOMAIN|g" frontend/.env.production

# Copy to active
cp .env.production .env
```

## Verify It Works

```bash
# Test backend
curl -X POST https://YOUR-DOMAIN.com:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query{__typename}"}'

# Should return: {"data":{"__typename":"Query"}}
```

## Troubleshooting

### Can't connect to backend?
- Check firewall: `sudo ufw status`
- Check backend is running: `tail -f backend.log`
- Test port: `curl http://localhost:4000/graphql`

### CORS errors?
- Verify ALLOWED_ORIGINS matches FRONTEND_URL exactly
- Include protocol (https://) and no trailing slash

### Mixed content warning?
- All URLs must use `https://` not `http://`
- Check both .env files

## Need SSL Certificate?

```bash
# Install certbot
sudo apt-get install certbot

# Get free SSL certificate
sudo certbot certonly --standalone -d YOUR-DOMAIN.com

# Certificates will be at:
# /etc/letsencrypt/live/YOUR-DOMAIN.com/fullchain.pem
# /etc/letsencrypt/live/YOUR-DOMAIN.com/privkey.pem
```

For more details, see [PUBLIC_URL_SETUP.md](PUBLIC_URL_SETUP.md)
