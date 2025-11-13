# DAP Systemd Service - Quick Start Guide

## What is This?

This allows the DAP application to start automatically when your server boots up, and provides easy management commands.

**Note:** Uses a user-mode systemd service (runs as your user) to avoid podman networking conflicts.

## Installation (One-Time Setup)

```bash
cd /data/dap
./install-service.sh
```

**No sudo needed!** The installation creates a user-mode service.

That's it! The application will now start automatically on boot.

## Daily Usage

### Start the Application
```bash
systemctl --user start dap.service
```

### Stop the Application
```bash
systemctl --user stop dap.service
```

### Restart the Application
```bash
systemctl --user restart dap.service
```

### Check Status
```bash
systemctl --user status dap.service
```

### View Logs
```bash
journalctl --user -u dap.service -f
```
(Press Ctrl+C to exit)

## Uninstall

If you no longer want automatic startup:

```bash
cd /data/dap
./uninstall-service.sh
```

This removes the systemd service but keeps your application intact. You can still use `./dap start|stop|restart` manually.

## Troubleshooting

**Service won't start?**
```bash
# Check what went wrong
journalctl --user -u dap.service -n 50

# Try starting manually
cd /data/dap
./dap start
```

**Service keeps restarting?**
```bash
# Stop it first
systemctl --user stop dap.service

# Check logs for errors
journalctl --user -u dap.service -n 100

# Fix the issue, then start again
systemctl --user start dap.service
```

## Access the Application

After the service starts:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000/graphql
- **Database:** PostgreSQL container on port 5432

## Important Notes

- **Use `systemctl --user`** (not `sudo systemctl`) for all service commands
- The service runs as your user account, not as root
- Linger is enabled to allow the service to start on boot even when you're not logged in
- This approach avoids podman DNS binding conflicts that occur with system-wide services

## Need More Details?

See the full documentation: `/data/dap/docs/SYSTEMD_SERVICE.md`
