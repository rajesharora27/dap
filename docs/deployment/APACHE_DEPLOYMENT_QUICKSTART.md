# Apache Subpath Deployment - Quick Start Guide

This guide will help you quickly deploy the DAP application at `/dap/` path using Apache web server.

## 🚀 Supported URLs

After setup, your application will be accessible at:

- `http://myapps.cxsaaslab.com/dap/`
- `http://myapps.rajarora.csslab/dap/`
- `http://centos1.rajarora.csslab/dap/`
- `https://myapps-8321890.ztna.sse.cisco.io/dap/`
- `http://172.22.156.32/dap/`

## ⚡ Quick Setup (3 Steps)

### Step 1: Configure Apache

```bash
cd /data/dap
sudo ./scripts/setup-apache-subpath.sh
```

This script will:
- Install Apache (httpd) if needed
- Enable required modules
- Install the Apache configuration
- Configure SELinux and firewall
- Create build scripts

### Step 2: Build the Frontend

```bash
cd /data/dap
./scripts/build-for-apache.sh
```

This builds the frontend with the `/dap/` base path.

### Step 3: Start the Backend

```bash
cd /data/dap/backend

# Copy the Apache environment configuration
cp /data/dap/config/backend-env-apache.txt .env

# Edit .env to set your database password and JWT secret
nano .env

# Start the backend
npm start
```

**That's it!** Your application should now be accessible at all the URLs listed above.

## 🔧 Manual Configuration (Alternative)

If you prefer manual setup or the script doesn't work:

### 1. Install Apache and Modules

**RHEL/CentOS/Rocky:**
```bash
sudo dnf install -y httpd mod_ssl
sudo systemctl enable httpd
```

### 2. Install Configuration

```bash
sudo cp /data/dap/config/apache-dap-subpath.conf /etc/httpd/conf.d/dap.conf
```

### 3. Configure SELinux

```bash
sudo setsebool -P httpd_can_network_connect 1
sudo semanage fcontext -a -t httpd_sys_content_t "/data/dap/frontend/dist(/.*)?"
sudo restorecon -Rv /data/dap/frontend/dist
```

### 4. Configure Firewall

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 5. Test and Start Apache

```bash
sudo apachectl configtest
sudo systemctl restart httpd
```

### 6. Build Frontend

```bash
cd /data/dap/frontend
npm install
npm run build -- --base=/dap/
```

### 7. Configure and Start Backend

```bash
cd /data/dap/backend

# Create .env file with configuration
cat > .env << 'EOF'
NODE_ENV=production
PORT=4000
HOST=127.0.0.1
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/dap?schema=public
TRUST_PROXY=true
ALLOWED_ORIGINS=http://myapps.cxsaaslab.com,http://myapps.rajarora.csslab,http://centos1.rajarora.csslab,https://myapps-8321890.ztna.sse.cisco.io,http://172.22.156.32
JWT_SECRET=your-secure-random-secret-here
JWT_EXPIRES_IN=24h
EOF

# Start backend
npm install
npm start
```

## ✅ Verification

### 1. Check Services

```bash
# Check Apache
sudo systemctl status httpd

# Check backend
curl http://localhost:4000/health
# Should return: {"status":"ok","uptime":...}
```

### 2. Test GraphQL API

```bash
curl -X POST http://myapps.cxsaaslab.com/dap/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

### 3. Access Frontend

Open your browser and navigate to:
```
http://myapps.cxsaaslab.com/dap/
```

You should see the DAP login page.

## 📊 Architecture

```
┌──────────────────────────────────────────────────┐
│  Apache (httpd) - Ports 80/443                   │
│  myapps.cxsaaslab.com                            │
│  centos1.rajarora.csslab                         │
│  myapps-8321890.ztna.sse.cisco.io               │
│  172.22.156.32                                   │
└─────────────────┬────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
   /dap/ path           /dap/graphql, /dap/api
   (Frontend)           (Proxy to Backend)
        │                    │
        │                    ▼
        │              localhost:4000
        │              (Node.js Backend)
        │                    │
        ▼                    ▼
   /data/dap/         PostgreSQL
   frontend/dist/     localhost:5432
```

## 🔍 Troubleshooting

### Problem: 404 Not Found

**Cause:** Frontend not built or wrong location.

**Solution:**
```bash
cd /data/dap
./scripts/build-for-apache.sh
sudo systemctl restart httpd
```

### Problem: 502 Bad Gateway

**Cause:** Backend not running.

**Solution:**
```bash
cd /data/dap/backend
npm start
```

### Problem: Permission Denied

**Cause:** SELinux blocking access.

**Solution:**
```bash
sudo setsebool -P httpd_can_network_connect 1
sudo restorecon -Rv /data/dap/frontend/dist
sudo systemctl restart httpd
```

### Problem: CORS Error in Browser

**Cause:** Backend CORS not configured for your domain.

**Solution:**
Check `backend/.env` has all domains in `ALLOWED_ORIGINS`:
```bash
cd /data/dap/backend
grep ALLOWED_ORIGINS .env
```

Should include all domains listed at the top of this guide.

### Problem: WebSocket Connection Failed

**Cause:** `mod_proxy_wstunnel` not enabled.

**Solution:**
```bash
# Check if module is loaded
apachectl -M | grep proxy_wstunnel

# If not found, it might need to be enabled in main config
# Edit /etc/httpd/conf.modules.d/00-proxy.conf
```

## 📝 Logs

### Apache Logs

```bash
# Error log
sudo tail -f /var/log/httpd/dap-error.log

# Access log
sudo tail -f /var/log/httpd/dap-access.log

# SSL logs
sudo tail -f /var/log/httpd/dap-ssl-error.log
```

### Backend Logs

```bash
cd /data/dap/backend
tail -f backend.log
```

## 🔐 Production Considerations

### 1. Use HTTPS

For HTTPS/SSL setup with Let's Encrypt:
```bash
sudo dnf install -y certbot python3-certbot-apache
sudo certbot --apache -d myapps.cxsaaslab.com
```

### 2. Run Backend as Service

Create `/etc/systemd/system/dap-backend.service`:
```ini
[Unit]
Description=DAP Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=dap
WorkingDirectory=/data/dap/backend
Environment=NODE_ENV=production
EnvironmentFile=/data/dap/backend/.env
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
```

### 3. Secure Configuration

- Change `JWT_SECRET` in backend `.env`
- Use strong database password
- Keep software updated
- Enable firewall (only ports 80/443)
- Monitor logs regularly

## 📚 Additional Documentation

For detailed information, see:
- **Full Guide:** [docs/APACHE_SUBPATH_DEPLOYMENT.md](docs/APACHE_SUBPATH_DEPLOYMENT.md)
- **Apache Config:** [config/apache-dap-subpath.conf](config/apache-dap-subpath.conf)
- **Backend Config:** [config/backend-env-apache.txt](config/backend-env-apache.txt)

## 🆘 Getting Help

If you encounter issues:

1. Check the logs (see Logs section above)
2. Verify all services are running
3. Test backend directly: `curl http://localhost:4000/health`
4. Check Apache config: `sudo apachectl configtest`
5. Review SELinux: `sudo ausearch -m avc -ts recent`

## 🎯 Quick Commands Reference

```bash
# Restart Apache
sudo systemctl restart httpd

# Rebuild frontend
cd /data/dap && ./scripts/build-for-apache.sh

# Restart backend
cd /data/dap/backend && npm start

# Check Apache logs
sudo tail -f /var/log/httpd/dap-error.log

# Check backend health
curl http://localhost:4000/health

# Test GraphQL
curl -X POST http://myapps.cxsaaslab.com/dap/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

---

**Ready to deploy?** Run the quick setup commands at the top of this guide!

