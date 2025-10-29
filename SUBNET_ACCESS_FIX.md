# Fix: Enable Subnet Access to DAP Application

## Problem Identified

The hostname `centos1.rajarora.csslab` is currently mapped to `127.0.0.1` in `/etc/hosts`, which means it only resolves to localhost. Devices on the local subnet cannot reach the application using the hostname.

## Current Configuration Issue

```bash
# /etc/hosts contains:
127.0.0.1   localhost localhost.localdomain centos1.rajarora.csslab
```

This makes the hostname only accessible from the local machine, not from the subnet.

## Solutions

### Solution 1: Fix /etc/hosts (Recommended for Hostname Access)

Update `/etc/hosts` to map the hostname to the actual IP address:

```bash
# Backup the current hosts file
sudo cp /etc/hosts /etc/hosts.backup

# Edit /etc/hosts - Remove centos1.rajarora.csslab from the 127.0.0.1 line
# and add it to a new line with the actual IP
sudo vi /etc/hosts
```

**Change from:**
```
127.0.0.1   localhost localhost.localdomain centos1.rajarora.csslab
```

**Change to:**
```
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
172.22.156.32   centos1.rajarora.csslab centos1
```

**Or use sed to automate it:**
```bash
# Remove hostname from localhost line
sudo sed -i 's/127.0.0.1.*localhost.localdomain.*/127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4/' /etc/hosts

# Add hostname with actual IP
echo "172.22.156.32   centos1.rajarora.csslab centos1" | sudo tee -a /etc/hosts

# Verify the change
cat /etc/hosts
```

After this change:
- Local access will still work
- Subnet devices can access via: http://centos1.rajarora.csslab:5173

### Solution 2: Use IP Address Directly (Works Now)

Simply use the IP address instead of hostname:

**Frontend:** http://172.22.156.32:5173  
**Backend:** http://172.22.156.32:4000  
**GraphQL:** http://172.22.156.32:4000/graphql

The IP address is already in the Vite `allowedHosts` configuration, so this should work immediately.

### Solution 3: Configure DNS (Best for Production)

For a more permanent solution, configure proper DNS:

1. Add an A record in your DNS server:
   ```
   centos1.rajarora.csslab.  IN  A  172.22.156.32
   ```

2. Or add to other devices' hosts files:
   ```bash
   # On each client device, add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
   172.22.156.32   centos1.rajarora.csslab
   ```

## Firewall Configuration

Ensure the required ports are open for subnet access:

```bash
# Check current firewall status
sudo firewall-cmd --state

# List current open ports
sudo firewall-cmd --list-ports

# Add ports 4000 and 5173 if not already open
sudo firewall-cmd --permanent --add-port=5173/tcp  # Frontend
sudo firewall-cmd --permanent --add-port=4000/tcp  # Backend

# Reload firewall to apply changes
sudo firewall-cmd --reload

# Verify ports are open
sudo firewall-cmd --list-ports
```

### Alternative: Add ports to a specific zone

```bash
# For public zone
sudo firewall-cmd --zone=public --permanent --add-port=5173/tcp
sudo firewall-cmd --zone=public --permanent --add-port=4000/tcp
sudo firewall-cmd --reload
```

## Testing Access from Subnet

After applying the fix, test from another device on the subnet:

```bash
# Test hostname resolution (should show 172.22.156.32, not 127.0.0.1)
ping centos1.rajarora.csslab

# Test frontend connectivity
curl -I http://centos1.rajarora.csslab:5173

# Or directly with IP
curl -I http://172.22.156.32:5173

# Test backend health endpoint
curl http://centos1.rajarora.csslab:4000/health

# Test from browser
# Open: http://centos1.rajarora.csslab:5173
# Or:   http://172.22.156.32:5173
```

## Verification Checklist

- [ ] Hostname resolves to 172.22.156.32 (not 127.0.0.1)
  ```bash
  getent hosts centos1.rajarora.csslab
  # Should show: 172.22.156.32   centos1.rajarora.csslab
  ```

- [ ] Application is listening on all interfaces (0.0.0.0)
  ```bash
  ss -tuln | grep -E ':(5173|4000)'
  # Should show: 0.0.0.0:5173 and 0.0.0.0:4000
  ```

- [ ] Firewall allows ports 4000 and 5173
  ```bash
  sudo firewall-cmd --list-ports
  # Should include: 4000/tcp 5173/tcp
  ```

- [ ] Can access from another device on subnet
  ```bash
  # From another device:
  curl -I http://172.22.156.32:5173
  ```

## Current Status

✅ Application is listening on 0.0.0.0 (all interfaces)  
✅ Vite configuration includes hostname in allowedHosts  
✅ Backend CORS allows all origins in development  
❌ Hostname resolves to 127.0.0.1 instead of 172.22.156.32  
❓ Firewall status unknown (needs sudo access to check)

## Quick Fix Command

Run this to fix the hosts file immediately:

```bash
# Backup and fix /etc/hosts
sudo cp /etc/hosts /etc/hosts.backup && \
sudo sed -i '/centos1.rajarora.csslab/d' /etc/hosts && \
echo "172.22.156.32   centos1.rajarora.csslab centos1" | sudo tee -a /etc/hosts && \
echo "127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4" | sudo tee -a /etc/hosts.tmp && \
sudo mv /etc/hosts.tmp /etc/hosts.fixed && \
sudo cat /etc/hosts.fixed
```

## Notes

- The application code doesn't need any changes
- All configuration is already correct for subnet access
- The only issues are system-level (DNS/hosts and potentially firewall)
- Using IP address (172.22.156.32:5173) should work immediately if firewall is open

