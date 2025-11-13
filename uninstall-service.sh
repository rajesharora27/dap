#!/bin/bash

# DAP Service Uninstallation Script (User-Mode)
# This script removes the DAP systemd USER service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}=== DAP User Service Uninstallation ===${NC}"
echo ""

USER_SYSTEMD_DIR="${HOME}/.config/systemd/user"
USER_SERVICE_PATH="${USER_SYSTEMD_DIR}/dap.service"

# Check if service is installed
if [ ! -f "$USER_SERVICE_PATH" ]; then
  echo -e "${YELLOW}[WARNING]${NC} DAP user service is not installed at: $USER_SERVICE_PATH"
  echo -e "${BLUE}[INFO]${NC} Nothing to uninstall."
  exit 0
fi

# Stop the service if it's running
if systemctl --user is-active --quiet dap.service 2>/dev/null; then
  echo -e "${BLUE}[INFO]${NC} Stopping DAP user service..."
  systemctl --user stop dap.service
  echo -e "${GREEN}[SUCCESS]${NC} Service stopped"
fi

# Disable the service
if systemctl --user is-enabled --quiet dap.service 2>/dev/null; then
  echo -e "${BLUE}[INFO]${NC} Disabling DAP user service..."
  systemctl --user disable dap.service
  echo -e "${GREEN}[SUCCESS]${NC} Service disabled"
fi

# Remove the service file
echo -e "${BLUE}[INFO]${NC} Removing service file: $USER_SERVICE_PATH"
rm -f "$USER_SERVICE_PATH"
echo -e "${GREEN}[SUCCESS]${NC} Service file removed"

# Reload systemd daemon
echo -e "${BLUE}[INFO]${NC} Reloading user systemd daemon..."
systemctl --user daemon-reload

# Ask about disabling linger
echo ""
echo -e "${YELLOW}[QUESTION]${NC} Do you want to disable linger for user '$USER'?"
echo -e "${BLUE}[INFO]${NC} Linger allows services to run even when user is not logged in."
echo -e "${BLUE}[INFO]${NC} Disabling it means no user services will start automatically on boot."
read -p "Disable linger? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  loginctl disable-linger "$USER"
  echo -e "${GREEN}[SUCCESS]${NC} Linger disabled for user '$USER'"
else
  echo -e "${BLUE}[INFO]${NC} Linger remains enabled (other user services may still run)"
fi

echo ""
echo -e "${GREEN}[SUCCESS]${NC} DAP user service uninstallation complete!"
echo ""
echo -e "${BLUE}[INFO]${NC} You can still manually start/stop DAP using:"
echo -e "  ${GREEN}Start:${NC}  cd /data/dap && ./dap start"
echo -e "  ${GREEN}Stop:${NC}   cd /data/dap && ./dap stop"
echo -e "  ${GREEN}Status:${NC} cd /data/dap && ./dap status"
echo ""
