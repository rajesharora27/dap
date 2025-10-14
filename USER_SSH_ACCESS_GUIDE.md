# Quick Start Guide for Remote Users

## DAP Server Information
- **Server IP:** `172.22.156.32` (or hostname if configured)
- **Frontend Port:** `5173`
- **Backend Port:** `4000`

## For Users Connecting Through Jump Host

### Option 1: Simple One-Command Tunnel (Recommended)

On your local machine, run:

```bash
ssh -L 5173:172.22.156.32:5173 -L 4000:172.22.156.32:4000 YOUR_USERNAME@JUMP_HOST_IP
```

Replace:
- `YOUR_USERNAME` with your jump host username
- `JUMP_HOST_IP` with the jump host IP address

Then open your browser to: **http://localhost:5173**

### Option 2: Background Tunnel

If you want the tunnel to run in the background:

```bash
ssh -fNL 5173:172.22.156.32:5173 -L 4000:172.22.156.32:4000 YOUR_USERNAME@JUMP_HOST_IP
```

Then open your browser to: **http://localhost:5173**

To close the tunnel later:
```bash
pkill -f "ssh.*5173"
```

### Option 3: Using SSH Config (Best for Regular Users)

1. Edit `~/.ssh/config` on your local machine:

```ssh-config
Host dap-jumphost
    HostName JUMP_HOST_IP
    User YOUR_USERNAME

Host dap-app
    HostName 172.22.156.32
    User YOUR_USERNAME
    ProxyJump dap-jumphost
    LocalForward 5173 localhost:5173
    LocalForward 4000 localhost:4000
```

2. Connect with one simple command:
```bash
ssh dap-app
```

3. Open browser to: **http://localhost:5173**

## Verification Steps

### 1. Check Tunnel is Working
On your local machine:
```bash
# Should show local ports are listening
netstat -an | grep -E '(5173|4000)' | grep LISTEN

# Or on Linux/Mac:
ss -tln | grep -E ':(5173|4000)'
```

You should see:
```
127.0.0.1:5173
127.0.0.1:4000
```

### 2. Test Backend Health
```bash
curl http://localhost:4000/health
```

Should return:
```json
{"status":"ok","uptime":...}
```

### 3. Open Application
In your web browser, go to:
```
http://localhost:5173
```

## Troubleshooting

### Problem: "Connection refused" when trying to SSH
**Solution:** Check that you can reach the jump host:
```bash
ping JUMP_HOST_IP
ssh YOUR_USERNAME@JUMP_HOST_IP
```

### Problem: Browser shows "Cannot connect to localhost:5173"
**Solutions:**
1. Make sure SSH tunnel is still running:
   ```bash
   ps aux | grep "ssh.*5173"
   ```

2. If no results, recreate the tunnel

3. Check local port isn't already in use:
   ```bash
   lsof -ti:5173
   # If something is there, kill it or use different local port
   ```

### Problem: Application loads but shows errors
**Solution:** Check backend connection:
```bash
curl http://localhost:4000/health
```

If this fails, verify both ports are forwarded in your SSH command.

### Problem: "Port already in use"
**Solution:** Kill existing connection and retry:
```bash
# Find the process using the port
lsof -ti:5173

# Kill it
kill -9 $(lsof -ti:5173)

# Or kill all SSH tunnels to that port
pkill -f "ssh.*5173"
```

## Tips

### Keep Connection Alive
Add to your SSH command:
```bash
ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 \
    -L 5173:172.22.156.32:5173 \
    -L 4000:172.22.156.32:4000 \
    YOUR_USERNAME@JUMP_HOST_IP
```

### Use SSH Key Authentication
For easier connection without password:
```bash
# Generate key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy to jump host
ssh-copy-id YOUR_USERNAME@JUMP_HOST_IP
```

### Multiple Users
Each user can run their own tunnel. The SSH tunnels only affect their local machine's localhost ports.

## Summary

**Simplest workflow:**
1. Open terminal
2. Run: `ssh -L 5173:172.22.156.32:5173 -L 4000:172.22.156.32:4000 user@jumphost`
3. Open browser: `http://localhost:5173`
4. Use application normally
5. Close terminal when done

**Note:** The DAP application server (172.22.156.32) must be running for this to work. Contact your administrator if you cannot connect.
