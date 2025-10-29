#!/bin/bash
# Script to open firewall ports for DAP application

echo "=== Current Firewall Status ==="
sudo firewall-cmd --state
echo ""

echo "=== Currently Open Ports ==="
sudo firewall-cmd --list-ports
echo ""

echo "=== Opening ports 5173 (frontend) and 4000 (backend) ==="
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --permanent --add-port=4000/tcp
echo ""

echo "=== Reloading firewall ==="
sudo firewall-cmd --reload
echo ""

echo "=== Verifying ports are now open ==="
sudo firewall-cmd --list-ports
echo ""

echo "=== Testing connectivity from localhost ==="
echo -n "Frontend (5173): "
curl -s -o /dev/null -w "%{http_code}\n" http://172.22.156.32:5173/
echo -n "Backend (4000): "
curl -s -o /dev/null -w "%{http_code}\n" http://172.22.156.32:4000/health
echo ""

echo "=== Firewall configuration complete! ==="
echo "You can now access the app from other devices on your subnet:"
echo "  Frontend: http://centos1.rajarora.csslab:5173"
echo "  Frontend: http://172.22.156.32:5173"
echo ""
echo "To verify from another device on the subnet, run:"
echo "  curl -I http://172.22.156.32:5173"

