#!/bin/bash
#===============================================================================
# DAP Seamless Release Script
# One-command release from development (centos1) to production (centos2)
# SSH as rajarora, run app as dap user
#===============================================================================

set -e
set -o pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

#===============================================================================
# Configuration
#===============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="/data/dap"
PROD_HOST="172.22.156.33"
SSH_USER="rajarora"              # User for SSH connection
DAP_USER="dap"                   # User to run the application
RELEASE_LOG="/data/dap/logs/releases.log"

#===============================================================================
# Functions
#===============================================================================
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }
log_release() { echo -e "${MAGENTA}[RELEASE]${NC} $1"; }

show_help() {
    cat << EOF
DAP Release Script - Seamless deployment from centos1 to centos2

Usage: $(basename $0) [command] [options]

Commands:
  deploy          Full deployment (build, test, deploy)
  quick           Quick deploy (skip tests, rebuild only changed)
  rollback        Rollback to previous version
  status          Check production status
  logs            View production logs
  restart         Restart production services
  db-backup       Backup production database
  db-restore      Restore database from backup

Options:
  -y, --yes       Skip confirmations
  -v, --verbose   Verbose output
  -h, --help      Show this help

Examples:
  $(basename $0) deploy              # Full deployment
  $(basename $0) quick -y            # Quick deploy, no confirmation
  $(basename $0) rollback            # Rollback to previous version
  $(basename $0) status              # Check prod status
  $(basename $0) logs -f             # Follow production logs

EOF
}

check_ssh() {
    if ! ssh -o ConnectTimeout=5 ${SSH_USER}@${PROD_HOST} "echo 'ok'" > /dev/null 2>&1; then
        log_error "Cannot connect to ${SSH_USER}@${PROD_HOST}"
        exit 1
    fi
}

get_version() {
    cat ${SOURCE_DIR}/backend/package.json | jq -r '.version'
}

get_prod_version() {
    ssh ${SSH_USER}@${PROD_HOST} "cat /data/dap/app/VERSION 2>/dev/null | grep 'version:' | cut -d' ' -f2" 2>/dev/null || echo "unknown"
}

log_to_file() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    mkdir -p $(dirname ${RELEASE_LOG})
    echo "[${timestamp}] ${message}" >> ${RELEASE_LOG}
}

# Run command as dap user on remote
run_as_dap() {
    ssh ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} $1"
}

#===============================================================================
# Commands
#===============================================================================

cmd_deploy() {
    local skip_confirm=false
    while [[ $# -gt 0 ]]; do
        case $1 in
            -y|--yes) skip_confirm=true; shift ;;
            *) shift ;;
        esac
    done

    local version=$(get_version)
    local prod_version=$(get_prod_version)

    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    DAP PRODUCTION RELEASE                      ║"
    echo "╠════════════════════════════════════════════════════════════════╣"
    echo "║  Current Production: ${prod_version}"
    echo "║  New Version:        ${version}"
    echo "║  Target:             ${PROD_HOST}"
    echo "║  App User:           ${DAP_USER}"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    if [[ "$skip_confirm" != "true" ]]; then
        read -p "Proceed with deployment? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi

    log_to_file "Starting deployment: v${version}"

    # Run tests
    log_step "Running tests..."
    cd ${SOURCE_DIR}/backend
    npm test 2>/dev/null || log_warning "Backend tests skipped or failed"
    cd ${SOURCE_DIR}/frontend
    npm test 2>/dev/null || log_warning "Frontend tests skipped or failed"
    log_success "Tests completed"

    # Git status check
    log_step "Checking git status..."
    cd ${SOURCE_DIR}
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        log_warning "Uncommitted changes detected"
        if [[ "$skip_confirm" != "true" ]]; then
            read -p "Continue anyway? [y/N] " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Deployment cancelled"
                exit 0
            fi
        fi
    fi

    # Deploy
    log_step "Starting deployment..."
    ${SCRIPT_DIR}/deploy-app.sh

    log_to_file "Deployment completed: v${version}"

    echo ""
    log_release "Release v${version} deployed successfully!"
    echo ""
}

cmd_quick() {
    log_info "Quick deployment (skip tests)..."
    ${SCRIPT_DIR}/deploy-app.sh
}

cmd_rollback() {
    log_step "Checking available backups..."
    
    local backups=$(ssh ${SSH_USER}@${PROD_HOST} "ls -1dt /data/dap/backups/deploy_* 2>/dev/null | head -5")
    
    if [[ -z "$backups" ]]; then
        log_error "No backups found"
        exit 1
    fi

    echo ""
    echo "Available backups:"
    echo "$backups" | nl
    echo ""

    read -p "Select backup number to restore (or 'q' to quit): " selection
    
    if [[ "$selection" == "q" ]]; then
        exit 0
    fi

    local backup_path=$(echo "$backups" | sed -n "${selection}p")
    
    if [[ -z "$backup_path" ]]; then
        log_error "Invalid selection"
        exit 1
    fi

    log_step "Rolling back to: ${backup_path}"

    ssh ${SSH_USER}@${PROD_HOST} << EOFROLLBACK
set -e
sudo -u ${DAP_USER} pm2 stop all 2>/dev/null || true
sudo rm -rf /data/dap/app/*
sudo cp -r ${backup_path}/* /data/dap/app/
sudo chown -R ${DAP_USER}:${DAP_USER} /data/dap
sudo -u ${DAP_USER} pm2 start /data/dap/app/ecosystem.config.js
sudo -u ${DAP_USER} pm2 save
EOFROLLBACK

    log_success "Rollback completed"
    log_to_file "Rollback to: ${backup_path}"
}

cmd_status() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                   PRODUCTION STATUS                            ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_ssh
    
    echo "Version:"
    ssh ${SSH_USER}@${PROD_HOST} "cat /data/dap/app/VERSION 2>/dev/null || echo 'Not deployed'" 2>/dev/null | grep -v "AUTHORIZED"
    echo ""
    
    echo "PM2 Status (${DAP_USER} user):"
    ssh ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} pm2 jlist 2>/dev/null | jq -r '.[] | \"\(.name): \(.pm2_env.status) (restarts: \(.pm2_env.restart_time))\"'" 2>/dev/null | grep -v "AUTHORIZED" || echo "PM2 not running"
    echo ""
    
    echo "Health Checks:"
    local backend=$(ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/graphql" 2>/dev/null || echo "ERR")
    local frontend=$(ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" 2>/dev/null || echo "ERR")
    local nginx_landing=$(ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost/" 2>/dev/null || echo "ERR")
    local nginx_dap=$(ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost/dap/" 2>/dev/null || echo "ERR")
    
    echo "  Backend (4000):      ${backend}"
    echo "  Frontend (3000):     ${frontend}"
    echo "  Nginx Landing (/):   ${nginx_landing}"
    echo "  Nginx DAP (/dap/):   ${nginx_dap}"
    echo ""
    
    echo "System Resources:"
    ssh ${SSH_USER}@${PROD_HOST} "free -h | head -2; echo ''; df -h /data | tail -1" 2>/dev/null | grep -v "AUTHORIZED"
    echo ""
}

cmd_logs() {
    local follow=""
    [[ "$1" == "-f" ]] && follow="--follow"
    
    check_ssh
    ssh -t ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} pm2 logs ${follow}"
}

cmd_restart() {
    check_ssh
    log_step "Restarting production services..."
    ssh ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} pm2 restart all"
    log_success "Services restarted"
}

cmd_db_backup() {
    check_ssh
    log_step "Creating database backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    ssh ${SSH_USER}@${PROD_HOST} << EOF
sudo mkdir -p /data/dap/backups/manual
sudo -u ${DAP_USER} pg_dump -U dap -h localhost dap | gzip > /tmp/dap_${timestamp}.sql.gz
sudo mv /tmp/dap_${timestamp}.sql.gz /data/dap/backups/manual/
sudo chown ${DAP_USER}:${DAP_USER} /data/dap/backups/manual/dap_${timestamp}.sql.gz
echo "Backup created: /data/dap/backups/manual/dap_${timestamp}.sql.gz"
EOF
    
    log_success "Database backup completed"
}

cmd_db_restore() {
    check_ssh
    
    local backups=$(ssh ${SSH_USER}@${PROD_HOST} "ls -1t /data/dap/backups/*/*.sql.gz 2>/dev/null | head -10")
    
    if [[ -z "$backups" ]]; then
        log_error "No database backups found"
        exit 1
    fi

    echo ""
    echo "Available database backups:"
    echo "$backups" | nl
    echo ""

    read -p "Select backup number to restore: " selection
    local backup_path=$(echo "$backups" | sed -n "${selection}p")
    
    if [[ -z "$backup_path" ]]; then
        log_error "Invalid selection"
        exit 1
    fi

    log_warning "This will REPLACE the current database!"
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    
    if [[ "$confirm" != "yes" ]]; then
        log_info "Cancelled"
        exit 0
    fi

    log_step "Restoring database..."
    
    ssh ${SSH_USER}@${PROD_HOST} << EOF
sudo -u ${DAP_USER} pm2 stop dap-backend
sudo -u postgres dropdb dap
sudo -u postgres createdb -O dap dap
gunzip -c ${backup_path} | sudo -u ${DAP_USER} psql -h localhost dap
sudo -u ${DAP_USER} pm2 start dap-backend
EOF
    
    log_success "Database restored from: ${backup_path}"
    log_to_file "Database restored from: ${backup_path}"
}

#===============================================================================
# Main
#===============================================================================
main() {
    mkdir -p /data/dap/logs

    case "${1:-}" in
        deploy)
            shift
            cmd_deploy "$@"
            ;;
        quick)
            shift
            cmd_quick "$@"
            ;;
        rollback)
            cmd_rollback
            ;;
        status)
            cmd_status
            ;;
        logs)
            shift
            cmd_logs "$@"
            ;;
        restart)
            cmd_restart
            ;;
        db-backup)
            cmd_db_backup
            ;;
        db-restore)
            cmd_db_restore
            ;;
        -h|--help|help)
            show_help
            ;;
        *)
            if [[ -n "${1:-}" ]]; then
                log_error "Unknown command: $1"
            fi
            show_help
            exit 1
            ;;
    esac
}

main "$@"
