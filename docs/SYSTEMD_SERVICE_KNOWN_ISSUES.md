# Systemd Service - Known Issues and Workarounds

**Date:** 2025-11-12  
**Status:** In Progress

## Current Status

The DAP systemd service has been created and is ready for use, but there's a known issue with podman networking when started via systemd that needs to be resolved.

## Issue: Podman DNS Binding Error

### Symptom

When starting the DAP service via systemd, the PostgreSQL container fails to start with the following error:

```
Error: unable to start container: netavark: error while applying dns entries: 
IO error: aardvark-dns failed to start: Error from child process
Error starting server failed to bind udp listener on 10.89.0.1:53: 
IO error: Address already in use (os error 98)
```

### Analysis

- **Manual Start**: Works perfectly (`./dap start`)
- **Systemd Start**: Fails with DNS binding error (`systemctl start dap.service`)
- **Root Cause**: Podman's aardvark-dns service tries to bind to port 53 on the podman network bridge (10.89.0.1), but when running via systemd as root, this port is already in use

### Why It Works Manually

When running `./dap start` manually:
- Uses the current user's podman environment
- Podman networking is properly initialized for the user session
- DNS service binds successfully

When running via systemd:
- Runs in systemd's isolated environment as root
- Podman networking may be competing with system services
- DNS port (53) conflicts with existing system DNS or podman DNS from another session

## Workarounds

### Option 1: Manual Start/Stop (Current Recommendation)

For now, continue using manual commands:

```bash
cd /data/dap
./dap start
./dap stop
./dap restart
```

**Pros:**
- Works reliably
- No DNS conflicts
- Full control

**Cons:**
- Must manually start after reboot
- No automatic recovery on failure

### Option 2: User-Mode Systemd Service (Recommended Solution)

Instead of a system-wide service running as root, use a user-mode service:

1. **Create user service directory:**
   ```bash
   mkdir -p ~/.config/systemd/user/
   ```

2. **Copy and modify service file:**
   ```bash
   cp /data/dap/dap.service ~/.config/systemd/user/dap.service
   ```

3. **Edit the user service** (remove `User=root` and `Group=root`)

4. **Enable and start:**
   ```bash
   systemctl --user enable dap.service
   systemctl --user start dap.service
   ```

5. **Enable linger** (to start on boot):
   ```bash
   loginctl enable-linger $USER
   ```

**Note:** This hasn't been tested yet but is the recommended approach for podman services.

### Option 3: Network Mode Change

Modify the `dap` script to use `--network=host` for the PostgreSQL container instead of bridge networking.

**In `dap` script, change:**
```bash
# From:
podman run -d \
  --name "$DB_CONTAINER_NAME" \
  --network dap_default \
  ...
  
# To:
podman run -d \
  --name "$DB_CONTAINER_NAME" \
  --network host \
  ...
```

**Pros:**
- Avoids podman DNS
- Works with systemd

**Cons:**
- Exposes PostgreSQL directly on host port 5432
- Less network isolation

### Option 4: Clean Podman State Before Start

Add a pre-start cleanup to the service file:

```ini
[Service]
ExecStartPre=/usr/bin/podman network prune -f
ExecStartPre=/usr/bin/sleep 2
ExecStart=/data/dap/dap start
```

**Status:** Not yet tested

## Current Service Status

```bash
# Service is installed but disabled
$ systemctl status dap.service
○ dap.service - DAP (Digital Adoption Platform) Application
     Loaded: loaded (/etc/systemd/system/dap.service; disabled)
     Active: inactive (dead)
```

The service files are in place and ready, but the service is currently **disabled** to prevent restart loops due to the DNS issue.

## Re-enabling the Service

Once the issue is resolved, re-enable with:

```bash
sudo systemctl enable dap.service
sudo systemctl start dap.service
```

## Testing Status

- ✅ Service file created
- ✅ Installation script works
- ✅ Service enabled successfully  
- ✅ Service can be controlled (start/stop/restart commands work)
- ✅ PATH configuration includes nvm node
- ❌ Container fails to start due to DNS binding
- ⚠️  Service currently disabled to prevent restart loops

## Recommended Next Steps

1. **Test Option 2** (User-mode service) - Most likely to work
2. **Test Option 4** (Network cleanup) - Quick fix if it works
3. **Investigate system DNS conflicts** - Check what's using port 53 on 10.89.0.1
4. **Consider Option 3** (Host networking) - If other options fail

## Files

- Service definition: `/data/dap/dap.service`
- Installed service: `/etc/systemd/system/dap.service`
- Installation script: `/data/dap/install-service.sh`
- Uninstallation script: `/data/dap/uninstall-service.sh`

## Current Recommendation

**For now, use manual start/stop:**

```bash
# Start application
cd /data/dap && ./dap start

# Stop application
cd /data/dap && ./dap stop

# Check status
cd /data/dap && ./dap status
```

The systemd service feature is ready and waiting for the podman networking issue to be resolved. Once fixed, automatic startup on boot will work seamlessly.

## Related Files

- Full documentation: `/data/dap/docs/SYSTEMD_SERVICE.md`
- Quick guide: `/data/dap/SERVICE_README.md`
- Installation instructions: `/data/dap/INSTALL_AUTOSTART.txt`

