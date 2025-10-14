# Centralized SSH Tunnel Setup - Single Point of Access

## Overview

Instead of each user creating their own SSH tunnel, you can set up **one persistent SSH tunnel** on a publicly accessible machine (jump host or proxy server), and all users access the application through that machine's IP and port.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  User's Browser │────────▶│  Public/Jump     │────────▶│   DAP Server    │
│                 │         │  Host (Proxy)    │  SSH    │  172.22.156.32  │
│  http://IP:8080 │         │  SSH Tunnel      │ Tunnel  │  Ports: 4000    │
│  http://IP:8081 │         │  Ports: 8080,8081│         │         5173    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

**Benefits:**
- ✅ Users don't need SSH access
- ✅ Users don't need to create tunnels
- ✅ One configuration point
- ✅ Easy to monitor and manage
- ✅ Works from any browser (mobile, tablet, etc.)

---

## Method 1: SSH Local Port Forward (Recommended)

This is the simplest method - create an SSH tunnel that binds to all interfaces on the jump host.

### Setup on Jump Host

```bash
# Create tunnel that listens on ALL interfaces (0.0.0.0)
ssh -g -N \
    -L 0.0.0.0:8080:172.22.156.32:5173 \
    -L 0.0.0.0:8081:172.22.156.32:4000 \
    your_user@172.22.156.32

# Flags explained:
# -g        Allow remote hosts to connect to forwarded ports
# -N        Don't execute remote command (just forward ports)
# -L        Local port forward
# 0.0.0.0   Listen on all interfaces (not just localhost)
# 8080      Public port for frontend on jump host
# 8081      Public port for backend on jump host
```

### Run as Background Service

Create a systemd service for persistence:

**File: `/etc/systemd/system/dap-tunnel.service`**

```ini
[Unit]
Description=DAP Application SSH Tunnel
After=network.target

[Service]
Type=simple
User=tunnel-user
Restart=always
RestartSec=10
ExecStart=/usr/bin/ssh -g -N -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -L 0.0.0.0:8080:172.22.156.32:5173 -L 0.0.0.0:8081:172.22.156.32:4000 your_user@172.22.156.32

[Install]
WantedBy=multi-user.target
```

**Setup:**

```bash
# Create service file (as root)
sudo nano /etc/systemd/system/dap-tunnel.service

# Setup SSH key authentication (no password needed for service)
sudo -u tunnel-user ssh-keygen -t ed25519 -N "" -f /home/tunnel-user/.ssh/id_ed25519
sudo -u tunnel-user ssh-copy-id your_user@172.22.156.32

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable dap-tunnel
sudo systemctl start dap-tunnel

# Check status
sudo systemctl status dap-tunnel
```

### For Users

Users simply open their browser to:
```
http://JUMP_HOST_IP:8080
```

That's it! No SSH, no terminal, no configuration needed.

---

## Method 2: Reverse SSH Tunnel (If Jump Host Can't Initiate Connection)

If the jump host cannot SSH to the DAP server, you can create a **reverse tunnel** from the DAP server to the jump host.

### Setup from DAP Server

```bash
# From DAP server, create reverse tunnel to jump host
ssh -R 0.0.0.0:8080:localhost:5173 \
    -R 0.0.0.0:8081:localhost:4000 \
    -N user@JUMP_HOST_IP
```

**Note:** Jump host must have `GatewayPorts yes` in `/etc/ssh/sshd_config` and restart sshd.

### Systemd Service for Reverse Tunnel

**File: `/etc/systemd/system/dap-reverse-tunnel.service`** (on DAP server)

```ini
[Unit]
Description=DAP Application Reverse SSH Tunnel
After=network.target

[Service]
Type=simple
User=dap-user
Restart=always
RestartSec=10
ExecStart=/usr/bin/ssh -R 0.0.0.0:8080:localhost:5173 -R 0.0.0.0:8081:localhost:4000 -N -o ServerAliveInterval=60 -o ServerAliveCountMax=3 user@JUMP_HOST_IP

[Install]
WantedBy=multi-user.target
```

**Enable:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable dap-reverse-tunnel
sudo systemctl start dap-reverse-tunnel
```

---

## Method 3: nginx Reverse Proxy (Most Professional)

For production use, set up nginx on the jump host as a proper reverse proxy.

### Install nginx on Jump Host

```bash
sudo yum install nginx  # RHEL/CentOS
# or
sudo apt install nginx  # Ubuntu/Debian
```

### Configure nginx

**File: `/etc/nginx/conf.d/dap.conf`**

```nginx
# Frontend proxy
server {
    listen 8080;
    server_name _;

    location / {
        proxy_pass http://172.22.156.32:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend proxy
server {
    listen 8081;
    server_name _;

    location / {
        proxy_pass http://172.22.156.32:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Start nginx:**

```bash
sudo nginx -t  # Test configuration
sudo systemctl enable nginx
sudo systemctl start nginx
```

**Benefits of nginx:**
- No SSH tunnel needed (direct HTTP proxy)
- Better performance
- Can add SSL/TLS
- Better logging
- Can add authentication

---

## Firewall Configuration

### On Jump Host (Public Machine)

Allow incoming connections to the public ports:

```bash
# firewalld (RHEL/CentOS)
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=8081/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8081 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4

# ufw (Ubuntu)
sudo ufw allow 8080/tcp
sudo ufw allow 8081/tcp
```

### On DAP Server

Allow connections from jump host:

```bash
sudo firewall-cmd --permanent --add-source=JUMP_HOST_IP
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --permanent --add-port=4000/tcp
sudo firewall-cmd --reload
```

---

## Frontend Configuration Update

The frontend needs to know the public URL to reach the backend. Update the frontend to use relative URLs or configure it properly.

### Option A: Use Relative Proxy (Current Setup - Works!)

The current Vite proxy configuration already handles this. Frontend makes requests to `/graphql` which Vite proxies to backend.

When users access `http://JUMP_HOST_IP:8080`, the frontend JavaScript makes requests to `/graphql`, which goes to `http://JUMP_HOST_IP:8080/graphql`, which the browser sends to jump host, which forwards to backend.

**This already works!** But you need to update Vite config:

**File: `/data/dap/frontend/vite.config.ts`**

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: parseInt(env.FRONTEND_PORT || '5173'),
      strictPort: true,
      proxy: {
        '/graphql': {
          target: 'http://localhost:4000',  // This is on DAP server
          changeOrigin: true,
          ws: true,
        }
      }
    }
  };
});
```

**Problem:** When accessing via jump host, `/graphql` requests go to `JUMP_HOST:8080/graphql`, but backend is at `JUMP_HOST:8081`.

**Solution:** Use port 8080 for both and nginx to route:

### Better nginx Config (Single Port)

```nginx
server {
    listen 8080;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://172.22.156.32:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend GraphQL
    location /graphql {
        proxy_pass http://172.22.156.32:4000/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend Health
    location /health {
        proxy_pass http://172.22.156.32:4000/health;
        proxy_http_version 1.1;
    }
}
```

Now users only need: **http://JUMP_HOST_IP:8080**

---

## Recommended Setup for Your Scenario

### Best Approach: nginx Reverse Proxy (Single Port)

1. **On Jump Host:**
   ```bash
   # Install nginx
   sudo yum install nginx -y
   
   # Create config
   sudo tee /etc/nginx/conf.d/dap.conf <<'EOF'
   server {
       listen 8080;
       server_name _;

       location / {
           proxy_pass http://172.22.156.32:5173;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /graphql {
           proxy_pass http://172.22.156.32:4000/graphql;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   EOF
   
   # Test and start
   sudo nginx -t
   sudo systemctl enable nginx
   sudo systemctl start nginx
   
   # Open firewall
   sudo firewall-cmd --permanent --add-port=8080/tcp
   sudo firewall-cmd --reload
   ```

2. **Tell Users:**
   ```
   Open browser to: http://JUMP_HOST_IP:8080
   ```

That's it!

---

## Verification

### Check Ports are Listening

On jump host:
```bash
# For SSH tunnel:
ss -tlnp | grep -E ':(8080|8081)'

# For nginx:
sudo netstat -tlnp | grep nginx
```

### Test from Jump Host

```bash
# Test frontend
curl http://localhost:8080

# Test backend
curl http://localhost:8081/health
# or if using nginx single port:
curl http://localhost:8080/health
```

### Test from User's Machine

```bash
# Test frontend
curl http://JUMP_HOST_IP:8080

# Test backend health
curl http://JUMP_HOST_IP:8080/health
```

---

## User Instructions (Simple!)

**For End Users:**

1. Open your web browser
2. Go to: `http://JUMP_HOST_IP:8080`
3. That's it!

No SSH, no terminal, no configuration needed.

---

## Monitoring and Management

### Check SSH Tunnel Status

```bash
sudo systemctl status dap-tunnel
journalctl -u dap-tunnel -f
```

### Check nginx Status

```bash
sudo systemctl status nginx
sudo nginx -t  # Test config
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# SSH tunnel
sudo systemctl restart dap-tunnel

# nginx
sudo systemctl restart nginx
```

---

## Security Considerations

### 1. Add Basic Authentication (nginx)

```nginx
server {
    listen 8080;
    server_name _;
    
    auth_basic "DAP Application";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    location / {
        # ... proxy config
    }
}
```

Create password file:
```bash
sudo htpasswd -c /etc/nginx/.htpasswd username
```

### 2. Use HTTPS with SSL Certificate

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;
    
    location / {
        # ... proxy config
    }
}
```

### 3. IP Whitelist

```nginx
server {
    listen 8080;
    
    allow 10.0.0.0/8;
    allow 192.168.0.0/16;
    deny all;
    
    location / {
        # ... proxy config
    }
}
```

---

## Comparison of Methods

| Method | Complexity | Performance | Best For |
|--------|------------|-------------|----------|
| SSH Tunnel (-g flag) | Low | Good | Quick setup, small teams |
| Reverse SSH Tunnel | Medium | Good | DAP server initiates connection |
| nginx Reverse Proxy | Medium | Excellent | Production, many users |
| nginx + SSL | High | Excellent | Production with security |

**Recommendation:** Start with SSH tunnel for testing, move to nginx for production.

---

## Quick Start Commands

### Setup SSH Tunnel (Quick Test)
```bash
# On jump host
ssh -g -N -L 0.0.0.0:8080:172.22.156.32:5173 -L 0.0.0.0:8081:172.22.156.32:4000 user@172.22.156.32 &
```

### Setup nginx (Production)
```bash
# On jump host
sudo yum install nginx -y
sudo tee /etc/nginx/conf.d/dap.conf <<EOF
server {
    listen 8080;
    location / { proxy_pass http://172.22.156.32:5173; }
    location /graphql { proxy_pass http://172.22.156.32:4000/graphql; }
}
EOF
sudo systemctl start nginx
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --reload
```

### Tell Users
```
Open browser: http://JUMP_HOST_IP:8080
```

Done!
