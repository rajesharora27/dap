#!/bin/bash
#===============================================================================
# DAP Production Server Setup Script
# Target: CentOS Stream 9 (centos2 - 172.22.156.33)
# Purpose: Install and configure all dependencies for DAP application
#===============================================================================

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

#===============================================================================
# Configuration
#===============================================================================
DAP_USER="dap"
DAP_GROUP="dap"
DAP_HOME="/data/dap"
NODE_VERSION="22"
POSTGRES_VERSION="16"

#===============================================================================
# Pre-flight checks
#===============================================================================
log_info "Starting DAP Production Server Setup..."

if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

# Check /data partition exists
if [[ ! -d /data ]]; then
    log_error "/data partition not found. Please mount a data partition first."
    exit 1
fi

#===============================================================================
# 1. System Updates and Essential Packages
#===============================================================================
log_info "Installing essential packages..."

dnf update -y
dnf install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    iotop \
    sysstat \
    net-tools \
    bind-utils \
    lsof \
    rsync \
    tar \
    gzip \
    unzip \
    jq \
    yum-utils \
    policycoreutils-python-utils \
    cronie \
    logrotate

log_success "Essential packages installed"

#===============================================================================
# 2. Create DAP User and Group
#===============================================================================
log_info "Creating DAP user and group..."

if ! getent group ${DAP_GROUP} > /dev/null 2>&1; then
    groupadd ${DAP_GROUP}
    log_success "Created group: ${DAP_GROUP}"
else
    log_info "Group ${DAP_GROUP} already exists"
fi

if ! id ${DAP_USER} > /dev/null 2>&1; then
    # Create dap user with home directory and bash shell
    useradd -m -g ${DAP_GROUP} -d ${DAP_HOME} -s /bin/bash -c "DAP Application User" ${DAP_USER}
    log_success "Created user: ${DAP_USER}"
else
    log_info "User ${DAP_USER} already exists"
fi

# Set up directories
mkdir -p ${DAP_HOME}/{app,logs,backups,temp,scripts,.pm2}
chown -R ${DAP_USER}:${DAP_GROUP} ${DAP_HOME}
chmod 750 ${DAP_HOME}

# Add dap user to necessary groups for PostgreSQL access
usermod -aG ${DAP_GROUP} ${DAP_USER}

log_success "DAP directories created"

#===============================================================================
# 3. Install Node.js 22 (System-wide)
#===============================================================================
log_info "Installing Node.js ${NODE_VERSION}..."

# Remove old Node.js if exists
dnf remove -y nodejs npm 2>/dev/null || true

# Install Node.js 22 from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
dnf install -y nodejs

# Verify installation
NODE_VER=$(node --version)
NPM_VER=$(npm --version)
log_success "Node.js ${NODE_VER} and npm ${NPM_VER} installed"

# Install PM2 globally for process management
npm install -g pm2

# Configure PM2 for dap user
sudo -u ${DAP_USER} bash -c "cd ${DAP_HOME} && pm2 startup systemd -u ${DAP_USER} --hp ${DAP_HOME}" || true
env PATH=$PATH:/usr/bin pm2 startup systemd -u ${DAP_USER} --hp ${DAP_HOME}

log_success "PM2 installed and configured"

#===============================================================================
# 4. Install PostgreSQL 16
#===============================================================================
log_info "Installing PostgreSQL ${POSTGRES_VERSION}..."

# Install PostgreSQL repo
dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm || true

# Disable built-in PostgreSQL module
dnf -qy module disable postgresql || true

# Install PostgreSQL
dnf install -y postgresql${POSTGRES_VERSION}-server postgresql${POSTGRES_VERSION}

# Initialize database
/usr/pgsql-${POSTGRES_VERSION}/bin/postgresql-${POSTGRES_VERSION}-setup initdb

# Configure PostgreSQL for performance
PGDATA="/var/lib/pgsql/${POSTGRES_VERSION}/data"
PG_CONF="${PGDATA}/postgresql.conf"
PG_HBA="${PGDATA}/pg_hba.conf"

# Backup original configs
cp ${PG_CONF} ${PG_CONF}.original
cp ${PG_HBA} ${PG_HBA}.original

# Performance tuning (for 64GB RAM, 16 cores)
cat >> ${PG_CONF} << 'EOF'

#------------------------------------------------------------------------------
# DAP PRODUCTION SETTINGS
#------------------------------------------------------------------------------
# Memory Settings (for 64GB RAM)
shared_buffers = 16GB
effective_cache_size = 48GB
maintenance_work_mem = 2GB
work_mem = 256MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_buffers = 64MB
max_wal_size = 4GB
min_wal_size = 1GB

# Planner Settings
random_page_cost = 1.1
effective_io_concurrency = 200
default_statistics_target = 100

# Connection Settings
max_connections = 200
listen_addresses = 'localhost'

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%a.log'
log_rotation_age = 1d
log_rotation_size = 0
log_truncate_on_rotation = on
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0

# Parallel Query
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4
EOF

# Configure pg_hba.conf for local connections
cat > ${PG_HBA} << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
EOF

# Start PostgreSQL
systemctl start postgresql-${POSTGRES_VERSION}
systemctl enable postgresql-${POSTGRES_VERSION}

# Create DAP database and user
sudo -u postgres psql << 'EOF'
-- Create user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dap') THEN
        CREATE USER dap WITH PASSWORD 'dap_prod_secure_2024!';
    END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE dap OWNER dap' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dap')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dap TO dap;
\c dap
GRANT ALL ON SCHEMA public TO dap;
EOF

# Configure pg_hba.conf for password authentication
if ! grep -q "dap" ${PG_HBA}; then
    sed -i '/^host.*all.*all.*127.0.0.1/i host    dap             dap             127.0.0.1/32            scram-sha-256' ${PG_HBA}
fi

# Reload PostgreSQL to apply changes
systemctl reload postgresql-${POSTGRES_VERSION}

log_success "PostgreSQL ${POSTGRES_VERSION} installed and configured"

#===============================================================================
# 5. Configure Nginx as Reverse Proxy
#===============================================================================
log_info "Configuring Nginx..."

# Nginx should already be installed, but ensure it is
dnf install -y nginx

# Create DAP nginx config
cat > /etc/nginx/conf.d/dap.conf << 'EOF'
# DAP Application - Production Configuration
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# Upstream definitions
upstream dap_backend {
    server 127.0.0.1:4000;
    keepalive 32;
}

upstream dap_frontend {
    server 127.0.0.1:3000;
    keepalive 16;
}

# HTTP to HTTPS redirect (uncomment when SSL is configured)
# server {
#     listen 80;
#     listen [::]:80;
#     server_name _;
#     return 301 https://$host$request_uri;
# }

server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
    gzip_comp_level 6;
    
    # Connection limits
    limit_conn conn_limit 20;
    
    # Client body size (for file uploads)
    client_max_body_size 50M;
    
    # GraphQL API
    location /graphql {
        limit_req zone=api_limit burst=50 nodelay;
        
        proxy_pass http://dap_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 8k;
        proxy_buffers 8 32k;
    }
    
    # API endpoints
    location /api {
        limit_req zone=api_limit burst=30 nodelay;
        
        proxy_pass http://dap_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static assets with caching
    location /assets {
        proxy_pass http://dap_frontend;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend
    location / {
        proxy_pass http://dap_frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SPA support
        proxy_intercept_errors on;
        error_page 404 = /index.html;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Test nginx config
nginx -t

# Enable and start nginx
systemctl enable nginx
systemctl restart nginx

log_success "Nginx configured as reverse proxy"

#===============================================================================
# 6. Configure Firewall
#===============================================================================
log_info "Configuring firewall..."

# Start firewalld
systemctl start firewalld
systemctl enable firewalld

# Configure allowed services
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh

# Remove default services we don't need
firewall-cmd --permanent --remove-service=cockpit 2>/dev/null || true
firewall-cmd --permanent --remove-service=dhcpv6-client 2>/dev/null || true

# Reload firewall
firewall-cmd --reload

log_success "Firewall configured"

#===============================================================================
# 7. Configure Logging and Log Rotation
#===============================================================================
log_info "Configuring log rotation..."

cat > /etc/logrotate.d/dap << 'EOF'
/data/dap/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 dap dap
    sharedscripts
    postrotate
        /bin/kill -USR1 $(cat /data/dap/app/backend.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
EOF

log_success "Log rotation configured"

#===============================================================================
# 8. System Performance Tuning
#===============================================================================
log_info "Applying system performance tuning..."

cat > /etc/sysctl.d/99-dap-performance.conf << 'EOF'
# DAP Production Performance Tuning

# Network performance
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 40
vm.dirty_background_ratio = 10

# File descriptors
fs.file-max = 2097152
fs.nr_open = 2097152
EOF

sysctl --system

# Increase file limits for dap user
cat > /etc/security/limits.d/dap.conf << 'EOF'
dap soft nofile 65535
dap hard nofile 65535
dap soft nproc 65535
dap hard nproc 65535
EOF

log_success "System performance tuning applied"

#===============================================================================
# 9. Create systemd service for DAP
#===============================================================================
log_info "Creating systemd service..."

cat > /etc/systemd/system/dap.service << 'EOF'
[Unit]
Description=DAP (Digital Adoption Platform) Application
After=network.target postgresql-16.service nginx.service
Wants=postgresql-16.service nginx.service
Documentation=https://github.com/your-org/dap

[Service]
Type=forking
User=dap
Group=dap
WorkingDirectory=/data/dap/app
Environment="HOME=/data/dap"
Environment="PM2_HOME=/data/dap/.pm2"

# Environment
Environment="NODE_ENV=production"
Environment="DATABASE_URL=postgresql://dap:dap_prod_secure_2024!@localhost:5432/dap?schema=public"
Environment="PORT=4000"
Environment="FRONTEND_PORT=3000"

# PM2 commands
ExecStart=/usr/bin/pm2 start /data/dap/app/ecosystem.config.js
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 stop all

# Restart policy
Restart=on-failure
RestartSec=10
TimeoutStartSec=120
TimeoutStopSec=60

# Security
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/data/dap

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=dap

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable dap

log_success "Systemd service created"

#===============================================================================
# 9b. Configure sudoers for deployment user (rajarora)
#===============================================================================
log_info "Configuring sudoers for deployment..."

# Allow rajarora to run commands as dap user and manage services without password
cat > /etc/sudoers.d/dap-deploy << 'EOF'
# DAP Deployment sudo rules
# Allow deployment user to run commands as dap user
rajarora ALL=(dap) NOPASSWD: ALL

# Allow deployment user to manage DAP directories
rajarora ALL=(root) NOPASSWD: /bin/chown -R dap\:dap /data/dap*
rajarora ALL=(root) NOPASSWD: /bin/mkdir -p /data/dap*
rajarora ALL=(root) NOPASSWD: /bin/rm -rf /data/dap/app/*
rajarora ALL=(root) NOPASSWD: /bin/cp -r /tmp/dap/* /data/dap/app/

# Allow deployment user to manage PM2 and systemd services
rajarora ALL=(root) NOPASSWD: /usr/bin/pm2 *
rajarora ALL=(root) NOPASSWD: /bin/systemctl restart dap
rajarora ALL=(root) NOPASSWD: /bin/systemctl stop dap
rajarora ALL=(root) NOPASSWD: /bin/systemctl start dap
rajarora ALL=(root) NOPASSWD: /bin/systemctl reload nginx
rajarora ALL=(root) NOPASSWD: /usr/bin/npm install -g *
rajarora ALL=(root) NOPASSWD: /usr/bin/env PATH=* pm2 startup *
EOF

chmod 440 /etc/sudoers.d/dap-deploy
visudo -c -f /etc/sudoers.d/dap-deploy

log_success "Sudoers configured for deployment"

#===============================================================================
# 10. Set up automatic backups
#===============================================================================
log_info "Setting up automatic database backups..."

mkdir -p /data/dap/backups/{daily,weekly}
chown -R ${DAP_USER}:${DAP_GROUP} /data/dap/backups

cat > /data/dap/scripts/backup-database.sh << 'EOF'
#!/bin/bash
# DAP Database Backup Script

BACKUP_DIR="/data/dap/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)

# Ensure directories exist
mkdir -p "${BACKUP_DIR}/daily" "${BACKUP_DIR}/weekly"

# Daily backup (using password from .pgpass or environment)
export PGPASSWORD='dap_prod_secure_2024!'
pg_dump -U dap -h localhost dap | gzip > "${BACKUP_DIR}/daily/dap_${DATE}.sql.gz"

# Keep only last 7 daily backups
find "${BACKUP_DIR}/daily" -name "*.sql.gz" -mtime +7 -delete

# Weekly backup (on Sunday)
if [ "$DAY_OF_WEEK" -eq 7 ]; then
    cp "${BACKUP_DIR}/daily/dap_${DATE}.sql.gz" "${BACKUP_DIR}/weekly/"
    # Keep only last 4 weekly backups
    find "${BACKUP_DIR}/weekly" -name "*.sql.gz" -mtime +28 -delete
fi

echo "Backup completed: ${DATE}"
EOF

chmod +x /data/dap/scripts/backup-database.sh
chown -R ${DAP_USER}:${DAP_GROUP} /data/dap/scripts

# Create .pgpass file for dap user (for passwordless pg_dump)
echo "localhost:5432:dap:dap:dap_prod_secure_2024!" > ${DAP_HOME}/.pgpass
chmod 600 ${DAP_HOME}/.pgpass
chown ${DAP_USER}:${DAP_GROUP} ${DAP_HOME}/.pgpass

# Add backup to dap user's crontab
sudo -u ${DAP_USER} bash -c '(crontab -l 2>/dev/null | grep -v "backup-database"; echo "0 2 * * * /data/dap/scripts/backup-database.sh >> /data/dap/logs/backup.log 2>&1") | crontab -'

log_success "Automatic backups configured (daily at 2 AM)"

#===============================================================================
# Summary
#===============================================================================
echo ""
echo "=========================================="
log_success "DAP Production Server Setup Complete!"
echo "=========================================="
echo ""
echo "Installed Components:"
echo "  - Node.js $(node --version)"
echo "  - npm $(npm --version)"  
echo "  - PM2 $(pm2 --version)"
echo "  - PostgreSQL ${POSTGRES_VERSION}"
echo "  - Nginx $(nginx -v 2>&1 | cut -d/ -f2)"
echo ""
echo "Configuration:"
echo "  - DAP User: ${DAP_USER}"
echo "  - App Directory: ${DAP_HOME}/app"
echo "  - Database: postgresql://dap:***@localhost:5432/dap"
echo "  - Nginx: Reverse proxy on port 80"
echo "  - Backups: Daily at 2 AM to ${DAP_HOME}/backups"
echo ""
echo "Next Steps:"
echo "  1. Deploy the application: ./deploy-app.sh"
echo "  2. (Optional) Configure SSL certificates"
echo "  3. Start the service: systemctl start dap"
echo ""

