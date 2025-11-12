# DAP Systemd Service - Quick Start Guide

## What is This?

This allows the DAP application to start automatically when your server boots up, and provides easy management commands.

## Installation (One-Time Setup)

```bash
cd /data/dap
sudo ./install-service.sh
```

That's it! The application will now start automatically on boot.

## Daily Usage

### Start the Application
```bash
sudo systemctl start dap.service
```

### Stop the Application
```bash
sudo systemctl stop dap.service
```

### Restart the Application
```bash
sudo systemctl restart dap.service
```

### Check Status
```bash
sudo systemctl status dap.service
```

### View Logs
```bash
sudo journalctl -u dap.service -f
```
(Press Ctrl+C to exit)

## Uninstall

If you no longer want automatic startup:

```bash
cd /data/dap
sudo ./uninstall-service.sh
```

This removes the systemd service but keeps your application intact. You can still use `./dap start|stop|restart` manually.

## Troubleshooting

**Service won't start?**
```bash
# Check what went wrong
sudo journalctl -u dap.service -n 50

# Try starting manually
cd /data/dap
sudo ./dap start
```

**Service keeps restarting?**
```bash
# Stop it first
sudo systemctl stop dap.service

# Check logs for errors
sudo journalctl -u dap.service -n 100

# Fix the issue, then start again
sudo systemctl start dap.service
```

## Access the Application

After the service starts:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000/graphql
- **Database:** PostgreSQL container on port 5432

## Need More Details?

See the full documentation: `/data/dap/docs/SYSTEMD_SERVICE.md`

