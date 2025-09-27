# DAP Application Management

This repository includes a comprehensive application management script for the DAP (Database Application Platform).

## Quick Start

```bash
# Make script executable (first time only)
chmod +x app-control.sh

# Start all services
./app-control.sh start

# Check status
./app-control.sh status

# Restart everything
./app-control.sh restart

# Stop all services
./app-control.sh stop
```

## Components Managed

The `app-control.sh` script manages these components:

1. **PostgreSQL Database** - Docker container (`dap_db_1`)
2. **Backend GraphQL API** - Node.js/TypeScript server (port 4000)
3. **Frontend React App** - Vite development server (port 5173)

## Available Commands

### `./app-control.sh start`
- Starts PostgreSQL database container
- Starts backend GraphQL API on port 4000
- Starts frontend React app on port 5173
- Waits for each service to be ready before proceeding
- Shows service URLs when complete

### `./app-control.sh stop`
- Gracefully stops all Node.js processes
- Stops PostgreSQL database container
- Cleans up any remaining processes
- Force-kills stuck processes if needed

### `./app-control.sh restart`
- Performs a complete stop followed by start
- **Use this when GUI shows old data** - it refreshes all connections
- Useful for applying configuration changes
- Resolves most caching/synchronization issues

### `./app-control.sh status`
- Shows detailed status of all components
- Displays service URLs and endpoints
- Lists active Docker containers
- Shows running Node.js processes
- Use this for debugging and monitoring

### `./app-control.sh reset`
- **DESTRUCTIVE** - Stops and removes all containers
- Removes Docker images and cleans up logs
- Rebuilds everything from scratch
- Use only when containers are corrupted

## Service URLs

After starting, these services will be available:

- **Frontend Web App**: http://localhost:5173
- **Backend GraphQL API**: http://localhost:4000/graphql
- **Database**: PostgreSQL on localhost:5432

## Logs

When services are running in the background, logs are saved to:
- Backend: `/home/rajarora/dap/backend.log`
- Frontend: `/home/rajarora/dap/frontend.log`

View logs in real-time:
```bash
# Backend logs
tail -f backend.log

# Frontend logs  
tail -f frontend.log
```

## Troubleshooting

### GUI Shows Old Data
```bash
./app-control.sh restart
```
This completely restarts all services and refreshes all connections.

### Port Already in Use
```bash
./app-control.sh stop
./app-control.sh start
```
The stop command will kill processes using ports 4000 and 5173.

### Database Connection Issues
```bash
./app-control.sh status
```
Check if database container is running and accepting connections.

### Services Won't Start
```bash
# Check for missing dependencies
cd backend && npm install
cd ../frontend && npm install

# Try reset if containers are corrupted
./app-control.sh reset
```

### Clean Slate Reset
```bash
./app-control.sh reset
```
This removes all containers and rebuilds from scratch.

## Development Workflow

### Daily Development
```bash
# Start your work session
./app-control.sh start

# Check everything is running
./app-control.sh status

# End your work session
./app-control.sh stop
```

### When Things Get Stuck
```bash
# First try restart
./app-control.sh restart

# If that doesn't work, check status
./app-control.sh status

# Nuclear option - full reset
./app-control.sh reset
```

### Testing Changes
```bash
# Restart to pick up backend changes
./app-control.sh restart

# Check logs if something is wrong
tail -f backend.log
tail -f frontend.log
```

## Features

- **Colored Output**: Easy to read status messages
- **Error Handling**: Graceful failure handling and recovery
- **Port Management**: Automatically kills stuck processes
- **Health Checks**: Waits for services to be ready
- **Background Logging**: Captures output for debugging
- **Docker Integration**: Manages containers and health status
- **Process Cleanup**: Finds and kills related processes
- **Safety Checks**: Confirms destructive operations

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/Vite)  │───▶│   (GraphQL)     │───▶│  (PostgreSQL)   │
│   Port 5173     │    │   Port 4000     │    │   Port 5432     │
│   Node.js       │    │   Node.js       │    │   Docker        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

The script manages all three components as a cohesive application stack.