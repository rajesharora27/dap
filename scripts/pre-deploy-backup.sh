#!/bin/bash
# =============================================================================
# Pre-Deployment Backup Script
# =============================================================================
# Creates a database backup before deployment to enable rollback if needed.
# 
# Usage:
#   ./scripts/pre-deploy-backup.sh [--skip-if-recent MINUTES]
#
# Options:
#   --skip-if-recent MINUTES  Skip backup if one exists within MINUTES (default: 60)
#
# Exit Codes:
#   0 - Backup successful (or skipped due to recent backup)
#   1 - Backup failed
#   2 - Server not running
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/temp/backups"
SKIP_IF_RECENT_MINUTES=60

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-if-recent)
      SKIP_IF_RECENT_MINUTES="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "=========================================="
echo "  Pre-Deployment Backup"
echo "=========================================="
echo ""

# Check if backend is running
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
log_info "Checking backend server at $BACKEND_URL..."

if ! curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
  log_error "Backend server is not running at $BACKEND_URL"
  log_info "Start the server with: ./dap start"
  exit 2
fi

log_success "Backend server is running"

# Check for recent backups
if [ -d "$BACKUP_DIR" ]; then
  RECENT_BACKUP=$(find "$BACKUP_DIR" -name "*.sql" -mmin -"$SKIP_IF_RECENT_MINUTES" -type f 2>/dev/null | head -1)
  if [ -n "$RECENT_BACKUP" ]; then
    log_warn "Recent backup found (within $SKIP_IF_RECENT_MINUTES minutes):"
    log_info "  $(basename "$RECENT_BACKUP")"
    log_info "Skipping backup creation. Use --skip-if-recent 0 to force."
    exit 0
  fi
fi

# Get admin token (requires ADMIN_USERNAME and ADMIN_PASSWORD env vars)
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

if [ -z "$ADMIN_PASSWORD" ]; then
  log_warn "ADMIN_PASSWORD not set. Attempting backup without authentication..."
  AUTH_HEADER=""
else
  log_info "Authenticating as $ADMIN_USERNAME..."
  
  LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/graphql" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"mutation { login(username: \\\"$ADMIN_USERNAME\\\", password: \\\"$ADMIN_PASSWORD\\\") { token } }\"}")
  
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    log_error "Authentication failed. Check ADMIN_USERNAME and ADMIN_PASSWORD."
    echo "$LOGIN_RESPONSE"
    exit 1
  fi
  
  AUTH_HEADER="Authorization: Bearer $TOKEN"
  log_success "Authenticated successfully"
fi

# Create backup
log_info "Creating database backup..."

if [ -n "$AUTH_HEADER" ]; then
  BACKUP_RESPONSE=$(curl -s -X POST "$BACKEND_URL/graphql" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"query":"mutation { createBackup { success filename size message error metadata { recordCounts { users products solutions customers tasks } } } }"}')
else
  BACKUP_RESPONSE=$(curl -s -X POST "$BACKEND_URL/graphql" \
    -H "Content-Type: application/json" \
    -d '{"query":"mutation { createBackup { success filename size message error metadata { recordCounts { users products solutions customers tasks } } } }"}')
fi

# Parse response
SUCCESS=$(echo "$BACKUP_RESPONSE" | grep -o '"success":true' || true)
FILENAME=$(echo "$BACKUP_RESPONSE" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)
SIZE=$(echo "$BACKUP_RESPONSE" | grep -o '"size":[0-9]*' | cut -d':' -f2)
ERROR=$(echo "$BACKUP_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SUCCESS" ]; then
  log_error "Backup failed!"
  if [ -n "$ERROR" ]; then
    log_error "Error: $ERROR"
  else
    echo "$BACKUP_RESPONSE"
  fi
  exit 1
fi

# Format size
if [ -n "$SIZE" ]; then
  if [ "$SIZE" -lt 1024 ]; then
    SIZE_FMT="${SIZE} B"
  elif [ "$SIZE" -lt 1048576 ]; then
    SIZE_FMT="$(echo "scale=2; $SIZE/1024" | bc) KB"
  else
    SIZE_FMT="$(echo "scale=2; $SIZE/1048576" | bc) MB"
  fi
else
  SIZE_FMT="unknown"
fi

echo ""
log_success "Backup created successfully!"
echo ""
echo "  Filename: $FILENAME"
echo "  Size:     $SIZE_FMT"
echo "  Location: $BACKUP_DIR/$FILENAME"
echo ""

# Verify backup file exists
if [ -f "$BACKUP_DIR/$FILENAME" ]; then
  log_success "Backup file verified on disk"
else
  log_warn "Backup file not found at expected location"
fi

echo ""
echo "=========================================="
echo "  Backup Complete - Safe to Deploy"
echo "=========================================="
echo ""
echo "To rollback after deployment:"
echo "  1. Go to Admin → Backup & Restore"
echo "  2. Select backup: $FILENAME"
echo "  3. Click 'Restore'"
echo ""

exit 0
