# DNS Configuration Fix for Subnet Access

## Problem

The dnsmasq DNS server on this machine has the correct configuration, but needs to be restarted to clear the DNS cache and apply the settings properly.

## Current DNS Configuration

The `/etc/dnsmasq.conf` file already contains the correct entry:

```
address=/centos1.rajarora.csslab/172.22.156.32
```

However, dnsmasq is caching the old resolution (127.0.0.1) and needs to be restarted.

## Solution: Restart dnsmasq

### Quick Fix - Run the Script

```bash
cd /data/dap
./restart-dns.sh
```

### Manual Commands

```bash
# Restart dnsmasq service
sudo systemctl restart dnsmasq

# Verify it's running
sudo systemctl status dnsmasq

# Test DNS resolution
nslookup centos1.rajarora.csslab
# Should return: 172.22.156.32

# Or use dig
dig @127.0.0.1 centos1.rajarora.csslab +short
# Should return: 172.22.156.32
```

## Verify DNS Resolution

After restarting dnsmasq, test from this server:

```bash
# Should resolve to 172.22.156.32, NOT 127.0.0.1
nslookup centos1.rajarora.csslab

# Test from command line
curl -I http://centos1.rajarora.csslab:5173
```

## Test from Client Devices

From another device on your subnet:

```bash
# Check DNS resolution (should show 172.22.156.32)
nslookup centos1.rajarora.csslab

# Test web access
curl -I http://centos1.rajarora.csslab:5173

# Open in browser
# http://centos1.rajarora.csslab:5173
```

## Current dnsmasq Configuration

Located in `/etc/dnsmasq.conf`:

```conf
server=10.122.111.5
server=10.122.111.6
listen-address=127.0.0.1,172.22.156.32
resolv-file=/etc/resolv.conf
domain-needed
bogus-priv
cache-size=1000
domain=rajarora.csslab
expand-hosts
address=/centos1.rajarora.csslab/172.22.156.32
address=/centos2.rajarora.csslab/172.22.156.33
address=/centos3.rajarora.csslab/172.22.156.34
address=/win1.rajarora.csslab/172.22.156.63
address=/win2.rajarora.csslab/172.22.156.62
```

### Key Settings:
- `listen-address=127.0.0.1,172.22.156.32` - DNS server listens on both localhost and subnet interface
- `domain=rajarora.csslab` - Default domain for expansion
- `expand-hosts` - Automatically expand hostnames with domain
- `address=/centos1.rajarora.csslab/172.22.156.32` - Explicit DNS entry (correct!)

## Troubleshooting

### DNS Still Resolving to 127.0.0.1

If DNS still resolves incorrectly after restart:

1. Check if there's a conflicting entry:
```bash
grep -r "centos1" /etc/hosts /etc/dnsmasq.conf /etc/dnsmasq.d/
```

2. Clear dnsmasq cache more aggressively:
```bash
sudo systemctl stop dnsmasq
sudo rm -f /var/lib/misc/dnsmasq.leases
sudo systemctl start dnsmasq
```

3. Check dnsmasq logs:
```bash
sudo journalctl -u dnsmasq -f
```

### Client Devices Still Getting Wrong IP

Client devices may have DNS cache:

**Linux/Mac:**
```bash
# Clear DNS cache
sudo systemd-resolve --flush-caches  # systemd-resolved
sudo killall -HUP mDNSResponder      # macOS
```

**Windows:**
```cmd
ipconfig /flushdns
```

**Browser:**
- Clear browser cache
- Use incognito/private mode
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Verify dnsmasq is Serving DNS

```bash
# Check dnsmasq is listening
sudo ss -tulnp | grep dnsmasq
# Should show ports 53 (DNS)

# Test direct query to dnsmasq
dig @172.22.156.32 centos1.rajarora.csslab
```

## Alternative: Bypass DNS Cache

If you need immediate access while DNS cache clears:

1. **Use IP address directly**: http://172.22.156.32:5173
2. **Add to client hosts file temporarily**

## Permanent Fix Checklist

- [x] dnsmasq.conf has correct address entry
- [x] Firewall ports open (5173, 4000)
- [x] Services listening on 0.0.0.0
- [x] Vite allowedHosts includes hostname
- [ ] dnsmasq restarted (run ./restart-dns.sh)
- [ ] DNS resolves to 172.22.156.32 (verify with nslookup)
- [ ] Client devices can access via hostname

## After Restart

Once dnsmasq is restarted, all devices on the subnet that use this DNS server (172.22.156.32) will automatically resolve `centos1.rajarora.csslab` to the correct IP address.

**Access URLs:**
- http://centos1.rajarora.csslab:5173 (Frontend)
- http://centos1.rajarora.csslab:4000 (Backend API)
- http://centos1.rajarora.csslab:4000/graphql (GraphQL)

---

## Summary

The DNS configuration is already correct in `/etc/dnsmasq.conf`. The issue is simply that **dnsmasq needs to be restarted** to clear its cache.

**Run this to fix:**
```bash
sudo systemctl restart dnsmasq
```

After restart, hostname access will work from all devices on the subnet! 🎉

