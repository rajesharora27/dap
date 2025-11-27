#!/bin/bash
#===============================================================================
# DAP Code Sync Script
# Quickly sync code changes from centos1 to centos2 without full rebuild
# Useful for hot-fixes and minor changes
# SSH as rajarora, run app as dap user
#===============================================================================

set -e

PROD_HOST="172.22.156.33"
SSH_USER="rajarora"
DAP_USER="dap"
SOURCE_DIR="/data/dap"
PROD_APP_DIR="/data/dap/app"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

show_help() {
    cat << EOF
DAP Code Sync - Quick sync without full rebuild

Usage: $(basename $0) [component] [options]

Components:
  backend         Sync backend changes only
  frontend        Sync frontend changes only  
  all             Sync both (default)
  config          Sync configuration only

Options:
  --no-restart    Don't restart after sync
  --build         Rebuild before syncing
  -h, --help      Show this help

Examples:
  $(basename $0) backend          # Sync backend, restart
  $(basename $0) frontend --build # Rebuild frontend, sync
  $(basename $0) all --no-restart # Sync all, no restart

EOF
}

sync_backend() {
    local build=$1
    local restart=$2

    log_info "Syncing backend..."
    
    if [[ "$build" == "true" ]]; then
        log_info "Building backend..."
        cd ${SOURCE_DIR}/backend
        npm run build
    fi

    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.env*' \
        -e "ssh" \
        ${SOURCE_DIR}/backend/dist/ \
        ${SSH_USER}@${PROD_HOST}:${PROD_APP_DIR}/backend/dist/

    rsync -avz \
        -e "ssh" \
        ${SOURCE_DIR}/backend/prisma/ \
        ${SSH_USER}@${PROD_HOST}:${PROD_APP_DIR}/backend/prisma/

    # Fix ownership
    ssh ${SSH_USER}@${PROD_HOST} "sudo chown -R ${DAP_USER}:${DAP_USER} ${PROD_APP_DIR}/backend"

    if [[ "$restart" == "true" ]]; then
        log_info "Restarting backend..."
        ssh ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} pm2 restart dap-backend"
    fi

    log_success "Backend synced"
}

sync_frontend() {
    local build=$1
    local restart=$2

    log_info "Syncing frontend..."
    
    if [[ "$build" == "true" ]]; then
        log_info "Building frontend..."
        cd ${SOURCE_DIR}/frontend
        npm run build
    fi

    rsync -avz --delete \
        -e "ssh" \
        ${SOURCE_DIR}/frontend/dist/ \
        ${SSH_USER}@${PROD_HOST}:${PROD_APP_DIR}/frontend/dist/

    # Fix ownership
    ssh ${SSH_USER}@${PROD_HOST} "sudo chown -R ${DAP_USER}:${DAP_USER} ${PROD_APP_DIR}/frontend"

    if [[ "$restart" == "true" ]]; then
        log_info "Restarting frontend..."
        ssh ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} pm2 restart dap-frontend"
    fi

    log_success "Frontend synced"
}

sync_config() {
    log_info "Syncing configuration..."
    
    rsync -avz \
        -e "ssh" \
        ${SOURCE_DIR}/deploy/config/ \
        ${SSH_USER}@${PROD_HOST}:/data/dap/config/

    # Fix ownership
    ssh ${SSH_USER}@${PROD_HOST} "sudo chown -R ${DAP_USER}:${DAP_USER} /data/dap/config"

    log_success "Config synced"
}

main() {
    local component="all"
    local build="false"
    local restart="true"

    while [[ $# -gt 0 ]]; do
        case $1 in
            backend|frontend|all|config)
                component=$1
                shift
                ;;
            --build)
                build="true"
                shift
                ;;
            --no-restart)
                restart="false"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    case $component in
        backend)
            sync_backend $build $restart
            ;;
        frontend)
            sync_frontend $build $restart
            ;;
        config)
            sync_config
            ;;
        all)
            sync_backend $build $restart
            sync_frontend $build $restart
            ;;
    esac
}

main "$@"
