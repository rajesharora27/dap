# DAP Systemd Service Documentation

**Date:** 2025-11-12  
**Feature:** Automatic startup of DAP application using systemd

## Overview

The DAP application can now be configured to start automatically on system boot using a systemd service. This ensures the application is always available after server restarts and provides standard service management capabilities.

## Components

### 1. Service File: `dap.service`

Located at: `/data/dap/dap.service`

**Description:**
- Systemd unit file that defines how the DAP application should be started, stopped, and managed
- Configured to start after network is available
- Runs as root to allow podman/docker container management
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
WantedBy=multi-user.target
```

### 2. Installation Script: `install-service.sh`

Located at: `/data/dap/install-service.sh`

**Purpose:**
- Automates the installation and configuration of the systemd service
- Copies service file to `/etc/systemd/system/`
- Enables the service to start on boot
- Optionally starts the service immediately

**Usage:**
```bash
sudo ./install-service.sh
```

### 3. Uninstallation Script: `uninstall-service.sh`

Located at: `/data/dap/uninstall-service.sh`

**Purpose:**
- Removes the systemd service
- Stops and disables the service
- Cleans up service files

**Usage:**
```bash
sudo ./uninstall-service.sh
```

## Installation

### Prerequisites

1. **Root/Sudo Access:**
   ```bash
   sudo -v
   ```

2. **Verify DAP Script Works:**
   ```bash
   cd /data/dap
   ./dap status
   ```

3. **Ensure All Components Are Installed:**
   - PostgreSQL container
   - Node.js and npm
   - Backend dependencies
   - Frontend dependencies

### Installation Steps

1. **Navigate to DAP Directory:**
   ```bash
   cd /data/dap
   ```

2. **Run Installation Script:**
   ```bash
   sudo ./install-service.sh
   ```

3. **Follow Prompts:**
   - The script will ask if you want to start the service immediately
   - Type `y` to start now, or `n` to start later

4. **Verify Installation:**
   ```bash
   sudo systemctl status dap.service
   ```

### Expected Output

```
● dap.service - DAP (Digital Adoption Platform) Application
     Loaded: loaded (/etc/systemd/system/dap.service; enabled; vendor preset: disabled)
     Active: active (running) since Wed 2025-11-12 10:30:00 EST; 5min ago
   Main PID: 12345 (dap)
      Tasks: 0 (limit: 100000)
     Memory: 512.0K
        CPU: 1.234s
     CGroup: /system.slice/dap.service

Nov 12 10:30:00 hostname systemd[1]: Starting DAP (Digital Adoption Platform) Application...
Nov 12 10:30:05 hostname dap[12345]: Backend API started successfully
Nov 12 10:30:07 hostname dap[12345]: Frontend dev server started successfully
Nov 12 10:30:08 hostname systemd[1]: Started DAP (Digital Adoption Platform) Application.
```

## Service Management

### Basic Commands

**Start Service:**
```bash
sudo systemctl start dap.service
```

**Stop Service:**
```bash
sudo systemctl stop dap.service
```

**Restart Service:**
```bash
sudo systemctl restart dap.service
```

**Check Status:**
```bash
sudo systemctl status dap.service
```

**Enable Autostart (on boot):**
```bash
sudo systemctl enable dap.service
```

**Disable Autostart:**
```bash
sudo systemctl disable dap.service
```

### Advanced Commands

**Reload Service Configuration:**
```bash
sudo systemctl reload dap.service
# OR
sudo systemctl daemon-reload
```

**View Service Logs (Real-time):**
```bash
sudo journalctl -u dap.service -f
```

**View Service Logs (Last 100 Lines):**
```bash
sudo journalctl -u dap.service -n 100
```

**View Service Logs (Since Boot):**
```bash
sudo journalctl -u dap.service -b
```

**View Service Logs (Specific Time Range):**
```bash
sudo journalctl -u dap.service --since "2025-11-12 10:00:00" --until "2025-11-12 12:00:00"
```

**Check if Service is Enabled:**
```bash
systemctl is-enabled dap.service
```

**Check if Service is Active:**
```bash
systemctl is-active dap.service
```

## Troubleshooting

### Service Fails to Start

**1. Check Service Status:**
```bash
sudo systemctl status dap.service
```

**2. View Detailed Logs:**
```bash
sudo journalctl -u dap.service -n 50 --no-pager
```

**3. Check DAP Script Manually:**
```bash
cd /data/dap
sudo ./dap status
sudo ./dap start
```

**4. Verify Permissions:**
```bash
ls -la /data/dap/dap
# Should be executable: -rwxr-xr-x
```

**5. Check for Port Conflicts:**
```bash
sudo lsof -i :4000  # Backend
sudo lsof -i :5173  # Frontend
sudo lsof -i :5432  # PostgreSQL
```

### Service Keeps Restarting

**1. Check Restart Count:**
```bash
systemctl show dap.service -p NRestarts
```

**2. View Recent Failures:**
```bash
sudo journalctl -u dap.service -p err -n 20
```

**3. Increase Timeout:**
Edit `/etc/systemd/system/dap.service`:
```ini
[Service]
TimeoutStartSec=180s
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart dap.service
```

### Service Doesn't Stop Cleanly

**1. Force Kill:**
```bash
sudo systemctl kill -s SIGKILL dap.service
```

**2. Check for Zombie Processes:**
```bash
ps aux | grep -E 'node|dap'
```

**3. Manual Cleanup:**
```bash
cd /data/dap
sudo ./dap stop
```

### Service Not Starting on Boot

**1. Verify Service is Enabled:**
```bash
systemctl is-enabled dap.service
# Should output: enabled
```

**2. Check Boot Logs:**
```bash
sudo journalctl -u dap.service -b 0
```

**3. Verify Dependencies:**
```bash
systemctl list-dependencies dap.service
```

**4. Re-enable Service:**
```bash
sudo systemctl disable dap.service
sudo systemctl enable dap.service
```

## Uninstallation

### Option 1: Using Uninstall Script (Recommended)

```bash
cd /data/dap
sudo ./uninstall-service.sh
```

### Option 2: Manual Uninstallation

```bash
# Stop and disable service
sudo systemctl stop dap.service
sudo systemctl disable dap.service

# Remove service file
sudo rm /etc/systemd/system/dap.service

# Reload systemd
sudo systemctl daemon-reload
sudo systemctl reset-failed
```

## Service Behavior

### Startup Sequence

1. **System Boot:**
   - Systemd starts `multi-user.target`
   - Network services become available (`network.target`)
   - DAP service starts after network is ready

2. **Service Starts:**
   - Changes to `/data/dap` directory
   - Executes `./dap start`
   - DAP script starts PostgreSQL container
   - DAP script starts backend server
   - DAP script starts frontend server

3. **Service Running:**
   - All three components (DB, backend, frontend) running
   - Service status: `active (running)`

### Shutdown Sequence

1. **Service Stop Command:**
   - Systemd calls `./dap stop`
   - DAP script stops frontend
   - DAP script stops backend
   - DAP script stops PostgreSQL container

2. **System Shutdown:**
   - Systemd sends stop signal to all services
   - DAP service gets 60 seconds (TimeoutStopSec) to stop gracefully
   - If not stopped, SIGKILL is sent

### Restart Behavior

**Automatic Restart:**
- Service automatically restarts if it exits with a failure code
- 10-second delay between restart attempts (`RestartSec=10s`)
- Will keep trying indefinitely until manual stop

**Manual Restart:**
```bash
sudo systemctl restart dap.service
```
- Performs clean stop
- Waits for all processes to terminate
- Starts fresh

## Security Considerations

### Running as Root

**Why:**
- Required for podman/docker container management
- Required to bind to privileged ports (if configured)

**Mitigation:**
- Service file includes security hardening options:
  - `PrivateTmp=yes` - Uses private /tmp directory
  - `NoNewPrivileges=yes` - Prevents privilege escalation

**Production Recommendation:**
- Create a dedicated `dap` user
- Grant necessary permissions for container management
- Update service file to run as `dap` user:
  ```ini
  [Service]
  User=dap
  Group=dap
  ```

### File Permissions

**Service File:**
```bash
sudo chmod 644 /etc/systemd/system/dap.service
```

**DAP Script:**
```bash
chmod 755 /data/dap/dap
```

**Application Directory:**
```bash
# If running as dedicated user:
chown -R dap:dap /data/dap
```

## Logging

### Log Location

**Systemd Journal:**
- All service logs are stored in systemd journal
- Persistent across reboots
- Accessible via `journalctl`

**View All DAP Logs:**
```bash
sudo journalctl -u dap.service
```

**View Logs Since Last Boot:**
```bash
sudo journalctl -u dap.service -b
```

**Follow Logs in Real-Time:**
```bash
sudo journalctl -u dap.service -f
```

### Log Rotation

**Default:**
- Systemd journal automatically rotates logs
- Default retention: Based on disk space and time

**Check Journal Size:**
```bash
journalctl --disk-usage
```

**Manual Cleanup (Keep Last 2 Days):**
```bash
sudo journalctl --vacuum-time=2d
```

**Manual Cleanup (Keep Last 500MB):**
```bash
sudo journalctl --vacuum-size=500M
```

## Integration with Existing `dap` Script

### No Changes Required

The systemd service works seamlessly with the existing `dap` script:
- Uses the same `./dap start` and `./dap stop` commands
- No modifications to the `dap` script needed
- Can still manually run `./dap` commands when needed

### Precedence

**If Service is Enabled:**
- Service starts automatically on boot
- Manual `./dap` commands still work
- But recommend using `systemctl` commands

**Best Practice:**
```bash
# Use systemctl when service is installed
sudo systemctl restart dap.service

# Manual control still works
cd /data/dap
sudo ./dap status
```

## Monitoring

### Health Checks

**Check if All Components are Running:**
```bash
sudo systemctl status dap.service
cd /data/dap
./dap status
```

**Check Individual Components:**
```bash
# Backend
curl http://localhost:4000/graphql -d '{"query":"{__schema{types{name}}}"}' -H "Content-Type: application/json"

# Frontend
curl http://localhost:5173

# Database
podman exec dap_db_1 pg_isready
```

### Automated Monitoring

**Create a Health Check Script:**
```bash
#!/bin/bash
# /usr/local/bin/check-dap-health.sh

if ! systemctl is-active --quiet dap.service; then
  echo "DAP service is not running!"
  systemctl start dap.service
fi
```

**Add to Cron:**
```bash
# Check every 5 minutes
*/5 * * * * /usr/local/bin/check-dap-health.sh
```

## Backup Considerations

### What to Backup

**Before Uninstalling:**
1. Database (handled by application's backup feature)
2. Configuration files
3. Service customizations

**Service File:**
```bash
# Backup service file
sudo cp /etc/systemd/system/dap.service /data/dap/dap.service.backup
```

### Restore After Reinstall

```bash
# Restore service
sudo cp /data/dap/dap.service.backup /etc/systemd/system/dap.service
sudo systemctl daemon-reload
sudo systemctl enable dap.service
sudo systemctl start dap.service
```

## Performance Tuning

### Adjust Timeout Values

**For Slow Systems:**
```ini
[Service]
TimeoutStartSec=300s
TimeoutStopSec=120s
```

**For Fast Systems:**
```ini
[Service]
TimeoutStartSec=60s
TimeoutStopSec=30s
```

### Resource Limits

**Add Resource Constraints:**
```ini
[Service]
MemoryLimit=4G
CPUQuota=200%
TasksMax=1000
```

### Restart Policy

**Less Aggressive Restart:**
```ini
[Service]
Restart=on-failure
RestartSec=30s
StartLimitBurst=3
StartLimitIntervalSec=600
```

This prevents endless restart loops if there's a persistent issue.

## Files Summary

| File | Location | Purpose |
|------|----------|---------|
| `dap.service` | `/data/dap/dap.service` | Systemd service definition |
| `install-service.sh` | `/data/dap/install-service.sh` | Service installation script |
| `uninstall-service.sh` | `/data/dap/uninstall-service.sh` | Service uninstallation script |
| Installed service | `/etc/systemd/system/dap.service` | Active systemd service file |

## Quick Reference

```bash
# Install service
sudo ./install-service.sh

# Check status
sudo systemctl status dap.service

# View logs
sudo journalctl -u dap.service -f

# Restart
sudo systemctl restart dap.service

# Disable autostart
sudo systemctl disable dap.service

# Uninstall
sudo ./uninstall-service.sh
```

## Support

For issues with the systemd service:

1. Check service status: `sudo systemctl status dap.service`
2. View logs: `sudo journalctl -u dap.service -n 100`
3. Test manually: `cd /data/dap && sudo ./dap start`
4. Check documentation: `/data/dap/docs/SYSTEMD_SERVICE.md`

## Future Enhancements

Potential improvements:

1. **User Isolation:** Run as dedicated non-root user
2. **Socket Activation:** Start on-demand when ports are accessed
3. **Health Monitoring:** Automatic health checks with restart
4. **Resource Monitoring:** Integration with monitoring tools (Prometheus, etc.)
5. **Multi-Instance:** Support for running multiple instances
6. **Graceful Reload:** Zero-downtime configuration reloads

