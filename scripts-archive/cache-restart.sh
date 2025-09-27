#!/bin/bash

# Quick Cache-Busting Restart Script
# Use this when GUI shows old data

echo "🔄 CACHE-BUSTING RESTART"
echo "======================="

# Stop frontend and backend processes
echo "Stopping services..."
pkill -f "ts-node-dev.*src/server.ts" 2>/dev/null || true
pkill -f "vite.*--port.*5173" 2>/dev/null || true
lsof -Pi :4000 -sTCP:LISTEN -t 2>/dev/null | xargs kill 2>/dev/null || true
lsof -Pi :5173 -sTCP:LISTEN -t 2>/dev/null | xargs kill 2>/dev/null || true

sleep 3

# Clear Vite cache
echo "Clearing Vite cache..."
rm -rf /home/rajarora/dap/frontend/node_modules/.vite 2>/dev/null || true
rm -rf /home/rajarora/dap/frontend/dist 2>/dev/null || true

# Clear logs
rm -f /home/rajarora/dap/backend.log /home/rajarora/dap/frontend.log

# Start backend
echo "Starting backend..."
cd /home/rajarora/dap/backend
nohup npm run dev > ../backend.log 2>&1 &

# Wait for backend
sleep 3

# Start frontend  
echo "Starting frontend..."
cd /home/rajarora/dap/frontend
nohup npm run dev > ../frontend.log 2>&1 &

# Wait for frontend
sleep 5

echo ""
echo "✅ Services restarted with cache clearing!"
echo ""
echo "🔧 IMPORTANT: You must clear browser cache:"
echo "   1. Press Ctrl+Shift+R (hard refresh)"
echo "   2. Or open private window: Ctrl+Shift+N"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 Backend:  http://localhost:4000/graphql"