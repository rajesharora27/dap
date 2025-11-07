#!/bin/bash
# Script to restart the backend server

echo "Killing existing backend processes..."
pkill -9 -f "ts-node-dev.*server.ts"
sleep 2

echo "Starting backend server..."
cd /data/dap/backend
nohup npm run dev > /tmp/backend_restart_$(date +%s).log 2>&1 &

sleep 5
echo "Backend server starting... Check logs at: /tmp/backend_restart_*.log"
echo "Tailing latest log:"
tail -30 /tmp/backend_restart_*.log | tail -30



