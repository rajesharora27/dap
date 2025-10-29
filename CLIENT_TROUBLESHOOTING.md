# Client Device Troubleshooting for Subnet Access

## Server Status: ✅ WORKING

The server is configured correctly:
- ✅ DNS resolves to 172.22.156.32
- ✅ Services listening on 0.0.0.0 (all interfaces)
- ✅ Firewall ports open (5173, 4000)
- ✅ Hostname access works from server: http://centos1.rajarora.csslab:5173

## Common Client-Side Issues

### Issue 1: Client DNS Cache

**Problem**: Client device has cached the old DNS entry (127.0.0.1)

**Solution**: Flush DNS cache on the client device

**Linux:**
```bash
# For systemd-resolved
sudo systemd-resolve --flush-caches

# For nscd
sudo /etc/init.d/nscd restart

# For dnsmasq (if running locally)
sudo systemctl restart dnsmasq

# For NetworkManager
sudo systemctl restart NetworkManager
```

**macOS:**
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

**Windows:**
```cmd
ipconfig /flushdns
```

### Issue 2: Client Not Using Your DNS Server

**Problem**: Client device is using a different DNS server (like 8.8.8.8, ISP DNS)

**Check on client**:
```bash
# Linux/Mac
cat /etc/resolv.conf
# Should show: nameserver 172.22.156.32

# Windows
ipconfig /all
# Look for DNS Servers, should include 172.22.156.32
```

**Solution**: Configure client to use this DNS server

**Linux (NetworkManager):**
```bash
# Edit connection settings
nmcli connection modify <connection-name> ipv4.dns "172.22.156.32"
nmcli connection down <connection-name>
nmcli connection up <connection-name>
```

**macOS:**
```
System Preferences → Network → Advanced → DNS → Add 172.22.156.32
```

**Windows:**
```
Control Panel → Network → Change Adapter Settings → 
Right-click adapter → Properties → IPv4 → 
Preferred DNS: 172.22.156.32
```

### Issue 3: Client Has Local Hosts Entry

**Problem**: Client has its own `/etc/hosts` entry mapping the hostname to 127.0.0.1

**Check on client**:
```bash
# Linux/Mac
cat /etc/hosts | grep centos1

# Windows
type C:\Windows\System32\drivers\etc\hosts | findstr centos1
```

**Solution**: Remove or update the entry
```bash
# Linux/Mac - edit as root
sudo vi /etc/hosts
# Remove line with centos1.rajarora.csslab or change to 172.22.156.32

# Windows - edit as Administrator
notepad C:\Windows\System32\drivers\etc\hosts
```

### Issue 4: Browser Cache

**Problem**: Browser has cached the old resolution or page

**Solution**: Hard refresh or use incognito

- **Chrome/Edge**: Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)
- **Firefox**: Ctrl+F5 (Win) or Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R
- Or use Incognito/Private mode

### Issue 5: Firewall on Client

**Problem**: Client device firewall or network blocking outbound connections

**Solution**: Test with curl/telnet first
```bash
# Test connectivity
ping 172.22.156.32

# Test port connectivity
telnet 172.22.156.32 5173
# or
nc -zv 172.22.156.32 5173

# Test HTTP
curl -I http://172.22.156.32:5173
```

## Step-by-Step Client Debugging

Run these commands on the **client device** (not the server):

### Step 1: Test Basic Network Connectivity
```bash
ping 172.22.156.32
# Should get responses
```

### Step 2: Check DNS Resolution
```bash
nslookup centos1.rajarora.csslab
# Should return: 172.22.156.32 (NOT 127.0.0.1)

# If wrong, check which DNS server is being used:
nslookup centos1.rajarora.csslab 172.22.156.32
# This forces query to your DNS server - should return 172.22.156.32
```

### Step 3: Test Port Connectivity
```bash
# Test if port 5173 is reachable
nc -zv 172.22.156.32 5173
# or
telnet 172.22.156.32 5173
# Should connect successfully
```

### Step 4: Test HTTP Access with IP
```bash
curl -I http://172.22.156.32:5173
# Should return: HTTP/1.1 200 OK
```

### Step 5: Test HTTP Access with Hostname
```bash
curl -I http://centos1.rajarora.csslab:5173
# Should return: HTTP/1.1 200 OK
# If this fails but IP works, it's a DNS issue
```

### Step 6: Test in Browser
```
http://172.22.156.32:5173
# Then try:
http://centos1.rajarora.csslab:5173
```

## Diagnostic Matrix

| Test | Result | Meaning |
|------|--------|---------|
| `ping 172.22.156.32` | Fails | Network connectivity issue |
| `ping 172.22.156.32` | Success | Network OK |
| `nslookup centos1...` returns 127.0.0.1 | DNS not updated/cached |
| `nslookup centos1...` returns 172.22.156.32 | DNS correct |
| `nc -zv 172.22.156.32 5173` | Fails | Firewall or service issue |
| `nc -zv 172.22.156.32 5173` | Success | Port accessible |
| `curl http://172.22.156.32:5173` | 200 OK | Server working with IP |
| `curl http://centos1...:5173` | Fails | DNS resolution issue |
| `curl http://centos1...:5173` | 200 OK | Everything working! |

## Quick Workarounds

### Workaround 1: Use IP Address
Simply use the IP directly:
```
http://172.22.156.32:5173
```

### Workaround 2: Add to Client Hosts File
Add this line to client's hosts file:
```
172.22.156.32   centos1.rajarora.csslab
```

**Linux/Mac**: `/etc/hosts`  
**Windows**: `C:\Windows\System32\drivers\etc\hosts`

### Workaround 3: Use Different Browser
Try a different browser to rule out browser cache issues

## Most Common Solution

**90% of the time, the issue is client DNS cache or wrong DNS server.**

On the client device:
1. Flush DNS cache (see commands above)
2. Verify DNS server is 172.22.156.32
3. Test: `nslookup centos1.rajarora.csslab`

## If Nothing Works

### Use IP Address Instead
```
http://172.22.156.32:5173
```
This will work regardless of DNS issues.

### Check Client Network Configuration
```bash
# Is client on same subnet?
ip addr show
# Client should be 172.22.156.x

# What DNS server is client using?
cat /etc/resolv.conf
# Should include: nameserver 172.22.156.32

# Can client reach DNS server?
ping 172.22.156.32

# Can client query DNS server?
nslookup centos1.rajarora.csslab 172.22.156.32
```

## Contact Information

If still having issues, provide this information:

1. **Client OS**: (Windows/Mac/Linux)
2. **Network check**: `ping 172.22.156.32` (success/fail)
3. **DNS check**: `nslookup centos1.rajarora.csslab` (what IP returned?)
4. **DNS server**: Output of `cat /etc/resolv.conf` or `ipconfig /all`
5. **Port check**: `nc -zv 172.22.156.32 5173` (success/fail)
6. **IP access**: `curl -I http://172.22.156.32:5173` (200 OK / error)
7. **Hostname access**: `curl -I http://centos1.rajarora.csslab:5173` (200 OK / error)

---

## Summary

The server is working correctly. The issue is likely one of:
1. **Client DNS cache** - Flush it
2. **Wrong DNS server** - Configure client to use 172.22.156.32
3. **Client hosts file** - Remove conflicting entry
4. **Browser cache** - Hard refresh or incognito

**Fastest solution**: Use IP address `http://172.22.156.32:5173` while troubleshooting DNS.

