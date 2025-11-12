#!/bin/bash

# DAP Service Installation Script
# This script installs the DAP systemd service and enables it to start on boot

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

echo -e "${MAGENTA}=== DAP Service Installation ===${NC}"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_FILE="${SCRIPT_DIR}/dap.service"
SYSTEMD_SERVICE_PATH="/etc/systemd/system/dap.service"

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

# Stop the service if it's already running
if systemctl is-active --quiet dap.service; then
  echo -e "${BLUE}[INFO]${NC} Stopping existing DAP service..."
  systemctl stop dap.service
fi

# Copy service file to systemd directory
echo -e "${BLUE}[INFO]${NC} Installing service file to $SYSTEMD_SERVICE_PATH..."
cp "$SERVICE_FILE" "$SYSTEMD_SERVICE_PATH"

# Reload systemd daemon
echo -e "${BLUE}[INFO]${NC} Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service to start on boot
echo -e "${BLUE}[INFO]${NC} Enabling DAP service to start on boot..."
systemctl enable dap.service

# Ask if user wants to start the service now
echo ""
read -p "Do you want to start the DAP service now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}[INFO]${NC} Starting DAP service..."
  systemctl start dap.service
  
  # Wait a moment for service to start
  sleep 5
  
  # Check service status
  if systemctl is-active --quiet dap.service; then
    echo -e "${GREEN}[SUCCESS]${NC} DAP service started successfully!"
  else
    echo -e "${YELLOW}[WARNING]${NC} DAP service may have failed to start. Checking status..."
    systemctl status dap.service --no-pager
  fi
else
  echo -e "${BLUE}[INFO]${NC} Service not started. You can start it later with: sudo systemctl start dap.service"
fi

echo ""
echo -e "${GREEN}[SUCCESS]${NC} DAP service installation complete!"
echo ""
echo -e "${MAGENTA}=== Service Management Commands ===${NC}"
echo -e "  ${GREEN}Start service:${NC}     sudo systemctl start dap.service"
echo -e "  ${GREEN}Stop service:${NC}      sudo systemctl stop dap.service"
echo -e "  ${GREEN}Restart service:${NC}   sudo systemctl restart dap.service"
echo -e "  ${GREEN}Check status:${NC}      sudo systemctl status dap.service"
echo -e "  ${GREEN}View logs:${NC}         sudo journalctl -u dap.service -f"
echo -e "  ${GREEN}Disable autostart:${NC} sudo systemctl disable dap.service"
echo -e "  ${GREEN}Enable autostart:${NC}  sudo systemctl enable dap.service"
echo ""
echo -e "${BLUE}[INFO]${NC} The service will automatically start on system boot."
echo ""

