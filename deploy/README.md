# DAP Production Deployment Guide

This directory contains all scripts and configurations needed to deploy DAP to production (centos2 - 172.22.156.33).

## Quick Start

### First-Time Setup (Run on centos2)

```bash
# 1. Copy setup script to centos2
scp /data/dap/deploy/scripts/01-setup-server.sh rajarora@172.22.156.33:/tmp/

# 2. SSH to centos2 and run setup (with sudo)
ssh rajarora@172.22.156.33
chmod +x /tmp/01-setup-server.sh
sudo /tmp/01-setup-server.sh

# 3. (Optional) Run hardening script
scp /data/dap/deploy/scripts/02-harden-server.sh rajarora@172.22.156.33:/tmp/
ssh rajarora@172.22.156.33 "chmod +x /tmp/02-harden-server.sh && sudo /tmp/02-harden-server.sh"
```

### Deploy Application (Run from centos1)

```bash
# Full deployment
/data/dap/deploy/scripts/release.sh deploy

# Quick deployment (no tests)
/data/dap/deploy/scripts/release.sh quick

# Check status
/data/dap/deploy/scripts/release.sh status
```

## Directory Structure

```
deploy/
├── scripts/
│   ├── 01-setup-server.sh    # Initial server setup (Node.js, PostgreSQL, Nginx)
│   ├── 02-harden-server.sh   # Security hardening
│   ├── deploy-app.sh         # Application deployment
│   ├── release.sh            # Main release script (use this!)
│   └── sync-code.sh          # Quick code sync for hot-fixes
├── config/
│   ├── nginx-ssl.conf        # Nginx config with SSL
│   └── production.env        # Environment variables template
└── README.md                 # This file
```

## Release Commands

| Command | Description |
|---------|-------------|
| `release.sh deploy` | Full deployment with tests |
| `release.sh quick` | Quick deploy, skip tests |
| `release.sh rollback` | Rollback to previous version |
| `release.sh status` | Check production status |
| `release.sh logs` | View production logs |
| `release.sh logs -f` | Follow production logs |
| `release.sh restart` | Restart production services |
| `release.sh db-backup` | Backup production database |
| `release.sh db-restore` | Restore database from backup |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        centos2 (Production)                      │
│                         172.22.156.33                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐                                                 │
│  │   Nginx     │ :80/:443                                        │
│  │  (Reverse   │                                                 │
│  │   Proxy)    │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                         │
│    ┌────┴────┬─────────────────────┐                             │
│    │         │                     │                             │
│    ▼         ▼                     ▼                             │
│ ┌──────┐ ┌──────────┐       ┌────────────┐                      │
│ │ /    │ │ /graphql │       │ /assets    │                      │
│ │      │ │ /api     │       │            │                      │
│ └──┬───┘ └────┬─────┘       └──────┬─────┘                      │
│    │          │                    │                             │
│    ▼          ▼                    ▼                             │
│ ┌──────────────────┐   ┌──────────────────┐                     │
│ │   Frontend       │   │   Backend        │                     │
│ │   (serve :3000)  │   │   (Node :4000)   │                     │
│ │   React SPA      │   │   GraphQL API    │                     │
│ │   PM2 managed    │   │   PM2 cluster    │                     │
│ └──────────────────┘   └────────┬─────────┘                     │
│                                 │                                │
│                                 ▼                                │
│                        ┌──────────────────┐                     │
│                        │  PostgreSQL 16   │                     │
│                        │  :5432           │                     │
│                        │  (local only)    │                     │
│                        └──────────────────┘                     │
│                                                                   │
│  Storage: /data/dap/                                             │
│  ├── app/          (Application files)                           │
│  ├── logs/         (Application logs)                            │
│  └── backups/      (Database backups)                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Server Components

### Installed by setup script:
- **Node.js 22** - JavaScript runtime
- **PM2** - Process manager with clustering
- **PostgreSQL 16** - Database (tuned for 64GB RAM)
- **Nginx** - Reverse proxy with rate limiting
- **Firewalld** - Firewall
- **dap user** - Dedicated user for running the application

### User Configuration:
- **SSH User**: `rajarora` - Used for deployment SSH connections
- **App User**: `dap` - All application processes run as this user
- Sudoers configured for seamless deployment

### Installed by hardening script:
- **Fail2Ban** - Brute force protection
- **AIDE** - File integrity monitoring
- **Auditd** - Security auditing

## Security Features

1. **SSH Hardening**
   - Key-only authentication
   - Strong ciphers only
   - Login attempt limiting

2. **Firewall**
   - Default drop policy
   - Only HTTP/HTTPS/SSH allowed
   - Rate limiting

3. **Application**
   - Rate limiting via Nginx
   - Security headers
   - Gzip compression

4. **Database**
   - Local connections only
   - Strong password
   - Daily backups

## Backup & Recovery

### Automatic Backups
- **Daily**: 2 AM, retained 7 days
- **Weekly**: Sunday, retained 4 weeks
- **Location**: `/data/dap/backups/`

### Manual Backup
```bash
/data/dap/deploy/scripts/release.sh db-backup
```

### Restore Database
```bash
/data/dap/deploy/scripts/release.sh db-restore
```

### Rollback Application
```bash
/data/dap/deploy/scripts/release.sh rollback
```

## SSL Certificate Setup

### Using Let's Encrypt (recommended)
```bash
# Install certbot
ssh rajarora@172.22.156.33 "sudo dnf install -y certbot python3-certbot-nginx"

# Get certificate (replace your-domain.com)
ssh rajarora@172.22.156.33 "sudo certbot --nginx -d your-domain.com"

# Auto-renewal is set up automatically
```

### Using Custom Certificate
```bash
# Copy certificates to centos2
scp your-cert.pem rajarora@172.22.156.33:/tmp/
scp your-key.pem rajarora@172.22.156.33:/tmp/

# Move to proper location
ssh rajarora@172.22.156.33 "sudo mv /tmp/your-cert.pem /etc/ssl/certs/"
ssh rajarora@172.22.156.33 "sudo mv /tmp/your-key.pem /etc/ssl/private/"

# Update nginx config
ssh rajarora@172.22.156.33 "sudo cp /data/dap/config/nginx-ssl.conf /etc/nginx/conf.d/dap.conf"
# Edit paths in /etc/nginx/conf.d/dap.conf
ssh rajarora@172.22.156.33 "sudo nginx -t && sudo systemctl reload nginx"
```

## Troubleshooting

### Check Application Status
```bash
ssh rajarora@172.22.156.33 "sudo -u dap pm2 status"
```

### View Logs
```bash
# All logs
ssh rajarora@172.22.156.33 "sudo -u dap pm2 logs"

# Backend only
ssh rajarora@172.22.156.33 "sudo -u dap pm2 logs dap-backend"

# Frontend only
ssh rajarora@172.22.156.33 "sudo -u dap pm2 logs dap-frontend"

# Nginx
ssh rajarora@172.22.156.33 "sudo tail -f /var/log/nginx/error.log"
```

### Restart Services
```bash
# Application
ssh rajarora@172.22.156.33 "sudo -u dap pm2 restart all"

# Nginx
ssh rajarora@172.22.156.33 "sudo systemctl restart nginx"

# PostgreSQL
ssh rajarora@172.22.156.33 "sudo systemctl restart postgresql-16"
```

### Database Connection
```bash
ssh rajarora@172.22.156.33 "sudo -u dap psql -U dap -h localhost -d dap"
```

### Check Port Usage
```bash
ssh rajarora@172.22.156.33 "ss -tlnp | grep -E '(3000|4000|5432|80|443)'"
```

## Monitoring

### PM2 Monitoring Dashboard
```bash
ssh rajarora@172.22.156.33 "sudo -u dap pm2 monit"
```

### System Resources
```bash
ssh rajarora@172.22.156.33 "htop"
```

### Database Size
```bash
ssh rajarora@172.22.156.33 "sudo -u dap psql -U dap -h localhost -d dap -c \"SELECT pg_size_pretty(pg_database_size('dap'));\""
```

## Environment Variables

See `/data/dap/deploy/config/production.env` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Change in production!
- `CORS_ORIGIN` - Set to your domain

## Maintenance

### Update Node.js
```bash
ssh rajarora@172.22.156.33 "sudo dnf update nodejs"
```

### Update PM2
```bash
ssh rajarora@172.22.156.33 "sudo npm update -g pm2"
```

### Clear PM2 Logs
```bash
ssh rajarora@172.22.156.33 "sudo -u dap pm2 flush"
```

### Vacuum Database
```bash
ssh rajarora@172.22.156.33 "sudo -u dap psql -U dap -h localhost -d dap -c 'VACUUM ANALYZE;'"
```

