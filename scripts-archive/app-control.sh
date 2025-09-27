#!/bin/bash

#######################################################################################
# DAP Application Management Script
# 
# Manages all components of the DAP (Database Application Platform):
# - PostgreSQL Database (Docker container)
# - Backend GraphQL API (Node.js/TypeScript)
# - Frontend React App (Vite dev server)
# - All related processes and containers
#
# Usage: ./app-control.sh [start|stop|restart|status|reset]
#######################################################################################

set -e

# Configuration
APP_NAME="DAP Application"
DB_CONTAINER="dap_db_1"
BACKEND_PORT=4000
FRONTEND_PORT=5173
# Use the directory of this script as the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Dependency checks (Docker, Node.js, npm, lsof, pkill)
for dep in docker node npm lsof pkill; do
    if ! command -v $dep >/dev/null 2>&1; then
        echo "[ERROR] Required dependency '$dep' is not installed or not in PATH. Please install it before running this script."
        exit 1
    fi
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}${NC}"
    echo -e "${PURPLE}=== $1 ===${NC}"
    echo -e "${PURPLE}${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local service_name=$2
    
    if check_port $port; then
        log_info "Stopping $service_name on port $port..."
        local pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null || true)
        if [ ! -z "$pids" ]; then
            echo "$pids" | xargs kill -TERM 2>/dev/null || true
            sleep 2
            # Force kill if still running
            local remaining_pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null || true)
            if [ ! -z "$remaining_pids" ]; then
                echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true
            fi
            log_success "$service_name stopped"
        fi
    else
        log_info "$service_name not running on port $port"
    fi
}

# Function to kill Node.js processes related to the project
kill_node_processes() {
    log_info "Stopping all Node.js processes related to the project..."
    
    # Kill ts-node-dev processes
    pkill -f "ts-node-dev.*src/server.ts" 2>/dev/null || true
    
    # Kill vite processes
    pkill -f "vite.*--port.*5173" 2>/dev/null || true
    
    # Kill npm processes in project directories
    pkill -f "npm.*exec.*ts-node-dev" 2>/dev/null || true
    pkill -f "npm.*exec.*vite" 2>/dev/null || true
    
    # Give processes time to terminate gracefully
    sleep 2
    
    # Force kill any remaining processes on our ports
    kill_port $BACKEND_PORT "Backend API"
    kill_port $FRONTEND_PORT "Frontend Dev Server"
    
    log_success "Node.js processes stopped"
}

# Function to manage Docker containers
manage_docker() {
    local action=$1
    
    case $action in
        start)
            log_info "Starting PostgreSQL database container..."
            if docker ps -a --format "table {{.Names}}" | grep -q "^${DB_CONTAINER}$"; then
                if docker ps --format "table {{.Names}}" | grep -q "^${DB_CONTAINER}$"; then
                    log_info "Database container already running"
                else
                    docker start $DB_CONTAINER
                    log_success "Database container started"
                fi
            else
                log_error "Database container $DB_CONTAINER not found"
                log_info "Run 'docker-compose up -d db' to create the database container"
                return 1
            fi
            
            # Wait for database to be ready
            log_info "Waiting for database to be ready..."
            local max_attempts=30
            local attempt=1
            
            while [ $attempt -le $max_attempts ]; do
                if docker exec $DB_CONTAINER pg_isready -U postgres >/dev/null 2>&1; then
                    log_success "Database is ready"
                    break
                fi
                
                if [ $attempt -eq $max_attempts ]; then
                    log_error "Database failed to become ready within 30 seconds"
                    return 1
                fi
                
                echo -n "."
                sleep 1
                ((attempt++))
            done
            ;;
            
        stop)
            log_info "Stopping PostgreSQL database container..."
            if docker ps --format "table {{.Names}}" | grep -q "^${DB_CONTAINER}$"; then
                docker stop $DB_CONTAINER
                log_success "Database container stopped"
            else
                log_info "Database container not running"
            fi
            ;;
            
        status)
            if docker ps --format "table {{.Names}}" | grep -q "^${DB_CONTAINER}$"; then
                log_success "Database container is running"
                docker exec $DB_CONTAINER pg_isready -U postgres && log_success "Database is accepting connections"
            elif docker ps -a --format "table {{.Names}}" | grep -q "^${DB_CONTAINER}$"; then
                log_warning "Database container exists but is not running"
            else
                log_error "Database container not found"
            fi
            ;;
    esac
}

# Function to start backend
start_backend() {
    log_info "Starting Backend GraphQL API..."
    
    if check_port $BACKEND_PORT; then
        log_warning "Backend already running on port $BACKEND_PORT"
        return 0
    fi
    
    cd "$BACKEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_info "Installing backend dependencies..."
        npm install
    fi
    
    # Start backend in background
    log_info "Starting backend server on port $BACKEND_PORT..."
    nohup npm run dev > ../backend.log 2>&1 &
    local backend_pid=$!
    
    # Wait for backend to start
    local max_attempts=20
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $BACKEND_PORT; then
            log_success "Backend API started successfully (PID: $backend_pid)"
            log_info "Backend logs: tail -f $PROJECT_DIR/backend.log"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Backend failed to start within 20 seconds"
            return 1
        fi
        
        echo -n "."
        sleep 1
        ((attempt++))
    done
}

# Function to start frontend
start_frontend() {
    log_info "Starting Frontend React App..."
    
    if check_port $FRONTEND_PORT; then
        log_warning "Frontend already running on port $FRONTEND_PORT"
        return 0
    fi
    
    cd "$FRONTEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_info "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend in background
    log_info "Starting frontend dev server on port $FRONTEND_PORT..."
    nohup npm run dev > ../frontend.log 2>&1 &
    local frontend_pid=$!
    
    # Wait for frontend to start
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $FRONTEND_PORT; then
            log_success "Frontend dev server started successfully (PID: $frontend_pid)"
            log_info "Frontend logs: tail -f $PROJECT_DIR/frontend.log"
            log_success "Frontend available at: http://localhost:$FRONTEND_PORT"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Frontend failed to start within 30 seconds"
            return 1
        fi
        
        echo -n "."
        sleep 1
        ((attempt++))
    done
}

# Function to show application status
show_status() {
    log_header "APPLICATION STATUS"
    
    echo -e "${CYAN}Database (PostgreSQL):${NC}"
    manage_docker status
    
    echo -e "\n${CYAN}Backend API (GraphQL):${NC}"
    if check_port $BACKEND_PORT; then
        log_success "Backend running on port $BACKEND_PORT"
        log_info "API endpoint: http://localhost:$BACKEND_PORT/graphql"
    else
        log_error "Backend not running on port $BACKEND_PORT"
    fi
    
    echo -e "\n${CYAN}Frontend (React/Vite):${NC}"
    if check_port $FRONTEND_PORT; then
        log_success "Frontend running on port $FRONTEND_PORT"
        log_info "Web interface: http://localhost:$FRONTEND_PORT"
    else
        log_error "Frontend not running on port $FRONTEND_PORT"
    fi
    
    echo -e "\n${CYAN}Docker Containers:${NC}"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -1
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "dap_" || echo "No DAP containers found"
    
    echo -e "\n${CYAN}Active Node.js Processes:${NC}"
    ps aux | grep -E "(ts-node-dev|vite.*5173)" | grep -v grep || echo "No relevant Node.js processes found"
}

# Function to start all services
start_all() {
    log_header "STARTING $APP_NAME"
    
    # Start database
    manage_docker start || exit 1
    
    # Start backend
    start_backend || exit 1
    
    # Start frontend
    start_frontend || exit 1
    
    echo ""
    log_success "All services started successfully!"
    log_info "Database: PostgreSQL running in container"
    log_info "Backend API: http://localhost:$BACKEND_PORT/graphql"
    log_info "Frontend App: http://localhost:$FRONTEND_PORT"
    
    echo ""
    log_info "Use '$0 status' to check service status"
    log_info "Use '$0 stop' to stop all services"
}

# Function to stop all services
stop_all() {
    log_header "STOPPING $APP_NAME"
    
    # Stop Node.js processes
    kill_node_processes
    
    # Stop database
    manage_docker stop
    
    # Clean up any remaining Docker containers
    log_info "Stopping any remaining DAP containers..."
    docker stop $(docker ps -q --filter "name=dap_") 2>/dev/null || true
    
    log_success "All services stopped"
}

# Function to restart all services
restart_all() {
    log_header "RESTARTING $APP_NAME"
    
    stop_all
    echo ""
    sleep 2
    start_all
    
    echo ""
    log_header "BROWSER CACHE CLEARING"
    log_warning "If GUI still shows old data, clear your browser cache:"
    log_info "1. Open DevTools (F12)"
    log_info "2. Right-click refresh button → 'Empty Cache and Hard Reload'"
    log_info "3. Or press Ctrl+Shift+R (Linux) / Cmd+Shift+R (Mac)"
    log_info "4. Or open in Private/Incognito window"
    echo ""
    log_info "Frontend URL: http://localhost:5173"
}

# Function to provide cache clearing guidance
clear_cache_help() {
    log_header "BROWSER CACHE CLEARING GUIDE"
    
    log_info "If the GUI shows old data after restart, try these steps:"
    echo ""
    
    log_info "🔧 METHOD 1 - Hard Refresh:"
    echo "   • Press Ctrl+Shift+R (Linux/Windows) or Cmd+Shift+R (Mac)"
    echo "   • This bypasses cache for current page"
    echo ""
    
    log_info "🔧 METHOD 2 - DevTools Clear Cache:"
    echo "   • Open DevTools (F12)"
    echo "   • Right-click the refresh button"
    echo "   • Select 'Empty Cache and Hard Reload'"
    echo ""
    
    log_info "🔧 METHOD 3 - Private/Incognito Window:"
    echo "   • Ctrl+Shift+N (Chrome) or Ctrl+Shift+P (Firefox)"
    echo "   • Visit http://localhost:5173"
    echo "   • This uses no cache at all"
    echo ""
    
    log_info "🔧 METHOD 4 - Manual Browser Cache Clear:"
    echo "   • Chrome: Settings → Privacy → Clear browsing data"
    echo "   • Firefox: Settings → Privacy → Clear Data"
    echo "   • Select 'Cached images and files'"
    echo ""
    
    log_info "🔧 METHOD 5 - Disable Cache (Development):"
    echo "   • Open DevTools (F12)"
    echo "   • Go to Network tab"
    echo "   • Check 'Disable cache' option"
    echo "   • Keep DevTools open while browsing"
    echo ""
    
    log_success "Try these methods in order. Method 1 (Ctrl+Shift+R) usually works!"
    echo ""
    log_info "Frontend URL: http://localhost:5173"
}
# Function to reset everything (stop containers, remove them, and start fresh)
reset_all() {
    log_header "RESETTING $APP_NAME"
    log_warning "This will stop and remove all containers, then rebuild from scratch"
    
    printf "Are you sure you want to reset everything? (y/N): "
    read confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log_info "Reset cancelled"
        exit 0
    fi
    
    # Stop everything
    stop_all
    
    # Remove containers
    log_info "Removing DAP containers..."
    docker rm $(docker ps -aq --filter "name=dap_") 2>/dev/null || true
    
    # Remove images
    log_info "Removing DAP images..."
    docker rmi $(docker images --filter "reference=*dap*" -q) 2>/dev/null || true
    
    # Clean up logs
    log_info "Cleaning up logs..."
    rm -f $PROJECT_DIR/backend.log $PROJECT_DIR/frontend.log
    
    # Rebuild and start
    cd $PROJECT_DIR
    if [ -f "docker-compose.yml" ]; then
        log_info "Rebuilding with docker-compose..."
        docker-compose build --no-cache
        docker-compose up -d db
        
        # Wait a bit for DB to initialize
        sleep 5
        
        # Start services
        start_backend
        start_frontend
        
        log_success "Application reset and restarted successfully!"
    else
        log_warning "No docker-compose.yml found, starting services manually..."
        start_all
    fi
}

# Main script logic
main() {
    case "${1:-}" in
        start)
            start_all
            ;;
        stop)
            stop_all
            ;;
        restart)
            restart_all
            ;;
        status)
            show_status
            ;;
# Function to force restart with cache busting
force_restart() {
    log_header "FORCE RESTARTING $APP_NAME (CACHE BUSTING MODE)"
    log_warning "This performs a more aggressive restart to clear all possible caches"
    
    # Stop everything
    stop_all
    echo ""
    
    # Clear Vite cache
    log_info "Clearing Vite build cache..."
    rm -rf $FRONTEND_DIR/node_modules/.vite 2>/dev/null || true
    rm -rf $FRONTEND_DIR/dist 2>/dev/null || true
    
    # Clear any potential backend cache
    log_info "Clearing backend cache..."
    rm -rf $BACKEND_DIR/node_modules/.cache 2>/dev/null || true
    rm -rf $BACKEND_DIR/dist 2>/dev/null || true
    
    # Clean up logs to ensure fresh start
    rm -f $PROJECT_DIR/backend.log $PROJECT_DIR/frontend.log
    
    # Wait a bit longer for processes to fully terminate
    log_info "Waiting for processes to fully terminate..."
    sleep 5
    
    # Start with fresh environment
    start_all
    
    echo ""
    log_header "BROWSER CACHE CLEARING REQUIRED"
    log_warning "⚠️  Your browser may still show cached data. You MUST:"
    log_success "1. Press Ctrl+Shift+R to hard refresh"
    log_success "2. Or open in private/incognito window"
    log_info "Frontend URL: http://localhost:5173"
}
            reset_all
            ;;
        *)
            echo -e "${PURPLE}$APP_NAME Control Script${NC}"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo -e "  ${GREEN}start${NC}   - Start all application components"
            echo -e "  ${RED}stop${NC}    - Stop all application components"
            echo -e "  ${YELLOW}restart${NC} - Restart all application components"
            echo -e "  ${BLUE}status${NC}  - Show status of all components"
            echo -e "  ${CYAN}cache${NC}   - Show browser cache clearing guide"
            echo -e "  ${PURPLE}reset${NC}   - Reset everything (containers, images, logs)"
            echo ""
            echo "Components managed:"
            echo "  - PostgreSQL Database (Docker container)"
            echo "  - Backend GraphQL API (Node.js on port $BACKEND_PORT)"
            echo "  - Frontend React App (Vite on port $FRONTEND_PORT)"
            echo ""
            echo "Examples:"
            echo "  $0 start    # Start all services"
            echo "  $0 status   # Check what's running"
            echo "  $0 restart  # Restart everything"
            ;;
    esac
}

# Check if script is run with sudo (not recommended)
if [ "$EUID" -eq 0 ]; then
    log_warning "Running as root is not recommended. Consider running as a regular user."
fi

# Change to project directory
cd "$PROJECT_DIR"

# Run main function with all arguments
main "$@"