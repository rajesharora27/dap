#!/bin/bash
# DAP Production Server Setup Script
# Target: RHEL 9.x (dapoc)
# This script configures a fresh RHEL server for DAP deployment

set -e

echo "========================================="
echo "🚀 DAP Production Server Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Create dap user
log_info "Step 1: Creating dap user..."
if id "dap" &>/dev/null; then
    log_warning "User 'dap' already exists"
else
    useradd -m -s /bin/bash -d /data/dap dap
    log_success "User 'dap' created"
fi

# Step 2: Create /data directory structure
log_info "Step 2: Creating /data directory structure..."
mkdir -p /data/dap/app/backend
mkdir -p /data/dap/app/frontend/dist
mkdir -p /data/dap/app/docs
mkdir -p /data/dap/app/scripts
mkdir -p /data/dap/logs
mkdir -p /data/dap/backups/daily
mkdir -p /data/dap/backups/weekly
mkdir -p /data/dap/backups/releases
chown -R dap:dap /data/dap
log_success "/data directory structure created"

# Step 3: Install EPEL and required packages
log_info "Step 3: Installing base packages..."
dnf install -y epel-release
dnf install -y curl wget git tar gzip unzip htop vim-enhanced
log_success "Base packages installed"

# Step 4: Install Node.js 22
log_info "Step 4: Installing Node.js 22..."
if command -v node &>/dev/null && [[ $(node -v) == v22* ]]; then
    log_warning "Node.js 22 already installed: $(node -v)"
else
    # Use NodeSource for Node.js 22
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    dnf install -y nodejs
    log_success "Node.js installed: $(node -v)"
fi

# Step 5: Install PM2 globally
log_info "Step 5: Installing PM2..."
if command -v pm2 &>/dev/null; then
    log_warning "PM2 already installed"
else
    npm install -g pm2
    log_success "PM2 installed"
fi

# Step 6: Install PostgreSQL 15
log_info "Step 6: Installing PostgreSQL 15..."
if command -v psql &>/dev/null; then
    log_warning "PostgreSQL already installed"
else
    dnf install -y postgresql15-server postgresql15
    postgresql-setup --initdb
    systemctl enable postgresql
    systemctl start postgresql
    log_success "PostgreSQL 15 installed and started"
fi

# Step 7: Configure PostgreSQL
log_info "Step 7: Configuring PostgreSQL..."
# Create dap database and user
sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='dap'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER dap WITH PASSWORD 'dap_prod_2024';"
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='dap'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE dap OWNER dap;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE dap TO dap;"

# Configure pg_hba.conf for local connections
PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
if ! grep -q "host.*dap.*dap.*127.0.0.1" "$PG_HBA"; then
    echo "host    dap    dap    127.0.0.1/32    md5" >> "$PG_HBA"
    echo "host    dap    dap    ::1/128         md5" >> "$PG_HBA"
    systemctl restart postgresql
fi
log_success "PostgreSQL configured"

# Step 8: Install Nginx
log_info "Step 8: Installing Nginx..."
if command -v nginx &>/dev/null; then
    log_warning "Nginx already installed"
else
    dnf install -y nginx
    systemctl enable nginx
    log_success "Nginx installed"
fi

# Step 9: Configure Nginx for DAP
log_info "Step 9: Configuring Nginx for DAP..."
cat > /etc/nginx/conf.d/dap.conf << 'NGINX_CONF'
# DAP Application Configuration
upstream dap_backend {
    server 127.0.0.1:4000;
    keepalive 32;
}

server {
    listen 80;
    server_name dapoc dapoc.cisco.com localhost;

    # Frontend static files
    location /dap/ {
        alias /data/dap/app/frontend/dist/;
        try_files $uri $uri/ /dap/index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # GraphQL API
    location /dap/graphql {
        proxy_pass http://dap_backend/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API endpoints
    location /dap/api/ {
        proxy_pass http://dap_backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /dap/uploads/ {
        alias /data/dap/app/backend/uploads/;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
NGINX_CONF

# Test nginx config
nginx -t && systemctl restart nginx
log_success "Nginx configured for DAP"

# Step 10: Configure firewall
log_info "Step 10: Configuring firewall..."
if systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    log_success "Firewall configured"
else
    log_warning "Firewalld not active, skipping"
fi

# Step 11: Configure SELinux (if enabled)
log_info "Step 11: Configuring SELinux..."
if getenforce | grep -q "Enforcing\|Permissive"; then
    setsebool -P httpd_can_network_connect 1
    setsebool -P httpd_read_user_content 1
    semanage fcontext -a -t httpd_sys_content_t "/data/dap/app/frontend/dist(/.*)?" 2>/dev/null || true
    restorecon -Rv /data/dap/app/frontend/dist 2>/dev/null || true
    log_success "SELinux configured"
else
    log_warning "SELinux disabled, skipping"
fi

# Step 12: Setup PM2 for dap user
log_info "Step 12: Setting up PM2 startup..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u dap --hp /data/dap
log_success "PM2 startup configured"

# Step 13: Create sudoers entry for deployment
log_info "Step 13: Configuring sudoers..."
cat > /etc/sudoers.d/dap << 'SUDOERS'
# DAP application management
dap ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
dap ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
dap ALL=(ALL) NOPASSWD: /bin/systemctl status nginx
dap ALL=(ALL) NOPASSWD: /bin/systemctl restart postgresql
dap ALL=(ALL) NOPASSWD: /usr/bin/pm2 *
SUDOERS
chmod 440 /etc/sudoers.d/dap
log_success "Sudoers configured"

# Step 14: Create SSH key for dap user (for potential git operations)
log_info "Step 14: Setting up SSH for dap user..."
sudo -u dap mkdir -p /data/dap/.ssh
sudo -u dap chmod 700 /data/dap/.ssh
sudo -u dap touch /data/dap/.ssh/authorized_keys
chmod 600 /data/dap/.ssh/authorized_keys
log_success "SSH directory created for dap user"

# Final summary
echo ""
echo "========================================="
echo -e "${GREEN}✅ DAP Production Server Setup Complete${NC}"
echo "========================================="
echo ""
echo "📋 Summary:"
echo "  • User: dap"
echo "  • Home: /data/dap"
echo "  • App: /data/dap/app"
echo "  • Node.js: $(node -v)"
echo "  • npm: $(npm -v)"
echo "  • PM2: $(pm2 -v)"
echo "  • PostgreSQL: installed and configured"
echo "  • Nginx: configured for /dap/ path"
echo ""
echo "🔐 Database credentials:"
echo "  • User: dap"
echo "  • Password: dap_prod_2024"
echo "  • Database: dap"
echo "  • Connection: postgres://dap:dap_prod_2024@localhost:5432/dap"
echo ""
echo "📝 Next steps:"
echo "  1. Deploy application files to /data/dap/app/"
echo "  2. Run: sudo -u dap npm install --prefix /data/dap/app/backend"
echo "  3. Run: sudo -u dap npx prisma migrate deploy"
echo "  4. Start with PM2: sudo -u dap pm2 start ecosystem.config.js"
echo ""
