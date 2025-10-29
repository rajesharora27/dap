#!/bin/bash
# Restart dnsmasq to clear DNS cache and apply configuration

echo "=== Current DNS resolution for centos1.rajarora.csslab ==="
nslookup centos1.rajarora.csslab 127.0.0.1 2>/dev/null || host centos1.rajarora.csslab
echo ""

echo "=== Restarting dnsmasq service ==="
sudo systemctl restart dnsmasq
echo ""

echo "=== Checking dnsmasq status ==="
sudo systemctl status dnsmasq --no-pager -l
echo ""

echo "=== Waiting 2 seconds for DNS to stabilize ==="
sleep 2
echo ""

echo "=== Testing DNS resolution after restart ==="
nslookup centos1.rajarora.csslab 127.0.0.1
echo ""

echo "=== Testing with dig ==="
dig @127.0.0.1 centos1.rajarora.csslab +short
echo ""

echo "=== DNS restart complete! ==="
echo ""
echo "Your hostname should now resolve to: 172.22.156.32"
echo ""
echo "Test from another device on subnet:"
echo "  nslookup centos1.rajarora.csslab"
echo "  curl -I http://centos1.rajarora.csslab:5173"
echo "  Browser: http://centos1.rajarora.csslab:5173"

