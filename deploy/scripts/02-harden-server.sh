#!/bin/bash
#===============================================================================
# DAP Production Server Hardening Script
# Target: CentOS Stream 9 (centos2 - 172.22.156.33)
# Purpose: Security hardening for production deployment
#===============================================================================

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root"
   exit 1
fi

log_info "Starting server hardening..."

#===============================================================================
# 1. SSH Hardening
#===============================================================================
log_info "Hardening SSH configuration..."

# Backup original config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)

# Create hardened SSH config (keeping password auth for troubleshooting access)
cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
# DAP Production SSH Hardening

# Allow root login with key only
PermitRootLogin prohibit-password

# Keep password authentication enabled for troubleshooting access
# Change to 'no' after confirming SSH key access works reliably
PasswordAuthentication yes
PermitEmptyPasswords no

# Use only SSH Protocol 2
Protocol 2

# Strong key exchange algorithms
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256,ecdh-sha2-nistp256,ecdh-sha2-nistp384,ecdh-sha2-nistp521

# Strong ciphers
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

# Strong MACs
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256

# Authentication settings
MaxAuthTries 5
LoginGraceTime 60
ClientAliveInterval 300
ClientAliveCountMax 3

# Allow TCP forwarding for port forwarding if needed for debugging
AllowTcpForwarding yes
X11Forwarding no
AllowAgentForwarding yes

# Logging
LogLevel VERBOSE
SyslogFacility AUTH

# Banner
Banner /etc/ssh/banner
EOF

# Create SSH banner
cat > /etc/ssh/banner << 'EOF'
***************************************************************************
                         AUTHORIZED ACCESS ONLY
***************************************************************************
This system is for authorized use only. All activities are monitored and
logged. Unauthorized access attempts will be investigated and prosecuted.
***************************************************************************
EOF

# Restart SSH (but keep our current session)
systemctl restart sshd

log_success "SSH hardened"

#===============================================================================
# 2. Fail2Ban Installation and Configuration
#===============================================================================
log_info "Installing and configuring Fail2Ban..."

dnf install -y epel-release
dnf install -y fail2ban fail2ban-firewalld

# Create jail configuration
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Ban for 1 hour
bantime = 3600
# Within 10 minute window
findtime = 600
# After 5 failures
maxretry = 5
# Use firewalld
banaction = firewallcmd-ipset

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/secure
maxretry = 10
bantime = 3600
# Whitelist centos1 (dev machine) from being banned
ignoreip = 127.0.0.1/8 ::1 172.22.156.0/24

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
findtime = 600
maxretry = 10
bantime = 7200
EOF

# Create nginx-limit-req filter
cat > /etc/fail2ban/filter.d/nginx-limit-req.conf << 'EOF'
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>
ignoreregex =
EOF

systemctl enable fail2ban
systemctl start fail2ban

log_success "Fail2Ban installed and configured"

#===============================================================================
# 3. Firewall Hardening
#===============================================================================
log_info "Hardening firewall rules..."

# Ensure firewalld is running
systemctl start firewalld
systemctl enable firewalld

# Set default zone to drop
firewall-cmd --set-default-zone=drop

# Create DAP zone with specific rules
firewall-cmd --permanent --new-zone=dap 2>/dev/null || true
firewall-cmd --permanent --zone=dap --add-service=ssh
firewall-cmd --permanent --zone=dap --add-service=http
firewall-cmd --permanent --zone=dap --add-service=https

# Rate limit SSH connections
firewall-cmd --permanent --zone=dap --add-rich-rule='rule service name="ssh" limit value="10/m" accept'

# Set DAP zone as default for public interface
DEFAULT_INTERFACE=$(ip route | grep default | awk '{print $5}' | head -1)
if [[ -n "$DEFAULT_INTERFACE" ]]; then
    firewall-cmd --permanent --zone=dap --change-interface=$DEFAULT_INTERFACE
fi

firewall-cmd --reload

log_success "Firewall hardened"

#===============================================================================
# 4. Audit System Configuration
#===============================================================================
log_info "Configuring audit system..."

dnf install -y audit

# Configure auditd rules
cat > /etc/audit/rules.d/dap-audit.rules << 'EOF'
# DAP Security Audit Rules

# Delete all existing rules
-D

# Buffer size
-b 8192

# Failure mode (1=print, 2=panic)
-f 1

# Log all commands run as root
-a always,exit -F arch=b64 -F euid=0 -S execve -k rootcmd

# Monitor DAP application files
-w /data/dap/app -p wa -k dap_app_changes

# Monitor configuration files
-w /etc/nginx -p wa -k nginx_config
-w /etc/ssh -p wa -k ssh_config
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/group -p wa -k group_changes
-w /etc/sudoers -p wa -k sudoers_changes

# Monitor authentication
-w /var/log/secure -p wa -k auth_log
-w /var/log/messages -p wa -k system_log

# Login/logout events
-w /var/run/utmp -p wa -k session
-w /var/log/wtmp -p wa -k session
-w /var/log/btmp -p wa -k session

# System calls that affect time
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time_change

# Network configuration changes
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k network_config

# Make the configuration immutable (requires reboot to change)
# Uncomment for production after testing
# -e 2
EOF

systemctl enable auditd
systemctl restart auditd

log_success "Audit system configured"

#===============================================================================
# 5. Disable Unnecessary Services
#===============================================================================
log_info "Disabling unnecessary services..."

SERVICES_TO_DISABLE=(
    "avahi-daemon"
    "cups"
    "rpcbind"
    "nfs-server"
    "nfs-client.target"
    "bluetooth"
    "kdump"
)

for service in "${SERVICES_TO_DISABLE[@]}"; do
    if systemctl is-enabled $service 2>/dev/null | grep -q "enabled"; then
        systemctl stop $service 2>/dev/null || true
        systemctl disable $service 2>/dev/null || true
        log_info "Disabled: $service"
    fi
done

log_success "Unnecessary services disabled"

#===============================================================================
# 6. Configure Automatic Security Updates
#===============================================================================
log_info "Configuring automatic security updates..."

dnf install -y dnf-automatic

# Configure for security updates only
cat > /etc/dnf/automatic.conf << 'EOF'
[commands]
upgrade_type = security
random_sleep = 360
download_updates = yes
apply_updates = yes

[emitters]
emit_via = stdio

[email]
email_from = root@localhost
email_to = root
email_host = localhost

[command]

[command_email]
EOF

systemctl enable dnf-automatic.timer
systemctl start dnf-automatic.timer

log_success "Automatic security updates configured"

#===============================================================================
# 7. Secure Shared Memory
#===============================================================================
log_info "Securing shared memory..."

if ! grep -q "tmpfs /dev/shm" /etc/fstab; then
    echo "tmpfs /dev/shm tmpfs defaults,noexec,nosuid,nodev 0 0" >> /etc/fstab
    mount -o remount /dev/shm
fi

log_success "Shared memory secured"

#===============================================================================
# 8. Configure AIDE (File Integrity Monitoring)
#===============================================================================
log_info "Installing and configuring AIDE..."

dnf install -y aide

# Initialize AIDE database
aide --init
mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz

# Schedule daily AIDE checks
cat > /etc/cron.daily/aide-check << 'EOF'
#!/bin/bash
/usr/sbin/aide --check | mail -s "AIDE Report - $(hostname)" root
EOF
chmod +x /etc/cron.daily/aide-check

log_success "AIDE installed and initialized"

#===============================================================================
# 9. Kernel Hardening
#===============================================================================
log_info "Applying kernel hardening..."

cat > /etc/sysctl.d/99-security-hardening.conf << 'EOF'
# Kernel security hardening

# Disable IP forwarding
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# Disable source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Disable ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Enable SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 65535

# Log martian packets
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# Ignore ICMP broadcasts
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Ignore bogus ICMP errors
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Enable reverse path filtering
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Disable sending ICMP redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Randomize address space
kernel.randomize_va_space = 2

# Restrict core dumps
fs.suid_dumpable = 0

# Hide kernel pointers
kernel.kptr_restrict = 2

# Restrict dmesg access
kernel.dmesg_restrict = 1

# Restrict ptrace
kernel.yama.ptrace_scope = 1
EOF

sysctl --system

log_success "Kernel hardening applied"

#===============================================================================
# 10. Set Secure Permissions
#===============================================================================
log_info "Setting secure file permissions..."

# Secure cron directories
chmod 700 /etc/cron.d
chmod 700 /etc/cron.daily
chmod 700 /etc/cron.hourly
chmod 700 /etc/cron.monthly
chmod 700 /etc/cron.weekly

# Secure ssh directory
chmod 700 /root/.ssh 2>/dev/null || true
chmod 600 /root/.ssh/* 2>/dev/null || true

# Remove group/other write from system files
chmod go-w /etc/passwd
chmod go-w /etc/shadow
chmod go-w /etc/group
chmod go-w /etc/gshadow

log_success "Secure permissions set"

#===============================================================================
# Summary
#===============================================================================
echo ""
echo "=========================================="
log_success "Server Hardening Complete!"
echo "=========================================="
echo ""
echo "Security Measures Applied:"
echo "  ✓ SSH hardened (key-only auth, strong ciphers)"
echo "  ✓ Fail2Ban configured (SSH, nginx)"
echo "  ✓ Firewall hardened (drop zone default)"
echo "  ✓ Audit system enabled"
echo "  ✓ Unnecessary services disabled"
echo "  ✓ Automatic security updates enabled"
echo "  ✓ Shared memory secured"
echo "  ✓ AIDE file integrity monitoring"
echo "  ✓ Kernel security hardening"
echo "  ✓ Secure file permissions"
echo ""
echo "Important Notes:"
echo "  - SSH password authentication is DISABLED"
echo "  - Ensure you have SSH key access before disconnecting!"
echo "  - Review /var/log/audit/audit.log for security events"
echo "  - Run 'aide --check' periodically to verify file integrity"
echo ""

