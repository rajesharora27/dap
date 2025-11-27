#!/bin/bash
#===============================================================================
# DAP Production Helper Script
# Run from centos1 (dev) to manage centos2 (prod)
#===============================================================================

PROD_HOST="172.22.156.33"
SSH_USER="rajarora"
DAP_USER="dap"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

show_help() {
    cat << EOF
DAP Production Helper - Manage centos2 from centos1

Usage: $(basename $0) [command]

Commands:
  status        Show PM2 and system status
  logs          View PM2 logs (follow mode)
  logs-backend  View backend logs only
  logs-frontend View frontend logs only
  restart       Restart all PM2 processes
  stop          Stop all PM2 processes
  start         Start all PM2 processes
  
  ssh           Open SSH session to prod
  shell         Open shell as dap user
  
  db            Connect to PostgreSQL
  db-size       Show database size
  
  disk          Show disk usage
  memory        Show memory usage
  top           Show top processes
  
  nginx-logs    View Nginx error logs
  nginx-access  View Nginx access logs
  nginx-reload  Reload Nginx config
  
  fail2ban      Show Fail2Ban status
  firewall      Show firewall rules
  
  backup        Create database backup
  health        Run health checks

Examples:
  $(basename $0) status
  $(basename $0) logs
  $(basename $0) ssh

EOF
}

run_remote() {
    ssh ${SSH_USER}@${PROD_HOST} "$1" 2>/dev/null | grep -v "AUTHORIZED ACCESS\|This system is\|logged\.\|*****"
}

run_as_dap() {
    ssh ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} $1" 2>/dev/null | grep -v "AUTHORIZED ACCESS\|This system is\|logged\.\|*****"
}

case "${1:-help}" in
    status)
        echo -e "${CYAN}=== PM2 Status ===${NC}"
        run_as_dap "pm2 status"
        echo ""
        echo -e "${CYAN}=== System Resources ===${NC}"
        run_remote "free -h && echo '' && df -h /data"
        ;;
    logs)
        run_as_dap "pm2 logs --follow"
        ;;
    logs-backend)
        run_as_dap "pm2 logs dap-backend --follow"
        ;;
    logs-frontend)
        run_as_dap "pm2 logs dap-frontend --follow"
        ;;
    restart)
        echo -e "${BLUE}Restarting all processes...${NC}"
        run_as_dap "pm2 restart all"
        ;;
    stop)
        echo -e "${RED}Stopping all processes...${NC}"
        run_as_dap "pm2 stop all"
        ;;
    start)
        echo -e "${GREEN}Starting all processes...${NC}"
        run_as_dap "pm2 start all"
        ;;
    ssh)
        ssh -t ${SSH_USER}@${PROD_HOST}
        ;;
    shell)
        ssh -t ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} bash"
        ;;
    db)
        ssh -t ${SSH_USER}@${PROD_HOST} "sudo -u ${DAP_USER} psql -U dap -h localhost dap"
        ;;
    db-size)
        run_remote "sudo -u ${DAP_USER} psql -U dap -h localhost -d dap -c \"SELECT pg_size_pretty(pg_database_size('dap')) as size;\""
        ;;
    disk)
        run_remote "df -h"
        ;;
    memory)
        run_remote "free -h && echo '' && ps aux --sort=-%mem | head -10"
        ;;
    top)
        ssh -t ${SSH_USER}@${PROD_HOST} "htop"
        ;;
    nginx-logs)
        run_remote "sudo tail -f /var/log/nginx/error.log"
        ;;
    nginx-access)
        run_remote "sudo tail -f /var/log/nginx/access.log"
        ;;
    nginx-reload)
        run_remote "sudo nginx -t && sudo systemctl reload nginx"
        ;;
    fail2ban)
        run_remote "sudo fail2ban-client status && echo '' && sudo fail2ban-client status sshd"
        ;;
    firewall)
        run_remote "sudo firewall-cmd --zone=dap --list-all"
        ;;
    backup)
        echo -e "${BLUE}Creating database backup...${NC}"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        run_remote "sudo -u ${DAP_USER} bash -c 'pg_dump -U dap -h localhost dap | gzip > /data/dap/backups/manual/dap_${TIMESTAMP}.sql.gz'"
        echo -e "${GREEN}Backup created: /data/dap/backups/manual/dap_${TIMESTAMP}.sql.gz${NC}"
        ;;
    health)
        echo -e "${CYAN}=== Health Checks ===${NC}"
        echo -n "Backend (4000):      "
        ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/graphql" 2>/dev/null
        echo ""
        echo -n "Frontend (3000):     "
        ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" 2>/dev/null
        echo ""
        echo -n "Nginx Landing (/):   "
        ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost/" 2>/dev/null
        echo ""
        echo -n "Nginx DAP (/dap/):   "
        ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost/dap/" 2>/dev/null
        echo ""
        echo -n "GraphQL (/dap/graphql): "
        ssh ${SSH_USER}@${PROD_HOST} "curl -s -o /dev/null -w '%{http_code}' http://localhost/dap/graphql" 2>/dev/null
        echo ""
        echo ""
        echo -e "${CYAN}=== Service Status ===${NC}"
        echo -n "nginx: " && ssh ${SSH_USER}@${PROD_HOST} "systemctl is-active nginx" 2>/dev/null
        echo -n "postgresql-16: " && ssh ${SSH_USER}@${PROD_HOST} "systemctl is-active postgresql-16" 2>/dev/null
        echo -n "fail2ban: " && ssh ${SSH_USER}@${PROD_HOST} "systemctl is-active fail2ban" 2>/dev/null
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac

