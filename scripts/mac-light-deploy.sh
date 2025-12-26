#!/bin/bash
#
# Mac-only lightweight production-style deploy for demos.
# - Builds backend/frontend in production mode
# - Uses local PostgreSQL (via Homebrew) - NO Docker required
# - Starts backend on port 4000 and serves built frontend via Vite preview on 5173
# - Uses .env as the environment file (synced to backend/.env)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"
LOG_DIR="${ROOT_DIR}/tmp"
mkdir -p "${LOG_DIR}"

BACKEND_PID_FILE="${LOG_DIR}/mac-backend.pid"
FRONTEND_PID_FILE="${LOG_DIR}/mac-frontend.pid"

# Environment file location
MAC_ENV_FILE="${ROOT_DIR}/.env"

BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
DATABASE_URL="${DATABASE_URL:-}"

# PostgreSQL settings for local install
PG_USER="${PG_USER:-dap}"
PG_DB="${PG_DB:-dap}"
PG_PORT="${PG_PORT:-5432}"

require() {
  local dep=$1
  if ! command -v "$dep" >/dev/null 2>&1; then
    echo "[ERROR] Missing dependency: $dep" >&2
    exit 1
  fi
}

check_dependencies() {
  for dep in node npm lsof; do
    require "$dep"
  done
}

# Detect which PostgreSQL version is installed via Homebrew
detect_postgres_version() {
  local pg_version=""
  
  # Check for installed PostgreSQL versions (prefer newer)
  if brew list postgresql@16 >/dev/null 2>&1; then
    pg_version="postgresql@16"
  elif brew list postgresql@15 >/dev/null 2>&1; then
    pg_version="postgresql@15"
  elif brew list postgresql@14 >/dev/null 2>&1; then
    pg_version="postgresql@14"
  elif brew list postgresql >/dev/null 2>&1; then
    pg_version="postgresql"
  fi
  
  echo "$pg_version"
}

# Get PostgreSQL data directory for the installed version
get_postgres_data_dir() {
  local pg_version="$1"
  local data_dir=""
  
  # Check common locations
  if [ -d "/opt/homebrew/var/${pg_version}" ]; then
    data_dir="/opt/homebrew/var/${pg_version}"
  elif [ -d "/usr/local/var/${pg_version}" ]; then
    data_dir="/usr/local/var/${pg_version}"
  elif [ -d "/opt/homebrew/var/postgres" ]; then
    data_dir="/opt/homebrew/var/postgres"
  elif [ -d "/usr/local/var/postgres" ]; then
    data_dir="/usr/local/var/postgres"
  fi
  
  echo "$data_dir"
}

# Clean up stale PostgreSQL lock files
cleanup_postgres_locks() {
  local pg_version="$1"
  local data_dir
  data_dir=$(get_postgres_data_dir "$pg_version")
  
  if [ -z "$data_dir" ]; then
    echo "[WARN] Could not find PostgreSQL data directory"
    return 1
  fi
  
  local pid_file="${data_dir}/postmaster.pid"
  
  if [ -f "$pid_file" ]; then
    local stale_pid
    stale_pid=$(head -1 "$pid_file" 2>/dev/null || echo "")
    
    if [ -n "$stale_pid" ]; then
      # Check if the PID is still a postgres process
      local proc_name
      proc_name=$(ps -p "$stale_pid" -o comm= 2>/dev/null || echo "")
      
      if [ -z "$proc_name" ] || [[ "$proc_name" != *"postgres"* ]]; then
        echo "[INFO] Found stale PostgreSQL lock file (PID $stale_pid is not postgres)"
        echo "[INFO] Removing stale lock file: $pid_file"
        rm -f "$pid_file"
        
        # Also remove any socket files in /tmp
        rm -f /tmp/.s.PGSQL.${PG_PORT}* 2>/dev/null || true
        
        echo "[INFO] Stale lock files cleaned up"
        return 0
      fi
    fi
  fi
  
  return 1
}

ensure_postgres() {
  echo "[INFO] Checking PostgreSQL installation..."
  
  # Detect installed PostgreSQL version
  local pg_version
  pg_version=$(detect_postgres_version)
  
  # Check if postgres is installed
  if ! command -v psql >/dev/null 2>&1; then
    echo "[INFO] PostgreSQL not found. Installing via Homebrew..."
    
    # Check if Homebrew is installed
    if ! command -v brew >/dev/null 2>&1; then
      echo "[ERROR] Homebrew is not installed."
      echo "       Install Homebrew first: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
      exit 1
    fi
    
    brew install postgresql@16
    pg_version="postgresql@16"
    
    # Add to PATH if needed
    if ! command -v psql >/dev/null 2>&1; then
      echo "[INFO] Adding PostgreSQL to PATH..."
      export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
    fi
  fi
  
  # Verification of 'dap' user role
  if ! psql -h localhost -p "${PG_PORT}" -U "${PG_USER}" -d postgres -c "SELECT 1" >/dev/null 2>&1; then
    echo "[WARN] Could not connect as '${PG_USER}'. Please run:"
    echo "       sudo ./backend/scripts/setup-permissions.sh"
    echo ""
  fi
  
  if [ -z "$pg_version" ]; then
    pg_version=$(detect_postgres_version)
  fi
  
  echo "[INFO] Detected PostgreSQL version: ${pg_version:-unknown}"
  
  # Check if postgres service is running
  if ! pg_isready -h localhost -p "${PG_PORT}" >/dev/null 2>&1; then
    echo "[INFO] PostgreSQL not responding, attempting to start..."
    
    # First, check for and clean up stale lock files
    if cleanup_postgres_locks "$pg_version"; then
      echo "[INFO] Cleaned stale lock files, now starting PostgreSQL..."
    fi
    
    # Stop the service first to ensure clean state
    if command -v brew >/dev/null 2>&1 && [ -n "$pg_version" ]; then
      echo "[INFO] Stopping any existing PostgreSQL service..."
      brew services stop "$pg_version" 2>/dev/null || true
      sleep 1
    fi
    
    # Start PostgreSQL service
    echo "[INFO] Starting PostgreSQL service (${pg_version})..."
    if command -v brew >/dev/null 2>&1; then
      if [ -n "$pg_version" ]; then
        brew services start "$pg_version" 2>/dev/null || true
      else
        brew services start postgresql@16 2>/dev/null || \
        brew services start postgresql@14 2>/dev/null || \
        brew services start postgresql 2>/dev/null || true
      fi
    fi
    
    # Wait for postgres to start
    local attempts=0
    local max_attempts=30
    while (( attempts < max_attempts )); do
      if pg_isready -h localhost -p "${PG_PORT}" >/dev/null 2>&1; then
        echo "[INFO] PostgreSQL is running."
        break
      fi
      attempts=$((attempts + 1))
      sleep 1
    done
    
    # If still not running, try lock cleanup and restart one more time
    if ! pg_isready -h localhost -p "${PG_PORT}" >/dev/null 2>&1; then
      echo "[WARN] PostgreSQL failed to start, attempting lock cleanup and retry..."
      
      # Force stop and cleanup
      if [ -n "$pg_version" ]; then
        brew services stop "$pg_version" 2>/dev/null || true
        sleep 1
        cleanup_postgres_locks "$pg_version"
        sleep 1
        brew services start "$pg_version" 2>/dev/null || true
        
        # Wait again
        attempts=0
        while (( attempts < 15 )); do
          if pg_isready -h localhost -p "${PG_PORT}" >/dev/null 2>&1; then
            echo "[INFO] PostgreSQL is running after lock cleanup."
            break
          fi
          attempts=$((attempts + 1))
          sleep 1
        done
      fi
    fi
    
    if ! pg_isready -h localhost -p "${PG_PORT}" >/dev/null 2>&1; then
      echo "[ERROR] Failed to start PostgreSQL. Try manually:"
      echo "       brew services stop ${pg_version:-postgresql}"
      echo "       rm -f $(get_postgres_data_dir "$pg_version")/postmaster.pid"
      echo "       brew services start ${pg_version:-postgresql}"
      exit 1
    fi
  else
    echo "[INFO] PostgreSQL is already running."
  fi
  
  # Ensure the database exists
  echo "[INFO] Ensuring database '${PG_DB}' exists..."
  
  # Get the current macOS username for postgres connection
  local current_user=$(whoami)
  
  # Try to create database (will fail silently if exists)
  # Use PG_USER instead of current user for ownership consistency
  createdb -h localhost -p "${PG_PORT}" -U "${PG_USER}" "${PG_DB}" 2>/dev/null || \
  createdb -h localhost -p "${PG_PORT}" "${PG_DB}" 2>/dev/null || true
  
  # Check if database exists
  if psql -h localhost -p "${PG_PORT}" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "${PG_DB}"; then
    echo "[INFO] Database '${PG_DB}' is ready."
  else
    echo "[ERROR] Could not create or access database '${PG_DB}'."
    echo "       Try manually: createdb ${PG_DB}"
    exit 1
  fi
}

sync_env_file() {
  local current_user=$(whoami)
  
  if [ -f "${MAC_ENV_FILE}" ]; then
    echo "[INFO] Syncing .env to backend/.env and frontend/.env"
    
    # Check if __MACUSER__ placeholder exists and needs replacement
    if grep -q "__MACUSER__" "${MAC_ENV_FILE}"; then
        # Create a temp copy for backend usage
        sed "s/__MACUSER__/${current_user}/g" "${MAC_ENV_FILE}" > "${BACKEND_DIR}/.env"
        sed "s/__MACUSER__/${current_user}/g" "${MAC_ENV_FILE}" > "${FRONTEND_DIR}/.env"
    else
        cp "${MAC_ENV_FILE}" "${BACKEND_DIR}/.env"
        cp "${MAC_ENV_FILE}" "${FRONTEND_DIR}/.env"
    fi
    echo "[INFO] Environment synced"
  else
    echo "[WARN] .env not found, checking for .env.example..."
    if [ -f "${ROOT_DIR}/.env.example" ]; then
        echo "[INFO] Creating .env from .env.example..."
        cp "${ROOT_DIR}/.env.example" "${MAC_ENV_FILE}"
        echo "[INFO] Please configure .env for your environment!"
        cp "${MAC_ENV_FILE}" "${BACKEND_DIR}/.env"
        cp "${MAC_ENV_FILE}" "${FRONTEND_DIR}/.env"
    fi
  fi
}

get_env_val() {
  local key=$1
  if [ -f "${MAC_ENV_FILE}" ]; then
    grep "^${key}=" "${MAC_ENV_FILE}" | cut -d '=' -f2- || echo ""
  else
    echo ""
  fi
}

resolve_database_url() {
  # For Homebrew PostgreSQL, use current macOS username (peer auth, no password)
  local current_user=$(whoami)
  
  # If already set via environment, use it
  if [ -n "${DATABASE_URL:-}" ]; then
    echo "[INFO] Using DATABASE_URL from environment"
    return
  fi

  # Read from backend/.env (already set by sync_env_file)
  if [ -f "${BACKEND_DIR}/.env" ]; then
    local line
    line=$(grep -E '^DATABASE_URL=' "${BACKEND_DIR}/.env" | head -n 1 || true)
    if [ -n "$line" ]; then
      DATABASE_URL="${line#DATABASE_URL=}"
      echo "[INFO] Using DATABASE_URL from backend/.env"
      return
    fi
  fi

  # Fallback: construct URL with standard dap user
  # We assume setup-permissions.sh has been run or will be run
  DATABASE_URL="postgresql://${PG_USER}:DAP123!!!@localhost:${PG_PORT}/${PG_DB}?schema=public&connection_limit=5"
  echo "[INFO] Using local PostgreSQL as user '${PG_USER}': ${PG_DB}@localhost:${PG_PORT}"
}

install_deps() {
  if [ ! -d "${BACKEND_DIR}/node_modules" ]; then
    echo "[INFO] Installing backend dependencies..."
    (cd "${BACKEND_DIR}" && npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund)
  fi
  if [ ! -d "${FRONTEND_DIR}/node_modules" ]; then
    echo "[INFO] Installing frontend dependencies..."
    (cd "${FRONTEND_DIR}" && npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund)
  fi
}

run_migrations() {
  echo "[INFO] Syncing database schema (matching production behavior)..."
  (cd "${BACKEND_DIR}" && DATABASE_URL="${DATABASE_URL}" npx prisma db push --accept-data-loss)
}

seed_light_data() {
  echo "[INFO] Seeding light demo data..."
  # Don't suppress output so user can see generated passwords
  (cd "${BACKEND_DIR}" && DATABASE_URL="${DATABASE_URL}" npm run seed:light-demo)
}

build_backend() {
  echo "[INFO] Building backend (production)..."
  # Use build instead of build:prod (which tries to copy non-existent .env.production)
  (cd "${BACKEND_DIR}" && DATABASE_URL="${DATABASE_URL}" npm run build >/dev/null)
}

build_frontend() {
  echo "[INFO] Building frontend (production)..."
  
  # Read settings from config file or default
  local show_dev=$(get_env_val "SHOW_DEV_MENU")
  [ -z "$show_dev" ] && show_dev="false"
  
  local fe_url=$(get_env_val "FRONTEND_URL")
  [ -z "$fe_url" ] && fe_url="http://localhost:${FRONTEND_PORT}"

  # Read Vite settings from .env (allows per-environment configuration)
  local base_path=$(get_env_val "VITE_BASE_PATH")
  [ -z "$base_path" ] && base_path="/"
  
  local gql_endpoint=$(get_env_val "VITE_GRAPHQL_ENDPOINT")
  [ -z "$gql_endpoint" ] && gql_endpoint="/graphql"

  echo "[INFO] Config: VITE_BASE_PATH=${base_path}, SHOW_DEV_MENU=${show_dev}, FRONTEND_URL=${fe_url}"

  (cd "${FRONTEND_DIR}" && VITE_BASE_PATH="$base_path" VITE_GRAPHQL_ENDPOINT="$gql_endpoint" VITE_FRONTEND_URL="${fe_url}" VITE_SHOW_DEV_MENU="${show_dev}" npm run build >/dev/null)
}



stop_process() {
  local pid_file=$1
  local name=$2
  if [ -f "$pid_file" ]; then
    local pid
    pid=$(cat "$pid_file")
    if ps -p "$pid" >/dev/null 2>&1; then
      echo "[INFO] Stopping $name (pid $pid)..."
      kill "$pid" >/dev/null 2>&1 || true
      sleep 1
    fi
    rm -f "$pid_file"
  fi
  
  # Also kill by port as backup
  local port
  case "$name" in
    backend) port="${BACKEND_PORT}" ;;
    frontend) port="${FRONTEND_PORT}" ;;
  esac
  
  if [ -n "$port" ]; then
    local pids=$(lsof -ti ":${port}" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "$pids" | xargs kill 2>/dev/null || true
    fi
  fi
}

start_backend() {
  if lsof -Pi ":${BACKEND_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[INFO] Backend already listening on ${BACKEND_PORT}"
    return
  fi
  echo "[INFO] Starting backend on ${BACKEND_PORT}..."
  
  # Run as current user (developer)
  # Standardize on using 'node' from the current PATH which includes the user's environment
  (cd "${BACKEND_DIR}" && DATABASE_URL="${DATABASE_URL}" NODE_ENV=production nohup node dist/server.js > "${LOG_DIR}/mac-backend.log" 2>&1 & echo $! > "${BACKEND_PID_FILE}")
  
  # Wait for backend to start
  local attempts=0
  while (( attempts < 30 )); do
    if lsof -Pi ":${BACKEND_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "[INFO] Backend started successfully."
      return
    fi
    attempts=$((attempts + 1))
    sleep 1
  done
  echo "[WARN] Backend may not have started. Check ${LOG_DIR}/mac-backend.log"
}

start_frontend() {
  if lsof -Pi ":${FRONTEND_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[INFO] Frontend already listening on ${FRONTEND_PORT}"
    return
  fi
  echo "[INFO] Starting frontend preview on ${FRONTEND_PORT}..."
  
  # Read settings again for runtime
  local show_dev=$(get_env_val "SHOW_DEV_MENU")
  [ -z "$show_dev" ] && show_dev="false"
  
  local fe_url=$(get_env_val "FRONTEND_URL")
  [ -z "$fe_url" ] && fe_url="http://localhost:${FRONTEND_PORT}"

  # Read Vite settings from .env
  local base_path=$(get_env_val "VITE_BASE_PATH")
  [ -z "$base_path" ] && base_path="/"
  
  local gql_endpoint=$(get_env_val "VITE_GRAPHQL_ENDPOINT")
  [ -z "$gql_endpoint" ] && gql_endpoint="/graphql"

  (cd "${FRONTEND_DIR}" && VITE_BASE_PATH="$base_path" VITE_GRAPHQL_ENDPOINT="$gql_endpoint" VITE_FRONTEND_URL="${fe_url}" VITE_SHOW_DEV_MENU="${show_dev}" nohup npm run preview -- --host --port "${FRONTEND_PORT}" > "${LOG_DIR}/mac-frontend.log" 2>&1 & echo $! > "${FRONTEND_PID_FILE}")
  
  # Wait for frontend to start
  local attempts=0
  while (( attempts < 20 )); do
    if lsof -Pi ":${FRONTEND_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "[INFO] Frontend started successfully."
      return
    fi
    attempts=$((attempts + 1))
    sleep 1
  done
  echo "[WARN] Frontend may not have started. Check ${LOG_DIR}/mac-frontend.log"
}

start_stack() {
  check_dependencies
  sync_env_file
  ensure_postgres
  resolve_database_url
  install_deps
  run_migrations
  # NOTE: Database is NOT seeded on start - use 'reset' command to seed/reset data
  build_backend
  build_frontend
  start_backend
  start_frontend
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "[SUCCESS] Mac demo stack is up!"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "   🌐 Frontend:  http://localhost:${FRONTEND_PORT}"
  echo "   🔌 API:       http://localhost:${BACKEND_PORT}/graphql"
  echo ""
  echo "   💡 Use './dap reset' to reset database with demo data"
  echo ""
}

reset_database() {
  check_dependencies
  sync_env_file
  ensure_postgres
  resolve_database_url
  echo "[INFO] Resetting database and seeding demo data..."
  seed_light_data
  echo ""
  echo "[SUCCESS] Database reset complete!"
  echo ""
  echo "   🔐 Login credentials:"
  echo "      admin    / DAP123!!!"
  echo "      smeuser  / DAP123"
  echo "      cssuser  / DAP123"
  echo ""
}

stop_stack() {
  stop_process "${BACKEND_PID_FILE}" "backend"
  stop_process "${FRONTEND_PID_FILE}" "frontend"
  
  local pg_version
  pg_version=$(detect_postgres_version)
  
  echo "[SUCCESS] Mac demo stack stopped."
  echo "          (PostgreSQL still running - use 'brew services stop ${pg_version:-postgresql}' to stop it)"
}

status_stack() {
  echo "PostgreSQL: $(pg_isready -h localhost -p ${PG_PORT} >/dev/null 2>&1 && echo 'running' || echo 'stopped')"
  if lsof -Pi ":${BACKEND_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Backend: listening on ${BACKEND_PORT}"
  else
    echo "Backend: not running"
  fi
  if lsof -Pi ":${FRONTEND_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Frontend: listening on ${FRONTEND_PORT}"
  else
    echo "Frontend: not running"
  fi
}

case "${1:-start}" in
  start)
    start_stack
    ;;
  stop)
    stop_stack
    ;;
  restart)
    stop_stack
    sleep 2
    start_stack
    ;;
  status)
    status_stack
    ;;
  reset)
    reset_database
    ;;
  *)
    echo "Usage: $0 [start|stop|restart|status|reset]"
    echo ""
    echo "Commands:"
    echo "  start   - Start the demo stack (does NOT reset database)"
    echo "  stop    - Stop the demo stack"
    echo "  restart - Restart the demo stack (does NOT reset database)"
    echo "  status  - Show status of services"
    echo "  reset   - Reset database and seed with demo data"
    exit 1
    ;;
esac
