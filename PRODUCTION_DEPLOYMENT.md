# DAP Production Deployment Quick Start

## Server Information
- **Development (centos1)**: Current machine
- **Production (centos2)**: 172.22.156.33

## User Configuration
- **SSH User**: `rajarora` - Used for SSH connections
- **App User**: `dap` - All application processes run as this user

## Quick Commands

### 1. First-Time Server Setup (on centos2)

```bash
# From centos1, copy and run setup script:
scp /data/dap/deploy/scripts/01-setup-server.sh rajarora@172.22.156.33:/tmp/
ssh rajarora@172.22.156.33 "chmod +x /tmp/01-setup-server.sh && sudo /tmp/01-setup-server.sh"
```

This installs:
- Node.js 22
- PostgreSQL 16 (tuned for 64GB RAM)
- PM2 process manager
- Nginx reverse proxy
- Creates `dap` user for running the app
- Configures automatic backups

### 2. Deploy Application

```bash
# Full deployment (with tests)
/data/dap/deploy/scripts/release.sh deploy

# Quick deployment (skip tests)
/data/dap/deploy/scripts/release.sh quick -y
```

### 3. Check Status

```bash
/data/dap/deploy/scripts/release.sh status
```

### 4. View Logs

```bash
# Follow logs
/data/dap/deploy/scripts/release.sh logs -f

# Or directly on server
ssh rajarora@172.22.156.33 "sudo -u dap pm2 logs"
```

### 5. Restart Application

```bash
/data/dap/deploy/scripts/release.sh restart
```

### 6. Rollback

```bash
/data/dap/deploy/scripts/release.sh rollback
```

### 7. Database Backup/Restore

```bash
# Backup
/data/dap/deploy/scripts/release.sh db-backup

# Restore
/data/dap/deploy/scripts/release.sh db-restore
```

## Hardening (Optional)

```bash
scp /data/dap/deploy/scripts/02-harden-server.sh rajarora@172.22.156.33:/tmp/
ssh rajarora@172.22.156.33 "chmod +x /tmp/02-harden-server.sh && sudo /tmp/02-harden-server.sh"
```

This enables:
- SSH hardening (key-only auth)
- Fail2Ban
- Firewall hardening
- Audit logging
- Automatic security updates
- File integrity monitoring

## Access URLs (after deployment)

- **Frontend**: http://172.22.156.33
- **Backend API**: http://172.22.156.33/graphql

## Files

```
/data/dap/deploy/
├── scripts/
│   ├── 01-setup-server.sh    # Server setup
│   ├── 02-harden-server.sh   # Security hardening
│   ├── deploy-app.sh         # App deployment
│   ├── release.sh            # Main release script
│   └── sync-code.sh          # Quick code sync
├── config/
│   ├── nginx-ssl.conf        # Nginx with SSL
│   └── production.env        # Environment template
└── README.md                 # Full documentation
```

## Troubleshooting SSH

If SSH connection is being reset:
1. Check SSH service: `sudo systemctl status sshd` (from console)
2. Check SSH logs: `sudo journalctl -u sshd`
3. Restart SSH: `sudo systemctl restart sshd`
4. Check firewall: `sudo firewall-cmd --list-all`
5. Check fail2ban: `sudo fail2ban-client status sshd`

