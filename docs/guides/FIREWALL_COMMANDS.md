# Firewall Configuration Commands

## Quick Fix - Run the Script

The easiest way is to run the automated script:

```bash
cd /data/dap
./open-firewall-ports.sh
```

## Manual Commands

If you prefer to run commands manually:

### 1. Check Current Firewall Status

```bash
# Check if firewall is running
sudo firewall-cmd --state

# List currently open ports
sudo firewall-cmd --list-ports

# Show all firewall rules
sudo firewall-cmd --list-all
```

### 2. Open Required Ports

```bash
# Open port 5173 for frontend
sudo firewall-cmd --permanent --add-port=5173/tcp

# Open port 4000 for backend
sudo firewall-cmd --permanent --add-port=4000/tcp

# Reload firewall to apply changes
sudo firewall-cmd --reload
```

### 3. Verify Ports Are Open

```bash
# Check that ports are now listed
sudo firewall-cmd --list-ports

# Should show: 4000/tcp 5173/tcp (plus any other ports)
```

### 4. Test From Another Device on Subnet

From another computer/device on the same network:

```bash
# Test with curl
curl -I http://172.22.156.32:5173

# Or open in browser
http://172.22.156.32:5173
http://centos1.rajarora.csslab:5173
```

## Alternative: Add to Specific Zone

If you want to add ports to a specific zone:

```bash
# For public zone
sudo firewall-cmd --zone=public --permanent --add-port=5173/tcp
sudo firewall-cmd --zone=public --permanent --add-port=4000/tcp
sudo firewall-cmd --reload
```

## Alternative: Using iptables (if firewalld not available)

```bash
# Add rules to allow incoming traffic
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 4000 -j ACCEPT

# Save iptables rules
sudo service iptables save

# Or for systems with netfilter-persistent
sudo netfilter-persistent save
```

## Troubleshooting

### Check if Services Are Listening

```bash
# Verify services are listening on all interfaces (0.0.0.0)
ss -tuln | grep -E ':(5173|4000)'

# Should show:
# tcp   LISTEN 0.0.0.0:5173
# tcp   LISTEN 0.0.0.0:4000
```

### Check SELinux (if enabled)

```bash
# Check SELinux status
getenforce

# If SELinux is blocking, temporarily set to permissive for testing
sudo setenforce 0

# To make it permanent, edit /etc/selinux/config
# SELINUX=permissive
```

### Test Local Connectivity First

```bash
# Test from the server itself
curl -I http://127.0.0.1:5173
curl -I http://172.22.156.32:5173
curl -I http://centos1.rajarora.csslab:5173
```

### Check System Logs

```bash
# Check firewall logs for blocked connections
sudo journalctl -u firewalld -f

# Check for denied connections
sudo grep -i denied /var/log/messages
```

## Remove Ports (if needed later)

```bash
# Remove ports from firewall
sudo firewall-cmd --permanent --remove-port=5173/tcp
sudo firewall-cmd --permanent --remove-port=4000/tcp
sudo firewall-cmd --reload
```

## Summary

The most common issue is that firewalld is blocking incoming connections on ports 4000 and 5173. Opening these ports should resolve subnet access issues.

**Expected Result After Opening Ports:**
- ✅ Access from same machine: http://localhost:5173
- ✅ Access from same machine via IP: http://172.22.156.32:5173
- ✅ Access from other devices on subnet: http://172.22.156.32:5173
- ✅ Access from other devices via hostname: http://centos1.rajarora.csslab:5173 (if they have DNS or hosts entry)

