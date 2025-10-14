# SSH Tunnel Access Configuration

## Overview
The DAP application is now configured to be accessible via SSH tunnels from remote locations through a jump host. Both frontend (port 5173) and backend (port 4000) listen on all network interfaces.

## Network Configuration Changes

### Backend Configuration
**File:** `/data/dap/backend/src/config/app.config.ts`
- Changed `backend.host` from `'127.0.0.1'` to `'0.0.0.0'`
- Backend now listens on all interfaces

**File:** `/data/dap/backend/src/server.ts`
- Updated CORS to allow all origins in development mode when no custom origins are set
- This enables access from any IP address/hostname via SSH tunnels
- Production mode still respects ALLOWED_ORIGINS environment variable for security

### Frontend Configuration
**File:** `/data/dap/frontend/vite.config.ts`
- Already configured with `host: '0.0.0.0'`
- Frontend accessible from all interfaces

## Verification
Check that services are listening on all interfaces:
```bash
ss -tlnp | grep -E ':(4000|5173)'
```

Expected output:
```
LISTEN 0.0.0.0:5173  (Frontend)
LISTEN 0.0.0.0:4000  (Backend)
```

## SSH Tunnel Setup for End Users

### Scenario
- **DAP Server:** The machine running DAP application (this server)
- **Jump Host:** A bastion/jump server that users can SSH into
- **User's Local Machine:** Where users run their web browser

### Prerequisites
- Users have SSH access to the jump host
- Jump host can reach the DAP server on ports 4000 and 5173
- Users know the DAP server's IP address or hostname

### Method 1: Port Forwarding (Recommended)

#### Step 1: Create SSH Tunnel from Jump Host to DAP Server
From the jump host, forward ports to the DAP server:

```bash
# On jump host, forward both frontend and backend ports
ssh -L 5173:localhost:5173 -L 4000:localhost:4000 user@DAP_SERVER_IP -N

# Or if you want it to run in background:
ssh -fNL 5173:localhost:5173 -L 4000:localhost:4000 user@DAP_SERVER_IP
```

#### Step 2: Create SSH Tunnel from User's Machine to Jump Host
From the user's local machine:

```bash
# Forward ports from local machine through jump host
ssh -L 5173:localhost:5173 -L 4000:localhost:4000 user@JUMP_HOST_IP -N

# Or in background:
ssh -fNL 5173:localhost:5173 -L 4000:localhost:4000 user@JUMP_HOST_IP
```

#### Step 3: Access Application
Open browser on local machine:
```
http://localhost:5173
```

### Method 2: Direct Tunnel Through Jump Host (One Command)

Users can create a tunnel directly through the jump host to the DAP server:

```bash
# From user's local machine
ssh -L 5173:DAP_SERVER_IP:5173 -L 4000:DAP_SERVER_IP:4000 user@JUMP_HOST_IP -N
```

Then access: `http://localhost:5173`

### Method 3: SSH Config File (Easiest for Regular Users)

Users can add this to their `~/.ssh/config`:

```ssh-config
# Jump host connection
Host jumphost
    HostName JUMP_HOST_IP
    User your-username
    
# DAP server through jump host
Host dap-server
    HostName DAP_SERVER_IP
    User your-username
    ProxyJump jumphost
    LocalForward 5173 localhost:5173
    LocalForward 4000 localhost:4000
```

Then simply run:
```bash
ssh dap-server
```

And access: `http://localhost:5173`

## Firewall Requirements

### On DAP Server
Ensure firewall allows connections from jump host:
```bash
# Example for firewalld
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --permanent --add-port=4000/tcp
sudo firewall-cmd --reload

# Example for iptables
sudo iptables -A INPUT -p tcp --dport 5173 -s JUMP_HOST_IP -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 4000 -s JUMP_HOST_IP -j ACCEPT
```

### On Jump Host
No special firewall rules needed (outbound connections)

### On User's Local Machine
No firewall changes needed

## Security Considerations

### Development Mode (Current Setup)
- CORS allows all origins for easy SSH tunnel access
- Suitable for internal networks and development
- Backend listens on all interfaces (0.0.0.0)

### Production Mode (If Needed Later)
To lock down CORS for production, set environment variable:

```bash
export ALLOWED_ORIGINS="http://your-domain.com,https://your-domain.com"
export NODE_ENV=production
```

Or in a `.env` file:
```
ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
NODE_ENV=production
```

## Troubleshooting

### Cannot Connect to Frontend
1. **Check if frontend is running:**
   ```bash
   ss -tlnp | grep 5173
   ```
   Should show: `0.0.0.0:5173`

2. **Check SSH tunnel:**
   ```bash
   # On local machine
   ss -tlnp | grep 5173
   ```
   Should show: `127.0.0.1:5173`

3. **Test direct access from jump host:**
   ```bash
   # From jump host
   curl http://DAP_SERVER_IP:5173
   ```

### Cannot Connect to Backend/GraphQL
1. **Check backend is running:**
   ```bash
   ss -tlnp | grep 4000
   ```
   Should show: `0.0.0.0:4000`

2. **Test GraphQL endpoint:**
   ```bash
   # From jump host
   curl http://DAP_SERVER_IP:4000/health
   ```
   Should return: `{"status":"ok",...}`

### CORS Errors
If you see CORS errors in browser console:

1. **Verify backend CORS configuration:**
   ```bash
   curl -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS http://localhost:4000/graphql -v
   ```

2. **Check if ALLOWED_ORIGINS is set:**
   ```bash
   echo $ALLOWED_ORIGINS
   ```

3. **Restart backend after changes:**
   ```bash
   cd /data/dap && ./dap restart backend
   ```

### Connection Refused
- Ensure firewall allows traffic from jump host
- Verify SELinux is not blocking (if applicable)
- Check if services are actually listening on 0.0.0.0:
  ```bash
  netstat -tlnp | grep -E ':(4000|5173)'
  ```

## Quick Reference

### User Connection Flow
```
[User's Browser] 
    ↓ localhost:5173
[Local SSH Tunnel] 
    ↓ SSH to Jump Host
[Jump Host]
    ↓ SSH to DAP Server or Direct Forward
[DAP Server]
    ↓ 0.0.0.0:5173 (Frontend)
    ↓ 0.0.0.0:4000 (Backend)
```

### Commands Cheat Sheet

**Start tunnels from user's machine:**
```bash
# One-liner (direct tunnel)
ssh -L 5173:DAP_IP:5173 -L 4000:DAP_IP:4000 user@JUMP_HOST_IP -N

# Two-step (if jump host already has tunnels)
ssh -L 5173:localhost:5173 -L 4000:localhost:4000 user@JUMP_HOST_IP -N
```

**Access application:**
```
http://localhost:5173
```

**Kill background SSH tunnels:**
```bash
# Find SSH tunnel processes
ps aux | grep "ssh.*5173"

# Kill them
pkill -f "ssh.*5173"
```

## Files Modified
- `/data/dap/backend/src/config/app.config.ts` - Changed backend host to 0.0.0.0
- `/data/dap/backend/src/server.ts` - Updated CORS for SSH tunnel access
- `/data/dap/frontend/vite.config.ts` - Already configured for 0.0.0.0

## Testing the Configuration

### From DAP Server
```bash
# Check listening ports
ss -tlnp | grep -E ':(4000|5173)'
```

### From Jump Host
```bash
# Test frontend
curl http://DAP_SERVER_IP:5173

# Test backend health
curl http://DAP_SERVER_IP:4000/health

# Test GraphQL
curl -X POST http://DAP_SERVER_IP:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

### From User's Local Machine (after setting up tunnel)
```bash
# Test frontend
curl http://localhost:5173

# Test backend
curl http://localhost:4000/health

# Open browser
open http://localhost:5173  # macOS
xdg-open http://localhost:5173  # Linux
start http://localhost:5173  # Windows
```
