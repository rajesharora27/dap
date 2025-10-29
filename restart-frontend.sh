#!/bin/bash
# Restart the Vite frontend server to apply configuration changes

echo "=== Finding Vite process ==="
ps aux | grep vite | grep -v grep

echo ""
echo "=== Stopping Vite server ==="
pkill -f "vite" || echo "No Vite process found"

echo ""
echo "=== Waiting 2 seconds ==="
sleep 2

echo ""
echo "=== Starting Vite server ==="
cd /data/dap/frontend
nohup npm run dev > /tmp/vite.log 2>&1 &

echo ""
echo "=== Waiting for server to start ==="
sleep 3

echo ""
echo "=== Checking if Vite is running ==="
ps aux | grep vite | grep -v grep

echo ""
echo "=== Testing frontend access ==="
echo -n "Localhost: "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/

echo -n "IP (172.22.156.32): "
curl -s -o /dev/null -w "%{http_code}\n" http://172.22.156.32:5173/

echo -n "Hostname (centos1.rajarora.csslab): "
curl -s -o /dev/null -w "%{http_code}\n" http://centos1.rajarora.csslab:5173/

echo ""
echo "=== Frontend restart complete! ==="
echo ""
echo "Check logs with: tail -f /tmp/vite.log"
echo "Try accessing: http://centos1.rajarora.csslab:5173"

