# Systemd Service - Known Issues and Resolution

**Date:** 2025-11-12  
**Status:** ✅ RESOLVED

## Issue Summary

When initially implementing the DAP systemd service, we encountered a podman DNS binding conflict that prevented the service from starting when run as a system-wide service (root).

## Issue: Podman DNS Binding Error (RESOLVED)

### Original Symptom

When starting the DAP service via systemd as a system-wide service, the PostgreSQL container failed to start with the following error:

```
Error: unable to start container: netavark: error while applying dns entries: 
IO error: aardvark-dns failed to start: Error from child process
Error starting server failed to bind udp listener on 10.89.0.1:53: 
IO error: Address already in use (os error 98)
```

### Root Cause Analysis

- **Manual Start**: Worked perfectly (`./dap start` as user)
- **System Service Start**: Failed with DNS binding error (`sudo systemctl start dap.service`)
- **Root Cause**: Podman's aardvark-dns service tried to bind to port 53 on the podman network bridge (10.89.0.1). When running via systemd as root, this created a conflict with the user's existing podman environment.

### Why It Worked Manually

When running `./dap start` manually:
- Used the current user's podman environment
- Podman networking was properly initialized for the user session
- DNS service bound successfully in user context

When running via systemd as system service:
- Ran in systemd's isolated environment as root
- Podman networking competed with user's podman instance
- DNS port (53) conflicts occurred

## ✅ SOLUTION: User-Mode Systemd Service

### Implementation

**Changed from:**
- System-wide service: `/etc/systemd/system/dap.service`
- Run as: root
- Commands: `sudo systemctl ...`

**Changed to:**
- User-mode service: `~/.config/systemd/user/dap.service`
- Run as: Current user (rajarora)
- Commands: `systemctl --user ...`
- Enabled linger for boot-time startup

### Why This Works

1. **User Context**: Service runs in the user's podman environment, not root's
2. **No DNS Conflicts**: Uses the same podman network as manual execution
3. **Secure**: Runs as user, not root (security best practice)
4. **Simpler**: No sudo required for daily operations
5. **Reliable**: Tested and verified working

### Changes Made

1. **Service File** (`~/.config/systemd/user/dap.service`):
   - Removed `User=root` and `Group=root` directives
   - Changed `WantedBy=multi-user.target` to `WantedBy=default.target`
   - Removed some system-specific hardening options

2. **Installation Script** (`install-service.sh`):
   - Removed root requirement
   - Creates service in `~/.config/systemd/user/`
   - Uses `systemctl --user` commands
   - Enables linger automatically

3. **Uninstallation Script** (`uninstall-service.sh`):
   - Uses `systemctl --user` commands
   - Optionally disables linger

4. **Documentation**:
   - Updated all instructions to use `systemctl --user`
   - Added notes about user-mode services
   - Explained linger requirement

## Current Status

### ✅ Working Configuration

```bash
# Installation (no sudo needed)
./install-service.sh

# Service Management
systemctl --user start dap.service
systemctl --user stop dap.service
systemctl --user restart dap.service
systemctl --user status dap.service

# Logs
journalctl --user -u dap.service -f

# Automatic startup on boot
loginctl enable-linger $USER
systemctl --user enable dap.service
```

### ✅ Verified Functionality

- ✅ Service installs successfully
- ✅ Service starts without DNS errors
- ✅ All components run correctly (database, backend, frontend)
- ✅ Service restarts automatically on failure
- ✅ Service starts automatically on boot (with linger)
- ✅ Logs accessible via journalctl
- ✅ Service responds to all systemctl commands

### ✅ Test Results

```bash
$ systemctl --user status dap.service
● dap.service - DAP (Digital Adoption Platform) Application
     Loaded: loaded (/home/rajarora/.config/systemd/user/dap.service; enabled)
     Active: active (running) since Wed 2025-11-12 19:11:48 EST
       Docs: https://github.com/your-org/dap
    Process: 4077175 ExecStart=/data/dap/dap start (code=exited, status=0/SUCCESS)
      Tasks: 80
     Memory: 287.0M
        CPU: 9.680s
```

```bash
$ ./dap status
=== APPLICATION STATUS ===
Database (PostgreSQL):
[SUCCESS] Database container is running
[SUCCESS] Database is accepting connections

Backend API (GraphQL):
[SUCCESS] Backend running on port 4000
[INFO] API endpoint: http://localhost:4000/graphql

Frontend (React/Vite):
[SUCCESS] Frontend running on port 5173
[INFO] Web interface: http://localhost:5173
```

## Migration from System Service

If you previously installed the system-wide service:

### Step 1: Remove System Service

```bash
sudo systemctl stop dap.service
sudo systemctl disable dap.service
sudo rm /etc/systemd/system/dap.service
sudo systemctl daemon-reload
```

### Step 2: Install User Service

```bash
cd /data/dap
./install-service.sh
```

### Step 3: Verify

```bash
systemctl --user status dap.service
./dap status
```

## Alternative Approaches Considered

### Option 1: Continue Manual Start/Stop
**Status:** ✅ Always works as fallback
```bash
./dap start
./dap stop
```

### Option 2: User-Mode Service
**Status:** ✅ **IMPLEMENTED AND WORKING**

### Option 3: Host Networking
**Status:** ❌ Not needed, security concerns
- Would use `--network host` for containers
- Bypasses podman DNS
- Less isolation

### Option 4: Pre-Start Network Cleanup
**Status:** ❌ Not needed, user-mode solved it
- Clean up podman networks before start
- May have side effects

### Option 5: System Service with Network Tweaks
**Status:** ❌ Complex and unnecessary
- Modify network configuration
- User-mode is simpler and better

## Lessons Learned

1. **User-mode services are preferable for containerized applications**
   - Better isolation between system and user podman environments
   - Avoids permission and networking conflicts
   - More secure (principle of least privilege)

2. **Podman works best in user context**
   - Rootless containers by design
   - User-mode systemd services align with this philosophy

3. **Always test both manual and service-based startup**
   - Manual working doesn't guarantee service will work
   - Different execution contexts can reveal issues

4. **Linger is required for boot-time user services**
   - Without linger, user services only start when user logs in
   - `loginctl enable-linger` enables true boot-time startup

## Documentation

### Updated Files

- ✅ `/data/dap/install-service.sh` - User-mode installation
- ✅ `/data/dap/uninstall-service.sh` - User-mode uninstallation
- ✅ `/data/dap/SERVICE_README.md` - Quick guide updated
- ✅ `/data/dap/INSTALL_AUTOSTART.txt` - Installation instructions updated
- ✅ `/data/dap/docs/SYSTEMD_SERVICE.md` - Comprehensive documentation updated
- ✅ `~/.config/systemd/user/dap.service` - Service file (created during install)

### Commands Reference

**User Service Commands (Current):**
```bash
systemctl --user start dap.service
systemctl --user stop dap.service
systemctl --user restart dap.service
systemctl --user status dap.service
systemctl --user enable dap.service
systemctl --user disable dap.service
journalctl --user -u dap.service -f
```

**System Service Commands (Old, Don't Use):**
```bash
sudo systemctl start dap.service      # ❌ Don't use
sudo systemctl stop dap.service       # ❌ Don't use
sudo systemctl status dap.service     # ❌ Don't use
sudo journalctl -u dap.service -f     # ❌ Don't use
```

## Support

If you encounter any issues:

1. **Check if service is running:**
   ```bash
   systemctl --user status dap.service
   ```

2. **Check logs:**
   ```bash
   journalctl --user -u dap.service -n 100
   ```

3. **Try manual start:**
   ```bash
   cd /data/dap
   ./dap start
   ./dap status
   ```

4. **Verify linger:**
   ```bash
   loginctl show-user $USER | grep Linger
   ```
   Should show: `Linger=yes`

5. **Reinstall if needed:**
   ```bash
   ./uninstall-service.sh
   ./install-service.sh
   ```

## Conclusion

The podman DNS binding issue has been **completely resolved** by switching to a user-mode systemd service. This approach:

- ✅ Works reliably
- ✅ Starts automatically on boot
- ✅ Restarts automatically on failure
- ✅ Provides full systemd integration
- ✅ Maintains security best practices
- ✅ Avoids all DNS conflicts

**Status:** Production ready and recommended for all deployments.

---

**Issue Opened:** 2025-11-12  
**Issue Resolved:** 2025-11-12  
**Solution:** User-mode systemd service  
**Status:** ✅ Closed
