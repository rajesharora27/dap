# DAP Systemd Service Documentation

**Date:** 2025-11-12  
**Feature:** Automatic startup of DAP application using systemd  
**Type:** User-mode systemd service

## Overview

The DAP application can be configured to start automatically on system boot using a systemd **user service**. This ensures the application is always available after server restarts and provides standard service management capabilities.

**Why User-Mode Service:**
- Avoids podman DNS binding conflicts that occur with system-wide services
- Runs in the user's podman environment
- More secure (runs as user, not root)
- Simpler to set up (no sudo required for daily operations)

## Components

### 1. Service File: `dap.service`

Located at: `~/.config/systemd/user/dap.service` (after installation)

**Description:**
- Systemd user service unit file that defines how the DAP application should be started, stopped, and managed
- Configured to start after network is available
- Runs as the current user
- Automatically restarts on failure

**Key Configuration:**
```ini
[Unit]
Description=DAP (Digital Adoption Platform) Application
After=network.target
Wants=network-online.target

[Service]
Type=forking
WorkingDirectory=/data/dap
ExecStart=/data/dap/dap start
ExecStop=/data/dap/dap stop
ExecReload=/data/dap/dap restart
Restart=on-failure
RestartSec=10s
TimeoutStartSec=120s

[Install]
WantedBy=default.target
```

### 2. Installation Script: `install-service.sh`

Located at: `/data/dap/install-service.sh`

**Purpose:**
- Automates the installation and configuration of the user systemd service
- Creates service file in `~/.config/systemd/user/`
- Enables the service to start on boot
- Enables linger to allow boot-time startup
- Optionally starts the service immediately

**Usage:**
```bash
cd /data/dap
./install-service.sh
```

**No sudo required!**

### 3. Uninstallation Script: `uninstall-service.sh`

Located at: `/data/dap/uninstall-service.sh`

**Purpose:**
- Removes the user systemd service
- Stops and disables the service
- Optionally disables linger
- Cleans up service files

**Usage:**
```bash
cd /data/dap
./uninstall-service.sh
```

## Installation

### Prerequisites

1. **Verify DAP Script Works:**
   ```bash
   cd /data/dap
   ./dap status
   ```

2. **Ensure All Components Are Installed:**
   - PostgreSQL container (podman)
   - Node.js and npm (via nvm)
   - Backend dependencies
   - Frontend dependencies

### Installation Steps

1. **Navigate to DAP Directory:**
   ```bash
   cd /data/dap
   ```

2. **Run Installation Script:**
   ```bash
   ./install-service.sh
   ```

3. **Answer the Prompt:**
   ```
   Do you want to start the DAP service now? (y/n)
   ```
   
   - Press `y` to start immediately
   - Press `n` to start later manually

4. **Verify Installation:**
   ```bash
   systemctl --user status dap.service
   ```
   
   Expected output:
   ```
   ● dap.service - DAP (Digital Adoption Platform) Application
        Loaded: loaded (/home/user/.config/systemd/user/dap.service; enabled)
        Active: active (running) since ...
   ```

5. **Verify Application Access:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000/graphql

## Service Management

### Basic Commands

**Start the service:**
```bash
systemctl --user start dap.service
```

**Stop the service:**
```bash
systemctl --user stop dap.service
```

**Restart the service:**
```bash
systemctl --user restart dap.service
```

**Check service status:**
```bash
systemctl --user status dap.service
```

**View logs (follow mode):**
```bash
journalctl --user -u dap.service -f
```

**View recent logs:**
```bash
journalctl --user -u dap.service -n 100
```

**Enable autostart:**
```bash
systemctl --user enable dap.service
```

**Disable autostart:**
```bash
systemctl --user disable dap.service
```

### Important Notes

- **Always use `systemctl --user`** (not `sudo systemctl`)
- **Always use `journalctl --user`** for logs (not `sudo journalctl`)
- User services run in the user's context, not as root
- Linger must be enabled for boot-time startup

## Features

### 1. Automatic Startup on Boot

**How It Works:**
- Service is enabled via `systemctl --user enable`
- Linger is enabled via `loginctl enable-linger`
- Service starts automatically when system boots
- No user login required (thanks to linger)

**Verify Linger:**
```bash
loginctl show-user $USER | grep Linger
```

Expected output: `Linger=yes`

### 2. Automatic Restart on Failure

**Configuration:**
```ini
Restart=on-failure
RestartSec=10s
```

**Behavior:**
- If any component crashes, systemd will restart the entire service
- Waits 10 seconds before restarting
- Prevents rapid restart loops

**Manual Restart Prevention:**
If you want to stop the service and prevent automatic restart:
```bash
systemctl --user stop dap.service
systemctl --user disable dap.service
```

### 3. Logging

**All output goes to journald:**
- Standard output
- Standard error
- Service status changes

**View logs:**
```bash
# Follow logs in real-time
journalctl --user -u dap.service -f

# View last 50 lines
journalctl --user -u dap.service -n 50

# View logs since today
journalctl --user -u dap.service --since today

# View logs with timestamps
journalctl --user -u dap.service -o short-precise
```

### 4. Graceful Shutdown

**Shutdown Behavior:**
- Calls `./dap stop` which gracefully stops all components
- 60-second timeout before force kill
- Ensures clean database shutdown

### 5. Service Health Monitoring

**Check if service is running:**
```bash
systemctl --user is-active dap.service
```

**Check if service is enabled:**
```bash
systemctl --user is-enabled dap.service
```

**Get detailed status:**
```bash
systemctl --user status dap.service -l --no-pager
```

## Troubleshooting

### Service Won't Start

**Check logs for errors:**
```bash
journalctl --user -u dap.service -n 100
```

**Common issues:**

1. **Node not in PATH:**
   - Service file includes nvm node path
   - Verify: `which node`

2. **Permission issues:**
   - Service runs as your user
   - Verify: `whoami`

3. **Port already in use:**
   - Check if DAP is already running manually
   - Run: `./dap status`

**Try manual start:**
```bash
cd /data/dap
./dap start
```

If manual start works but service doesn't, check the service file paths.

### Service Keeps Restarting

**Stop the restart loop:**
```bash
systemctl --user stop dap.service
systemctl --user disable dap.service
```

**Check what's causing the failure:**
```bash
journalctl --user -u dap.service -n 200
```

**Common causes:**
- Database connection failures
- Port conflicts
- Missing dependencies

**Fix and restart:**
```bash
systemctl --user enable dap.service
systemctl --user start dap.service
```

### Can't Access Logs

**Ensure you're using --user flag:**
```bash
# ❌ Wrong
journalctl -u dap.service

# ✅ Correct
journalctl --user -u dap.service
```

### Service Not Starting on Boot

**Check if linger is enabled:**
```bash
loginctl show-user $USER | grep Linger
```

If `Linger=no`, enable it:
```bash
loginctl enable-linger $USER
```

**Check if service is enabled:**
```bash
systemctl --user is-enabled dap.service
```

If `disabled`, enable it:
```bash
systemctl --user enable dap.service
```

### Podman DNS Binding Error

**This issue is resolved with user-mode service!**

If you previously installed the system-wide service and had DNS binding errors:

1. **Uninstall system-wide service:**
   ```bash
   sudo systemctl stop dap.service
   sudo systemctl disable dap.service
   sudo rm /etc/systemd/system/dap.service
   sudo systemctl daemon-reload
   ```

2. **Install user-mode service:**
   ```bash
   cd /data/dap
   ./install-service.sh
   ```

The user-mode service runs in your user's podman environment and avoids the DNS conflicts.

## Uninstallation

### Complete Removal

```bash
cd /data/dap
./uninstall-service.sh
```

**What it does:**
1. Stops the service
2. Disables the service
3. Removes the service file
4. Optionally disables linger
5. Reloads systemd

**After uninstall:**
- DAP application remains installed
- Can still use manual commands: `./dap start|stop|restart`
- No automatic startup on boot

## Technical Details

### Directory Structure

```
/data/dap/
├── dap                      # Main control script
├── dap.service              # Service template (not used directly)
├── install-service.sh       # Installation script
├── uninstall-service.sh     # Uninstallation script
└── docs/
    └── SYSTEMD_SERVICE.md   # This file

~/.config/systemd/user/
└── dap.service              # Actual service file (after install)
```

### Environment Variables

The service sets:
```ini
Environment="PATH=/home/rajarora/.nvm/versions/node/v20.12.1/bin:/usr/local/bin:/usr/bin:/bin"
Environment="NODE_ENV=production"
```

**Note:** Node path is hardcoded to nvm location. If using different Node installation, update the service file.

### Process Hierarchy

When running as a service:
```
systemd (user instance)
└── dap.service
    ├── PostgreSQL container (podman)
    ├── Backend API (ts-node-dev)
    └── Frontend dev server (vite)
```

### Service Type: Forking

```ini
Type=forking
```

**Why forking:**
- `./dap start` spawns background processes and exits
- Systemd tracks the main process group
- Allows service to report "started" after processes are running

### User vs System Service

**User Service (Current Implementation):**
- Location: `~/.config/systemd/user/dap.service`
- Commands: `systemctl --user`
- Runs as: Current user
- Requires: Linger enabled
- Pros: No DNS conflicts, more secure, simpler
- Cons: Tied to user account

**System Service (Previous Attempt):**
- Location: `/etc/systemd/system/dap.service`
- Commands: `sudo systemctl`
- Runs as: root
- Requires: Root permissions
- Pros: System-wide, not user-specific
- Cons: Podman DNS binding conflicts

**Recommendation:** Use user service (current implementation)

## Security Considerations

### User Permissions

- Service runs as your user account
- Has same permissions as manual execution
- Cannot access other users' files
- Cannot bind to privileged ports (<1024)

### Container Security

- Podman runs rootless containers
- Better isolation than root-owned containers
- Follows security best practices

### Service Hardening

Current hardening options:
```ini
# None required for user services
# User services are inherently more secure than system services
```

For production, consider additional restrictions in the service file.

## Best Practices

### 1. Regular Monitoring

Check service status regularly:
```bash
systemctl --user status dap.service
```

### 2. Log Review

Review logs periodically:
```bash
journalctl --user -u dap.service --since "1 day ago"
```

### 3. Updates

When updating DAP:
1. Stop the service
2. Perform updates
3. Restart the service

```bash
systemctl --user stop dap.service
# ... perform updates ...
systemctl --user start dap.service
```

### 4. Backup Before Changes

Before modifying service configuration:
```bash
cp ~/.config/systemd/user/dap.service ~/.config/systemd/user/dap.service.backup
```

### 5. Test Manual Start First

Before relying on automatic startup, ensure manual start works:
```bash
./dap start
./dap status
./dap stop
```

## Support and Documentation

### Related Files

- Quick guide: `/data/dap/SERVICE_README.md`
- Installation instructions: `/data/dap/INSTALL_AUTOSTART.txt`
- Known issues: `/data/dap/docs/SYSTEMD_SERVICE_KNOWN_ISSUES.md` (DNS issue now resolved)

### Getting Help

If you encounter issues:

1. Check logs: `journalctl --user -u dap.service -n 100`
2. Try manual start: `./dap start`
3. Check service status: `systemctl --user status dap.service`
4. Review this documentation

### Version Information

- **Created:** 2025-11-12
- **Service Type:** User-mode systemd service
- **Service Version:** 1.0 (user-mode)
- **Status:** Production ready

## Changelog

### 2025-11-12 - User-Mode Service Implementation
- Switched from system-wide to user-mode service
- Resolved podman DNS binding conflicts
- Updated all installation scripts
- Updated documentation
- Enabled linger for boot-time startup
- Tested and verified working

### 2025-11-12 - Initial Implementation
- Created system-wide service
- Encountered DNS binding issues
- Documented workarounds

## Conclusion

The DAP systemd user service provides a reliable, secure, and maintainable way to run the DAP application as an always-on service. By using a user-mode service, we avoid common containerization pitfalls while maintaining the benefits of systemd service management.

The service will:
- ✅ Start automatically on boot
- ✅ Restart automatically on failure
- ✅ Log all output for troubleshooting
- ✅ Respond to standard systemctl commands
- ✅ Run securely in user context

For questions or issues, review the logs and this documentation.
