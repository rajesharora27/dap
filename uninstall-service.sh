#!/bin/bash

# DAP Service Uninstallation Script
# This script removes the DAP systemd service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR]${NC} This script must be run as root (use sudo)"
  exit 1
fi

echo -e "${MAGENTA}=== DAP Service Uninstallation ===${NC}"
echo ""

SYSTEMD_SERVICE_PATH="/etc/systemd/system/dap.service"

# Check if service is installed
if [ ! -f "$SYSTEMD_SERVICE_PATH" ]; then
  echo -e "${YELLOW}[WARNING]${NC} DAP service is not installed."
  exit 0
fi

# Stop the service if it's running
if systemctl is-active --quiet dap.service; then
  echo -e "${BLUE}[INFO]${NC} Stopping DAP service..."
  systemctl stop dap.service
fi

# Disable the service
if systemctl is-enabled --quiet dap.service; then
  echo -e "${BLUE}[INFO]${NC} Disabling DAP service..."
  systemctl disable dap.service
fi

# Remove service file
echo -e "${BLUE}[INFO]${NC} Removing service file..."
rm -f "$SYSTEMD_SERVICE_PATH"

# Reload systemd daemon
echo -e "${BLUE}[INFO]${NC} Reloading systemd daemon..."
systemctl daemon-reload

# Reset failed state if any
systemctl reset-failed dap.service 2>/dev/null || true

echo ""
echo -e "${GREEN}[SUCCESS]${NC} DAP service has been uninstalled successfully!"
echo -e "${BLUE}[INFO]${NC} You can still manually manage the application using: ${GREEN}./dap start|stop|restart${NC}"
echo ""

