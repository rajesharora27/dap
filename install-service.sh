#!/bin/bash

# DAP Service Installation Script (User-Mode)
# This script installs the DAP systemd USER service and enables it to start on boot
# NOTE: Uses user-mode systemd service instead of system-wide service to avoid podman DNS conflicts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}=== DAP User Service Installation ===${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_FILE="${SCRIPT_DIR}/dap.service"
USER_SYSTEMD_DIR="${HOME}/.config/systemd/user"
USER_SERVICE_PATH="${USER_SYSTEMD_DIR}/dap.service"

# Check if service file exists
if [ ! -f "$SERVICE_FILE" ]; then
  echo -e "${RED}[ERROR]${NC} Service file not found: $SERVICE_FILE"
  exit 1
fi

# Check if DAP script exists and is executable
DAP_SCRIPT="${SCRIPT_DIR}/dap"
if [ ! -f "$DAP_SCRIPT" ]; then
  echo -e "${RED}[ERROR]${NC} DAP script not found: $DAP_SCRIPT"
  exit 1
fi

if [ ! -x "$DAP_SCRIPT" ]; then
  echo -e "${YELLOW}[WARNING]${NC} Making DAP script executable..."
  chmod +x "$DAP_SCRIPT"
fi

# Create user systemd directory if it doesn't exist
if [ ! -d "$USER_SYSTEMD_DIR" ]; then
  echo -e "${BLUE}[INFO]${NC} Creating user systemd directory: $USER_SYSTEMD_DIR"
  mkdir -p "$USER_SYSTEMD_DIR"
fi

# Stop the service if it's already running
if systemctl --user is-active --quiet dap.service 2>/dev/null; then
  echo -e "${BLUE}[INFO]${NC} Stopping existing DAP user service..."
  systemctl --user stop dap.service
fi

# Create user-mode version of service file
echo -e "${BLUE}[INFO]${NC} Creating user-mode service file at $USER_SERVICE_PATH..."
cat > "$USER_SERVICE_PATH" << 'EOF'
[Unit]
Description=DAP (Digital Adoption Platform) Application
After=network.target
Wants=network-online.target
Documentation=https://github.com/your-org/dap

[Service]
Type=forking
WorkingDirectory=/data/dap

# Environment variables
Environment="PATH=/home/rajarora/.nvm/versions/node/v20.12.1/bin:/usr/local/bin:/usr/bin:/bin"
Environment="NODE_ENV=production"

# Start command
ExecStart=/data/dap/dap start

# Stop command
ExecStop=/data/dap/dap stop

# Reload command (restart services gracefully)
ExecReload=/data/dap/dap restart

# Service management
Restart=on-failure
RestartSec=10s
TimeoutStartSec=120s
TimeoutStopSec=60s

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=dap

[Install]
WantedBy=default.target
EOF

# Reload user systemd daemon
echo -e "${BLUE}[INFO]${NC} Reloading user systemd daemon..."
systemctl --user daemon-reload

# Enable the service to start on boot
echo -e "${BLUE}[INFO]${NC} Enabling DAP user service to start on boot..."
systemctl --user enable dap.service

# Enable linger so service starts even when user is not logged in
echo -e "${BLUE}[INFO]${NC} Enabling linger for user (allows service to start on boot)..."
loginctl enable-linger "$USER"

# Ask if user wants to start the service now
echo ""
read -p "Do you want to start the DAP service now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}[INFO]${NC} Starting DAP user service..."
  systemctl --user start dap.service
  
  # Wait a moment for service to start
  sleep 10
  
  # Check service status
  if systemctl --user is-active --quiet dap.service; then
    echo -e "${GREEN}[SUCCESS]${NC} DAP service started successfully!"
    echo ""
    echo -e "${BLUE}[INFO]${NC} Checking service status..."
    systemctl --user status dap.service --no-pager -l | head -15
  else
    echo -e "${YELLOW}[WARNING]${NC} DAP service may have failed to start. Checking status..."
    systemctl --user status dap.service --no-pager
  fi
else
  echo -e "${BLUE}[INFO]${NC} Service not started. You can start it later with: systemctl --user start dap.service"
fi

echo ""
echo -e "${GREEN}[SUCCESS]${NC} DAP user service installation complete!"
echo ""
echo -e "${MAGENTA}=== Service Management Commands ===${NC}"
echo -e "  ${GREEN}Start service:${NC}     systemctl --user start dap.service"
echo -e "  ${GREEN}Stop service:${NC}      systemctl --user stop dap.service"
echo -e "  ${GREEN}Restart service:${NC}   systemctl --user restart dap.service"
echo -e "  ${GREEN}Check status:${NC}      systemctl --user status dap.service"
echo -e "  ${GREEN}View logs:${NC}         journalctl --user -u dap.service -f"
echo -e "  ${GREEN}Disable autostart:${NC} systemctl --user disable dap.service"
echo -e "  ${GREEN}Enable autostart:${NC}  systemctl --user enable dap.service"
echo ""
echo -e "${BLUE}[INFO]${NC} The service will automatically start on system boot (linger enabled)."
echo -e "${BLUE}[INFO]${NC} Note: This is a user-mode service running as '$USER', not as root."
echo ""
